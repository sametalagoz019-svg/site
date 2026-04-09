import SiteSettings from "../models/SiteSettings";

const DEFAULT_SETTINGS = {
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
  moduleOrder: [],
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

const SLOT_MAP = {
  manset: { key: "heroIds", limit: 12 },
  one_cikan: { key: "featuredIds", limit: 6 },
  surmanset: { key: "bulletinIds", limit: 8 },
  secki: { key: "editorPickIds", limit: 8 }
};

export function inferHomepageSlot(homepage, newsId) {
  const key = String(newsId);
  if (!homepage) return "none";

  if ((homepage.heroIds || []).includes(key)) return "manset";
  if ((homepage.featuredIds || []).includes(key)) return "one_cikan";
  if ((homepage.bulletinIds || []).includes(key)) return "surmanset";
  if ((homepage.editorPickIds || []).includes(key)) return "secki";
  return "none";
}

export async function applyHomepageSlot(newsId, slot) {
  const key = String(newsId);
  const settingsDoc = await SiteSettings.findOne({ key: "homepage" });
  const homepage = {
    ...DEFAULT_SETTINGS,
    ...(settingsDoc?.homepage || {})
  };

  homepage.heroIds = (homepage.heroIds || []).filter((id) => String(id) !== key);
  homepage.featuredIds = (homepage.featuredIds || []).filter((id) => String(id) !== key);
  homepage.bulletinIds = (homepage.bulletinIds || []).filter((id) => String(id) !== key);
  homepage.editorPickIds = (homepage.editorPickIds || []).filter((id) => String(id) !== key);

  const target = SLOT_MAP[slot];
  if (target) {
    homepage[target.key] = [key, ...(homepage[target.key] || [])].slice(0, target.limit);
  }

  await SiteSettings.findOneAndUpdate(
    { key: "homepage" },
    { key: "homepage", homepage },
    { new: true, upsert: true }
  );

  return homepage;
}
