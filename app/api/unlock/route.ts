import { NextResponse } from "next/server";
import { analyzeDocument } from "@/lib/ai";
import { withinBudget } from "@/lib/budget";
import { readUploadedFiles } from "@/lib/files";
import { getAnalysis, getCredits, spendCredits, updateAnalysis, withLock } from "@/lib/store";
import { getOrCreateWallet } from "@/lib/wallet";
import { COST } from "@/lib/pricing";

/** Runs the paid full analysis on the re-sent pages; the credit is spent only if it succeeds. */
export async function POST(req: Request) {
  const form = await req.formData();
  const id = String(form.get("id") ?? "");
  const record = id ? await getAnalysis(id) : null;
  if (!record) return NextResponse.json({ error: "Analiza a expirat." }, { status: 404 });
  if (record.analysis) return NextResponse.json({ ok: true });

  const wallet = await getOrCreateWallet();
  if ((await getCredits(wallet)) < COST.report) {
    return NextResponse.json({ error: "no_credits" }, { status: 402 });
  }
  if (!(await withinBudget("paid"))) {
    return NextResponse.json(
      { error: "Serviciul e temporar suprasolicitat. Creditul tău rămâne neatins, încearcă peste câteva ore." },
      { status: 503 }
    );
  }
  const files = await readUploadedFiles(form);
  if ("error" in files) return NextResponse.json({ error: files.error }, { status: files.status });

  const result = await withLock(`wallet:${wallet}`, async () => {
    try {
      const analysis = await analyzeDocument(files);
      // Charge only after a successful analysis; a lost race means no charge and no save.
      if (!(await spendCredits(wallet, COST.report))) return "no_credits" as const;
      await updateAnalysis(id, { ...record, analysis });
      return "ok" as const;
    } catch (e) {
      console.error("analysis failed:", e instanceof Error ? e.message : e);
      return "failed" as const;
    }
  });

  if (result === "ok") return NextResponse.json({ ok: true });
  if (result === "locked") return NextResponse.json({ error: "Analizăm deja documentul…" }, { status: 409 });
  if (result === "no_credits") return NextResponse.json({ error: "no_credits" }, { status: 402 });
  return NextResponse.json(
    { error: "Nu am reușit analiza. Nu ți-am luat niciun credit, încearcă din nou." },
    { status: 500 }
  );
}
