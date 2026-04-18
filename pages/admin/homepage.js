import { useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { getAdminFromRequest } from "../../lib/auth";
import { EDITORIAL_IMAGE_GUIDES } from "../../lib/constants";
import dbConnect from "../../lib/dbConnect";
import { formatDate } from "../../lib/format";
import {
  buildHomepageData,
  DEFAULT_MODULE_ORDER,
  DEFAULT_SETTINGS,
  MODULE_LABELS,
  PRESET_ORDERS
} from "../../lib/homepageConfig";
import News from "../../models/News";
import SiteSettings from "../../models/SiteSettings";

const SELECTION_GROUPS = [
  {
    key: "editorPickIds",
    label: "Gündem Seçkisi",
    slotLabel: "Seçki Kategorisi",
    limit: 8,
    note: "Ana sayfadaki ek seçki ve küçük akış kartlarını besler."
  },
  {
    key: "galleryIds",
    label: "Foto Galeri",
    slotLabel: "Galeri Kategorisi",
    limit: 3,
    note: "Galeri vitrini için seçilecek kayıtlar."
  },
  {
    key: "videoIds",
    label: "Video Alanı",
    slotLabel: "Video Kategorisi",
    limit: 3,
    note: "Video alanında kullanılacak kayıtlar."
  }
];

function reorderModules(list, fromIndex, toIndex) {
  const next = [...list];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function toggleId(list, id, limit) {
  const key = String(id);

  if (list.includes(key)) {
    return list.filter((item) => item !== key);
  }

  if (list.length >= limit) {
    return [...list.slice(1), key];
  }

  return [...list, key];
}

function PreviewLead({ item, label }) {
  const guide = EDITORIAL_IMAGE_GUIDES["Manşet"];
  if (!item) return <p className="empty-state">Bu slot için yayın bulunamadı.</p>;

  return (
    <article className="homepage-preview-card homepage-preview-lead">
      <span className="homepage-preview-kicker">{label}</span>
      <span className="homepage-preview-guide">Önerilen görsel: {guide.ratio} • {guide.size} px</span>
      <strong>{item.title}</strong>
      <p>{item.excerpt}</p>
    </article>
  );
}

function PreviewList({ title, items, slotLabel, guideKey }) {
  const guide = guideKey ? EDITORIAL_IMAGE_GUIDES[guideKey] : null;
  return (
    <section className="homepage-preview-card">
      <div className="homepage-preview-headline">
        <strong>{title}</strong>
        <span>{items.length} kayıt</span>
      </div>
      {guide ? <p className="homepage-preview-guide">Önerilen görsel: {guide.ratio} • {guide.size} px</p> : null}
      <div className="homepage-preview-list">
        {items.length ? (
          items.slice(0, 6).map((item) => (
            <div key={item._id} className="homepage-preview-list-row">
              <strong>{item.title}</strong>
              <span>
                {slotLabel} • {item.category}
              </span>
            </div>
          ))
        ) : (
          <p className="empty-state">Bu alan boş kalacak.</p>
        )}
      </div>
    </section>
  );
}

function HomepagePreview({ settings, publishedNews }) {
  const preview = buildHomepageData(publishedNews, settings);

  const moduleSummaries = {
    editorialBand: <PreviewList title="Sürmanşet" slotLabel="Sürmanşet Kategorisi" items={preview.surmanset} guideKey="Sürmanşet" />,
    mediaSponsor: (
      <section className="homepage-preview-card">
        <div className="homepage-preview-headline">
          <strong>Kurumsal Alan</strong>
          <span>{preview.videoItems.length + preview.galleryItems.length} medya</span>
        </div>
        <div className="homepage-preview-sponsor">
          <strong>{preview.sponsor.title}</strong>
          <p>{preview.sponsor.text}</p>
          <span>Yan bant: {preview.ads.side.title}</span>
        </div>
      </section>
    ),
    dossiers: (
      <PreviewList
        title="Kategori Vitrini"
        slotLabel="Vitrin Kategorisi"
        items={preview.highlightGroups.flatMap((group) => group.items)}
      />
    ),
    editorPicks: <PreviewList title="Gündem Seçkisi" slotLabel="Seçki Kategorisi" items={preview.superHeadlines} />,
    categoryLanes: <PreviewList title="Öne Çıkan" slotLabel="Öne Çıkan Kategorisi" items={preview.featuredList} guideKey="Öne Çıkan" />,
    newsRiver: <PreviewList title="Son Gelişmeler" slotLabel="Akış Kategorisi" items={preview.newsRiver} />
  };

  return (
    <section className="panel homepage-preview-panel">
      <div className="panel-head">
        <h2>Canlı Önizleme</h2>
        <p className="homepage-preview-note">Kaydetmeden önce mevcut kurgu burada simüle edilir.</p>
      </div>
      <div className="homepage-preview-frame">
        <div className="homepage-preview-topline">
          <span className="homepage-preview-badge">Üst Bant</span>
          <strong>{preview.ads.top.title}</strong>
        </div>
        <div className="homepage-preview-split">
          <PreviewList title="Manşet" slotLabel="Manşet Kategorisi" items={preview.heroItems} guideKey="Manşet" />
          <PreviewList title="Öne Çıkan" slotLabel="Öne Çıkan Kategorisi" items={preview.featuredList} guideKey="Öne Çıkan" />
          <PreviewList title="Sürmanşet" slotLabel="Sürmanşet Kategorisi" items={preview.surmanset} guideKey="Sürmanşet" />
          <PreviewLead item={preview.heroItems[0]} label="Aktif Manşet" />
        </div>
        <div className="homepage-preview-order">
          {preview.moduleOrder.map((moduleKey) => (
            <article key={moduleKey} className="homepage-preview-module">
              <header className="homepage-preview-module-head">
                <span>{MODULE_LABELS[moduleKey]}</span>
              </header>
              {moduleSummaries[moduleKey]}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SelectionBoard({ title, slotLabel, note, fieldKey, limit, settings, setSettings, publishedNews }) {
  const selectedIds = settings[fieldKey] || [];

  return (
    <section className="panel selector-panel">
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          <p className="homepage-preview-note">
            {note} En fazla {limit} kayıt seçilir. Fazla seçimde en eski seçilen kart listeden çıkarılır.
          </p>
        </div>
        <span className="homepage-preview-badge">{slotLabel}</span>
      </div>

      <div className="selector-chip-row">
        {selectedIds.length ? (
          selectedIds.map((id, index) => {
            const item = publishedNews.find((news) => String(news._id) === String(id));
            return (
              <button
                key={id}
                type="button"
                className="selector-chip selector-chip-active"
                onClick={() =>
                  setSettings((current) => ({
                    ...current,
                    [fieldKey]: current[fieldKey].filter((entry) => entry !== id)
                  }))
                }
              >
                {String(index + 1).padStart(2, "0")} • {slotLabel} • {item?.title || id}
              </button>
            );
          })
        ) : (
          <p className="empty-state">Henüz seçim yapılmadı.</p>
        )}
      </div>

      <div className="selection-card-grid">
        {publishedNews.map((item) => {
          const active = selectedIds.includes(String(item._id));

          return (
            <button
              key={item._id}
              type="button"
              className={active ? "selection-card selection-card-active" : "selection-card"}
              onClick={() =>
                setSettings((current) => ({
                  ...current,
                  [fieldKey]: toggleId(current[fieldKey] || [], item._id, limit)
                }))
              }
            >
              <span className="selection-card-meta">
                <span>
                  {slotLabel} • {item.category}
                </span>
                <span>{formatDate(item.publishedAt || item.createdAt)}</span>
              </span>
              <strong>{item.title}</strong>
              <p>{item.excerpt}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AdGuidePanel({ settings, setSettings }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Reklam Yönetimi</h2>
      </div>
        <div className="editor-guides">
          <div className="editor-guide-card">
            <strong>Üst Bant</strong>
            <span>`1200x180 px` başlık, metin ve bağlantı ile yönetilir.</span>
          </div>
        <div className="editor-guide-card">
          <strong>Yan Bant</strong>
          <span>`300x600 px` dikey reklam alanıdır.</span>
        </div>
          <div className="editor-guide-card">
            <strong>Kurumsal Alan</strong>
            <span>`1200x240 px` görsel + bağlantı mantığında çalışır.</span>
          </div>
          <div className="editor-guide-card">
            <strong>Sol / Sağ Bant</strong>
            <span>`160x600 px` veya `300x600 px` sabit yan reklam alanıdır.</span>
          </div>
          <div className="editor-guide-card">
            <strong>Popup Reklam</strong>
            <span>`720x900 px` veya `1080x1350 px` açılış kampanya görseli için uygundur.</span>
          </div>
        </div>
        <div className="form-grid">
        <label>
          <span>Kurumsal Alan Başlığı</span>
          <input value={settings.sponsorTitle} onChange={(event) => setSettings((current) => ({ ...current, sponsorTitle: event.target.value }))} />
        </label>
        <label>
          <span>Kurumsal Alan URL</span>
          <input value={settings.sponsorUrl} onChange={(event) => setSettings((current) => ({ ...current, sponsorUrl: event.target.value }))} />
        </label>
        <label>
          <span>Kurumsal Alan Metni</span>
          <textarea rows={4} value={settings.sponsorText} onChange={(event) => setSettings((current) => ({ ...current, sponsorText: event.target.value }))} />
        </label>
        <label>
          <span>Kurumsal Alan Görsel URL (1200x240)</span>
          <input
            value={settings.sponsorImageUrl}
            placeholder="1200x240 reklam görseli"
            onChange={(event) => setSettings((current) => ({ ...current, sponsorImageUrl: event.target.value }))}
          />
        </label>
        <label>
          <span>Üst Bant Başlığı (1200x180)</span>
          <input value={settings.topAdTitle} onChange={(event) => setSettings((current) => ({ ...current, topAdTitle: event.target.value }))} />
        </label>
        <label>
          <span>Üst Bant Metni</span>
          <input value={settings.topAdText} onChange={(event) => setSettings((current) => ({ ...current, topAdText: event.target.value }))} />
        </label>
        <label>
          <span>Üst Bant URL</span>
          <input value={settings.topAdUrl} onChange={(event) => setSettings((current) => ({ ...current, topAdUrl: event.target.value }))} />
        </label>
        <label>
          <span>Yan Bant Başlığı (300x600)</span>
          <input value={settings.sideAdTitle} onChange={(event) => setSettings((current) => ({ ...current, sideAdTitle: event.target.value }))} />
        </label>
        <label>
          <span>Yan Bant Metni</span>
          <input value={settings.sideAdText} onChange={(event) => setSettings((current) => ({ ...current, sideAdText: event.target.value }))} />
        </label>
        <label>
          <span>Yan Bant URL</span>
          <input value={settings.sideAdUrl} onChange={(event) => setSettings((current) => ({ ...current, sideAdUrl: event.target.value }))} />
        </label>
        <label>
          <span>Sol Bant Başlığı (160x600 / 300x600)</span>
          <input value={settings.leftAdTitle} onChange={(event) => setSettings((current) => ({ ...current, leftAdTitle: event.target.value }))} />
        </label>
        <label>
          <span>Sol Bant Metni</span>
          <input value={settings.leftAdText} onChange={(event) => setSettings((current) => ({ ...current, leftAdText: event.target.value }))} />
        </label>
        <label>
          <span>Sol Bant URL</span>
          <input value={settings.leftAdUrl} onChange={(event) => setSettings((current) => ({ ...current, leftAdUrl: event.target.value }))} />
        </label>
        <label>
          <span>Sol Bant Görsel URL</span>
          <input value={settings.leftAdImageUrl} onChange={(event) => setSettings((current) => ({ ...current, leftAdImageUrl: event.target.value }))} />
        </label>
        <label>
          <span>Sağ Bant Başlığı (160x600 / 300x600)</span>
          <input value={settings.rightAdTitle} onChange={(event) => setSettings((current) => ({ ...current, rightAdTitle: event.target.value }))} />
        </label>
        <label>
          <span>Sağ Bant Metni</span>
          <input value={settings.rightAdText} onChange={(event) => setSettings((current) => ({ ...current, rightAdText: event.target.value }))} />
        </label>
        <label>
          <span>Sağ Bant URL</span>
          <input value={settings.rightAdUrl} onChange={(event) => setSettings((current) => ({ ...current, rightAdUrl: event.target.value }))} />
        </label>
        <label>
          <span>Sağ Bant Görsel URL</span>
          <input value={settings.rightAdImageUrl} onChange={(event) => setSettings((current) => ({ ...current, rightAdImageUrl: event.target.value }))} />
        </label>
        <label>
          <span>Popup Başlığı</span>
          <input value={settings.popupAdTitle} onChange={(event) => setSettings((current) => ({ ...current, popupAdTitle: event.target.value }))} />
        </label>
        <label>
          <span>Popup Metni</span>
          <input value={settings.popupAdText} onChange={(event) => setSettings((current) => ({ ...current, popupAdText: event.target.value }))} />
        </label>
        <label>
          <span>Popup URL</span>
          <input value={settings.popupAdUrl} onChange={(event) => setSettings((current) => ({ ...current, popupAdUrl: event.target.value }))} />
        </label>
        <label>
          <span>Popup Görsel URL (720x900 / 1080x1350)</span>
          <input value={settings.popupAdImageUrl} onChange={(event) => setSettings((current) => ({ ...current, popupAdImageUrl: event.target.value }))} />
        </label>
      </div>
    </section>
  );
}

export default function AdminHomepagePage({ publishedNews, initialSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const selectionGroups = useMemo(() => SELECTION_GROUPS, []);
  const mansetGuide = EDITORIAL_IMAGE_GUIDES["Manşet"];
  const surmansetGuide = EDITORIAL_IMAGE_GUIDES["Sürmanşet"];

  function moveModule(index, direction) {
    setSettings((current) => {
      const next = [...current.moduleOrder];
      const target = direction === "up" ? index - 1 : index + 1;

      if (target < 0 || target >= next.length) {
        return current;
      }

      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, moduleOrder: next };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/admin/homepage-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });

    const payload = await response.json();
    setSaving(false);
    setMessage(payload.success ? "Ana sayfa ayarları kaydedildi." : "Kayıt sırasında hata oluştu.");
  }

  return (
    <AdminLayout title="Ana Sayfa Yönetimi">
      <section className="panel admin-intro">
        <div>
          <span className="eyebrow">Ön Sayfa Kurgusu</span>
          <h2>Manşet, öne çıkan, sürmanşet ve reklam alanlarını tek panelden yönet</h2>
          <p>Çekirdek alanlar haber kategorisine göre dolar. Reklam ve modül kurgusu bu sayfadan yönetilir.</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Çekirdek Akış</h2>
        </div>
        <p className="homepage-preview-note">
          Kategori alanında <strong>Manşet</strong> seçilen haberler üstteki 7'li alana, <strong>Öne Çıkan</strong>{" "}
          seçilen haberler orta vitrine, <strong>Sürmanşet</strong> seçilen haberler alt manşete otomatik yerleşir.
        </p>
        <div className="homepage-ratio-guide-grid">
          <article className="editor-guide-card homepage-ratio-guide-card">
            <strong>{mansetGuide.label}</strong>
            <span>{mansetGuide.ratio} • {mansetGuide.size} px</span>
            <small>{mansetGuide.note}</small>
          </article>
          <article className="editor-guide-card homepage-ratio-guide-card">
            <strong>{surmansetGuide.label}</strong>
            <span>{surmansetGuide.ratio} • {surmansetGuide.size} px</span>
            <small>{surmansetGuide.note}</small>
          </article>
        </div>
      </section>

      <form className="admin-form" onSubmit={handleSubmit}>
        <AdGuidePanel settings={settings} setSettings={setSettings} />

        <section className="panel">
          <div className="panel-head">
            <h2>Modül Sırası</h2>
          </div>
          <div className="module-order-list">
            {settings.moduleOrder.map((moduleKey, index) => (
              <div
                key={moduleKey}
                className="module-order-row"
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (dragIndex === null || dragIndex === index) return;
                  setSettings((current) => ({
                    ...current,
                    moduleOrder: reorderModules(current.moduleOrder, dragIndex, index)
                  }));
                  setDragIndex(null);
                }}
              >
                <strong>{MODULE_LABELS[moduleKey] || moduleKey}</strong>
                <div className="list-actions">
                  <button type="button" className="button button-outline" onClick={() => moveModule(index, "up")}>
                    Yukarı
                  </button>
                  <button type="button" className="button button-outline" onClick={() => moveModule(index, "down")}>
                    Aşağı
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <button type="submit" className="button">
          {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
        </button>
        {message ? <p className="form-info">{message}</p> : null}
      </form>

      {selectionGroups.map((group) => (
        <SelectionBoard
          key={group.key}
          title={group.label}
          slotLabel={group.slotLabel}
          note={group.note}
          fieldKey={group.key}
          limit={group.limit}
          settings={settings}
          setSettings={setSettings}
          publishedNews={publishedNews}
        />
      ))}

      <HomepagePreview settings={settings} publishedNews={publishedNews} />

      <section className="panel">
        <div className="panel-head">
          <h2>Hazır Düzenler</h2>
        </div>
        <div className="preset-row">
          {PRESET_ORDERS.map((preset) => (
            <div key={preset.label} className="preset-card">
              <strong>{preset.label}</strong>
              <p>{preset.description}</p>
              <button
                type="button"
                className="button button-secondary"
                onClick={() =>
                  setSettings((current) => ({
                    ...current,
                    moduleOrder: preset.order
                  }))
                }
              >
                Düzeni Uygula
              </button>
            </div>
          ))}
        </div>
      </section>
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
  const [publishedNewsDocs, settingsDoc] = await Promise.all([
    News.find({ status: "published" }).sort({ sortOrder: 1, publishedAt: -1, createdAt: -1 }).lean(),
    SiteSettings.findOne({ key: "homepage" }).lean()
  ]);

  const initialSettings = {
    ...DEFAULT_SETTINGS,
    ...(settingsDoc?.homepage || {})
  };

  if (!initialSettings.moduleOrder?.length) {
    initialSettings.moduleOrder = DEFAULT_MODULE_ORDER;
  }

  return {
    props: {
      publishedNews: JSON.parse(JSON.stringify(publishedNewsDocs)),
      initialSettings: JSON.parse(JSON.stringify(initialSettings))
    }
  };
}
