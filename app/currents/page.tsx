
import dynamic from "next/dynamic";
const WeatherWidget = dynamic(() => import("@/components/WeatherWidget"), { ssr: false });

export default function CurrentsPage() {
  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="font-semibold mb-2">CURRENTS</h1>
        <p className="text-sm text-slate-600">Live widget with animated background, hourly (24h) and 3-day forecast. Allow location for best results.</p>
      </div>
      <WeatherWidget />
    </div>
  );
}
