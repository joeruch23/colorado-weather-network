
# Colorado Weather Network — No-Ads Starter (Free-Tier Ready)

**Included:** Next.js 14 + TS + Tailwind, NWS alerts, Currents (Open-Meteo), Winter (model snow), CDOT stubs for closures/cameras, Severe quick-links, Radar embed.

## Accounts (free)
- GitHub, Vercel
- Optional keys later: CDOT API key

## Deploy
1) Push to GitHub → Vercel → New Project → Deploy.
2) Set env vars in Vercel → Settings → Environment Variables:
   - `NEXT_PUBLIC_BASE_URL=https://<your-project>.vercel.app`
   - `CDOT_API_KEY=` (optional for now)
3) Redeploy automatically.

## Pages
- `/radar` — NWS national radar (temporary). Replace with MapLibre later.
- `/alerts` — Active Colorado CAP alerts.
- `/currents` — Geolocate and show current conditions (Open-Meteo).
- `/winter` — Derived snow totals (24h/72h) for major resorts.
- `/roads` — CDOT closures/incidents + cameras (requires `CDOT_API_KEY`).
- `/severe` — SPC quick-links + CAP watches/warnings list.
- `/cameras` — CDOT cameras grid (requires `CDOT_API_KEY`).

## Notes
- CDOT endpoints in `/api/cdot/*` are placeholders; paste the real endpoints from your CDOT docs.
- Avalanche (CAIC) can be added next; we kept it out here to keep things clean without ads.
- For Open-Meteo units, snowfall returns cm; convert to inches by multiplying 0.3937 if you prefer.
