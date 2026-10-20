import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { PACKS, currencyFor, type PackId } from "@/lib/pricing";
import { getOrCreateWallet } from "@/lib/wallet";

/** Creates a Stripe Checkout session for a credit pack and returns its URL. */
export async function POST(req: Request) {
  const { pack, analysisId } = (await req.json()) as { pack?: PackId; analysisId?: string };
  if (!pack || !(pack in PACKS)) return NextResponse.json({ error: "Pachet invalid." }, { status: 400 });

  const wallet = await getOrCreateWallet();
  const currency = currencyFor(req.headers.get("x-vercel-ip-country"));
  const p = PACKS[pack];
  const origin = new URL(req.url).origin;
  const back = analysisId ? `/analiza/${analysisId}` : "/";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: p.price[currency],
          product_data: { name: `Lămurit — ${p.label}`, description: `${p.credits} credit(e) pentru explicații de documente` },
        },
      },
    ],
    client_reference_id: wallet,
    metadata: { wallet, credits: String(p.credits) },
    locale: "ro",
    integration_identifier: "lamurit-credits-qkbcklmr",
    success_url: `${origin}${back}?plata=ok`,
    cancel_url: `${origin}${back}`,
  });

  return NextResponse.json({ url: session.url });
}
