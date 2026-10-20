import { generateText, Output } from "ai";
import { analysisSchema, draftSchema, previewSchema, type Analysis, type Draft, type Preview } from "./schema";
import { ANALYZE_SYSTEM, DRAFT_SYSTEM, PREVIEW_SYSTEM } from "./prompts";
import { MODELS, estimateCost, recordSpend } from "./budget";

export type UploadedFile = { data: Uint8Array; mediaType: string };

// Output caps bound the worst-case cost of a single call (thinking tokens count as output).
const MAX_OUTPUT = { preview: 2_000, full: 12_000, draft: 10_000 } as const;

/** Builds the user message carrying the document pages. */
function documentMessage(files: UploadedFile[], instruction: string) {
  return [
    {
      role: "user" as const,
      content: [
        { type: "text" as const, text: `${instruction} (${files.length} fișier(e)). Data de azi: ${today()}.` },
        ...files.map((f) => ({ type: "file" as const, mediaType: f.mediaType, data: f.data })),
      ],
    },
  ];
}

/** Free first pass on the cheap model: document type, issuer and urgency only. */
export async function previewDocument(files: UploadedFile[]): Promise<Preview> {
  const { output, usage } = await generateText({
    model: MODELS.preview,
    system: PREVIEW_SYSTEM,
    reasoning: "low",
    maxOutputTokens: MAX_OUTPUT.preview,
    output: Output.object({ schema: previewSchema }),
    messages: documentMessage(files, "Identifică documentul de mai jos"),
  });
  await recordSpend("free", estimateCost(MODELS.preview, usage));
  return output;
}

/** Paid full analysis on the strong model; only called after the user has credits. */
export async function analyzeDocument(files: UploadedFile[]): Promise<Analysis> {
  const { output, usage } = await generateText({
    model: MODELS.full,
    system: ANALYZE_SYSTEM,
    reasoning: "medium",
    maxOutputTokens: MAX_OUTPUT.full,
    output: Output.object({ schema: analysisSchema }),
    messages: documentMessage(files, "Analizează documentul de mai jos"),
  });
  await recordSpend("paid", estimateCost(MODELS.full, usage));
  return output;
}

/** Writes a reply/contestation draft from facts extracted during analysis (the original file is not kept). */
export async function draftReply(a: Analysis): Promise<Draft> {
  const { output, usage } = await generateText({
    model: MODELS.full,
    system: DRAFT_SYSTEM,
    reasoning: "medium",
    maxOutputTokens: MAX_OUTPUT.draft,
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
  await recordSpend("paid", estimateCost(MODELS.full, usage));
  return output;
}

/** Current date as YYYY-MM-DD, used by the model to compute deadlines. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}
