export const metadata = { title: "Confidențialitate — Lămurit" };

/** Privacy policy page (GDPR). */
export default function Privacy() {
  return (
    <article className="max-w-none space-y-4 pt-6 leading-relaxed">
      <h1 className="font-display text-3xl font-bold">Politica de confidențialitate</h1>
      <p>
        Operator: <strong>[DENUMIRE OPERATOR, CUI, ADRESĂ, EMAIL]</strong>.
      </p>
      <h2 className="font-display text-xl font-bold">Ce facem cu documentul tău</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Documentul (poza sau PDF-ul) este procesat doar în memorie și <strong>nu este salvat</strong>.</li>
        <li>
          Păstrăm doar rezultatul explicației, cu CNP-ul, IBAN-ul și numele tău mascate, timp de maximum
          <strong> 24 de ore</strong>, apoi este șters automat.
        </li>
        <li>Nu folosim documentele pentru antrenarea modelelor AI și nu le vindem nimănui.</li>
      </ul>
      <h2 className="font-display text-xl font-bold">Ce alte date prelucrăm</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Un identificator anonim într-un cookie strict necesar, ca să știm câte credite ai.</li>
        <li>Adresa IP, pentru limitarea abuzurilor (păstrată maximum 24 de ore).</li>
        <li>Datele de plată sunt procesate exclusiv de Stripe; noi nu vedem datele cardului.</li>
      </ul>
      <h2 className="font-display text-xl font-bold">Persoane împuternicite</h2>
      <p>
        Vercel (găzduire), Anthropic prin Vercel AI Gateway (analiza AI), Upstash (stocare temporară), Stripe (plăți).
        Unele pot prelucra date în afara SEE, pe baza clauzelor contractuale standard.
      </p>
      <h2 className="font-display text-xl font-bold">Drepturile tale</h2>
      <p>
        Ai dreptul de acces, rectificare, ștergere, restricționare, opoziție și portabilitate, precum și dreptul de a
        depune plângere la ANSPDCP (dataprotection.ro). Scrie-ne la <strong>[EMAIL CONTACT]</strong>.
      </p>
    </article>
  );
}
