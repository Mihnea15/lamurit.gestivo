import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const sans = Inter({ variable: "--font-sans-body", subsets: ["latin", "latin-ext"] });
const display = Fraunces({ variable: "--font-display-serif", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "Lămurit — înțelege orice hârtie oficială",
  description:
    "Faci o poză la documentul de la ANAF, amendă, executor, bancă sau de la autoritățile din Italia, Spania, Germania, UK și îți explicăm pe românește ce înseamnă, ce trebuie să faci și până când.",
  appleWebApp: { capable: true, title: "Lămurit", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#1d2a44" };

/** Root layout with header, footer and fonts. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro" className={`${sans.variable} ${display.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="no-print mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-display text-2xl font-bold tracking-tight">
            Lămurit<span className="text-stamp">.</span>
          </Link>
          <span className="text-sm text-ink/60">RO · IT · ES · DE · UK · FR</span>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16">{children}</main>
        <footer className="no-print mx-auto w-full max-w-3xl px-4 py-6 text-xs text-ink/60">
          <p>
            Lămurit oferă explicații informative generate automat și nu înlocuiește consultanța unui
            avocat sau contabil.
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
