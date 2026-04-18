import { useMemo, useState } from "react";
import AdminLayout from "../../../components/AdminLayout";
import { getAdminFromRequest } from "../../../lib/auth";
import dbConnect from "../../../lib/dbConnect";
import { formatDate } from "../../../lib/format";
import News from "../../../models/News";

function NewsSection({
  title,
  items,
  emptyMessage,
  selectedIds,
  toggleSelected,
  onEdit,
  actions,
  draggable = false,
  draggingId,
  setDraggingId,
  onDrop
}) {
  return (
    <section className="panel panel-elevated">
      <div className="panel-head panel-head-spread">
        <div>
          <h2>{title}</h2>
          <p className="homepage-preview-note">{items.length} kayıt gösteriliyor</p>
        </div>
        <span className="editor-chip">{items.length}</span>
      </div>
      <div className="news-grid-admin">
        {items.map((item) => (
          <article
            key={item._id}
            className={`news-admin-card ${draggingId === item._id ? "list-card-dragging" : ""}`}
            draggable={draggable}
            onDragStart={() => draggable && setDraggingId(item._id)}
            onDragOver={(event) => draggable && event.preventDefault()}
            onDrop={() => draggable && onDrop(item._id)}
          >
            <img src={item.imageUrl || "/logo.svg"} alt={item.title} className="news-admin-card-image" />
            <div className="news-admin-card-copy">
              <label className="select-row">
                <input type="checkbox" checked={selectedIds.includes(item._id)} onChange={() => toggleSelected(item._id)} />
                <span>Seç</span>
              </label>
              <span className="news-admin-card-meta">
                {item.category} • {formatDate(item.publishedAt || item.updatedAt || item.createdAt)}
              </span>
              <strong>{item.title}</strong>
              <p>{item.excerpt}</p>
              <div className="list-actions">
                {draggable ? <span className="drag-handle">Sürükle</span> : null}
                <button type="button" className="button button-outline" onClick={() => onEdit(item._id)}>
                  Düzenle
                </button>
                <a href={`/news/${item.slug}`} className="button button-secondary" target="_blank" rel="noopener noreferrer">
                  Önizle
                </a>
                {actions(item)}
              </div>
            </div>
          </article>
        ))}
      </div>
      {!items.length ? <p className="empty-state">{emptyMessage}</p> : null}
    </section>
  );
}

export default function AdminNewsPage({ publishedNews, pendingNews, draftNews }) {
  const [publishedItems, setPublishedItems] = useState(publishedNews);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [draggingId, setDraggingId] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const pendingItems = useMemo(() => pendingNews, [pendingNews]);
  const draftItems = useMemo(() => draftNews, [draftNews]);

  function matchesFilters(item) {
    const search = query.trim().toLowerCase();
    const inSearch =
      !search ||
      item.title.toLowerCase().includes(search) ||
      item.excerpt.toLowerCase().includes(search) ||
      item.category.toLowerCase().includes(search);
    const inCategory = category === "all" || item.category === category;
    return inSearch && inCategory;
  }

  const filteredDrafts = draftItems.filter(matchesFilters);
  const filteredPending = pendingItems.filter(matchesFilters);
  const filteredPublished = publishedItems.filter(matchesFilters);
  const allFilteredItems = [...filteredDrafts, ...filteredPending, ...filteredPublished];

  function toggleSelected(id) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function selectAllFiltered() {
    setSelectedIds(allFilteredItems.map((item) => item._id));
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function editItem(id) {
    window.location.href = `/admin/news/${id}`;
  }

  async function fetchAutomatedNews() {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/fetch-news", { method: "POST" });
    const payload = await response.json();
    setLoading(false);
    setMessage(payload.message || "İşlem tamamlandı.");

    if (response.ok) {
      window.setTimeout(() => window.location.reload(), 1000);
    }
  }

  async function persistPublishedOrder(items) {
    await Promise.all(
      items.map((item, index) =>
        fetch(`/api/news/${item._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: index + 1 })
        })
      )
    );
  }

  async function movePublishedItem(targetId) {
    if (!draggingId || draggingId === targetId) {
      return;
    }

    const currentIndex = publishedItems.findIndex((item) => item._id === draggingId);
    const targetIndex = publishedItems.findIndex((item) => item._id === targetId);

    if (currentIndex === -1 || targetIndex === -1) {
      return;
    }

    const nextItems = [...publishedItems];
    const [dragged] = nextItems.splice(currentIndex, 1);
    nextItems.splice(targetIndex, 0, dragged);
    setPublishedItems(nextItems);
    setDraggingId("");
    setMessage("Yayın sırası güncelleniyor...");

    try {
      await persistPublishedOrder(nextItems);
      setMessage("Yayın sırası kaydedildi.");
    } catch {
      setMessage("Sıralama kaydedilemedi.");
    }
  }

  async function updateStatus(id, status) {
    const response = await fetch(`/api/news/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    if (response.ok) {
      window.location.reload();
    }
  }

  async function deleteNews(id) {
    const response = await fetch(`/api/news/${id}`, { method: "DELETE" });
    if (response.ok) {
      window.location.reload();
    }
  }

  async function featureNews(id) {
    const response = await fetch(`/api/news/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: true, status: "published" })
    });

    if (response.ok) {
      setMessage("Manşet güncellendi.");
      window.setTimeout(() => window.location.reload(), 500);
    }
  }

  async function bulkUpdate(action) {
    if (!selectedIds.length) {
      setMessage("Önce en az bir haber seç.");
      return;
    }

    setLoading(true);
    setMessage("");

    const response = await fetch("/api/news/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ids: selectedIds })
    });

    const payload = await response.json();
    setLoading(false);
    setMessage(payload.message || "Toplu işlem tamamlandı.");

    if (response.ok) {
      window.setTimeout(() => window.location.reload(), 700);
    }
  }

  const categoryOptions = [
    "all",
    ...Array.from(new Set([...publishedNews, ...pendingNews, ...draftNews].map((item) => item.category).filter(Boolean)))
  ];

  return (
    <AdminLayout title="Haber Merkezi">
      <section className="panel admin-intro admin-intro-pro">
        <div>
          <span className="eyebrow">Yayın Akışı</span>
          <h2>Haberleri düzenle, sırala ve yayına al</h2>
          <p>Başlık, kategori, durum ve editoryal aksiyonlar tek ekranda hizalanır. Sürükle-bırak ile yayın sırasını yönetebilirsin.</p>
        </div>
        <div className="mini-stats">
          <div className="mini-stat">
            <strong>{draftNews.length}</strong>
            <span>Taslak</span>
          </div>
          <div className="mini-stat">
            <strong>{pendingNews.length}</strong>
            <span>Bekleyen</span>
          </div>
          <div className="mini-stat">
            <strong>{publishedNews.length}</strong>
            <span>Yayında</span>
          </div>
        </div>
      </section>

      <div className="action-bar">
        <a href="/admin/news/new" className="button">
          Yeni Haber Oluştur
        </a>
        <button type="button" className="button button-secondary" onClick={fetchAutomatedNews} disabled={loading}>
          Ajans Çek
        </button>
      </div>

      <section className="panel panel-elevated">
        <div className="filter-bar">
          <label>
            <span>Ara</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Başlık, özet veya kategori ara" />
          </label>
          <label>
            <span>Kategori</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {categoryOptions.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "Tüm kategoriler" : item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="bulk-toolbar">
          <div className="bulk-toolbar-copy">
            <strong>Toplu İşlem</strong>
            <span>{selectedIds.length} haber seçildi</span>
          </div>
          <div className="list-actions">
            <button type="button" className="button button-outline" onClick={selectAllFiltered}>
              Görünenleri Seç
            </button>
            <button type="button" className="button button-outline" onClick={clearSelection}>
              Seçimi Temizle
            </button>
            <button type="button" className="button button-secondary" onClick={() => bulkUpdate("publish")} disabled={loading}>
              Yayına Al
            </button>
            <button type="button" className="button button-outline" onClick={() => bulkUpdate("pending")} disabled={loading}>
              Beklemeye Al
            </button>
            <button type="button" className="button button-danger" onClick={() => bulkUpdate("delete")} disabled={loading}>
              Sil
            </button>
          </div>
        </div>
      </section>

      {message ? <p className="form-info">{message}</p> : null}

      <NewsSection
        title="Taslak Haberler"
        items={filteredDrafts}
        emptyMessage="Taslak haber yok."
        selectedIds={selectedIds}
        toggleSelected={toggleSelected}
        onEdit={editItem}
        actions={(item) => (
          <>
            <button type="button" className="button" onClick={() => updateStatus(item._id, "pending")}>
              İncelemeye Gönder
            </button>
            <button type="button" className="button button-danger" onClick={() => deleteNews(item._id)}>
              Sil
            </button>
          </>
        )}
        draggingId={draggingId}
        setDraggingId={setDraggingId}
        onDrop={movePublishedItem}
      />

      <NewsSection
        title="Onay Bekleyen Haberler"
        items={filteredPending}
        emptyMessage="Bekleyen haber yok."
        selectedIds={selectedIds}
        toggleSelected={toggleSelected}
        onEdit={editItem}
        actions={(item) => (
          <>
            <button type="button" className="button" onClick={() => updateStatus(item._id, "published")}>
              Yayına Al
            </button>
            <button type="button" className="button button-outline" onClick={() => updateStatus(item._id, "draft")}>
              Taslağa Çek
            </button>
          </>
        )}
        draggingId={draggingId}
        setDraggingId={setDraggingId}
        onDrop={movePublishedItem}
      />

      <NewsSection
        title="Yayındaki Haberler"
        items={filteredPublished}
        emptyMessage="Yayınlanmış haber yok."
        selectedIds={selectedIds}
        toggleSelected={toggleSelected}
        onEdit={editItem}
        actions={(item) => (
          <>
            <button type="button" className="button" onClick={() => featureNews(item._id)}>
              Manşet Yap
            </button>
            <button type="button" className="button button-outline" onClick={() => updateStatus(item._id, "draft")}>
              Taslağa Çek
            </button>
          </>
        )}
        draggable
        draggingId={draggingId}
        setDraggingId={setDraggingId}
        onDrop={movePublishedItem}
      />
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

  const [publishedNews, pendingNews, draftNews] = await Promise.all([
    News.find({ status: "published" }).sort({ sortOrder: 1, publishedAt: -1, createdAt: -1 }).lean(),
    News.find({ status: "pending" }).sort({ createdAt: -1 }).lean(),
    News.find({ status: "draft" }).sort({ createdAt: -1 }).lean()
  ]);

  return {
    props: {
      publishedNews: JSON.parse(JSON.stringify(publishedNews)),
      pendingNews: JSON.parse(JSON.stringify(pendingNews)),
      draftNews: JSON.parse(JSON.stringify(draftNews))
    }
  };
}
