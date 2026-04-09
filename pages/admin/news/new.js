import AdminLayout from "../../../components/AdminLayout";
import NewsForm from "../../../components/NewsForm";
import { getAdminFromRequest } from "../../../lib/auth";

export default function NewAdminNewsPage() {
  async function handleCreate(values) {
    const response = await fetch("/api/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message || "Kayıt başarısız.");
    }

    window.location.href = `/admin/news/${payload.news._id}`;
  }

  return (
    <AdminLayout title="Yeni Haber">
      <section className="panel admin-intro admin-intro-pro">
        <div>
          <span className="eyebrow">Haber Girişi</span>
          <h2>Yeni içeriği düzenli, hızlı ve yayın akışına uygun biçimde hazırla</h2>
          <p>Kapak görseli, içerik blokları, sürükle bırak görseller, video ve yayın ayarları tek editörde yönetilir.</p>
        </div>
      </section>
      <NewsForm onSubmit={handleCreate} submitLabel="Haberi Oluştur" />
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

  return { props: {} };
}
