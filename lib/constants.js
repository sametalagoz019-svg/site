export const SITE_NAME = "Sivas Gündem";
export const SITE_DOMAIN = "sivasgundem58.com";
export const SITE_SLOGAN = "Sivas'tan 24 Saat Haber";

export const EDITORIAL_CATEGORIES = ["Manşet", "Öne Çıkan", "Sürmanşet"];
export const PUBLIC_CATEGORIES = ["Gündem", "Yerel", "Siyaset", "Spor", "Ekonomi", "Eğitim", "Sağlık", "Kültür"];
export const CATEGORIES = PUBLIC_CATEGORIES;
export const NEWS_CATEGORIES = [...EDITORIAL_CATEGORIES, ...PUBLIC_CATEGORIES];

export const CATEGORY_SLUGS = {
  gundem: "Gündem",
  yerel: "Yerel",
  siyaset: "Siyaset",
  spor: "Spor",
  ekonomi: "Ekonomi",
  egitim: "Eğitim",
  saglik: "Sağlık",
  kultur: "Kültür"
};

export const DEFAULT_NEWS_IMAGE = "https://commons.wikimedia.org/wiki/Special:FilePath/Sivas.jpg";

export const DEFAULT_COVER_IMAGE_GUIDE = {
  label: "Standart Haber",
  ratio: "16:9",
  size: "1600x900",
  note: "Standart haberlerde yatay kapak kullanın."
};

export const EDITORIAL_IMAGE_GUIDES = {
  "Manşet": {
    label: "Manşet",
    ratio: "16:9",
    size: "1600x900",
    note: "Yatay görsel kullanın; ana objeyi orta şeritte tutun."
  },
  "Öne Çıkan": {
    label: "Öne Çıkan",
    ratio: "4:3",
    size: "1200x900",
    note: "Orta vitrin için yataya yakın kırpım daha dengeli durur."
  },
  "Sürmanşet": {
    label: "Sürmanşet",
    ratio: "16:9",
    size: "1600x900",
    note: "Yataya yakın kapak kullanın; metin için alt bölgede boşluk bırakın."
  }
};

const SIVAS_SET = [
  "https://commons.wikimedia.org/wiki/Special:FilePath/Sivas%20(3356728680).jpg",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Sivas.jpg",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Kad%C4%B1burhaneddin_T%C3%BCrbesi_%28Sivas%29.jpg"
];

export const CATEGORY_IMAGE_SUGGESTIONS = {
  Manşet: SIVAS_SET,
  "Öne Çıkan": SIVAS_SET,
  Sürmanşet: SIVAS_SET,
  Gündem: SIVAS_SET,
  Yerel: [
    "https://commons.wikimedia.org/wiki/Special:FilePath/Sivas%20(3356728680).jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Kad%C4%B1burhaneddin_T%C3%BCrbesi_%28Sivas%29.jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Sivas.jpg"
  ],
  Siyaset: SIVAS_SET,
  Spor: [
    "https://commons.wikimedia.org/wiki/Special:FilePath/Football%20Field%20(2913864054).jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Sivas%20(3356728680).jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Sivas.jpg"
  ],
  Ekonomi: [
    "https://commons.wikimedia.org/wiki/Special:FilePath/Bazaar%20Street%20Scene%20(2977213213).jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Sivas%20(3356728680).jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Sivas.jpg"
  ],
  Eğitim: [
    "https://commons.wikimedia.org/wiki/Special:FilePath/University%20campus.jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Sivas%20(3356728680).jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Sivas.jpg"
  ],
  Sağlık: SIVAS_SET,
  Kültür: [
    "https://commons.wikimedia.org/wiki/Special:FilePath/Metropolitan%20Museum,%20hall.jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Kad%C4%B1burhaneddin_T%C3%BCrbesi_%28Sivas%29.jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Sivas.jpg"
  ]
};
