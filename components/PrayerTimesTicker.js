import { useEffect, useMemo, useState } from "react";

const LABELS = [
  ["Fajr", "İmsak"],
  ["Sunrise", "Güneş"],
  ["Dhuhr", "Öğle"],
  ["Asr", "İkindi"],
  ["Maghrib", "Akşam"],
  ["Isha", "Yatsı"]
];

function toMinutes(value) {
  const [hours, minutes] = String(value || "00:00")
    .split(":")
    .map((part) => Number(part));

  return hours * 60 + minutes;
}

function getUpcomingPrayer(timings, now) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const [key, label] of LABELS) {
    const prayerMinutes = toMinutes(timings[key]);

    if (prayerMinutes > currentMinutes) {
      return { label, time: timings[key] };
    }
  }

  return { label: LABELS[0][1], time: timings.Fajr || "--:--" };
}

export default function PrayerTimesTicker() {
  const [timings, setTimings] = useState(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let active = true;

    async function loadTimes() {
      try {
        const response = await fetch("/api/prayer-times");
        const payload = await response.json();

        if (active && response.ok) {
          setTimings(payload.timings || null);
        }
      } catch {}
    }

    loadTimes();
    const timer = window.setInterval(() => setNow(new Date()), 60000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const upcoming = useMemo(() => {
    if (!timings) {
      return null;
    }

    return getUpcomingPrayer(timings, now);
  }, [timings, now]);

  return (
    <div className="prayer-ticker" aria-live="polite">
      <span>Sivas Namaz Saatleri</span>
      <strong>{upcoming ? `Sivas | ${upcoming.label}: ${upcoming.time}` : "Yükleniyor"}</strong>
    </div>
  );
}
