function extractYouTubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/
  );
  return match ? match[1] : "";
}

function extractVimeoId(url) {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : "";
}

export function getVideoEmbedUrl(url = "") {
  const value = String(url || "").trim();

  if (!value) {
    return "";
  }

  if (value.includes("<iframe")) {
    const srcMatch = value.match(/src=["']([^"']+)["']/i);
    return srcMatch ? srcMatch[1] : "";
  }

  if (value.includes("youtube.com") || value.includes("youtu.be")) {
    const id = extractYouTubeId(value);
    return id ? `https://www.youtube.com/embed/${id}` : value;
  }

  if (value.includes("vimeo.com")) {
    const id = extractVimeoId(value);
    return id ? `https://player.vimeo.com/video/${id}` : value;
  }

  return value;
}
