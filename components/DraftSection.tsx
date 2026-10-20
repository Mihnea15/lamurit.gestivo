"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Draft } from "@/lib/schema";

type Props = { id: string; hint: string | null; draft: Draft | null };

/** Upsell and display of the generated reply/contestation draft. */
export default function DraftSection({ id, hint, draft }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRo, setShowRo] = useState(false);
  const [copied, setCopied] = useState(false);

  /** Requests the draft; on missing credits sends the user to buy a pack. */
  async function generate() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) return router.refresh();
    const data = (await res.json()) as { error?: string };
    if (data.error === "no_credits") {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack: "five", analysisId: id }),
      });
      const { url } = (await r.json()) as { url?: string };
      if (url) return void (window.location.href = url);
    }
    setError(data.error && data.error !== "no_credits" ? data.error : "Nu am putut redacta. Încearcă din nou.");
    setBusy(false);
  }

  /** Copies the draft text to the clipboard. */
  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!draft) {
    return (
      <section className="no-print mt-4 rounded-2xl border-2 border-dashed border-ink/30 bg-white p-6">
        <h2 className="font-display text-xl font-bold">✍️ Vrei să contești sau să răspunzi?</h2>
        {hint && <p className="mt-2 text-ink/80">{hint}</p>}
        <p className="mt-2 text-sm text-ink/70">
          Îți redactăm răspunsul gata de trimis, în limba instituției, cu traducere în română.
        </p>
        <button
          onClick={generate}
          disabled={busy}
          className="mt-4 w-full rounded-xl bg-ink px-5 py-4 font-bold text-paper hover:bg-ink/90 disabled:opacity-70"
        >
          {busy ? "Redactez… (~30 sec)" : "Redactează-mi răspunsul (2 credite)"}
        </button>
        {error && <p className="mt-3 text-sm font-medium text-stamp">{error}</p>}
      </section>
    );
  }

  const text = showRo ? draft.bodyRo : draft.body;
  return (
    <section className="mt-4 rounded-2xl bg-white p-6">
      <h2 className="font-display text-xl font-bold">✍️ {draft.title}</h2>
      <div className="no-print mt-3 flex flex-wrap gap-2 text-sm">
        <button onClick={() => setShowRo(false)} className={`rounded-full px-3 py-1 ${!showRo ? "bg-ink text-paper" : "bg-paper"}`}>
          Textul de trimis
        </button>
        <button onClick={() => setShowRo(true)} className={`rounded-full px-3 py-1 ${showRo ? "bg-ink text-paper" : "bg-paper"}`}>
          Traducere în română
        </button>
        <button onClick={() => copy(draft.body)} className="ml-auto rounded-full bg-stamp px-3 py-1 font-semibold text-white">
          {copied ? "Copiat ✓" : "Copiază textul"}
        </button>
      </div>
      <pre className="mt-3 rounded-lg bg-paper p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap">{text}</pre>
      <p className="mt-3 rounded-lg bg-ok/10 p-3 text-sm">
        <strong>Cum trimiți:</strong> {draft.instructions}
      </p>
      <p className="mt-2 text-xs text-ink/60">Completează câmpurile [PLACEHOLDER] și [COMPLETAȚI] înainte de trimitere.</p>
    </section>
  );
}
