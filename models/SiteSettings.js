import mongoose from "mongoose";
import { createLocalModel, useLocalDb } from "../lib/localDb";

const SiteSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    homepage: {
      heroIds: { type: [String], default: [] },
      featuredIds: { type: [String], default: [] },
      bulletinIds: { type: [String], default: [] },
      editorPickIds: { type: [String], default: [] },
      sponsorTitle: { type: String, default: "Kurumsal Destek" },
      sponsorText: { type: String, default: "Bu alan yerel marka ve kurum tanıtımları için ayrılmıştır." },
      sponsorUrl: { type: String, default: "#" },
      sponsorImageUrl: { type: String, default: "" },
      galleryIds: { type: [String], default: [] },
      videoIds: { type: [String], default: [] },
      moduleOrder: { type: [String], default: [] },
      topAdTitle: { type: String, default: "Üst Reklam Alanı" },
      topAdText: { type: String, default: "Kurumsal tanıtım ve kampanya alanı." },
      topAdUrl: { type: String, default: "#" },
      sideAdTitle: { type: String, default: "Yan Reklam Alanı" },
      sideAdText: { type: String, default: "Yerel marka ve mağaza duyuruları." },
      sideAdUrl: { type: String, default: "#" },
      leftAdTitle: { type: String, default: "Sol Bant Reklam" },
      leftAdText: { type: String, default: "160x600 veya 300x600 görsel kullan." },
      leftAdUrl: { type: String, default: "#" },
      leftAdImageUrl: { type: String, default: "" },
      rightAdTitle: { type: String, default: "Sağ Bant Reklam" },
      rightAdText: { type: String, default: "160x600 veya 300x600 görsel kullan." },
      rightAdUrl: { type: String, default: "#" },
      rightAdImageUrl: { type: String, default: "" },
      popupAdTitle: { type: String, default: "Popup Reklam" },
      popupAdText: { type: String, default: "Açılış popup alanı için kısa kampanya metni." },
      popupAdUrl: { type: String, default: "#" },
      popupAdImageUrl: { type: String, default: "" }
    }
  },
  {
    timestamps: true
  }
);

export default useLocalDb()
  ? createLocalModel("SiteSettings")
  : mongoose.models.SiteSettings || mongoose.model("SiteSettings", SiteSettingsSchema);
