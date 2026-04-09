import { useRef, useState } from "react";
import { CATEGORY_IMAGE_SUGGESTIONS, NEWS_CATEGORIES } from "../lib/constants";
import { slugify } from "../lib/slugify";
import { getVideoEmbedUrl } from "../lib/videoEmbed";

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
  return String(value || "")
    .replace(/58/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
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

function estimateReadingMinutes(text = "") {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function normalizeContentImages(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function PreviewBody({ content }) {
  const lines = String(content || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);

  if (!lines.length) {
    return <p className="news-form-preview-body-empty">İçerik ön izlemesi burada görünecek.</p>;
  }

  return (
    <div className="news-form-preview-body">
      {lines.map((line, index) => {
        if (line.startsWith("### ")) {
          return <h4 key={`${line}-${index}`}>{line.slice(4)}</h4>;
        }

        if (line.startsWith("## ")) {
          return <h3 key={`${line}-${index}`}>{line.slice(3)}</h3>;
        }

        if (line.startsWith("- ") || /^\d+\.\s/.test(line)) {
          return (
            <p key={`${line}-${index}`} className="news-form-preview-listline">
              {line}
            </p>
          );
        }

        return <p key={`${line}-${index}`}>{line}</p>;
      })}
    </div>
  );
}

export default function NewsForm({ initialValues, onSubmit, submitLabel = "Kaydet" }) {
  const [form, setForm] = useState({
    ...initialState,
    ...initialValues,
    sourceName: normalizeSourceName(initialValues?.sourceName),
    contentImages: normalizeContentImages(initialValues?.contentImages),
    publishedAt: toInputDateTime(initialValues?.publishedAt)
  });
  const [uploading, setUploading] = useState(false);
  const [coverDragActive, setCoverDragActive] = useState(false);
  const [galleryDragActive, setGalleryDragActive] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const contentFileInputRef = useRef(null);
  const contentTextareaRef = useRef(null);

  const imageSuggestions = CATEGORY_IMAGE_SUGGESTIONS[form.category] || [];
  const previewTags = Array.isArray(form.tags)
    ? form.tags
    : String(form.tags)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
  const videoEmbedUrl = getVideoEmbedUrl(form.videoUrl);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  function updateContentImages(value) {
    setForm((current) => ({
      ...current,
      contentImages: normalizeContentImages(value)
    }));
  }

  function applySuggestedImage(imageUrl) {
    setForm((current) => ({ ...current, imageUrl }));
  }

  async function uploadSingleFile(file) {
    const data = new FormData();
    data.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: data
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message || "Yükleme başarısız.");
    }

    return payload.url;
  }

  async function uploadFiles(files, applyUpload) {
    if (!files?.length) return;

    setUploading(true);
    setError("");

    try {
      const urls = [];

      for (const file of files) {
        const url = await uploadSingleFile(file);
        urls.push(url);
      }

      applyUpload(urls);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
      setCoverDragActive(false);
      setGalleryDragActive(false);
    }
  }

  async function handleCoverUpload(event) {
    const file = event.target.files?.[0];
    await uploadFiles(file ? [file] : [], (urls) => {
      setForm((current) => ({ ...current, imageUrl: urls[0] || current.imageUrl }));
    });
  }

  async function handleContentImageUpload(event) {
    const files = Array.from(event.target.files || []);
    await uploadFiles(files, (urls) => {
      setForm((current) => ({
        ...current,
        contentImages: [...current.contentImages, ...urls]
      }));
    });
  }

  function handleCoverDrop(event) {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files || []).slice(0, 1);
    uploadFiles(files, (urls) => {
      setForm((current) => ({ ...current, imageUrl: urls[0] || current.imageUrl }));
    });
  }

  function handleGalleryDrop(event) {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files || []);
    uploadFiles(files, (urls) => {
      setForm((current) => ({
        ...current,
        contentImages: [...current.contentImages, ...urls]
      }));
    });
  }

  function replaceSelection(replacementBuilder) {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? form.content.length;
    const end = textarea.selectionEnd ?? form.content.length;
    const selected = form.content.slice(start, end);
    const replacement = replacementBuilder(selected);
    const nextContent = `${form.content.slice(0, start)}${replacement}${form.content.slice(end)}`;

    setForm((current) => ({
      ...current,
      content: nextContent
    }));

    window.requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + replacement.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function wrapSelection(before, after = before) {
    replaceSelection((selected) => `${before}${selected || "metin"}${after}`);
  }

  function applyBlockPrefix(prefix, fallbackText) {
    replaceSelection((selected) => {
      const value = selected || fallbackText;
      return `${prefix}${value}`;
    });
  }

  function insertListTemplate(type) {
    if (type === "ordered") {
      replaceSelection((selected) => {
        if (selected) {
          return selected
            .split("\n")
            .filter(Boolean)
            .map((item, index) => `${index + 1}. ${item}`)
            .join("\n");
        }

        return "1. Birinci madde\n2. İkinci madde\n3. Üçüncü madde";
      });
      return;
    }

    replaceSelection((selected) => {
      if (selected) {
        return selected
          .split("\n")
          .filter(Boolean)
          .map((item) => `- ${item}`)
          .join("\n");
      }

      return "- Birinci madde\n- İkinci madde\n- Üçüncü madde";
    });
  }

  function insertImageMarker(index) {
    const marker = `[[gorsel-${index + 1}]]`;
    replaceSelection((selected) => `${selected}${selected ? "\n" : ""}${marker}`);
  }

  function removeContentImage(index) {
    setForm((current) => ({
      ...current,
      contentImages: current.contentImages.filter((_, imageIndex) => imageIndex !== index)
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await onSubmit({
        ...form,
        sourceName: normalizeSourceName(form.sourceName),
        contentImages: normalizeContentImages(form.contentImages),
        tags: previewTags,
        publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null
      });
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return (
    <form className="admin-form admin-form-pro news-editor-shell" onSubmit={handleSubmit}>
      <div className="news-editor-main">
        <section className="panel panel-elevated">
          <div className="panel-head panel-head-spread">
            <div>
              <h2>Temel Bilgiler</h2>
              <p className="homepage-preview-note">
                Manşet, Öne Çıkan ve Sürmanşet artık kategori mantığıyla çalışır.
              </p>
            </div>
            <span className="editor-chip">Editoryal Akış</span>
          </div>

          <div className="form-grid form-grid-3">
            <label>
              <span>Başlık</span>
              <input name="title" value={form.title} onChange={updateField} required />
            </label>
            <label>
              <span>Kategori</span>
              <select name="category" value={form.category} onChange={updateField}>
                {NEWS_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Durum</span>
              <select name="status" value={form.status} onChange={updateField}>
                <option value="draft">Taslak</option>
                <option value="pending">Onay Bekliyor</option>
                <option value="published">Yayında</option>
              </select>
            </label>
          </div>

          <label>
            <span>Özet</span>
            <textarea name="excerpt" value={form.excerpt} onChange={updateField} rows={4} required />
          </label>
        </section>

        <section className="panel panel-elevated">
          <div className="panel-head panel-head-spread">
            <div>
              <h2>İçerik Editörü</h2>
              <p className="homepage-preview-note">
                Görseli sürükleyip bırak, başlık ekle, liste oluştur ve içerik görsellerini istediğin noktaya yerleştir.
              </p>
            </div>
            <span className="editor-chip">Canlı Yazım</span>
          </div>

          <div className="content-toolbar content-toolbar-pro">
            <div className="content-toolbar-actions content-toolbar-actions-wide">
              <button type="button" className="button button-outline" onClick={() => wrapSelection("**")}>
                Kalın
              </button>
              <button type="button" className="button button-outline" onClick={() => wrapSelection("*")}>
                İtalik
              </button>
              <button type="button" className="button button-outline" onClick={() => applyBlockPrefix("## ", "Ara Başlık")}>
                H2
              </button>
              <button type="button" className="button button-outline" onClick={() => applyBlockPrefix("### ", "Kısa Başlık")}>
                H3
              </button>
              <button type="button" className="button button-outline" onClick={() => applyBlockPrefix("> ", "Alıntı satırı")}>
                Alıntı
              </button>
              <button type="button" className="button button-outline" onClick={() => insertListTemplate("unordered")}>
                Madde Listesi
              </button>
              <button type="button" className="button button-outline" onClick={() => insertListTemplate("ordered")}>
                Numaralı Liste
              </button>
            </div>
          </div>

          <label>
            <span>İçerik</span>
            <textarea ref={contentTextareaRef} name="content" value={form.content} onChange={updateField} rows={20} required />
          </label>

          <div className="editor-guides">
            <div className="editor-guide-card">
              <strong>Biçim örnekleri</strong>
              <span>**kalın**, *italik*, ## ara başlık, ### kısa başlık, &gt; alıntı, - liste, 1. numaralı liste</span>
            </div>
            <div className="editor-guide-card">
              <strong>İçerik görseli</strong>
              <span>Metne [[gorsel-1]], [[gorsel-2]] gibi işaret bırak. Hangi görselin nereye gireceğini alttaki kartlardan seçebilirsin.</span>
            </div>
          </div>
        </section>

        <section className="panel panel-elevated">
          <div className="panel-head panel-head-spread">
            <div>
              <h2>Kapak Görseli</h2>
              <p className="homepage-preview-note">
                Önerilen oran 1280x720 px. Bu ölçü manşet ve sürmanşette doğrudan temiz oturur.
              </p>
            </div>
            <span className="editor-chip">16:9 Kapak</span>
          </div>

          <div className="form-grid">
            <label>
              <span>Görsel URL</span>
              <input name="imageUrl" value={form.imageUrl} onChange={updateField} />
            </label>
            <label>
              <span>Dosyadan Yükle</span>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCoverUpload} />
            </label>
          </div>

          <button
            type="button"
            className={`dropzone dropzone-large ${coverDragActive ? "dropzone-active" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setCoverDragActive(true);
            }}
            onDragLeave={() => setCoverDragActive(false)}
            onDrop={handleCoverDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <strong>Kapak görselini buraya sürükleyip bırak</strong>
            <span>İstersen tıklayıp cihazından seç. Sistem tek kapak görseli kullanır.</span>
          </button>

          <div className="image-suggestions">
            <div className="image-suggestions-head">
              <span>Hızlı kapak önerileri</span>
              <small>{form.category} kategorisi için hazır görseller</small>
            </div>
            <div className="image-suggestion-grid">
              {imageSuggestions.map((imageUrl, index) => (
                <button
                  key={`${form.category}-${index}`}
                  type="button"
                  className={`image-suggestion-card ${form.imageUrl === imageUrl ? "image-suggestion-card-active" : ""}`}
                  onClick={() => applySuggestedImage(imageUrl)}
                >
                  <img src={imageUrl} alt={`${form.category} kapak önerisi ${index + 1}`} />
                  <span>{form.imageUrl === imageUrl ? "Seçili görsel" : "Bunu kullan"}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="panel panel-elevated">
          <div className="panel-head panel-head-spread">
            <div>
              <h2>İçerik Görselleri</h2>
              <p className="homepage-preview-note">
                Buraya birden fazla görsel bırakabilirsin. Yüklenen her görsel küçük kart halinde görünür.
              </p>
            </div>
            <span className="editor-chip">Sürükle Bırak</span>
          </div>

          <div className="form-grid">
            <label>
              <span>URL Listesi</span>
              <textarea
                rows={5}
                value={form.contentImages.join("\n")}
                onChange={(event) => updateContentImages(event.target.value)}
                placeholder="https://.../gorsel-1.jpg&#10;https://.../gorsel-2.jpg"
              />
            </label>
            <label>
              <span>Çoklu Görsel Yükle</span>
              <input ref={contentFileInputRef} type="file" accept="image/*" multiple onChange={handleContentImageUpload} />
            </label>
          </div>

          <button
            type="button"
            className={`dropzone dropzone-large ${galleryDragActive ? "dropzone-active" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setGalleryDragActive(true);
            }}
            onDragLeave={() => setGalleryDragActive(false)}
            onDrop={handleGalleryDrop}
            onClick={() => contentFileInputRef.current?.click()}
          >
            <strong>İçerik fotoğraflarını toplu halde bırak</strong>
            <span>Birden fazla görsel yükleyebilirsin. Kartlardaki “Metne Ekle” ile tam yerine yerleştirilir.</span>
          </button>

          {form.contentImages.length ? (
            <div className="content-image-list content-image-list-pro">
              {form.contentImages.map((imageUrl, index) => (
                <article key={`${imageUrl}-${index}`} className="content-image-card">
                  <img src={imageUrl} alt={`İçerik görseli ${index + 1}`} />
                  <div className="content-image-card-copy">
                    <strong>{`[[gorsel-${index + 1}]]`}</strong>
                    <div className="list-actions">
                      <button type="button" className="button button-outline" onClick={() => insertImageMarker(index)}>
                        Metne Ekle
                      </button>
                      <button type="button" className="button button-danger" onClick={() => removeContentImage(index)}>
                        Kaldır
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-state">Henüz içerik görseli eklenmedi.</p>
          )}
        </section>

        <section className="panel panel-elevated">
          <div className="panel-head">
            <h2>Kaynak ve Yayın Ayarları</h2>
          </div>
          <div className="form-grid form-grid-3">
            <label>
              <span>Kaynak Adı</span>
              <input name="sourceName" value={form.sourceName} onChange={updateField} />
            </label>
            <label>
              <span>Kaynak Linki</span>
              <input name="sourceUrl" value={form.sourceUrl} onChange={updateField} />
            </label>
            <label>
              <span>Yayın Tarihi</span>
              <input type="datetime-local" name="publishedAt" value={form.publishedAt} onChange={updateField} />
            </label>
          </div>

          <div className="form-grid form-grid-3">
            <label>
              <span>Video / Embed Linki</span>
              <input
                name="videoUrl"
                value={form.videoUrl}
                onChange={updateField}
                placeholder="YouTube, Vimeo veya iframe kodu"
              />
            </label>
            <label>
              <span>Etiketler</span>
              <input
                name="tags"
                value={Array.isArray(form.tags) ? form.tags.join(", ") : form.tags}
                onChange={updateField}
                placeholder="sivas, belediye, spor"
              />
            </label>
            <label>
              <span>Slug Önizleme</span>
              <input value={slugify(form.title)} readOnly />
            </label>
          </div>

          <div className="form-grid form-grid-3">
            <label className="checkbox-row checkbox-row-card">
              <input type="checkbox" name="isFeatured" checked={Boolean(form.isFeatured)} onChange={updateField} />
              <span>Bu haberi ayrıca öne çıkar</span>
            </label>
            <div className="form-note-card">
              <strong>Okuma Süresi</strong>
              <span>{estimateReadingMinutes(form.content)} dk</span>
            </div>
            <div className="form-note-card">
              <strong>Video Durumu</strong>
              <span>{videoEmbedUrl ? "Embed hazır" : "Video eklenmedi"}</span>
            </div>
          </div>
        </section>

        {uploading ? <p className="form-info">Görseller yükleniyor...</p> : null}
        {error ? <p className="form-error">{error}</p> : null}

        <div className="news-editor-submit">
          <button type="submit" className="button">
            {submitLabel}
          </button>
        </div>
      </div>

      <aside className="news-editor-sidebar">
        <section className="panel panel-elevated panel-sticky">
          <div className="panel-head panel-head-spread">
            <div>
              <h2>Canlı Önizleme</h2>
              <p className="homepage-preview-note">Kapak, başlık, özet ve içerik akışı burada görünür.</p>
            </div>
            <span className="editor-chip">Ön İzleme</span>
          </div>

          <article className="news-form-preview news-form-preview-pro">
            <img src={form.imageUrl || "/logo.svg"} alt={form.title || "Kapak ön izleme"} className="news-form-preview-image" />
            <div className="news-form-preview-copy">
              <span className="news-badge">{form.category}</span>
              <strong>{form.title || "Başlık burada görünecek"}</strong>
              <p>{form.excerpt || "Haber özeti burada görünecek."}</p>
              <PreviewBody content={form.content} />
              {videoEmbedUrl ? (
                <div className="news-form-embed">
                  <iframe
                    src={videoEmbedUrl}
                    title="Video ön izleme"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : null}
              {form.contentImages.length ? (
                <div className="preview-inline-images">
                  {form.contentImages.slice(0, 4).map((imageUrl, index) => (
                    <img key={`${imageUrl}-${index}`} src={imageUrl} alt={`İçerik görseli ön izleme ${index + 1}`} />
                  ))}
                </div>
              ) : null}
              <div className="tag-row">
                {previewTags.length ? (
                  previewTags.map((tag) => (
                    <span key={tag} className="tag-pill">
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="tag-pill">#etiket</span>
                )}
              </div>
            </div>
          </article>
        </section>
      </aside>
    </form>
  );
}
