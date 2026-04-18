import { EDITORIAL_CATEGORIES, PUBLIC_CATEGORIES } from "./constants";

export const DEFAULT_MODULE_ORDER = [
  "editorialBand",
  "mediaSponsor",
  "dossiers",
  "editorPicks",
  "categoryLanes",
  "newsRiver"
];

export const PRESET_ORDERS = [
  {
    label: "Yerel Gündem",
    description: "Sürmanşet ve seçki blokları üstte, yerel akış daha yoğun.",
    order: ["categoryLanes", "editorialBand", "editorPicks", "dossiers", "newsRiver", "mediaSponsor"]
  },
  {
    label: "Hızlı Akış",
    description: "Manşet sonrası son gelişmeler ve öne çıkanlar önce gelir.",
    order: ["newsRiver", "categoryLanes", "editorialBand", "mediaSponsor", "dossiers", "editorPicks"]
  }
];

export const MODULE_LABELS = {
  editorialBand: "Sürmanşet",
  mediaSponsor: "Kurumsal Alan",
  dossiers: "Kategori Vitrini",
  editorPicks: "Gündem Seçkisi",
  categoryLanes: "Öne Çıkan",
  newsRiver: "Son Gelişmeler"
};

export const DEFAULT_SETTINGS = {
  heroIds: [],
  featuredIds: [],
  bulletinIds: [],
  editorPickIds: [],
  sponsorTitle: "Kurumsal Alan",
  sponsorText: "Bu alan yerel marka, kurum ve proje tanıtımları için ayrılmıştır.",
  sponsorUrl: "#",
  sponsorImageUrl: "",
  galleryIds: [],
  videoIds: [],
  moduleOrder: DEFAULT_MODULE_ORDER,
  topAdTitle: "Üst Bant Duyuru",
  topAdText: "Kampanya, kurum ve önemli duyuru alanı.",
  topAdUrl: "#",
  sideAdTitle: "Yan Bant Duyuru",
  sideAdText: "Yerel marka ve işletme duyuruları.",
  sideAdUrl: "#",
  leftAdTitle: "Sol Bant Reklam",
  leftAdText: "160x600 veya 300x600 görsel kullan.",
  leftAdUrl: "#",
  leftAdImageUrl: "",
  rightAdTitle: "Sağ Bant Reklam",
  rightAdText: "160x600 veya 300x600 görsel kullan.",
  rightAdUrl: "#",
  rightAdImageUrl: "",
  popupAdTitle: "Popup Reklam",
  popupAdText: "Açılış popup alanı için kısa kampanya metni.",
  popupAdUrl: "#",
  popupAdImageUrl: ""
};

function pickByIds(items, ids = [], takenIds = new Set(), limit = ids.length || Infinity) {
  const itemMap = new Map(items.map((item) => [String(item._id), item]));
  const selected = [];

  ids.forEach((id) => {
    const key = String(id);
    const match = itemMap.get(key);

    if (match && !takenIds.has(key) && selected.length < limit) {
      selected.push(match);
      takenIds.add(key);
    }
  });

  return selected;
}

function pickFromPool(items, takenIds = new Set(), limit = Infinity) {
  const selected = [];

  items.forEach((item) => {
    const key = String(item._id);

    if (selected.length >= limit || takenIds.has(key)) {
      return;
    }

    selected.push(item);
    takenIds.add(key);
  });

  return selected;
}

function buildHighlightGroups(items) {
  return Array.from(
    items.reduce((map, item) => {
      if (!map.has(item.category)) {
        map.set(item.category, []);
      }

      if (map.get(item.category).length < 2) {
        map.get(item.category).push(item);
      }

      return map;
    }, new Map())
  )
    .slice(0, 3)
    .map(([category, groupItems]) => ({ category, items: groupItems }));
}

function fillConfiguredSection(items, ids, takenIds, limit) {
  const selectedByIds = pickByIds(items, ids, takenIds, limit);
  const remaining = Math.max(0, limit - selectedByIds.length);
  return [...selectedByIds, ...pickFromPool(items, takenIds, remaining)].slice(0, limit);
}

function pickCategorySection(items, category, takenIds, limit) {
  return pickFromPool(
    items.filter((item) => item.category === category),
    takenIds,
    limit
  );
}

function fillEditorialSection(items, category, configuredIds, takenIds, limit) {
  const selectedByCategory = pickCategorySection(items, category, takenIds, limit);
  const remaining = Math.max(0, limit - selectedByCategory.length);

  if (!remaining) {
    return selectedByCategory;
  }

  const configuredFill = pickByIds(items, configuredIds, takenIds, remaining);
  const configuredRemaining = Math.max(0, remaining - configuredFill.length);

  return [
    ...selectedByCategory,
    ...configuredFill,
    ...pickFromPool(items, takenIds, configuredRemaining)
  ].slice(0, limit);
}

export function buildHomepageData(allPublishedDocs, rawHomepage = {}) {
  const homepage = {
    ...DEFAULT_SETTINGS,
    ...(rawHomepage || {})
  };

  const orderedDocs = [...allPublishedDocs];
  const publicDocs = orderedDocs.filter((item) => !EDITORIAL_CATEGORIES.includes(item.category));
  const takenIds = new Set();

  const heroItems = fillEditorialSection(orderedDocs, "Manşet", homepage.heroIds, takenIds, 7);
  const featuredList = fillEditorialSection(orderedDocs, "Öne Çıkan", homepage.featuredIds, takenIds, 6);
  const surmanset = fillEditorialSection(orderedDocs, "Sürmanşet", homepage.bulletinIds, takenIds, 8);

  const featuredDesk = publicDocs.filter((item) => item.isFeatured);
  const superHeadlines = [...pickFromPool(featuredDesk, takenIds, 8), ...pickFromPool(publicDocs, takenIds, 8)].slice(0, 8);
  const galleryItems = fillConfiguredSection(publicDocs, homepage.galleryIds, takenIds, 3);
  const videoItems = fillConfiguredSection(publicDocs, homepage.videoIds, takenIds, 3);
  const highlightGroups = buildHighlightGroups(
    pickFromPool(publicDocs.filter((item) => PUBLIC_CATEGORIES.includes(item.category)), takenIds, 9)
  );
  const newsRiver = pickFromPool(publicDocs, takenIds, 12);
  const mostRead = [...allPublishedDocs]
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 6);
  const latestBreaking = [...allPublishedDocs].slice(0, 6);
  const moduleOrder = homepage.moduleOrder.filter((key) => DEFAULT_MODULE_ORDER.includes(key));

  return {
    heroItems,
    featuredList,
    superHeadlines,
    surmanset,
    mansetOverflow: [],
    highlightGroups,
    newsRiver,
    galleryItems,
    videoItems,
    mostRead,
    latestBreaking,
    sponsor: {
      title: homepage.sponsorTitle,
      text: homepage.sponsorText,
      url: homepage.sponsorUrl,
      imageUrl: homepage.sponsorImageUrl
    },
    ads: {
      top: {
        title: homepage.topAdTitle,
        text: homepage.topAdText,
        url: homepage.topAdUrl
      },
      side: {
        title: homepage.sideAdTitle,
        text: homepage.sideAdText,
        url: homepage.sideAdUrl
      },
      left: {
        title: homepage.leftAdTitle,
        text: homepage.leftAdText,
        url: homepage.leftAdUrl,
        imageUrl: homepage.leftAdImageUrl
      },
      right: {
        title: homepage.rightAdTitle,
        text: homepage.rightAdText,
        url: homepage.rightAdUrl,
        imageUrl: homepage.rightAdImageUrl
      },
      popup: {
        title: homepage.popupAdTitle,
        text: homepage.popupAdText,
        url: homepage.popupAdUrl,
        imageUrl: homepage.popupAdImageUrl
      }
    },
    moduleOrder: moduleOrder.length ? moduleOrder : DEFAULT_MODULE_ORDER
  };
}
