
import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Colorado Weather Network",
  description: "Colorado-first weather hub: radar, roads, avalanche, ski, currents.",
};

const NavLink = ({ href, children }: { href: string; children: any }) => (
  <Link href={href} className="px-3 py-1.5 rounded-lg hover:bg-slate-100 text-sm">
    {children}
  </Link>
);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
          <nav className="container h-14 flex items-center justify-between">
            <Link href="/" className="font-semibold">Colorado Weather Network</Link>
            <div className="hidden md:flex items-center gap-1">
              <NavLink href="/radar">radar</NavLink>
              <NavLink href="/currents">currents</NavLink>
              <NavLink href="/winter">winter</NavLink>
              <NavLink href="/roads">roads</NavLink>
              <NavLink href="/severe">severe</NavLink>
              <NavLink href="/cameras">cameras</NavLink>
              <NavLink href="/alerts">alerts</NavLink>
              <NavLink href="/blog">blog</NavLink>
            </div>
          </nav>
        </header>
        <main className="container py-6">{children}</main>
        <footer className="container py-10 text-sm text-slate-500">
          © {new Date().getFullYear()} Colorado Weather Network — data: NWS/NOAA, Open‑Meteo, CDOT (where available).
        </footer>
      </body>
    </html>
  );
}
