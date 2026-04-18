import { trackArticleView } from "../../../lib/analytics";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { visitorId, newsId } = req.body;

  if (!newsId) {
    return res.status(400).json({ message: "newsId zorunludur." });
  }

  await trackArticleView({
    visitorId,
    newsId,
    userAgent: req.headers["user-agent"] || ""
  });

  return res.status(200).json({ success: true });
}
