// Conturi, parole și sesiuni.
// Parolele se salvează doar ca hash PBKDF2-SHA256 cu sare unică.
// Sesiunea e un cookie semnat (HMAC) care se reînnoiește singur cât timp contul e folosit.
// SameSite=Lax: cu Strict, Safari pe iPhone pierde uneori logarea; protecția CSRF vine din antetul X-Cerere.

const enc = new TextEncoder();
// 20.000 de iterații încap în cele 10 ms de procesor ale planului gratuit Cloudflare.
// Numărul e salvat în fiecare hash, deci se poate mări ulterior fără să strice parolele existente.
export const ITERATII_PBKDF2 = 20_000;
const DURATA_SESIUNE = 30 * 24 * 3600; // 30 de zile
const REINNOIRE_DUPA = 24 * 3600; // cookie nou cel mult o dată pe zi
export const NUME_COOKIE = 'sesiune';

function b64u(buf) {
  let s = '';
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function dinB64u(s) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function egalSigur(a, b) {
  const x = enc.encode(String(a));
  const y = enc.encode(String(b));
  let dif = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) dif |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return dif === 0;
}

export async function hashParola(parola, sare = crypto.getRandomValues(new Uint8Array(16)), iteratii = ITERATII_PBKDF2) {
  const cheie = await crypto.subtle.importKey('raw', enc.encode(parola), 'PBKDF2', false, ['deriveBits']);
  const biti = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sare, iterations: iteratii }, cheie, 256);
  return `pbkdf2$${iteratii}$${b64u(sare)}$${b64u(biti)}`;
}

export async function verificaParola(parola, stocat) {
  const [alg, iteratii, sare] = String(stocat).split('$');
  if (alg !== 'pbkdf2' || !sare) return false;
  const calculat = await hashParola(parola, dinB64u(sare), Number(iteratii));
  return egalSigur(calculat, stocat);
}

async function semnatura(secret, date) {
  const cheie = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64u(await crypto.subtle.sign('HMAC', cheie, enc.encode(date)));
}

export async function cookieSesiune(env, utilizator) {
  const expira = Math.floor(Date.now() / 1000) + DURATA_SESIUNE;
  const continut = `${utilizator.id}.${utilizator.versiune}.${expira}`;
  const valoare = `${continut}.${await semnatura(env.SESSION_SECRET, continut)}`;
  return `${NUME_COOKIE}=${valoare}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DURATA_SESIUNE}`;
}

export function cookieStergere() {
  return `${NUME_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function citesteCookie(request, nume) {
  const antet = request.headers.get('Cookie') || '';
  for (const parte of antet.split(';')) {
    const [k, ...v] = parte.trim().split('=');
    if (k === nume) return v.join('=');
  }
  return null;
}

/**
 * Verifică cookie-ul de sesiune. Întoarce { utilizator, cookieNou } sau null.
 * cookieNou e setat când sesiunea trebuie prelungită.
 */
export async function citesteSesiune(env, request) {
  const valoare = citesteCookie(request, NUME_COOKIE);
  if (!valoare) return null;
  const parti = valoare.split('.');
  if (parti.length !== 4) return null;
  const [id, versiune, expira, sig] = parti;
  const asteptat = await semnatura(env.SESSION_SECRET, `${id}.${versiune}.${expira}`);
  if (!egalSigur(sig, asteptat)) return null;
  const acum = Math.floor(Date.now() / 1000);
  if (Number(expira) < acum) return null;

  const utilizator = await env.DB.prepare(
    'SELECT id, utilizator, nume, rol, versiune FROM utilizatori WHERE id = ? AND activ = 1',
  )
    .bind(Number(id))
    .first();
  if (!utilizator || String(utilizator.versiune) !== versiune) return null;

  const emisLa = Number(expira) - DURATA_SESIUNE;
  const cookieNou = acum - emisLa > REINNOIRE_DUPA ? await cookieSesiune(env, utilizator) : null;
  return { utilizator, cookieNou };
}

// ---------- Limitare încercări de logare ----------

const MAX_INCERCARI = 10;
const FEREASTRA = 15 * 60;

export async function prealabilLogare(env, cheie) {
  const rand = await env.DB.prepare('SELECT nr, start FROM incercari_logare WHERE cheie = ?').bind(cheie).first();
  const acum = Math.floor(Date.now() / 1000);
  if (rand && acum - rand.start < FEREASTRA && rand.nr >= MAX_INCERCARI) {
    return Math.ceil((FEREASTRA - (acum - rand.start)) / 60);
  }
  return 0;
}

export async function inregistreazaEsec(env, cheie) {
  const acum = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    `INSERT INTO incercari_logare (cheie, nr, start) VALUES (?1, 1, ?2)
     ON CONFLICT(cheie) DO UPDATE SET
       nr    = CASE WHEN ?2 - start >= ${FEREASTRA} THEN 1 ELSE nr + 1 END,
       start = CASE WHEN ?2 - start >= ${FEREASTRA} THEN ?2 ELSE start END`,
  )
    .bind(cheie, acum)
    .run();
}

export async function stergeEsecuri(env, cheie) {
  await env.DB.prepare('DELETE FROM incercari_logare WHERE cheie = ?').bind(cheie).run();
}
