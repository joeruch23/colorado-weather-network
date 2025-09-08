
import { NextResponse } from "next/server";

type Body = { message?: string; lat?: number; lon?: number; city?: string };

// ---------- helpers ----------
async function geocodeCity(name: string) {
  try {
    const u = new URL("https://geocoding-api.open-meteo.com/v1/search");
    u.searchParams.set("name", name);
    u.searchParams.set("count", "1");
    u.searchParams.set("language", "en");
    u.searchParams.set("format", "json");
    const r = await fetch(u.toString());
    const j = await r.json();
    const first = j?.results?.[0];
    if (first) return { lat: first.latitude, lon: first.longitude, name: `${first.name}, ${first.admin1 || ""}`.trim() };
  } catch {}
  return null;
}

async function fetchForecast(lat: number, lon: number) {
  const u = new URL("https://api.open-meteo.com/v1/forecast");
  u.searchParams.set("latitude", String(lat));
  u.searchParams.set("longitude", String(lon));
  u.searchParams.set("timezone", "auto");
  u.searchParams.set("current", "temperature_2m,weathercode,wind_speed_10m,precipitation,relative_humidity_2m");
  u.searchParams.set("hourly", "temperature_2m,precipitation_probability,weathercode,wind_speed_10m");
  u.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode");
  const r = await fetch(u.toString());
  const j = await r.json();
  return j;
}

async function fetchSnow(lat: number, lon: number) {
  // Daily snowfall_sum in cm from Open-Meteo
  const u = new URL("https://api.open-meteo.com/v1/forecast");
  u.searchParams.set("latitude", String(lat));
  u.searchParams.set("longitude", String(lon));
  u.searchParams.set("timezone", "auto");
  u.searchParams.set("daily", "snowfall_sum,temperature_2m_max,temperature_2m_min");
  const r = await fetch(u.toString());
  const j = await r.json();
  return j?.daily;
}

async function fetchAlertsCO() {
  const r = await fetch("https://api.weather.gov/alerts/active?area=CO", {
    headers: { "User-Agent": "ColoradoWeatherNetwork (chat)" },
    next: { revalidate: 300 }
  });
  if (!r.ok) return [];
  const j = await r.json();
  return Array.isArray(j?.features) ? j.features : [];
}

function summarize(hourly: any, daily: any) {
  try {
    const now = Date.now();
    const times: string[] = hourly?.time || [];
    const temps: number[] = hourly?.temperature_2m || [];
    const pops: number[] = hourly?.precipitation_probability || [];
    let start = 0;
    for (let i = 0; i < times.length; i++) if (new Date(times[i]).getTime() >= now) { start = i; break; }
    const end = Math.min(start + 24, times.length);
    const seg = [];
    for (let i = start; i < end; i++) {
      seg.push({ time: times[i], temp: temps[i], pop: pops[i] });
    }
    const d3 = [];
    for (let i = 0; i < Math.min(3, (daily?.time || []).length); i++) {
      d3.push({ day: daily.time[i], tmax: daily.temperature_2m_max[i], tmin: daily.temperature_2m_min[i], psum: daily.precipitation_sum[i] });
    }
    return { hourly24: seg, daily3: d3 };
  } catch { return { hourly24: [], daily3: [] }; }
}

// Intent detection (very light)
function getIntent(q: string) {
  const s = q.toLowerCase();
  if (/(traffic|road|closure|chains?|accident|crash|conditions on|i-?70|i-?25|us-\d+|co-\d+)/.test(s)) return "traffic";
  if (/(camera|cam)/.test(s)) return "cameras";
  if (/(snow|powder|inches|ski|resort)/.test(s)) return "snow";
  if (/(alert|warning|watch|advis)/.test(s)) return "alerts";
  if (/(hour|24)/.test(s)) return "hourly";
  if (/(3[- ]?day|three day|daily|next days?)/.test(s)) return "daily";
  return "weather";
}

function extractCities(q: string) {
  // naive: look for "from X to Y" or "X to Y"
  const m = q.match(/from\s+([^,]+?)\s+to\s+([^,?!.]+)/i) || q.match(/([\w\s.-]+)\s+to\s+([\w\s.-]+)/i);
  if (m) return { a: m[1].trim(), b: m[2].trim() };
  return null;
}

function corridorLink(a: string, b: string) {
  const S = (s:string)=>s.toLowerCase();
  const sa = S(a), sb = S(b);
  if ((sa.includes("denver") && sb.includes("vail")) || (sb.includes("denver") && sa.includes("vail"))) {
    return { label: "I-70 Denver ⇄ Vail cameras & events", url: "https://maps.cotrip.org/search/roadway%3DI-70/%40-109.05147%2C39.10202%2C-102.04872%2C39.78645/%40-108.6812%2C39.9851%2C6?show=roadWork%2CwinterDriving%2CroadReports%2CweatherWarnings%2CchainLaws" };
  }
  if ((sa.includes("denver") && sb.includes("colorado springs")) || (sb.includes("denver") && sa.includes("colorado springs"))) {
    return { label: "I-25 Denver ⇄ Colorado Springs events", url: "https://maps.cotrip.org/search/roadway%3DI-25/%40-105.01816%2C36.99388%2C-104.47999%2C40.99807/%40-105.87517%2C39.27293%2C7?show=winterDriving%2CroadReports%2CchainLaws%2CmileMarkers" };
  }
  if ((sa.includes("durango") && sb.includes("ouray")) || (sb.includes("durango") && sa.includes("ouray"))) {
    return { label: "US-550 Durango ⇄ Ouray events", url: "https://maps.cotrip.org/search/roadway%3DUS-550/%40-108.8%2C36.8%2C-107.2%2C39.0/%40-107.7%2C37.7%2C9?show=roadWork%2CwinterDriving%2CroadReports%2CweatherWarnings%2CchainLaws" };
  }
  return null;
}

function fmtHour(s: string) {
  const d = new Date(s);
  const h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = ((h + 11) % 12) + 1;
  return `${hr}${ampm}`;
}
function fmtDow(s: string) {
  const d = new Date(s);
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

// ---------- main ----------
export async function POST(req: Request) {
  try {
    const body: Body = await req.json();
    const q = (body.message || "").trim();
    const intent = getIntent(q);
    let lat = body.lat, lon = body.lon;
    let place = body.city?.trim();
    let text = "";

    // Optional geocoding if user typed a city but no coords
    if ((!lat || !lon) && place) {
      const hit = await geocodeCity(place);
      if (hit) { lat = hit.lat; lon = hit.lon; place = hit.name; }
    }

    // Handle traffic/corridor queries first
    if (intent === "traffic") {
      const cities = extractCities(q);
      const links: string[] = [];
      if (cities) {
        const link = corridorLink(cities.a, cities.b);
        if (link) links.push(`• ${link.label}: ${link.url}`);
      }
      if (!links.length) {
        links.push("• COtrip list of events: https://maps.cotrip.org/list/events");
        links.push("• COtrip cameras: https://maps.cotrip.org/list/cameras");
      }
      const alerts = await fetchAlertsCO();
      const travelTerms = /(Winter|Blizzard|Snow|Ice|High Wind|Dust|Avalanche)/i;
      const relevant = alerts.filter((f:any)=> travelTerms.test(f?.properties?.event || ""));
      text = [
        "Roads (COtrip):",
        ...links,
        relevant.length ? "Recent travel-related alerts:" : "No travel-related NWS alerts in Colorado right now.",
        ...relevant.slice(0,4).map((a:any)=>`• ${a.properties.event}: ${(a.properties.headline||"").slice(0,100)}`)
      ].join("\n");
    } else if (intent === "cameras") {
      text = [
        "Try the cameras page here: /cameras",
        "Official COtrip cameras list (filters & search): https://maps.cotrip.org/list/cameras",
        "Tip: In our Cameras page use I‑70 / I‑25 filters and search spots like “Eisenhower” or “Vail”."
      ].join("\n");
    } else if (intent === "snow") {
      // If user typed a city/resort name, try geocoding it. Else use coords or Denver fallback.
      if (!lat || !lon) {
        const m = q.match(/(?:at|for)\s+([\w\s.'-]+)$/i);
        const target = m?.[1]?.trim();
        if (target) {
          const hit = await geocodeCity(target);
          if (hit) { lat = hit.lat; lon = hit.lon; place = hit.name; }
        }
      }
      if (!lat || !lon) { lat = 39.7392; lon = -104.9903; place = place || "Denver, CO (default)"; }
      const d = await fetchSnow(lat, lon);
      if (d?.time?.length) {
        // snowfall_sum is in cm. Show 24h (today vs yesterday) and 72h (next 3 days sum).
        const cm = (i:number)=> (d.snowfall_sum?.[i] ?? 0);
        const toInches = (x:number)=> (x/2.54).toFixed(1);
        const day0 = cm(0), day1 = cm(1), day2 = cm(2);
        const total72 = day0 + day1 + day2;
        text = [
          `Snow outlook for ${place || "your location"}:`,
          `• Today: ${toInches(day0)}" (approx)`,
          `• Next 72h total: ${toInches(total72)}"`,
          `• High/Low today: ${Math.round(d.temperature_2m_max?.[0] ?? 0)}° / ${Math.round(d.temperature_2m_min?.[0] ?? 0)}°`,
          "Note: This is model guidance from Open‑Meteo and may differ from resort reports."
        ].join("\n");
      } else {
        text = "I couldn't fetch snow totals just now. Try a specific place like “snow for Vail” or check the /winter page.";
      }
    } else {
      // Weather/alerts/hourly/daily use forecast + alerts
      if (!lat || !lon) { lat = 39.7392; lon = -104.9903; place = place || "Denver, CO (default)"; }
      const forecast = await fetchForecast(lat, lon);
      const alerts = await fetchAlertsCO();
      const summary = summarize(forecast?.hourly, forecast?.daily);
      if (intent === "alerts") {
        if (!alerts.length) {
          text = "No active NWS alerts for Colorado right now.";
        } else {
          text = ["Active Colorado alerts (NWS):", ...alerts.slice(0,6).map((a:any)=>`• ${a.properties.event}: ${(a.properties.headline||'').slice(0,120)}`), "See /alerts for the full list."].join("\n");
        }
      } else if (intent === "hourly") {
        const rows = summary.hourly24;
        if (!rows.length) text = "Hourly data unavailable at the moment. Try again shortly.";
        else {
          text = ["Next 24 hours (temp° / precip%):", ...rows.map((h:any)=>`• ${fmtHour(h.time)}: ${Math.round(h.temp)}° / ${h.pop ?? 0}%`)].join("\n");
        }
      } else if (intent === "daily") {
        const rows = summary.daily3;
        if (!rows.length) text = "Daily data unavailable at the moment. Try again shortly.";
        else {
          text = ["Next 3 days (high/low, precip sum):", ...rows.map((d:any)=>`• ${fmtDow(d.day)}: ${Math.round(d.tmax)}°/${Math.round(d.tmin)}°, precip ${d.psum ?? 0}`)].join("\n");
        }
      } else {
        const cur = forecast?.current;
        const first = summary.hourly24?.[0];
        if (cur) {
          text = `Current for ${place || "your location"}: ${Math.round(cur.temperature_2m)}°, wind ${cur.wind_speed_10m} m/s, RH ${cur.relative_humidity_2m}%`;
          if (first) text += ` · Next hour ~ ${Math.round(first.temp)}°, precip ${first.pop ?? 0}%`;
          text += "\nAsk me for “hourly” or “3‑day” for details.";
        } else {
          text = "I couldn’t get current conditions. Try again or ask for “hourly” or “3‑day” instead.";
        }
      }

      // Optional OpenAI polish
      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey) {
        try {
          const system = [
            "You are a concise Colorado weather assistant for a public website.",
            "Use the given raw text ANSWER as a base. Improve clarity and formatting slightly.",
            "Do not invent facts. Keep it brief."
          ].join("\n");
          const resp = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "content-type": "application/json", "authorization": `Bearer ${openaiKey}` },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [{ role: "system", content: system }, { role: "user", content: "ANSWER:\n"+text }],
              temperature: 0.2
            })
          });
          if (resp.ok) {
            const j = await resp.json();
            const polished = j?.choices?.[0]?.message?.content?.trim();
            if (polished) text = polished;
          }
        } catch {}
      }
    }

    return NextResponse.json({ ok: true, text });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 });
  }
}
