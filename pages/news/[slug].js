import { Fragment, useState } from "react";
import AnalyticsTracker from "../../components/AnalyticsTracker";
import Layout from "../../components/Layout";
import { SITE_DOMAIN } from "../../lib/constants";
import { formatDate } from "../../lib/format";
import { getCategoryThemeClass } from "../../lib/categoryTheme";
import { getVideoEmbedUrl } from "../../lib/videoEmbed";
import dbConnect from "../../lib/dbConnect";
import Comment from "../../models/Comment";
import News from "../../models/News";

function getAuthorName(category) {
  const authors = {
    "Gündem": "Editör Masası",
    "Yerel": "Yerel Haber Servisi",
    "Siyaset": "Siyaset Servisi",
    "Spor": "Spor Servisi",
    "Ekonomi": "Ekonomi Editörlüğü",
    "Eğitim": "Eğitim Dosyası",
    "Sağlık": "Sağlık Servisi",
    "Kültür": "Kültür Sanat Masası",
    "Manşet": "Haber Merkezi",
    "Öne Çıkan": "Editör Masası",
    "Sürmanşet": "Yerel Haber Servisi"
  };

  return authors[category] || "Haber Merkezi";
}

function normalizeSourceName(name = "") {
  return String(name || "")
    .replace(/58/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function renderInlineMarkup(text = "") {
  const parts = String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>;
    }

    return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
}

function buildContentBlocks(content = "", contentImages = []) {
  return content
    .split("\n")
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => {
      const markerMatch = paragraph.match(/^\[\[gorsel-(\d+)\]\]$/i);

      if (markerMatch) {
        const imageIndex = Number(markerMatch[1]) - 1;
        return {
          type: "image",
          key: `image-${index}`,
          imageUrl: contentImages[imageIndex] || ""
        };
      }

      return {
        type: "paragraph",
        key: `paragraph-${index}`,
        text: paragraph
      };
    });
}

function renderContentBlock(block, newsTitle) {
  if (block.type === "image" && block.imageUrl) {
    return (
      <figure key={block.key} className="detail-inline-image">
        <img src={block.imageUrl} alt={newsTitle} />
      </figure>
    );
  }

  const text = block.text || "";

  if (text.startsWith("### ")) {
    return <h3 key={block.key}>{renderInlineMarkup(text.slice(4))}</h3>;
  }

  if (text.startsWith("## ")) {
    return <h2 key={block.key}>{renderInlineMarkup(text.slice(3))}</h2>;
  }

  if (text.startsWith("> ")) {
    return <blockquote key={block.key}>{renderInlineMarkup(text.slice(2))}</blockquote>;
  }

  if (text.startsWith("- ")) {
    return (
      <ul key={block.key} className="detail-inline-list">
        <li>{renderInlineMarkup(text.slice(2))}</li>
      </ul>
    );
  }

  if (/^\d+\.\s/.test(text)) {
    return (
      <ol key={block.key} className="detail-inline-list detail-inline-list-ordered">
        <li>{renderInlineMarkup(text.replace(/^\d+\.\s/, ""))}</li>
      </ol>
    );
  }

  return <p key={block.key}>{renderInlineMarkup(text)}</p>;
}

export default function NewsDetailPage({ news, related, previousNews, nextNews, initialComments }) {
  const shareUrl = `https://${SITE_DOMAIN}/news/${news.slug}`;
  const shareText = encodeURIComponent(`${news.title} - ${news.excerpt}`);
  const encodedShareUrl = encodeURIComponent(shareUrl);
  const tags = news.tags?.length ? news.tags : [news.category, "Sivas", "Son Dakika"];
  const authorName = getAuthorName(news.category);
  const videoEmbedUrl = getVideoEmbedUrl(news.videoUrl);
  const sourceName = normalizeSourceName(news.sourceName);
  const contentImages = Array.isArray(news.contentImages) ? news.contentImages.filter(Boolean) : [];
  const contentBlocks = buildContentBlocks(news.content, contentImages);
  const [comments, setComments] = useState(initialComments || []);
  const [commentForm, setCommentForm] = useState({ name: "", message: "" });
  const [commentError, setCommentError] = useState("");
  const [commentSuccess, setCommentSuccess] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  async function handleCommentSubmit(event) {
    event.preventDefault();
    setCommentLoading(true);
    setCommentError("");
    setCommentSuccess("");

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newsId: news._id,
          name: commentForm.name,
          message: commentForm.message
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Yorum kaydedilemedi.");
      }

      setComments((current) => [payload.comment, ...current]);
      setCommentForm({ name: "", message: "" });
      setCommentSuccess("Yorumunuz yayınlandı.");
    } catch (error) {
      setCommentError(error.message || "Yorum gönderilemedi.");
    } finally {
      setCommentLoading(false);
    }
  }

  return (
    <Layout title={news.title} description={news.excerpt}>
      <AnalyticsTracker newsId={news._id} />
      <article className="container detail-clean-layout">
        <section className="detail-clean-main">
          <header className="detail-clean-header">
            <span className={`news-badge ${getCategoryThemeClass(news.category)}`}>{news.category}</span>
            <h1>{news.title}</h1>
            <p className="detail-clean-standfirst">{news.excerpt}</p>
            <div className="detail-clean-meta">
              <span>{formatDate(news.publishedAt || news.createdAt)}</span>
              <span>{news.viewCount || 0} okunma</span>
              <span>{authorName}</span>
              {sourceName ? <span>Kaynak: {sourceName}</span> : null}
            </div>
          </header>

          <img src={news.imageUrl || "/logo.svg"} alt={news.title} className="detail-clean-image" />

          {videoEmbedUrl ? (
            <section className="detail-clean-video">
              <div className="detail-clean-video-head">
                <strong>Haber Videosu</strong>
                <span>YouTube, Vimeo veya iframe embed bağlantısı</span>
              </div>
              <div className="detail-clean-video-frame">
                <iframe
                  src={videoEmbedUrl}
                  title={`${news.title} video`}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </section>
          ) : null}

          <div className="detail-clean-body">
            {contentBlocks.map((block) => renderContentBlock(block, news.title))}
          </div>

          {news.sourceUrl ? (
            <div className="detail-clean-source">
              <strong>Kaynak Bağlantısı</strong>
              <a href={news.sourceUrl} target="_blank" rel="noopener noreferrer">
                {news.sourceUrl}
              </a>
            </div>
          ) : null}

          <section className="detail-clean-share">
            <div>
              <h3>Haberi Paylaş</h3>
              <p>Bağlantıyı kopyalayabilir veya sosyal ağlarda paylaşabilirsin.</p>
            </div>
            <div className="detail-share-actions">
              <a
                href={`https://twitter.com/intent/tweet?url=${encodedShareUrl}&text=${shareText}`}
                target="_blank"
                rel="noreferrer"
                className="button"
              >
                X'te Paylaş
              </a>
              <a
                href={`https://wa.me/?text=${shareText}%20${encodedShareUrl}`}
                target="_blank"
                rel="noreferrer"
                className="button button-secondary"
              >
                WhatsApp
              </a>
              <a href={shareUrl} className="button button-outline" target="_blank" rel="noreferrer">
                Kalıcı Link
              </a>
            </div>
          </section>

          <section className="detail-tags">
            <h3>Etiketler</h3>
            <div className="tag-row">
              {tags.map((tag) => (
                <span key={tag} className="tag-pill">
                  #{tag}
                </span>
              ))}
            </div>
          </section>

          <section className="detail-comments">
            <div className="detail-comments-head">
              <div>
                <h3>Okuyucu Yorumları</h3>
                <p>Yayınlanan yorumlar haberin altında anında görünür.</p>
              </div>
              <span>{comments.length} yorum</span>
            </div>

            <form className="comment-form" onSubmit={handleCommentSubmit}>
              <div className="comment-form-grid">
                <label>
                  <span>Adınız</span>
                  <input
                    name="name"
                    value={commentForm.name}
                    onChange={(event) => setCommentForm((current) => ({ ...current, name: event.target.value }))}
                    maxLength={80}
                    required
                  />
                </label>
              </div>
              <label>
                <span>Yorumunuz</span>
                <textarea
                  name="message"
                  rows={5}
                  value={commentForm.message}
                  onChange={(event) => setCommentForm((current) => ({ ...current, message: event.target.value }))}
                  maxLength={1000}
                  required
                />
              </label>
              {commentError ? <p className="form-error">{commentError}</p> : null}
              {commentSuccess ? <p className="form-success">{commentSuccess}</p> : null}
              <button type="submit" className="button" disabled={commentLoading}>
                {commentLoading ? "Gönderiliyor..." : "Yorumu Gönder"}
              </button>
            </form>

            <div className="comment-list">
              {comments.length ? (
                comments.map((comment) => (
                  <article key={comment._id} className="comment-card">
                    <div className="comment-card-head">
                      <strong>{comment.name}</strong>
                      <span>{formatDate(comment.createdAt)}</span>
                    </div>
                    <p>{comment.message}</p>
                  </article>
                ))
              ) : (
                <div className="comment-empty">
                  <strong>Henüz yorum yok.</strong>
                  <span>İlk yorumu sen bırakabilirsin.</span>
                </div>
              )}
            </div>
          </section>

          <section className="detail-nav">
            {previousNews ? (
              <a href={`/news/${previousNews.slug}`} className="detail-nav-card" target="_blank" rel="noopener noreferrer">
                <span>Önceki Haber</span>
                <strong>{previousNews.title}</strong>
              </a>
            ) : (
              <div className="detail-nav-card detail-nav-card-muted">
                <span>Önceki Haber</span>
                <strong>Önceki kayıt bulunmuyor</strong>
              </div>
            )}
            {nextNews ? (
              <a href={`/news/${nextNews.slug}`} className="detail-nav-card" target="_blank" rel="noopener noreferrer">
                <span>Sonraki Haber</span>
                <strong>{nextNews.title}</strong>
              </a>
            ) : (
              <div className="detail-nav-card detail-nav-card-muted">
                <span>Sonraki Haber</span>
                <strong>Sonraki kayıt bulunmuyor</strong>
              </div>
            )}
          </section>
        </section>

        <aside className="detail-clean-sidebar">
          <div className="sidebar-panel sidebar-panel-editorial">
            <h3>Servis Notu</h3>
            <p>{news.category} servisinde hazırlanan bu içerik gün içinde yeni gelişmelere göre güncellenebilir.</p>
          </div>
          <div className="sidebar-panel">
            <h3>İlgili Haberler</h3>
            {related.map((item) => (
              <a key={item._id} href={`/news/${item.slug}`} className="sidebar-link" target="_blank" rel="noopener noreferrer">
                <strong>{item.title}</strong>
                <span>{formatDate(item.publishedAt || item.createdAt)}</span>
              </a>
            ))}
          </div>
        </aside>
      </article>
    </Layout>
  );
}

export async function getServerSideProps({ params, res }) {
  await dbConnect();

  const newsDoc = await News.findOne({ slug: params.slug, status: "published" }).lean();

  if (!newsDoc) {
    return { notFound: true };
  }

  const [relatedDocs, allPublishedDocs, commentDocs] = await Promise.all([
    News.find({
      status: "published",
      category: newsDoc.category,
      _id: { $ne: newsDoc._id }
    })
      .sort({ sortOrder: 1, publishedAt: -1, createdAt: -1 })
      .limit(4)
      .lean(),
    News.find({ status: "published" })
      .sort({ sortOrder: 1, publishedAt: -1, createdAt: -1 })
      .lean(),
    Comment.find({
      news: newsDoc._id,
      status: "approved"
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()
  ]);

  const currentIndex = allPublishedDocs.findIndex((item) => String(item._id) === String(newsDoc._id));
  const previousNews = currentIndex > 0 ? allPublishedDocs[currentIndex - 1] : null;
  const nextNews =
    currentIndex !== -1 && currentIndex < allPublishedDocs.length - 1
      ? allPublishedDocs[currentIndex + 1]
      : null;

  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");

  return {
    props: {
      news: JSON.parse(JSON.stringify(newsDoc)),
      related: JSON.parse(JSON.stringify(relatedDocs)),
      previousNews: previousNews ? JSON.parse(JSON.stringify(previousNews)) : null,
      nextNews: nextNews ? JSON.parse(JSON.stringify(nextNews)) : null,
      initialComments: JSON.parse(JSON.stringify(commentDocs))
    }
  };
}
