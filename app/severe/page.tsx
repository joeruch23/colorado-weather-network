
async function getAlerts() {
  const r = await fetch("https://api.weather.gov/alerts/active?area=CO", {
    headers: { "User-Agent": "ColoradoWeatherNetwork (demo)" },
    next: { revalidate: 300 }
  });
  if (!r.ok) return { features: [] };
  return r.json();
}

export default async function SeverePage() {
  const data = await getAlerts();
  const feats = Array.isArray(data?.features) ? data.features : [];
  const ww = feats.filter((f:any)=>/Watch|Warning/i.test(f?.properties?.event || ""));

  return (
    <div className="space-y-6">
      <section className="card">
        <h1 className="font-semibold mb-2">severe weather</h1>
        <p className="text-sm mb-2">Official SPC quick links (open in new tab):</p>
        <ul className="text-sm list-disc ml-5">
          <li><a className="underline" target="_blank" href="https://www.spc.noaa.gov/products/outlook/">SPC Day 1–8 Outlooks</a></li>
          <li><a className="underline" target="_blank" href="https://www.spc.noaa.gov/exper/">Mesoanalysis</a></li>
          <li><a className="underline" target="_blank" href="https://www.spc.noaa.gov/products/md/">Mesoscale Discussions</a></li>
          <li><a className="underline" target="_blank" href="https://www.spc.noaa.gov/products/watch/">Watches</a></li>
        </ul>
      </section>

      <section className="card">
        <h2 className="font-semibold mb-2">active watches/warnings (CO)</h2>
        {ww.length === 0 ? <p className="text-sm">None active.</p> : (
          <ul className="space-y-2 text-sm">
            {ww.map((f:any)=>(
              <li key={f.id} className="border rounded-lg p-2">
                <div className="font-semibold">{f.properties.event}</div>
                <div className="muted text-xs">{f.properties.headline}</div>
                <a className="underline text-xs" href={f.properties?.["@id"] || f.id} target="_blank">details</a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
