import { ingestAutomatedNews } from "../../../lib/newsFetcher";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return res.status(401).json({ message: "Yetkisiz erişim." });
  }

  const items = await ingestAutomatedNews(8);
  return res.status(200).json({
    success: true,
    count: items.length,
    message: `${items.length} haber cron üzerinden eklendi.`
  });
}
