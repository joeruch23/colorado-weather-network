
import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Colorado Weather Network",
  description: "Colorado-first weather hub: radar, roads, avalanche, ski, currents.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="bg-white border-b">
          <nav className="container flex items-center gap-4 h-14">
            <Link href="/" className="font-semibold">Colorado Weather Network</Link>
            <div className="flex gap-3 text-sm">
              <Link href="/radar">radar</Link>
              <Link href="/currents">currents</Link>
              <Link href="/winter">winter</Link>
              <Link href="/roads">roads</Link>
              <Link href="/severe">severe</Link>
              <Link href="/cameras">cameras</Link>
              <Link href="/alerts">alerts</Link>
              <Link href="/blog">blog</Link>
            </div>
          </nav>
        </header>
        <main className="container py-6">{children}</main>
        <footer className="container py-10 text-sm text-slate-500">
          © {new Date().getFullYear()} Colorado Weather Network — data: NWS/NOAA, Avalanche.org, Open-Meteo, CDOT.
        </footer>
      </body>
    </html>
  );
}
