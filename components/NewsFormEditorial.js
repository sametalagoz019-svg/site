import { useMemo, useRef, useState } from "react";
import BlockEditor from "./BlockEditor";
import { DEFAULT_COVER_IMAGE_GUIDE, EDITORIAL_IMAGE_GUIDES, NEWS_CATEGORIES } from "../lib/constants";
import { slugify } from "../lib/slugify";
import { getVideoEmbedUrl } from "../lib/videoEmbed";

const EDITORIAL_PLACEMENTS = ["Manşet", "Öne Çıkan", "Sürmanşet"];

const initialState = {
  title: "",
  excerpt: "",
  content: "",
  category: "Yerel",
  imageUrl: "",
  contentImages: [],
  videoUrl: "",
  sourceName: "",
  sourceUrl: "",
  tags: "",
  status: "draft",
  isFeatured: false,
  publishedAt: ""
};

function normalizeSourceName(value = "") {
  return String(value || "").replace(/58/g, "").replace(/\s{2,}/g, " ").trim();
}

function toInputDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function normalizeContentImages(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return [];
}

function createAssetMeta(url, meta = {}, typeOverride = "") {
  const cleanUrl = String(url || "").trim();
  const originalFilename = meta.originalFilename || cleanUrl.split("/").pop()?.split("?")[0] || "dosya";
  const mimeType = String(meta.mimeType || "");
  const ext = originalFilename.toLowerCase().split(".").pop() || "";
  let type = typeOverride || "file";
  if (!typeOverride) {
    if (mimeType.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)) type = "image";
    else if (["doc", "docx", "txt", "md"].includes(ext)) type = "document";
    else if (["xls", "xlsx", "csv"].includes(ext)) type = "spreadsheet";
    else if (ext === "pdf") type = "pdf";
  }
  return {
    url: cleanUrl,
    previewUrl: meta.previewUrl || cleanUrl,
    originalFilename,
    mimeType,
    size: Number(meta.size) || 0,
    type
  };
}

function estimateReadingMinutes(text = "") {
  const words = String(text || "").replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function StatusBadge({ status }) {
  const labels = { draft: "Taslak", pending: "Onay Bekliyor", published: "Yayında" };
  return <span className={`editor-status-badge editor-status-${status}`}>{labels[status] || status}</span>;
}

export default function NewsFormEditorial({ initialValues, onSubmit, submitLabel = "Kaydet" }) {
  const [form, setForm] = useState({
    ...initialState,
    ...initialValues,
    sourceName: normalizeSourceName(initialValues?.sourceName),
    contentImages: normalizeContentImages(initialValues?.contentImages),
    publishedAt: toInputDateTime(initialValues?.publishedAt)
  });
  const [assets, setAssets] = useState(() => normalizeContentImages(initialValues?.contentImages).map((url) => createAssetMeta(url, {}, "image")));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const coverFileInputRef = useRef(null);
  const assetFileInputRef = useRef(null);
  const videoEmbedUrl = getVideoEmbedUrl(form.videoUrl);
  const coverImageGuide = EDITORIAL_IMAGE_GUIDES[form.category] || DEFAULT_COVER_IMAGE_GUIDE;
  const contentImageUrls = useMemo(() => assets.filter((asset) => asset.type === "image").map((asset) => asset.url), [assets]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  async function uploadFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return [];
    setUploading(true);
    setError("");
    try {
      const nextAssets = [];
      for (const file of files) {
        const data = new FormData();
        data.append("file", file);
        const response = await fetch("/api/upload", { method: "POST", body: data });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || "Dosya yüklenemedi.");
        nextAssets.push(createAssetMeta(payload.url, { ...payload, previewUrl: URL.createObjectURL(file) }));
      }
      return nextAssets;
    } catch (uploadError) {
      setError(uploadError.message || "Dosya yüklenemedi.");
      return [];
    } finally {
      setUploading(false);
    }
  }

  async function handleCoverUpload(event) {
    const uploaded = await uploadFiles(event.target.files);
    if (uploaded[0]) setForm((current) => ({ ...current, imageUrl: uploaded[0].url }));
    event.target.value = "";
  }

  async function handleAssetUpload(event) {
    const uploaded = await uploadFiles(event.target.files);
    if (uploaded.length) {
      setAssets((current) => [...current, ...uploaded]);
      setForm((current) => ({ ...current, contentImages: [...current.contentImages, ...uploaded.filter((item) => item.type === "image").map((item) => item.url)] }));
    }
    event.target.value = "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      await onSubmit({
        ...form,
        sourceName: normalizeSourceName(form.sourceName),
        contentImages: contentImageUrls,
        tags: Array.isArray(form.tags) ? form.tags : String(form.tags).split(",").map((item) => item.trim()).filter(Boolean),
        publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null
      });
    } catch (submitError) {
      setError(submitError.message || "Kaydedilemedi.");
    }
  }

  return (
    <form className="admin-form admin-form-pro news-editor-shell" onSubmit={handleSubmit}>
      <div className="news-editor-main">
        <section className="panel panel-elevated news-editor-primary">
          <div className="news-editor-field-stack">
            <label className="news-editor-title-field">
              <span className="editor-field-label">BAŞLIK <small>A / A</small></span>
              <input className="news-editor-title-input" name="title" value={form.title} onChange={updateField} placeholder="Haber başlığını yazın" required />
            </label>
            <label className="news-editor-excerpt-field">
              <span className="editor-field-label">AÇIKLAMA <small>A / A</small></span>
              <textarea className="news-editor-excerpt-input" name="excerpt" value={form.excerpt} onChange={updateField} rows={5} placeholder="Habere kısa bir giriş yazın" required />
            </label>
          </div>
        </section>

        <section className="panel panel-elevated">
          <span className="editor-field-label">İÇERİK <small>A / A</small></span>
          <BlockEditor value={form.content} onChange={(content) => setForm((current) => ({ ...current, content }))} videoEmbedUrl={videoEmbedUrl} />
        </section>
      </div>

      <aside className="news-editor-sidebar">
        <section className="panel panel-elevated news-editor-sidebar-panel">
          <div className="panel-head panel-head-spread"><div><h2>Kapak Görseli</h2></div></div>
          <div className="news-editor-sidebar-stack">
            <label><span>Kapak URL</span><input name="imageUrl" value={form.imageUrl} onChange={updateField} placeholder="https://..." /></label>
            <label><span>Kapak Dosyası</span><input ref={coverFileInputRef} type="file" accept="image/*" onChange={handleCoverUpload} /></label>
            <div className="editor-guide-card news-image-guide">
              <strong>{coverImageGuide.label} Kapak Oranı</strong>
              <span>{coverImageGuide.ratio} • {coverImageGuide.size} px</span>
              <small>{coverImageGuide.note}</small>
            </div>
            <button type="button" className="dropzone dropzone-large" onClick={() => coverFileInputRef.current?.click()}><strong>Kapak görselini ekleyin</strong><span>Kapak için görsel yükleyin.</span></button>
            {form.imageUrl ? <div className="cover-preview-card"><img src={form.imageUrl} alt="Kapak önizleme" /></div> : null}
          </div>
        </section>

        <section className="panel panel-elevated news-editor-sidebar-panel">
          <div className="panel-head panel-head-spread"><div><h2>Dosya Ekleme</h2></div></div>
          <div className="news-editor-sidebar-stack">
            <label><span>Dosya Seç</span><input ref={assetFileInputRef} type="file" accept="image/*,.doc,.docx,.txt,.md,.pdf,.xls,.xlsx,.csv" multiple onChange={handleAssetUpload} /></label>
            <button type="button" className="dropzone dropzone-large" onClick={() => assetFileInputRef.current?.click()}><strong>Fotoğraf ve belge yükle</strong><span>Görselleri editöre sürükleyip bırak.</span></button>
            <div className="content-image-list content-image-list-pro asset-library-list">
              {assets.map((asset) => (
                <article key={asset.url} className="content-image-card asset-library-card" draggable onDragStart={(event) => event.dataTransfer.setData("application/x-admin-asset", JSON.stringify(asset))}>
                  {asset.type === "image" ? <img src={asset.previewUrl} alt={asset.originalFilename} /> : <div className="asset-file-icon">{asset.originalFilename.split(".").pop()?.toUpperCase() || "DOSYA"}</div>}
                  <div className="content-image-card-copy">
                    <strong>{asset.originalFilename}</strong>
                    <span className="content-image-meta">{asset.mimeType || "Dosya"}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="panel panel-elevated news-editor-sidebar-panel">
          <div className="panel-head panel-head-spread"><div><h2>Yayın</h2></div><StatusBadge status={form.status} /></div>
          <div className="news-editor-sidebar-stack">
            <label><span>Durum</span><select name="status" value={form.status} onChange={updateField}><option value="draft">Taslak</option><option value="pending">Onay Bekliyor</option><option value="published">Yayında</option></select></label>
            <label><span>Yayın Tarihi</span><input type="datetime-local" name="publishedAt" value={form.publishedAt} onChange={updateField} /></label>
            <div className="news-editor-publish-meta">
              <div className="form-note-card"><strong>Okuma Süresi</strong><span>{estimateReadingMinutes(form.content)} dk</span></div>
              <div className="form-note-card"><strong>Slug Önizleme</strong><span>{slugify(form.title) || "-"}</span></div>
            </div>
          </div>
          {uploading ? <p className="form-info">Dosyalar yükleniyor...</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
          <div className="news-editor-submit news-editor-submit-sidebar"><button type="submit" className="button button-primary-strong">{submitLabel}</button></div>
        </section>

        <section className="panel panel-elevated news-editor-sidebar-panel">
          <div className="panel-head panel-head-spread"><div><h2>Editoryal Yerleşim</h2></div></div>
          <div className="news-editor-sidebar-stack">
            <label><span>Kategori</span><select name="category" value={form.category} onChange={updateField}>{NEWS_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
            <div className="editor-guide-card news-image-guide">
              <strong>Aktif Kapak Ölçüsü</strong>
              <span>{coverImageGuide.ratio} • {coverImageGuide.size} px</span>
              <small>{coverImageGuide.note}</small>
            </div>
            <div className="editorial-placement-grid">
              {EDITORIAL_PLACEMENTS.map((item) => (
                <button key={item} type="button" className={form.category === item ? "editorial-placement-button is-active" : "editorial-placement-button"} onClick={() => setForm((current) => ({ ...current, category: item }))}>
                  {item}
                </button>
              ))}
            </div>
            <label className="checkbox-row checkbox-row-card"><input type="checkbox" name="isFeatured" checked={Boolean(form.isFeatured)} onChange={updateField} /><span>Bu haberi ayrıca öne çıkar</span></label>
          </div>
        </section>

        <section className="panel panel-elevated news-editor-sidebar-panel">
          <div className="panel-head panel-head-spread"><div><h2>Ek Bilgiler</h2></div></div>
          <div className="news-editor-sidebar-stack">
            <label><span>Kaynak Adı</span><input name="sourceName" value={form.sourceName} onChange={updateField} /></label>
            <label><span>Kaynak Linki</span><input name="sourceUrl" value={form.sourceUrl} onChange={updateField} /></label>
            <label><span>Video / Embed Linki</span><input name="videoUrl" value={form.videoUrl} onChange={updateField} placeholder="YouTube, Vimeo veya iframe kodu" /></label>
            <label><span>Etiketler</span><input name="tags" value={Array.isArray(form.tags) ? form.tags.join(", ") : form.tags} onChange={updateField} placeholder="sivas, belediye, spor" /></label>
          </div>
        </section>
      </aside>
    </form>
  );
}
