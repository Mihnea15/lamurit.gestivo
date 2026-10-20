import { NextResponse } from "next/server";
import { draftReply } from "@/lib/ai";
import { getAnalysis, spendCredits, updateAnalysis, redis } from "@/lib/store";
import { getOrCreateWallet } from "@/lib/wallet";
import { COST } from "@/lib/pricing";

/** Spends credits and generates a reply/contestation draft for an unlocked report. */
export async function POST(req: Request) {
  const { id } = (await req.json()) as { id?: string };
  const record = id ? await getAnalysis(id) : null;
  if (!id || !record) return NextResponse.json({ error: "Analiza a expirat." }, { status: 404 });
  if (!record.unlocked) return NextResponse.json({ error: "Deblochează întâi raportul." }, { status: 403 });
  if (record.draft) return NextResponse.json({ ok: true });

  // Lock prevents double charging on a double click.
  const lock = await redis.set(`draft-lock:${id}`, 1, { nx: true, ex: 120 });
  if (lock !== "OK") return NextResponse.json({ error: "Se redactează deja…" }, { status: 409 });

  const wallet = await getOrCreateWallet();
  try {
    if (!(await spendCredits(wallet, COST.draft))) {
      return NextResponse.json({ error: "no_credits" }, { status: 402 });
    }
    try {
      const draft = await draftReply(record.analysis);
      await updateAnalysis(id, { ...record, draft });
      return NextResponse.json({ ok: true });
    } catch (e) {
      // Refund on AI failure so the user is not charged for nothing.
      await redis.incrby(`credits:${wallet}`, COST.draft);
      console.error("draft failed:", e instanceof Error ? e.message : e);
      return NextResponse.json({ error: "Nu am reușit să redactăm. Creditele ți-au fost returnate." }, { status: 500 });
    }
  } finally {
    await redis.del(`draft-lock:${id}`);
  }
}
