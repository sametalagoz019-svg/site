import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import AnalyticsTracker from "../components/AnalyticsTracker";
import PrayerTimesTicker from "../components/PrayerTimesTicker";
import { PUBLIC_CATEGORIES, SITE_NAME, SITE_SLOGAN } from "../lib/constants";
import { buildHomepageData } from "../lib/homepageConfig";
import dbConnect from "../lib/dbConnect";
import { slugify } from "../lib/slugify";
import News from "../models/News";
import SiteSettings from "../models/SiteSettings";

function SectionHeading({ title, className = "" }) {
  return (
    <div className={`clone-section-heading ${className}`.trim()}>
      <span>{title}</span>
    </div>
  );
}

function CloneTopBar() {
  const navItems = [
    ...PUBLIC_CATEGORIES.slice(0, 5).map((item) => ({ label: item, href: `/category/${slugify(item)}` })),
    { label: "Son Dakika", href: "/son-dakika" }
  ];

  return (
    <div className="clone-topbar">
      <div className="clone-topbar-inner">
        <div className="clone-brand-row">
          <Link href="/" className="clone-brand">
            <img src="/logo.svg" alt={SITE_NAME} className="clone-brand-logo" />
            <div className="clone-brand-copy">
              <strong>{SITE_NAME}</strong>
              <span>{SITE_SLOGAN}</span>
            </div>
          </Link>
        </div>
        <PrayerTimesTicker />
        <nav className="clone-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

function CloneLeadBar({ items }) {
  const leadItems = items.slice(0, 3);

  if (!leadItems.length) return null;

  return (
    <div className="clone-leadbar">
      <span className="clone-leadbar-label">Editor Masasi</span>
      <div className="clone-leadbar-links">
        {leadItems.map((item) => (
          <a key={item._id} href={`/news/${item.slug}`}>
            <strong>{item.category}</strong>
            <span>{item.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function ClonePromo({ ad }) {
  return (
    <div className="clone-promo">
      <div className="clone-promo-info">
        <div>
          <strong>Sivas merkezli</strong>
          <span>Yerel ve güncel haber akışı</span>
        </div>
        <div>
          <strong>Gün boyu yayın</strong>
          <span>Manşet, editör seçkisi ve sıcak gelişmeler</span>
        </div>
        <div>
          <strong>{SITE_NAME}</strong>
          <span>{SITE_SLOGAN}</span>
        </div>
      </div>
      <a href={ad.url || "#"} className="clone-promo-banner" target="_blank" rel="noopener noreferrer">
        <small>Kurumsal Duyuru</small>
        <strong>{ad.title}</strong>
        <span>{ad.text}</span>
      </a>
    </div>
  );
}

function SideRailAd({ ad, side }) {
  if (!ad?.imageUrl) return null;

  return (
    <a
      href={ad.url || "#"}
      className={`site-rail-ad site-rail-ad-${side}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <img src={ad.imageUrl} alt={ad.title || `${side} reklam`} />
      <span>{ad.title}</span>
    </a>
  );
}

function PopupAd({ ad }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ad?.imageUrl) return;
    const timer = window.setTimeout(() => setOpen(true), 700);
    return () => window.clearTimeout(timer);
  }, [ad?.imageUrl]);

  if (!ad?.imageUrl || !open) return null;

  return (
    <div className="site-popup-backdrop" role="dialog" aria-modal="true">
      <div className="site-popup-card">
        <button type="button" className="site-popup-close" onClick={() => setOpen(false)}>
          Kapat
        </button>
        <a href={ad.url || "#"} target="_blank" rel="noopener noreferrer" className="site-popup-link">
          <img src={ad.imageUrl} alt={ad.title || "Popup reklam"} />
          <div className="site-popup-copy">
            <strong>{ad.title}</strong>
            <p>{ad.text}</p>
          </div>
        </a>
      </div>
    </div>
  );
}

function CloneHero({ items }) {
  const pool = items.slice(0, 7);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!pool.length) return null;

  const active = pool[activeIndex] || pool[0];

  return (
    <section className="clone-hero">
      <div className="clone-hero-numbers">
        {pool.map((item, index) => (
          <button
            key={item._id}
            type="button"
            className={index === activeIndex ? "is-active" : ""}
            onMouseEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
            onClick={() => setActiveIndex(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>
      <a href={`/news/${active.slug}`} className="clone-hero-stage">
        <img src={active.imageUrl || "/logo.svg"} alt={active.title} className="clone-hero-image" />
        <div className="clone-hero-overlay">
          <div className="clone-hero-story">
            <span>{active.category}</span>
            <strong>{active.title}</strong>
            {active.excerpt ? <p>{active.excerpt}</p> : null}
          </div>
        </div>
      </a>
    </section>
  );
}

function CloneSponsor({ sponsor }) {
  return (
    <a href={sponsor.url || "#"} className="clone-sponsor" target="_blank" rel="noopener noreferrer">
      {sponsor.imageUrl ? (
        <img src={sponsor.imageUrl} alt={sponsor.title} className="clone-sponsor-logo" />
      ) : (
        <img src="/logo.svg" alt={SITE_NAME} className="clone-sponsor-logo" />
      )}
      <small>Destekleyen Alan</small>
      <strong>{sponsor.title || SITE_NAME}</strong>
      <span>{sponsor.text || SITE_SLOGAN}</span>
    </a>
  );
}

function CloneCardRow({ items }) {
  const small = items.slice(0, 4);
  const large = items.slice(4, 6);

  return (
    <>
      <SectionHeading title="Öne Çıkan" />
      <div className="clone-small-grid">
        {small.map((item) => (
          <a key={item._id} href={`/news/${item.slug}`} className="clone-small-card">
            <img src={item.imageUrl || "/logo.svg"} alt={item.title} />
            <strong>{item.title}</strong>
          </a>
        ))}
      </div>
      <div className="clone-large-grid">
        {large.map((item) => (
          <a key={item._id} href={`/news/${item.slug}`} className="clone-large-card">
            <img src={item.imageUrl || "/logo.svg"} alt={item.title} />
            <strong>{item.title}</strong>
          </a>
        ))}
      </div>
    </>
  );
}

function CloneSecondHero({ items }) {
  const pool = items.slice(0, 8);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!pool.length) return null;

  const active = pool[activeIndex] || pool[0];

  return (
    <section className="clone-second">
      <SectionHeading title="Editör Seçimi" className="clone-section-heading-muted" />
      <div className="clone-second-meta">
        <span>Sivas</span>
        <span>Yerel Gündem</span>
        <span>Siyaset</span>
        <span>Spor</span>
        <span>Ekonomi</span>
      </div>
      <a href={`/news/${active.slug}`} className="clone-second-stage">
        <img src={active.imageUrl || "/logo.svg"} alt={active.title} className="clone-second-image" />
        <div className="clone-second-overlay">
          <div className="clone-second-story">
            <span>{active.category}</span>
            <strong>{active.title}</strong>
          </div>
        </div>
      </a>
      <div className="clone-second-numbers">
        {pool.map((item, index) => (
          <button
            key={item._id}
            type="button"
            className={index === activeIndex ? "is-active" : ""}
            onMouseEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
            onClick={() => setActiveIndex(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </section>
  );
}

function CloneCompactNews({ items }) {
  const compactItems = items.slice(0, 6);
  if (!compactItems.length) return null;

  return (
    <section className="clone-compact-news">
      <div className="clone-compact-grid">
        {compactItems.map((item) => (
          <a key={item._id} href={`/news/${item.slug}`} className="clone-compact-card">
            <img src={item.imageUrl || "/logo.svg"} alt={item.title} />
            <div>
              <span>{item.category}</span>
              <strong>{item.title}</strong>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function CloneColorLinks() {
  const links = [
    { label: "Son Dakika", href: "/son-dakika" },
    { label: "Yerel Gündem", href: "/category/yerel" },
    { label: "Siyaset", href: "/category/siyaset" },
    { label: "Spor", href: "/category/spor" },
    { label: "Ekonomi", href: "/category/ekonomi" }
  ];

  return (
    <div className="clone-color-links">
      {links.map((item) => (
        <Link key={item.href} href={item.href}>
          {item.label}
        </Link>
      ))}
    </div>
  );
}

function CloneColumns({ columns, mostRead }) {
  return (
    <section className="clone-columns">
      <div className="clone-col">
        {columns.slice(0, 3).map((item) => (
          <a key={item._id} href={`/news/${item.slug}`} className="clone-col-card">
            <img src={item.imageUrl || "/logo.svg"} alt={item.title} />
            <strong>{item.title}</strong>
          </a>
        ))}
      </div>
      <div className="clone-col">
        {columns.slice(3, 6).map((item) => (
          <a key={item._id} href={`/news/${item.slug}`} className="clone-col-card">
            <img src={item.imageUrl || "/logo.svg"} alt={item.title} />
            <strong>{item.title}</strong>
          </a>
        ))}
      </div>
      <aside className="clone-mostread">
        <div className="clone-mostread-title">Çok Okunan</div>
        {mostRead.slice(0, 5).map((item) => (
          <a key={item._id} href={`/news/${item.slug}`} className="clone-mostread-item">
            <img src={item.imageUrl || "/logo.svg"} alt={item.title} />
            <strong>{item.title}</strong>
          </a>
        ))}
      </aside>
    </section>
  );
}

export default function HomePage({ heroItems, featuredList, superHeadlines, surmanset, newsRiver, mostRead, ads, sponsor }) {
  const heroPool = [...heroItems].filter(Boolean);
  const cardPool = [...featuredList].filter(Boolean);
  const secondPool = [...surmanset].filter(Boolean);
  const compactPool = [...newsRiver, ...superHeadlines, ...featuredList].filter(Boolean);
  const leadPool = [...heroItems, ...newsRiver].filter(Boolean);

  return (
    <>
      <Head>
        <title>{SITE_NAME}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AnalyticsTracker />
      <PopupAd ad={ads.popup} />
      <SideRailAd ad={ads.left} side="left" />
      <SideRailAd ad={ads.right} side="right" />
      <main className="clone-page">
        <CloneTopBar />
        <div className="clone-center">
          <CloneLeadBar items={leadPool} />
          <CloneHero items={heroPool} />
          <ClonePromo ad={ads.top} />
          <CloneSponsor sponsor={sponsor} />
          <CloneCardRow items={cardPool} />
          <CloneSecondHero items={secondPool} />
          <CloneCompactNews items={compactPool} />
          <CloneColorLinks />
          <CloneColumns columns={newsRiver} mostRead={mostRead} />
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps() {
  await dbConnect();

  const [allPublishedDocs, settingsDoc] = await Promise.all([
    News.find({ status: "published" })
      .sort({ sortOrder: 1, publishedAt: -1, createdAt: -1 })
      .lean(),
    SiteSettings.findOne({ key: "homepage" }).lean()
  ]);

  return {
    props: JSON.parse(JSON.stringify(buildHomepageData(allPublishedDocs, settingsDoc?.homepage)))
  };
}
