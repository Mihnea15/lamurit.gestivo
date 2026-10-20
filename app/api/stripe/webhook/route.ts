import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { grantCreditsOnce } from "@/lib/store";

/** Verifies Stripe events and grants credits once a checkout is actually paid. */
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(await req.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      // Delayed payment methods complete while still unpaid; fulfill only once money is in.
      if (session.payment_status === "paid") {
        const wallet = session.metadata?.wallet;
        const credits = Number(session.metadata?.credits ?? 0);
        if (wallet && credits > 0) await grantCreditsOnce(session.id, wallet, credits);
      }
      break;
    }
    case "checkout.session.async_payment_failed":
      console.warn("async payment failed:", event.data.object.id);
      break;
  }
  return NextResponse.json({ received: true });
}
