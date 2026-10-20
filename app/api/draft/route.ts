import { NextResponse } from "next/server";
import { draftReply } from "@/lib/ai";
import { withinBudget } from "@/lib/budget";
import { getAnalysis, getCredits, spendCredits, updateAnalysis, withLock } from "@/lib/store";
import { getOrCreateWallet } from "@/lib/wallet";
import { COST } from "@/lib/pricing";

/** Generates a reply/contestation draft for an unlocked report; credits are spent only on success. */
export async function POST(req: Request) {
  const { id } = (await req.json()) as { id?: string };
  const record = id ? await getAnalysis(id) : null;
  if (!id || !record) return NextResponse.json({ error: "Analiza a expirat." }, { status: 404 });
  if (!record.analysis) return NextResponse.json({ error: "Deblochează întâi raportul." }, { status: 403 });
  if (record.draft) return NextResponse.json({ ok: true });

  const wallet = await getOrCreateWallet();
  if ((await getCredits(wallet)) < COST.draft) return NextResponse.json({ error: "no_credits" }, { status: 402 });
  if (!(await withinBudget("paid"))) {
    return NextResponse.json(
      { error: "Serviciul e temporar suprasolicitat. Creditele tale rămân neatinse, încearcă peste câteva ore." },
      { status: 503 }
    );
  }

  const analysis = record.analysis;
  const result = await withLock(`wallet:${wallet}`, async () => {
    try {
      const draft = await draftReply(analysis);
      if (!(await spendCredits(wallet, COST.draft))) return "no_credits" as const;
      await updateAnalysis(id, { ...record, draft });
      return "ok" as const;
    } catch (e) {
      console.error("draft failed:", e instanceof Error ? e.message : e);
      return "failed" as const;
    }
  });

  if (result === "ok") return NextResponse.json({ ok: true });
  if (result === "locked") return NextResponse.json({ error: "Se redactează deja…" }, { status: 409 });
  if (result === "no_credits") return NextResponse.json({ error: "no_credits" }, { status: 402 });
  return NextResponse.json(
    { error: "Nu am reușit să redactăm. Nu ți-am luat niciun credit, încearcă din nou." },
    { status: 500 }
  );
}
