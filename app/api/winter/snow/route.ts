
import { NextResponse } from "next/server";

async function getSnow(lat: string, lon: string) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=snowfall&timezone=auto`;
  const r = await fetch(url, { next: { revalidate: 1800 } });
  if (!r.ok) throw new Error("Open-Meteo error " + r.status);
  return r.json();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");
    if (!lat || !lon) return NextResponse.json({ error: "lat/lon required" }, { status: 400 });
    const data = await getSnow(lat, lon);
    const times = data?.hourly?.time || [];
    const vals = data?.hourly?.snowfall || [];
    // Sum last 24h and 72h
    const n = times.length;
    const last24 = vals.slice(Math.max(0, n-24)).reduce((a:number,b:number)=>a+(b||0),0);
    const last72 = vals.slice(Math.max(0, n-72)).reduce((a:number,b:number)=>a+(b||0),0);
    return NextResponse.json({ last24, last72, unit: "cm" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
