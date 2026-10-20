@AGENTS.md

# Lămurit: context esențial pentru Claude

Vorbește cu utilizatorul **în română**. Codul și comentariile din cod sunt în engleză, cu un comentariu pe fiecare funcție.

## Ce e produsul

**Lămurit** („un serviciu Gestivo”) este o aplicație web/PWA. Utilizatorul face o poză sau urcă un PDF cu un document oficial și primește în română:
- ce înseamnă documentul;
- termenul limită și suma;
- pașii de urmat și ce riscă dacă nu face nimic;
- opțional, contestația sau răspunsul redactat **în limba instituției**, cu traducere.

Documentele acceptate:
- **România:** ANAF, amenzi, executori, bănci, chirii, utilități;
- **diaspora:** IT, ES, DE, UK, FR (Agenzia Entrate, multe, Hacienda, Finanzamt, HMRC…).

Obiectivul utilizatorului e venit rapid, cu cost minim. Ținta de validare: **100 de analize și 20 de plăți în primele 14 zile**. Dacă nu se atinge, facem pivot pe nișa care convertește cel mai bine (doar amenzi sau doar ANAF/PFA).

**Decizii luate (nu le relua fără motiv):**
- Web/PWA întâi. Google Play prin TWA vine abia după validare (acolo plățile digitale trec obligatoriu prin Play Billing, cu comision de 15%).
- Piața: România + diaspora.
- Fără conturi de utilizator: un portofel anonim într-un cookie.
- Claude prin Vercel AI Gateway. Nu folosim modele gratuite sau chinezești: documentele conțin CNP-uri (risc GDPR), iar calitatea e chiar produsul.
- Design identic cu www.gestivo.ro. Recomandarea Gestivo apare doar pe documente de firmă sau PFA (`preview.isBusiness`).

## Arhitectură (Next.js 16 App Router, `cacheComponents: true`)

**Fluxul în 2 etape**, gândit ca să nu pierdem bani:
1. `POST /api/analyze`: **previzualizare gratuită** cu `anthropic/claude-haiku-5.5` (`previewSchema`). Salvează doar rezultatul în Redis, cu TTL de 24h. Paginile rămân **doar în browserul utilizatorului** (IndexedDB, `lib/localFiles.ts`).
2. `POST /api/unlock` (multipart: `id` + `files`): **analiza completă** cu `anthropic/claude-sonnet-5.5`. Creditul se scade **după** o analiză reușită (`spendCredits` e atomic, cu Lua).
3. `POST /api/draft`: contestația, generată din `analysis.facts` (CNP-ul e mascat, documentul original nu mai există). Costă 2 credite, scăzute doar dacă generarea reușește.
- Plata: `POST /api/checkout` creează o sesiune Stripe Checkout cu `price_data` (fără produse în catalog). `POST /api/stripe/webhook` verifică semnătura și adaugă creditele **o singură dată** (`grantCreditsOnce`). Livrarea se face **doar din webhook**, niciodată de pe pagina de succes.
- Alte rute:
  - `GET /api/credits`: interogat după întoarcerea din Stripe, ca să vedem când a ajuns creditul;
  - `GET /api/ics/[id]`: termenul limită ca eveniment de calendar.

**Fișiere cheie:**
- `lib/ai.ts`: apelurile AI, cu `maxOutputTokens` care plafonează costul;
- `lib/schema.ts`: schemele Zod;
- `lib/prompts.ts`: prompturile, cu context specific pe țări;
- `lib/budget.ts`: prețurile modelelor și plafoanele zilnice;
- `lib/store.ts`: Upstash Redis, credite, lock-uri;
- `lib/pricing.ts`: pachetele (lei pentru RO/MD, € în rest, după `x-vercel-ip-country`);
- `lib/wallet.ts`: cookie-ul httpOnly `lamurit_wallet`;
- `app/analiza/[id]/page.tsx`: raportul. Accesul la date runtime stă în `<Suspense>`, cerință a Cache Components.
- Interfața:
  - `components/Uploader.tsx`: comprimă pozele la 2000px JPEG;
  - `Paywall.tsx`: retrimite paginile din IndexedDB, sau cere reîncărcarea dacă lipsesc;
  - `DraftSection.tsx`;
  - `GestivoCta.tsx`.
- Tema: `app/globals.css` (tokenii Gestivo: IBM Plex, alamă, mod întunecat cu `prefers-color-scheme` și `data-theme`). Clase Tailwind: `bg-paper`, `bg-raised`, `text-ink`, `text-muted`, `text-brass`, `bg-brass-fill text-on-brass`, `text-alert`, `bg-alert-fill text-on-alert`, `text-ok`, `text-warn`.

## Reguli care nu se încalcă

- **Nu stoca niciodată documentul original pe server**, nici în loguri. În loguri scriem doar `e.message`.
- **Niciun cost AI fără plafon.** Orice apel nou are `maxOutputTokens`, `recordSpend(...)` și o verificare `withinBudget(...)` înainte.
- **Clientul nu plătește pentru erori.** Scădem creditul doar după succes, sub `withLock("wallet:<id>")`.
- **ID-urile de model din AI Gateway au punct** (`claude-sonnet-5.5`), nu cratimă. Verifică-le cu `curl https://ai-gateway.vercel.sh/v1/models`.
- **Stripe:** nu trimite `payment_method_types` și pune mereu `integration_identifier`. Ghidurile Stripe și Upstash sunt în `.agents/skills/`.
- **Nu reîncărca automat creditele AI Gateway (auto top-up).** Utilizatorul a cerut explicit asta.
- **`www.gestivo.ro` și `gestivo.ro` găzduiesc alt produs al utilizatorului** (Gestivo, pe Vercel, cu DNS în Cloudflare). Nu le repoint-a niciodată. Lămurit stă pe subdomeniul `lamurit.gestivo.ro`.

## Infrastructură

- **Vercel:** proiectul `lamurit`, pe echipa `mihneagatejgb-4694s-projects`, plan **Hobby**. Hobby interzice uzul comercial, deci trebuie trecut pe Pro înainte de bani reali, cu Spend Management și „Pause Production Deployments”.
- **Domeniu:** `lamurit.gestivo.ro`, prin CNAME în Cloudflare, cu proxy oprit („DNS only”). Merge și `lamurit.vercel.app`.
- **Marketplace:**
  - `lamurit-kv`: Upstash Redis, cu variabilele `KV_REST_API_URL` / `KV_REST_API_TOKEN`;
  - `lamurit-stripe`: Stripe **în sandbox**, activat cu `vercel integration resource claim lamurit-stripe`.
- **Webhook Stripe în producție:** `https://lamurit.gestivo.ro/api/stripe/webhook`. `STRIPE_WEBHOOK_SECRET` e setat doar pentru Production. Local, secretul vine din `stripe listen` și stă în `.env.local`.
- **AI Gateway:** autentificare prin OIDC, fără cheie API. Bugetul echipei e de **$10/lună**. Planul gratuit **nu dă acces la modelele Claude**, deci trebuie credite plătite.
- **Plafoane din aplicație**, setate prin variabile de mediu: `FREE_DAILY_USD` (implicit 1) și `TOTAL_DAILY_USD` (implicit 3).
- **GitHub:** `Mihnea15/lamurit.gestivo`, branch `main`. Deploy-ul automat la push **nu e legat** încă; aplicația Vercel de pe GitHub n-are acces la repo. Deploy manual: `npx vercel deploy --prod`.
- **Prețuri, marje și linkul de reîncărcare:** `COSTURI.md`.

## Comenzi

```bash
npm run dev                      # local (env din .env.local: npx vercel env pull)
npx tsc --noEmit && npm run lint # verificare
npm run build                    # build de producție
npx vercel deploy --prod         # deploy
npx vercel logs -e production --since 10m --json   # erori din producție
npx vercel ai-gateway budgets list                 # buget AI
```

Testarea locală a plăților:
```bash
npx @stripe/cli listen --api-key <STRIPE_SECRET_KEY> --forward-to localhost:3000/api/stripe/webhook
npx @stripe/cli trigger checkout.session.completed --api-key <KEY> \
  --override checkout_session:metadata.wallet=<wallet> --override checkout_session:metadata.credits=1
```

Pe un PC nou:
```bash
npm install
npx skills experimental_install   # reface .claude/skills din skills-lock.json
npx vercel login
npx vercel link --project lamurit
npx vercel env pull
```

## Stare (20.10.2026) și pași următori

1. **Blocant:** utilizatorul încarcă $10 în AI Gateway (link în `COSTURI.md`). Apoi testăm previzualizarea și analiza pe documente reale din RO, IT, ES, DE și UK. Verificăm termenele, sumele și limba draftului, apoi ajustăm promptul.
2. Utilizatorul completează datele legale (`[DENUMIRE OPERATOR, CUI, …]`) în `app/termeni` și `app/confidentialitate`.
3. Înainte de plăți reale: Vercel Pro + Spend Management, activarea contului Stripe, IBAN, eventual un cont în EUR (ca să evite 2% conversie).
4. Go-to-market:
   - 10 exemple anonimizate pe landing;
   - TikTok/Reels zilnic;
   - grupuri de Facebook din RO și diaspora;
   - pagini SEO pe tip de document și țară.
5. Mai târziu:
   - recuperarea creditelor pe email (acum creditele sunt legate de browser);
   - Google Play prin TWA;
   - Vercel BotID, dacă apare abuz.
