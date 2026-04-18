import dbConnect from "../../../lib/dbConnect";
import {
  authenticateAdmin,
  createAdminToken,
  setAuthCookie
} from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await dbConnect();
  const { email, password } = req.body;
  const user = await authenticateAdmin(email, password);

  if (!user) {
    return res.status(401).json({ message: "E-posta veya şifre hatalı." });
  }

  const token = createAdminToken(user);
  setAuthCookie(res, token);
  return res.status(200).json({ success: true });
}
