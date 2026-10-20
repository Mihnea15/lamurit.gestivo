import { cookies } from "next/headers";

const COOKIE = "lamurit_wallet";

/** Reads the anonymous wallet id from the cookie, creating one if missing (route handlers only). */
export async function getOrCreateWallet(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing) return existing;
  const id = crypto.randomUUID();
  jar.set(COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return id;
}

/** Reads the wallet id without creating one (safe to call from server components). */
export async function readWallet(): Promise<string | null> {
  return (await cookies()).get(COOKIE)?.value ?? null;
}
