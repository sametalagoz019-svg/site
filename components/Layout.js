import Head from "next/head";
import Footer from "./Footer";
import Header from "./Header";
import { SITE_DOMAIN, SITE_NAME, SITE_SLOGAN } from "../lib/constants";

export default function Layout({ children, title, description }) {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const pageDescription =
    description || "Sivas ve çevresinden son dakika gelişmeleri, yerel haberler, siyaset, spor ve ekonomi içerikleri.";

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:type" content="website" />
        <meta name="theme-color" content="#b10f1f" />
        <meta property="og:url" content={`https://${SITE_DOMAIN}`} />
        <meta property="og:image:alt" content={SITE_SLOGAN} />
        <link rel="canonical" href={`https://${SITE_DOMAIN}`} />
      </Head>
      <div className="site-shell">
        <Header />
        <main>{children}</main>
        <Footer />
        <nav className="mobile-bottom-nav">
          <a href="/" target="_blank" rel="noopener noreferrer">Ana Sayfa</a>
          <a href="/son-dakika" target="_blank" rel="noopener noreferrer">Son Dakika</a>
          <a href="/category/gundem" target="_blank" rel="noopener noreferrer">Gündem</a>
          <a href="/admin/login" target="_blank" rel="noopener noreferrer">Yönetim</a>
        </nav>
      </div>
    </>
  );
}
