import { Suspense } from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { getAnalysis, getCredits } from "@/lib/store";
import { readWallet } from "@/lib/wallet";
import { toPreview, type Analysis, type Draft, type Preview } from "@/lib/schema";
import { PACKS, currencyFor, formatPrice } from "@/lib/pricing";
import Paywall from "@/components/Paywall";
import DraftSection from "@/components/DraftSection";
import PrintButton from "@/components/PrintButton";

const URGENCY: Record<Analysis["urgency"], { label: string; cls: string }> = {
  scazuta: { label: "Urgență scăzută", cls: "bg-ok/15 text-ok" },
  medie: { label: "Urgență medie", cls: "bg-amber-100 text-amber-800" },
  ridicata: { label: "Urgență ridicată", cls: "bg-stamp/15 text-stamp" },
  critica: { label: "Urgent! Acționează azi", cls: "bg-stamp text-white" },
};

const FLAG: Record<Analysis["country"], string> = {
  RO: "🇷🇴", IT: "🇮🇹", ES: "🇪🇸", DE: "🇩🇪", UK: "🇬🇧", FR: "🇫🇷", OTHER: "🌍",
};

/** Report page shell; dynamic content streams in behind Suspense. */
export default function AnalysisPage({ params }: PageProps<"/analiza/[id]">) {
  return (
    <Suspense fallback={<p className="pt-10 text-center text-ink/60">Se încarcă…</p>}>
      <Report params={params} />
    </Suspense>
  );
}

/** Loads the analysis and renders either the free preview with paywall or the full report. */
async function Report({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await getAnalysis(id);
  if (!record) {
    return (
      <div className="pt-10 text-center">
        <h1 className="font-display text-2xl font-bold">Analiza nu mai există</h1>
        <p className="mt-2 text-ink/70">Din motive de confidențialitate ștergem totul după 24 de ore.</p>
        <Link href="/" className="mt-6 inline-block rounded-xl bg-ink px-5 py-3 font-semibold text-paper">
          Analizează alt document
        </Link>
      </div>
    );
  }

  const preview = toPreview(record.analysis);
  if (!record.unlocked) {
    const wallet = await readWallet();
    const credits = wallet ? await getCredits(wallet) : 0;
    const currency = currencyFor((await headers()).get("x-vercel-ip-country"));
    const prices = {
      single: formatPrice(PACKS.single.price[currency], currency),
      five: formatPrice(PACKS.five.price[currency], currency),
    };
    return (
      <>
        <PreviewCard p={preview} />
        <Paywall id={id} credits={credits} prices={prices} p={preview} />
      </>
    );
  }

  return <FullReport id={id} a={record.analysis} draft={record.draft} />;
}

/** Free part: document type, issuer, urgency and a one-line teaser. */
function PreviewCard({ p }: { p: Preview }) {
  const u = URGENCY[p.urgency];
  return (
    <section className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className={`rounded-full px-3 py-1 font-semibold ${u.cls}`}>{u.label}</span>
        <span className="rounded-full bg-paper px-3 py-1">
          {FLAG[p.country]} {p.issuer}
        </span>
        <span className="rounded-full bg-paper px-3 py-1">în {p.language}</span>
      </div>
      <h1 className="mt-4 font-display text-3xl font-bold">{p.docType}</h1>
      <p className="mt-2 text-lg text-ink/80">{p.teaser}</p>
    </section>
  );
}

/** Paid part: plain-language explanation, deadline, steps, consequences and the draft upsell. */
function FullReport({ id, a, draft }: { id: string; a: Analysis; draft: Draft | null }) {
  return (
    <>
      <PreviewCard p={toPreview(a)} />

      <section className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border-2 border-stamp bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-stamp">⏰ Termen limită</h2>
          <p className="mt-2 text-xl font-semibold">
            {a.deadline?.date ? new Date(a.deadline.date).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" }) : "—"}
          </p>
          <p className="mt-1 text-sm text-ink/70">{a.deadline?.description ?? "Documentul nu menționează un termen."}</p>
          {a.deadline?.date && (
            <a href={`/api/ics/${id}`} className="no-print mt-3 inline-block text-sm font-semibold text-ink underline">
              📅 Adaugă în calendar
            </a>
          )}
        </div>
        <div className="rounded-2xl bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink/60">💶 Suma</h2>
          <p className="mt-2 text-xl font-semibold">{a.amount ?? "Nu se cere nicio sumă"}</p>
        </div>
      </section>

      <section className="mt-4 rounded-2xl bg-white p-6">
        <h2 className="font-display text-xl font-bold">Pe înțeles</h2>
        <p className="mt-2 leading-relaxed whitespace-pre-line">{a.summary}</p>
      </section>

      <section className="mt-4 rounded-2xl bg-white p-6">
        <h2 className="font-display text-xl font-bold">Ce ai de făcut</h2>
        <ol className="mt-3 space-y-3">
          {a.steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-paper">
                {i + 1}
              </span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
        {a.whereToFile && (
          <p className="mt-4 rounded-lg bg-paper p-3 text-sm">
            <strong>Unde depui:</strong> {a.whereToFile}
          </p>
        )}
      </section>

      <section className="mt-4 rounded-2xl bg-stamp/10 p-6">
        <h2 className="font-display text-xl font-bold text-stamp">Dacă nu faci nimic</h2>
        <p className="mt-2">{a.consequences}</p>
      </section>

      {a.canContest && <DraftSection id={id} hint={a.contestHint} draft={draft} />}

      <p className="mt-6 text-xs text-ink/60">
        Explicație informativă generată automat, nu consultanță juridică. Verifică datele în documentul original;
        pentru situații complexe consultă un avocat sau un contabil.
      </p>
      <div className="no-print mt-6 flex flex-wrap gap-3">
        <Link href="/" className="rounded-xl bg-ink px-5 py-3 font-semibold text-paper">Analizează alt document</Link>
        <PrintButton />
      </div>
    </>
  );
}
