#!/usr/bin/env python3
"""umraniyetaksiduragi.com statik site üreticisi.

Ayarları aşağıda değiştirip çalıştırın:  python3 build.py
Çıktı aynı klasöre yazılır; klasörü olduğu gibi GitHub Pages'e yükleyin.
"""
import datetime
import html
import pathlib

# ---- AYARLAR (sadece burayı değiştirin) -------------------------------------
SITE = "https://umraniyetaksiduragi.com"
DOMAIN = "umraniyetaksiduragi.com"
NAME = "Ümraniye Taksi Durağı"
PHONE_DISPLAY = "0216 000 00 00"   # TODO: gerçek numara
PHONE_TEL = "+902160000000"        # TODO: gerçek numara, boşluksuz
WHATSAPP = ""                      # örn. "905320000000"; boş bırakılırsa buton çıkmaz
ADDRESS = "Buyaka AVM yanı, Fatih Sultan Mehmet Mah."
DISTRICT = "Ümraniye"
CITY = "İstanbul"

MAHALLELER = [
    "Adem Yavuz", "Altınşehir", "Armağanevler", "Aşağı Dudullu", "Atakent",
    "Atatürk", "Cemil Meriç", "Çakmak", "Çamlık", "Dumlupınar", "Elmalıkent",
    "Esenevler", "Esenkent", "Esenşehir", "Fatih Sultan Mehmet", "Finanskent",
    "Hekimbaşı", "Huzur", "Ihlamurkuyu", "İnkılap", "İstiklal",
    "Kazım Karabekir", "Madenler", "Mehmet Akif", "Namık Kemal", "Necip Fazıl",
    "Parseller", "Saray", "Site", "Şerifali", "Tantavi", "Tatlısu", "Tepeüstü",
    "Topağacı", "Yamanevler", "Yenişehir", "Yukarı Dudullu",
]
# -----------------------------------------------------------------------------

OUT = pathlib.Path(__file__).parent
TODAY = datetime.date.today().isoformat()
TR = str.maketrans("çğıöşüÇĞİÖŞÜ", "cgiosuCGIOSU")


def slug(s):
    return "-".join(s.translate(TR).lower().split())


def schema(page_url, area):
    import json
    data = {
        "@context": "https://schema.org",
        "@type": "TaxiService",
        "name": NAME,
        "url": page_url,
        "telephone": PHONE_TEL,
        "provider": {
            "@type": "LocalBusiness",
            "name": NAME,
            "telephone": PHONE_TEL,
            "openingHours": "Mo-Su 00:00-23:59",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": ADDRESS,
                "addressLocality": DISTRICT,
                "addressRegion": CITY,
                "addressCountry": "TR",
            },
        },
        "areaServed": area,
    }
    return json.dumps(data, ensure_ascii=False)


def buttons():
    wa = (f'<a class="btn wa" href="https://wa.me/{WHATSAPP}">WhatsApp</a>'
          if WHATSAPP else "")
    return f'<a class="btn call" href="tel:{PHONE_TEL}">📞 Hemen Ara: {PHONE_DISPLAY}</a>{wa}'


def page(path, title, desc, h1, body, area):
    url = f"{SITE}/{path}"
    e = html.escape
    return f"""<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:type" content="website">
<meta property="og:locale" content="tr_TR">
<link rel="stylesheet" href="/style.css">
<script type="application/ld+json">{schema(url, area)}</script>
</head>
<body>
<header class="top">
  <a class="logo" href="/">🚕 {NAME}</a>
  <a class="tel" href="tel:{PHONE_TEL}">{PHONE_DISPLAY}</a>
</header>
<main>
<section class="hero">
  <h1>{e(h1)}</h1>
  <p class="lead">7/24 taksi hizmeti · Ortalama birkaç dakikada kapınızda</p>
  <div class="cta">{buttons()}</div>
</section>
{body}
</main>
<footer>
  <p><strong>{NAME}</strong> · {e(ADDRESS)}, {DISTRICT} / {CITY}</p>
  <p><a href="tel:{PHONE_TEL}">{PHONE_DISPLAY}</a> · 7 gün 24 saat</p>
</footer>
<a class="sticky" href="tel:{PHONE_TEL}">📞 Taksi Çağır</a>
</body>
</html>
"""


def mahalle_links(skip=None):
    items = "".join(
        f'<li><a href="/mahalle/{slug(m)}/">{m} Taksi</a></li>'
        for m in MAHALLELER if m != skip)
    return f'<ul class="grid">{items}</ul>'


FEATURES = """
<section>
  <h2>Neden bizi aramalısınız?</h2>
  <ul class="features">
    <li><strong>7/24 açık</strong> – Gece, gündüz, bayram demeden.</li>
    <li><strong>Hızlı yönlendirme</strong> – Size en yakın aracı gönderiyoruz.</li>
    <li><strong>Taksimetre ile</strong> – Pazarlık yok, sürpriz ücret yok.</li>
    <li><strong>Havalimanı transferi</strong> – Sabiha Gökçen ve İstanbul Havalimanı.</li>
    <li><strong>Hastane, okul, iş</strong> – Ümraniye Eğitim ve Araştırma Hastanesi dahil her yere.</li>
  </ul>
</section>
"""


def build():
    files = {}

    files["index.html"] = page(
        "",
        f"Ümraniye Taksi – 7/24 Taksi Durağı | {PHONE_DISPLAY}",
        f"Ümraniye'nin tüm mahallelerine 7/24 taksi. Buyaka çevresi ve tüm Ümraniye'den "
        f"hızlı taksi çağırmak için hemen arayın: {PHONE_DISPLAY}.",
        "Ümraniye Taksi Durağı – 7/24 Taksi Çağır",
        f"""
<section>
  <h2>Ümraniye'nin her mahallesine taksi</h2>
  <p>{NAME}, {ADDRESS} konumunda hizmet veriyor. Ümraniye'nin {len(MAHALLELER)}
  mahallesinin tamamına, Ataşehir, Üsküdar, Çekmeköy ve Sancaktepe'ye taksi
  gönderiyoruz. Tek yapmanız gereken aramak ve adresinizi söylemek.</p>
</section>
{FEATURES}
<section>
  <h2>Hizmet verdiğimiz mahalleler</h2>
  {mahalle_links()}
</section>
""",
        {"@type": "City", "name": f"{DISTRICT}, {CITY}"},
    )

    for m in MAHALLELER:
        s = slug(m)
        files[f"mahalle/{s}/index.html"] = page(
            f"mahalle/{s}/",
            f"{m} Taksi – {m} Mahallesi Taksi Durağı | {DISTRICT}",
            f"{m} Mahallesi, {DISTRICT} için 7/24 taksi. Bulunduğunuz adrese en yakın "
            f"aracı gönderiyoruz. Hemen arayın: {PHONE_DISPLAY}.",
            f"{m} Taksi – {DISTRICT}",
            f"""
<section>
  <h2>{m} Mahallesi'nde taksi mi lazım?</h2>
  <p>{DISTRICT} {m} Mahallesi'nden taksi çağırmak için {PHONE_DISPLAY} numarasını
  arayın. Telefonda sokak adınızı veya bulunduğunuz yeri söylemeniz yeterli;
  {m} ve çevresindeki en yakın taksimizi hemen yönlendirelim.</p>
  <p>{m} Mahallesi'nden Ümraniye merkez, metro istasyonları, hastaneler,
  AVM'ler ve havalimanlarına gece gündüz ulaşım sağlıyoruz.</p>
</section>
{FEATURES}
<section>
  <h2>Ümraniye'deki diğer mahalleler</h2>
  {mahalle_links(skip=m)}
</section>
""",
            {"@type": "Place", "name": f"{m} Mahallesi, {DISTRICT}, {CITY}"},
        )

    urls = [""] + [f"mahalle/{slug(m)}/" for m in MAHALLELER]
    files["sitemap.xml"] = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "".join(f"  <url><loc>{SITE}/{u}</loc><lastmod>{TODAY}</lastmod></url>\n"
                  for u in urls)
        + "</urlset>\n")
    files["robots.txt"] = f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n"
    files["CNAME"] = DOMAIN + "\n"

    for name, content in files.items():
        p = OUT / name
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding="utf-8")
    print(f"{len(files)} dosya yazıldı.")


if __name__ == "__main__":
    build()
