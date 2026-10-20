import type { UploadedFile } from "./ai";

const MAX_FILES = 5;
const MAX_TOTAL_BYTES = 4.4 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/** Validates the uploaded pages from a multipart form; returns them or a Romanian error message. */
export async function readUploadedFiles(form: FormData): Promise<UploadedFile[] | { error: string; status: number }> {
  const entries = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!entries.length || entries.length > MAX_FILES) {
    return { error: `Trimite între 1 și ${MAX_FILES} pagini.`, status: 400 };
  }
  if (entries.some((f) => !ALLOWED.includes(f.type))) {
    return { error: "Acceptăm doar poze (JPG, PNG, WEBP) și PDF.", status: 400 };
  }
  if (entries.reduce((s, f) => s + f.size, 0) > MAX_TOTAL_BYTES) {
    return { error: "Fișierele sunt prea mari. Încearcă mai puține pagini.", status: 413 };
  }
  return Promise.all(
    entries.map(async (f) => ({ data: new Uint8Array(await f.arrayBuffer()), mediaType: f.type }))
  );
}
