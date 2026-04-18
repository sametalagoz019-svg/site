import { slugify } from "./slugify";
import News from "../models/News";
import dbConnect from "./dbConnect";
import { DEFAULT_NEWS_IMAGE } from "./constants";

function decodeHtml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value = "") {
  return decodeHtml(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(content, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  return content.match(regex)?.[1] || "";
}

function matchMeta(content, key) {
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const alternateRegex = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["'][^>]*>`,
    "i"
  );

  return content.match(regex)?.[1] || content.match(alternateRegex)?.[1] || "";
}

function inferCategory(text) {
  const haystack = text.toLowerCase();

  if (/(belediye|mahalle|sivas|ilçe|valilik|yerel)/i.test(haystack)) return "Yerel";
  if (/(meclis|bakan|parti|milletvekili|seçim)/i.test(haystack)) return "Siyaset";
  if (/(maç|spor|gol|lig|takım|futbol|voleybol)/i.test(haystack)) return "Spor";
  if (/(ekonomi|yatırım|faiz|esnaf|sanayi|ticaret)/i.test(haystack)) return "Ekonomi";
  if (/(okul|üniversite|öğrenci|eğitim)/i.test(haystack)) return "Eğitim";
  if (/(hastane|doktor|sağlık|tedavi)/i.test(haystack)) return "Sağlık";
  if (/(festival|konser|müze|sanat|kültür)/i.test(haystack)) return "Kültür";
  return "Gündem";
}

function summarize(text) {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return "";
  }

  return sentences.slice(0, 3).join(" ");
}

function buildUniqueContent({ title, summary, sourceName }) {
  const intro = `${title} başlığıyla gündeme gelen gelişme, Sivas odaklı haber akışında dikkat çekti.`;
  const detail = summary || "İlk bilgilere göre olayla ilgili resmi açıklamaların ve yerel kaynakların aktardığı detaylar izleniyor.";
  const outro = `${sourceName || "Kaynak"} tarafından paylaşılan bilgiler derlenerek özgün bir haber metnine dönüştürüldü. Gelişmeler oldukça içerik güncellenecektir.`;

  return [intro, detail, outro].join("\n\n");
}

function xmlItems(xml = "") {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
  return items.map((match) => match[1]);
}

async function fetchArticleDetails(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!response.ok) {
      return {};
    }

    const html = await response.text();
    const title = stripTags(extractTag(html, "title"));
    const description =
      decodeHtml(matchMeta(html, "og:description")) ||
      decodeHtml(matchMeta(html, "description"));
    const image =
      matchMeta(html, "og:image") ||
      html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ||
      "";

    return {
      articleTitle: title,
      articleDescription: stripTags(description),
      image
    };
  } catch (error) {
    return {};
  }
}

function createExcerpt(text) {
  return text.length > 170 ? `${text.slice(0, 167)}...` : text;
}

export async function fetchSivasNewsFromInternet(limit = 8) {
  const endpoint =
    "https://www.bing.com/news/search?q=Sivas&format=rss&mkt=tr-TR";

  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  if (!response.ok) {
    throw new Error("Harici haber akışı alınamadı.");
  }

  const xml = await response.text();
  const items = xmlItems(xml).slice(0, limit);
  const results = [];

  for (const item of items) {
    const title = stripTags(extractTag(item, "title"));
    const link = stripTags(extractTag(item, "link"));
    const rawDescription = stripTags(extractTag(item, "description"));
    const pubDate = stripTags(extractTag(item, "pubDate"));
    const sourceName = stripTags(extractTag(item, "source")) || "İnternet Kaynağı";
    const details = link ? await fetchArticleDetails(link) : {};
    const combinedText = [rawDescription, details.articleDescription, details.articleTitle]
      .filter(Boolean)
      .join(" ");
    const summary = summarize(combinedText);

    results.push({
      title,
      slug: slugify(title),
      sourceName,
      sourceUrl: link,
      imageUrl: details.image || DEFAULT_NEWS_IMAGE,
      category: inferCategory(`${title} ${combinedText}`),
      excerpt: createExcerpt(summary || rawDescription || title),
      content: buildUniqueContent({ title, summary, sourceName }),
      status: "pending",
      isAutomated: true,
      automatedSourceSummary: combinedText,
      publishedAt: pubDate ? new Date(pubDate) : new Date()
    });
  }

  return results.filter((item) => item.title && item.slug);
}

export async function ingestAutomatedNews(limit = 8) {
  await dbConnect();

  const items = await fetchSivasNewsFromInternet(limit);
  const savedItems = [];

  for (const item of items) {
    const exists = await News.findOne({
      $or: [{ slug: item.slug }, { sourceUrl: item.sourceUrl }]
    });

    if (exists) {
      continue;
    }

    const created = await News.create(item);
    savedItems.push(created);
  }

  return savedItems;
}
