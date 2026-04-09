import Head from "next/head";
import { useState } from "react";
import { getAdminFromRequest } from "../../lib/auth";
import { SITE_NAME } from "../../lib/constants";

const DEMO_EMAIL = "admin@sivasgundem58.com";
const DEMO_PASSWORD = "Admin12345!";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.message || "Giriş başarısız.");
      return;
    }

    window.location.href = "/admin";
  }

  function fillDemoAccount() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError("");
  }

  return (
    <>
      <Head>
        <title>Yönetim Girişi | {SITE_NAME}</title>
      </Head>
      <div className="login-shell">
        <form className="login-card" onSubmit={handleSubmit}>
          <img src="/logo.svg" alt={SITE_NAME} className="login-logo" />
          <h1>Yönetim Girişi</h1>
          <p className="login-copy">Panel erişimi için yönetici hesabınla oturum aç.</p>
          <div className="login-helper">
            <strong>Hızlı giriş</strong>
            <span>Kayıtlı yönetici hesabı alanlara otomatik doldurulur.</span>
            <button type="button" className="button button-secondary" onClick={fillDemoAccount}>
              Bilgileri Doldur
            </button>
          </div>
          <label>
            <span>E-posta</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            <span>Şifre</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="button" disabled={loading}>
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
    </>
  );
}

export async function getServerSideProps({ req }) {
  const admin = await getAdminFromRequest(req);

  if (admin) {
    return {
      redirect: {
        destination: "/admin",
        permanent: false
      }
    };
  }

  return { props: {} };
}
