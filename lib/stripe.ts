import Stripe from "stripe";

// Single Stripe client instance, pinned to the SDK's API version.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
