import dbConnect from "../../../lib/dbConnect";
import News from "../../../models/News";
import { requireAdminApi } from "../../../lib/auth";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await dbConnect();

  const { action, ids } = req.body || {};

  if (!Array.isArray(ids) || !ids.length) {
    return res.status(400).json({ message: "İşlem için haber seçilmedi." });
  }

  if (!["publish", "draft", "delete"].includes(action)) {
    return res.status(400).json({ message: "Geçersiz işlem." });
  }

  if (action === "delete") {
    await Promise.all(ids.map((id) => News.findByIdAndDelete(id)));
    return res.status(200).json({ success: true, message: "Seçilen haberler silindi." });
  }

  const nextStatus = action === "publish" ? "published" : "draft";

  await Promise.all(
    ids.map(async (id) => {
      const current = await News.findById(id);

      if (!current) {
        return null;
      }

      return News.findByIdAndUpdate(
        id,
        {
          status: nextStatus,
          publishedAt: nextStatus === "published" ? current.publishedAt || new Date() : null
        },
        { new: true }
      );
    })
  );

  return res.status(200).json({
    success: true,
    message:
      nextStatus === "published"
        ? "Seçilen haberler yayına alındı."
        : "Seçilen haberler taslağa çekildi."
  });
}

export default requireAdminApi(handler);
