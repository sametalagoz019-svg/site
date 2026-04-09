import { useEffect } from "react";

function getVisitorId() {
  if (typeof window === "undefined") {
    return null;
  }

  const existing = window.localStorage.getItem("sg58_visitor_id");

  if (existing) {
    return existing;
  }

  const created = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  window.localStorage.setItem("sg58_visitor_id", created);
  return created;
}

export default function AnalyticsTracker({ newsId }) {
  useEffect(() => {
    const visitorId = getVisitorId();

    if (!visitorId) {
      return;
    }

    fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId })
    }).catch(() => null);

    if (newsId) {
      fetch("/api/analytics/article-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, newsId })
      }).catch(() => null);
    }
  }, [newsId]);

  return null;
}
