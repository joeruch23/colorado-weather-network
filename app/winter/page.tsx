
import resorts from "@/app/api/winter/resorts.json";

async function getResortSnow(lat:number, lon:number) {
  const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/winter/snow?lat=${lat}&lon=${lon}`, { cache: "no-store" });
  return r.json();
}

export default async function WinterPage() {
  const rows = await Promise.all(resorts.map(async (r:any)=>{
    const snow = await getResortSnow(r.lat, r.lon);
    return { ...r, snow };
  }));

  return (
    <div className="card">
      <h1 className="font-semibold mb-4">winter — snow reports (model-derived)</h1>
      <p className="text-sm mb-3">Estimates based on Open-Meteo snowfall at each resort’s coordinates. Official reports may differ.</p>
      <div className="overflow-x-auto">
        <table className="text-sm w-full">
          <thead><tr className="text-left">
            <th className="py-2 pr-4">Resort</th>
            <th className="py-2 pr-4">24h</th>
            <th className="py-2 pr-4">72h</th>
            <th className="py-2 pr-4">Unit</th>
          </tr></thead>
          <tbody>
            {rows.map((r)=>(
              <tr key={r.id} className="border-t">
                <td className="py-2 pr-4">{r.name}</td>
                <td className="py-2 pr-4">{(r.snow?.last24 ?? 0).toFixed(1)}</td>
                <td className="py-2 pr-4">{(r.snow?.last72 ?? 0).toFixed(1)}</td>
                <td className="py-2 pr-4">{r.snow?.unit || "cm"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
