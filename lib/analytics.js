import dbConnect from "./dbConnect";
import Visitor from "../models/Visitor";
import ArticleView from "../models/ArticleView";
import News from "../models/News";

export async function trackVisitor({ visitorId, userAgent }) {
  await dbConnect();

  if (!visitorId) {
    return null;
  }

  return Visitor.findOneAndUpdate(
    { visitorId },
    { visitorId, userAgent, lastVisitedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function trackArticleView({ newsId, visitorId, userAgent }) {
  await dbConnect();

  await ArticleView.create({
    news: newsId,
    visitorId: visitorId || "anonymous",
    userAgent
  });

  await News.findByIdAndUpdate(newsId, { $inc: { viewCount: 1 } });
}

export async function getDashboardStats() {
  await dbConnect();

  const [totalVisitors, totalNews, publishedNews, pendingNews, totalArticleViews, topNews] =
    await Promise.all([
      Visitor.countDocuments(),
      News.countDocuments(),
      News.countDocuments({ status: "published" }),
      News.countDocuments({ status: "pending" }),
      ArticleView.countDocuments(),
      News.find({ status: "published" })
        .sort({ viewCount: -1, publishedAt: -1 })
        .limit(5)
        .select("title slug viewCount category publishedAt")
        .lean()
    ]);

  return {
    totalVisitors,
    totalNews,
    publishedNews,
    pendingNews,
    totalArticleViews,
    topNews
  };
}
