# Sivas Gündem 58

Next.js tabanlı yerel haber sitesi. Proje iki modda çalışabilir:

- `LOCAL_DB=1`: MongoDB olmadan, proje içindeki JSON veri dosyasıyla
- `LOCAL_DB=0`: MongoDB bağlantısıyla

## Özellikler

- Mobil uyumlu haber arayüzü
- Admin giriş sistemi
- Haber oluşturma, düzenleme ve silme
- Taslak, onay bekleyen ve yayınlanan haber akışı
- Görsel yükleme
- Makale görüntülenme ve ziyaretçi istatistikleri
- İnternetten Sivas odaklı haber çekme ve onaya bırakma
- `CRON_SECRET` ile tetiklenebilen cron endpoint

## Hızlı Başlangıç

1. `.env.example` dosyasını `.env.local` olarak kopyala.
2. Yerel mod için `.env.local` içinde `LOCAL_DB=1` bırak.
3. `npm install`
4. `npm run dev`

Not: Bu ortamda `next dev` alt süreç izni yüzünden çalışmayabiliyor. Bu durumda:

```bash
npm run build
npm run start
```

## Varsayılan Admin Hesabı

İlk girişte `.env.local` içindeki `ADMIN_EMAIL` ve `ADMIN_PASSWORD` kullanılır. Kullanıcı yoksa sistem otomatik oluşturur.

## Yerel Veri Modu

- Veriler `data/localdb.json` dosyasında tutulur.
- Haber oluşturma, düzenleme, silme ve admin girişi bu modda çalışır.
- MongoDB kurulmadan demo ve içerik hazırlığı için yeterlidir.

## MongoDB Moduna Geçiş

1. Makinede MongoDB kur.
2. `.env.local` içindeki `MONGODB_URI` değerini gerçek bağlantıya ayarla.
3. `LOCAL_DB=0` yap.
4. Uygulamayı yeniden başlat.

## Otomatik Haber Çekme

- Yönetim panelinden `İnternetten Sivas Haberlerini Çek` butonu ile
- Ya da `POST /api/admin/cron-fetch` ve `Authorization: Bearer <CRON_SECRET>` ile
