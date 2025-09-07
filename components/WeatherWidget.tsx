
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

type Unit = "fahrenheit" | "celsius";

type WeatherData = {
  current?: {
    temperature_2m?: number;
    weathercode?: number;
    wind_speed_10m?: number;
    precipitation?: number;
    relative_humidity_2m?: number;
  };
  hourly?: { time: string[]; temperature_2m: number[]; precipitation_probability: number[]; weathercode: number[]; wind_speed_10m: number[] };
  daily?: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_sum: number[]; weathercode: number[]; sunrise: string[]; sunset: string[] };
};

function wcToIcon(wc?: number) {
  if (wc == null) return "•";
  if ([0].includes(wc)) return "☀️";
  if ([1,2,3].includes(wc)) return "⛅";
  if ([45,48].includes(wc)) return "🌫️";
  if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(wc)) return "🌧️";
  if ([71,73,75,77,85,86].includes(wc)) return "❄️";
  if ([95,96,99].includes(wc)) return "⛈️";
  return "•";
}
function wcToTheme(wc?: number) {
  if (wc == null) return "theme-clear";
  if ([0].includes(wc)) return "theme-clear";
  if ([1,2,3,45,48].includes(wc)) return "theme-cloudy";
  if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(wc)) return "theme-rain";
  if ([71,73,75,77,85,86].includes(wc)) return "theme-snow";
  if ([95,96,99].includes(wc)) return "theme-storm";
  return "theme-clear";
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

export default function WeatherWidget() {
  const [unit, setUnit] = useState<Unit>("fahrenheit");
  const [pos, setPos] = useState<{lat:number;lon:number}|null>(null);
  const [manual, setManual] = useState<{lat:string;lon:string}>({ lat: "", lon: "" });
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tick, setTick] = useState(0); // for minute updates

  const requestGeo = useCallback(() => {
    if (!navigator.geolocation) {
      setErr("Geolocation not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => { setPos({ lat: p.coords.latitude, lon: p.coords.longitude }); setErr(null); },
      () => setErr("Location permission denied. Enter lat/lon manually.")
    );
  }, []);

  const fetchWeather = useCallback(async (lat: number, lon: number, u: Unit) => {
    setLoading(true);
    try {
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", String(lat));
      url.searchParams.set("longitude", String(lon));
      url.searchParams.set("timezone", "auto");
      url.searchParams.set("current", "temperature_2m,weathercode,wind_speed_10m,precipitation,relative_humidity_2m");
      url.searchParams.set("hourly", "temperature_2m,precipitation_probability,weathercode,wind_speed_10m");
      url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,sunrise,sunset");
      url.searchParams.set("temperature_unit", u);
      url.searchParams.set("wind_speed_unit", u === "fahrenheit" ? "mph" : "ms");
      url.searchParams.set("precipitation_unit", u === "fahrenheit" ? "inch" : "mm");
      const r = await fetch(url.toString());
      const j = await r.json();
      setData(j);
    } catch (e:any) {
      setErr(e.message || "Failed to fetch weather.");
    } finally {
      setLoading(false);
    }
  }, []);

  // initial geolocation
  useEffect(() => { requestGeo(); }, [requestGeo]);

  // refresh current time every minute (affects background subtle animation)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // hourly refresh of forecast (5 minutes)
  useEffect(() => {
    if (!pos) return;
    fetchWeather(pos.lat, pos.lon, unit);
    const id = setInterval(() => fetchWeather(pos.lat, pos.lon, unit), 5 * 60_000);
    return () => clearInterval(id);
  }, [pos, unit, fetchWeather]);

  // manual submit
  const onManualApply = () => {
    const lat = parseFloat(manual.lat);
    const lon = parseFloat(manual.lon);
    if (isNaN(lat) || isNaN(lon)) { setErr("Please enter valid numbers for lat/lon."); return; }
    setPos({ lat, lon });
    setErr(null);
  };

  // Derive next 24 hourly
  const hourly24 = useMemo(() => {
    const h = data?.hourly;
    if (!h?.time?.length) return [];
    const now = Date.now();
    let start = 0;
    for (let i = 0; i < h.time.length; i++) {
      const t = new Date(h.time[i]).getTime();
      if (t >= now) { start = i; break; }
    }
    const end = Math.min(start + 24, h.time.length);
    const out: { time: string; temp: number; pop: number; wc: number }[] = [];
    for (let i = start; i < end; i++) {
      out.push({
        time: h.time[i],
        temp: h.temperature_2m[i],
        pop: h.precipitation_probability[i],
        wc: h.weathercode[i]
      });
    }
    return out;
  }, [data, tick]);

  // Derive 3 daily
  const daily3 = useMemo(() => {
    const d = data?.daily;
    if (!d?.time?.length) return [];
    const out: { day: string; tmax: number; tmin: number; psum: number; wc: number }[] = [];
    for (let i = 0; i < Math.min(3, d.time.length); i++) {
      out.push({
        day: d.time[i],
        tmax: d.temperature_2m_max[i],
        tmin: d.temperature_2m_min[i],
        psum: d.precipitation_sum[i],
        wc: d.weathercode[i]
      });
    }
    return out;
  }, [data]);

  // Theme selection
  const theme = useMemo(() => wcToTheme(data?.current?.weathercode), [data, tick]);

  return (
    <div className={"rounded-3xl overflow-hidden ring-1 ring-slate-200 relative"}>
      <div className={"widget-bg " + theme} aria-hidden />
      <div className="relative p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="text-white drop-shadow">
            <div className="text-xs opacity-90">Your location</div>
            <div className="text-2xl font-semibold">
              {data?.current?.temperature_2m != null ? Math.round(data.current.temperature_2m) : "—"}°{unit === "fahrenheit" ? "F" : "C"} {wcToIcon(data?.current?.weathercode)}
            </div>
            <div className="text-xs opacity-90">
              Wind {data?.current?.wind_speed_10m ?? "—"} {unit === "fahrenheit" ? "mph" : "m/s"} · RH {data?.current?.relative_humidity_2m ?? "—"}%
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setUnit("fahrenheit")} className={"px-3 py-1.5 rounded-lg text-xs " + (unit==="fahrenheit"?"bg-white text-slate-900":"bg-white/20 text-white hover:bg-white/30")}>°F</button>
            <button onClick={() => setUnit("celsius")} className={"px-3 py-1.5 rounded-lg text-xs " + (unit==="celsius"?"bg-white text-slate-900":"bg-white/20 text-white hover:bg-white/30")}>°C</button>
            <button onClick={requestGeo} className="px-3 py-1.5 rounded-lg text-xs bg-white/20 text-white hover:bg-white/30">Use my location</button>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-2xl p-4 ring-1 ring-white/60">
          <div className="text-sm font-semibold mb-2">Next 24 hours</div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {hourly24.length === 0 ? <div className="text-xs text-slate-600">Loading hourly…</div> : hourly24.map((h, idx) => (
              <div key={idx} className="min-w-[68px] text-center">
                <div className="text-xs text-slate-600">{fmtHour(h.time)}</div>
                <div className="text-base font-semibold">{Math.round(h.temp)}°</div>
                <div className="text-xs">{wcToIcon(h.wc)}</div>
                <div className="text-[10px] text-slate-600">{h.pop}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-2xl p-4 ring-1 ring-white/60">
          <div className="text-sm font-semibold mb-2">Next 3 days</div>
          <div className="grid grid-cols-3 gap-3">
            {daily3.length === 0 ? <div className="text-xs text-slate-600 col-span-3">Loading daily…</div> : daily3.map((d, idx) => (
              <div key={idx} className="text-center p-3 rounded-xl border bg-white/60">
                <div className="text-xs text-slate-600">{fmtDow(d.day)}</div>
                <div className="text-2xl">{wcToIcon(d.wc)}</div>
                <div className="text-sm font-semibold">{Math.round(d.tmax)}° / {Math.round(d.tmin)}°</div>
                <div className="text-[10px] text-slate-600">precip: {d.psum}{unit==="fahrenheit"?" in":" mm"}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-2xl p-4 ring-1 ring-white/60">
          <div className="text-sm font-semibold mb-2">Manual location</div>
          <div className="flex flex-wrap items-center gap-2">
            <input value={manual.lat} onChange={e=>setManual(v=>({...v, lat: e.target.value}))} placeholder="lat" className="border rounded-lg px-3 py-2 text-sm w-32" />
            <input value={manual.lon} onChange={e=>setManual(v=>({...v, lon: e.target.value}))} placeholder="lon" className="border rounded-lg px-3 py-2 text-sm w-32" />
            <button onClick={onManualApply} className="px-3 py-2 rounded-lg text-sm bg-slate-900 text-white hover:bg-slate-700">Apply</button>
            {loading && <span className="text-xs text-slate-600">Updating…</span>}
            {err && <span className="text-xs text-red-600">{err}</span>}
          </div>
        </div>
      </div>

      {/* Animated background styles */}
      <style jsx global>{`
        .widget-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(1200px 600px at 20% 20%, rgba(255,255,255,0.25), transparent),
                      radial-gradient(800px 400px at 80% 0%, rgba(255,255,255,0.18), transparent),
                      linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0));
          filter: saturate(1.1);
          pointer-events: none;
        }
        .theme-clear { background-color: #60a5fa; background-image: radial-gradient(circle at 20% 30%, rgba(255,255,255,0.35), transparent 40%), linear-gradient(135deg, #60a5fa, #22c55e); animation: bgshift 20s ease-in-out infinite; }
        .theme-cloudy { background: linear-gradient(135deg, #94a3b8, #64748b); animation: bgshift 20s ease-in-out infinite; }
        .theme-rain { background: linear-gradient(135deg, #60a5fa, #3b82f6); animation: rainmove 8s linear infinite; }
        .theme-snow { background: linear-gradient(135deg, #e2e8f0, #94a3b8); animation: snowshine 12s ease-in-out infinite; }
        .theme-storm { background: linear-gradient(135deg, #475569, #111827); animation: bgshift 18s ease-in-out infinite; }

        @keyframes bgshift {
          0% { filter: hue-rotate(0deg); }
          50% { filter: hue-rotate(20deg) brightness(1.05); }
          100% { filter: hue-rotate(0deg); }
        }
        @keyframes rainmove {
          0% { background-position: 0 0, 0 0; }
          100% { background-position: 200px 400px, 0 0; }
        }
        @keyframes snowshine {
          0% { filter: brightness(1); }
          50% { filter: brightness(1.1); }
          100% { filter: brightness(1); }
        }
      `}</style>
    </div>
  );
}
