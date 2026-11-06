// Mahalle sayfalarının içeriği: OpenStreetMap/OSRM verisinden (src/data/mahalle-data.json) üretilir.
import { MAHALLELER, DESTINATIONS, BRAND, PHONE_DISPLAY } from '../data/site.js';
import raw from '../data/mahalle-data.json';

export const DATA = raw;
export const bySlug = Object.fromEntries(MAHALLELER.map((m) => [m.slug, m]));
export const dataOf = (slug) => raw.mahalle?.[slug] || {};

// Türkçe ekler: özel adların sonuna gelen ekler ünlü/ünsüz uyumu ve "X Mahallesi" tamlamasına göre değişir.
// Hata riskini azaltmak için ekler hep "X Mahallesi" kalıbına eklenir (Mahallesi'nde/'nden/'ne).
export const mah = (n) => `${n} Mahallesi`;
export const de = (n) => `${n} Mahallesi’nde`;
export const den = (n) => `${n} Mahallesi’nden`;
export const e = (n) => `${n} Mahallesi’ne`;
export const nin = (n) => `${n} Mahallesi’nin`;

const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const pickV = (slug, k, arr) => arr[(hash(slug) + k) % arr.length];
export const list = (arr) =>
  arr.length <= 1 ? arr.join('') : `${arr.slice(0, -1).join(', ')} ve ${arr[arr.length - 1]}`;

export function contentFor(slug) {
  const m = bySlug[slug];
  const d = dataOf(slug);
  const n = m.name;
  const M = mah(n);
  const drive = d.drive || {};
  const out = { paragraphs: [], landmarks: [], faq: [] };

  // Giriş
  const durakMin = drive.durak?.min;
  const nearDurak =
    slug === 'tepeustu'
      ? `Durağımız zaten ${de('Tepeüstü')}; mahalle içindeki çağrılara en kısa sürede araç çıkarıyoruz.`
      : durakMin
        ? `${de('Tepeüstü')}ki durağımızdan ${e(n)} araçla trafiksiz yaklaşık ${durakMin} dakikada ulaşılıyor.`
        : `Durağımız ${de('Tepeüstü')}, ${e(n)} yakın bir konumda.`;
  out.paragraphs.push(
    pickV(slug, 0, [
      `${de(n)} taksiye ihtiyacınız olduğunda ${PHONE_DISPLAY} numaralı hattımızı aramanız yeterli. ${nearDurak}`,
      `${M} için taksi mi arıyorsunuz? ${BRAND} olarak ${n} sokaklarına, sitelerine ve iş yerlerine taksi gönderiyoruz. ${nearDurak}`,
      `${n} sınırları içindeki her adrese taksi gönderiyoruz. Arayın ya da WhatsApp’tan konumunuzu paylaşın, aracı adresinize yönlendirelim. ${nearDurak}`,
    ])
  );

  // Öne çıkan yerler
  const groups = [
    ['Hastaneler', d.hospitals],
    ['Alışveriş merkezleri', d.malls],
    ['Üniversiteler', d.universities],
    ['Kamu ve sosyal tesisler', d.publicPlaces],
    ['Spor tesisleri', d.sports],
    ['Parklar', d.parks],
    ['Oteller', d.hotels],
    ['Camiler', d.mosques],
  ].filter(([, v]) => v && v.length);
  out.landmarks = groups;
  const highlights = [...(d.hospitals || []), ...(d.malls || []), ...(d.universities || []), ...(d.publicPlaces || [])].slice(0, 4);
  if (highlights.length) {
    out.paragraphs.push(
      pickV(slug, 1, [
        `${n} sınırlarında ${list(highlights)} gibi noktalar bulunuyor. Bu adreslere ya da mahallenin herhangi bir sokağına taksi çağırabilirsiniz.`,
        `Mahalledeki ${list(highlights)} çevresinden yolcu alıyoruz; binanın girişini veya buluşma noktasını söylemeniz yeterli.`,
        `${list(highlights)} ${n} içinde yer alıyor. Randevunuza, alışverişinize ya da işinize giderken taksi için bizi arayın.`,
      ])
    );
  } else if (d.parks?.length || d.mosques?.length) {
    const p = [...(d.parks || []), ...(d.mosques || [])].slice(0, 3);
    out.paragraphs.push(`${n} içinde ${list(p)} gibi bilinen noktalar var. Adresinizi tarif ederken bu noktalardan birini söylemeniz aracın sizi daha hızlı bulmasını sağlar.`);
  }

  // Caddeler
  if (d.roads?.length) {
    out.paragraphs.push(
      pickV(slug, 2, [
        `Mahallenin başlıca yolları ${list(d.roads.slice(0, 5))}. Ana caddeye yakın bir noktada bekliyorsanız bunu belirtmeniz aracın size ulaşmasını hızlandırır.`,
        `${n} trafiği ağırlıklı olarak ${list(d.roads.slice(0, 4))} üzerinden akıyor; şoförlerimiz bu güzergâhları iyi biliyor.`,
        `${list(d.roads.slice(0, 4))} ${nin(n)} ana bağlantı yolları arasında. Bu yollara cephesi olan sitelerden ve iş yerlerinden de araç çağırabilirsiniz.`,
      ])
    );
  }

  // Raylı sistem
  if (d.stations?.length) {
    const s = d.stations[0];
    const s2 = d.stations[1];
    out.paragraphs.push(
      `${nin(n)} en yakın raylı sistem istasyonu ${s.name} (kuş uçuşu yaklaşık ${s.km.toString().replace('.', ',')} km)` +
        (s2 ? `; ${s2.name} istasyonu da ${s2.km.toString().replace('.', ',')} km uzaklıkta.` : '.') +
        ` Metrodan indiğinizde evinize ya da iş yerinize geçmek için istasyon çıkışına taksi isteyebilirsiniz.`
    );
  }

  // Mesafeler
  out.drives = DESTINATIONS.map((x) => ({ ...x, ...(drive[x.key] || {}) })).filter((x) => x.min);

  // SSS
  const saw = drive.saw, ist = drive.ist;
  if (saw)
    out.faq.push([
      `${den(n)} Sabiha Gökçen Havalimanı’na taksiyle ne kadar sürer?`,
      `Yol yaklaşık ${fmtKm(saw.km)} km, trafiksiz sürüş süresi yaklaşık ${saw.min} dakikadır. Sabah ve akşam saatlerinde süre uzayabileceği için uçuşunuzdan en az 2,5-3 saat önce yola çıkmanızı öneririz.`,
    ]);
  if (ist)
    out.faq.push([
      `${den(n)} İstanbul Havalimanı’na taksi kaç km?`,
      `Güzergâha göre yaklaşık ${fmtKm(ist.km)} km ve trafiksiz yaklaşık ${ist.min} dakika. Erken saatli uçuşlar için taksinizi bir gün önceden ayarlayabilirsiniz.`,
    ]);
  out.faq.push([
    `${de(n)} taksi nasıl çağırırım?`,
    `${PHONE_DISPLAY} numarasını arayın ya da WhatsApp’tan konumunuzu gönderin. Adresinizi, varsa site veya blok adını ve kaç kişi olduğunuzu söylemeniz yeterli.`,
  ]);
  out.faq.push([
    `${M} için taksi ücreti nasıl hesaplanır?`,
    `İstanbul’da taksiler taksimetreyle çalışır; ücret İBB’nin belirlediği güncel tarifeye göre hesaplanır. Havalimanı ve şehirlerarası yolculuklarda tahmini tutarı yola çıkmadan önce sorabilirsiniz.`,
  ]);
  if (d.stations?.length)
    out.faq.push([
      `${d.stations[0].name} metro istasyonundan ${e(n)} taksi bulabilir miyim?`,
      `Evet. İstasyona varmadan önce arayıp hangi çıkışta olacağınızı söylerseniz aracı oraya yönlendiririz.`,
    ]);

  out.neighbors = (d.neighbors || []).map((s) => bySlug[s]).filter(Boolean);
  out.hasData = !!d.osmId;
  return out;
}

export const fmtKm = (km) => String(km).replace('.', ',');

export function metaFor(slug) {
  const m = bySlug[slug];
  const d = dataOf(slug);
  const saw = d.drive?.saw;
  const title = `${m.name} Taksi | Ümraniye ${m.name} Mahallesi Taksi Durağı`;
  const desc =
    `${m.name} Mahallesi’ne taksi çağırın: ${PHONE_DISPLAY}. WhatsApp’tan konum gönderin, araç kapınıza gelsin.` +
    (saw ? ` Sabiha Gökçen’e yaklaşık ${saw.min} dk.` : '');
  return { title, desc };
}
