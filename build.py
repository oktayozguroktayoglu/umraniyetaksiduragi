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
    wa = (f'<a class="btn wa" href="https://wa.me/{WHATSAPP}">WhatsApp\'tan yaz</a>'
          if WHATSAPP else "")
    return f'<a class="btn call" href="tel:{PHONE_TEL}">Ara: {PHONE_DISPLAY}</a>{wa}'


def page(path, title, desc, h1, lead, body, area, root="./"):
    url = f"{SITE}/{path}"
    e = html.escape
    home = "" if root == "./" else root
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
<link rel="stylesheet" href="{root}style.css">
<script type="application/ld+json">{schema(url, area)}</script>
</head>
<body>
<header class="top">
  <a class="logo" href="{root}"><span class="sign">TAKSİ</span>{NAME}</a>
  <nav>
    <a href="#mahalleler">Mahalleler</a>
    <a href="{home}#havalimani">Havalimanı</a>
    <a href="#iletisim">İletişim</a>
  </nav>
  <a class="tel" href="tel:{PHONE_TEL}">{PHONE_DISPLAY}</a>
</header>
<main>
<section class="hero">
  <h1>{e(h1)}</h1>
  <p class="lead">{lead}</p>
  <div class="cta">{buttons()}</div>
</section>
{body}
</main>
<footer id="iletisim">
  <p><strong>{NAME}</strong></p>
  <p>{e(ADDRESS)}, {DISTRICT} / {CITY}</p>
  <p>Telefon: <a href="tel:{PHONE_TEL}">{PHONE_DISPLAY}</a> · Gece gündüz açığız</p>
</footer>
<a class="sticky" href="tel:{PHONE_TEL}">Taksi çağır</a>
</body>
</html>
"""


def mahalle_links(root, skip=None):
    items = "".join(
        f'<li><a href="{root}mahalle/{slug(m)}/">{m}</a></li>'
        for m in MAHALLELER if m != skip)
    return f'<ul class="grid">{items}</ul>'


def build():
    files = {}

    files["index.html"] = page(
        "",
        f"Ümraniye Taksi Durağı | {PHONE_DISPLAY}",
        f"Ümraniye'de taksi lazımsa arayın: {PHONE_DISPLAY}. Buyaka AVM yanındaki "
        f"durağımızdan bütün mahallelere ve havalimanlarına gidiyoruz.",
        NAME,
        "Gece gündüz açığız. Arayın, size en yakın arabayı gönderelim.",
        f"""
<section>
  <h2>Durağımız</h2>
  <p>Buyaka AVM'deki durağımız, AVM'deki yenileme süresince hemen yanındaki
  konteynerde. Ümraniye'nin bütün mahallelerine gidiyoruz; Ataşehir, Üsküdar,
  Çekmeköy ve Sancaktepe'den arayanlara da araba gönderiyoruz.</p>
  <p>Ücret taksimetreyle. Telefonda adresinizi ya da yakınınızdaki bir yeri
  söylemeniz yeterli.</p>
</section>
<section id="havalimani">
  <h2>Havalimanına gidiş</h2>
  <p>Sabiha Gökçen'e de İstanbul Havalimanı'na da gidiyoruz. Sabah erken
  uçuşunuz varsa akşamdan arayın, arabayı ayarlayalım. Bagajınız çoksa
  telefonda söyleyin.</p>
</section>
<section id="mahalleler">
  <h2>Gittiğimiz mahalleler</h2>
  {mahalle_links("./")}
</section>
""",
        {"@type": "City", "name": f"{DISTRICT}, {CITY}"},
    )

    for m in MAHALLELER:
        s = slug(m)
        files[f"mahalle/{s}/index.html"] = page(
            f"mahalle/{s}/",
            f"{m} Taksi | {NAME}",
            f"{m} Mahallesi'nde taksi lazımsa arayın: {PHONE_DISPLAY}. "
            f"Ümraniye'de gece gündüz açık taksi durağı.",
            f"{m} Taksi",
            f"{m} Mahallesi'ne de geliyoruz. Arayın, yola çıkalım.",
            f"""
<section>
  <p>{m} Mahallesi'nden taksi lazımsa {PHONE_DISPLAY} numarasını arayın. Sokağınızı ya da
  yakınınızdaki bir yeri söyleyin, en yakın arabamızı gönderelim.</p>
  <p>Durağımız Buyaka AVM'nin yanında. Ücret taksimetreyle; havalimanına da
  gidiyoruz.</p>
</section>
<section id="mahalleler">
  <h2>Diğer mahalleler</h2>
  {mahalle_links("../../", skip=m)}
</section>
""",
            {"@type": "Place", "name": f"{m} Mahallesi, {DISTRICT}, {CITY}"},
            root="../../",
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
