# Lămurit: costuri, prețuri și unde adaugi bani

Prețuri verificate pe 20.10.2026. Cursuri presupuse: **1 $ ≈ 4,6 lei** și **1 € ≈ 5,0 lei**. Verifică-le pe bnr.ro.

## Unde adaugi bani (AI Gateway)

- **Încarci credite:** https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dtop-up
  Mai lung: Vercel → **AI Gateway** → butonul cu soldul (dreapta sus) → alegi suma → **Continue to Payment**.
- **Vezi soldul:** https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai-gateway
- **Vezi fiecare cerere și cât a costat:** Vercel → AI Gateway → **Logs**.

### Reîncărcarea automată (auto top-up) rămâne OPRITĂ

- E **dezactivată implicit**. Nu apăsa **Change** lângă „auto top-up” din dialogul de sold.
- Când soldul ajunge la 0, AI Gateway refuză cererile (eroare 402). **Nu te taxează automat.**
- Aplicația tratează situația asta: utilizatorul primește „încearcă mai târziu” și **nu pierde creditul**, pentru că îl scădem doar după o analiză reușită.

## Plafoane de cheltuieli (deja setate)

| Unde | Limită | Ce se întâmplă la limită |
|---|---|---|
| Soldul AI Gateway | cât încarci (ex. $10) | cererile AI sunt refuzate, fără taxare automată |
| Bugetul AI Gateway (echipă) | **$10 / lună** | cererile sunt refuzate până pe 1 ale lunii următoare |
| Aplicație: previzualizări gratuite | **$1 / zi** (`FREE_DAILY_USD`) | previzualizările gratuite se opresc până a doua zi |
| Aplicație: total AI | **$3 / zi** (`TOTAL_DAILY_USD`) | totul se oprește până a doua zi, iar creditele clienților rămân neatinse |
| Aplicație: per vizitator | 3 previzualizări gratuite / zi | după a treia: „cumpără un pachet sau revino mâine” |

- **Bugetul AI Gateway** e o limită „soft”: cererea care trece pragul se termină, apoi restul sunt refuzate. Îl vezi cu `npx vercel ai-gateway budgets list`.
- **Plafoanele din aplicație** se schimbă din Vercel → proiectul `lamurit` → Settings → Environment Variables (`FREE_DAILY_USD`, `TOTAL_DAILY_USD`), urmat de redeploy.

## Cât costă un client (cazul cel mai rău)

### Modele AI (prețuri din AI Gateway, fără adaos)

Calculăm cu prețul regional UE (+10%), ca estimarea să fie mereu acoperitoare.

| Pas | Model | Preț intrare / ieșire (per 1M tokeni) | Cost tipic | Cost maxim |
|---|---|---|---|---|
| Previzualizare gratuită | Claude Haiku 5.5 | $0,11 / $0,55 | ~$0,001 | ~$0,004 |
| Explicația completă (plătită) | Claude Sonnet 5.5 | $2,20 / $11 | ~$0,05 | ~$0,19 |
| Contestație / răspuns (plătit) | Claude Sonnet 5.5 | $2,20 / $11 | ~$0,04 | ~$0,12 |

De unde vine costul maxim:
- **Intrare:** până la 5 pagini × ~4.800 tokeni + ~2.200 tokeni de instrucțiuni.
- **Ieșire:** plafonată din cod la 12.000 tokeni pentru analiză (`maxOutputTokens`, include și „gândirea” modelului), 10.000 pentru contestație și 2.000 pentru previzualizare.
- Costul maxim e o **limită superioară garantată de cod**, nu o medie.

### Stripe (cont din România)

| Card | Comision |
|---|---|
| Card din SEE (RO, IT, ES, DE, FR…) | 1,5% + 1,00 leu |
| Card din UK | 2,5% + 1,00 leu (+2% dacă e conversie valutară) |
| Card internațional | 3,15% + 1,00 leu (+2% dacă e conversie valutară) |

Plățile în € către un cont Stripe în lei pot avea **+2% conversie valutară**. Ca să o eviți, adaugă în Stripe un cont bancar în EUR.

### Marja pe vânzare (cazul cel mai rău)

| Pachet | Încasat | Stripe | AI (maxim) | **Rămâne minim** |
|---|---|---|---|---|
| 1 document, 9,99 lei | 9,99 lei | −1,15 lei | −0,87 lei | **≈ 7,97 lei** |
| 5 documente, 29 lei | 29,00 lei | −1,44 lei | −4,37 lei | **≈ 23,19 lei** |
| 1 document, 2,99 € (diaspora) | ≈ 14,95 lei | ≈ −1,52 lei (incl. 2% conversie) | −0,87 lei | **≈ 12,56 lei** |

**Previzualizările gratuite** costă cel mult $0,004 fiecare. Chiar dacă 100 de oameni se uită gratis pentru o singură vânzare, asta înseamnă ≈ 1,84 lei, deci tot rămâi pe plus.

## Costuri fixe lunare

| Serviciu | Cost | Observație |
|---|---|---|
| Vercel Hobby | $0 | **interzice uzul comercial**, deci e bun doar pentru teste |
| Vercel Pro | **$20 / lună** (≈ 92 lei) | obligatoriu înainte de plăți reale |
| Upstash Redis (Free) | $0 | 500.000 comenzi/lună; nu taxează automat dacă nu adaugi card |
| Stripe | $0 | doar comision pe tranzacție |
| Domeniu | $0 | `lamurit.gestivo.ro`, subdomeniu pe domeniul tău |

**Pragul de rentabilitate pe Pro:** ≈ 92 lei / 7,97 lei ≈ **12 documente vândute pe lună**.

### Când treci pe Vercel Pro, setează imediat Spend Management

Vercel → Settings → **Billing** → **Spend Management**:
1. Pune **On-Demand Budget** pe o sumă mică, de exemplu $5.
2. Activează **Pause Production Deployments**: dacă se depășește suma, site-ul se oprește în loc să te taxeze.
3. Notificările pe email la 50%, 75% și 100% se activează singure.

### De verificat o dată

- **Planul Upstash e „Free”:** https://vercel.com/d/dashboard/integrations/upstash/icfg_04Ao1SQMX74NP3XJn8C7ABLy/resources/store_mtifSnBUz1AgoUwx
- **Stripe e încă în modul test (sandbox).** Pentru bani reali rulezi `npx vercel integration resource claim lamurit-stripe`, apoi completezi datele firmei sau ale PFA-ului și IBAN-ul.
