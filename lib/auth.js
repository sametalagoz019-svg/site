import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { parse, serialize } from "cookie";
import dbConnect from "./dbConnect";
import AdminUser from "../models/AdminUser";

const JWT_SECRET = process.env.JWT_SECRET || "development-secret";
const COOKIE_NAME = "sg58_admin_token";

function shouldUseSecureCookie() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  if (siteUrl.includes("localhost") || siteUrl.includes("127.0.0.1")) {
    return false;
  }

  return process.env.NODE_ENV === "production";
}

export async function ensureAdminUser() {
  await dbConnect();

  const email = process.env.ADMIN_EMAIL || "admin@sivasgundem58.com";
  const password = process.env.ADMIN_PASSWORD || "admin12345";
  const existing = await AdminUser.findOne({ email });

  if (existing) {
    return existing;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  return AdminUser.create({
    email,
    passwordHash,
    name: "Site Yöneticisi"
  });
}

export async function authenticateAdmin(email, password) {
  await ensureAdminUser();
  const user = await AdminUser.findOne({ email });

  if (!user) {
    return null;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}

export function createAdminToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: "admin"
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function setAuthCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    serialize(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: shouldUseSecureCookie(),
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    })
  );
}

export function clearAuthCookie(res) {
  res.setHeader(
    "Set-Cookie",
    serialize(COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: shouldUseSecureCookie(),
      path: "/",
      expires: new Date(0)
    })
  );
}

export function readTokenFromRequest(req) {
  const cookies = parse(req.headers.cookie || "");
  return cookies[COOKIE_NAME];
}

export function verifyAdminToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function requireAdminApi(handler) {
  return async function adminHandler(req, res) {
    const token = readTokenFromRequest(req);
    const payload = verifyAdminToken(token);

    if (!payload) {
      return res.status(401).json({ message: "Yetkisiz erişim." });
    }

    req.admin = payload;
    return handler(req, res);
  };
}

export async function getAdminFromRequest(req) {
  const token = readTokenFromRequest(req);
  const payload = verifyAdminToken(token);

  if (!payload) {
    return null;
  }

  await dbConnect();
  return AdminUser.findById(payload.sub).lean();
}
