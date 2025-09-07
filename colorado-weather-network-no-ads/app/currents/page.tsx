
"use client";
import { useEffect, useState } from "react";

export default function CurrentsPage() {
  const [pos, setPos] = useState<{lat:number;lon:number}|null>(null);
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string|undefined>();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => setErr("Location permission denied. Enter lat/lon manually.")
    );
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!pos) return;
      const r = await fetch(`/api/currents?lat=${pos.lat}&lon=${pos.lon}`);
      const j = await r.json();
      setData(j);
    };
    run();
  }, [pos]);

  return (
    <div className="card space-y-3">
      <h1 className="font-semibold">currents</h1>
      {err && <div className="text-sm text-red-600">{err}</div>}
      {!data ? <p className="text-sm">Loading current conditions...</p> : (
        <div className="text-sm">
          <div>Temperature: {data?.current?.temperature_2m ?? "—"}°C</div>
          <div>Wind: {data?.current?.wind_speed_10m ?? "—"} m/s (gusts {data?.current?.wind_gusts_10m ?? "—"})</div>
          <div>RH: {data?.current?.relative_humidity_2m ?? "—"}%</div>
          <div>Precip: {data?.current?.precipitation ?? "—"} mm</div>
        </div>
      )}
    </div>
  );
}
