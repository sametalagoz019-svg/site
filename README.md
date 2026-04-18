# Sivas Gundem 58

Next.js tabanli yerel haber sitesi. Proje hem `data/localdb.json` uzerinden hem de MongoDB ile calisabilir.

## Ozellikler

- Mobil uyumlu haber arayuzu
- Admin giris ve haber yonetimi
- Manset, surmanset ve vitrin alani yonetimi
- Gorsel yukleme
- Ziyaret ve makale goruntuleme analitigi
- Dis kaynaktan haber cekme ve editoryal onay akisi
- Dua vakti bandi ve temel SEO ciktilari

## Calisma Modlari

- `LOCAL_DB=1`: MongoDB olmadan, `data/localdb.json` ile calisir.
- `LOCAL_DB=0`: MongoDB baglantisi ile calisir.

## Kurulum

1. `.env.example` dosyasini `.env.local` olarak kopyalayin.
2. Yerel kullanim icin `.env.local` icinde `LOCAL_DB=1` birakin.
3. Bagimliliklari kurun.

```bash
npm install
```

4. Gelistirme ortamini baslatin.

```bash
npm run dev
```

Bu ortamda `next dev` izin veya port kaynakli sorun cikarirsa su akisi kullanilabilir:

```bash
npm run build
npm run start
```

## Varsayilan Admin Hesabi

Ilk giriste `.env.local` icindeki su alanlar kullanilir:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Kullanici yoksa sistem ilk oturumda bu hesabi olusturur.

## Onemli Ortam Degiskenleri

- `LOCAL_DB`
- `MONGODB_URI`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_SITE_URL`
- `CRON_SECRET`

## Haber Cekme

Haber cekme islemi yonetim panelinden ya da `POST /api/admin/cron-fetch` uzerinden tetiklenebilir.

```text
Authorization: Bearer <CRON_SECRET>
```

## Klasor Yapisi

- `components/`: arayuz bilesenleri ve admin formlari
- `data/`: yerel JSON veri kaynagi
- `lib/`: yardimci fonksiyonlar, veri katmani ve sabitler
- `models/`: MongoDB modelleri
- `pages/`: sayfalar ve API route'lari
- `public/`: statik dosyalar ve yuklenen medya
- `styles/`: genel stiller

## Repo Notlari

- `node_modules`, `.next`, `.run`, `.vercel` ve lokal ortam dosyalari repoya dahil edilmez.
- Yuklenen medya dosyalari `public/uploads/` altinda tutulur.
- MongoDB kurulum artifaktlari ve log dosyalari repoda takip edilmez.
