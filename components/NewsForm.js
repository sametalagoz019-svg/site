import { useEffect, useMemo, useRef, useState } from "react";
import BlockEditor from "./BlockEditor";
import { DEFAULT_COVER_IMAGE_GUIDE, EDITORIAL_IMAGE_GUIDES, NEWS_CATEGORIES } from "../lib/constants";
import { slugify } from "../lib/slugify";
import { getVideoEmbedUrl } from "../lib/videoEmbed";

const EDITORIAL_PLACEMENTS = ["Manşet", "Öne Çıkan", "Sürmanşet"];

const FONT_OPTIONS = [
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Georgia", value: "Georgia" },
  { label: "Arial", value: "Arial" },
  { label: "Verdana", value: "Verdana" }
];

const FONT_SIZE_OPTIONS = [
  { label: "12", value: "2" },
  { label: "14", value: "3" },
  { label: "18", value: "4" },
  { label: "24", value: "5" }
];

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
  const words = String(text || "").replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
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

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inlineMarkupToHtml(text = "") {
  let html = escapeHtml(text);
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  return html;
}

function buildLegacyHtml(content = "", contentImages = []) {
  return String(content || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const imageMatch = line.match(/^\[\[gorsel-(\d+)(?:\|(small|medium|large))?\]\]$/i);
      if (imageMatch) {
        const imageUrl = contentImages[Number(imageMatch[1]) - 1];
        if (!imageUrl) return "";

        const size = (imageMatch[2] || "medium").toLowerCase();
        return `<figure class="detail-inline-image detail-inline-image-${size}"><img src="${escapeHtml(
          imageUrl
        )}" alt="" /></figure>`;
      }

      if (line.startsWith("### ")) {
        return `<h3>${inlineMarkupToHtml(line.slice(4))}</h3>`;
      }

      if (line.startsWith("## ")) {
        return `<h2>${inlineMarkupToHtml(line.slice(3))}</h2>`;
      }

      if (line.startsWith("> ")) {
        return `<blockquote>${inlineMarkupToHtml(line.slice(2))}</blockquote>`;
      }

      if (line.startsWith("- ")) {
        return `<ul><li>${inlineMarkupToHtml(line.slice(2))}</li></ul>`;
      }

      if (/^\d+\.\s/.test(line)) {
        return `<ol><li>${inlineMarkupToHtml(line.replace(/^\d+\.\s/, ""))}</li></ol>`;
      }

      return `<p>${inlineMarkupToHtml(line)}</p>`;
    })
    .filter(Boolean)
    .join("");
}

function contentToEditorHtml(content = "", contentImages = []) {
  const raw = String(content || "").trim();
  if (!raw) return "<p></p>";

  if (/<[a-z][\s\S]*>/i.test(raw)) {
    return raw;
  }

  return buildLegacyHtml(raw, contentImages) || "<p></p>";
}

function createAssetMeta(url, meta = {}, typeOverride = "") {
  const cleanUrl = String(url || "").trim();
  const originalFilename =
    meta.originalFilename || cleanUrl.split("/").pop()?.split("?")[0] || "dosya";
  const mimeType = String(meta.mimeType || "");
  const lowerName = originalFilename.toLowerCase();
  const extension = lowerName.includes(".") ? lowerName.split(".").pop() : "";
  let type = typeOverride || "file";

  if (!typeOverride) {
    if (mimeType.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(extension)) {
      type = "image";
    } else if (["doc", "docx", "txt", "md"].includes(extension)) {
      type = "document";
    } else if (["xls", "xlsx", "csv"].includes(extension)) {
      type = "spreadsheet";
    } else if (extension === "pdf") {
      type = "pdf";
    }
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

function normalizeEditorHtmlForSave(html = "") {
  return String(html || "").replace(/<img([^>]*?)src="[^"]*"([^>]*?)data-media-url="([^"]+)"([^>]*?)>/gi, '<img$1src="$3"$2data-media-url="$3"$4>');
}

function StatusBadge({ status }) {
  const labels = {
    draft: "Taslak",
    pending: "Onay Bekliyor",
    published: "Yayında"
  };

  return <span className={`editor-status-badge editor-status-${status}`}>{labels[status] || status}</span>;
}

export default function NewsForm({ initialValues, onSubmit, submitLabel = "Kaydet" }) {
  const isEditing = Boolean(initialValues?._id);
  const normalizedInitialImages = normalizeContentImages(initialValues?.contentImages);
  const [form, setForm] = useState({
    ...initialState,
    ...initialValues,
    sourceName: normalizeSourceName(initialValues?.sourceName),
    contentImages: normalizedInitialImages,
    publishedAt: toInputDateTime(initialValues?.publishedAt)
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [coverDragActive, setCoverDragActive] = useState(false);
  const [assetDragActive, setAssetDragActive] = useState(false);
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
  const [fontSize, setFontSize] = useState(FONT_SIZE_OPTIONS[1].value);
  const [assets, setAssets] = useState(() => normalizedInitialImages.map((url) => createAssetMeta(url, {}, "image")));
  const coverFileInputRef = useRef(null);
  const assetFileInputRef = useRef(null);
  const editorRef = useRef(null);
  const editorInitializedRef = useRef(false);
  const uploadedFileMapRef = useRef({});
  const savedSelectionRef = useRef(null);
  const draggedEditorMediaRef = useRef(null);

  const videoEmbedUrl = getVideoEmbedUrl(form.videoUrl);
  const isEditorialPlacement = EDITORIAL_PLACEMENTS.includes(form.category);
  const coverImageGuide = EDITORIAL_IMAGE_GUIDES[form.category] || DEFAULT_COVER_IMAGE_GUIDE;
  const slugPreview = slugify(form.title) || "-";
  const contentImageUrls = useMemo(
    () => assets.filter((asset) => asset.type === "image").map((asset) => asset.url),
    [assets]
  );

  useEffect(() => {
    if (!editorRef.current || editorInitializedRef.current) return;

    document.execCommand("styleWithCSS", false, true);
    editorRef.current.innerHTML = contentToEditorHtml(form.content, normalizedInitialImages);
    editorInitializedRef.current = true;
  }, [form.content, normalizedInitialImages]);

  function syncEditorContent() {
    if (!editorRef.current) return;

    const html = editorRef.current.innerHTML === "<br>" ? "" : normalizeEditorHtmlForSave(editorRef.current.innerHTML);
    setForm((current) => ({
      ...current,
      content: html
    }));
  }

  function saveSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return;

    const range = selection.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) return;

    savedSelectionRef.current = range.cloneRange();
  }

  function restoreSelection() {
    if (!savedSelectionRef.current) return;

    const selection = window.getSelection();
    if (!selection) return;

    selection.removeAllRanges();
    selection.addRange(savedSelectionRef.current);
  }

  function getEditorRangeFromPoint(clientX, clientY) {
    if (document.caretRangeFromPoint) {
      return document.caretRangeFromPoint(clientX, clientY);
    }

    if (document.caretPositionFromPoint) {
      const position = document.caretPositionFromPoint(clientX, clientY);
      if (!position) return null;

      const range = document.createRange();
      range.setStart(position.offsetNode, position.offset);
      range.collapse(true);
      return range;
    }

    return null;
  }

  function setSelectionRange(range) {
    if (!range) return;

    const selection = window.getSelection();
    if (!selection) return;

    selection.removeAllRanges();
    selection.addRange(range);
    savedSelectionRef.current = range.cloneRange();
  }

  function createRangeAtEditorEnd() {
    if (!editorRef.current) return null;

    const range = document.createRange();
    range.selectNodeContents(editorRef.current);
    range.collapse(false);
    return range;
  }

  function toggleInlineTag(tagName) {
    if (!editorRef.current) return;

    editorRef.current.focus();
    restoreSelection();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed || !editorRef.current.contains(range.commonAncestorContainer)) return;

    const selectedText = range.toString();
    const wrapper = document.createElement(tagName);
    wrapper.textContent = selectedText;

    range.deleteContents();
    range.insertNode(wrapper);

    const nextRange = document.createRange();
    nextRange.selectNodeContents(wrapper);
    setSelectionRange(nextRange);
    syncEditorContent();
  }

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  function setCategoryValue(category) {
    setForm((current) => ({
      ...current,
      category
    }));
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

    uploadedFileMapRef.current[payload.url] = file;
    return payload;
  }

  async function uploadFiles(files) {
    if (!files?.length) return [];

    setUploading(true);
    setError("");

    try {
      const uploadedAssets = [];

      for (const file of files) {
        const uploadedFile = await uploadSingleFile(file);
        uploadedAssets.push(createAssetMeta(uploadedFile.url, { ...uploadedFile, previewUrl: URL.createObjectURL(file) }));
      }

      return uploadedAssets;
    } catch (uploadError) {
      setError(uploadError.message || "Yükleme başarısız.");
      return [];
    } finally {
      setUploading(false);
      setCoverDragActive(false);
      setAssetDragActive(false);
    }
  }

  async function handleCoverUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const uploadedAssets = await uploadFiles([file]);
    if (uploadedAssets[0]) {
      setForm((current) => ({
        ...current,
        imageUrl: uploadedAssets[0].url
      }));
    }

    event.target.value = "";
  }

  async function handleAssetUpload(event) {
    const files = Array.from(event.target.files || []);
    const uploadedAssets = await uploadFiles(files);
    if (!uploadedAssets.length) return;

    setAssets((current) => [...current, ...uploadedAssets]);
    setForm((current) => ({
      ...current,
      contentImages: [...current.contentImages, ...uploadedAssets.filter((asset) => asset.type === "image").map((asset) => asset.url)]
    }));
    event.target.value = "";
  }

  function insertHtmlAtCursor(html) {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();

    const selection = window.getSelection();
    let range = selection && selection.rangeCount ? selection.getRangeAt(0) : null;

    if (!range || !editorRef.current.contains(range.commonAncestorContainer)) {
      range = createRangeAtEditorEnd();
      setSelectionRange(range);
    }

    if (!range) return;

    range.deleteContents();
    const fragment = range.createContextualFragment(html);
    const lastNode = fragment.lastChild;
    range.insertNode(fragment);

    if (lastNode) {
      const nextRange = document.createRange();
      nextRange.setStartAfter(lastNode);
      nextRange.collapse(true);
      setSelectionRange(nextRange);
    } else {
      saveSelection();
    }

    syncEditorContent();
  }

  function insertParagraphSpacer() {
    insertHtmlAtCursor("<p><br></p>");
  }

  function applyCommand(command, value = null) {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();
    document.execCommand(command, false, value);
    saveSelection();
    syncEditorContent();
  }

  function applyHeading(tag) {
    applyCommand("formatBlock", tag);
  }

  function applyBold() {
    toggleInlineTag("strong");
  }

  function applyItalic() {
    toggleInlineTag("em");
  }

  function handleAssetDrop(event) {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files || []);
    handleAssetUpload({ target: { files, value: "" } });
  }

  function handleCoverDrop(event) {
    event.preventDefault();
    const file = Array.from(event.dataTransfer.files || []).find((item) => item.type.startsWith("image/"));
    if (!file) return;
    handleCoverUpload({ target: { files: [file], value: "" } });
  }

  function formatFileSize(size) {
    if (!size) return "Yeni dosya";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  function insertImageAsset(asset, size = "medium") {
    insertHtmlAtCursor(
      `<div class="editor-media-block editor-media-block-${size}" contenteditable="false" draggable="true" data-editor-media="image">
        <img src="${escapeHtml(asset.previewUrl || asset.url)}" data-media-url="${escapeHtml(asset.url)}" alt="${escapeHtml(
        asset.originalFilename
      )}" />
      </div><p><br></p>`
    );
  }

  function insertFileAsset(asset) {
    insertHtmlAtCursor(
      `<p><a href="${escapeHtml(asset.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
        asset.originalFilename
      )}</a></p><p><br></p>`
    );
  }

  async function importDocumentToEditor(asset) {
    const file = uploadedFileMapRef.current[asset.url];
    if (!file) {
      setError("Bu belge yalnızca yeni yüklendiğinde metne içe aktarılabilir. Eski kayıtlar için link ekleyin.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const data = new FormData();
      data.append("file", file);

      const response = await fetch("/api/admin/import-document", {
        method: "POST",
        body: data
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Belge içeri aktarılırken hata oluştu.");
      }

      const html = payload.text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `<p>${escapeHtml(line)}</p>`)
        .join("");

      insertHtmlAtCursor(`${html}<p><br></p>`);
    } catch (importError) {
      setError(importError.message || "Belge içeri aktarılamadı.");
    } finally {
      setUploading(false);
    }
  }

  function removeAsset(assetUrl) {
    setAssets((current) => current.filter((asset) => asset.url !== assetUrl));
    setForm((current) => ({
      ...current,
      contentImages: current.contentImages.filter((item) => item !== assetUrl)
    }));
    delete uploadedFileMapRef.current[assetUrl];
  }

  function insertVideoEmbed() {
    if (!videoEmbedUrl) {
      setError("Önce geçerli bir video linki girin.");
      return;
    }

    insertHtmlAtCursor(
      `<div class="detail-clean-video"><div class="detail-clean-video-frame"><iframe src="${escapeHtml(
        videoEmbedUrl
      )}" title="Haber videosu" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div></div><p><br></p>`
    );
  }

  function handleAssetCardDragStart(event, asset, mode = "default") {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(
      "application/x-admin-asset",
      JSON.stringify({
        url: asset.url,
        name: asset.originalFilename,
        type: asset.type,
        mode
      })
    );
  }

  function handleEditorDragOver(event) {
    if (
      event.dataTransfer.types.includes("application/x-admin-asset") ||
      event.dataTransfer.types.includes("application/x-editor-media")
    ) {
      event.preventDefault();
    }
  }

  function handleEditorDrop(event) {
    const rawAsset = event.dataTransfer.getData("application/x-admin-asset");
    const isInternalMediaMove = event.dataTransfer.types.includes("application/x-editor-media");
    if (!rawAsset && !isInternalMediaMove) return;

    event.preventDefault();

    try {
      const dropRange = getEditorRangeFromPoint(event.clientX, event.clientY);
      if (dropRange && editorRef.current?.contains(dropRange.startContainer)) {
        setSelectionRange(dropRange);
      }

      if (isInternalMediaMove && draggedEditorMediaRef.current) {
        const mediaNode = draggedEditorMediaRef.current;
        const range = savedSelectionRef.current;

        if (range) {
          range.insertNode(mediaNode);
          const spacer = document.createElement("p");
          spacer.innerHTML = "<br>";
          range.setStartAfter(mediaNode);
          range.collapse(true);
          range.insertNode(spacer);
          const nextRange = document.createRange();
          nextRange.setStartAfter(spacer);
          nextRange.collapse(true);
          setSelectionRange(nextRange);
        }

        draggedEditorMediaRef.current = null;
        syncEditorContent();
        return;
      }

      const asset = JSON.parse(rawAsset);

      if (asset.type === "image") {
        insertHtmlAtCursor(
          `<figure class="detail-inline-image detail-inline-image-medium"><img src="${escapeHtml(
            asset.url
          )}" alt="${escapeHtml(asset.name)}" /></figure><p><br></p>`
        );
        return;
      }

      insertHtmlAtCursor(
        `<p><a href="${escapeHtml(asset.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
          asset.name
        )}</a></p><p><br></p>`
      );
    } catch (dropError) {
      setError("Dosya içerik alanına eklenemedi.");
    }
  }

  function handleEditorMediaDragStart(event) {
    const mediaBlock = event.target.closest("[data-editor-media]");
    if (!mediaBlock || !editorRef.current?.contains(mediaBlock)) return;

    draggedEditorMediaRef.current = mediaBlock;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-editor-media", "move");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    syncEditorContent();

    try {
      await onSubmit({
        ...form,
        sourceName: normalizeSourceName(form.sourceName),
        content: form.content,
        contentImages: contentImageUrls,
        tags: Array.isArray(form.tags)
          ? form.tags
          : String(form.tags)
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
        publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null
      });
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return (
    <form className="admin-form admin-form-pro news-editor-shell" onSubmit={handleSubmit}>
      <div className="news-editor-main">
        <div className="news-editor-header">
          <div className="news-editor-breadcrumbs">
            <span>İçerik</span>
            <span>/</span>
            <span>Haber</span>
            <span>/</span>
            <span>{isEditing ? "Haberi Düzenle" : "Yeni Haber"}</span>
          </div>
          <h2 className="news-editor-screen-title">{isEditing ? "Haberi Düzenle" : "Yeni Haber"}</h2>
        </div>

        <section className="panel panel-elevated news-editor-primary">
          <div className="news-editor-field-stack">
            <label className="news-editor-title-field">
              <span className="editor-field-label">
                BAŞLIK <small>A / A</small>
              </span>
              <input
                className="news-editor-title-input"
                name="title"
                value={form.title}
                onChange={updateField}
                placeholder="Haber başlığını yazın"
                required
              />
            </label>
            <label className="news-editor-excerpt-field">
              <span className="editor-field-label">
                AÇIKLAMA <small>A / A</small>
              </span>
              <textarea
                className="news-editor-excerpt-input"
                name="excerpt"
                value={form.excerpt}
                onChange={updateField}
                rows={5}
                placeholder="Habere kısa bir giriş yazın"
                required
              />
            </label>
          </div>
        </section>

        <section className="panel panel-elevated">
          <span className="editor-field-label">
            İÇERİK <small>A / A</small>
          </span>

          <div className="content-toolbar content-toolbar-pro content-toolbar-rich">
            <div className="content-toolbar-group">
              <select value={fontFamily} onChange={(event) => {
                const nextValue = event.target.value;
                setFontFamily(nextValue);
                applyCommand("fontName", nextValue);
              }}>
                {FONT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select value={fontSize} onChange={(event) => {
                const nextValue = event.target.value;
                setFontSize(nextValue);
                applyCommand("fontSize", nextValue);
              }}>
                {FONT_SIZE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button type="button" className="toolbar-button toolbar-button-select" onMouseDown={(event) => event.preventDefault()} onClick={() => applyHeading("h2")}>
                H2
              </button>
              <button type="button" className="toolbar-button toolbar-button-select" onMouseDown={(event) => event.preventDefault()} onClick={() => applyHeading("h3")}>
                H3
              </button>
            </div>
            <div className="content-toolbar-divider" />
            <div className="content-toolbar-actions content-toolbar-actions-wide">
              <button type="button" className="toolbar-button" onMouseDown={(event) => event.preventDefault()} onClick={applyBold}>
                B
              </button>
              <button type="button" className="toolbar-button" onMouseDown={(event) => event.preventDefault()} onClick={applyItalic}>
                I
              </button>
              <button type="button" className="toolbar-button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyCommand("insertUnorderedList")}>
                ≡
              </button>
              <button type="button" className="toolbar-button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyCommand("insertOrderedList")}>
                1.
              </button>
              <button
                type="button"
                className="toolbar-button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  const url = window.prompt("Bağlantı adresini girin");
                  if (url) applyCommand("createLink", url);
                }}
              >
                Link
              </button>
              <button type="button" className="toolbar-button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyHeading("blockquote")}>
                Quote
              </button>
              <button type="button" className="toolbar-button" onMouseDown={(event) => event.preventDefault()} onClick={insertParagraphSpacer}>
                Satır
              </button>
            </div>
          </div>

          <div
            ref={editorRef}
            className="news-editor-content-surface"
            contentEditable
            suppressContentEditableWarning
            onInput={syncEditorContent}
            onBlur={syncEditorContent}
            onFocus={saveSelection}
            onKeyUp={saveSelection}
            onMouseUp={saveSelection}
            onDragStart={handleEditorMediaDragStart}
            onDragOver={handleEditorDragOver}
            onDrop={handleEditorDrop}
          />
        </section>
      </div>

      <aside className="news-editor-sidebar">
        <section className="panel panel-elevated news-editor-sidebar-panel">
          <div className="panel-head panel-head-spread">
            <div>
              <h2>Kapak Görseli</h2>
            </div>
          </div>

          <div className="news-editor-sidebar-stack">
            <label>
              <span>Kapak URL</span>
              <input name="imageUrl" value={form.imageUrl} onChange={updateField} placeholder="https://..." />
            </label>
            <label>
              <span>Kapak Dosyası</span>
              <input ref={coverFileInputRef} type="file" accept="image/*" onChange={handleCoverUpload} />
            </label>
            <div className="editor-guide-card news-image-guide">
              <strong>{coverImageGuide.label} Kapak Oranı</strong>
              <span>{coverImageGuide.ratio} • {coverImageGuide.size} px</span>
              <small>{coverImageGuide.note}</small>
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
              onClick={() => coverFileInputRef.current?.click()}
            >
              <strong>Kapak görselini ekleyin</strong>
              <span>Kapak için görsel yükleyin veya sürükleyip bırakın.</span>
            </button>

            {form.imageUrl ? (
              <div className="cover-preview-card">
                <img src={form.imageUrl} alt="Kapak önizleme" />
              </div>
            ) : null}
          </div>
        </section>

        <section className="panel panel-elevated news-editor-sidebar-panel">
          <div className="panel-head panel-head-spread">
            <div>
              <h2>Dosya Ekleme</h2>
            </div>
          </div>

          <div className="news-editor-sidebar-stack">
            <label>
              <span>Dosya Seç</span>
              <input
                ref={assetFileInputRef}
                type="file"
                accept="image/*,.doc,.docx,.txt,.md,.pdf,.xls,.xlsx,.csv"
                multiple
                onChange={handleAssetUpload}
              />
            </label>

            <button
              type="button"
              className={`dropzone dropzone-large ${assetDragActive ? "dropzone-active" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setAssetDragActive(true);
              }}
              onDragLeave={() => setAssetDragActive(false)}
              onDrop={handleAssetDrop}
              onClick={() => assetFileInputRef.current?.click()}
            >
              <strong>Fotoğraf, Word, Excel veya PDF ekleyin</strong>
              <span>Yüklediğiniz dosyayı istersen içerikte gösterebilir, link verebilir veya metne aktarabilirsiniz.</span>
            </button>

            {assets.length ? (
              <div className="content-image-list content-image-list-pro asset-library-list">
                {assets.map((asset) => (
                  <article
                    key={asset.url}
                    className="content-image-card asset-library-card"
                    draggable
                    onDragStart={(event) => handleAssetCardDragStart(event, asset)}
                  >
                    {asset.type === "image" ? (
                      <img src={asset.previewUrl || asset.url} alt={asset.originalFilename} />
                    ) : (
                      <div className="asset-file-icon">{asset.originalFilename.split(".").pop()?.toUpperCase() || "DOSYA"}</div>
                    )}

                    <div className="content-image-card-copy">
                      <strong>{asset.originalFilename}</strong>
                      <span className="content-image-meta">
                        {formatFileSize(asset.size)}
                        {asset.mimeType ? ` • ${asset.mimeType}` : ""}
                      </span>

                      {asset.type === "image" ? (
                        <div className="content-image-size-actions">
                          <button type="button" className="button button-outline" onClick={() => insertImageAsset(asset, "small")}>
                            Küçük
                          </button>
                          <button type="button" className="button button-outline" onClick={() => insertImageAsset(asset, "medium")}>
                            Orta
                          </button>
                          <button type="button" className="button button-outline" onClick={() => insertImageAsset(asset, "large")}>
                            Büyük
                          </button>
                        </div>
                      ) : null}

                      <div className="list-actions">
                        {asset.type === "image" ? (
                          <button type="button" className="button button-outline" onClick={() => insertImageAsset(asset, "medium")}>
                            İçeriğe Ekle
                          </button>
                        ) : null}
                        {asset.type === "document" ? (
                          <button type="button" className="button button-outline" onClick={() => importDocumentToEditor(asset)}>
                            Metne Aktar
                          </button>
                        ) : null}
                        <button type="button" className="button button-outline" onClick={() => insertFileAsset(asset)}>
                          Link Ekle
                        </button>
                        <button type="button" className="button button-danger" onClick={() => removeAsset(asset.url)}>
                          Kaldır
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="panel panel-elevated news-editor-sidebar-panel">
          <div className="panel-head panel-head-spread">
            <div>
              <h2>Yayın</h2>
            </div>
            <StatusBadge status={form.status} />
          </div>

          <div className="news-editor-sidebar-stack">
            <label>
              <span>Durum</span>
              <select name="status" value={form.status} onChange={updateField}>
                <option value="draft">Taslak</option>
                <option value="pending">Onay Bekliyor</option>
                <option value="published">Yayında</option>
              </select>
            </label>
            <label>
              <span>Yayın Tarihi</span>
              <input type="datetime-local" name="publishedAt" value={form.publishedAt} onChange={updateField} />
            </label>
            <div className="news-editor-publish-meta">
              <div className="form-note-card">
                <strong>Okuma Süresi</strong>
                <span>{estimateReadingMinutes(form.content)} dk</span>
              </div>
              <div className="form-note-card">
                <strong>Slug Önizleme</strong>
                <span>{slugPreview}</span>
              </div>
            </div>
          </div>

          {uploading ? <p className="form-info">Dosyalar yükleniyor...</p> : null}
          {error ? <p className="form-error">{error}</p> : null}

          <div className="news-editor-submit news-editor-submit-sidebar">
            <button type="submit" className="button button-primary-strong">
              {submitLabel}
            </button>
          </div>
        </section>

        <section className="panel panel-elevated news-editor-sidebar-panel">
          <div className="panel-head panel-head-spread">
            <div>
              <h2>Editoryal Yerleşim</h2>
            </div>
          </div>

          <div className="news-editor-sidebar-stack">
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

            <div className="editorial-placement-panel">
              <div className="editorial-placement-head">
                <strong>Editoryal Alanlar</strong>
                <span>{isEditorialPlacement ? `${form.category} seçili` : "Standart kategori seçili"}</span>
              </div>
              <div className="editor-guide-card news-image-guide">
                <strong>Aktif Kapak Ölçüsü</strong>
                <span>{coverImageGuide.ratio} • {coverImageGuide.size} px</span>
                <small>{coverImageGuide.note}</small>
              </div>
              <div className="editorial-placement-grid">
                {EDITORIAL_PLACEMENTS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={form.category === item ? "editorial-placement-button is-active" : "editorial-placement-button"}
                    onClick={() => setCategoryValue(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <label className="checkbox-row checkbox-row-card">
              <input type="checkbox" name="isFeatured" checked={Boolean(form.isFeatured)} onChange={updateField} />
              <span>Bu haberi ayrıca öne çıkar</span>
            </label>
          </div>
        </section>

        <section className="panel panel-elevated news-editor-sidebar-panel">
          <div className="panel-head panel-head-spread">
            <div>
              <h2>Ek Bilgiler</h2>
            </div>
          </div>

          <div className="news-editor-sidebar-stack">
            <label>
              <span>Kaynak Adı</span>
              <input name="sourceName" value={form.sourceName} onChange={updateField} />
            </label>
            <label>
              <span>Kaynak Linki</span>
              <input name="sourceUrl" value={form.sourceUrl} onChange={updateField} />
            </label>
            <label>
              <span>Video / Embed Linki</span>
              <input
                name="videoUrl"
                value={form.videoUrl}
                onChange={updateField}
                placeholder="YouTube, Vimeo veya iframe kodu"
              />
            </label>
            <button type="button" className="button button-outline" onClick={insertVideoEmbed}>
              Videoyu İçeriğe Ekle
            </button>
            <label>
              <span>Etiketler</span>
              <input
                name="tags"
                value={Array.isArray(form.tags) ? form.tags.join(", ") : form.tags}
                onChange={updateField}
                placeholder="sivas, belediye, spor"
              />
            </label>
            <div className="form-note-card">
              <strong>Video Durumu</strong>
              <span>{videoEmbedUrl ? "Embed hazır" : "Video eklenmedi"}</span>
            </div>
          </div>
        </section>
      </aside>
    </form>
  );
}
