
"use client";
import { useEffect, useState } from "react";

export default function CurrentsPage() {
  const [pos, setPos] = useState<{lat:number;lon:number}|null>(null);
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string|undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => setErr("Location permission denied. Enter lat/lon manually.")
    );
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!pos) return;
      setLoading(true);
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${pos.lat}&longitude=${pos.lon}&current=temperature_2m,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,precipitation&hourly=temperature_2m,precipitation_probability,wind_speed_10m&timezone=auto`;
        const r = await fetch(url);
        const j = await r.json();
        setData(j);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [pos]);

  return (
    <div className="card space-y-3">
      <h1 className="font-semibold">currents</h1>
      {err && <div className="text-sm text-red-600">{err}</div>}
      {!pos ? <p className="text-sm">Waiting for location permission…</p> : null}
      {loading && <p className="text-sm">Loading current conditions…</p>}
      {data && (
        <div className="text-sm grid grid-cols-2 gap-y-1">
          <div>Temperature:</div><div className="font-semibold">{data?.current?.temperature_2m ?? "—"}°C</div>
          <div>Wind:</div><div className="font-semibold">{data?.current?.wind_speed_10m ?? "—"} m/s (gusts {data?.current?.wind_gusts_10m ?? "—"})</div>
          <div>RH:</div><div className="font-semibold">{data?.current?.relative_humidity_2m ?? "—"}%</div>
          <div>Precip:</div><div className="font-semibold">{data?.current?.precipitation ?? "—"} mm</div>
        </div>
      )}
    </div>
  );
}
