import { z } from "zod";

// Structured result the model must return for every analyzed document.
export const analysisSchema = z.object({
  isOfficialDocument: z
    .boolean()
    .describe("false dacă imaginea nu e un document (selfie, peisaj etc.)"),
  country: z
    .enum(["RO", "IT", "ES", "DE", "UK", "FR", "OTHER"])
    .describe("Țara emitentului documentului"),
  language: z.string().describe("Limba documentului, ex: română, italiană"),
  docType: z
    .string()
    .describe("Tipul documentului, scurt, în română. Ex: Decizie de impunere ANAF"),
  issuer: z.string().describe("Cine a emis documentul. Ex: ANAF, Poliția Rutieră"),
  urgency: z
    .enum(["scazuta", "medie", "ridicata", "critica"])
    .describe("Cât de urgent trebuie să acționeze persoana"),
  teaser: z
    .string()
    .describe("O singură propoziție, fără detalii acționabile, care spune ce e documentul"),
  summary: z.string().describe("Explicație pe înțeles, 3-6 propoziții, ca pentru un prieten"),
  amount: z
    .string()
    .nullable()
    .describe("Suma de plată/cerută cu moneda, sau null dacă nu există"),
  deadline: z
    .object({
      date: z.string().nullable().describe("Data limită ISO YYYY-MM-DD dacă se poate calcula"),
      description: z.string().describe("Explicația termenului, ex: 15 zile de la comunicare"),
    })
    .nullable(),
  steps: z.array(z.string()).describe("Pași concreți de urmat, în ordine"),
  consequences: z.string().describe("Ce se întâmplă dacă persoana nu face nimic"),
  whereToFile: z
    .string()
    .nullable()
    .describe("Unde/cum se depune răspunsul sau plata (online, ghișeu, poștă)"),
  canContest: z.boolean().describe("Dacă documentul poate fi contestat sau i se poate răspunde"),
  contestHint: z
    .string()
    .nullable()
    .describe("Pe scurt, pe ce motive s-ar putea contesta, dacă e cazul"),
  replyLanguage: z.string().describe("Limba în care trebuie scris un răspuns către emitent"),
  facts: z
    .string()
    .describe(
      "Faptele esențiale din document (numere de dosar, date, sume, emitent, adresa emitentului) " +
        "necesare pentru a redacta ulterior un răspuns. Maschează CNP, IBAN și numele persoanei fizice."
    ),
});

export type Analysis = z.infer<typeof analysisSchema>;

// Schema for the reply/contestation draft generated on demand.
export const draftSchema = z.object({
  title: z.string().describe("Titlul documentului, ex: Plângere contravențională"),
  body: z.string().describe("Textul complet în limba destinatarului, cu [PLACEHOLDER] pentru datele personale"),
  bodyRo: z.string().describe("Traducerea în română a textului (identic dacă e deja în română)"),
  instructions: z.string().describe("Cum și unde se trimite, ce acte se atașează"),
});

export type Draft = z.infer<typeof draftSchema>;

// Fields shown for free, before payment.
export type Preview = Pick<
  Analysis,
  "isOfficialDocument" | "country" | "language" | "docType" | "issuer" | "urgency" | "teaser" | "canContest"
> & { hasDeadline: boolean; hasAmount: boolean };

/** Reduces a full analysis to the free preview fields. */
export function toPreview(a: Analysis): Preview {
  return {
    isOfficialDocument: a.isOfficialDocument,
    country: a.country,
    language: a.language,
    docType: a.docType,
    issuer: a.issuer,
    urgency: a.urgency,
    teaser: a.teaser,
    canContest: a.canContest,
    hasDeadline: a.deadline !== null,
    hasAmount: a.amount !== null,
  };
}
