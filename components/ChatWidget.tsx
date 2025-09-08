
"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant" | "system"; content: string };
type Location = { lat?: number; lon?: number; city?: string };

function Bubble({ role, children }: { role: Msg["role"]; children: any }) {
  const isUser = role === "user";
  return (
    <div className={"flex " + (isUser ? "justify-end" : "justify-start")}>
      <div className={(isUser ? "bg-slate-900 text-white" : "bg-white text-slate-900") + " max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow ring-1 ring-slate-200"}>
        {children}
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: "Hi! Ask me about Colorado weather, alerts, roads or ski snowfall. You can also click “Use my location.”" }
  ]);
  const [input, setInput] = useState("");
  const [loc, setLoc] = useState<Location>({});
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => { scroller.current?.scrollTo(0, 999999); }, [msgs, open]);

  const ask = async (prompt?: string) => {
    const message = (prompt ?? input).trim();
    if (!message) return;
    setInput("");
    setMsgs(m => [...m, { role: "user", content: message }]);
    setBusy(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, ...loc })
      });
      const j = await r.json();
      setMsgs(m => [...m, { role: "assistant", content: j.text || "Sorry, I couldn’t fetch that right now." }]);
    } catch (e:any) {
      setMsgs(m => [...m, { role: "assistant", content: "Network error. Try again." }]);
    } finally {
      setBusy(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setMsgs(m => [...m, { role: "system", content: "Geolocation not supported by this browser." }]);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setLoc({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => setMsgs(m => [...m, { role: "system", content: "Permission denied. Type a city like “Vail, CO” and ask again." }])
    );
  };

  const quicks = [
    { label: "Current conditions", q: "current conditions right now" },
    { label: "Next 24h", q: "hourly forecast for the next 24 hours" },
    { label: "3‑day", q: "3-day forecast" },
    { label: "Alerts", q: "any active alerts or warnings for Colorado?" }
  ];

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-4 right-4 z-50 rounded-full h-14 w-14 bg-slate-900 text-white shadow-lg hover:bg-slate-700"
        aria-label="Open chat"
      >
        💬
      </button>
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-[min(92vw,380px)] h-[560px] bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between bg-slate-50">
            <div className="font-semibold text-sm">Weather Chat</div>
            <div className="flex items-center gap-2">
              <button onClick={useMyLocation} className="text-xs px-2 py-1 rounded bg-slate-900 text-white">Use my location</button>
              <button onClick={()=>setOpen(false)} className="text-xs px-2 py-1 rounded bg-slate-100">Close</button>
            </div>
          </div>
          <div ref={scroller} className="flex-1 p-3 space-y-2 overflow-y-auto bg-slate-50/50">
            {msgs.map((m, i) => <Bubble key={i} role={m.role}>{m.content}</Bubble>)}
          </div>
          <div className="p-2 border-t space-y-2">
            <div className="flex flex-wrap gap-2">
              {quicks.map((q, i) => (
                <button key={i} onClick={() => ask(q.q)} className="px-2 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200">{q.label}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e=>setInput(e.target.value)}
                placeholder="Ask: “snow for Vail tomorrow?”, “alerts near Denver?”, …"
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
                onKeyDown={(e)=>{ if(e.key==="Enter") ask(); }}
              />
              <button onClick={()=>ask()} disabled={busy} className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-700 disabled:opacity-50">Send</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
