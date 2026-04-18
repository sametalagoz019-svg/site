let prayerCache = {
  expiresAt: 0,
  timings: null
};

function sanitizeTiming(value = "") {
  return String(value).split(" ")[0];
}

export default async function handler(req, res) {
  const now = Date.now();

  if (prayerCache.timings && prayerCache.expiresAt > now) {
    return res.status(200).json({ timings: prayerCache.timings, cached: true });
  }

  try {
    const response = await fetch(
      "https://api.aladhan.com/v1/timingsByCity?city=Sivas&country=Turkey&method=13",
      {
        headers: {
          Accept: "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error("Prayer API request failed");
    }

    const payload = await response.json();
    const rawTimings = payload?.data?.timings || {};
    const timings = {
      Fajr: sanitizeTiming(rawTimings.Fajr),
      Sunrise: sanitizeTiming(rawTimings.Sunrise),
      Dhuhr: sanitizeTiming(rawTimings.Dhuhr),
      Asr: sanitizeTiming(rawTimings.Asr),
      Maghrib: sanitizeTiming(rawTimings.Maghrib),
      Isha: sanitizeTiming(rawTimings.Isha)
    };

    prayerCache = {
      timings,
      expiresAt: now + 1000 * 60 * 60 * 6
    };

    return res.status(200).json({ timings, cached: false });
  } catch (error) {
    if (prayerCache.timings) {
      return res.status(200).json({ timings: prayerCache.timings, cached: true, stale: true });
    }

    return res.status(502).json({ message: "Prayer times unavailable" });
  }
}
