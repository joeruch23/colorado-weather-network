
"use client";
import { useMemo, useState } from "react";

type Cam = { name: string; imageUrl: string | null };

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

export default function CamerasGrid({ cams }: { cams: Cam[] }) {
  const [query, setQuery] = useState("");
  const [corridor, setCorridor] = useState("ALL");
  const [visible, setVisible] = useState(60);

  const filtered = useMemo(() => {
    const base = cams.filter(c => c.imageUrl);
    const byCorridor = base.filter(c => {
      const rule = CORRIDORS.find(x => x.key === corridor) ?? CORRIDORS[0];
      return rule.regex.test(c.name || "");
    });
    const q = query.trim().toLowerCase();
    const byQuery = q ? byCorridor.filter(c => (c.name || "").toLowerCase().includes(q)) : byCorridor;
    return byQuery;
  }, [cams, corridor, query]);

  const shown = filtered.slice(0, visible);
  const showMore = () => setVisible(v => v + 60);
  const reset = () => { setQuery(""); setCorridor("ALL"); setVisible(60); };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {CORRIDORS.map(c => (
            <button
              key={c.key}
              onClick={() => { setCorridor(c.key); setVisible(60); }}
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
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search (e.g., Eisenhower, Vail, Wolf Creek)…"
            className="border rounded-lg px-3 py-2 text-sm w-64"
          />
          <button onClick={reset} className="px-3 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-200">Reset</button>
        </div>
      </div>

      <div className="text-xs text-slate-600">{`Showing ${shown.length} of ${filtered.length} cameras`}</div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {shown.map((c, idx) => (
          <figure key={idx} className="border rounded-xl overflow-hidden bg-white ring-1 ring-slate-200">
            <img src={c.imageUrl!} alt={c.name || "camera"} className="w-full h-44 object-cover" loading="lazy" />
            <figcaption className="p-2 text-xs">{c.name || "camera"}</figcaption>
          </figure>
        ))}
      </div>

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
