
import RoadsList from "@/components/RoadsList";

type Feature = {
  tooltip?: string;
  uri?: string;
  __typename?: string;
  features?: { id: string; geometry?: any; properties?: any }[];
};

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

const LAYERS = [
  { slug: "roadReports", label: "Road Report" },
  { slug: "trafficIncidents", label: "Incident" },
  { slug: "roadWork", label: "Road Work" },
  { slug: "winterDriving", label: "Winter Driving" },
  { slug: "chainLaws", label: "Chain Law" }
] as const;

async function fetchLayer(slug: string) {
  const variables = {
    input: {
      north: 41.1, south: 36.9, east: -102.0, west: -109.2,
      zoom: 8,
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
    const feats: Feature[] = j?.[0]?.data?.mapFeaturesQuery?.mapFeatures ?? [];
    return feats;
  } catch {
    return [];
  }
}

function pick<T>(o: any, k: T): any { return o && typeof o === "object" ? o[k as any] : undefined; }

export default async function RoadsPage() {
  const all = await Promise.all(LAYERS.map(async l => ({ l, feats: await fetchLayer(l.slug) })));
  // Flatten into display-friendly items
  const items = all.flatMap(({ l, feats }) => {
    const rows: any[] = [];
    for (const f of feats) {
      if (Array.isArray(f?.features) && f.features.length) {
        for (const g of f.features) {
          const props = g.properties || {};
          rows.push({
            id: g.id || f.uri || Math.random().toString(36).slice(2),
            kind: l.label,
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
        rows.push({
          id: f.uri || Math.random().toString(36).slice(2),
          kind: l.label,
          name: f.tooltip || "Road item",
          props: undefined,
          link: f.uri ? `https://maps.cotrip.org${f.uri}` : undefined
        });
      }
    }
    return rows;
  });

  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="font-semibold mb-2">ROADS — CDOT (COtrip)</h1>
        <p className="text-sm text-slate-600">
          Real-time closures, incidents, work zones, winter driving and chain laws from the official COtrip map.
        </p>
      </div>
      <RoadsList items={items} />
      <div className="card text-sm">
        Need more detail? Open the official list view:{" "}
        <a className="underline" href="https://maps.cotrip.org/list/events" target="_blank" rel="noreferrer">maps.cotrip.org/list/events</a>
      </div>
    </div>
  );
}
