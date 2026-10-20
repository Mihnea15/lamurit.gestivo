import Uploader from "@/components/Uploader";

const EXAMPLES = [
  { icon: "🏛️", title: "ANAF", text: "Decizie de impunere, somație, notificare în SPV" },
  { icon: "🚓", title: "Amenzi", text: "Proces-verbal, multa autovelox Italia, Bußgeldbescheid" },
  { icon: "⚖️", title: "Executor / recuperări", text: "Somație de plată, poprire, scrisori de la firme de colectare" },
  { icon: "🏠", title: "Chirie & utilități", text: "Contract de închiriere, facturi de regularizare, asociația de proprietari" },
  { icon: "🇮🇹🇪🇸🇩🇪", title: "Diaspora", text: "Agenzia delle Entrate, Hacienda, Finanzamt, Jobcenter, HMRC, council tax" },
  { icon: "🏦", title: "Bancă", text: "Notificări de restanță, modificări de contract, scrisori de reziliere" },
];

const STEPS = [
  ["1", "Faci o poză", "Sau urci PDF-ul. Merge și cu poze strâmbe."],
  ["2", "Vezi gratuit ce e", "Tipul documentului și cât de urgent este."],
  ["3", "Primești explicația completă", "Pe înțeles: ce vor, cât, până când, ce faci pas cu pas."],
];

/** Landing page: hero with upload, use cases and how it works. */
export default function Home() {
  return (
    <>
      <section className="pt-6 sm:pt-12">
        <p className="mb-3 inline-block -rotate-1 rounded border-2 border-brass px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-brass">
          Răspuns în 20 de secunde
        </p>
        <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
          Ai primit o hârtie și nu înțelegi ce vrea de la tine?
        </h1>
        <p className="mt-4 text-lg text-ink/80">
          Fă-i o poză. Îți spunem pe românește <strong>ce înseamnă</strong>, <strong>ce trebuie să faci</strong> și{" "}
          <strong>până când</strong>, fie că e de la ANAF sau de la Finanzamt.
        </p>
        <div className="mt-8">
          <Uploader />
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-bold">Cum funcționează</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          {STEPS.map(([n, title, text]) => (
            <li key={n} className="rounded-xl bg-raised p-4">
              <span className="font-display text-3xl font-bold text-brass">{n}</span>
              <h3 className="mt-1 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-ink/70">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-bold">Ce putem lămuri</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {EXAMPLES.map((e) => (
            <div key={e.title} className="flex gap-3 rounded-xl border border-ink/10 bg-raised p-4">
              <span className="text-2xl" aria-hidden>
                {e.icon}
              </span>
              <div>
                <h3 className="font-semibold">{e.title}</h3>
                <p className="text-sm text-ink/70">{e.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-2xl bg-ink p-6 text-paper sm:p-8">
        <h2 className="font-display text-2xl font-bold">Cât costă?</h2>
        <p className="mt-2 text-paper/80">
          Vezi gratuit ce fel de document e și cât de urgent este. Explicația completă costă cât o cafea.
          Fără abonament, plătești doar când ai nevoie.
        </p>
        <ul className="mt-4 space-y-1 text-paper/90">
          <li>• 1 document: 9,99 lei / 2,99 €</li>
          <li>• Pachet de 5 documente: 29 lei / 7,99 €</li>
          <li>• Răspuns sau contestație redactată: +2 credite</li>
        </ul>
      </section>
    </>
  );
}
