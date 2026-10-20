import { z } from "zod";

// Cheap first pass (free): what the document is and how urgent, nothing actionable.
export const previewSchema = z.object({
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
    .describe("O singură propoziție, fără termene, sume sau pași, care spune ce e documentul"),
  hasDeadline: z.boolean().describe("Dacă documentul conține un termen"),
  hasAmount: z.boolean().describe("Dacă documentul cere o sumă de bani"),
  canContest: z.boolean().describe("Dacă documentul poate fi contestat sau i se poate răspunde"),
  isBusiness: z
    .boolean()
    .describe(
      "true dacă documentul privește o firmă, un PFA sau activitatea comercială a cuiva " +
        "(facturi, e-Factura, TVA, obligații fiscale ale firmei, clienți care nu plătesc, contracte comerciale)"
    ),
});

export type Preview = z.infer<typeof previewSchema>;

// Full paid analysis.
export const analysisSchema = z.object({
  country: previewSchema.shape.country,
  docType: previewSchema.shape.docType,
  issuer: previewSchema.shape.issuer,
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
