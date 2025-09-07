
import resorts from "@/app/api/winter/resorts.json";

async function getSnow(lat: number, lon: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=snowfall&timezone=auto`;
  const r = await fetch(url, { next: { revalidate: 1800 } });
  if (!r.ok) return { hourly: { snowfall: [], time: [] } };
  return r.json();
}

export default async function WinterPage() {
  const rows = await Promise.all(resorts.map(async (r:any)=>{
    const data = await getSnow(r.lat, r.lon);
    const times = data?.hourly?.time || [];
    const vals = data?.hourly?.snowfall || [];
    const n = vals.length;
    const sum24 = vals.slice(Math.max(0, n-24)).reduce((a:number,b:number)=>a+(b||0),0);
    const sum72 = vals.slice(Math.max(0, n-72)).reduce((a:number,b:number)=>a+(b||0),0);
    return { ...r, last24: sum24, last72: sum72 };
  }));

  return (
    <div className="card">
      <h1 className="font-semibold mb-4">winter — model snowfall</h1>
      <p className="text-sm text-slate-600 mb-3">Open‑Meteo hourly snowfall at resort coordinates. Official reports may differ.</p>
      <div className="overflow-x-auto">
        <table className="text-sm w-full">
          <thead><tr className="text-left">
            <th className="py-2 pr-4">Resort</th>
            <th className="py-2 pr-4">24h (cm)</th>
            <th className="py-2 pr-4">72h (cm)</th>
            <th className="py-2 pr-4">24h (in)</th>
            <th className="py-2 pr-4">72h (in)</th>
          </tr></thead>
          <tbody>
            {rows.map((r)=>(
              <tr key={r.id} className="border-t">
                <td className="py-2 pr-4">{r.name}</td>
                <td className="py-2 pr-4">{r.last24.toFixed(1)}</td>
                <td className="py-2 pr-4">{r.last72.toFixed(1)}</td>
                <td className="py-2 pr-4">{(r.last24*0.3937).toFixed(1)}</td>
                <td className="py-2 pr-4">{(r.last72*0.3937).toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
