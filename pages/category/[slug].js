import AnalyticsTracker from "../../components/AnalyticsTracker";
import Layout from "../../components/Layout";
import { CATEGORY_SLUGS } from "../../lib/constants";
import { formatDate } from "../../lib/format";
import { getCategoryThemeClass } from "../../lib/categoryTheme";
import dbConnect from "../../lib/dbConnect";
import News from "../../models/News";

function CategoryBrief({ category, newsList, lead }) {
  return (
    <section className="category-brief category-brief-portal">
      <div className="category-brief-copy">
        <span className="eyebrow">Kategori Servisi</span>
        <h1>{category} Haberleri</h1>
        <p>{category} gündemindeki gelişmeleri manşet, kısa akış ve detaylı liste yapısıyla tek sayfada takip et.</p>
      </div>
      <div className="category-brief-stats">
        <div className="category-brief-stat">
          <strong>{newsList.length}</strong>
          <span>Toplam yayın</span>
        </div>
        <div className="category-brief-stat">
          <strong>{lead ? lead.viewCount || 0 : 0}</strong>
          <span>Öne çıkan okuma</span>
        </div>
        <div className="category-brief-stat category-brief-stat-wide">
          <strong>{lead ? formatDate(lead.publishedAt || lead.createdAt) : "-"}</strong>
          <span>Son güncelleme</span>
        </div>
      </div>
    </section>
  );
}

export default function CategoryPage({ category, newsList }) {
  const [lead, second, third, ...rest] = newsList;
  const quickRows = newsList.slice(0, 6);
  const deskRows = newsList.slice(3, 8);
  const highlights = newsList.slice(0, 4);

  return (
    <Layout title={`${category} Haberleri`}>
      <AnalyticsTracker />

      <section className="container section-block category-hero-shell category-hero-shell-portal">
        <CategoryBrief category={category} newsList={newsList} lead={lead} />

        {lead ? (
          <div className="category-hero-grid category-hero-grid-portal">
            <a href={`/news/${lead.slug}`} className="category-front-lead category-front-lead-premium" target="_blank" rel="noopener noreferrer">
              <img src={lead.imageUrl || "/logo.svg"} alt={lead.title} className="category-front-image" />
              <div className="category-front-body">
                <span className={`news-badge ${getCategoryThemeClass(lead.category)}`}>{lead.category}</span>
                <h2>{lead.title}</h2>
                <p>{lead.excerpt}</p>
                <div className="news-meta">
                  <span>{formatDate(lead.publishedAt || lead.createdAt)}</span>
                  <span>{lead.viewCount || 0} okunma</span>
                </div>
              </div>
            </a>

            <div className="category-highlight-stack category-highlight-stack-portal">
              {highlights.filter(Boolean).map((item) => (
                <a key={item._id} href={`/news/${item.slug}`} className="category-highlight-card" target="_blank" rel="noopener noreferrer">
                  <span className={`news-badge ${getCategoryThemeClass(item.category)}`}>{item.category}</span>
                  <strong>{item.title}</strong>
                  <p>{formatDate(item.publishedAt || item.createdAt)}</p>
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="container section-block">
        <div className="category-front-grid category-front-grid-premium category-front-grid-portal">
          <div className="category-front-main">
            <div className="category-secondary-grid">
              {[second, third].filter(Boolean).map((item) => (
                <a key={item._id} href={`/news/${item.slug}`} className="category-secondary-card" target="_blank" rel="noopener noreferrer">
                  <span className={`news-badge ${getCategoryThemeClass(item.category)}`}>{item.category}</span>
                  <strong>{item.title}</strong>
                  <p>{item.excerpt}</p>
                </a>
              ))}
            </div>

            <div className="category-river category-river-premium">
              {rest.map((item) => (
                <article key={item._id} className="category-river-card">
                  <a href={`/news/${item.slug}`} className="category-river-image-wrap" target="_blank" rel="noopener noreferrer">
                    <img src={item.imageUrl || "/logo.svg"} alt={item.title} className="category-river-image" />
                  </a>
                  <div className="category-river-copy">
                    <span className={`news-badge ${getCategoryThemeClass(item.category)}`}>{item.category}</span>
                    <a href={`/news/${item.slug}`} target="_blank" rel="noopener noreferrer">
                      <h3>{item.title}</h3>
                    </a>
                    <p>{item.excerpt}</p>
                    <div className="news-meta">
                      <span>{formatDate(item.publishedAt || item.createdAt)}</span>
                      <span>{item.viewCount || 0} okunma</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="category-front-sidebar category-front-sidebar-premium category-front-sidebar-portal">
            <div className="panel">
              <div className="panel-head">
                <h2>Kısa Akış</h2>
              </div>
              <div className="bulletin-list">
                {quickRows.map((item) => (
                  <a key={item._id} href={`/news/${item.slug}`} className="bulletin-row" target="_blank" rel="noopener noreferrer">
                    <span>{formatDate(item.publishedAt || item.createdAt)}</span>
                    <strong>{item.title}</strong>
                  </a>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <h2>Servis Seçkisi</h2>
              </div>
              <div className="newsroom-list">
                {deskRows.map((item) => (
                  <a key={item._id} href={`/news/${item.slug}`} className="newsroom-row" target="_blank" rel="noopener noreferrer">
                    <span>{item.category}</span>
                    <strong>{item.title}</strong>
                  </a>
                ))}
              </div>
            </div>

            <div className="panel category-service-panel">
              <div className="panel-head">
                <h2>Servis Notu</h2>
              </div>
              <p>{category} sayfası manşet, sıcak gelişme ve arşivlenebilir haber mantığıyla editoryal biçimde sunulur.</p>
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
}

export async function getServerSideProps({ params }) {
  const category = CATEGORY_SLUGS[params.slug];

  if (!category) {
    return { notFound: true };
  }

  await dbConnect();
  const newsDocs = await News.find({ status: "published", category })
    .sort({ sortOrder: 1, publishedAt: -1, createdAt: -1 })
    .lean();

  return {
    props: {
      category,
      newsList: JSON.parse(JSON.stringify(newsDocs))
    }
  };
}
