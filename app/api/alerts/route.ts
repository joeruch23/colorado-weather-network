
import { NextResponse } from "next/server";
export async function GET() {
  try {
    const r = await fetch("https://api.weather.gov/alerts/active?area=CO", {
      headers: { "User-Agent": "ColoradoWeatherNetwork (demo)" },
      next: { revalidate: 300 }
    });
    if (!r.ok) throw new Error("NWS API error " + r.status);
    const data = await r.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
