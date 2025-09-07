
import CamerasGrid from "@/components/CamerasGrid";

type CameraFeature = {
  tooltip: string;
  views?: { category: string; url?: string; sources?: { type: string; src: string }[] }[];
};

const QUERY = `
  query MapFeatures($input: MapFeaturesArgs!, $plowType: String) {
    mapFeaturesQuery(input: $input) {
      mapFeatures {
        tooltip
        __typename
        ... on Camera {
          views(limit: 3) {
            category
            url
            sources { type src }
          }
        }
      }
      error { message type }
    }
  }
`;

async function fetchCameras(): Promise<{ name: string; imageUrl: string | null }[]> {
  const variables = {
    input: {
      north: 41.1, south: 36.9, east: -102.0, west: -109.2,
      zoom: 10,
      layerSlugs: ["normalCameras"],
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
    const feats: CameraFeature[] = j?.[0]?.data?.mapFeaturesQuery?.mapFeatures ?? [];
    const cams = feats
      .map((f) => {
        const still = (f.views || []).find(v => (v?.category || "").toUpperCase() !== "VIDEO");
        return { name: f.tooltip, imageUrl: still?.url || null };
      })
      .filter(c => !!c.imageUrl);
    return cams;
  } catch {
    return [];
  }
}

export default async function CamerasPage() {
  const cams = await fetchCameras();
  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="font-semibold mb-2">CAMERAS — CDOT (COtrip)</h1>
        <p className="text-sm text-slate-600">
          Filter by corridor or search by name (e.g., Eisenhower, Vail, Wolf Creek). Images update periodically.
        </p>
      </div>
      <CamerasGrid cams={cams} />
      <div className="card text-sm">
        Prefer the official experience? Open the COtrip camera list:{" "}
        <a className="underline" href="https://maps.cotrip.org/list/cameras" target="_blank" rel="noreferrer">maps.cotrip.org/list/cameras</a>
      </div>
    </div>
  );
}
