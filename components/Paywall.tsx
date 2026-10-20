"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Preview } from "@/lib/schema";
import type { PackId } from "@/lib/pricing";
import { deleteLocalFiles, loadLocalFiles } from "@/lib/localFiles";
import { preparePages } from "@/components/Uploader";

type Props = {
  id: string;
  credits: number;
  prices: Record<PackId, string>;
  p: Preview;
};

/** Locked report teaser with unlock (existing credits) or buy (Stripe Checkout) actions. */
export default function Paywall({ id, credits, prices, p }: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const reuploadRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsReupload, setNeedsReupload] = useState(false);
  const [waiting, setWaiting] = useState(search.get("plata") === "ok");

  /** Sends the pages for the paid analysis; the server charges one credit only on success. */
  const unlock = useCallback(
    async (picked?: File[]) => {
      setError(null);
      const pages = picked ? await preparePages(picked) : await loadLocalFiles(id);
      if (!pages?.length) {
        setNeedsReupload(true);
        setWaiting(false);
        return;
      }
      setBusy("unlock");
      const form = new FormData();
      form.append("id", id);
      for (const f of pages) form.append("files", f, f.name);
      const res = await fetch("/api/unlock", { method: "POST", body: form });
      if (res.ok) {
        await deleteLocalFiles(id);
        router.replace(`/analiza/${id}`);
        router.refresh();
        return;
      }
      const data = (await res.json()) as { error?: string };
      setError(data.error === "no_credits" ? "Nu ai credite. Alege un pachet mai jos." : data.error ?? "Ceva n-a mers.");
      setBusy(null);
      setWaiting(false);
    },
    [id, router]
  );

  // After returning from Stripe, wait for the webhook to credit the wallet, then unlock automatically.
  useEffect(() => {
    if (!waiting) return;
    let cancelled = false;
    (async () => {
      for (let i = 0; i < 20 && !cancelled; i++) {
        const { credits } = (await (await fetch("/api/credits")).json()) as { credits: number };
        if (credits > 0) return unlock();
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (!cancelled) {
        setWaiting(false);
        setError("Plata se procesează încă. Reîncarcă pagina peste un minut.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [waiting, unlock]);

  /** Starts a Stripe Checkout session for the chosen pack. */
  async function buy(pack: PackId) {
    setBusy(pack);
    setError(null);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pack, analysisId: id }),
    });
    const data = (await res.json()) as { url?: string };
    if (data.url) window.location.href = data.url;
    else {
      setError("Nu am putut porni plata. Încearcă din nou.");
      setBusy(null);
    }
  }

  return (
    <section className="mt-4 overflow-hidden rounded-2xl bg-raised shadow-sm">
      <div className="relative space-y-3 p-6 select-none" aria-hidden>
        {p.hasDeadline && <LockedRow label="⏰ Termen limită" />}
        {p.hasAmount && <LockedRow label="💶 Suma" />}
        <LockedRow label="📖 Pe înțeles" lines={3} />
        <LockedRow label="✅ Ce ai de făcut, pas cu pas" lines={3} />
        <LockedRow label="⚠️ Dacă nu faci nimic" />
        {p.canContest && <LockedRow label="✍️ Se poate contesta" />}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-raised" />
      </div>

      <div className="border-t border-ink/10 bg-paper/60 p-6">
        <input
          ref={reuploadRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => e.target.files?.length && unlock(Array.from(e.target.files).slice(0, 5))}
        />
        {needsReupload && busy !== "unlock" ? (
          <div className="text-center">
            <p className="font-semibold">Mai trimite o dată documentul</p>
            <p className="mt-1 text-sm text-ink/70">
              Din motive de confidențialitate nu-l păstrăm pe server, iar pe acest dispozitiv nu l-am mai găsit.
            </p>
            <button
              onClick={() => reuploadRef.current?.click()}
              className="mt-3 w-full rounded-xl bg-brass-fill px-5 py-4 text-lg font-bold text-on-brass shadow hover:brightness-110"
            >
              📄 Alege din nou documentul
            </button>
          </div>
        ) : waiting || busy === "unlock" ? (
          <p className="text-center font-semibold">
            {busy === "unlock" ? "Analizez documentul în detaliu… (~30 sec) ⏳" : "Confirmăm plata… ⏳"}
          </p>
        ) : credits > 0 ? (
          <button
            onClick={() => unlock()}
            disabled={!!busy}
            className="w-full rounded-xl bg-brass-fill px-5 py-4 text-lg font-bold text-on-brass shadow hover:brightness-110 disabled:opacity-70"
          >
            {`Vezi explicația completă (1 credit, mai ai ${credits})`}
          </button>
        ) : (
          <>
            <p className="text-center font-semibold">Vezi explicația completă</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => buy("single")}
                disabled={!!busy}
                className="rounded-xl bg-brass-fill px-5 py-4 font-bold text-on-brass shadow hover:brightness-110 disabled:opacity-70"
              >
                {busy === "single" ? "Se deschide plata…" : `Doar acest document · ${prices.single}`}
              </button>
              <button
                onClick={() => buy("five")}
                disabled={!!busy}
                className="rounded-xl border-2 border-ink px-5 py-4 font-bold hover:bg-ink/5 disabled:opacity-70"
              >
                {busy === "five" ? "Se deschide plata…" : `Pachet 5 documente · ${prices.five}`}
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-ink/60">Plată securizată prin Stripe · card, Apple Pay, Google Pay</p>
          </>
        )}
        {error && <p className="mt-3 text-center text-sm font-medium text-alert">{error}</p>}
      </div>
    </section>
  );
}

/** Blurred placeholder row standing in for a locked report section. */
function LockedRow({ label, lines = 1 }: { label: string; lines?: number }) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink/70">{label}</p>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="mt-1.5 h-3.5 rounded bg-ink/10 blur-[2px]" style={{ width: `${90 - i * 15}%` }} />
      ))}
    </div>
  );
}
