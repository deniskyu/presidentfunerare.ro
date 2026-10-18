// Trimiterea SMS-urilor prin SMSLink și rularea automată (cron).

import { adaugaZile, aziRO, randeazaMesaj } from './pomeni.js';
import { citesteSetari, scrieSetare } from './setari.js';

const ENDPOINT_SMSLINK = 'https://secure.smslink.ro/sms/gateway/communicate/index.php';
const MAX_PE_RULARE = 40; // planul gratuit Cloudflare permite 50 de subcereri pe rulare
const MAX_INCERCARI = 3;

/**
 * Trimite un SMS. Întoarce { ok, raspuns }.
 * SMS_MOCK=1 (doar local) nu contactează SMSLink.
 * SMSLINK_TEST=1 cere SMSLink-ului doar să simuleze trimiterea.
 */
export async function trimiteSms(env, telefon, mesaj) {
  if (env.SMS_MOCK === '1') {
    return { ok: true, raspuns: `MESSAGE;1;Message sent (simulat local);MOCK${Date.now()}` };
  }
  if (!env.SMSLINK_CONNECTION_ID || !env.SMSLINK_PASSWORD) {
    return { ok: false, raspuns: 'Lipsesc datele SMSLink (secretele SMSLINK_CONNECTION_ID și SMSLINK_PASSWORD).' };
  }
  const corp = new URLSearchParams({
    connection_id: env.SMSLINK_CONNECTION_ID,
    password: env.SMSLINK_PASSWORD,
    to: telefon,
    message: mesaj,
  });
  if (env.SMSLINK_TEST === '1') corp.set('test', '1');
  try {
    const r = await fetch(ENDPOINT_SMSLINK, { method: 'POST', body: corp, signal: AbortSignal.timeout(15000) });
    const text = (await r.text()).trim();
    return { ok: r.ok && text.startsWith('MESSAGE;'), raspuns: text.slice(0, 500) || `HTTP ${r.status}` };
  } catch (e) {
    return { ok: false, raspuns: `Nu s-a putut contacta SMSLink: ${e.message}` };
  }
}

/** Contoarele de SMS-uri trimise (total și pe lună); doar cresc, chiar dacă se șterg persoane */
export async function numaraTrimise(db, n) {
  if (!n) return;
  await db
    .prepare(
      `INSERT INTO setari (cheie, valoare)
       SELECT value, CAST(?1 AS INTEGER) FROM json_each(?2) WHERE true
       ON CONFLICT(cheie) DO UPDATE SET valoare = CAST(valoare AS INTEGER) + CAST(?1 AS INTEGER)`,
    )
    .bind(n, JSON.stringify(['sms_trimise_total', `sms_trimise_${aziRO().slice(0, 7)}`]))
    .run();
}

/**
 * Întreabă SMSLink câte SMS-uri mai sunt în cont și salvează răspunsul.
 * Răspuns de succes: MESSAGE;2;Credit 10 SMS;10,1214353554 (prima variabilă = numărul de SMS-uri).
 */
export async function verificaCredit(env) {
  const raspuns = await creditSmsLink(env);
  const m = raspuns.match(/^MESSAGE;2;[^;]*;(\d+)/);
  const credit = { credit: m ? Number(m[1]) : null, raspuns, la: new Date().toISOString() };
  await scrieSetare(env.DB, 'credit_sms', JSON.stringify(credit));
  return credit;
}

export async function creditSmsLink(env) {
  if (env.SMS_MOCK === '1') return 'MESSAGE;2;Credit 100 SMS;100,0';
  if (!env.SMSLINK_CONNECTION_ID || !env.SMSLINK_PASSWORD) return 'Lipsesc datele SMSLink (secretele SMSLINK_CONNECTION_ID și SMSLINK_PASSWORD).';
  const url = new URL(ENDPOINT_SMSLINK);
  url.search = new URLSearchParams({
    connection_id: env.SMSLINK_CONNECTION_ID,
    password: env.SMSLINK_PASSWORD,
    mode: 'credit',
  });
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    return (await r.text()).trim().slice(0, 300);
  } catch (e) {
    return `Nu s-a putut contacta SMSLink: ${e.message}`;
  }
}

/**
 * Trimite SMS-urile pentru pomenile care intră în fereastra de N zile.
 * Un număr de telefon primește cel mult un SMS pe rulare (operatorii blochează
 * mesajele repetate către același număr în câteva minute); restul pleacă la rularea următoare.
 */
export async function ruleazaTrimiterea(env, { motiv = 'cron' } = {}) {
  const db = env.DB;
  const setari = await citesteSetari(db);
  const azi = aziRO();
  const acum = new Date().toISOString();
  const rezultat = { motiv, la: acum, trimise: 0, erori: 0, amanate: 0, oprit: false };

  // Trimiterile rămase „în curs" de peste o oră (ex. rulare întreruptă) devin erori de verificat.
  await db
    .prepare(
      `UPDATE pomeni SET status = 'eroare',
         raspuns = 'Trimiterea a fost întreruptă. Verificați în SMSLink dacă SMS-ul a plecat.'
       WHERE status = 'in_curs' AND blocat_la < ?`,
    )
    .bind(new Date(Date.now() - 3600_000).toISOString())
    .run();

  if (setari.sms_pornit !== '1') {
    rezultat.oprit = true;
    await scrieSetare(db, 'ultima_rulare', JSON.stringify(rezultat));
    return rezultat;
  }

  const limita = adaugaZile(azi, Number(setari.zile_inainte) || 7);
  const { results: candidati } = await db
    .prepare(
      `SELECT p.id, p.tip, p.data_pomana, p.incercari, d.nume, d.telefon
       FROM pomeni p JOIN decedati d ON d.id = p.decedat_id
       WHERE p.status = 'asteptare' AND d.sms_activ = 1
         AND p.data_pomana > ? AND p.data_pomana <= ?
       ORDER BY p.data_pomana, p.id
       LIMIT ${MAX_PE_RULARE}`,
    )
    .bind(azi, limita)
    .all();

  if (!candidati.length) {
    await scrieSetare(db, 'ultima_rulare', JSON.stringify(rezultat));
    return rezultat;
  }

  // Numere care au primit SMS în ultimele 10 minute
  const { results: recente } = await db
    .prepare(
      `SELECT DISTINCT d.telefon FROM pomeni p JOIN decedati d ON d.id = p.decedat_id
       WHERE p.status IN ('trimis', 'in_curs') AND COALESCE(p.trimis_la, p.blocat_la) > ?`,
    )
    .bind(new Date(Date.now() - 10 * 60_000).toISOString())
    .all();
  const ocupate = new Set(recente.map((r) => r.telefon));

  const deTrimis = [];
  for (const c of candidati) {
    if (ocupate.has(c.telefon)) {
      rezultat.amanate++;
      continue;
    }
    ocupate.add(c.telefon);
    deTrimis.push(c);
  }
  if (!deTrimis.length) {
    await scrieSetare(db, 'ultima_rulare', JSON.stringify(rezultat));
    return rezultat;
  }

  // Rezervăm pomenile înainte de trimitere, ca două rulări simultane să nu trimită de două ori.
  // (o singură interogare: planul gratuit D1 permite 50 de interogări pe rulare)
  const { results: rezervari } = await db
    .prepare(
      `UPDATE pomeni SET status = 'in_curs', blocat_la = ?1
       WHERE status = 'asteptare' AND id IN (SELECT value FROM json_each(?2))
       RETURNING id`,
    )
    .bind(acum, JSON.stringify(deTrimis.map((c) => c.id)))
    .all();
  const idRezervate = new Set(rezervari.map((r) => r.id));
  const rezervate = deTrimis.filter((c) => idRezervate.has(c.id));

  const actualizari = [];
  for (const c of rezervate) {
    const mesaj = randeazaMesaj(setari.mesaj, c);
    const { ok, raspuns } = await trimiteSms(env, c.telefon, mesaj);
    if (ok) rezultat.trimise++;
    else rezultat.erori++;
    actualizari.push({
      id: c.id,
      status: ok ? 'trimis' : c.incercari + 1 >= MAX_INCERCARI ? 'eroare' : 'asteptare',
      trimis_la: ok ? new Date().toISOString() : null,
      mesaj,
      raspuns,
    });
  }
  if (actualizari.length) {
    await db
      .prepare(
        `UPDATE pomeni SET
           status    = j.value ->> 'status',
           trimis_la = j.value ->> 'trimis_la',
           mesaj     = j.value ->> 'mesaj',
           raspuns   = j.value ->> 'raspuns',
           incercari = pomeni.incercari + 1,
           blocat_la = NULL
         FROM json_each(?1) AS j
         WHERE pomeni.id = j.value ->> 'id'`,
      )
      .bind(JSON.stringify(actualizari))
      .run();
  }
  await numaraTrimise(db, rezultat.trimise);
  await scrieSetare(db, 'ultima_rulare', JSON.stringify(rezultat));
  // După ce au plecat SMS-uri, actualizăm și creditul afișat în panou
  if (rezultat.trimise) await verificaCredit(env);
  return rezultat;
}

const UN_AN_MS = 365 * 24 * 3600 * 1000;

/**
 * O dată pe an șterge din istoric SMS-urile mai vechi de un an (și pomenile trecute de peste un an
 * care nu mai au ce trimite). Persoanele și contorul total de SMS-uri rămân neatinse.
 * Rulează la prima verificare automată de după împlinirea unui an de la ștergerea precedentă.
 */
export async function curataIstoric(db, { fortat = false } = {}) {
  const rand = await db.prepare(`SELECT valoare FROM setari WHERE cheie = 'ultima_curatare'`).first();
  const acum = new Date();
  if (!fortat && rand && acum - new Date(JSON.parse(rand.valoare).la) < UN_AN_MS) return null;

  const limitaMoment = new Date(acum - UN_AN_MS).toISOString();
  const limitaData = adaugaZile(aziRO(acum), -365);
  const [pomeni] = await db.batch([
    db
      .prepare(
        `DELETE FROM pomeni
         WHERE (status = 'trimis' AND trimis_la < ?1)
            OR (status IN ('asteptare', 'anulat', 'eroare') AND data_pomana < ?2)`,
      )
      .bind(limitaMoment, limitaData),
    // contoarele lunare mai vechi de un an (totalul rămâne)
    db
      .prepare(`DELETE FROM setari WHERE cheie GLOB 'sms_trimise_[0-9][0-9][0-9][0-9]-[0-9][0-9]' AND cheie < ?`)
      .bind(`sms_trimise_${limitaData.slice(0, 7)}`),
  ]);
  const rezultat = { la: acum.toISOString(), sterse: pomeni.meta.changes };
  await scrieSetare(db, 'ultima_curatare', JSON.stringify(rezultat));
  return rezultat;
}
