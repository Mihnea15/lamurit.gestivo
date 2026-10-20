export const metadata = { title: "Termeni — Lămurit" };

/** Terms of use page. */
export default function Terms() {
  return (
    <article className="prose-sm max-w-none space-y-4 pt-6 leading-relaxed">
      <h1 className="font-display text-3xl font-bold">Termeni și condiții</h1>
      <p>
        Serviciul Lămurit este operat de <strong>[DENUMIRE OPERATOR, CUI, ADRESĂ]</strong>. Prin folosirea
        site-ului accepți termenii de mai jos.
      </p>
      <h2 className="font-display text-xl font-bold">1. Ce oferim</h2>
      <p>
        Explicații informative, generate automat cu inteligență artificială, ale documentelor pe care le încarci,
        precum și ciorne de răspuns. Explicațiile pot conține erori. Nu reprezintă consultanță juridică, fiscală sau
        de altă natură și nu creează o relație avocat–client. Verifică întotdeauna informațiile în documentul original
        și, pentru situații importante, consultă un specialist.
      </p>
      <h2 className="font-display text-xl font-bold">2. Credite și plăți</h2>
      <p>
        Explicația completă și ciornele de răspuns se plătesc cu credite cumpărate prin Stripe. Creditele nu expiră și
        sunt asociate browserului de pe care le-ai cumpărat. Dacă o analiză eșuează din vina noastră, creditul îți este
        returnat. Pentru rambursări scrie-ne la <strong>[EMAIL CONTACT]</strong>.
      </p>
      <h2 className="font-display text-xl font-bold">3. Dreptul de retragere</h2>
      <p>
        Fiind un conținut digital furnizat imediat, la cererea ta expresă, îți pierzi dreptul de retragere de 14 zile
        din momentul în care explicația este afișată (art. 16 lit. m din Directiva 2011/83/UE, OUG 34/2014).
      </p>
      <h2 className="font-display text-xl font-bold">4. Utilizare corectă</h2>
      <p>Nu încărca documente ale altor persoane fără acordul lor și nu folosi serviciul în scopuri ilegale.</p>
      <h2 className="font-display text-xl font-bold">5. Răspundere</h2>
      <p>
        În limita permisă de lege, răspunderea noastră se limitează la valoarea creditelor plătite pentru documentul în
        cauză.
      </p>
    </article>
  );
}
