-- Baza de date pentru panoul de pomeniri (Cloudflare D1 / SQLite)

-- Persoanele decedate și clientul (familia) care primește SMS-urile
CREATE TABLE decedati (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nume          TEXT    NOT NULL,
  data_deces    TEXT    NOT NULL,              -- AAAA-LL-ZZ
  client        TEXT    NOT NULL DEFAULT '',
  telefon       TEXT    NOT NULL,              -- normalizat: 07xxxxxxxx sau 00<prefix><numar>
  sms_activ     INTEGER NOT NULL DEFAULT 1,    -- 0 = nu mai trimitem SMS-uri pentru persoana asta
  note          TEXT    NOT NULL DEFAULT '',
  creat_de      TEXT    NOT NULL DEFAULT '',
  creat_la      TEXT    NOT NULL DEFAULT (datetime('now')),
  modificat_de  TEXT,
  modificat_la  TEXT
);
CREATE INDEX idx_decedati_data_deces ON decedati(data_deces);
CREATE INDEX idx_decedati_telefon    ON decedati(telefon);

-- Pomenile viitoare (doar cele care nu au trecut se salvează) și starea SMS-ului pentru fiecare
--   tip:    40z, 3l, 6l, 9l, 1a, 2a, ...
--   status: asteptare | in_curs | trimis | eroare | anulat
CREATE TABLE pomeni (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  decedat_id   INTEGER NOT NULL REFERENCES decedati(id) ON DELETE CASCADE,
  tip          TEXT    NOT NULL,
  data_pomana  TEXT    NOT NULL,
  status       TEXT    NOT NULL DEFAULT 'asteptare',
  incercari    INTEGER NOT NULL DEFAULT 0,
  blocat_la    TEXT,                           -- când a început trimiterea (pentru status in_curs)
  trimis_la    TEXT,
  mesaj        TEXT,
  raspuns      TEXT,                           -- răspunsul brut de la SMSLink sau eroarea
  UNIQUE (decedat_id, tip)
);
CREATE INDEX idx_pomeni_data ON pomeni(data_pomana);

-- Conturile care se pot loga în panou
CREATE TABLE utilizatori (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  utilizator     TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  nume           TEXT    NOT NULL DEFAULT '',
  parola_hash    TEXT    NOT NULL,
  rol            TEXT    NOT NULL DEFAULT 'operator',  -- admin | operator
  activ          INTEGER NOT NULL DEFAULT 1,
  versiune       INTEGER NOT NULL DEFAULT 1,           -- se mărește la schimbarea parolei => delogare de peste tot
  creat_la       TEXT    NOT NULL DEFAULT (datetime('now')),
  ultima_logare  TEXT
);

-- Protecție la ghicirea parolelor
CREATE TABLE incercari_logare (
  cheie   TEXT    PRIMARY KEY,
  nr      INTEGER NOT NULL,
  start   INTEGER NOT NULL
);

-- Setări editabile din panou
CREATE TABLE setari (
  cheie   TEXT PRIMARY KEY,
  valoare TEXT NOT NULL
);
