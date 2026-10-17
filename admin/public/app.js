'use strict';

(() => {
  // ---------- Utilitare ----------
  const LUNI = ['ian.', 'feb.', 'mar.', 'apr.', 'mai', 'iun.', 'iul.', 'aug.', 'sept.', 'oct.', 'nov.', 'dec.'];
  const LUNI_LUNG = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];
  const ZILE = ['duminică', 'luni', 'marți', 'miercuri', 'joi', 'vineri', 'sâmbătă'];
  const FUS = 'Europe/Bucharest';

  const stare = { eu: null, azi: null, setari: null };
  const app = document.getElementById('aplicatie');
  let main = null;

  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  const aziLocal = () =>
    new Intl.DateTimeFormat('en-CA', { timeZone: FUS, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const oraLocala = () => Number(new Intl.DateTimeFormat('en-GB', { timeZone: FUS, hour: '2-digit', hour12: false }).format(new Date()));
  const dataLocala = (ts) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: FUS, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ts));

  function parti(iso) {
    const [a, l, z] = iso.slice(0, 10).split('-').map(Number);
    return { a, l, z, d: new Date(Date.UTC(a, l - 1, z)) };
  }
  const dataScurta = (iso) => {
    const { l, z } = parti(iso);
    return `${z} ${LUNI[l - 1]}`;
  };
  const dataLunga = (iso) => {
    const { a, l, z } = parti(iso);
    return `${z} ${LUNI_LUNG[l - 1]} ${a}`;
  };
  const ziSapt = (iso) => ZILE[parti(iso).d.getUTCDay()];
  function adaugaZile(iso, n) {
    const { a, l, z } = parti(iso);
    return new Date(Date.UTC(a, l - 1, z + n)).toISOString().slice(0, 10);
  }
  const dataOra = (ts) =>
    new Date(ts).toLocaleString('ro-RO', { timeZone: FUS, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const telefonAfisat = (t) =>
    /^07\d{8}$/.test(t) ? `${t.slice(0, 4)} ${t.slice(4, 7)} ${t.slice(7)}` : t.startsWith('00') ? `+${t.slice(2)}` : t;
  const plural = (n, unu, multi) => (n === 1 ? `1 ${unu}` : `${n} ${n >= 20 ? 'de ' : ''}${multi}`);
  const eAdmin = () => stare.eu?.rol === 'admin';
  /** DNA CHIMOIU -> Dna Chimoiu (doar pentru afișare; textele scrise normal rămân neschimbate) */
  const frumos = (t) =>
    t && t === t.toUpperCase() ? t.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase()) : t || '';

  let cronometruNotificare;
  function notifica(text) {
    const el = document.getElementById('notificare');
    el.textContent = text;
    el.hidden = false;
    clearTimeout(cronometruNotificare);
    cronometruNotificare = setTimeout(() => (el.hidden = true), 4000);
  }

  class Neautentificat extends Error {}

  async function api(cale, { metoda = 'GET', corp } = {}) {
    const r = await fetch('/api' + cale, {
      method: metoda,
      headers: corp !== undefined ? { 'Content-Type': 'application/json', 'X-Cerere': '1' } : { 'X-Cerere': '1' },
      body: corp !== undefined ? JSON.stringify(corp) : undefined,
      credentials: 'same-origin',
    });
    let date = {};
    try {
      date = await r.json();
    } catch {
      /* răspuns fără conținut */
    }
    if (r.status === 401 && cale !== '/autentificare') {
      stare.eu = null;
      ecranLogare(date.eroare);
      throw new Neautentificat(date.eroare);
    }
    if (!r.ok) {
      const e = new Error(date.eroare || `Eroare ${r.status}. Încercați din nou.`);
      e.status = r.status;
      e.date = date;
      throw e;
    }
    return date;
  }

  /** Rulează o acțiune pe un buton: îl dezactivează cât durează și afișează erorile */
  async function cuButon(buton, fn, zonaEroare) {
    if (buton) buton.disabled = true;
    if (zonaEroare) zonaEroare.hidden = true;
    try {
      return await fn();
    } catch (e) {
      if (e instanceof Neautentificat) return;
      if (zonaEroare) {
        zonaEroare.textContent = e.message;
        zonaEroare.hidden = false;
      } else notifica(e.message);
    } finally {
      if (buton) buton.disabled = false;
    }
  }

  // ---------- Starea SMS-ului unei pomeni ----------
  function stareSms(p, setari, smsActiv = p.sms_activ) {
    if (p.status === 'trimis') return { text: `SMS trimis ${dataScurta(dataLocala(p.trimis_la))}`, cls: 'ok' };
    if (p.status === 'in_curs') return { text: 'Se trimite', cls: 'warn' };
    if (p.status === 'eroare') return { text: 'SMS netrimis', cls: 'bad' };
    if (p.status === 'anulat') return { text: 'Fără SMS (anulat)', cls: '' };
    if (!smsActiv) return { text: 'SMS oprit pentru familie', cls: '' };
    if (p.data_pomana <= stare.azi) return { text: 'Fără SMS', cls: '' };
    let dataSms = adaugaZile(p.data_pomana, -setari.zile_inainte);
    if (dataSms < stare.azi) dataSms = stare.azi;
    if (!setari.sms_pornit) return { text: `SMS pe ${dataScurta(dataSms)}, dacă porniți trimiterea`, cls: '' };
    if (dataSms === stare.azi) {
      if (p.incercari) return { text: 'Se reîncearcă', cls: 'warn' };
      return { text: oraLocala() < 19 ? 'SMS azi' : 'SMS mâine dimineață', cls: 'plan' };
    }
    return { text: `SMS pe ${dataScurta(dataSms)}`, cls: 'plan' };
  }
  const eticheta = ({ text, cls }) => `<span class="stare${cls ? ` stare-${cls}` : ''}">${esc(text)}</span>`;

  // ---------- Iconițe pentru meniul de pe telefon ----------
  const ic = (d) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICONITE = {
    pomeni: ic('<rect x="4" y="5" width="16" height="15" rx="1.5"/><path d="M8 3v4M16 3v4M4 10h16"/>'),
    persoane: ic('<circle cx="9" cy="8" r="3.5"/><path d="M3 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.9c1.7.8 2.7 2.4 3 5.1"/>'),
    sms: ic('<path d="M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-8l-5 3.5V17H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/><path d="M8 10h8M8 13h5"/>'),
    setari: ic('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
    cont: ic('<circle cx="12" cy="9" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6"/>'),
  };

  // ---------- Cadru și navigare ----------
  function cadru() {
    const linkuri = [
      ['#/', 'Pomeni', 'pomeni'],
      ['#/persoane', 'Persoane', 'persoane'],
      ['#/sms', 'SMS-uri', 'sms'],
      eAdmin() ? ['#/setari', 'Setări', 'setari'] : ['#/cont', 'Contul meu', 'cont'],
    ];
    app.innerHTML = `
      <header class="antet">
        <a class="marca" href="#/"><b>President</b><span>Pomeniri</span></a>
        <nav class="nav" aria-label="Meniu principal">
          ${linkuri.map(([h, t, i]) => `<a href="${h}" data-sectiune="${i}">${ICONITE[i]}<span>${t}</span></a>`).join('')}
        </nav>
        <a class="cont-buton" href="#/cont" style="text-decoration:none">${esc(stare.eu.nume || stare.eu.utilizator)}</a>
      </header>
      <main id="continut"></main>`;
    main = document.getElementById('continut');
  }

  function marcheazaMeniu(hash) {
    const sectiune = hash.startsWith('#/persoane') || hash.startsWith('#/import') ? 'persoane'
      : hash.startsWith('#/sms') ? 'sms'
      : hash.startsWith('#/setari') || hash.startsWith('#/conturi') ? 'setari'
      : hash.startsWith('#/cont') ? 'cont'
      : 'pomeni';
    document.querySelectorAll('.nav a').forEach((a) => {
      if (a.dataset.sectiune === sectiune) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  const RUTE = [
    [/^#\/?$/, () => paginaAcasa()],
    [/^#\/persoane$/, () => paginaPersoane()],
    [/^#\/persoane\/noua$/, () => paginaFormular(null)],
    [/^#\/persoane\/(\d+)$/, (m) => paginaPersoana(Number(m[1]))],
    [/^#\/persoane\/(\d+)\/editare$/, (m) => paginaFormular(Number(m[1]))],
    [/^#\/import$/, () => paginaImport()],
    [/^#\/sms$/, () => paginaSms()],
    [/^#\/setari$/, () => paginaSetari()],
    [/^#\/conturi$/, () => paginaConturi()],
    [/^#\/cont$/, () => paginaCont()],
  ];

  async function navigheaza() {
    if (!stare.eu || !main) return;
    const hash = location.hash || '#/';
    const ruta = RUTE.find(([re]) => re.test(hash));
    if (!ruta) {
      location.hash = '#/';
      return;
    }
    marcheazaMeniu(hash);
    stare.azi = aziLocal();
    main.innerHTML = '<p class="incarcare">Se încarcă…</p>';
    window.scrollTo(0, 0);
    try {
      await ruta[1](hash.match(ruta[0]));
    } catch (e) {
      if (!(e instanceof Neautentificat)) main.innerHTML = `<div class="eroare-form">${esc(e.message)}</div>`;
    }
  }
  window.addEventListener('hashchange', navigheaza);

  // ---------- Logare ----------
  function ecranLogare(mesaj) {
    main = null;
    app.innerHTML = `
      <div class="ecran-logare">
        <form class="logare" novalidate>
          <p class="marca-mare">President</p>
          <p class="subtitlu">Pomeniri și SMS-uri de amintire</p>
          <div class="eroare-form" ${mesaj && !/expirat/.test(mesaj) ? '' : 'hidden'}>${esc(mesaj)}</div>
          <div class="camp">
            <label for="utilizator">Utilizator</label>
            <input id="utilizator" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" required>
          </div>
          <div class="camp">
            <label for="parola">Parolă</label>
            <input id="parola" type="password" autocomplete="current-password" required>
          </div>
          <button class="btn" type="submit">Intră în cont</button>
        </form>
      </div>`;
    const form = app.querySelector('form');
    const eroare = form.querySelector('.eroare-form');
    form.querySelector('#utilizator').focus();
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      cuButon(
        form.querySelector('button'),
        async () => {
          const r = await api('/autentificare', {
            metoda: 'POST',
            corp: { utilizator: form.utilizator.value, parola: form.parola.value },
          });
          stare.eu = r.utilizator;
          cadru();
          navigheaza();
        },
        eroare,
      );
    });
  }

  // ---------- Pagina: Pomeni (acasă) ----------
  async function paginaAcasa() {
    const d = await api('/acasa');
    stare.azi = d.azi;
    stare.setari = d.setari;
    const s = d.setari;
    const r = d.ultima_rulare;

    let banda;
    if (!s.sms_pornit) {
      banda = `
        <div class="banda banda-oprit">
          <p><span class="punct"></span><b>SMS-urile automate sunt oprite.</b>
          Nu pleacă niciun mesaj până nu le porniți.</p>
          ${eAdmin() ? '<a class="btn btn-secundar btn-mic" href="#/setari">Pornește din Setări</a>' : '<p class="slab mic">Cereți administratorului să le pornească.</p>'}
        </div>`;
    } else {
      let ultima = '';
      if (r?.la) {
        ultima = ` Ultima verificare: ${esc(dataOra(r.la))}`;
        if (r.trimise || r.erori) ultima += `, ${plural(r.trimise, 'SMS trimis', 'SMS-uri trimise')}`;
        if (r.erori) ultima += `, ${plural(r.erori, 'eroare', 'erori')}`;
        ultima += '.';
      }
      banda = `
        <div class="banda">
          <p><span class="punct"></span>SMS-urile pleacă automat cu <b>${plural(s.zile_inainte, 'zi', 'zile')}</b> înainte de fiecare pomană, între orele 10 și 19.<span class="slab">${ultima}</span></p>
        </div>`;
    }

    let verificat = '';
    if (d.de_verificat.length) {
      verificat = `
        <div class="banda banda-eroare">
          <div>
            <p><b>${plural(d.de_verificat.length, 'SMS de verificat', 'SMS-uri de verificat')}</b></p>
            <ul class="lista">${d.de_verificat
              .map(
                (p) => `<li><a href="#/persoane/${p.persoana_id}">${esc(p.nume_sms)}</a>
                  <span class="slab mic">pomenirea de ${esc(p.pomana)}, ${esc(p.status === 'in_curs' ? 'trimitere neconfirmată' : 'nu a plecat')}</span></li>`,
              )
              .join('')}</ul>
          </div>
        </div>`;
    }

    // Grupăm pe zile
    const zile = new Map();
    for (const p of d.urmatoare) {
      if (!zile.has(p.data_pomana)) zile.set(p.data_pomana, []);
      zile.get(p.data_pomana).push(p);
    }
    const maine = adaugaZile(d.azi, 1);
    const calendar = zile.size
      ? `<div class="calendar">${[...zile]
          .map(([data, lista]) => {
            const { l, z } = parti(data);
            const etichetaZi = data === d.azi ? 'Azi' : data === maine ? 'Mâine' : '';
            return `
            <section class="zi${data === d.azi ? ' zi-azi' : ''}" aria-label="${esc(dataLunga(data))}">
              <div class="zi-data">
                <span class="zi-numar">${z}</span>
                <span class="zi-luna">${LUNI_LUNG[l - 1]}</span>
                <span class="zi-sapt">${ZILE[parti(data).d.getUTCDay()]}</span>
                ${etichetaZi ? `<span class="zi-eticheta">${etichetaZi}</span>` : ''}
              </div>
              <div class="intrari">${lista
                .map(
                  (p) => `
                <a class="intrare" href="#/persoane/${p.persoana_id}">
                  <div>
                    <div class="intrare-tip">Pomenirea de ${esc(p.pomana)}</div>
                    <div class="intrare-nume">${esc(p.nume_sms)}</div>
                    <div class="intrare-client"><span>${esc(frumos(p.client) || 'Client necompletat')}</span><span>${esc(telefonAfisat(p.telefon))}</span></div>
                  </div>
                  ${eticheta(stareSms(p, s))}
                </a>`,
                )
                .join('')}</div>
            </section>`;
          })
          .join('')}</div>`
      : `<div class="gol"><p>Nicio pomană în următoarele 30 de zile.</p><a class="btn" href="#/persoane/noua">Adaugă persoană</a></div>`;

    main.innerHTML = `
      <div class="titlu-pagina">
        <div>
          <h1>Pomenile următoare</h1>
          <p class="subtitlu">Următoarele 30 de zile. ${plural(d.statistici.persoane, 'persoană', 'persoane')} în listă, ${plural(d.statistici.trimise_luna, 'SMS trimis', 'SMS-uri trimise')} luna aceasta.</p>
        </div>
        <a class="btn" href="#/persoane/noua">Adaugă persoană</a>
      </div>
      ${banda}${verificat}
      ${calendar}`;
  }

  // ---------- Pagina: Persoane ----------
  let cautareCurenta = '';

  async function paginaPersoane() {
    main.innerHTML = `
      <div class="titlu-pagina">
        <div>
          <h1>Persoane</h1>
          <p class="subtitlu" id="total">&nbsp;</p>
        </div>
        <div class="actiuni">
          <a class="btn btn-secundar" href="#/import">Import din Excel</a>
          <a class="btn" href="#/persoane/noua">Adaugă persoană</a>
        </div>
      </div>
      <form class="cautare" role="search">
        <input type="search" name="q" placeholder="Caută după nume, client sau telefon" value="${esc(cautareCurenta)}" aria-label="Caută">
      </form>
      <ul class="lista" id="lista"></ul>
      <div class="paginare"><button class="btn btn-secundar" id="mai-multe" hidden>Arată mai multe</button></div>
      <p class="mic slab" style="margin-top:24px"><a href="/api/export.csv">Descarcă toată lista (CSV pentru Excel)</a></p>`;

    const lista = main.querySelector('#lista');
    const maiMulte = main.querySelector('#mai-multe');
    const total = main.querySelector('#total');
    let pagina = 1;
    let cerere = 0;

    async function incarca(adauga) {
      const nr = ++cerere;
      const d = await api(`/persoane?q=${encodeURIComponent(cautareCurenta)}&pagina=${pagina}`);
      if (nr !== cerere) return;
      total.textContent = cautareCurenta
        ? `${plural(d.total, 'rezultat', 'rezultate')} pentru „${cautareCurenta}"`
        : `${plural(d.total, 'persoană', 'persoane')} în listă`;
      const html = d.persoane
        .map((p) => {
          const urm = p.urmatoarea
            ? `<div>Pomenirea de ${esc(p.urmatoarea.pomana)}</div><div class="slab">${esc(ziSapt(p.urmatoarea.data_pomana))}, ${esc(dataScurta(p.urmatoarea.data_pomana))}</div>`
            : '<div class="slab">Nicio pomană viitoare</div>';
          return `
          <li><a class="rand" href="#/persoane/${p.id}">
            <div>
              <div class="rand-titlu">${esc(p.nume_sms)}</div>
              <div class="rand-detalii"><span>Deces ${esc(dataLunga(p.data_deces))}</span><span>${esc(frumos(p.client) || 'Client necompletat')}</span><span>${esc(telefonAfisat(p.telefon))}</span></div>
            </div>
            <div class="rand-dreapta">${p.sms_activ ? urm : eticheta({ text: 'SMS oprit', cls: '' })}</div>
          </a></li>`;
        })
        .join('');
      if (adauga) lista.insertAdjacentHTML('beforeend', html);
      else lista.innerHTML = html || `<li class="gol"><p>${cautareCurenta ? 'Niciun rezultat. Verificați scrierea sau căutați după telefon.' : 'Lista e goală. Adăugați prima persoană sau importați din Excel.'}</p></li>`;
      maiMulte.hidden = d.pagina * d.pe_pagina >= d.total;
    }

    let intarziere;
    main.querySelector('.cautare').addEventListener('input', (ev) => {
      clearTimeout(intarziere);
      intarziere = setTimeout(() => {
        cautareCurenta = ev.target.value.trim();
        pagina = 1;
        incarca(false).catch((e) => notifica(e.message));
      }, 250);
    });
    main.querySelector('.cautare').addEventListener('submit', (ev) => ev.preventDefault());
    maiMulte.addEventListener('click', () => {
      pagina++;
      cuButon(maiMulte, () => incarca(true));
    });
    await incarca(false);
  }

  // ---------- Pagina: o persoană ----------
  async function paginaPersoana(id, date) {
    const d = date || (await api(`/persoane/${id}`));
    const p = d.persoana;
    const s = d.setari;

    const pomeni = d.pomeni.length
      ? d.pomeni
          .map((x) => {
            const st = stareSms(x, s, p.sms_activ);
            const butoane = [];
            if (x.status === 'asteptare' && x.data_pomana > stare.azi) butoane.push(['anuleaza', 'Nu trimite SMS pentru pomana asta']);
            if (x.status === 'anulat' && x.data_pomana > stare.azi) butoane.push(['reactiveaza', 'Trimite totuși SMS']);
            if (x.status === 'eroare' || x.status === 'in_curs') {
              butoane.push(['reincearca', 'Încearcă din nou']);
              butoane.push(['marcheaza-trimis', 'Marchează ca trimis']);
            }
            return `
            <div class="pomana">
              <div>
                <h3>Pomenirea de ${esc(x.pomana)}</h3>
                <div class="slab">${esc(ziSapt(x.data_pomana))}, ${esc(dataLunga(x.data_pomana))}</div>
              </div>
              <div>${eticheta(st)}</div>
              <div class="pomana-mesaj">${esc(x.mesaj_previzualizare)}${x.segmente > 1 ? `<br><b>Atenție:</b> mesajul ocupă ${x.segmente} SMS-uri.` : ''}</div>
              ${x.status === 'eroare' || (x.incercari && x.status === 'asteptare') ? `<div class="pomana-eroare">Răspuns SMSLink: ${esc(x.raspuns || 'necunoscut')}</div>` : ''}
              ${butoane.length ? `<div class="actiuni">${butoane.map(([a, t]) => `<button class="btn-text" data-actiune="${a}" data-id="${x.id}">${t}</button>`).join('')}</div>` : ''}
            </div>`;
          })
          .join('')
      : `<p class="slab">Nu mai urmează nicio pomană pentru care să trimitem SMS${p.data_deces < adaugaZile(stare.azi, -366) ? ' (decesul e mai vechi de un an)' : ''}.</p>`;

    main.innerHTML = `
      <p><a href="#/persoane">Înapoi la persoane</a></p>
      <div class="titlu-pagina">
        <div>
          <h1>${esc(p.nume_sms)}</h1>
          <p class="subtitlu">Data decesului: ${esc(dataLunga(p.data_deces))}</p>
        </div>
        <a class="btn btn-secundar" href="#/persoane/${p.id}/editare">Modifică datele</a>
      </div>
      <div class="panou">
        <dl class="fisa">
          <dt>Client</dt><dd>${esc(frumos(p.client) || 'necompletat')}</dd>
          <dt>Telefon</dt><dd><a href="tel:${esc(telefonAfisat(p.telefon).replace(/\s/g, ''))}">${esc(telefonAfisat(p.telefon))}</a>${p.telefon.startsWith('00') ? ' <span class="slab mic">(internațional, SMS mai scump)</span>' : ''}</dd>
          ${p.note ? `<dt>Note</dt><dd style="white-space:pre-line">${esc(p.note)}</dd>` : ''}
          <dt>Adăugat</dt><dd>${esc(p.creat_de || '')} ${p.creat_la ? `<span class="slab">${esc(dataOra(p.creat_la.replace(' ', 'T') + 'Z'))}</span>` : ''}</dd>
          ${p.modificat_la ? `<dt>Modificat</dt><dd>${esc(p.modificat_de || '')} <span class="slab">${esc(dataOra(p.modificat_la.replace(' ', 'T') + 'Z'))}</span></dd>` : ''}
        </dl>
        <hr class="separator">
        <label class="comutator">
          <input type="checkbox" id="sms-activ" ${p.sms_activ ? 'checked' : ''}>
          <span class="pista"></span>
          <span><b>Trimite SMS-uri pentru această persoană</b><br>
          <span class="slab mic">Opriți dacă familia nu mai vrea mesaje.</span></span>
        </label>
      </div>
      <h2>Pomenile care urmează</h2>
      ${pomeni}
      <hr class="separator">
      <button class="btn-text btn-pericol" id="sterge">Șterge persoana din listă</button>`;

    main.querySelector('#sms-activ').addEventListener('change', (ev) => {
      const activ = ev.target.checked;
      cuButon(ev.target, async () => {
        const nou = await api(`/persoane/${id}/sms`, { metoda: 'POST', corp: { activ } });
        notifica(activ ? 'SMS-urile au fost pornite pentru această persoană.' : 'SMS-urile au fost oprite pentru această persoană.');
        paginaPersoana(id, nou);
      });
    });
    main.querySelectorAll('[data-actiune]').forEach((b) =>
      b.addEventListener('click', () =>
        cuButon(b, async () => {
          const nou = await api(`/pomeni/${b.dataset.id}/${b.dataset.actiune}`, { metoda: 'POST' });
          notifica('Gata.');
          paginaPersoana(id, nou);
        }),
      ),
    );
    main.querySelector('#sterge').addEventListener('click', (ev) => {
      if (!confirm(`Ștergeți pe ${p.nume_sms} din listă? Nu se mai trimite niciun SMS și istoricul se pierde.`)) return;
      cuButon(ev.target, async () => {
        await api(`/persoane/${id}`, { metoda: 'DELETE' });
        notifica('Persoana a fost ștearsă.');
        location.hash = '#/persoane';
      });
    });
  }

  // ---------- Pagina: adăugare / modificare ----------
  async function paginaFormular(id) {
    const p = id ? (await api(`/persoane/${id}`)).persoana : { nume: '', data_deces: '', client: '', telefon: '', note: '' };
    main.innerHTML = `
      <p><a href="${id ? `#/persoane/${id}` : '#/persoane'}">Înapoi</a></p>
      <div class="titlu-pagina"><h1>${id ? 'Modifică datele' : 'Adaugă persoană'}</h1></div>
      <form class="panou" novalidate>
        <div class="eroare-form" hidden></div>
        <div class="camp">
          <label for="nume">Numele persoanei decedate</label>
          <input id="nume" name="nume" type="text" required autocomplete="off" value="${esc(p.nume)}" placeholder="ex. Toma Maria">
          <div class="ajutor">Așa cum vreți să apară în SMS. Prescurtarea C-tin se scrie automat Constantin.</div>
        </div>
        <div class="camp">
          <label for="data_deces">Data decesului</label>
          <input id="data_deces" name="data_deces" type="date" required max="${stare.azi}" value="${esc(p.data_deces)}">
          <div class="ajutor">Pomenile se calculează singure: a 40-a zi (ziua decesului e ziua 1), la 3, 6 și 9 luni și la un an.</div>
        </div>
        <div class="grila-2">
          <div class="camp">
            <label for="client">Numele clientului</label>
            <input id="client" name="client" type="text" autocomplete="off" value="${esc(p.client)}" placeholder="ex. Dna Chimoiu">
          </div>
          <div class="camp">
            <label for="telefon">Telefonul clientului</label>
            <input id="telefon" name="telefon" type="tel" inputmode="tel" required autocomplete="off" value="${esc(p.telefon ? telefonAfisat(p.telefon) : '')}" placeholder="07xx xxx xxx">
          </div>
        </div>
        <div class="camp">
          <label for="note">Note (opțional)</label>
          <textarea id="note" name="note" rows="3" placeholder="Doar pentru uz intern, nu apar în SMS">${esc(p.note)}</textarea>
        </div>
        <div class="actiuni">
          <button class="btn" type="submit">${id ? 'Salvează modificările' : 'Adaugă persoana'}</button>
          <a class="btn btn-secundar" href="${id ? `#/persoane/${id}` : '#/persoane'}">Renunță</a>
        </div>
      </form>`;
    const form = main.querySelector('form');
    if (!id) form.nume.focus();
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const corp = {
        nume: form.nume.value,
        data_deces: form.data_deces.value,
        client: form.client.value,
        telefon: form.telefon.value,
        note: form.note.value,
      };
      cuButon(
        form.querySelector('[type=submit]'),
        async () => {
          const r = await api(id ? `/persoane/${id}` : '/persoane', { metoda: id ? 'PUT' : 'POST', corp });
          notifica(id ? 'Modificările au fost salvate.' : 'Persoana a fost adăugată și pomenile calculate.');
          location.hash = `#/persoane/${r.persoana.id}`;
        },
        form.querySelector('.eroare-form'),
      );
    });
  }

  // ---------- Pagina: import ----------
  function parseazaData(s) {
    s = String(s || '').trim();
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    let a, l, z;
    if (m) [, a, l, z] = m.map(Number);
    else {
      m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2}|\d{4})$/);
      if (!m) return null;
      [, z, l, a] = m.map(Number);
      if (a < 100) a += 2000;
    }
    const d = new Date(Date.UTC(a, l - 1, z));
    if (d.getUTCFullYear() !== a || d.getUTCMonth() !== l - 1 || d.getUTCDate() !== z) return null;
    return d.toISOString().slice(0, 10);
  }

  function imparteRand(linie, sep) {
    if (sep === '\t') return linie.split('\t');
    const celule = [];
    let cur = '';
    let ghilimele = false;
    for (let i = 0; i < linie.length; i++) {
      const c = linie[i];
      if (c === '"') {
        if (ghilimele && linie[i + 1] === '"') {
          cur += '"';
          i++;
        } else ghilimele = !ghilimele;
      } else if (c === sep && !ghilimele) {
        celule.push(cur);
        cur = '';
      } else cur += c;
    }
    celule.push(cur);
    return celule;
  }

  function parseazaTabel(text) {
    const linii = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
    if (!linii.length) return [];
    const sep = linii.some((l) => l.includes('\t')) ? '\t' : (linii[0].match(/;/g) || []).length >= (linii[0].match(/,/g) || []).length ? ';' : ',';
    let randuri = linii.map((l) => imparteRand(l, sep).map((c) => c.trim()));
    // Coloanele: după antet dacă există, altfel în ordinea nume, data, client, telefon
    let col = { nume: 0, data: 1, client: 2, telefon: 3 };
    const antet = randuri[0].map((c) => c.toLowerCase());
    if (antet.some((c) => /nume|data|telefon|client/.test(c)) && !antet.some((c) => parseazaData(c))) {
      const gaseste = (re) => antet.findIndex((c) => re.test(c));
      col = {
        nume: gaseste(/decedat|^nume$/),
        data: gaseste(/data|deces/),
        client: gaseste(/client/),
        telefon: gaseste(/telefon|tel\b|nr/),
      };
      if (col.nume < 0) col.nume = antet.findIndex((c) => c.includes('nume') && !c.includes('client'));
      randuri = randuri.slice(1);
    } else if (randuri[0].length >= 5 && !parseazaData(randuri[0][1]) && parseazaData(randuri[0][2])) {
      col = { nume: 1, data: 2, client: 3, telefon: 4 }; // ca pe foaia tipărită, cu coloana Pomeniri în față
    }
    return randuri
      .filter((r) => r.some((c) => c))
      .map((r) => {
        const rand = {
          nume: r[col.nume] ?? '',
          data_text: r[col.data] ?? '',
          client: col.client >= 0 ? (r[col.client] ?? '') : '',
          telefon: col.telefon >= 0 ? (r[col.telefon] ?? '') : '',
        };
        rand.data_deces = parseazaData(rand.data_text);
        const cifre = rand.telefon.replace(/[^\d+]/g, '');
        rand.motiv = !rand.nume || rand.nume.length < 3 ? 'Lipsește numele'
          : !rand.data_deces ? 'Data nu e recunoscută (ex. 20.09.2026)'
          : rand.data_deces > stare.azi ? 'Data e în viitor'
          : cifre.replace(/\D/g, '').length < 9 ? 'Telefon lipsă sau incomplet'
          : '';
        return rand;
      });
  }

  async function paginaImport() {
    main.innerHTML = `
      <p><a href="#/persoane">Înapoi la persoane</a></p>
      <div class="titlu-pagina">
        <div>
          <h1>Import din Excel</h1>
          <p class="subtitlu">Pentru foile mai vechi sau liste lungi.</p>
        </div>
      </div>
      <div class="panou">
        <p>Selectați în Excel coloanele <b>nume decedat, data decesului, nume client, telefon</b> (cu tot cu rândul de titlu, dacă îl aveți), copiați și lipiți aici. Merge și un fișier CSV.</p>
        <div class="camp">
          <label for="tabel">Datele copiate</label>
          <textarea id="tabel" rows="8" placeholder="TOMA MARIA&#9;20.09.2026&#9;DNA CHIMOIU&#9;0760894054"></textarea>
        </div>
        <div class="actiuni">
          <label class="btn btn-secundar" for="fisier" style="cursor:pointer">Alege fișier CSV</label>
          <input id="fisier" type="file" accept=".csv,.txt,text/csv,text/plain" hidden>
        </div>
      </div>
      <div id="previzualizare"></div>`;

    const zona = main.querySelector('#tabel');
    const prev = main.querySelector('#previzualizare');
    let randuri = [];

    function arata() {
      randuri = parseazaTabel(zona.value);
      if (!randuri.length) {
        prev.innerHTML = '';
        return;
      }
      const bune = randuri.filter((r) => !r.motiv);
      prev.innerHTML = `
        <h2>Verificați înainte de import</h2>
        <p>${plural(bune.length, 'rând bun', 'rânduri bune')}${randuri.length - bune.length ? `, <b>${plural(randuri.length - bune.length, 'rând cu probleme', 'rânduri cu probleme')}</b> care nu se importă` : ''}. Persoanele care există deja (același nume și aceeași dată) se sar.</p>
        <div class="tabel-wrap"><table>
          <thead><tr><th>Nume decedat</th><th>Data decesului</th><th>Client</th><th>Telefon</th><th></th></tr></thead>
          <tbody>${randuri
            .map(
              (r) => `<tr class="${r.motiv ? 'invalid' : ''}">
              <td>${esc(r.nume)}</td><td>${esc(r.data_deces ? dataLunga(r.data_deces) : r.data_text)}</td>
              <td>${esc(r.client)}</td><td>${esc(r.telefon)}</td><td class="motiv">${esc(r.motiv)}</td></tr>`,
            )
            .join('')}</tbody>
        </table></div>
        <div class="eroare-form" hidden style="margin-top:14px"></div>
        <div class="actiuni" style="margin-top:16px">
          <button class="btn" id="importa" ${bune.length ? '' : 'disabled'}>Importă ${plural(bune.length, 'persoană', 'persoane')}</button>
        </div>
        <div id="rezultat"></div>`;
      const buton = prev.querySelector('#importa');
      buton.addEventListener('click', () =>
        cuButon(
          buton,
          async () => {
            let adaugate = 0;
            let duplicate = 0;
            const erori = [];
            for (let i = 0; i < bune.length; i += 500) {
              const bucata = bune.slice(i, i + 500);
              const r = await api('/import', {
                metoda: 'POST',
                corp: { randuri: bucata.map(({ nume, data_deces, client, telefon }) => ({ nume, data_deces, client, telefon })) },
              });
              adaugate += r.adaugate;
              duplicate += r.duplicate;
              r.erori.forEach((e) => erori.push({ ...e, nume: bucata[e.rand - 1]?.nume }));
            }
            prev.querySelector('#rezultat').innerHTML = `
              <div class="banda" style="margin-top:16px"><div>
                <p><b>${plural(adaugate, 'persoană adăugată', 'persoane adăugate')}</b>${duplicate ? `, ${plural(duplicate, 'era deja în listă', 'erau deja în listă')}` : ''}.</p>
                ${erori.length ? `<p>Nu s-au importat:</p><ul>${erori.map((e) => `<li>${esc(e.nume)}: ${esc(e.motiv)}</li>`).join('')}</ul>` : ''}
                <p><a href="#/">Vezi pomenile următoare</a></p>
              </div></div>`;
            buton.remove();
            zona.value = '';
          },
          prev.querySelector('.eroare-form'),
        ),
      );
    }

    zona.addEventListener('input', arata);
    main.querySelector('#fisier').addEventListener('change', async (ev) => {
      const f = ev.target.files[0];
      if (!f) return;
      zona.value = await f.text();
      arata();
    });
  }

  // ---------- Pagina: istoric SMS ----------
  async function paginaSms() {
    main.innerHTML = `
      <div class="titlu-pagina"><div><h1>SMS-uri trimise</h1><p class="subtitlu">Cele mai recente primele.</p></div></div>
      <ul class="lista" id="lista"></ul>
      <div class="paginare"><button class="btn btn-secundar" id="mai-multe" hidden>Arată mai multe</button></div>`;
    const lista = main.querySelector('#lista');
    const maiMulte = main.querySelector('#mai-multe');
    let pagina = 1;
    const nume = { trimis: ['SMS trimis', 'ok'], eroare: ['Netrimis', 'bad'], in_curs: ['Neconfirmat', 'warn'], asteptare: ['Se reîncearcă', 'warn'], anulat: ['Anulat', ''] };
    async function incarca() {
      const d = await api(`/sms?pagina=${pagina}`);
      const html = d.sms
        .map((x) => {
          const [t, c] = nume[x.status] || [x.status, ''];
          const cand = x.trimis_la || x.blocat_la;
          return `<li><a class="rand" href="#/persoane/${x.persoana_id}">
            <div>
              <div class="rand-titlu">${esc(x.nume_sms)}</div>
              <div class="rand-detalii"><span>Pomenirea de ${esc(x.pomana)}, ${esc(dataScurta(x.data_pomana))}</span><span>${esc(frumos(x.client))}</span><span>${esc(telefonAfisat(x.telefon))}</span></div>
              ${x.mesaj && x.status === 'trimis' ? `<div class="rand-detalii" style="margin-top:4px">${esc(x.mesaj)}</div>` : ''}
              ${x.status !== 'trimis' && x.raspuns ? `<div class="rand-detalii" style="color:var(--bad);margin-top:4px">${esc(x.raspuns)}</div>` : ''}
            </div>
            <div class="rand-dreapta">${eticheta({ text: t, cls: c })}${cand ? `<div class="slab mic" style="margin-top:6px">${esc(dataOra(cand))}</div>` : ''}</div>
          </a></li>`;
        })
        .join('');
      if (pagina === 1 && !html) lista.innerHTML = '<li class="gol"><p>Încă n-a plecat niciun SMS.</p></li>';
      else lista.insertAdjacentHTML('beforeend', html);
      maiMulte.hidden = !d.mai_sunt;
    }
    maiMulte.addEventListener('click', () => {
      pagina++;
      cuButon(maiMulte, incarca);
    });
    await incarca();
  }

  // ---------- Pagina: setări ----------
  async function paginaSetari() {
    if (!eAdmin()) {
      location.hash = '#/cont';
      return;
    }
    const s = await api('/setari');
    const optiuniZile = [1, 2, 3, 4, 5, 6, 7, 10, 14]
      .map((n) => `<option value="${n}" ${n === s.zile_inainte ? 'selected' : ''}>${plural(n, 'zi', 'zile')} înainte</option>`)
      .join('');
    const optiuniAni = Array.from({ length: 10 }, (_, i) => i + 1)
      .map((n) => `<option value="${n}" ${n === s.ani_max ? 'selected' : ''}>${n === 1 ? 'Până la pomana de 1 an' : `Și anual, până la ${n} ani`}</option>`)
      .join('');

    main.innerHTML = `
      <div class="titlu-pagina">
        <div><h1>Setări</h1><p class="subtitlu">Doar administratorii văd această pagină.</p></div>
        <a class="btn btn-secundar" href="#/conturi">Conturi de acces</a>
      </div>
      <form class="panou" id="form-setari" novalidate>
        <div class="eroare-form" hidden></div>
        <label class="comutator camp">
          <input type="checkbox" name="sms_pornit" ${s.sms_pornit ? 'checked' : ''}>
          <span class="pista"></span>
          <span><b>Trimite SMS-urile automat</b><br><span class="slab mic">Verificarea rulează din oră în oră, între 10 și 19.</span></span>
        </label>
        <div class="grila-2">
          <div class="camp">
            <label for="zile_inainte">Când pleacă SMS-ul</label>
            <select id="zile_inainte" name="zile_inainte">${optiuniZile}</select>
            <div class="ajutor">Cu 7 zile înainte, mesajul ajunge și înaintea sâmbetei dinaintea pomenii.</div>
          </div>
          <div class="camp">
            <label for="ani_max">Pomeni anuale</label>
            <select id="ani_max" name="ani_max">${optiuniAni}</select>
          </div>
        </div>
        <div class="camp">
          <label for="mesaj">Textul SMS-ului</label>
          <textarea id="mesaj" name="mesaj" rows="4">${esc(s.mesaj)}</textarea>
          <div class="campuri-rapide" aria-label="Inserează un câmp">
            <button type="button" data-camp="{pomana}">Tipul pomenii</button>
            <button type="button" data-camp="{nume}">Numele decedatului</button>
            <button type="button" data-camp="{data}">Data pomenii</button>
          </div>
          <div class="ajutor">Diacriticele se scot automat la trimitere, ca mesajul să încapă într-un singur SMS (160 de caractere).</div>
        </div>
        <span class="eticheta">Cum arată</span>
        <div id="exemple"></div>
        <div class="actiuni"><button class="btn" type="submit">Salvează setările</button></div>
      </form>

      <h2>Verificări</h2>
      <div class="panou">
        <div class="camp">
          <label for="tel-test">Trimite un SMS de test</label>
          <div class="cautare" style="margin:0">
            <input id="tel-test" type="tel" inputmode="tel" placeholder="Numărul dumneavoastră">
            <button class="btn btn-secundar" id="trimite-test" type="button">Trimite test</button>
          </div>
          <div class="ajutor">Primiți exact mesajul de mai sus, cu un nume de exemplu. Costă cât un SMS.</div>
        </div>
        <hr class="separator">
        <div class="actiuni">
          <button class="btn btn-secundar" id="credit" type="button">Verifică creditul SMSLink</button>
          <button class="btn btn-secundar" id="ruleaza" type="button">Trimite acum SMS-urile programate</button>
        </div>
        <p class="mic slab" id="rezultat-verificari" style="margin-top:12px"></p>
      </div>`;

    const form = main.querySelector('#form-setari');
    const exemple = main.querySelector('#exemple');
    const randeazaExemple = (lista) => {
      exemple.innerHTML = lista
        .map(
          (e) => `<div class="sms-bula">${esc(e.mesaj)}</div>
          <div class="contor ${e.segmente > 1 ? 'peste' : ''}">${e.lungime} caractere, ${e.segmente > 1 ? `<b>${e.segmente} SMS-uri</b> (se plătesc ${e.segmente})` : '1 SMS'}${e.unicode ? `. Caractere speciale care măresc costul: ${esc(e.nepermise.join(' '))}` : ''}</div>`,
        )
        .join('');
    };
    randeazaExemple(s.exemple);

    let intarziere;
    form.mesaj.addEventListener('input', () => {
      clearTimeout(intarziere);
      intarziere = setTimeout(async () => {
        try {
          randeazaExemple((await api('/setari/previzualizare', { metoda: 'POST', corp: { mesaj: form.mesaj.value } })).exemple);
        } catch (e) {
          if (!(e instanceof Neautentificat)) exemple.innerHTML = `<p class="contor peste">${esc(e.message)}</p>`;
        }
      }, 350);
    });
    main.querySelectorAll('[data-camp]').forEach((b) =>
      b.addEventListener('click', () => {
        const t = form.mesaj;
        const poz = t.selectionStart ?? t.value.length;
        t.value = t.value.slice(0, poz) + b.dataset.camp + t.value.slice(t.selectionEnd ?? poz);
        t.focus();
        t.selectionStart = t.selectionEnd = poz + b.dataset.camp.length;
        t.dispatchEvent(new Event('input'));
      }),
    );

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const corp = {
        sms_pornit: form.sms_pornit.checked,
        zile_inainte: Number(form.zile_inainte.value),
        ani_max: Number(form.ani_max.value),
        mesaj: form.mesaj.value,
      };
      if (corp.sms_pornit && !s.sms_pornit && !confirm('Porniți trimiterea automată? SMS-urile programate vor începe să plece la următoarea verificare.')) return;
      cuButon(
        form.querySelector('[type=submit]'),
        async () => {
          await api('/setari', { metoda: 'PUT', corp });
          stare.setari = null;
          s.sms_pornit = corp.sms_pornit;
          notifica('Setările au fost salvate.');
        },
        form.querySelector('.eroare-form'),
      );
    });

    const rezultat = main.querySelector('#rezultat-verificari');
    main.querySelector('#trimite-test').addEventListener('click', (ev) =>
      cuButon(ev.target, async () => {
        rezultat.textContent = 'Se trimite…';
        try {
          const r = await api('/sms/test', { metoda: 'POST', corp: { telefon: main.querySelector('#tel-test').value } });
          rezultat.textContent = `SMS-ul de test a plecat. Răspuns SMSLink: ${r.raspuns}`;
        } catch (e) {
          rezultat.textContent = `SMS-ul de test nu a plecat. ${e.date?.raspuns || e.message}`;
        }
      }),
    );
    main.querySelector('#credit').addEventListener('click', (ev) =>
      cuButon(ev.target, async () => {
        const r = await api('/sms/credit');
        rezultat.textContent = `Răspuns SMSLink: ${r.raspuns}`;
      }),
    );
    main.querySelector('#ruleaza').addEventListener('click', (ev) =>
      cuButon(ev.target, async () => {
        const r = await api('/ruleaza-acum', { metoda: 'POST' });
        rezultat.textContent = r.oprit
          ? 'Trimiterea automată e oprită, deci nu a plecat nimic. Porniți-o mai sus și salvați.'
          : `Gata: ${plural(r.trimise, 'SMS trimis', 'SMS-uri trimise')}, ${plural(r.erori, 'eroare', 'erori')}${r.amanate ? `, ${r.amanate} amânate pentru ora următoare (același număr de telefon)` : ''}.`;
      }),
    );
  }

  // ---------- Pagina: conturi ----------
  async function paginaConturi() {
    if (!eAdmin()) {
      location.hash = '#/cont';
      return;
    }
    const d = await api('/utilizatori');
    main.innerHTML = `
      <p><a href="#/setari">Înapoi la setări</a></p>
      <div class="titlu-pagina">
        <div><h1>Conturi de acces</h1><p class="subtitlu">${plural(d.utilizatori.filter((u) => u.activ).length, 'cont activ', 'conturi active')}. Administratorii pot schimba setările și conturile.</p></div>
      </div>
      <ul class="lista">${d.utilizatori
        .map(
          (u) => `<li class="rand">
            <div>
              <div class="rand-titlu">${esc(u.nume)} ${u.activ ? '' : eticheta({ text: 'Dezactivat', cls: '' })}</div>
              <div class="rand-detalii"><span>${esc(u.utilizator)}</span><span>${u.rol === 'admin' ? 'Administrator' : 'Operator'}</span><span>${u.ultima_logare ? `Ultima intrare ${esc(dataOra(u.ultima_logare.replace(' ', 'T') + 'Z'))}` : 'Nu a intrat încă'}</span></div>
            </div>
            <div class="rand-dreapta"><button class="btn btn-secundar btn-mic" data-modifica="${u.id}">Modifică</button></div>
          </li>`,
        )
        .join('')}</ul>
      <h2 id="titlu-form">Cont nou</h2>
      <form class="panou" novalidate>
        <div class="eroare-form" hidden></div>
        <div class="grila-2">
          <div class="camp">
            <label for="u-nume">Numele persoanei</label>
            <input id="u-nume" name="nume" type="text" autocomplete="off" required>
          </div>
          <div class="camp">
            <label for="u-utilizator">Utilizator (pentru logare)</label>
            <input id="u-utilizator" name="utilizator" type="text" autocapitalize="none" spellcheck="false" autocomplete="off" required placeholder="ex. maria">
          </div>
          <div class="camp">
            <label for="u-parola">Parolă</label>
            <input id="u-parola" name="parola" type="text" autocomplete="new-password" placeholder="cel puțin 8 caractere">
            <div class="ajutor" id="ajutor-parola">Comunicați-i parola; o poate schimba din „Contul meu".</div>
          </div>
          <div class="camp">
            <label for="u-rol">Rol</label>
            <select id="u-rol" name="rol">
              <option value="operator">Operator (adaugă persoane, vede SMS-urile)</option>
              <option value="admin">Administrator (și setări, conturi)</option>
            </select>
          </div>
        </div>
        <label class="comutator camp" id="camp-activ" hidden>
          <input type="checkbox" name="activ" checked>
          <span class="pista"></span>
          <span><b>Contul poate intra în panou</b></span>
        </label>
        <div class="actiuni">
          <button class="btn" type="submit">Creează contul</button>
          <button class="btn btn-secundar" type="button" id="renunta" hidden>Renunță</button>
        </div>
      </form>`;

    const form = main.querySelector('form');
    let editat = null;
    const resetForm = () => {
      editat = null;
      form.reset();
      form.utilizator.disabled = false;
      main.querySelector('#titlu-form').textContent = 'Cont nou';
      form.querySelector('[type=submit]').textContent = 'Creează contul';
      main.querySelector('#camp-activ').hidden = true;
      main.querySelector('#renunta').hidden = true;
      main.querySelector('#ajutor-parola').textContent = 'Comunicați-i parola; o poate schimba din „Contul meu".';
    };
    main.querySelector('#renunta').addEventListener('click', resetForm);
    main.querySelectorAll('[data-modifica]').forEach((b) =>
      b.addEventListener('click', () => {
        const u = d.utilizatori.find((x) => x.id === Number(b.dataset.modifica));
        editat = u.id;
        form.nume.value = u.nume;
        form.utilizator.value = u.utilizator;
        form.utilizator.disabled = true;
        form.parola.value = '';
        form.rol.value = u.rol;
        form.activ.checked = !!u.activ;
        main.querySelector('#titlu-form').textContent = `Modifică contul lui ${u.nume}`;
        form.querySelector('[type=submit]').textContent = 'Salvează contul';
        main.querySelector('#camp-activ').hidden = false;
        main.querySelector('#renunta').hidden = false;
        main.querySelector('#ajutor-parola').textContent = 'Lăsați gol ca să rămână parola veche. O parolă nouă îl scoate din cont de pe toate dispozitivele.';
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        form.nume.focus();
      }),
    );
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const corp = { nume: form.nume.value, utilizator: form.utilizator.value, parola: form.parola.value, rol: form.rol.value, activ: form.activ.checked };
      cuButon(
        form.querySelector('[type=submit]'),
        async () => {
          await api(editat ? `/utilizatori/${editat}` : '/utilizatori', { metoda: editat ? 'PUT' : 'POST', corp });
          notifica(editat ? 'Contul a fost salvat.' : 'Contul a fost creat.');
          paginaConturi();
        },
        form.querySelector('.eroare-form'),
      );
    });
  }

  // ---------- Pagina: contul meu ----------
  async function paginaCont() {
    main.innerHTML = `
      <div class="titlu-pagina">
        <div><h1>Contul meu</h1><p class="subtitlu">${esc(stare.eu.nume)}, utilizator ${esc(stare.eu.utilizator)}, ${stare.eu.rol === 'admin' ? 'administrator' : 'operator'}.</p></div>
      </div>
      <form class="panou" novalidate>
        <h3>Schimbă parola</h3>
        <div class="eroare-form" hidden style="margin-top:10px"></div>
        <div class="grila-2" style="margin-top:12px">
          <div class="camp"><label for="p-veche">Parola actuală</label><input id="p-veche" name="veche" type="password" autocomplete="current-password"></div>
          <div class="camp"><label for="p-noua">Parola nouă</label><input id="p-noua" name="noua" type="password" autocomplete="new-password" placeholder="cel puțin 8 caractere"></div>
        </div>
        <button class="btn" type="submit">Schimbă parola</button>
      </form>
      <div class="actiuni">
        <button class="btn btn-secundar" id="iesire">Ieși din cont</button>
        <button class="btn-text" id="iesire-tot">Ieși de pe toate dispozitivele</button>
      </div>`;
    const form = main.querySelector('form');
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      cuButon(
        form.querySelector('[type=submit]'),
        async () => {
          await api('/eu/parola', { metoda: 'POST', corp: { parola_veche: form.veche.value, parola_noua: form.noua.value } });
          form.reset();
          notifica('Parola a fost schimbată. Celelalte dispozitive au ieșit din cont.');
        },
        form.querySelector('.eroare-form'),
      );
    });
    main.querySelector('#iesire').addEventListener('click', async () => {
      await api('/deconectare', { metoda: 'POST' }).catch(() => {});
      stare.eu = null;
      ecranLogare();
    });
    main.querySelector('#iesire-tot').addEventListener('click', async (ev) => {
      if (!confirm('Ieșiți din cont pe toate telefoanele și calculatoarele?')) return;
      await cuButon(ev.target, () => api('/deconectare-peste-tot', { metoda: 'POST' }));
      stare.eu = null;
      ecranLogare();
    });
  }

  // ---------- Pornire ----------
  (async () => {
    try {
      const r = await api('/eu');
      stare.eu = r.utilizator;
      cadru();
      navigheaza();
    } catch (e) {
      if (!(e instanceof Neautentificat)) ecranLogare(e.message);
    }
  })();
})();
