
# Colorado Weather Network — Polished (No Ads)

A clean, production-friendly Next.js 14 starter for Colorado weather.
- Polished Tailwind UI (hero, cards, sticky nav)
- **No env vars needed** for core pages
- Server components fetch upstream data directly (NWS CAP, Open‑Meteo)
- Avoids relative `/api` fetches to prevent server errors on Vercel

## Pages
- `/` — Hero + quick links
- `/radar` — NWS national radar embed (swap to MapLibre later)
- `/alerts` — Active CO alerts (NWS CAP)
- `/severe` — SPC quick links + active CO WW
- `/currents` — Client: geolocate + Open‑Meteo current weather
- `/winter` — Model-derived 24h/72h snowfall for major CO resorts

## Deploy (Vercel Hobby)
1) Push to GitHub (ensure `app/` and `public/` at repo root)
2) Import repo at https://vercel.com/new → Deploy
3) Done. No env vars required

## Next steps
- Add CDOT closures/cameras (needs API key & endpoints)
- Add CAIC avalanche zones and danger ratings
- Replace radar with MapLibre + tiles for animation
