
async function getAlerts() {
  const r = await fetch("https://api.weather.gov/alerts/active?area=CO", {
    headers: { "User-Agent": "ColoradoWeatherNetwork (demo)" },
    next: { revalidate: 300 }
  });
  if (!r.ok) return { features: [] };
  return r.json();
}

export default async function AlertsPage() {
  const data = await getAlerts();
  const feats = Array.isArray(data?.features) ? data.features : [];

  return (
    <div className="card">
      <h1 className="font-semibold mb-4">alerts — colorado (NWS CAP)</h1>
      {feats.length === 0 ? (
        <p className="text-sm">No active alerts for Colorado.</p>
      ) : (
        <ul className="space-y-3">
          {feats.map((f: any) => (
            <li key={f.id} className="border rounded-lg p-3">
              <div className="text-sm font-semibold">{f.properties.event}</div>
              <div className="text-xs text-slate-600">{f.properties.headline}</div>
              <div className="text-xs mt-1">{f.properties.areaDesc}</div>
              <a className="text-xs underline mt-1 inline-block" href={f.properties?.["@id"] || f.id} target="_blank">details</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
