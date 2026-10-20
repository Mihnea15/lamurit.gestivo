import { Redis } from "@upstash/redis";
import type { Analysis, Draft } from "./schema";

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// Results are kept only for 24h (GDPR: we never store the original document).
const RESULT_TTL = 60 * 60 * 24;

export type StoredAnalysis = {
  analysis: Analysis;
  wallet: string;
  unlocked: boolean;
  draft: Draft | null;
  createdAt: string;
};

/** Saves a fresh analysis owned by the given wallet and returns nothing. */
export async function saveAnalysis(id: string, wallet: string, analysis: Analysis) {
  const record: StoredAnalysis = {
    analysis,
    wallet,
    unlocked: false,
    draft: null,
    createdAt: new Date().toISOString(),
  };
  await redis.set(`analysis:${id}`, record, { ex: RESULT_TTL });
}

/** Loads an analysis, or null if it expired or never existed. */
export async function getAnalysis(id: string): Promise<StoredAnalysis | null> {
  return redis.get<StoredAnalysis>(`analysis:${id}`);
}

/** Overwrites an analysis while keeping its remaining TTL. */
export async function updateAnalysis(id: string, record: StoredAnalysis) {
  await redis.set(`analysis:${id}`, record, { keepTtl: true });
}

/** Returns the wallet's current credit balance. */
export async function getCredits(wallet: string): Promise<number> {
  return (await redis.get<number>(`credits:${wallet}`)) ?? 0;
}

/** Atomically spends credits; returns false (and spends nothing) if the balance is too low. */
export async function spendCredits(wallet: string, amount: number): Promise<boolean> {
  const ok = await redis.eval<[number], number>(
    `local c = tonumber(redis.call('GET', KEYS[1]) or '0')
     if c < tonumber(ARGV[1]) then return 0 end
     redis.call('DECRBY', KEYS[1], ARGV[1])
     return 1`,
    [`credits:${wallet}`],
    [amount]
  );
  return ok === 1;
}

/** Adds credits for a paid checkout session exactly once, even if the webhook is retried. */
export async function grantCreditsOnce(sessionId: string, wallet: string, amount: number) {
  const first = await redis.set(`fulfilled:${sessionId}`, 1, { nx: true, ex: 60 * 60 * 24 * 90 });
  if (first === "OK") await redis.incrby(`credits:${wallet}`, amount);
}
