import AdminLayout from "../../../components/AdminLayout";
import NewsForm from "../../../components/NewsFormEditorial";
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
