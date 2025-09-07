
import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.CDOT_API_KEY;
  if (!key) return NextResponse.json({ error: "Missing CDOT_API_KEY" }, { status: 200 });
  try {
    // Replace with the correct CDOT endpoint for closures/incidents once you have docs
    const url = `https://data.cdot.gov/api/closures?key=${key}`; // placeholder path
    const r = await fetch(url, { next: { revalidate: 180 } });
    if (!r.ok) throw new Error("CDOT API error " + r.status);
    const data = await r.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
