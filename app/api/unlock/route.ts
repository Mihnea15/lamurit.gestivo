import { NextResponse } from "next/server";
import { getAnalysis, spendCredits, updateAnalysis } from "@/lib/store";
import { getOrCreateWallet } from "@/lib/wallet";
import { COST } from "@/lib/pricing";

/** Spends one credit from the visitor's wallet to unlock the full report. */
export async function POST(req: Request) {
  const { id } = (await req.json()) as { id?: string };
  const record = id ? await getAnalysis(id) : null;
  if (!id || !record) return NextResponse.json({ error: "Analiza a expirat." }, { status: 404 });
  if (record.unlocked) return NextResponse.json({ ok: true });

  const wallet = await getOrCreateWallet();
  if (!(await spendCredits(wallet, COST.report))) {
    return NextResponse.json({ error: "no_credits" }, { status: 402 });
  }
  await updateAnalysis(id, { ...record, unlocked: true });
  return NextResponse.json({ ok: true });
}
