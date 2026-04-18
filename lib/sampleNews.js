import { CATEGORY_IMAGE_SUGGESTIONS, CATEGORIES } from "./constants";

const SAMPLE_NEWS_BY_CATEGORY = {
  Yerel: {
    title: "Mahalle ölçeğinde yeni kent hizmet noktaları planlanıyor",
    excerpt:
      "Vatandaş başvurularını hızlandırmak için farklı mahallelerde küçük hizmet noktaları kurulması değerlendiriliyor.",
    content:
      "Sivas'ta mahalle bazlı kamu hizmetlerine erişimi kolaylaştıracak yeni hizmet noktaları için ön çalışma başlatıldı.\n\nPlanlama dosyasında nüfus yoğunluğu, mevcut ulaşım imkanı ve günlük başvuru trafiği gibi başlıklar dikkate alınıyor.\n\nTaslak çalışma tamamlandıktan sonra pilot mahallelerin açıklanması bekleniyor.",
    tags: ["yerel", "mahalle", "hizmet"]
  },
  Siyaset: {
    title: "İl gündeminde kurumlar arası ortak proje takvimi hazırlanıyor",
    excerpt:
      "Yatırım başlıklarında eş zamanlı ilerleme sağlamak için yeni bir koordinasyon takvimi oluşturulacak.",
    content:
      "Sivas'ta farklı kamu kurumlarının yürüttüğü yatırım ve hizmet projelerini tek takvimde toplamak için yeni bir planlama süreci başladı.\n\nAmaç, aynı bölgede yürüyen işlerde çakışmayı azaltmak ve kaynak kullanımını verimli hale getirmek.\n\nÇalışmanın ilk sonuçlarının önümüzdeki toplantı döneminde paylaşılması bekleniyor.",
    tags: ["siyaset", "koordinasyon", "yatirim"]
  },
  Spor: {
    title: "Genç sporcular için hafta içi gelişim kampı programı hazırlanıyor",
    excerpt:
      "Kulüpler ve okul antrenörleriyle ortak yürütülecek yeni gelişim programı için içerik taslağı tamamlandı.",
    content:
      "Sivas'ta genç sporcuların temel performans, beslenme ve kondisyon gelişimini desteklemek için yeni bir kamp programı planlanıyor.\n\nProgramda saha antrenmanlarıyla birlikte sporcu eğitimi ve velilere yönelik bilgilendirme oturumları yer alacak.\n\nİlk uygulamanın yaz döneminde sınırlı kontenjanla başlaması hedefleniyor.",
    tags: ["spor", "kamp", "genc"]
  },
  Ekonomi: {
    title: "Kent esnafı için ortak kampanya takvimi üzerinde çalışılıyor",
    excerpt:
      "Sezonluk satış hareketliliğini artırmak için çarşı bazlı ortak kampanya modeli gündemde.",
    content:
      "Sivas'ta küçük ve orta ölçekli işletmeler için ortak kampanya takvimi hazırlanmasına yönelik görüşmeler başladı.\n\nPlan; belirli dönemlerde çarşı ve cadde ölçeğinde ortak indirim, vitrin ve duyuru düzeni kurulmasını öngörüyor.\n\nİşletmelerden gelen geri bildirimlere göre kapsamın yaz aylarında genişlemesi bekleniyor.",
    tags: ["ekonomi", "esnaf", "kampanya"]
  },
  "Eğitim": {
    title: "Öğrenciler için hafta sonu etüt merkezleri modeli değerlendiriliyor",
    excerpt:
      "Sınav dönemlerinde destek sağlamak için mahalle bazlı etüt noktaları kurulması gündeme geldi.",
    content:
      "Sivas'ta sınav hazırlık sürecindeki öğrenciler için erişilebilir etüt merkezleri kurulmasına yönelik ön değerlendirme tamamlandı.\n\nModelde rehberlik, soru çözüm desteği ve sessiz çalışma alanları bir arada planlanıyor.\n\nYer seçimi ve eğitmen planlamasının ardından uygulama takvimi netleşecek.",
    tags: ["egitim", "ogrenci", "etut"]
  },
  "Sağlık": {
    title: "Koruyucu sağlık hizmetlerinde yeni bilgilendirme dönemi planlanıyor",
    excerpt:
      "Mahalle odaklı bilgilendirme buluşmalarıyla erken başvurunun önemi daha görünür hale getirilecek.",
    content:
      "Sivas'ta koruyucu sağlık hizmetlerinin yaygınlaştırılması amacıyla mahalle merkezli bilgilendirme toplantıları için hazırlık yapılıyor.\n\nProgramın; kronik takip, düzenli kontrol ve aile hekimliği hizmetlerine erişim konularında farkındalık üretmesi bekleniyor.\n\nTakvimin ilgili kurumlarla görüşmelerin ardından açıklanacağı belirtildi.",
    tags: ["saglik", "bilgilendirme", "mahalle"]
  },
  "Kültür": {
    title: "Şehir hafızasına odaklanan yeni söyleşi serisi için hazırlık başladı",
    excerpt:
      "Kent belleği, mimari ve sanat hayatını konu alan çok bölümlü bir söyleşi dizisi planlanıyor.",
    content:
      "Sivas'ta kent belleğini canlı tutacak yeni bir kültür söyleşileri dizisi için hazırlık süreci başlatıldı.\n\nProgramda tarihçiler, sanat üreticileri ve yerel hafıza çalışmaları yapan isimlerin yer alması planlanıyor.\n\nİlk oturumun kültür sezonu açılışıyla birlikte duyurulması bekleniyor.",
    tags: ["kultur", "soylesi", "sehir"]
  },
  "Gündem": {
    title: "Kent genelinde yeni hizmet başlıkları için ön değerlendirme yapılıyor",
    excerpt:
      "Farklı kurumların gündemindeki ortak başlıklar tek dosyada toplanarak öncelik sırasına alınacak.",
    content:
      "Sivas'ta vatandaşın günlük yaşamını doğrudan etkileyen hizmet başlıklarını önceliklendirmek amacıyla yeni bir değerlendirme süreci yürütülüyor.\n\nDosyada ulaşım, altyapı, sosyal alanlar ve kamu erişimi gibi farklı alanlar birlikte ele alınıyor.\n\nSonuçların kısa süre içinde ilgili birimlerle paylaşılması planlanıyor.",
    tags: ["gundem", "kent", "hizmet"]
  }
};

export function buildSampleNews() {
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const sample = SAMPLE_NEWS_BY_CATEGORY[category];
  const imageOptions = CATEGORY_IMAGE_SUGGESTIONS[category] || [];
  const imageUrl = imageOptions[0] || "";

  return {
    ...sample,
    category,
    imageUrl,
    sourceName: "Sivas Gündem",
    sourceUrl: "",
    status: "draft",
    isFeatured: false
  };
}
