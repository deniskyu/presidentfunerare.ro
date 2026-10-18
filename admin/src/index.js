// Panoul de administrare President Funerare: persoane decedate, pomeni și SMS-uri de amintire.
// Rulează ca un Cloudflare Worker. Interfața (public/) e servită ca fișiere statice,
// iar tot ce începe cu /api/ trece prin codul de aici.

import {
  cookieSesiune,
  cookieStergere,
  citesteSesiune,
  egalSigur,
  hashParola,
  inregistreazaEsec,
  prealabilLogare,
  stergeEsecuri,
  verificaParola,
} from './auth.js';
import {
  adaugaZile,
  analizeazaSms,
  aziRO,
  esteDataValida,
  etichetaPomana,
  formateazaNume,
  FUS_ORAR,
  instructiuneGenerarePomeni,
  normalizeazaTelefon,
  randeazaMesaj,
} from './pomeni.js';
import { citesteSetari } from './setari.js';
import { numaraTrimise, ruleazaTrimiterea, trimiteSms, verificaCredit } from './sms.js';

class Eroare extends Error {
  constructor(status, mesaj) {
    super(mesaj);
    this.status = status;
  }
}

function json(date, status = 200, antete = {}) {
  return new Response(JSON.stringify(date), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...antete },
  });
}

async function citesteCorp(request) {
  const text = await request.text();
  if (text.length > 1_000_000) throw new Eroare(413, 'Datele trimise sunt prea mari. Importați în mai multe tranșe.');
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Eroare(400, 'Date trimise greșit.');
  }
}

// ---------- Rutare ----------

const rute = [];
function ruta(metoda, tipar, handler, optiuni = {}) {
  const re = new RegExp('^' + tipar.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$');
  rute.push({ metoda, re, handler, public: !!optiuni.public, admin: !!optiuni.admin });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try {
      if (!env.SESSION_SECRET) throw new Eroare(500, 'Lipsește secretul SESSION_SECRET. Vezi admin/README.md.');
      if (request.method !== 'GET' && request.headers.get('X-Cerere') !== '1') throw new Eroare(403, 'Cerere respinsă.');
      for (const r of rute) {
        if (r.metoda !== request.method) continue;
        const potrivire = url.pathname.match(r.re);
        if (!potrivire) continue;
        let sesiune = null;
        if (!r.public) {
          sesiune = await citesteSesiune(env, request);
          if (!sesiune) throw new Eroare(401, 'Sesiunea a expirat. Intrați din nou în cont.');
          if (r.admin && sesiune.utilizator.rol !== 'admin') throw new Eroare(403, 'Doar un administrator poate face asta.');
        }
        const raspuns = await r.handler({
          request,
          env,
          ctx,
          url,
          db: env.DB,
          params: potrivire.groups || {},
          eu: sesiune?.utilizator,
          corp: () => citesteCorp(request),
        });
        if (sesiune?.cookieNou && !raspuns.headers.has('Set-Cookie')) raspuns.headers.append('Set-Cookie', sesiune.cookieNou);
        return raspuns;
      }
      throw new Eroare(404, 'Adresa nu există.');
    } catch (e) {
      if (e instanceof Eroare) return json({ eroare: e.message }, e.status);
      console.error(e);
      return json({ eroare: 'Eroare neașteptată pe server. Încercați din nou.' }, 500);
    }
  },

  async scheduled(controller, env, ctx) {
    // Cron-ul pornește din oră în oră; trimitem doar între 10:00 și 18:59, ora României (vara și iarna).
    const ora = Number(new Intl.DateTimeFormat('en-GB', { timeZone: FUS_ORAR, hour: '2-digit', hour12: false }).format(new Date()));
    if (ora < 10 || ora >= 19) return;
    ctx.waitUntil(
      (async () => {
        await ruleazaTrimiterea(env, { motiv: 'automat' });
        // O dată pe zi verificăm și creditul, ca panoul să anunțe din timp când se termină.
        if (ora === 10 && env.SMSLINK_CONNECTION_ID) await verificaCredit(env);
      })(),
    );
  },
};

// ---------- Ajutoare ----------

const contPublic = (u) => ({ id: u.id, utilizator: u.utilizator, nume: u.nume, rol: u.rol });

function idDinParam(v) {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new Eroare(400, 'Identificator greșit.');
  return n;
}

function text(v, max) {
  return String(v ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** Validează datele unei persoane. Întoarce { date } sau { eroare } */
function valideazaPersoana(corp, azi) {
  const nume = text(corp.nume, 120);
  if (nume.length < 3) return { eroare: 'Completați numele persoanei decedate.' };
  const data_deces = String(corp.data_deces ?? '').trim();
  if (!esteDataValida(data_deces)) return { eroare: 'Data decesului nu e validă.' };
  if (data_deces > azi) return { eroare: 'Data decesului nu poate fi în viitor.' };
  if (data_deces < '1950-01-01') return { eroare: 'Data decesului pare greșită (prea veche).' };
  const tel = normalizeazaTelefon(corp.telefon);
  if (tel.eroare) return { eroare: tel.eroare };
  return {
    date: {
      nume,
      data_deces,
      client: text(corp.client, 120),
      telefon: tel.telefon,
      note: String(corp.note ?? '').trim().slice(0, 1000),
    },
  };
}

function imbogatestePomana(p, setari) {
  const mesaj = randeazaMesaj(setari.mesaj, p);
  return {
    ...p,
    pomana: etichetaPomana(p.tip),
    nume_sms: p.nume !== undefined ? formateazaNume(p.nume) : undefined,
    mesaj_previzualizare: p.status === 'trimis' && p.mesaj ? p.mesaj : mesaj,
    segmente: analizeazaSms(mesaj).segmente,
  };
}

async function detaliiPersoana(db, id) {
  const [persoane, pomeni] = await db.batch([
    db.prepare('SELECT * FROM decedati WHERE id = ?').bind(id),
    db
      .prepare(
        `SELECT id, tip, data_pomana, status, incercari, trimis_la, mesaj, raspuns
         FROM pomeni WHERE decedat_id = ? ORDER BY data_pomana`,
      )
      .bind(id),
  ]);
  const persoana = persoane.results[0];
  if (!persoana) throw new Eroare(404, 'Persoana nu mai există în listă.');
  const setari = await citesteSetari(db);
  return {
    persoana: { ...persoana, nume_sms: formateazaNume(persoana.nume) },
    pomeni: pomeni.results.map((p) => imbogatestePomana({ ...p, nume: persoana.nume }, setari)),
    setari: { sms_pornit: setari.sms_pornit === '1', zile_inainte: Number(setari.zile_inainte) },
  };
}

// ---------- Cont ----------

const HASH_FALS = 'pbkdf2$20000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

ruta(
  'POST',
  '/api/autentificare',
  async ({ request, env, db, corp }) => {
    const { utilizator = '', parola = '' } = await corp();
    const nume = String(utilizator).trim();
    const cheie = `ip:${request.headers.get('CF-Connecting-IP') || 'local'}`;
    const minute = await prealabilLogare(env, cheie);
    if (minute) throw new Eroare(429, `Prea multe încercări greșite. Mai încercați peste ${minute} minute.`);

    let cont = null;
    const nrConturi = await db.prepare('SELECT COUNT(*) AS n FROM utilizatori').first('n');
    if (nrConturi === 0) {
      // Primul cont de administrator vine din secretele ADMIN_USER și ADMIN_PASSWORD.
      if (!env.ADMIN_USER || !env.ADMIN_PASSWORD) {
        throw new Eroare(503, 'Nu există încă niciun cont. Setați secretele ADMIN_USER și ADMIN_PASSWORD (vezi admin/README.md).');
      }
      if (egalSigur(nume.toLowerCase(), env.ADMIN_USER.toLowerCase()) && egalSigur(String(parola), env.ADMIN_PASSWORD)) {
        cont = await db
          .prepare(
            `INSERT INTO utilizatori (utilizator, nume, parola_hash, rol) VALUES (?, 'Administrator', ?, 'admin')
             RETURNING id, utilizator, nume, rol, versiune`,
          )
          .bind(env.ADMIN_USER, await hashParola(String(parola)))
          .first();
      }
    } else {
      const rand = await db
        .prepare('SELECT id, utilizator, nume, rol, versiune, parola_hash FROM utilizatori WHERE utilizator = ? AND activ = 1')
        .bind(nume)
        .first();
      const corecta = await verificaParola(String(parola), rand?.parola_hash ?? HASH_FALS);
      if (rand && corecta) cont = rand;
    }

    if (!cont) {
      await inregistreazaEsec(env, cheie);
      throw new Eroare(401, 'Utilizator sau parolă greșită.');
    }
    await stergeEsecuri(env, cheie);
    await db.prepare(`UPDATE utilizatori SET ultima_logare = datetime('now') WHERE id = ?`).bind(cont.id).run();
    return json({ utilizator: contPublic(cont) }, 200, { 'Set-Cookie': await cookieSesiune(env, cont) });
  },
  { public: true },
);

ruta('POST', '/api/deconectare', async () => json({ ok: true }, 200, { 'Set-Cookie': cookieStergere() }), { public: true });

ruta('POST', '/api/deconectare-peste-tot', async ({ db, eu }) => {
  await db.prepare('UPDATE utilizatori SET versiune = versiune + 1 WHERE id = ?').bind(eu.id).run();
  return json({ ok: true }, 200, { 'Set-Cookie': cookieStergere() });
});

ruta('GET', '/api/eu', async ({ eu }) => json({ utilizator: contPublic(eu) }));

ruta('POST', '/api/eu/parola', async ({ env, db, eu, corp }) => {
  const { parola_veche = '', parola_noua = '' } = await corp();
  if (String(parola_noua).length < 8) throw new Eroare(400, 'Parola nouă trebuie să aibă cel puțin 8 caractere.');
  const rand = await db.prepare('SELECT parola_hash FROM utilizatori WHERE id = ?').bind(eu.id).first();
  if (!(await verificaParola(String(parola_veche), rand.parola_hash))) throw new Eroare(400, 'Parola actuală nu e corectă.');
  const cont = await db
    .prepare('UPDATE utilizatori SET parola_hash = ?, versiune = versiune + 1 WHERE id = ? RETURNING id, utilizator, nume, rol, versiune')
    .bind(await hashParola(String(parola_noua)), eu.id)
    .first();
  return json({ ok: true }, 200, { 'Set-Cookie': await cookieSesiune(env, cont) });
});

// ---------- Acasă ----------

ruta('GET', '/api/acasa', async ({ db }) => {
  const azi = aziRO();
  const setari = await citesteSetari(db);
  const coloane = `p.id, p.tip, p.data_pomana, p.status, p.incercari, p.trimis_la, p.mesaj, p.raspuns,
                   d.id AS persoana_id, d.nume, d.client, d.telefon, d.sms_activ`;
  const [urmatoare, deVerificat, statistici] = await db.batch([
    db
      .prepare(
        `SELECT ${coloane} FROM pomeni p JOIN decedati d ON d.id = p.decedat_id
         WHERE p.data_pomana >= ? AND p.data_pomana <= ?
         ORDER BY p.data_pomana, d.nume LIMIT 400`,
      )
      .bind(azi, adaugaZile(azi, 30)),
    db.prepare(
      `SELECT ${coloane} FROM pomeni p JOIN decedati d ON d.id = p.decedat_id
       WHERE p.status IN ('eroare', 'in_curs') ORDER BY p.data_pomana LIMIT 50`,
    ),
    db.prepare('SELECT COUNT(*) AS persoane FROM decedati'),
  ]);
  return json({
    azi,
    setari: { sms_pornit: setari.sms_pornit === '1', zile_inainte: Number(setari.zile_inainte), ani_max: Number(setari.ani_max) },
    urmatoare: urmatoare.results.map((p) => imbogatestePomana(p, setari)),
    de_verificat: deVerificat.results.map((p) => imbogatestePomana(p, setari)),
    statistici: {
      persoane: statistici.results[0].persoane,
      trimise_total: Number(setari.sms_trimise_total || 0),
      trimise_luna: Number(setari[`sms_trimise_${azi.slice(0, 7)}`] || 0),
    },
    ultima_rulare: setari.ultima_rulare ? JSON.parse(setari.ultima_rulare) : null,
    credit: setari.credit_sms ? JSON.parse(setari.credit_sms) : null,
  });
});

// ---------- Persoane ----------

const PE_PAGINA = 50;

ruta('GET', '/api/persoane', async ({ db, url }) => {
  const azi = aziRO();
  const q = text(url.searchParams.get('q'), 80);
  const pagina = Math.max(1, Number(url.searchParams.get('pagina')) || 1);
  let unde = '1 = 1';
  const parametri = [];
  if (q) {
    parametri.push(`%${q}%`);
    unde = `(d.nume LIKE ?2 OR d.client LIKE ?2`;
    const cifre = q.replace(/\D/g, '');
    if (cifre.length >= 3) {
      parametri.push(`%${cifre.replace(/^0040/, '0').replace(/^40(?=7)/, '0')}%`);
      unde += ' OR d.telefon LIKE ?3';
    }
    unde += ')';
  }
  const [total, randuri] = await db.batch([
    db.prepare(`SELECT COUNT(*) AS n FROM decedati d WHERE ${unde.replace(/\?(\d)/g, (_, n) => `?${n - 1}`)}`).bind(...parametri),
    db
      .prepare(
        `SELECT d.id, d.nume, d.data_deces, d.client, d.telefon, d.sms_activ,
           (SELECT tip || '|' || data_pomana || '|' || status FROM pomeni
            WHERE decedat_id = d.id AND data_pomana >= ?1 ORDER BY data_pomana LIMIT 1) AS urmatoarea
         FROM decedati d WHERE ${unde}
         ORDER BY d.data_deces DESC, d.id DESC
         LIMIT ${PE_PAGINA} OFFSET ${(pagina - 1) * PE_PAGINA}`,
      )
      .bind(azi, ...parametri),
  ]);
  return json({
    total: total.results[0].n,
    pagina,
    pe_pagina: PE_PAGINA,
    persoane: randuri.results.map((r) => {
      const [tip, data, status] = (r.urmatoarea || '').split('|');
      return {
        ...r,
        nume_sms: formateazaNume(r.nume),
        urmatoarea: r.urmatoarea ? { tip, pomana: etichetaPomana(tip), data_pomana: data, status } : null,
      };
    }),
  });
});

ruta('POST', '/api/persoane', async ({ db, eu, corp }) => {
  const azi = aziRO();
  const { date, eroare } = valideazaPersoana(await corp(), azi);
  if (eroare) throw new Eroare(400, eroare);
  const existenta = await db
    .prepare('SELECT id FROM decedati WHERE data_deces = ? AND lower(nume) = lower(?)')
    .bind(date.data_deces, date.nume)
    .first();
  if (existenta) throw new Eroare(409, 'Persoana există deja în listă cu aceeași dată a decesului.');
  const { id } = await db
    .prepare(
      `INSERT INTO decedati (nume, data_deces, client, telefon, note, creat_de)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(date.nume, date.data_deces, date.client, date.telefon, date.note, eu.nume || eu.utilizator)
    .first();
  const setari = await citesteSetari(db);
  await instructiuneGenerarePomeni(db, Number(setari.ani_max), azi, 'd.id = ?3', [id]).run();
  return json(await detaliiPersoana(db, id), 201);
});

ruta('GET', '/api/persoane/:id', async ({ db, params }) => json(await detaliiPersoana(db, idDinParam(params.id))));

ruta('PUT', '/api/persoane/:id', async ({ db, eu, params, corp }) => {
  const id = idDinParam(params.id);
  const azi = aziRO();
  const { date, eroare } = valideazaPersoana(await corp(), azi);
  if (eroare) throw new Eroare(400, eroare);
  const veche = await db.prepare('SELECT data_deces FROM decedati WHERE id = ?').bind(id).first();
  if (!veche) throw new Eroare(404, 'Persoana nu mai există în listă.');
  const instructiuni = [
    db
      .prepare(
        `UPDATE decedati SET nume = ?, data_deces = ?, client = ?, telefon = ?, note = ?,
           modificat_de = ?, modificat_la = datetime('now') WHERE id = ?`,
      )
      .bind(date.nume, date.data_deces, date.client, date.telefon, date.note, eu.nume || eu.utilizator, id),
  ];
  if (veche.data_deces !== date.data_deces) {
    // Data s-a schimbat: recalculăm pomenile care nu au plecat încă.
    const setari = await citesteSetari(db);
    instructiuni.push(
      db.prepare(`DELETE FROM pomeni WHERE decedat_id = ? AND status IN ('asteptare', 'anulat', 'eroare')`).bind(id),
      instructiuneGenerarePomeni(db, Number(setari.ani_max), azi, 'd.id = ?3', [id]),
    );
  }
  await db.batch(instructiuni);
  return json(await detaliiPersoana(db, id));
});

ruta('DELETE', '/api/persoane/:id', async ({ db, params }) => {
  const id = idDinParam(params.id);
  await db.batch([
    db.prepare('DELETE FROM pomeni WHERE decedat_id = ?').bind(id),
    db.prepare('DELETE FROM decedati WHERE id = ?').bind(id),
  ]);
  return json({ ok: true });
});

ruta('POST', '/api/persoane/:id/sms', async ({ db, eu, params, corp }) => {
  const id = idDinParam(params.id);
  const { activ } = await corp();
  await db
    .prepare(`UPDATE decedati SET sms_activ = ?, modificat_de = ?, modificat_la = datetime('now') WHERE id = ?`)
    .bind(activ ? 1 : 0, eu.nume || eu.utilizator, id)
    .run();
  return json(await detaliiPersoana(db, id));
});

ruta('POST', '/api/telefon/opreste', async ({ db, eu, corp }) => {
  const tel = normalizeazaTelefon((await corp()).telefon);
  if (tel.eroare) throw new Eroare(400, tel.eroare);
  const r = await db
    .prepare(`UPDATE decedati SET sms_activ = 0, modificat_de = ?, modificat_la = datetime('now') WHERE telefon = ? AND sms_activ = 1`)
    .bind(eu.nume || eu.utilizator, tel.telefon)
    .run();
  return json({ oprite: r.meta.changes });
});

ruta('POST', '/api/import', async ({ db, eu, corp }) => {
  const { randuri } = await corp();
  if (!Array.isArray(randuri) || !randuri.length) throw new Eroare(400, 'Nu am primit niciun rând de importat.');
  if (randuri.length > 500) throw new Eroare(400, 'Importați cel mult 500 de rânduri odată.');
  const azi = aziRO();
  const erori = [];
  const valide = [];
  const vazute = new Set();
  let duplicate = 0;
  randuri.forEach((r, i) => {
    const { date, eroare } = valideazaPersoana(r || {}, azi);
    if (eroare) return erori.push({ rand: i + 1, motiv: eroare });
    const cheie = `${date.data_deces}|${date.nume.toLowerCase()}`;
    if (vazute.has(cheie)) return duplicate++;
    vazute.add(cheie);
    valide.push({ ...date, creat_de: eu.nume || eu.utilizator });
  });
  let adaugate = 0;
  if (valide.length) {
    const { results } = await db
      .prepare(
        `INSERT INTO decedati (nume, data_deces, client, telefon, note, creat_de)
         SELECT j.value ->> 'nume', j.value ->> 'data_deces', j.value ->> 'client', j.value ->> 'telefon',
                j.value ->> 'note', j.value ->> 'creat_de'
         FROM json_each(?1) AS j
         WHERE NOT EXISTS (
           SELECT 1 FROM decedati d
           WHERE d.data_deces = j.value ->> 'data_deces' AND lower(d.nume) = lower(j.value ->> 'nume')
         )
         RETURNING id`,
      )
      .bind(JSON.stringify(valide))
      .all();
    adaugate = results.length;
    duplicate += valide.length - adaugate;
    if (adaugate) {
      const iduri = results.map((r) => r.id);
      const setari = await citesteSetari(db);
      await instructiuneGenerarePomeni(db, Number(setari.ani_max), azi, 'd.id IN (SELECT value FROM json_each(?3))', [
        JSON.stringify(iduri),
      ]).run();
    }
  }
  return json({ adaugate, duplicate, erori });
});

ruta('GET', '/api/export.csv', async ({ db }) => {
  const { results } = await db
    .prepare('SELECT nume, data_deces, client, telefon, sms_activ, note, creat_de, creat_la FROM decedati ORDER BY data_deces DESC')
    .all();
  const camp = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const linii = [
    ['Nume decedat', 'Data decesului', 'Nume client', 'Telefon', 'SMS activ', 'Note', 'Adăugat de', 'Adăugat la'].map(camp).join(';'),
    ...results.map((r) => {
      const [a, l, z] = r.data_deces.split('-');
      return [r.nume, `${z}.${l}.${a}`, r.client, r.telefon, r.sms_activ ? 'da' : 'nu', r.note, r.creat_de, r.creat_la]
        .map(camp)
        .join(';');
    }),
  ];
  return new Response('﻿' + linii.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="pomeniri-${aziRO()}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
});

// ---------- Pomeni și istoric SMS ----------

ruta('GET', '/api/sms', async ({ db, url }) => {
  const pagina = Math.max(1, Number(url.searchParams.get('pagina')) || 1);
  const { results } = await db
    .prepare(
      `SELECT p.id, p.tip, p.data_pomana, p.status, p.incercari, p.trimis_la, p.blocat_la, p.mesaj, p.raspuns,
              d.id AS persoana_id, d.nume, d.client, d.telefon
       FROM pomeni p JOIN decedati d ON d.id = p.decedat_id
       WHERE p.status IN ('trimis', 'eroare', 'in_curs') OR p.incercari > 0
       ORDER BY COALESCE(p.trimis_la, p.blocat_la, p.data_pomana) DESC
       LIMIT 51 OFFSET ?`,
    )
    .bind((pagina - 1) * 50)
    .all();
  return json({
    pagina,
    mai_sunt: results.length > 50,
    sms: results.slice(0, 50).map((p) => ({ ...p, pomana: etichetaPomana(p.tip), nume_sms: formateazaNume(p.nume) })),
  });
});

async function schimbaStatus(db, id, din, in_) {
  const r = await db
    .prepare(
      `UPDATE pomeni SET status = ?, incercari = CASE WHEN ? = 'asteptare' THEN 0 ELSE incercari END,
         blocat_la = NULL WHERE id = ? AND status IN (${din.map(() => '?').join(',')}) RETURNING decedat_id`,
    )
    .bind(in_, in_, id, ...din)
    .first();
  if (!r) throw new Eroare(409, 'Pomana și-a schimbat între timp starea. Reîncărcați pagina.');
  return r.decedat_id;
}

ruta('POST', '/api/pomeni/:id/reincearca', async ({ db, params }) => {
  const id = await schimbaStatus(db, idDinParam(params.id), ['eroare', 'in_curs'], 'asteptare');
  return json(await detaliiPersoana(db, id));
});

ruta('POST', '/api/pomeni/:id/anuleaza', async ({ db, params }) => {
  const id = await schimbaStatus(db, idDinParam(params.id), ['asteptare', 'eroare'], 'anulat');
  return json(await detaliiPersoana(db, id));
});

ruta('POST', '/api/pomeni/:id/reactiveaza', async ({ db, params }) => {
  const id = await schimbaStatus(db, idDinParam(params.id), ['anulat'], 'asteptare');
  return json(await detaliiPersoana(db, id));
});

ruta('POST', '/api/pomeni/:id/marcheaza-trimis', async ({ db, params }) => {
  const pid = idDinParam(params.id);
  const r = await db
    .prepare(
      `UPDATE pomeni SET status = 'trimis', trimis_la = COALESCE(trimis_la, blocat_la, ?), blocat_la = NULL
       WHERE id = ? AND status IN ('in_curs', 'eroare') RETURNING decedat_id`,
    )
    .bind(new Date().toISOString(), pid)
    .first();
  if (!r) throw new Eroare(409, 'Pomana și-a schimbat între timp starea. Reîncărcați pagina.');
  return json(await detaliiPersoana(db, r.decedat_id));
});

// ---------- Setări (doar administrator) ----------

function valideazaSablon(mesaj) {
  const s = String(mesaj ?? '').trim();
  if (s.length < 10) throw new Eroare(400, 'Textul SMS-ului e prea scurt.');
  if (s.length > 450) throw new Eroare(400, 'Textul SMS-ului e prea lung.');
  const necunoscute = (s.match(/\{[^}]*\}/g) || []).filter((x) => !['{pomana}', '{nume}', '{data}'].includes(x));
  if (necunoscute.length) throw new Eroare(400, `Câmp necunoscut în text: ${necunoscute.join(', ')}. Folosiți {pomana}, {nume}, {data}.`);
  return s;
}

function exempluMesaj(sablon) {
  const exemple = [
    { tip: '40z', nume: 'TOMA MARIA', data_pomana: '2026-10-29' },
    { tip: '1a', nume: 'UDATEANU SILVESTRU CONSTANTIN', data_pomana: '2027-09-20' },
  ];
  return exemple.map((e) => {
    const mesaj = randeazaMesaj(sablon, e);
    return { mesaj, ...analizeazaSms(mesaj) };
  });
}

ruta(
  'GET',
  '/api/setari',
  async ({ db }) => {
    const s = await citesteSetari(db);
    return json({
      sms_pornit: s.sms_pornit === '1',
      zile_inainte: Number(s.zile_inainte),
      ani_max: Number(s.ani_max),
      mesaj: s.mesaj,
      exemple: exempluMesaj(s.mesaj),
    });
  },
  { admin: true },
);

ruta(
  'POST',
  '/api/setari/previzualizare',
  async ({ corp }) => json({ exemple: exempluMesaj(valideazaSablon((await corp()).mesaj)) }),
  { admin: true },
);

ruta(
  'PUT',
  '/api/setari',
  async ({ db, corp }) => {
    const c = await corp();
    const vechi = await citesteSetari(db);
    const zile = Number(c.zile_inainte);
    const ani = Number(c.ani_max);
    if (!Number.isInteger(zile) || zile < 1 || zile > 30) throw new Eroare(400, 'Numărul de zile trebuie să fie între 1 și 30.');
    if (!Number.isInteger(ani) || ani < 1 || ani > 10) throw new Eroare(400, 'Pomenile anuale pot merge între 1 și 10 ani.');
    const noi = { sms_pornit: c.sms_pornit ? '1' : '0', zile_inainte: String(zile), ani_max: String(ani), mesaj: valideazaSablon(c.mesaj) };
    const instructiuni = [
      db
        .prepare(
          `INSERT INTO setari (cheie, valoare) SELECT key, value FROM json_each(?) WHERE true
           ON CONFLICT(cheie) DO UPDATE SET valoare = excluded.valoare`,
        )
        .bind(JSON.stringify(noi)),
    ];
    if (ani !== Number(vechi.ani_max)) {
      instructiuni.push(
        db
          .prepare(
            `DELETE FROM pomeni WHERE status IN ('asteptare', 'anulat') AND tip LIKE '%a'
             AND CAST(substr(tip, 1, length(tip) - 1) AS INTEGER) > ?`,
          )
          .bind(ani),
        instructiuneGenerarePomeni(db, ani, aziRO(), '1 = 1'),
      );
    }
    await db.batch(instructiuni);
    return json({ ok: true });
  },
  { admin: true },
);

ruta(
  'POST',
  '/api/sms/test',
  async ({ env, db, corp }) => {
    const tel = normalizeazaTelefon((await corp()).telefon);
    if (tel.eroare) throw new Eroare(400, tel.eroare);
    const setari = await citesteSetari(db);
    const mesaj = randeazaMesaj(setari.mesaj, { tip: '40z', nume: 'TOMA MARIA', data_pomana: adaugaZile(aziRO(), 7) });
    const r = await trimiteSms(env, tel.telefon, mesaj);
    if (r.ok) {
      await numaraTrimise(db, 1);
      await verificaCredit(env);
    }
    return json({ ...r, mesaj }, r.ok ? 200 : 502);
  },
  { admin: true },
);

ruta('GET', '/api/sms/credit', async ({ env }) => json(await verificaCredit(env)), { admin: true });

ruta('POST', '/api/ruleaza-acum', async ({ env }) => json(await ruleazaTrimiterea(env, { motiv: 'manual' })), { admin: true });

// ---------- Utilizatori (doar administrator) ----------

ruta(
  'GET',
  '/api/utilizatori',
  async ({ db }) => {
    const { results } = await db
      .prepare('SELECT id, utilizator, nume, rol, activ, creat_la, ultima_logare FROM utilizatori ORDER BY activ DESC, nume')
      .all();
    return json({ utilizatori: results });
  },
  { admin: true },
);

function valideazaUtilizator(c, { nou }) {
  const utilizator = String(c.utilizator ?? '').trim().toLowerCase();
  if (nou && !/^[a-z0-9._-]{3,40}$/.test(utilizator)) {
    throw new Eroare(400, 'Numele de utilizator: 3–40 caractere, doar litere fără diacritice, cifre, punct, minus.');
  }
  const nume = text(c.nume, 80);
  if (!nume) throw new Eroare(400, 'Completați numele persoanei.');
  const rol = c.rol === 'admin' ? 'admin' : 'operator';
  const parola = c.parola ? String(c.parola) : '';
  if ((nou || parola) && parola.length < 8) throw new Eroare(400, 'Parola trebuie să aibă cel puțin 8 caractere.');
  return { utilizator, nume, rol, parola };
}

ruta(
  'POST',
  '/api/utilizatori',
  async ({ db, corp }) => {
    const u = valideazaUtilizator(await corp(), { nou: true });
    const exista = await db.prepare('SELECT id FROM utilizatori WHERE utilizator = ?').bind(u.utilizator).first();
    if (exista) throw new Eroare(409, 'Există deja un cont cu acest nume de utilizator.');
    await db
      .prepare('INSERT INTO utilizatori (utilizator, nume, parola_hash, rol) VALUES (?, ?, ?, ?)')
      .bind(u.utilizator, u.nume, await hashParola(u.parola), u.rol)
      .run();
    return json({ ok: true }, 201);
  },
  { admin: true },
);

ruta(
  'PUT',
  '/api/utilizatori/:id',
  async ({ db, eu, params, corp }) => {
    const id = idDinParam(params.id);
    const c = await corp();
    const u = valideazaUtilizator(c, { nou: false });
    const activ = c.activ ? 1 : 0;
    if (id === eu.id && (!activ || u.rol !== 'admin')) {
      throw new Eroare(400, 'Nu vă puteți dezactiva propriul cont sau scoate din administratori.');
    }
    const parti = ['nume = ?', 'rol = ?', 'activ = ?'];
    const valori = [u.nume, u.rol, activ];
    if (u.parola) {
      parti.push('parola_hash = ?');
      valori.push(await hashParola(u.parola));
    }
    // La parolă nouă sau dezactivare, contul e delogat de pe toate dispozitivele.
    parti.push(`versiune = versiune + CASE WHEN ? THEN 1 ELSE 0 END`);
    valori.push(u.parola || !activ ? 1 : 0);
    const r = await db
      .prepare(`UPDATE utilizatori SET ${parti.join(', ')} WHERE id = ? RETURNING id`)
      .bind(...valori, id)
      .first();
    if (!r) throw new Eroare(404, 'Contul nu există.');
    return json({ ok: true });
  },
  { admin: true },
);
