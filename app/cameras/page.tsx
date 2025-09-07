
async function getCameras() {
  const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/cdot/cameras`, { cache: "no-store" });
  return r.json();
}

export default async function CamerasPage() {
  const cameras = await getCameras();
  const cams = Array.isArray(cameras) ? cameras : (cameras?.cameras || []);

  return (
    <div className="card">
      <h1 className="font-semibold mb-3">cameras — cdot</h1>
      {!Array.isArray(cams) || cams.length === 0 ? (
        <p className="text-sm">No camera data yet. {cameras?.error ? `(${cameras.error})` : "Add your CDOT key in Vercel settings."}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {cams.slice(0, 48).map((cam:any, idx:number)=>(
            <figure key={cam.id || idx} className="border rounded-lg overflow-hidden">
              <img src={cam.imageUrl || cam.url || ""} alt={cam.name || "camera"} className="w-full h-40 object-cover" />
              <figcaption className="p-2 text-xs">{cam.name || cam.location || "camera"}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
