import { useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import DashboardStat from "../../components/DashboardStat";
import { getAdminFromRequest } from "../../lib/auth";
import { getDashboardStats } from "../../lib/analytics";
import { EDITORIAL_IMAGE_GUIDES } from "../../lib/constants";
import dbConnect from "../../lib/dbConnect";
import { formatDate } from "../../lib/format";
import News from "../../models/News";

function StoryStrip({ items, emptyMessage }) {
  if (!items.length) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  return (
    <div className="story-strip">
      {items.map((item) => (
        <a key={item._id} href={`/news/${item.slug}`} className="story-strip-card" target="_blank" rel="noopener noreferrer">
          <img src={item.imageUrl || "/logo.svg"} alt={item.title} />
          <div>
            <span>{item.category}</span>
            <strong>{item.title}</strong>
            <small>{formatDate(item.publishedAt || item.createdAt)}</small>
          </div>
        </a>
      ))}
    </div>
  );
}

export default function AdminDashboardPage({ stats, recentPending, featuredNews, latestPublished }) {
  const [message, setMessage] = useState("");
  const mansetGuide = EDITORIAL_IMAGE_GUIDES["Manşet"];

  async function setFeatured(id) {
    const response = await fetch(`/api/news/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: true, status: "published" })
    });

    if (response.ok) {
      setMessage("Ana manşet güncellendi.");
      window.setTimeout(() => window.location.reload(), 500);
    }
  }

  return (
    <AdminLayout title="Dashboard">
      <section className="panel admin-intro admin-intro-pro">
        <div>
          <span className="eyebrow">Yönetim Özeti</span>
          <h2>Bugünkü yayın akışını tek ekrandan yönet</h2>
          <p>Taslakları düzenle, bekleyen haberleri onayla, manşeti güncelle ve yayın masasındaki öncelikleri net biçimde izle.</p>
        </div>
        <div className="admin-intro-actions">
          <a href="/admin/news/new" className="button">
            Yeni Haber Gir
          </a>
          <a href="/admin/homepage" className="button button-secondary">
            Ana Sayfa ve Reklam
          </a>
        </div>
      </section>

      <div className="stats-grid">
        <DashboardStat label="Toplam Ziyaretçi" value={stats.totalVisitors} />
        <DashboardStat label="Toplam Görüntülenme" value={stats.totalArticleViews} />
        <DashboardStat label="Yayındaki Haber" value={stats.publishedNews} />
        <DashboardStat label="Onay Bekleyen" value={stats.pendingNews} />
      </div>

      {message ? <p className="form-info">{message}</p> : null}

      <div className="admin-panels">
        <section className="panel panel-elevated">
          <div className="panel-head panel-head-spread">
            <div>
              <h2>Aktif Manşet</h2>
              <p className="homepage-preview-note">Yayında olan ana manşet kaydı</p>
              <span className="admin-image-guide-inline">Önerilen görsel: {mansetGuide.ratio} • {mansetGuide.size} px</span>
            </div>
            <span className="editor-chip">{featuredNews ? "Canlı" : "Boş"}</span>
          </div>
          {featuredNews ? (
            <article className="featured-admin-card featured-admin-card-pro">
              <img src={featuredNews.imageUrl || "/logo.svg"} alt={featuredNews.title} className="featured-admin-image" />
              <div className="featured-admin-copy">
                <span className="news-badge">{featuredNews.category}</span>
                <strong>{featuredNews.title}</strong>
                <p>{featuredNews.excerpt}</p>
                <small>{formatDate(featuredNews.publishedAt || featuredNews.createdAt)}</small>
                <div className="list-actions">
                  <a href={`/news/${featuredNews.slug}`} className="button button-secondary" target="_blank" rel="noopener noreferrer">
                    Haberi Aç
                  </a>
                </div>
              </div>
            </article>
          ) : (
            <p className="empty-state">Henüz manşete taşınmış bir haber yok.</p>
          )}
        </section>

        <section className="panel panel-elevated">
          <div className="panel-head panel-head-spread">
            <div>
              <h2>Hızlı Manşet Seçimi</h2>
              <p className="homepage-preview-note">Son yayınlanan haberlerden yeni manşet belirle</p>
            </div>
            <span className="editor-chip">{latestPublished.length}</span>
          </div>
          <div className="story-actions-list">
            {latestPublished.map((item) => (
              <article key={item._id} className="story-actions-card">
                <img src={item.imageUrl || "/logo.svg"} alt={item.title} />
                <div>
                  <strong>{item.title}</strong>
                  <small>{formatDate(item.publishedAt || item.createdAt)}</small>
                </div>
                <div className="list-actions">
                  <a href={`/news/${item.slug}`} className="button button-outline" target="_blank" rel="noopener noreferrer">
                    Önizle
                  </a>
                  <button className="button" onClick={() => setFeatured(item._id)}>
                    Manşet Yap
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="admin-panels">
        <section className="panel panel-elevated">
          <div className="panel-head panel-head-spread">
            <div>
              <h2>En Çok Okunanlar</h2>
              <p className="homepage-preview-note">Okur ilgisi en yüksek yayınlar</p>
            </div>
            <span className="editor-chip">{stats.topNews.length}</span>
          </div>
          <StoryStrip items={stats.topNews} emptyMessage="Henüz yayınlanmış haber yok." />
        </section>

        <section className="panel panel-elevated">
          <div className="panel-head panel-head-spread">
            <div>
              <h2>Onay Bekleyen Haberler</h2>
              <p className="homepage-preview-note">Editör onayı bekleyen son kayıtlar</p>
            </div>
            <span className="editor-chip">{recentPending.length}</span>
          </div>
          <StoryStrip items={recentPending} emptyMessage="Bekleyen haber yok. Akış temiz görünüyor." />
        </section>
      </div>
    </AdminLayout>
  );
}

export async function getServerSideProps({ req }) {
  const admin = await getAdminFromRequest(req);

  if (!admin) {
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false
      }
    };
  }

  await dbConnect();
  const [stats, recentPending, featuredNews, latestPublished] = await Promise.all([
    getDashboardStats(),
    News.find({ status: "pending" }).sort({ createdAt: -1 }).limit(6).lean(),
    News.findOne({ status: "published", isFeatured: true }).sort({ publishedAt: -1, createdAt: -1 }).lean(),
    News.find({ status: "published" }).sort({ sortOrder: 1, publishedAt: -1, createdAt: -1 }).limit(5).lean()
  ]);

  return {
    props: {
      stats: JSON.parse(JSON.stringify(stats)),
      recentPending: JSON.parse(JSON.stringify(recentPending)),
      featuredNews: featuredNews ? JSON.parse(JSON.stringify(featuredNews)) : null,
      latestPublished: JSON.parse(JSON.stringify(latestPublished))
    }
  };
}
