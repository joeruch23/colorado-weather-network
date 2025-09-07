
import Link from "next/link";

export default function Home() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="card">
        <h2 className="font-semibold mb-2">right now</h2>
        <p className="text-sm">Auto-locate + current conditions (coming next)</p>
        <div className="mt-3 text-sm muted">Using Open-Meteo free API.</div>
      </section>
      <section className="card">
        <h2 className="font-semibold mb-2">live radar</h2>
        <p className="text-sm">See <Link href="/radar" className="underline">radar</Link> for the embedded national radar (temporary).</p>
      </section>
      <section className="card">
        <h2 className="font-semibold mb-2">travel</h2>
        <p className="text-sm">CDOT closures, incidents and cameras on <Link href="/roads" className="underline">roads</Link>.</p>
      </section>
      <section className="card">
        <h2 className="font-semibold mb-2">winter hub</h2>
        <p className="text-sm">Snow reports (24h/72h via Open-Meteo) on <Link href="/winter" className="underline">winter</Link>.</p>
      </section>
    </div>
  );
}
