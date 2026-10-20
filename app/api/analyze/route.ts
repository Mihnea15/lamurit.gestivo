import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { analyzeDocument, type UploadedFile } from "@/lib/ai";
import { redis, saveAnalysis, getCredits } from "@/lib/store";
import { getOrCreateWallet } from "@/lib/wallet";

const MAX_FILES = 5;
const MAX_TOTAL_BYTES = 4.4 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

// Free previews cost us an AI call, so anonymous visitors get a small daily quota.
const freeLimiter = new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(3, "1 d"), prefix: "rl:free" });
const paidLimiter = new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(30, "1 d"), prefix: "rl:paid" });

/** Accepts document pages, runs the AI analysis and stores the result (never the file itself). */
export async function POST(req: Request) {
  const wallet = await getOrCreateWallet();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const limiter = (await getCredits(wallet)) > 0 ? paidLimiter : freeLimiter;
  const { success } = await limiter.limit(`${ip}:${wallet}`);
  if (!success) {
    return NextResponse.json(
      { error: "Ai atins limita de analize gratuite pe azi. Cumpără un pachet sau revino mâine." },
      { status: 429 }
    );
  }

  const form = await req.formData();
  const entries = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!entries.length || entries.length > MAX_FILES) {
    return NextResponse.json({ error: `Trimite între 1 și ${MAX_FILES} pagini.` }, { status: 400 });
  }
  if (entries.some((f) => !ALLOWED.includes(f.type))) {
    return NextResponse.json({ error: "Acceptăm doar poze (JPG, PNG, WEBP) și PDF." }, { status: 400 });
  }
  if (entries.reduce((s, f) => s + f.size, 0) > MAX_TOTAL_BYTES) {
    return NextResponse.json({ error: "Fișierele sunt prea mari. Încearcă mai puține pagini." }, { status: 413 });
  }

  const files: UploadedFile[] = await Promise.all(
    entries.map(async (f) => ({ data: new Uint8Array(await f.arrayBuffer()), mediaType: f.type }))
  );

  try {
    const analysis = await analyzeDocument(files);
    if (!analysis.isOfficialDocument) {
      return NextResponse.json(
        { error: "Nu pare a fi un document. Fă o poză clară, cu toată pagina în cadru." },
        { status: 422 }
      );
    }
    const id = crypto.randomUUID();
    await saveAnalysis(id, wallet, analysis);
    return NextResponse.json({ id });
  } catch (e) {
    // Log only the error, never document content.
    console.error("analyze failed:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "Nu am reușit să citim documentul. Încearcă o poză mai clară." },
      { status: 500 }
    );
  }
}
