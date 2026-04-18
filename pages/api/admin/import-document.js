import fs from "fs/promises";
import formidable from "formidable";
import mammoth from "mammoth";
import { requireAdminApi } from "../../../lib/auth";

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

async function readDocumentText(file) {
  const originalFilename = String(file.originalFilename || "").toLowerCase();
  const mimeType = String(file.mimetype || "").toLowerCase();

  if (
    originalFilename.endsWith(".docx") ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ path: file.filepath });
    return result.value || "";
  }

  if (originalFilename.endsWith(".txt") || originalFilename.endsWith(".md") || mimeType.startsWith("text/")) {
    return fs.readFile(file.filepath, "utf8");
  }

  throw new Error("Bu dosya türü desteklenmiyor. DOCX, TXT veya MD yükleyin.");
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

  try {
    const text = (await readDocumentText(file)).replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

    if (!text) {
      return res.status(400).json({ message: "Belgeden metin çıkarılamadı." });
    }

    return res.status(200).json({
      success: true,
      text
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Dosya içe aktarılamadı." });
  }
}

export default requireAdminApi(handler);
