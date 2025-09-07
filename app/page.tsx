
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="gradient rounded-3xl p-6">
        <h1 className="text-2xl font-semibold">colorado weather network</h1>
        <p className="text-white/90 mt-1 text-sm">
          live radar • alerts • roads • snow • severe — built for colorado
        </p>
        <div className="mt-4 flex gap-2">
          <Link href="/radar" className="btn bg-white text-slate-900 hover:bg-slate-100">open radar</Link>
          <Link href="/currents" className="btn">your conditions</Link>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="card">
          <div className="section-title mb-2">alerts</div>
          <p className="text-sm">Active watches/warnings/advisories for Colorado from NWS CAP.</p>
          <div className="mt-3"><Link href="/alerts" className="btn">view alerts</Link></div>
        </div>
        <div className="card">
          <div className="section-title mb-2">winter</div>
          <p className="text-sm">24h/72h model snowfall for major resorts. Official reports may differ.</p>
          <div className="mt-3"><Link href="/winter" className="btn">snow reports</Link></div>
        </div>
        <div className="card">
          <div className="section-title mb-2">roads</div>
          <p className="text-sm">CDOT closures, incidents and cameras. Requires API key to populate.</p>
          <div className="mt-3"><Link href="/roads" className="btn">open roads</Link></div>
        </div>
      </div>
    </div>
  );
}
