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
    label: "Gundem Seckisi",
    slotLabel: "Secki Kategorisi",
    limit: 8,
    note: "Ana sayfadaki ek secki ve kucuk akis kartlarini besler."
  },
  {
    key: "galleryIds",
    label: "Foto Galeri",
    slotLabel: "Galeri Kategorisi",
    limit: 3,
    note: "Galeri vitrini icin secilecek kayitlar."
  },
  {
    key: "videoIds",
    label: "Video Alani",
    slotLabel: "Video Kategorisi",
    limit: 3,
    note: "Video alaninda kullanilacak kayitlar."
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
  const guide = EDITORIAL_IMAGE_GUIDES["ManÅŸet"];

  if (!item) {
    return <p className="empty-state">Bu slot icin yayin bulunamadi.</p>;
  }

  return (
    <article className="homepage-preview-card homepage-preview-lead">
      <span className="homepage-preview-kicker">{label}</span>
      <span className="homepage-preview-guide">
        Onerilen gorsel: {guide.ratio} • {guide.size} px
      </span>
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
        <span>{items.length} kayit</span>
      </div>
      {guide ? (
        <p className="homepage-preview-guide">
          Onerilen gorsel: {guide.ratio} • {guide.size} px
        </p>
      ) : null}
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
          <p className="empty-state">Bu alan bos kalacak.</p>
        )}
      </div>
    </section>
  );
}

function HomepagePreview({ settings, publishedNews }) {
  const preview = buildHomepageData(publishedNews, settings);

  const moduleSummaries = {
    editorialBand: <PreviewList title="Surmanset" slotLabel="Surmanset Kategorisi" items={preview.surmanset} guideKey="SÃ¼rmanÅŸet" />,
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
    editorPicks: <PreviewList title="Gundem Seckisi" slotLabel="Secki Kategorisi" items={preview.superHeadlines} />,
    categoryLanes: <PreviewList title="One Cikan" slotLabel="One Cikan Kategorisi" items={preview.featuredList} guideKey="Ã–ne Ã‡Ä±kan" />,
    newsRiver: <PreviewList title="Son Gelismeler" slotLabel="Akis Kategorisi" items={preview.newsRiver} />
  };

  return (
    <section className="panel homepage-preview-panel">
      <div className="panel-head">
        <h2>Canli Onizleme</h2>
        <p className="homepage-preview-note">Kaydetmeden once mevcut kurgu burada simule edilir.</p>
      </div>
      <div className="homepage-preview-frame">
        <div className="homepage-preview-topline">
          <span className="homepage-preview-badge">Ust Bant</span>
          <strong>{preview.ads.top.title}</strong>
        </div>
        <div className="homepage-preview-split">
          <PreviewList title="Manset" slotLabel="Manset Kategorisi" items={preview.heroItems} guideKey="ManÅŸet" />
          <PreviewList title="One Cikan" slotLabel="One Cikan Kategorisi" items={preview.featuredList} guideKey="Ã–ne Ã‡Ä±kan" />
          <PreviewList title="Surmanset" slotLabel="Surmanset Kategorisi" items={preview.surmanset} guideKey="SÃ¼rmanÅŸet" />
          <PreviewLead item={preview.heroItems[0]} label="Aktif Manset" />
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

function SelectionBoard({ title, slotLabel, note, fieldKey, limit, settings, setSettings, publishedNews, lookup }) {
  const selectedIds = settings[fieldKey] || [];

  return (
    <section className="panel selector-panel">
      <div className="panel-head panel-head-spread">
        <div>
          <h2>{title}</h2>
          <p className="homepage-preview-note">
            {note} En fazla {limit} kayit secilir. Sinir asildiginda en eski secim listeden cikarilir.
          </p>
        </div>
        <div className="selector-panel-badges">
          <span className="homepage-preview-badge">{slotLabel}</span>
          <span className="editor-chip">
            {selectedIds.length}/{limit}
          </span>
        </div>
      </div>

      <div className="selector-chip-row">
        {selectedIds.length ? (
          selectedIds.map((id, index) => {
            const item = lookup.get(String(id));

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
          <p className="empty-state">Henuz secim yapilmadi.</p>
        )}
      </div>

      <div className="selection-card-grid">
        {publishedNews.length ? (
          publishedNews.map((item) => {
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
          })
        ) : (
          <p className="empty-state">Filtreye uyan yayin bulunamadi.</p>
        )}
      </div>
    </section>
  );
}

function SelectionCommandPanel({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  categoryOptions,
  filteredCount,
  publishedCount,
  selectedTotal,
  moduleCount,
  onResetSettings,
  onClearFilters
}) {
  const summary = [
    { label: "Filtrelenen havuz", value: filteredCount },
    { label: "Toplam yayin", value: publishedCount },
    { label: "Elle secilen kayit", value: selectedTotal },
    { label: "Modul akisi", value: moduleCount }
  ];

  return (
    <section className="panel homepage-command-panel">
      <div className="panel-head panel-head-spread">
        <div>
          <h2>Secim Masasi</h2>
          <p className="homepage-preview-note">Yayin havuzunu filtreleyip secki bloklarini daha hizli olustur.</p>
        </div>
        <span className="editor-chip">Kaydetmeden onizlenir</span>
      </div>
      <div className="homepage-command-grid">
        <label>
          <span>Baslikta Ara</span>
          <input
            value={searchTerm}
            placeholder="Baslik veya ozet ara"
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
        <label>
          <span>Kategori Filtresi</span>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">Tum kategoriler</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <div className="homepage-command-actions">
          <button type="button" className="button button-secondary" onClick={onResetSettings}>
            Kayitli Duzen
          </button>
          <button type="button" className="button button-outline" onClick={onClearFilters}>
            Filtreyi Temizle
          </button>
        </div>
      </div>
      <div className="homepage-summary-grid">
        {summary.map((item) => (
          <article key={item.label} className="homepage-summary-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function AdGuidePanel({ settings, setSettings }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Reklam Yonetimi</h2>
      </div>
      <div className="editor-guides">
        <div className="editor-guide-card">
          <strong>Ust Bant</strong>
          <span>`1200x180 px` baslik, metin ve baglanti ile yonetilir.</span>
        </div>
        <div className="editor-guide-card">
          <strong>Yan Bant</strong>
          <span>`300x600 px` dikey reklam alanidir.</span>
        </div>
        <div className="editor-guide-card">
          <strong>Kurumsal Alan</strong>
          <span>`1200x240 px` gorsel ve baglanti mantiginda calisir.</span>
        </div>
        <div className="editor-guide-card">
          <strong>Sol / Sag Bant</strong>
          <span>`160x600 px` veya `300x600 px` sabit yan reklam alanidir.</span>
        </div>
        <div className="editor-guide-card">
          <strong>Popup Reklam</strong>
          <span>`720x900 px` veya `1080x1350 px` acilis kampanya gorseli icin uygundur.</span>
        </div>
      </div>
      <div className="form-grid">
        <label>
          <span>Kurumsal Alan Basligi</span>
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
          <span>Kurumsal Alan Gorsel URL (1200x240)</span>
          <input
            value={settings.sponsorImageUrl}
            placeholder="1200x240 reklam gorseli"
            onChange={(event) => setSettings((current) => ({ ...current, sponsorImageUrl: event.target.value }))}
          />
        </label>
        <label>
          <span>Ust Bant Basligi (1200x180)</span>
          <input value={settings.topAdTitle} onChange={(event) => setSettings((current) => ({ ...current, topAdTitle: event.target.value }))} />
        </label>
        <label>
          <span>Ust Bant Metni</span>
          <input value={settings.topAdText} onChange={(event) => setSettings((current) => ({ ...current, topAdText: event.target.value }))} />
        </label>
        <label>
          <span>Ust Bant URL</span>
          <input value={settings.topAdUrl} onChange={(event) => setSettings((current) => ({ ...current, topAdUrl: event.target.value }))} />
        </label>
        <label>
          <span>Yan Bant Basligi (300x600)</span>
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
          <span>Sol Bant Basligi (160x600 / 300x600)</span>
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
          <span>Sol Bant Gorsel URL</span>
          <input value={settings.leftAdImageUrl} onChange={(event) => setSettings((current) => ({ ...current, leftAdImageUrl: event.target.value }))} />
        </label>
        <label>
          <span>Sag Bant Basligi (160x600 / 300x600)</span>
          <input value={settings.rightAdTitle} onChange={(event) => setSettings((current) => ({ ...current, rightAdTitle: event.target.value }))} />
        </label>
        <label>
          <span>Sag Bant Metni</span>
          <input value={settings.rightAdText} onChange={(event) => setSettings((current) => ({ ...current, rightAdText: event.target.value }))} />
        </label>
        <label>
          <span>Sag Bant URL</span>
          <input value={settings.rightAdUrl} onChange={(event) => setSettings((current) => ({ ...current, rightAdUrl: event.target.value }))} />
        </label>
        <label>
          <span>Sag Bant Gorsel URL</span>
          <input value={settings.rightAdImageUrl} onChange={(event) => setSettings((current) => ({ ...current, rightAdImageUrl: event.target.value }))} />
        </label>
        <label>
          <span>Popup Basligi</span>
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
          <span>Popup Gorsel URL (720x900 / 1080x1350)</span>
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
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const selectionGroups = useMemo(() => SELECTION_GROUPS, []);
  const lookup = useMemo(() => new Map(publishedNews.map((item) => [String(item._id), item])), [publishedNews]);
  const categoryOptions = useMemo(
    () => Array.from(new Set(publishedNews.map((item) => item.category))).sort((left, right) => left.localeCompare(right, "tr")),
    [publishedNews]
  );
  const filteredNews = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLocaleLowerCase("tr");

    return publishedNews.filter((item) => {
      const categoryMatch = categoryFilter === "all" || item.category === categoryFilter;
      const textMatch =
        !normalizedQuery ||
        item.title?.toLocaleLowerCase("tr").includes(normalizedQuery) ||
        item.excerpt?.toLocaleLowerCase("tr").includes(normalizedQuery);

      return categoryMatch && textMatch;
    });
  }, [categoryFilter, publishedNews, searchTerm]);
  const selectedTotal = useMemo(
    () => selectionGroups.reduce((total, group) => total + (settings[group.key]?.length || 0), 0),
    [selectionGroups, settings]
  );
  const mansetGuide = EDITORIAL_IMAGE_GUIDES["ManÅŸet"];
  const surmansetGuide = EDITORIAL_IMAGE_GUIDES["SÃ¼rmanÅŸet"];

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
    setMessage(payload.success ? "Ana sayfa ayarlari kaydedildi." : "Kayit sirasinda hata olustu.");
  }

  return (
    <AdminLayout title="Ana Sayfa Yonetimi">
      <section className="panel admin-intro">
        <div>
          <span className="eyebrow">On Sayfa Kurgusu</span>
          <h2>Manset, one cikan, surmanset ve reklam alanlarini tek panelden yonet</h2>
          <p>Cekirdek alanlar haber kategorisine gore dolar. Reklam ve modul kurgusu bu sayfadan yonetilir.</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Cekirdek Akis</h2>
        </div>
        <p className="homepage-preview-note">
          Kategori alaninda <strong>Manset</strong> secilen haberler ustteki 7'li alana, <strong>One Cikan</strong> secilen
          haberler orta vitrine, <strong>Surmanset</strong> secilen haberler alt mansete otomatik yerlestirilir.
        </p>
        <div className="homepage-ratio-guide-grid">
          <article className="editor-guide-card homepage-ratio-guide-card">
            <strong>{mansetGuide.label}</strong>
            <span>
              {mansetGuide.ratio} • {mansetGuide.size} px
            </span>
            <small>{mansetGuide.note}</small>
          </article>
          <article className="editor-guide-card homepage-ratio-guide-card">
            <strong>{surmansetGuide.label}</strong>
            <span>
              {surmansetGuide.ratio} • {surmansetGuide.size} px
            </span>
            <small>{surmansetGuide.note}</small>
          </article>
        </div>
      </section>

      <SelectionCommandPanel
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        categoryOptions={categoryOptions}
        filteredCount={filteredNews.length}
        publishedCount={publishedNews.length}
        selectedTotal={selectedTotal}
        moduleCount={settings.moduleOrder.length}
        onResetSettings={() => setSettings(initialSettings)}
        onClearFilters={() => {
          setSearchTerm("");
          setCategoryFilter("all");
        }}
      />

      <form className="admin-form" onSubmit={handleSubmit}>
        <section className="panel homepage-save-bar">
          <div>
            <strong>Canli duzenleme oturumu</strong>
            <p className="homepage-preview-note">Secimler ve modul sirasi aninda onizlemeye yansir; yayina almak icin kaydedin.</p>
          </div>
          <div className="homepage-save-actions">
            <span className="editor-chip">{filteredNews.length} kayit gorunuyor</span>
            <button type="submit" className="button">
              {saving ? "Kaydediliyor..." : "Ayarlari Kaydet"}
            </button>
          </div>
        </section>

        <AdGuidePanel settings={settings} setSettings={setSettings} />

        <section className="panel">
          <div className="panel-head">
            <h2>Modul Sirasi</h2>
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
                  if (dragIndex === null || dragIndex === index) {
                    return;
                  }

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
                    Yukari
                  </button>
                  <button type="button" className="button button-outline" onClick={() => moveModule(index, "down")}>
                    Asagi
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

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
          publishedNews={filteredNews}
          lookup={lookup}
        />
      ))}

      <HomepagePreview settings={settings} publishedNews={publishedNews} />

      <section className="panel">
        <div className="panel-head">
          <h2>Hazir Duzenler</h2>
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
                Duzeni Uygula
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
