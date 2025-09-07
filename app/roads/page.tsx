
async function fetchCotripLayer(slug: string) {
  const QUERY = `
    query MapFeatures($input: MapFeaturesArgs!, $plowType: String) {
      mapFeaturesQuery(input: $input) {
        mapFeatures {
          tooltip
          uri
          __typename
          features { id geometry properties }
        }
        error { message type }
      }
    }
  `;
  const variables = {
    input: {
      north: 41.1, south: 36.9, east: -102.0, west: -109.2,
      zoom: 12,
      layerSlugs: [slug],
      nonClusterableUris: ["dashboard"]
    },
    plowType: "plowCameras"
  };
  const payload = [{ query: QUERY, variables }];
  try {
    const res = await fetch("https://maps.cotrip.org/api/graphql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      next: { revalidate: 300 }
    });
    if (!res.ok) return [];
    const j = await res.json();
    return j?.[0]?.data?.mapFeaturesQuery?.mapFeatures ?? [];
  } catch {
    return [];
  }
}

function flatten(feats: any[], kindLabel: string) {
  const out: any[] = [];
  for (const f of feats || []) {
    if (Array.isArray(f?.features) && f.features.length) {
      for (const g of f.features) {
        const props = g.properties || {};
        out.push({
          id: g.id || Math.random().toString(36).slice(2),
          kind: kindLabel,
          name: f.tooltip || props?.name || props?.title || "Road item",
          route: props?.route || props?.roadway || props?.routeName,
          direction: props?.direction || props?.dir,
          status: props?.status || props?.eventStatus,
          impact: props?.impact || props?.advisory || props?.severity,
          updated: props?.lastUpdated || props?.updateTime,
          props,
          link: f.uri ? `https://maps.cotrip.org${f.uri}` : undefined
        });
      }
    } else {
      out.push({
        id: f?.uri || Math.random().toString(36).slice(2),
        kind: kindLabel,
        name: f?.tooltip || "Road item",
        link: f?.uri ? `https://maps.cotrip.org${f.uri}` : undefined
      });
    }
  }
  return out;
}

async function getTravelAlerts() {
  const r = await fetch("https://api.weather.gov/alerts/active?area=CO", {
    headers: { "User-Agent": "ColoradoWeatherNetwork (roads-hotfix)" },
    next: { revalidate: 300 }
  });
  if (!r.ok) return [];
  const j = await r.json();
  const feats = Array.isArray(j?.features) ? j.features : [];
  const travelTerms = /(Winter|Blizzard|Snow|Ice|High Wind|Dust|Avalanche)/i;
  return feats.filter((f:any)=> travelTerms.test(f?.properties?.event || ""));
}

export default async function RoadsPage() {
  // Try multiple layers commonly visible in COtrip
  const layerSpecs = [
    { slug: "restrictions", label: "Restriction" },
    { slug: "roadReports", label: "Road Report" },
    { slug: "roadWork", label: "Road Work" },
    { slug: "winterDriving", label: "Winter Driving" },
    { slug: "chainLaws", label: "Chain Law" }
  ] as const;

  const results = await Promise.all(layerSpecs.map(async s => {
    const feats = await fetchCotripLayer(s.slug);
    return { s, feats };
  }));

  const items = results.flatMap(({ s, feats }) => flatten(feats, s.label));
  const alerts = await getTravelAlerts();

  const CORRIDOR_LINKS = [
    { label: "I-70", url: "https://maps.cotrip.org/search/roadway%3DI-70/%40-109.05147%2C39.10202%2C-102.04872%2C39.78645/%40-108.6812%2C39.9851%2C6?show=roadWork%2CwinterDriving%2CroadReports%2CweatherWarnings%2CchainLaws" },
    { label: "I-25", url: "https://maps.cotrip.org/search/roadway%3DI-25/%40-105.01816%2C36.99388%2C-104.47999%2C40.99807/%40-105.87517%2C39.27293%2C7?show=winterDriving%2CroadReports%2CchainLaws%2CmileMarkers" },
    { label: "US-285", url: "https://maps.cotrip.org/search/roadway%3DUS-285/%40-106.5%2C38.0%2C-104.5%2C40.5/%40-105.5%2C39.3%2C8?show=roadWork%2CwinterDriving%2CroadReports%2CweatherWarnings%2CchainLaws" },
    { label: "US-550", url: "https://maps.cotrip.org/search/roadway%3DUS-550/%40-108.8%2C36.8%2C-107.2%2C39.0/%40-107.7%2C37.7%2C9?show=roadWork%2CwinterDriving%2CroadReports%2CweatherWarnings%2CchainLaws" },
    { label: "US-50", url: "https://maps.cotrip.org/search/roadway%3DUS-50/%40-109.2%2C37.9%2C-101.5%2C39.8/%40-106.7%2C38.7%2C8?show=roadWork%2CwinterDriving%2CroadReports%2CweatherWarnings%2CchainLaws" }
  ];

  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="font-semibold mb-2">ROADS — CDOT (COtrip)</h1>
        <p className="text-sm text-slate-600">
          Real-time closures, restrictions, incidents, work zones, winter driving and chain laws. Data via COtrip.
        </p>
      </div>

      {items.length > 0 ? (
        <ul className="grid gap-3">
          {items.slice(0, 150).map((i:any) => (
            <li key={i.id} className="border rounded-xl bg-white ring-1 ring-slate-200 p-3">
              <div className="text-sm font-semibold">{i.name}</div>
              <div className="text-xs text-slate-600">
                <span className="inline-block mr-2 px-2 py-0.5 rounded-full bg-slate-100">{i.kind}</span>
                {i.route && <span className="mr-2">Route: {i.route}</span>}
                {i.direction && <span className="mr-2">Dir: {i.direction}</span>}
                {i.status && <span className="mr-2">Status: {i.status}</span>}
                {i.impact && <span>Impact: {i.impact}</span>}
              </div>
              {i.link && <a className="underline text-xs mt-1 inline-block" href={i.link} target="_blank" rel="noreferrer">Open in COtrip</a>}
            </li>
          ))}
        </ul>
      ) : (
        <div className="card text-sm">
          <p className="mb-2">We couldn’t retrieve road events from COtrip’s map API right now.</p>
          <p className="mb-2">Quick links to the official corridor lists:</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {CORRIDOR_LINKS.map(c => (
              <a key={c.label} className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200" href={c.url} target="_blank" rel="noreferrer">{c.label}</a>
            ))}
          </div>
          <p className="text-xs text-slate-600">
            For programmatic access to JSON/XML, CDOT provides data feeds via their developer portal (account required).
          </p>
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-2">Travel-related Alerts (NWS CAP—Colorado)</h2>
        {/* We re-run the same CAP query here for simplicity */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {/* This inner component is simple enough to keep in the same file */}
        {await (async () => {
          const r = await fetch("https://api.weather.gov/alerts/active?area=CO", {
            headers: { "User-Agent": "ColoradoWeatherNetwork (roads-hotfix)" },
            next: { revalidate: 300 }
          });
          const ok = r.ok;
          const j = ok ? await r.json() : null;
          const feats = ok && Array.isArray(j?.features) ? j.features : [];
          const travelTerms = /(Winter|Blizzard|Snow|Ice|High Wind|Dust|Avalanche)/i;
          const alerts = feats.filter((f:any)=> travelTerms.test(f?.properties?.event || ""));
          return alerts.length === 0 ? (
            <p className="text-sm">No active winter/high-wind/audience travel alerts.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {alerts.map((f:any)=>(
                <li key={f.id} className="border rounded-lg p-2">
                  <div className="font-semibold">{f.properties.event}</div>
                  <div className="muted text-xs">{f.properties.headline}</div>
                  <div className="text-xs mt-1">{f.properties.areaDesc}</div>
                  <a className="underline text-xs" href={f.properties?.["@id"] || f.id} target="_blank" rel="noreferrer">details</a>
                </li>
              ))}
            </ul>
          );
        })()}
      </div>
    </div>
  );
}
