import dbConnect from "../../../lib/dbConnect";
import Comment from "../../../models/Comment";
import News from "../../../models/News";

function sanitizeText(value = "") {
  return String(value || "").trim();
}

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    const newsId = sanitizeText(req.query.newsId);

    if (!newsId) {
      return res.status(400).json({ message: "Haber kaydı bulunamadı." });
    }

    const comments = await Comment.find({ news: newsId, status: "approved" })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({ comments });
  }

  if (req.method === "POST") {
    const newsId = sanitizeText(req.body?.newsId);
    const name = sanitizeText(req.body?.name).slice(0, 80);
    const message = sanitizeText(req.body?.message).slice(0, 1000);

    if (!newsId || !name || !message) {
      return res.status(400).json({ message: "Ad, yorum ve haber bilgisi zorunludur." });
    }

    const news = await News.findById(newsId).lean();

    if (!news || news.status !== "published") {
      return res.status(404).json({ message: "Yorum yapılacak haber bulunamadı." });
    }

    const comment = await Comment.create({
      news: newsId,
      name,
      message,
      status: "approved"
    });

    return res.status(201).json({ comment });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ message: "Yöntem desteklenmiyor." });
}
