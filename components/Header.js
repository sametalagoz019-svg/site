import Link from "next/link";
import PrayerTimesTicker from "./PrayerTimesTicker";
import { PUBLIC_CATEGORIES, SITE_NAME, SITE_SLOGAN } from "../lib/constants";
import { slugify } from "../lib/slugify";

const SERVICE_LINKS = [
  { href: "/son-dakika", label: "Son Dakika" },
  { href: "/category/gundem", label: "Gündem" },
  { href: "/category/spor", label: "Spor" },
  { href: "/admin/login", label: "Yönetim" }
];

const INFO_ITEMS = [
  { label: "Hava", value: "Sivas" },
  { label: "Odak", value: "Yerel Gündem" },
  { label: "Akış", value: "Canlı Güncel" },
  { label: "Servis", value: "24 Saat" }
];

export default function Header() {
  const today = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date());

  return (
    <header className="site-header sticky">
      <div className="masthead-strip masthead-strip-top">
        <div className="container masthead-strip-inner">
          <div className="masthead-meta">
            <span className="live-dot" />
            <strong>{SITE_SLOGAN}</strong>
            <span>{today}</span>
          </div>
          <div className="masthead-utility">
            <PrayerTimesTicker />
            <Link href="/son-dakika">Güncel Akış</Link>
            <Link href="/admin/login">Yönetim</Link>
          </div>
        </div>
      </div>

      <div className="portal-info-strip">
        <div className="container portal-info-inner">
          <div className="portal-service-links">
            {SERVICE_LINKS.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="portal-info-board">
            {INFO_ITEMS.map((item) => (
              <div key={item.label} className="portal-info-chip">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="site-header-body container site-header-body-portal">
        <Link href="/" className="brand brand-portal">
          <img src="/logo.svg" alt={SITE_NAME} className="brand-logo" />
          <div>
            <strong>{SITE_NAME}</strong>
            <span>{SITE_SLOGAN}</span>
          </div>
        </Link>

        <nav className="primary-nav primary-nav-portal">
          {PUBLIC_CATEGORIES.map((category) => (
            <Link key={category} href={`/category/${slugify(category)}`}>
              {category}
            </Link>
          ))}
        </nav>

        <div className="header-actions header-actions-portal">
          <Link href="/son-dakika" className="header-cta">
            Son Dakika
          </Link>
        </div>
      </div>
    </header>
  );
}
