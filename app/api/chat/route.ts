
import { NextResponse } from "next/server";

type Body = { message?: string; lat?: number; lon?: number; city?: string };

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

function basicReply(q: string, ctx: any) {
  const lower = (q||"").toLowerCase();
  const { current } = ctx.forecast || {};
  const { hourly24, daily3 } = ctx.summary || { hourly24: [], daily3: [] };
  let out = "";
  if (/alert|warning|watch|advis/i.test(lower)) {
    if (!ctx.alerts?.length) return "No active NWS alerts for Colorado right now.";
    out += `Active Colorado alerts (NWS):\n`;
    for (const a of ctx.alerts.slice(0, 6)) {
      out += `• ${a?.properties?.event}: ${(a?.properties?.headline||'').slice(0,120)}\n`;
    }
    out += "See /alerts for the full list.";
    return out;
  }
  if (/hour|24/.test(lower)) {
    out += "Next 24 hours (temp° / precip%):\n";
    for (const h of hourly24.slice(0, 24)) {
      const t = new Date(h.time).toLocaleTimeString(undefined,{hour:'numeric'});
      out += `• ${t}: ${Math.round(h.temp)}° / ${h.pop ?? 0}%\n`;
    }
    return out;
  }
  if (/3[- ]?day|three day|daily/.test(lower)) {
    out += "Next 3 days (high/low, precip sum):\n";
    for (const d of daily3) {
      const dow = new Date(d.day).toLocaleDateString(undefined,{weekday:'short'});
      out += `• ${dow}: ${Math.round(d.tmax)}°/${Math.round(d.tmin)}°, precip ${d.psum ?? 0}\n`;
    }
    return out;
  }
  if (current) {
    out += `Current: ${Math.round(current.temperature_2m)}°, wind ${current.wind_speed_10m} m/s, RH ${current.relative_humidity_2m}%`;
    if (hourly24?.length) {
      const first = hourly24[0];
      const t = new Date(first.time).toLocaleTimeString(undefined,{hour:'numeric'});
      out += ` · Next hour ~ ${Math.round(first.temp)}°, precip ${first.pop ?? 0}%`;
    }
    out += "\nAsk me for “hourly” or “3-day” for more detail.";
    return out;
  }
  return "Try asking: “current conditions,” “hourly forecast,” “3‑day forecast,” or “any alerts?”";
}

export async function POST(req: Request) {
  try {
    const body: Body = await req.json();
    const q = body.message?.trim() || "";
    let lat = body.lat, lon = body.lon;
    let place = body.city?.trim();

    if ((!lat || !lon) && place) {
      const hit = await geocodeCity(place);
      if (hit) { lat = hit.lat; lon = hit.lon; place = hit.name; }
    }
    if (!lat || !lon) { lat = 39.7392; lon = -104.9903; place = place || "Denver, CO (default)"; }

    const forecast = await fetchForecast(lat, lon);
    const alerts = await fetchAlertsCO();
    const summary = summarize(forecast?.hourly, forecast?.daily);
    const ctx = { place, lat, lon, forecast, alerts, summary };

    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      const system = [
        "You are an ultra-concise Colorado weather assistant for a public website.",
        "Only use the provided CONTEXT (forecast JSON and alerts).",
        "Prefer numbers and bullet points. Avoid speculation. Keep answers under 120 words unless user asks for detail."
      ].join("\n");
      const context = JSON.stringify({ place, lat, lon, summary, alerts: alerts.map((a:any)=>({event:a.properties?.event, headline:a.properties?.headline, area:a.properties?.areaDesc})) }).slice(0, 12000);
      const user = `User question: ${q || "summarize current and next 24h"}\nCONTEXT: ${context}`;
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", "authorization": `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "system", content: system }, { role: "user", content: user }],
          temperature: 0.2
        })
      });
      if (resp.ok) {
        const j = await resp.json();
        const text = j?.choices?.[0]?.message?.content?.trim();
        if (text) return NextResponse.json({ ok: true, text });
      }
    }

    const text = basicReply(q, ctx);
    return NextResponse.json({ ok: true, text });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 });
  }
}
