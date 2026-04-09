import { requireAdminApi } from "../../../lib/auth";
import dbConnect from "../../../lib/dbConnect";
import News from "../../../models/News";
import { slugify } from "../../../lib/slugify";
import { buildSampleNews } from "../../../lib/sampleNews";

async function generateUniqueSlug(title) {
  const base = slugify(title);
  let candidate = base;
  let counter = 1;

  while (await News.findOne({ slug: candidate })) {
    counter += 1;
    candidate = `${base}-${counter}`;
  }

  return candidate;
}

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await dbConnect();
  const sample = buildSampleNews();
  const slug = await generateUniqueSlug(sample.title);
  const news = await News.create({
    ...sample,
    slug
  });

  return res.status(201).json({
    success: true,
    news,
    message: "Örnek taslak haber oluşturuldu."
  });
}

export default requireAdminApi(handler);
