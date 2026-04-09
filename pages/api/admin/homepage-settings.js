import dbConnect from "../../../lib/dbConnect";
import SiteSettings from "../../../models/SiteSettings";
import { requireAdminApi } from "../../../lib/auth";

const DEFAULT_SETTINGS = {
  heroIds: [],
  featuredIds: [],
  bulletinIds: [],
  editorPickIds: [],
  sponsorTitle: "Kurumsal Destek",
  sponsorText: "Bu alan yerel marka ve kurum tanıtımları için ayrılmıştır.",
  sponsorUrl: "#",
  sponsorImageUrl: "",
  galleryIds: [],
  videoIds: [],
  moduleOrder: [],
  topAdTitle: "Üst Reklam Alanı",
  topAdText: "Kurumsal tanıtım ve kampanya alanı.",
  topAdUrl: "#",
  sideAdTitle: "Yan Reklam Alanı",
  sideAdText: "Yerel marka ve mağaza duyuruları.",
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

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    const settings = await SiteSettings.findOne({ key: "homepage" }).lean();
    return res.status(200).json(settings?.homepage || DEFAULT_SETTINGS);
  }

  if (req.method === "PUT") {
    const homepage = {
      ...DEFAULT_SETTINGS,
      ...(req.body || {})
    };

    const settings = await SiteSettings.findOneAndUpdate(
      { key: "homepage" },
      { key: "homepage", homepage },
      { new: true, upsert: true }
    );

    return res.status(200).json({ success: true, homepage: settings.homepage });
  }

  return res.status(405).json({ message: "Method not allowed" });
}

export default requireAdminApi(handler);
