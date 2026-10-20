"use client";

/** Opens the browser print dialog so the user can save the report as PDF. */
export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-xl border-2 border-ink px-5 py-3 font-semibold hover:bg-ink/5"
    >
      🖨️ Salvează ca PDF
    </button>
  );
}
