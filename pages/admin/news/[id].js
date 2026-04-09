import AdminLayout from "../../../components/AdminLayout";
import NewsForm from "../../../components/NewsForm";
import { getAdminFromRequest } from "../../../lib/auth";
import dbConnect from "../../../lib/dbConnect";
import News from "../../../models/News";

export default function EditAdminNewsPage({ news }) {
  async function handleUpdate(values) {
    const response = await fetch(`/api/news/${news._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message || "Güncelleme başarısız.");
    }

    window.location.href = "/admin/news";
  }

  return (
    <AdminLayout title="Haberi Düzenle">
      <section className="panel admin-intro admin-intro-pro">
        <div>
          <span className="eyebrow">İçerik Düzenleme</span>
          <h2>Haberi güncelle, görselleri yerleştir ve yayına hazır hale getir</h2>
          <p>Başlık, içerik yapısı, içerik fotoğrafları, embed video ve yayın statüsü bu ekrandan yönetilir.</p>
        </div>
        <div className="admin-intro-actions">
          <a href={`/news/${news.slug}`} className="button button-secondary" target="_blank" rel="noopener noreferrer">
            Haberi Önizle
          </a>
        </div>
      </section>
      <NewsForm initialValues={news} onSubmit={handleUpdate} submitLabel="Güncelle" />
    </AdminLayout>
  );
}

export async function getServerSideProps({ req, params }) {
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
  const newsDoc = await News.findById(params.id).lean();

  if (!newsDoc) {
    return { notFound: true };
  }

  return {
    props: {
      news: JSON.parse(JSON.stringify(newsDoc))
    }
  };
}
