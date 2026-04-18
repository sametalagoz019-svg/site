import dbConnect from "../../../lib/dbConnect";
import News from "../../../models/News";
import { requireAdminApi } from "../../../lib/auth";
import { slugify } from "../../../lib/slugify";

async function makeSlug(title, currentId) {
  const base = slugify(title);
  let candidate = base;
  let counter = 1;

  while (
    await News.findOne({
      slug: candidate,
      _id: { $ne: currentId }
    })
  ) {
    counter += 1;
    candidate = `${base}-${counter}`;
  }

  return candidate;
}

async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === "GET") {
    const news = await News.findById(id).lean();
    return res.status(news ? 200 : 404).json(news || { message: "Haber bulunamadı." });
  }

  if (req.method === "PUT") {
    const current = await News.findById(id);

    if (!current) {
      return res.status(404).json({ message: "Haber bulunamadı." });
    }

    const newsBody = req.body;
    const slug = newsBody.title ? await makeSlug(newsBody.title, id) : current.slug;
    const nextStatus = newsBody.status || current.status;
    const publishedAt =
      nextStatus === "published" ? current.publishedAt || new Date() : newsBody.publishedAt || null;

    if (newsBody.isFeatured === true) {
      const publishedItems = await News.find({ status: "published" }).lean();

      await Promise.all(
        publishedItems
          .filter((item) => item._id !== id && item.isFeatured)
          .map((item) => News.findByIdAndUpdate(item._id, { isFeatured: false }, { new: true }))
      );
    }

    const updated = await News.findByIdAndUpdate(
      id,
      {
        ...newsBody,
        slug,
        publishedAt
      },
      { new: true }
    );

    return res.status(200).json({ success: true, news: updated });
  }

  if (req.method === "DELETE") {
    await News.findByIdAndDelete(id);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ message: "Method not allowed" });
}

export default requireAdminApi(handler);
