
export default function RadarPage() {
  return (
    <div className="space-y-3">
      <div className="card">
        <h1 className="font-semibold mb-2">radar</h1>
        <p className="text-sm mb-2">Temporary NWS national radar; we'll swap to MapLibre tiles later.</p>
        <div className="rounded-lg overflow-hidden ring-1 ring-slate-200">
          <iframe
            title="radar"
            src="https://radar.weather.gov/"
            className="w-full h-[70vh]"
          />
        </div>
      </div>
    </div>
  );
}
