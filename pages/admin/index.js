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
          <div className="story-strip-copy">
            <span className="story-strip-tag">{item.category}</span>
            <strong>{item.title}</strong>
            <small>{formatDate(item.publishedAt || item.createdAt)}</small>
          </div>
        </a>
      ))}
    </div>
  );
}

function NewsroomPulse({ stats, featuredNews, latestPublished }) {
  const topStory = stats.topNews[0];
  const newestStory = latestPublished[0];
  const cards = [
    {
      label: "Bekleyen Masa",
      title: `${stats.pendingNews} haber onay bekliyor`,
      text: stats.pendingNews ? "Bekleyen akisi temizlemek icin editor kuyru gu acik." : "Onay kuyrugu temiz gorunuyor."
    },
    {
      label: "Aktif Manset",
      title: featuredNews?.title || "Canli manset secilmemis",
      text: featuredNews ? "Su an yayinda olan ana manset kaydi." : "Dashboard uzerinden hizli secim yapabilirsin."
    },
    {
      label: "Yukselen Hikaye",
      title: topStory?.title || newestStory?.title || "Veri olusuyor",
      text: topStory ? "Okur ilgisi en yuksek haber." : "Yeni yayinlar geldikce bu alan dolacak."
    }
  ];

  return (
    <section className="newsroom-pulse-grid">
      {cards.map((card) => (
        <article key={card.label} className="newsroom-pulse-card">
          <span>{card.label}</span>
          <strong>{card.title}</strong>
          <p>{card.text}</p>
        </article>
      ))}
    </section>
  );
}

export default function AdminDashboardPage({ stats, recentPending, featuredNews, latestPublished }) {
  const [message, setMessage] = useState("");
  const mansetGuide = EDITORIAL_IMAGE_GUIDES["ManÅŸet"];

  async function setFeatured(id) {
    const response = await fetch(`/api/news/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: true, status: "published" })
    });

    if (response.ok) {
      setMessage("Ana manset guncellendi.");
      window.setTimeout(() => window.location.reload(), 500);
    }
  }

  return (
    <AdminLayout title="Dashboard">
      <section className="panel admin-intro admin-intro-pro">
        <div>
          <span className="eyebrow">Yonetim Ozeti</span>
          <h2>Bugunku yayin akisina tek ekrandan hakim ol</h2>
          <p>Taslaklari duzenle, bekleyen haberleri onayla, manseti guncelle ve yayin masasindaki oncelikleri net bicimde izle.</p>
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
        <DashboardStat label="Toplam Ziyaretci" value={stats.totalVisitors} />
        <DashboardStat label="Toplam Goruntulenme" value={stats.totalArticleViews} />
        <DashboardStat label="Yayindaki Haber" value={stats.publishedNews} />
        <DashboardStat label="Onay Bekleyen" value={stats.pendingNews} />
      </div>

      <NewsroomPulse stats={stats} featuredNews={featuredNews} latestPublished={latestPublished} />

      {message ? <p className="form-info">{message}</p> : null}

      <div className="admin-panels">
        <section className="panel panel-elevated">
          <div className="panel-head panel-head-spread">
            <div>
              <h2>Aktif Manset</h2>
              <p className="homepage-preview-note">Yayinda olan ana manset kaydi</p>
              <span className="admin-image-guide-inline">
                Onerilen gorsel: {mansetGuide.ratio} • {mansetGuide.size} px
              </span>
            </div>
            <span className="editor-chip">{featuredNews ? "Canli" : "Bos"}</span>
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
                    Haberi Ac
                  </a>
                </div>
              </div>
            </article>
          ) : (
            <p className="empty-state">Henuz mansete tasinmis bir haber yok.</p>
          )}
        </section>

        <section className="panel panel-elevated">
          <div className="panel-head panel-head-spread">
            <div>
              <h2>Hizli Manset Secimi</h2>
              <p className="homepage-preview-note">Son yayinlanan haberlerden yeni manset belirle</p>
            </div>
            <span className="editor-chip">{latestPublished.length}</span>
          </div>
          <div className="story-actions-list">
            {latestPublished.map((item) => (
              <article key={item._id} className="story-actions-card">
                <img src={item.imageUrl || "/logo.svg"} alt={item.title} />
                <div className="story-actions-copy">
                  <span className="story-strip-tag">{item.category}</span>
                  <strong>{item.title}</strong>
                  <small>{formatDate(item.publishedAt || item.createdAt)}</small>
                </div>
                <div className="list-actions">
                  <a href={`/news/${item.slug}`} className="button button-outline" target="_blank" rel="noopener noreferrer">
                    Onizle
                  </a>
                  <button className="button" onClick={() => setFeatured(item._id)}>
                    Manset Yap
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
              <h2>En Cok Okunanlar</h2>
              <p className="homepage-preview-note">Okur ilgisi en yuksek yayinlar</p>
            </div>
            <span className="editor-chip">{stats.topNews.length}</span>
          </div>
          <StoryStrip items={stats.topNews} emptyMessage="Henuz yayinlanmis haber yok." />
        </section>

        <section className="panel panel-elevated">
          <div className="panel-head panel-head-spread">
            <div>
              <h2>Onay Bekleyen Haberler</h2>
              <p className="homepage-preview-note">Editor onayi bekleyen son kayitlar</p>
            </div>
            <span className="editor-chip">{recentPending.length}</span>
          </div>
          <StoryStrip items={recentPending} emptyMessage="Bekleyen haber yok. Akis temiz gorunuyor." />
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
