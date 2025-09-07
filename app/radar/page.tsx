
export default function RadarPage() {
  return (
    <div className="card">
      <h1 className="font-semibold mb-3">radar</h1>
      <p className="text-sm mb-2">Temporary embed from NWS; you can replace with MapLibre + radar tiles later.</p>
      <div className="rounded-lg overflow-hidden border">
        <iframe
          title="radar"
          src="https://radar.weather.gov/"
          className="w-full h-[70vh]"
        />
      </div>
    </div>
  );
}
