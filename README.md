# Sivas Gündem 58

Next.js tabanlı yerel haber sitesi. Proje hem yerel JSON veri kaynağıyla hem de MongoDB ile çalışabilir.

## Çalışma Modları

- `LOCAL_DB=1`: MongoDB olmadan, `data/localdb.json` üzerinden çalışır.
- `LOCAL_DB=0`: MongoDB bağlantısı ile çalışır.

## Özellikler

- Mobil uyumlu haber arayüzü
- Admin giriş sistemi
- Haber oluşturma, düzenleme ve silme
- Taslak, onay bekleyen ve yayınlanan haber akışı
- Görsel yükleme
- Ziyaretçi ve makale görüntüleme istatistikleri
- İnternetten haber çekme ve editoryal onaya alma
- Ana sayfa manşet, sürmanşet ve vitrin yönetimi
- Dua vakti bandı ve temel SEO uçları

## Kurulum

1. `.env.example` dosyasını `.env.local` olarak kopyalayın.
2. Yerel kullanım için `.env.local` içinde `LOCAL_DB=1` bırakın.
3. Bağımlılıkları kurun:

```bash
npm install
```

4. Geliştirme ortamını başlatın:

```bash
npm run dev
```

Bu ortamda `next dev` bazı izin kısıtları yüzünden açılamazsa şu akışı kullanın:

```bash
npm run build
npm run start
```

## Varsayılan Admin Hesabı

İlk girişte `.env.local` içindeki şu alanlar kullanılır:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Kullanıcı yoksa sistem ilk oturumda bu hesabı oluşturur.

## Yerel Veri Modu

- Veriler `data/localdb.json` içinde tutulur.
- Admin girişi, haber yönetimi ve temel içerik akışı bu modda çalışır.
- Demo, içerik hazırlığı ve arayüz geliştirme için yeterlidir.

## MongoDB Modu

1. Makinede MongoDB kurun.
2. `.env.local` içindeki `MONGODB_URI` değerini gerçek bağlantı adresiyle değiştirin.
3. `LOCAL_DB=0` yapın.
4. Uygulamayı yeniden başlatın.

## Önemli Ortam Değişkenleri

- `MONGODB_URI`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_SITE_URL`
- `CRON_SECRET`
- `LOCAL_DB`

## Haber Çekme

- Yönetim panelindeki haber çekme akışı ile
- veya `POST /api/admin/cron-fetch`

Header:

```text
Authorization: Bearer <CRON_SECRET>
```

## Repo Notları

- `node_modules`, `.next`, `.run` ve `.env.local` repoya dahil edilmez.
- Yüklenen medya dosyaları `public/uploads/` altında tutulur.
