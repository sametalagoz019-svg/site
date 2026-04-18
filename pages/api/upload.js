import fs from "fs/promises";
import path from "path";
import formidable from "formidable";
import { requireAdminApi } from "../../lib/auth";

export const config = {
  api: {
    bodyParser: false
  }
};

function parseForm(req) {
  const form = formidable({
    multiples: false,
    keepExtensions: true
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (error) reject(error);
      else resolve({ fields, files });
    });
  });
}

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { files } = await parseForm(req);
  const file = files.file?.[0] || files.file;

  if (!file) {
    return res.status(400).json({ message: "Dosya bulunamadı." });
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const originalFilename = path.basename(file.originalFilename || `dosya-${Date.now()}`);
  const fileName = `${Date.now()}-${originalFilename}`.replace(/\s+/g, "-");
  const targetPath = path.join(uploadsDir, fileName);

  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.copyFile(file.filepath, targetPath);

  return res.status(200).json({
    success: true,
    url: `/uploads/${fileName}`,
    originalFilename,
    mimeType: file.mimetype || "application/octet-stream",
    size: file.size || 0
  });
}

export default requireAdminApi(handler);
