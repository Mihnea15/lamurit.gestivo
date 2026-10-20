import type { LanguageModelUsage } from "ai";
import { redis } from "./store";

export const MODELS = {
  preview: "anthropic/claude-haiku-5.5",
  full: "anthropic/claude-sonnet-5.5",
} as const;

// USD per token, taken from https://ai-gateway.vercel.sh/v1/models (2026-10-20).
// We use the EU regional price (+10%) so the estimate is always on the safe side.
const PRICE: Record<string, { input: number; output: number }> = {
  [MODELS.preview]: { input: 0.11 / 1e6, output: 0.55 / 1e6 },
  [MODELS.full]: { input: 2.2 / 1e6, output: 11 / 1e6 },
};

// Daily spend caps in USD; override from Vercel env vars without redeploying code.
const FREE_DAILY_USD = Number(process.env.FREE_DAILY_USD ?? 1);
const TOTAL_DAILY_USD = Number(process.env.TOTAL_DAILY_USD ?? 3);

export type SpendKind = "free" | "paid";

/** Redis key for today's (UTC) spend counter of the given kind. */
function key(kind: SpendKind | "total"): string {
  return `spend:${kind}:${new Date().toISOString().slice(0, 10)}`;
}

/** Estimates the USD cost of one model call from its token usage. */
export function estimateCost(model: string, usage: LanguageModelUsage): number {
  const p = PRICE[model];
  return (usage.inputTokens ?? 0) * p.input + (usage.outputTokens ?? 0) * p.output;
}

/** Adds a call's cost to today's counters (stored in micro-dollars, kept for 3 days). */
export async function recordSpend(kind: SpendKind, usd: number) {
  const micro = Math.ceil(usd * 1e6);
  const p = redis.pipeline();
  for (const k of [key(kind), key("total")]) {
    p.incrby(k, micro);
    p.expire(k, 60 * 60 * 24 * 3);
  }
  await p.exec();
}

/** Returns true while today's spend is under the caps for the given kind of call. */
export async function withinBudget(kind: SpendKind): Promise<boolean> {
  const [kindMicro, totalMicro] = await redis.mget<(number | null)[]>(key(kind), key("total"));
  if ((totalMicro ?? 0) / 1e6 >= TOTAL_DAILY_USD) return false;
  return kind === "paid" || (kindMicro ?? 0) / 1e6 < FREE_DAILY_USD;
}
