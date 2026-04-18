import { requireAdminApi } from "../../../lib/auth";
import { getDashboardStats } from "../../../lib/analytics";

async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const stats = await getDashboardStats();
  return res.status(200).json(stats);
}

export default requireAdminApi(handler);
