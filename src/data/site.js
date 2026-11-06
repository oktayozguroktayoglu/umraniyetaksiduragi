// Tüm firma bilgileri tek yerde. Durağın adı kesinleşince sadece BRAND satırını değiştirin.
export const SITE_URL = 'https://umraniyetaksiduragi.com';
export const BRAND = 'Ümraniye Taksi Durağı';
export const PHONE_DISPLAY = '0507 220 09 52';
export const PHONE_TEL = '+905072200952';
export const WHATSAPP = '905072200952';
export const WA_TEXT = 'Merhaba, taksi çağırmak istiyorum. Adresim: ';
export const ADDRESS = {
  street: 'Tepeüstü Mahallesi',
  district: 'Ümraniye',
  city: 'İstanbul',
  country: 'TR',
  // Durak koordinatı kesinleşince güncelleyin (şimdilik Tepeüstü merkezi, CI verisinden gelir).
};

export const waLink = (extra = '') =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(WA_TEXT + extra)}`;

// Ümraniye'nin 37 mahallesi (İçişleri Bakanlığı mülki idare envanteri).
// osm: OpenStreetMap'teki ad (eşleştirme için), slug: URL
export const MAHALLELER = [
  ['Adem Yavuz', 'adem-yavuz'],
  ['Altınşehir', 'altinsehir'],
  ['Armağanevler', 'armaganevler'],
  ['Aşağı Dudullu', 'asagi-dudullu'],
  ['Atakent', 'atakent'],
  ['Atatürk', 'ataturk'],
  ['Çakmak', 'cakmak'],
  ['Çamlık', 'camlik'],
  ['Cemil Meriç', 'cemil-meric'],
  ['Dumlupınar', 'dumlupinar'],
  ['Elmalıkent', 'elmalikent'],
  ['Esenevler', 'esenevler'],
  ['Esenkent', 'esenkent'],
  ['Esenşehir', 'esensehir'],
  ['Fatih Sultan Mehmet', 'fatih-sultan-mehmet'],
  ['Finanskent', 'finanskent'],
  ['Hekimbaşı', 'hekimbasi'],
  ['Huzur', 'huzur'],
  ['Ihlamurkuyu', 'ihlamurkuyu'],
  ['İnkılap', 'inkilap'],
  ['İstiklal', 'istiklal'],
  ['Kazım Karabekir', 'kazim-karabekir'],
  ['Madenler', 'madenler'],
  ['Mehmet Akif', 'mehmet-akif'],
  ['Namık Kemal', 'namik-kemal'],
  ['Necip Fazıl', 'necip-fazil'],
  ['Parseller', 'parseller'],
  ['Saray', 'saray'],
  ['Şerifali', 'serifali'],
  ['Site', 'site'],
  ['Tantavi', 'tantavi'],
  ['Tatlısu', 'tatlisu'],
  ['Tepeüstü', 'tepeustu'],
  ['Topağacı', 'topagaci'],
  ['Yamanevler', 'yamanevler'],
  ['Yenişehir', 'yenisehir'],
  ['Yukarı Dudullu', 'yukari-dudullu'],
].map(([name, slug]) => ({ name, slug, url: `/mahalle/${slug}-taksi/` }));

// Hedef noktalar (sürüş süresi/mesafe hesaplanır)
export const DESTINATIONS = [
  { key: 'saw', name: 'Sabiha Gökçen Havalimanı', short: 'Sabiha Gökçen', lat: 40.8986, lon: 29.3092 },
  { key: 'ist', name: 'İstanbul Havalimanı', short: 'İstanbul Havalimanı', lat: 41.2622, lon: 28.7278 },
  { key: 'kadikoy', name: 'Kadıköy İskelesi', short: 'Kadıköy', lat: 40.9917, lon: 29.0233 },
  { key: 'uskudar', name: 'Üsküdar Meydanı', short: 'Üsküdar', lat: 41.0266, lon: 29.0154 },
  { key: 'taksim', name: 'Taksim Meydanı', short: 'Taksim', lat: 41.0369, lon: 28.985 },
  { key: 'harem', name: 'Harem Otogarı', short: 'Harem Otogarı', lat: 41.0047, lon: 29.0139 },
];

// Hizmetler — gerçekte verilmeyen bir hizmet varsa buradan silin.
export const SERVICES = [
  {
    slug: 'sabiha-gokcen-taksi',
    title: 'Sabiha Gökçen Havalimanı Taksi',
    short: 'Ümraniye’den Sabiha Gökçen’e ve havalimanından Ümraniye’ye taksi.',
    dest: 'saw',
    body: [
      'Uçuş saatinize göre önceden taksi ayarlayın; aracımız kapınıza gelsin, bavullarınızla uğraşmadan havalimanına ulaşın.',
      'Dönüşte de uçuş bilginizi WhatsApp’tan paylaşmanız yeterli. İniş saatinize göre sizi Ümraniye’deki adresinize getirelim.',
    ],
  },
  {
    slug: 'istanbul-havalimani-taksi',
    title: 'İstanbul Havalimanı Taksi',
    short: 'Ümraniye ile İstanbul Havalimanı arasında taksi.',
    dest: 'ist',
    body: [
      'İstanbul Havalimanı Ümraniye’ye uzak olduğu için yola çıkış saatini trafiğe göre birlikte planlıyoruz.',
      'Erken saat uçuşları için bir gün önceden aramanız, aracın zamanında kapınızda olmasını sağlar.',
    ],
  },
  {
    slug: 'hastane-taksi',
    title: 'Hastane Taksi',
    short: 'Hastane, muayene ve tahlil randevularınız için taksi.',
    body: [
      'Randevu saatinize göre taksi çağırın; hastane girişine kadar götürelim. Dönüş için de aramanız yeterli.',
      'Yaşlı ve hareket kısıtlı yolcularımızın araca binip inmesine yardımcı oluyoruz.',
    ],
  },
  {
    slug: 'sehirlerarasi-taksi',
    title: 'Şehirlerarası Taksi',
    short: 'Ümraniye’den İzmit, Sakarya, Bursa ve diğer şehirlere taksi.',
    body: [
      'Şehir dışına gidecekseniz güzergâhı ve fiyatı yola çıkmadan önce telefonda netleştiriyoruz.',
      'Aile ziyaretleri, iş seyahatleri ve acil durumlar için şehirlerarası yolculuk yapıyoruz.',
    ],
  },
];
