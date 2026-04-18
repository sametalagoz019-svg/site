import { useEffect, useState } from "react";
import NewsCard from "./NewsCard";

export default function FeaturedSlider({ items }) {
  const safeItems = items.filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (safeItems.length < 2) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % safeItems.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [safeItems.length]);

  useEffect(() => {
    setActiveIndex(0);
  }, [safeItems.length]);

  if (!safeItems.length) {
    return null;
  }

  return (
    <div className="hero-slider">
      <NewsCard news={safeItems[activeIndex]} priority />
      {safeItems.length > 1 ? (
        <div className="slider-dots">
          {safeItems.map((item, index) => (
            <button
              key={item._id}
              type="button"
              className={`slider-dot ${index === activeIndex ? "slider-dot-active" : ""}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`${index + 1}. manşeti göster`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
