import Link from "next/link";
import { useRouter } from "next/router";
import { SITE_NAME } from "../lib/constants";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "01" },
  { href: "/admin/news", label: "Icerik", icon: "02" },
  { href: "/admin/news/new", label: "Yeni Haber", icon: "03" },
  { href: "/admin/homepage", label: "Yerlesim", icon: "04" }
];

export default function AdminLayout({ children, title }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <div className="admin-shell admin-shell-pro">
      <aside className="admin-sidebar admin-sidebar-pro">
        <div className="admin-brand-wrap">
          <Link href="/" className="admin-brand">
            {SITE_NAME}
          </Link>
          <span className="admin-brand-subline">Yayin masasi, manset akisi ve reklam yonetimi tek panelde.</span>
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={router.pathname === item.href ? "admin-nav-link is-active" : "admin-nav-link"}
            >
              <span className="admin-nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-note">
          <strong>Canli Yayin Kontrolu</strong>
          <span>Haber uretimi, siralama, manset akisi ve reklam alanlari ayni panelden yonetilir.</span>
        </div>

        <button type="button" className="button button-outline" onClick={handleLogout}>
          Cikis Yap
        </button>
      </aside>

      <section className="admin-content">
        <div className="admin-page-head admin-page-head-pro">
          <h1>{title}</h1>
        </div>
        {children}
      </section>
    </div>
  );
}
