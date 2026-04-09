import Link from "next/link";
import { formatDate } from "../lib/format";
import { getCategoryThemeClass } from "../lib/categoryTheme";

export default function NewsCard({ news, priority = false }) {
  const themeClass = getCategoryThemeClass(news.category);

  return (
    <article className={`news-card ${priority ? "news-card-featured" : ""}`}>
      <Link href={`/news/${news.slug}`} className="news-card-image-wrap" target="_blank" rel="noopener noreferrer">
        <img src={news.imageUrl || "/logo.svg"} alt={news.title} className="news-card-image" />
      </Link>
      <div className="news-card-body">
        <span className={`news-badge ${themeClass}`}>{news.category}</span>
        <Link href={`/news/${news.slug}`} target="_blank" rel="noopener noreferrer">
          <h3>{news.title}</h3>
        </Link>
        <p>{news.excerpt}</p>
        <div className="news-meta">
          <span>{formatDate(news.publishedAt || news.createdAt)}</span>
          <span>{news.viewCount || 0} okunma</span>
        </div>
      </div>
    </article>
  );
}
