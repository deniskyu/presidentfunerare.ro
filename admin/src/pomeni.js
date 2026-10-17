// Logica de calcul pentru pomeni, numere de telefon și textul SMS-ului.

export const FUS_ORAR = 'Europe/Bucharest';

export const SETARI_IMPLICITE = {
  sms_pornit: '0', // pornit din panou după ce verificați lista
  zile_inainte: '7',
  ani_max: '1',
  mesaj:
    'President Funerare: Pomenirea de {pomana} pentru {nume} cade pe {data}. ' +
    'Va ajutam cu tot ce e nevoie pentru pomana. Tel 0784005555',
};

// ---------- Date calendaristice ----------

/** Data de azi în România, AAAA-LL-ZZ */
export function aziRO(acum = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FUS_ORAR,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(acum);
}

export function adaugaZile(iso, n) {
  const [a, l, z] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, l - 1, z + n)).toISOString().slice(0, 10);
}

export function esteDataValida(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [a, l, z] = iso.split('-').map(Number);
  const d = new Date(Date.UTC(a, l - 1, z));
  return d.getUTCFullYear() === a && d.getUTCMonth() === l - 1 && d.getUTCDate() === z;
}

// ---------- Tipurile de pomeni ----------
// Ziua decesului se socotește ziua 1, deci a 40-a zi = data decesului + 39 de zile.
// Pomenile la luni și ani cad în aceeași zi a lunii (sau ultima zi, dacă luna e mai scurtă).

export function tipuriPomeni(aniMax) {
  const tipuri = [
    { tip: '40z', zile: 39 },
    { tip: '3l', luni: 3 },
    { tip: '6l', luni: 6 },
    { tip: '9l', luni: 9 },
  ];
  for (let an = 1; an <= aniMax; an++) tipuri.push({ tip: `${an}a`, luni: 12 * an });
  return tipuri;
}

export function etichetaPomana(tip) {
  const n = parseInt(tip, 10);
  if (tip.endsWith('z')) return `${n} de zile`;
  if (tip.endsWith('l')) return `${n} luni`;
  if (tip.endsWith('a')) return n === 1 ? '1 an' : n < 20 ? `${n} ani` : `${n} de ani`;
  return tip;
}

/**
 * O singură instrucțiune care creează pomenile viitoare (de azi încolo) pentru
 * persoanele selectate de `unde` (tabelul are aliasul d; parametrii se scriu ?3, ?4, ...).
 * Pomenile existente nu se dublează (UNIQUE decedat_id + tip).
 */
export function instructiuneGenerarePomeni(db, aniMax, azi, unde, parametri = []) {
  return db
    .prepare(
      `INSERT OR IGNORE INTO pomeni (decedat_id, tip, data_pomana)
       SELECT decedat_id, tip, data_pomana FROM (
         SELECT d.id AS decedat_id, t.value ->> 'tip' AS tip,
           CASE
             WHEN t.value ->> 'zile' IS NOT NULL
               THEN date(d.data_deces, '+' || (t.value ->> 'zile') || ' days')
             WHEN strftime('%d', date(d.data_deces, '+' || (t.value ->> 'luni') || ' months')) = strftime('%d', d.data_deces)
               THEN date(d.data_deces, '+' || (t.value ->> 'luni') || ' months')
             ELSE date(d.data_deces, 'start of month', '+' || ((t.value ->> 'luni') + 1) || ' months', '-1 day')
           END AS data_pomana
         FROM decedati d, json_each(?2) AS t
         WHERE (${unde})
       ) WHERE data_pomana >= ?1`,
    )
    .bind(azi, JSON.stringify(tipuriPomeni(aniMax)), ...parametri);
}

// ---------- Telefon ----------

export function normalizeazaTelefon(brut) {
  let s = String(brut ?? '').trim().replace(/[\s\-./()]/g, '');
  if (!s) return { eroare: 'Lipsește numărul de telefon.' };
  if (s.startsWith('+')) s = '00' + s.slice(1);
  if (!/^\d+$/.test(s)) return { eroare: 'Numărul de telefon conține caractere nepermise.' };
  if (s.startsWith('0040')) s = '0' + s.slice(4);
  else if (s.startsWith('40') && s.length === 11) s = '0' + s.slice(2);
  else if (s.startsWith('7') && s.length === 9) s = '0' + s;
  if (/^0[23]\d{8}$/.test(s)) return { eroare: 'Este un număr de telefon fix. SMS-ul ajunge doar pe mobil.' };
  if (/^07\d{8}$/.test(s)) return { telefon: s, international: false };
  if (/^00[1-9]\d{6,14}$/.test(s) && !s.startsWith('0040')) return { telefon: s, international: true };
  return { eroare: 'Număr de telefon nevalid. Exemplu: 0722 123 456 sau +1 954 918 1614.' };
}

// ---------- Nume și text SMS ----------

/** TOMA MARIA -> Toma Maria, MARCU C-TIN -> Marcu Constantin */
export function formateazaNume(nume) {
  let s = String(nume ?? '').replace(/\s+/g, ' ').trim();
  if (s && s === s.toUpperCase()) {
    s = s.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, sep, lit) => sep + lit.toUpperCase());
  }
  return s
    .replace(/\bC[-.]?\s?tina\b/gi, 'Constantina')
    .replace(/\bC[-.]?\s?tin\b/gi, 'Constantin');
}

/** Scoate diacriticele și ghilimelele „curbate", ca SMS-ul să rămână la 160 de caractere */
export function curataText(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[„“”″]/g, '"')
    .replace(/[‘’‚′]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

export function randeazaMesaj(sablon, { tip, nume, data_pomana }) {
  const [, luna, zi] = data_pomana.split('-');
  return curataText(
    sablon
      .replaceAll('{pomana}', etichetaPomana(tip))
      .replaceAll('{nume}', formateazaNume(nume))
      .replaceAll('{data}', `${zi}.${luna}`),
  );
}

const GSM_BAZA =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !#¤%&\'()*+,-./0123456789:;<=>?¡' +
  'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';
// SMSLink socotește aceste caractere drept 2
const GSM_DUBLU = '[]{}|^~"`\\€\n\r';

/** Câte caractere și câte SMS-uri (segmente) ocupă un mesaj */
export function analizeazaSms(text) {
  let lungime = 0;
  const nepermise = new Set();
  for (const c of text) {
    if (GSM_DUBLU.includes(c)) lungime += 2;
    else if (GSM_BAZA.includes(c)) lungime += 1;
    else nepermise.add(c);
  }
  if (nepermise.size) {
    const n = [...text].length;
    return { lungime: n, segmente: n <= 70 ? 1 : Math.ceil(n / 67), unicode: true, nepermise: [...nepermise] };
  }
  return { lungime, segmente: lungime <= 160 ? 1 : Math.ceil(lungime / 152), unicode: false, nepermise: [] };
}
