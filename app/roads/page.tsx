
async function getClosures() {
  const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/cdot/closures`, { cache: "no-store" });
  return r.json();
}
async function getCameras() {
  const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/cdot/cameras`, { cache: "no-store" });
  return r.json();
}

export default async function RoadsPage() {
  const closures = await getClosures();
  const cameras = await getCameras();
  const cams = Array.isArray(cameras) ? cameras : (cameras?.cameras || []);
  const clos = Array.isArray(closures) ? closures : (closures?.features || []);

  return (
    <div className="grid gap-6">
      <section className="card">
        <h1 className="font-semibold mb-2">cdot closures & incidents</h1>
        {!Array.isArray(clos) || clos.length === 0 ? (
          <p className="text-sm">No data yet. {closures?.error ? `(${closures.error})` : "Add your CDOT key in Vercel settings."}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {clos.map((c:any, idx:number)=>(
              <li key={c.id || idx} className="border rounded-lg p-2">
                <div className="font-semibold">{c.route || c.properties?.route || "Route"}</div>
                <div className="muted">{c.description || c.properties?.description || "closure/incident"}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="font-semibold mb-2">cdot cameras</h2>
        {!Array.isArray(cams) || cams.length === 0 ? (
          <p className="text-sm">No camera data yet. {cameras?.error ? `(${cameras.error})` : "Add your CDOT key in Vercel settings."}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {cams.slice(0, 24).map((cam:any, idx:number)=>(
              <figure key={cam.id || idx} className="border rounded-lg overflow-hidden">
                <img src={cam.imageUrl || cam.url || ""} alt={cam.name || "camera"} className="w-full h-40 object-cover" />
                <figcaption className="p-2 text-xs">{cam.name || cam.location || "camera"}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
