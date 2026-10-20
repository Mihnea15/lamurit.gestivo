"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveLocalFiles } from "@/lib/localFiles";

const MAX_FILES = 5;
const MAX_PDF_BYTES = 4 * 1024 * 1024;

/** Converts picked files into upload-ready pages (photos compressed to JPEG, PDFs untouched). */
export async function preparePages(files: File[]): Promise<File[]> {
  return Promise.all(
    files.map(async (f) =>
      f.type.startsWith("image/")
        ? new File([await compressImage(f)], f.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" })
        : f
    )
  );
}

/** Downscales a photo to max 2000px and re-encodes it as JPEG so uploads stay under the 4.5 MB request limit. */
async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("compress"))), "image/jpeg", 0.85)
  );
}

/** Document upload area: camera capture or file picker, then sends pages to /api/analyze. */
export default function Uploader() {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Appends newly picked files, enforcing type, count and size limits. */
  function addFiles(list: FileList | null) {
    if (!list) return;
    setError(null);
    const picked = Array.from(list).filter(
      (f) => f.type.startsWith("image/") || f.type === "application/pdf"
    );
    if (picked.some((f) => f.type === "application/pdf" && f.size > MAX_PDF_BYTES)) {
      setError("PDF-ul e prea mare (max 4 MB). Fă poze la pagini în loc.");
      return;
    }
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_FILES));
  }

  /** Compresses images and posts everything to the analysis endpoint. */
  async function submit() {
    if (!files.length) return;
    setBusy(true);
    setError(null);
    try {
      const pages = await preparePages(files);
      const form = new FormData();
      for (const p of pages) form.append("files", p, p.name);
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ceva n-a mers. Încearcă din nou.");
      // Kept on this device only, re-sent if the user pays for the full analysis.
      await saveLocalFiles(data.id, pages);
      router.push(`/analiza/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ceva n-a mers. Încearcă din nou.");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-ink/25 bg-raised p-5 shadow-sm sm:p-7">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={busy || files.length >= MAX_FILES}
          className="flex-1 rounded-xl bg-ink px-5 py-4 text-lg font-semibold text-paper transition hover:bg-ink/90 disabled:opacity-50"
        >
          📷 Fă o poză
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy || files.length >= MAX_FILES}
          className="flex-1 rounded-xl border-2 border-ink px-5 py-4 text-lg font-semibold text-ink transition hover:bg-ink/5 disabled:opacity-50"
        >
          📄 Urcă poză / PDF
        </button>
      </div>

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((f, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg bg-paper px-3 py-2 text-sm"
            >
              <span className="truncate">
                Pagina {i + 1}: {f.name}
              </span>
              <button
                type="button"
                onClick={() => setFiles(files.filter((_, j) => j !== i))}
                disabled={busy}
                className="ml-3 text-ink/60 hover:text-alert"
                aria-label="Șterge"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="mt-4 w-full rounded-xl bg-brass-fill px-5 py-4 text-lg font-bold text-on-brass shadow transition hover:brightness-110 disabled:opacity-70"
        >
          {busy ? "Citesc documentul… (~20 sec)" : `Lămurește-mă (${files.length} pagin${files.length === 1 ? "ă" : "i"})`}
        </button>
      )}

      {error && <p className="mt-3 text-sm font-medium text-alert">{error}</p>}

      <p className="mt-4 text-center text-xs text-ink/60">
        🔒 Documentul nu e salvat pe serverele noastre. Rămâne doar pe telefonul tău, 24 de ore.
      </p>
    </div>
  );
}
