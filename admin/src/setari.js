import { SETARI_IMPLICITE } from './pomeni.js';

export async function citesteSetari(db) {
  const { results } = await db.prepare('SELECT cheie, valoare FROM setari').all();
  const setari = { ...SETARI_IMPLICITE };
  for (const r of results) setari[r.cheie] = r.valoare;
  return setari;
}

export function instructiuneSetare(db, cheie, valoare) {
  return db
    .prepare('INSERT INTO setari (cheie, valoare) VALUES (?, ?) ON CONFLICT(cheie) DO UPDATE SET valoare = excluded.valoare')
    .bind(cheie, String(valoare));
}

export async function scrieSetare(db, cheie, valoare) {
  await instructiuneSetare(db, cheie, valoare).run();
}
