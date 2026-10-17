# Panoul de pomeniri (admin.presidentfunerare.ro)

Panou intern în care echipa trece persoanele decedate și clienții (familiile). Sistemul calculează singur pomenile și trimite SMS-uri de amintire prin SMSLink.

- **Pomenile calculate:** a 40-a zi (ziua decesului e ziua 1), apoi la 3, 6 și 9 luni și la 1 an. Din Setări se pot adăuga și pomenile anuale, până la 10 ani.
- **Când pleacă SMS-ul:** implicit cu 7 zile înainte de pomană. Verificarea rulează din oră în oră, între 10:00 și 19:00, ora României.
- **Text implicit (se schimbă din Setări):**
  `President Funerare: Pomenirea de 40 de zile pentru Toma Maria cade pe 29.10. Va ajutam cu tot ce e nevoie pentru pomana. Tel 0784005555`
- **Conturi:** fiecare om are utilizator și parolă. Administratorii creează conturile din panou. Sesiunea ține 30 de zile și se prelungește singură cât timp contul e folosit.

Tot proiectul e un singur Cloudflare Worker, cu baza de date D1. Rulează pe planul gratuit Cloudflare și nu atinge site-ul principal: build-ul site-ului ignoră folderul `admin/`.

## Instalare (o singură dată)

Ai nevoie de Node.js 20+ și de contul Cloudflare în care e domeniul presidentfunerare.ro. Toate comenzile se dau din folderul `admin/`.

### 1. Contul SMSLink

1. Creează cont pe smslink.ro și cumpără un pachet. Minimul e 100 SMS, la 4,9 EUR + TVA.
2. Mergi la **SMS Gateway → Configurare și setări** și creează o conexiune nouă.
3. Notează **Connection ID** și **parola** conexiunii.
4. Pentru numere din străinătate (ex. +1 ...), verifică în cont că trimiterea internațională e activă. Un SMS internațional costă mai mult.

### 2. Baza de date

```bash
npm install
npx wrangler login
npx wrangler d1 create president-admin
```

Comanda afișează un `database_id`. Copiază-l în `wrangler.jsonc`, în locul lui `00000000-0000-0000-0000-000000000000`, apoi creează tabelele:

```bash
npm run db:remote
```

### 3. Publicarea și secretele

```bash
npm run deploy
```

Comanda creează automat subdomeniul **admin.presidentfunerare.ro**, cu DNS și certificat HTTPS.

Apoi setează secretele. Fiecare comandă îți cere valoarea:

```bash
npx wrangler secret put SESSION_SECRET          # un șir lung aleator, de ex. rezultatul comenzii: openssl rand -base64 32
npx wrangler secret put ADMIN_USER              # utilizatorul primului administrator, ex. admin
npx wrangler secret put ADMIN_PASSWORD          # parola lui (cel puțin 8 caractere)
npx wrangler secret put SMSLINK_CONNECTION_ID
npx wrangler secret put SMSLINK_PASSWORD
```

Nu schimba `SESSION_SECRET` după ce panoul e folosit, pentru că toată lumea ar fi scoasă din cont.

### 4. Prima intrare

1. Intră pe https://admin.presidentfunerare.ro cu `ADMIN_USER` și `ADMIN_PASSWORD`. La prima logare se creează contul de administrator.
2. După asta, `ADMIN_PASSWORD` nu mai e folosit. Îl poți șterge cu `npx wrangler secret delete ADMIN_PASSWORD`.
3. Din **Setări → Conturi de acces**, creează conturile pentru restul echipei:
   - **Operator:** adaugă persoane și vede SMS-urile.
   - **Administrator:** pe lângă asta, schimbă setările și conturile.
4. Din **Persoane → Import din Excel**, adaugă foile existente.
5. Din **Setări**, trimite un **SMS de test** pe numărul tău.
6. Pornește **Trimite SMS-urile automat** și salvează. SMS-urile sunt **oprite** până atunci, ca să poți verifica lista înainte să plece ceva.

## Actualizări

După orice modificare de cod:

```bash
npm run deploy
```

Dacă apare un fișier nou în `migrations/`, rulează înainte `npm run db:remote`.

## Rulare locală

```bash
cp .dev.vars.example .dev.vars   # SMS_MOCK=1: SMS-urile doar se simulează
npm run db:local
npm run dev                      # http://localhost:8787, utilizator admin / parola-locala-123
```

Cronul local se poate declanșa cu `curl "http://localhost:8787/__scheduled?cron=0+*+*+*+*"`.

## Limite și costuri

- **Cloudflare (gratuit):**
  - 100.000 de cereri pe zi;
  - D1 permite 5 milioane de rânduri citite și 100.000 de rânduri scrise pe zi;
  - 500 MB per bază de date, adică cu mult peste nevoie.
- **SMS:** ~0,049 EUR + TVA per SMS. Diacriticele se scot automat, ca un mesaj să rămână la 160 de caractere, adică un singur SMS.
- **Același număr de telefon:** primește cel mult un SMS pe oră. Operatorii blochează mesajele repetate către același număr la câteva minute distanță.
- **Pomeni stocate:** sistemul păstrează doar pomenile viitoare. O persoană decedată acum mai mult de un an nu mai are pomeni de trimis, decât dacă pornești pomenile anuale.

## Date personale

Listele cu persoane și telefoane (CSV, foi scanate) **nu se pun pe GitHub**. `.gitignore` exclude deja folderul `date/` și fișierele `.csv`. Pentru o copie de siguranță, descarcă lista din panou: **Persoane → Descarcă toată lista**.

## Structura

```
admin/
├── wrangler.jsonc        configurarea Worker-ului (domeniu, D1, cron)
├── migrations/           structura bazei de date
├── src/
│   ├── index.js          API-ul (/api/...) și cronul
│   ├── pomeni.js         calculul pomenilor, telefoane, textul SMS
│   ├── sms.js            trimiterea prin SMSLink
│   ├── auth.js           conturi, parole, sesiuni
│   └── setari.js
└── public/               interfața (HTML, CSS, JS fără framework)
```
