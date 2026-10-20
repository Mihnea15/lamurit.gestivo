import { gestivoUrl } from "@/lib/gestivo";

/** Gestivo cross-sell shown only on business-related documents. */
export default function GestivoCta() {
  return (
    <section className="no-print mt-4 rounded-2xl border border-brass/40 bg-brass/10 p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-brass">Pentru firme și PFA</p>
      <h2 className="mt-1 font-display text-xl font-bold">Data viitoare, ține totul sub control cu Gestivo</h2>
      <p className="mt-2 text-muted">
        Multe hârtii de felul ăsta vin din facturi, termene sau încasări scăpate din vedere. Gestivo îți ține
        ofertele, contractele, facturile conforme cu e-Factura și încasările într-un singur loc, ca să vezi
        din timp ce ai de făcut.
      </p>
      <a
        href={gestivoUrl("report")}
        className="mt-4 inline-block rounded-xl bg-brass-fill px-5 py-3 font-semibold text-on-brass hover:brightness-110"
      >
        Descoperă Gestivo →
      </a>
    </section>
  );
}
