import { generateText, Output } from "ai";
import { analysisSchema, draftSchema, type Analysis, type Draft } from "./schema";
import { ANALYZE_SYSTEM, DRAFT_SYSTEM } from "./prompts";

// Routed through Vercel AI Gateway; vision-capable model.
const MODEL = "anthropic/claude-sonnet-5-5";

export type UploadedFile = { data: Uint8Array; mediaType: string };

/** Sends the document pages to the model and returns the structured analysis. */
export async function analyzeDocument(files: UploadedFile[]): Promise<Analysis> {
  const { output } = await generateText({
    model: MODEL,
    system: ANALYZE_SYSTEM,
    output: Output.object({ schema: analysisSchema }),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analizează documentul de mai jos (${files.length} fișier(e)). Data de azi: ${today()}.`,
          },
          ...files.map((f) => ({ type: "file" as const, mediaType: f.mediaType, data: f.data })),
        ],
      },
    ],
  });
  return output;
}

/** Writes a reply/contestation draft from facts extracted during analysis (the original file is not kept). */
export async function draftReply(a: Analysis): Promise<Draft> {
  const { output } = await generateText({
    model: MODEL,
    system: DRAFT_SYSTEM,
    output: Output.object({ schema: draftSchema }),
    prompt: [
      `Data de azi: ${today()}`,
      `Țara: ${a.country}. Limba răspunsului: ${a.replyLanguage}.`,
      `Tip document: ${a.docType}. Emitent: ${a.issuer}.`,
      `Fapte: ${a.facts}`,
      `Sumă: ${a.amount ?? "-"}. Termen: ${a.deadline?.description ?? "-"}.`,
      `Motive posibile de contestare: ${a.contestHint ?? "-"}`,
      "Redactează răspunsul/contestația potrivită.",
    ].join("\n"),
  });
  return output;
}

/** Current date as YYYY-MM-DD, used by the model to compute deadlines. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}
