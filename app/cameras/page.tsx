
import CamerasGrid from "@/components/CamerasGrid";

type CameraView = { category: string; url?: string; sources?: { type: string; src: string }[] };
type CameraFeature = { tooltip: string; views?: CameraView[] };

const QUERY = `
  query MapFeatures($input: MapFeaturesArgs!, $plowType: String) {
    mapFeaturesQuery(input: $input) {
      mapFeatures {
        tooltip
        __typename
        features { id geometry }
        ... on Camera {
          views(limit: 4) {
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

function viewToImage(v?: CameraView) {
  if (!v) return null;
  if (v.url) return v.url; // PHOTO
  if (Array.isArray(v.sources) && v.sources.length) {
    // VIDEO (HLS) – most browsers can't show HLS without hls.js; skip for now
    // Some systems provide a poster/still in url even for VIDEO; if not, return null
    const hls = v.sources.find(s => (s?.type||'').includes('mpegURL'));
    if (hls?.src) return null;
  }
  return null;
}

async function fetchCameras(): Promise<{ name: string; imageUrl: string | null }[]> {
  const variables = {
    input: {
      // Wide bbox + high zoom prevents aggregated "Show N cameras" clusters
      north: 90, south: 0, east: 0, west: -179,
      zoom: 15,
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
      .filter(f => !/^Show .* cameras/i.test(f?.tooltip || "")) // drop aggregates just in case
      .map((f) => {
        const views = f.views || [];
        // Prefer photo view; else try first view's url
        const photo = views.find(v => (v?.category || "").toUpperCase() !== "VIDEO");
        const first = views[0];
        const img = viewToImage(photo || first);
        return { name: f.tooltip, imageUrl: img };
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
      {cams.length > 0 ? (
        <CamerasGrid cams={cams} />
      ) : (
        <div className="card text-sm">
          <p className="mb-2">No camera images returned from COtrip right now. This is usually temporary.</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Open the official list: <a className="underline" href="https://maps.cotrip.org/list/cameras" target="_blank" rel="noreferrer">maps.cotrip.org/list/cameras</a></li>
            <li>Try again in a minute (we cache data for 5 minutes).</li>
          </ul>
        </div>
      )}
    </div>
  );
}
