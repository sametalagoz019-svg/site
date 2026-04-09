import { requireAdminApi } from "../../../lib/auth";
import { ingestAutomatedNews } from "../../../lib/newsFetcher";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const items = await ingestAutomatedNews(8);
  return res.status(200).json({
    success: true,
    count: items.length,
    message: `${items.length} yeni haber onay bekleyenler listesine eklendi.`
  });
}

export default requireAdminApi(handler);
