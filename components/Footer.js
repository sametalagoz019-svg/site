import { PUBLIC_CATEGORIES, SITE_DOMAIN, SITE_NAME, SITE_SLOGAN } from "../lib/constants";
import { slugify } from "../lib/slugify";

const QUICK_LINKS = [
  { href: "/son-dakika", label: "Son Dakika" },
  { href: "/category/gundem", label: "Gündem" },
  { href: "/category/yerel", label: "Yerel" },
  { href: "/admin/login", label: "Yönetim" }
];

const SERVICE_LINKS = ["Haber İhbar", "Kurumsal Alan", "Künye", "İletişim"];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid footer-grid-newsroom footer-grid-professional">
        <div className="footer-brand-block">
          <span className="footer-badge">Haber Merkezi</span>
          <h3>{SITE_NAME}</h3>
          <p>{SITE_SLOGAN} çizgisinde yerel gündemi, son dakika akışını ve editoryal vitrinleri tek çatı altında toplar.</p>
        </div>
        <div>
          <h4>Hızlı Erişim</h4>
          <div className="footer-link-list">
            {QUICK_LINKS.map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4>Kategoriler</h4>
          <div className="footer-link-list">
            {PUBLIC_CATEGORIES.map((category) => (
              <a key={category} href={`/category/${slugify(category)}`} target="_blank" rel="noopener noreferrer">
                {category}
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4>Servisler</h4>
          <div className="footer-link-list footer-copy-list">
            {SERVICE_LINKS.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="container footer-bottom-line">
        <span>{SITE_NAME}</span>
        <span>{SITE_DOMAIN}</span>
      </div>
    </footer>
  );
}
