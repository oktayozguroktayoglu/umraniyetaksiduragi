// Mahalle verilerini OpenStreetMap (Overpass) ve OSRM'den çeker, src/data/mahalle-data.json'a yazar.
// GitHub Actions'ta çalışır (internet erişimi gerektirir). Veri © OpenStreetMap katkıcıları (ODbL).
import fs from 'node:fs';
import path from 'node:path';
import { MAHALLELER, DESTINATIONS } from '../src/data/site.js';

const OUT = path.resolve('src/data/mahalle-data.json');
const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
const UA = 'umraniyetaksiduragi.com site generator';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const trLower = (s) => s.toLocaleLowerCase('tr-TR');
const norm = (s) =>
  trLower(s)
    .replace(/\s+(mahallesi|mah\.?|mh\.?)$/u, '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i').replace(/[^a-z0-9]+/g, ' ').trim();

async function overpass(query) {
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    const url = OVERPASS[attempt % OVERPASS.length];
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': UA },
        body: 'data=' + encodeURIComponent(query),
        signal: AbortSignal.timeout(100000),
      });
      if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      console.warn('overpass hata, tekrar denenecek:', e.message);
      await sleep(4000 * (attempt + 1));
    }
  }
  throw lastErr;
}

const hav = (a, b) => {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};
const center = (el) => el.center || (el.lat != null ? { lat: el.lat, lon: el.lon } : null);
const uniq = (arr) => [...new Map(arr.map((x) => [trLower(x), x])).values()];

// Ad içinde Türkçe karakter düzeltmesi yapılmaz; OSM'deki adlar olduğu gibi kullanılır.
const clean = (s) => s.replace(/\s+/g, ' ').trim();

// İlişki üyelerinden (way geometrileri) dış halkaları birleştirir
function ringsOf(rel) {
  const segs = (rel.members || []).filter((m) => m.type === 'way' && m.role !== 'inner' && m.geometry).map((m) => m.geometry.map((g) => [g.lon, g.lat]));
  const rings = [];
  const key = (p) => p[0].toFixed(7) + ',' + p[1].toFixed(7);
  while (segs.length) {
    let ring = segs.shift();
    let guard = 0;
    while (key(ring[0]) !== key(ring[ring.length - 1]) && guard++ < 5000) {
      const end = key(ring[ring.length - 1]);
      const i = segs.findIndex((s) => key(s[0]) === end || key(s[s.length - 1]) === end);
      if (i < 0) break;
      let s = segs.splice(i, 1)[0];
      if (key(s[0]) !== end) s = s.slice().reverse();
      ring = ring.concat(s.slice(1));
    }
    if (ring.length > 3) rings.push(ring);
  }
  return rings;
}
function inRing(pt, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const inside = (c, rings) => rings.some((r) => inRing([c.lon, c.lat], r));
function centroid(rings) {
  const r = rings.reduce((a, b) => (b.length > a.length ? b : a), []);
  let A = 0, cx = 0, cy = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const f = r[j][0] * r[i][1] - r[i][0] * r[j][1];
    A += f; cx += (r[j][0] + r[i][0]) * f; cy += (r[j][1] + r[i][1]) * f;
  }
  return A ? { lat: +(cy / (3 * A)).toFixed(6), lon: +(cx / (3 * A)).toFixed(6) } : { lat: r[0][1], lon: r[0][0] };
}

async function main() {
  // 1) Mahalle sınırları
  let rels = [];
  for (const level of ['8', '9', '10']) {
    const q = `[out:json][timeout:120];
area["boundary"="administrative"]["name"="Ümraniye"]["admin_level"="6"]->.d;
rel(area.d)["boundary"="administrative"]["admin_level"="${level}"];
out geom;`;
    const j = await overpass(q);
    rels = j.elements.filter((e) => e.tags?.name);
    const hits = MAHALLELER.filter((m) => rels.some((r) => norm(r.tags.name) === norm(m.name))).length;
    console.log(new Date().toISOString(), `admin_level=${level}: ${rels.length} ilişki, ${hits} eşleşme`);
    if (hits >= 30) break;
  }

  const found = {};
  for (const m of MAHALLELER) {
    const r = rels.find((x) => norm(x.tags.name) === norm(m.name));
    if (r) found[m.slug] = { osmId: r.id, osmName: r.tags.name, rings: ringsOf(r) };
    else console.warn('OSM’de bulunamadı:', m.name);
  }
  if (Object.keys(found).length < 30) throw new Error('Yeterli mahalle eşleşmedi, veri yazılmadı.');

  // 2) Raylı sistem istasyonları (Ümraniye ve çevresi)
  const st = await overpass(`[out:json][timeout:90];
(nwr["railway"="station"](40.97,29.04,41.11,29.24);nwr["public_transport"="station"]["subway"="yes"](40.97,29.04,41.11,29.24););
out tags center;`);
  const stations = uniq(
    st.elements
      .filter((e) => e.tags?.name && center(e) && (/(subway|light_rail|monorail)/.test(e.tags.station || '') || e.tags.subway === 'yes' || e.tags.light_rail === 'yes'))
      .map((e) => JSON.stringify({ name: clean(e.tags.name), ...center(e) }))
  ).map((s) => JSON.parse(s));
  console.log('istasyon:', stations.length);

  // 3) Her mahalle için öne çıkan yerler
  const pick = (els, test, max = 6) =>
    uniq(els.filter((e) => e.tags?.name && test(e.tags)).map((e) => clean(e.tags.name))).slice(0, max);

  for (const d of Object.values(found)) d.center = centroid(d.rings);
  const all = await overpass(`[out:json][timeout:180];
area["boundary"="administrative"]["name"="Ümraniye"]["admin_level"="6"]->.d;
(
 nwr["amenity"="hospital"]["name"](area.d);
 nwr["healthcare"="hospital"]["name"](area.d);
 nwr["shop"="mall"]["name"](area.d);
 nwr["amenity"="university"]["name"](area.d);
 nwr["leisure"="park"]["name"](area.d);
 nwr["amenity"="place_of_worship"]["name"](area.d);
 nwr["amenity"="school"]["name"](area.d);
 nwr["tourism"="hotel"]["name"](area.d);
 nwr["amenity"~"^(townhall|courthouse|police|library|community_centre)$"]["name"](area.d);
 nwr["office"="government"]["name"](area.d);
 nwr["leisure"~"^(stadium|sports_centre)$"]["name"](area.d);
 way["highway"~"^(motorway|trunk|primary|secondary|tertiary)$"]["name"](area.d);
);
out tags center;`);
  console.log('toplam öğe:', all.elements.length);
  for (const [slug, d] of Object.entries(found)) {
    const els = all.elements.filter((x) => { const c = center(x); return c && inside(c, d.rings); });
    d.hospitals = pick(els, (t) => t.amenity === 'hospital' || t.healthcare === 'hospital');
    d.malls = pick(els, (t) => t.shop === 'mall');
    d.universities = pick(els, (t) => t.amenity === 'university', 4);
    d.parks = pick(els, (t) => t.leisure === 'park', 5);
    d.mosques = pick(els, (t) => t.amenity === 'place_of_worship', 4);
    d.schools = pick(els, (t) => t.amenity === 'school', 4);
    d.schoolCount = uniq(els.filter((e) => e.tags?.amenity === 'school' && e.tags.name).map((e) => e.tags.name)).length;
    d.hotels = pick(els, (t) => t.tourism === 'hotel', 4);
    d.publicPlaces = pick(els, (t) => /^(townhall|courthouse|police|library|community_centre)$/.test(t.amenity || '') || t.office === 'government', 5);
    d.sports = pick(els, (t) => /^(stadium|sports_centre)$/.test(t.leisure || ''), 3);
    d.roads = pick(els, (t) => !!t.highway, 8);
    d.stations = stations
      .map((s) => ({ name: s.name, km: +hav(d.center, s).toFixed(1) }))
      .sort((a, b) => a.km - b.km)
      .slice(0, 3);
    console.log(slug, `öğe ${els.length}, hastane ${d.hospitals.length}, avm ${d.malls.length}, cadde ${d.roads.length}`);
  }

  // 4) Komşu (en yakın) mahalleler
  for (const [slug, d] of Object.entries(found)) {
    d.neighbors = Object.entries(found)
      .filter(([s]) => s !== slug)
      .map(([s, o]) => [s, hav(d.center, o.center)])
      .sort((a, b) => a[1] - b[1])
      .slice(0, 5)
      .map(([s]) => s);
  }

  // 5) Sürüş mesafesi/süresi (OSRM, trafiksiz tahmini)
  const slugs = Object.keys(found);
  const durak = found.tepeustu?.center;
  const dests = [...DESTINATIONS, ...(durak ? [{ key: 'durak', ...durak }] : [])];
  const coords = [...slugs.map((s) => found[s].center), ...dests].map((c) => `${c.lon.toFixed(5)},${c.lat.toFixed(5)}`).join(';');
  const src = slugs.map((_, i) => i).join(';');
  const dst = dests.map((_, i) => slugs.length + i).join(';');
  const url = `https://router.project-osrm.org/table/v1/driving/${coords}?sources=${src}&destinations=${dst}&annotations=duration,distance`;
  let table;
  for (let a = 0; a < 4 && !table; a++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(60000) });
      const j = await r.json();
      if (j.code === 'Ok') table = j;
      else throw new Error(j.code);
    } catch (e) {
      console.warn('osrm hata:', e.message);
      await sleep(5000);
    }
  }
  if (table) {
    slugs.forEach((s, i) => {
      found[s].drive = {};
      dests.forEach((d, k) => {
        const sec = table.durations[i][k], m = table.distances[i][k];
        if (sec != null) found[s].drive[d.key] = { km: Math.round(m / 100) / 10, min: Math.max(1, Math.round(sec / 60)) };
      });
    });
  }

  for (const d of Object.values(found)) delete d.rings;
  const out = { generated: new Date().toISOString().slice(0, 10), source: 'OpenStreetMap katkıcıları (ODbL), OSRM', mahalle: found };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log('yazıldı:', OUT, Object.keys(found).length, 'mahalle');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
