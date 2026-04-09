import dbConnect from "../../../lib/dbConnect";
import News from "../../../models/News";
import { requireAdminApi } from "../../../lib/auth";
import { slugify } from "../../../lib/slugify";

async function generateUniqueSlug(title, currentId) {
  const base = slugify(title);
  let candidate = base;
  let counter = 1;

  while (
    await News.findOne({
      slug: candidate,
      ...(currentId ? { _id: { $ne: currentId } } : {})
    })
  ) {
    counter += 1;
    candidate = `${base}-${counter}`;
  }

  return candidate;
}

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    const status = req.query.status;
    const filter = status ? { status } : {};
    const news = await News.find(filter).sort({ createdAt: -1 }).lean();
    return res.status(200).json(news);
  }

  if (req.method === "POST") {
    const body = req.body;
    const slug = await generateUniqueSlug(body.title);
    const news = await News.create({
      ...body,
      slug,
      publishedAt: body.status === "published" ? new Date() : body.publishedAt || null,
      viewCount: body.viewCount || 0
    });

    return res.status(201).json({ success: true, news });
  }

  return res.status(405).json({ message: "Method not allowed" });
}

export default requireAdminApi(handler);
