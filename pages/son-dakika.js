import Layout from "../components/Layout";
import dbConnect from "../lib/dbConnect";
import { formatDate } from "../lib/format";
import News from "../models/News";

export default function BreakingNewsPage({ items }) {
  return (
    <Layout title="Son Dakika">
      <section className="container section-block">
        <div className="breaking-hero">
          <span className="live-pill">Son Dakika</span>
          <h1>Sivas son dakika gelişmeleri</h1>
          <p>Gün içinde güncellenen kritik başlıkları zaman akışı mantığında takip et.</p>
        </div>
      </section>

      <section className="container section-block">
        <div className="breaking-list">
          {items.map((item) => (
            <article key={item._id} className="breaking-row">
              <div className="breaking-time">{formatDate(item.publishedAt || item.createdAt)}</div>
              <div className="breaking-copy">
                <span className="news-badge">{item.category}</span>
                <a href={`/news/${item.slug}`} target="_blank" rel="noopener noreferrer">
                  <h2>{item.title}</h2>
                </a>
                <p>{item.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </Layout>
  );
}

export async function getServerSideProps() {
  await dbConnect();
  const items = await News.find({ status: "published" })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(20)
    .lean();

  return {
    props: {
      items: JSON.parse(JSON.stringify(items))
    }
  };
}
