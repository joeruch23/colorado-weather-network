
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");
    if (!lat || !lon) return NextResponse.json({ error: "lat/lon required" }, { status: 400 });
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,precipitation&hourly=temperature_2m,precipitation_probability,wind_speed_10m`;
    const r = await fetch(url, { next: { revalidate: 600 } });
    if (!r.ok) throw new Error("Open-Meteo error " + r.status);
    const data = await r.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
