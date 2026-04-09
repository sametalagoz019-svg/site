import { trackVisitor } from "../../../lib/analytics";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { visitorId } = req.body;
  await trackVisitor({
    visitorId,
    userAgent: req.headers["user-agent"] || ""
  });

  return res.status(200).json({ success: true });
}
