import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { gestivoUrl } from "@/lib/gestivo";
import "./globals.css";

// Same typefaces as www.gestivo.ro: correct Romanian diacritics and tabular figures.
const sans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"] });
const mono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin", "latin-ext"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Lămurit — înțelege orice hârtie oficială · un serviciu Gestivo",
  description:
    "Faci o poză la documentul de la ANAF, amendă, executor, bancă sau de la autoritățile din Italia, Spania, Germania, UK și îți explicăm pe românește ce înseamnă, ce trebuie să faci și până când.",
  appleWebApp: { capable: true, title: "Lămurit", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#edeae3" },
    { media: "(prefers-color-scheme: dark)", color: "#141210" },
  ],
};

/** Root layout with Gestivo-branded header, footer and fonts. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="no-print mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-display text-2xl font-bold tracking-tight">
            Lămurit<span className="text-brass">.</span>
          </Link>
          <a href={gestivoUrl("header")} className="text-sm text-muted hover:text-brass">
            un serviciu <strong className="font-semibold text-ink">Gestivo</strong>
          </a>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16">{children}</main>
        <footer className="no-print mx-auto w-full max-w-3xl border-t border-line px-4 py-6 text-xs text-muted">
          <p>
            Lămurit oferă explicații informative generate automat și nu înlocuiește consultanța unui
            avocat sau contabil.
          </p>
          <p className="mt-2">
            Ai o firmă mică? <a href={gestivoUrl("footer")} className="font-semibold text-brass underline">Gestivo</a>{" "}
            ține oferte, contracte, facturi e-Factura și încasări într-un singur loc.
          </p>
          <p className="mt-2 flex gap-4">
            <Link href="/termeni" className="underline">Termeni</Link>
            <Link href="/confidentialitate" className="underline">Confidențialitate</Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
