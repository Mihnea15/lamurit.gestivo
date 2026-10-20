import { NextResponse } from "next/server";
import { getCredits } from "@/lib/store";
import { readWallet } from "@/lib/wallet";

/** Returns the visitor's credit balance (polled after checkout while the webhook lands). */
export async function GET() {
  const wallet = await readWallet();
  return NextResponse.json({ credits: wallet ? await getCredits(wallet) : 0 });
}
