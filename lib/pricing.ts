export type Currency = "ron" | "eur";
export type PackId = "single" | "five";

// Credit packs; amounts are in the smallest currency unit (bani / cents).
export const PACKS: Record<PackId, { credits: number; label: string; price: Record<Currency, number> }> = {
  single: { credits: 1, label: "1 document", price: { ron: 999, eur: 299 } },
  five: { credits: 5, label: "5 documente", price: { ron: 2900, eur: 799 } },
};

// Credits charged for each paid action.
export const COST = { report: 1, draft: 2 } as const;

/** Picks the display/charge currency from the visitor's country (Vercel geo header). */
export function currencyFor(country: string | null): Currency {
  return country === "RO" || country === "MD" ? "ron" : "eur";
}

/** Formats a price in minor units for display, ex: 9,99 lei or 2,99 €. */
export function formatPrice(minor: number, currency: Currency): string {
  const value = (minor / 100).toFixed(2).replace(".", ",");
  return currency === "ron" ? `${value} lei` : `${value} €`;
}
