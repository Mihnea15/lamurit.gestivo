import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { previewDocument } from "@/lib/ai";
import { withinBudget } from "@/lib/budget";
import { readUploadedFiles } from "@/lib/files";
import { redis, savePreview, getCredits } from "@/lib/store";
import { getOrCreateWallet } from "@/lib/wallet";

// Free previews cost us an AI call, so anonymous visitors get a small daily quota.
const freeLimiter = new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(3, "1 d"), prefix: "rl:free" });
const paidLimiter = new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(30, "1 d"), prefix: "rl:paid" });

/** Free preview: identifies the document on the cheap model and stores only the result. */
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
  if (!(await withinBudget("free"))) {
    return NextResponse.json(
      { error: "Avem foarte multe cereri azi. Încearcă din nou mâine dimineață." },
      { status: 503 }
    );
  }

  const files = await readUploadedFiles(await req.formData());
  if ("error" in files) return NextResponse.json({ error: files.error }, { status: files.status });

  try {
    const preview = await previewDocument(files);
    if (!preview.isOfficialDocument) {
      return NextResponse.json(
        { error: "Nu pare a fi un document. Fă o poză clară, cu toată pagina în cadru." },
        { status: 422 }
      );
    }
    const id = crypto.randomUUID();
    await savePreview(id, wallet, preview);
    return NextResponse.json({ id });
  } catch (e) {
    // Log only the error, never document content.
    console.error("preview failed:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "Nu am reușit să citim documentul. Încearcă o poză mai clară." },
      { status: 500 }
    );
  }
}
