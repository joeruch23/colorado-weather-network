
"use client";
import { useMemo, useState } from "react";

type RoadItem = {
  id: string;
  kind: string;
  name: string;
  route?: string;
  direction?: string;
  status?: string;
  impact?: string;
  updated?: string;
  props?: Record<string, any>;
  link?: string;
};

const CORRIDORS: {key: string; label: string; regex: RegExp}[] = [
  { key: "ALL", label: "ALL", regex: /.*/i },
  { key: "I70", label: "I-70", regex: /\bI[-\s]?70\b/i },
  { key: "I25", label: "I-25", regex: /\bI[-\s]?25\b/i },
  { key: "US285", label: "US-285", regex: /\bUS[-\s]?285\b/i },
  { key: "US550", label: "US-550", regex: /\bUS[-\s]?550\b/i },
  { key: "US50", label: "US-50", regex: /\bUS[-\s]?50\b/i },
  { key: "US24", label: "US-24", regex: /\bUS[-\s]?24\b/i },
  { key: "US36", label: "US-36", regex: /\bUS[-\s]?36\b/i },
  { key: "CO9", label: "CO-9", regex: /\bCO[-\s]?9\b/i },
  { key: "CO82", label: "CO-82", regex: /\bCO[-\s]?82\b/i },
  { key: "CO14", label: "CO-14", regex: /\bCO[-\s]?14\b/i }
];

export default function RoadsList({ items }: { items: RoadItem[] }) {
  const [query, setQuery] = useState("");
  const [corridor, setCorridor] = useState("ALL");
  const [kind, setKind] = useState("ALL");
  const [visible, setVisible] = useState(50);

  const kinds = useMemo(() => {
    const s = new Set(items.map(i => i.kind));
    return ["ALL", ...Array.from(s)];
  }, [items]);

  const filtered = useMemo(() => {
    const rule = CORRIDORS.find(x => x.key === corridor) ?? CORRIDORS[0];
    const byCorridor = items.filter(i => rule.regex.test([i.name, i.route].join(" ")));
    const byKind = kind === "ALL" ? byCorridor : byCorridor.filter(i => i.kind === kind);
    const q = query.trim().toLowerCase();
    const byQuery = q ? byKind.filter(i => [i.name, i.route, i.direction, i.status, i.impact].join(" ").toLowerCase().includes(q)) : byKind;
    return byQuery;
  }, [items, corridor, kind, query]);

  const shown = filtered.slice(0, visible);
  const showMore = () => setVisible(v => v + 50);
  const reset = () => { setQuery(""); setCorridor("ALL"); setKind("ALL"); setVisible(50); };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {CORRIDORS.map(c => (
            <button
              key={c.key}
              onClick={() => { setCorridor(c.key); setVisible(50); }}
              className={
                "px-3 py-1.5 rounded-full text-xs uppercase tracking-wide " +
                (corridor === c.key ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200")
              }
              aria-pressed={corridor === c.key}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select value={kind} onChange={(e)=>{ setKind(e.target.value); setVisible(50); }} className="border rounded-lg px-2 py-2 text-sm">
            {kinds.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search (e.g., closure, crash, Glenwood)…" className="border rounded-lg px-3 py-2 text-sm w-64" />
          <button onClick={reset} className="px-3 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-200">Reset</button>
        </div>
      </div>

      <div className="text-xs text-slate-600">{`Showing ${shown.length} of ${filtered.length} items`}</div>

      <ul className="grid gap-3">
        {shown.map(i => (
          <li key={i.id} className="border rounded-xl bg-white ring-1 ring-slate-200 p-3">
            <div className="text-sm font-semibold">{i.name}</div>
            <div className="text-xs text-slate-600">
              <span className="inline-block mr-2 px-2 py-0.5 rounded-full bg-slate-100">{i.kind}</span>
              {i.route && <span className="mr-2">Route: {i.route}</span>}
              {i.direction && <span className="mr-2">Dir: {i.direction}</span>}
              {i.status && <span className="mr-2">Status: {i.status}</span>}
              {i.impact && <span>Impact: {i.impact}</span>}
            </div>
            {i.props && (
              <details className="text-xs mt-2">
                <summary className="cursor-pointer">More details</summary>
                <pre className="mt-1 bg-slate-50 p-2 rounded-lg overflow-x-auto">{JSON.stringify(i.props, null, 2)}</pre>
              </details>
            )}
            {i.link && <a className="underline text-xs mt-1 inline-block" href={i.link} target="_blank" rel="noreferrer">Open in COtrip</a>}
          </li>
        ))}
      </ul>

      {shown.length < filtered.length && (
        <div className="flex justify-center">
          <button onClick={showMore} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-700">
            Show more
          </button>
        </div>
      )}
    </div>
  );
}
