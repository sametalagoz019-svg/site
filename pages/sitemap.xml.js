import dbConnect from "../lib/dbConnect";
import News from "../models/News";
import { SITE_DOMAIN } from "../lib/constants";
import { slugify } from "../lib/slugify";

export async function getServerSideProps({ res }) {
  await dbConnect();

  const newsDocs = await News.find({ status: "published" })
    .select("slug updatedAt")
    .lean();

  const staticRoutes = ["", "category/yerel", "category/siyaset", "category/spor", "category/ekonomi"];
  const urls = [
    ...staticRoutes.map(
      (route) => `
        <url>
          <loc>https://${SITE_DOMAIN}/${route}</loc>
          <changefreq>hourly</changefreq>
          <priority>${route ? "0.8" : "1.0"}</priority>
        </url>
      `
    ),
    ...newsDocs.map(
      (item) => `
        <url>
          <loc>https://${SITE_DOMAIN}/news/${slugify(item.slug)}</loc>
          <lastmod>${new Date(item.updatedAt).toISOString()}</lastmod>
          <changefreq>daily</changefreq>
          <priority>0.9</priority>
        </url>
      `
    )
  ].join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urls}
    </urlset>`;

  res.setHeader("Content-Type", "text/xml");
  res.write(xml);
  res.end();

  return { props: {} };
}

export default function Sitemap() {
  return null;
}
