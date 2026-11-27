import { GROUPS, NORMS, SOURCES, WARNINGS, NORM_VERSION, AGE_LABEL } from './guidelines.js';
import { getFood, VAK_LABEL, UNIT_SOURCE } from './foods.js';
import { matchFood, searchFoods, parseList, splitFree, normalize, cleanName } from './match.js';
import { iso, addDays, ageGroup, statusFor, dayStats, assessWeek, advise, goodGroups } from './logic.js';
import { KEY, uid, blank, load, validBackup, fromBackup } from './store.js';

let store = null;
try { store = window.localStorage; } catch { /* geen opslag */ }
let S = store ? load(store) : blank();
let saveFailed = false;
const save = () => {
  try { store.setItem(KEY, JSON.stringify(S)); saveFailed = false; } catch { saveFailed = true; }
  try { navigator.storage?.persist?.(); } catch { /* optioneel */ }
};

const today = iso(new Date());
const ui = { tab: 'dag', date: today, child: S.children[0]?.id || null, meal: null, cls: null, imp: null, msg: '', confirm: null, restore: null, pf: '' };
const $app = document.getElementById('app');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const G = Object.fromEntries(GROUPS.map((g) => [g.id, g]));
const SRC = Object.fromEntries(SOURCES.map((s) => [s.id, s]));
const MOMENTS = [['ontbijt', 'Ontbijt'], ['tussen', 'Tussendoor'], ['lunch', 'Lunch'], ['avond', 'Avondeten']];
const MOMENT_LABEL = Object.fromEntries(MOMENTS);
const nf = (v, d = 1) => (Math.round(v * 10 ** d) / 10 ** d).toLocaleString('nl-NL');
const FR = { 0.25: '¼', 0.5: '½', 0.75: '¾', 0.33: '⅓', 0.67: '⅔' };
const fr = (q) => { const w = Math.floor(q + 1e-9), r = Math.round((q - w) * 100) / 100; return r && FR[r] ? `${w || ''}${FR[r]}` : nf(q); };
const food = (id) => getFood(id, S.custom);
const kid = () => S.children.find((c) => c.id === ui.child) || S.children[0];
const kidName = (id) => S.children.find((c) => c.id === id)?.name || '';
const ctx = () => ({ learn: S.learn, custom: S.custom });
const isBase = (u) => ['g', 'ml', 'rauw'].includes(u.k);
const unitOf = (f, k) => f.units.find((u) => u.k === k) || f.units.at(-1);
const baseLabel = (f) => (f.vak === 'ei' ? 'ei' : f.units.at(-1).k);
const BADGE = { in: ['in', 'In de Schijf'], uit: ['uit', 'Buiten de Schijf'], '?': ['twijfel', 'Onzeker'], neutraal: ['neutraal', 'Neutraal'], geen: ['geen', 'Geen voeding'] };
const badge = (st, small) => `<span class="badge ${BADGE[st]?.[0] || 'twijfel'}${small ? ' dot' : ''}" title="${esc(BADGE[st]?.[1] || 'Onzeker')}">${small ? '' : esc(BADGE[st]?.[1] || 'Onzeker')}</span>`;
const dateLabel = (d) => {
  if (d === today) return 'Vandaag';
  if (d === addDays(today, -1)) return 'Gisteren';
  const [y, m, dd] = d.split('-').map(Number);
  return new Date(y, m - 1, dd).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'short' });
};
const guessMoment = () => { const h = new Date().getHours(); return h < 10 ? 'ontbijt' : h < 12 ? 'tussen' : h < 14 ? 'lunch' : h < 17 ? 'tussen' : 'avond'; };
const srcLink = (id) => (SRC[id] ? `<a class="src" href="${SRC[id].url}" target="_blank" rel="noopener">Bron: ${esc(SRC[id].title)}</a>` : '');

function childBar() {
  if (S.children.length < 2) return '';
  return `<div class="seg" role="tablist" aria-label="Kind">${S.children.map((c) =>
    `<button role="tab" aria-selected="${c.id === kid().id}" data-act="child" data-id="${c.id}">${esc(c.name)}</button>`).join('')}</div>`;
}

// ---------- Vandaag ----------
function bar(value, min, max, g, status) {
  if (min === null) return '';
  const top = (max || 1) * (g.kind === 'max' ? 1 : 1.25);
  const band = g.kind === 'max' ? '' : `<i class="band" style="left:${(min / top) * 100}%;width:${((max - min) / top) * 100}%"></i>`;
  return `<div class="bar ${status}">${band}<b style="width:${Math.min(100, (value / top) * 100)}%"></b></div>`;
}
const normTxt = (min, max, g) => {
  if (min === null) return '';
  const u = g.unit === 'st' ? '' : ` ${g.unit}`;
  if (g.kind === 'max') return `max ${nf(max)}${u}`;
  return min === max ? `${nf(min)}${u}` : `${nf(min)}–${nf(max)}${u}`;
};
const amt = (v, g) => `${nf(g.unit === 'st' ? v : Math.round(v))}${g.unit === 'st' ? '' : ` ${g.unit}`}`;

function itemQty(it, kidId) {
  const f = food(it.f), u = unitOf(f, it.u);
  const q = it.q?.[kidId];
  if (q && !isBase(u)) return `${fr(q)} ${u.label}`;
  const g = it.a[kidId];
  return f.vak === 'ei' ? `${fr(g)} ei` : `${nf(Math.round(g))} ${baseLabel(f)}`;
}

function viewDag() {
  const c = kid(), grp = ageGroup(c.birth, ui.date), norms = NORMS[grp] || {};
  const st = dayStats(S, c.id, ui.date, grp);
  const wk = assessWeek(S, c.id, ui.date, grp);
  const W = Object.fromEntries(wk.rows.map((r) => [r.id, r]));
  const pk = `${ui.date}|${c.id}`;
  const order = (m) => { const i = MOMENTS.findIndex((x) => x[0] === m); return i < 0 ? 9 : i; };
  const meals = S.meals.filter((m) => m.d === ui.date && m.it.some((it) => it.a[c.id])).sort((a, b) => order(a.m) - order(b.m));
  const row = (g) => {
    const [min, max] = norms[g.id] || [null, null];
    const isW = g.period === 'week';
    const v = isW ? W[g.id].value : st.t[g.id] || 0;
    const s = isW ? W[g.id].status : min !== null && v >= min ? 'ok' : 'none';
    return `<li class="row${g.derived ? ' sub' : ''}"><div class="rt"><span class="nm">${esc(g.short || g.label)}</span>
      <span class="num">${amt(v, g)}${min !== null ? `<small> / ${normTxt(min, max, g)}</small>` : ''}</span></div>${bar(v, min, max, g, s)}</li>`;
  };
  const tip = ui.date === today ? advise(wk, grp)[0] : null;
  const y = addDays(ui.date, -1);
  const hasY = S.meals.some((m) => m.d === y && m.it.some((it) => it.a[c.id]));
  return `
  <header class="top"><div class="datenav">
    <button data-act="day" data-n="-1" aria-label="Vorige dag">‹</button>
    <h1>${esc(dateLabel(ui.date))}</h1>
    <button data-act="day" data-n="1" aria-label="Volgende dag" ${ui.date >= today ? 'disabled' : ''}>›</button></div>
    ${childBar()}</header>
  ${grp ? '' : `<p class="note warn">Voor ${esc(c.name)} is geen norm beschikbaar. De app ondersteunt 1 t/m 9 jaar; controleer de geboortemaand onder Meer.</p>`}
  <button class="btn big" data-act="newmeal">+ Eten toevoegen</button>
  ${meals.length ? `<div class="meals">${meals.map((m) => `<button class="meal" data-act="editmeal" data-id="${m.id}">
      <span class="mh">${esc(MOMENT_LABEL[m.m] || 'Overig')}${m.g ? ' · gezinsgerecht' : ''}</span>
      <ul>${m.it.filter((it) => it.a[c.id]).map((it) => `<li>${badge(statusFor(food(it.f), grp), true)}<span class="iname">${esc(it.n || food(it.f).name)}</span><span class="num">${esc(itemQty(it, c.id))}</span></li>`).join('')}</ul></button>`).join('')}</div>`
    : `<p class="note">Nog niets ingevoerd voor ${esc(c.name)}.</p>${hasY ? `<button class="btn ghost" data-act="copyday">Neem alles van ${esc(dateLabel(y)).toLowerCase()} over</button>` : ''}`}
  ${tip ? `<div class="tip"><span class="eyebrow">Belangrijkste tip deze week</span><strong>${esc(tip.title)}</strong><p>${esc(tip.text)}</p><button class="linkbtn" data-act="tab" data-id="week">Alle adviezen</button></div>` : ''}
  <div class="toggles">
    ${grp === '1-3' ? `<label><input type="checkbox" id="vitd" data-act="vitd" ${S.vitd[pk] ? 'checked' : ''}> Vitamine D gegeven</label>` : ''}
    <label><input type="checkbox" id="partial" data-act="partial" ${S.partial[pk] ? 'checked' : ''}> Dag niet compleet (bijv. opvang)</label>
  </div>
  <h2>Per dag <small>${grp ? esc(AGE_LABEL[grp]) : ''}</small></h2>
  <ul class="rows">${GROUPS.filter((g) => g.period === 'day').map(row).join('')}</ul>
  <h2>Per week <small>laatste 7 dagen</small></h2>
  <ul class="rows">${GROUPS.filter((g) => g.period === 'week').map(row).join('')}</ul>
  ${st.out.length ? `<h2>Buiten de Schijf vandaag</h2><p class="note">${st.out.map((o) => esc(o.label)).join(', ')}</p>` : ''}`;
}

// ---------- Advies ----------
const STATUS = { under: 'Te weinig', todo: 'Nog te gaan', ok: 'Op koers', over: 'Boven richtlijn', none: '–' };
function viewWeek() {
  const c = kid(), grp = ageGroup(c.birth, today);
  const a = assessWeek(S, c.id, today, grp);
  const adv = advise(a, grp);
  const good = goodGroups(a);
  const card = (x) => `<li class="adv ${x.kind}"><strong>${esc(x.title)}</strong><p>${esc(x.text)}</p>${srcLink(x.src)}</li>`;
  return `
  <header class="top"><h1>Advies</h1>${childBar()}</header>
  ${!grp ? `<p class="note">Geen norm beschikbaar voor ${esc(c.name)}.</p>` : !a.loggedDays ? '<p class="note">Voer een paar dagen in wat je kind eet; dan verschijnt hier het advies.</p>' : `
  <p class="note">Laatste 7 dagen: ${a.fullDays} van 7 dagen volledig ingevuld${a.loggedDays > a.fullDays ? `, ${a.loggedDays - a.fullDays} niet compleet` : ''}. Daggroepen zijn het gemiddelde over de volledige dagen.</p>
  ${adv.length ? `<h2>Eerst aanpakken</h2><ul class="advs">${adv.slice(0, 3).map(card).join('')}</ul>` : '<p class="note ok">Geen aandachtspunten. Alles op koers.</p>'}
  ${good.length ? `<h2>Op koers</h2><div class="chips">${good.map((g) => `<span class="chip on static">${esc(g)}</span>`).join('')}</div>` : ''}
  ${adv.length > 3 ? `<h2>Verder</h2><ul class="advs">${adv.slice(3).map(card).join('')}</ul>` : ''}
  <details><summary>Alle groepen in detail</summary>
  <div class="scroll"><table class="wk"><thead><tr><th>Groep</th><th>Gemeten</th><th>Richtlijn</th><th>Status</th></tr></thead><tbody>
  ${a.rows.map((r) => { const g = G[r.id]; return `<tr class="${g.derived ? 'sub' : ''}"><td>${esc(g.short || g.label)}</td>
    <td class="num">${r.value === null ? '–' : amt(r.value, g)}</td><td class="num">${normTxt(r.min, r.max, g)}${g.period === 'day' ? '/dag' : '/wk'}</td>
    <td><span class="pill ${r.status}">${STATUS[r.status]}</span></td></tr>`; }).join('')}</tbody></table></div>
  <p class="fine">Variatie: ${a.groenteSoorten} soorten groente en ${a.fruitSoorten} soorten fruit. Producten buiten de Schijf tellen niet mee voor hun groep; vlees telt altijd mee voor de bovengrens.</p>
  </details>
  <p class="fine">Adviezen volgen de genoemde Voedingscentrum-pagina’s. De volgorde en de marges (−20% / +25%) zijn keuzes van de app.</p>`}`;
}

// ---------- Producten ----------
function viewProducten() {
  const f = normalize(ui.pf);
  const prods = S.products.filter((p) => !f || normalize(p.n).includes(f) || normalize(food(p.f).name).includes(f))
    .sort((a, b) => a.n.localeCompare(b.n, 'nl'));
  return `
  <header class="top"><h1>Producten</h1></header>
  <section class="card">
    <h2>Boodschappen importeren</h2>
    ${ui.imp ? importReview() : `
    <p class="note">Plak de productlijst van je AH-bestelling of kassabon. De app herkent elke regel; prijzen en aantallen worden genegeerd.</p>
    <textarea id="imp" rows="6" placeholder="AH Halfvolle melk&#10;AH Volkoren tijgerbrood&#10;AH Bananen" aria-label="Productlijst"></textarea>
    <button class="btn" data-act="recognize">Herken producten</button>
    ${ui.msg ? `<p class="note warn">${esc(ui.msg)}</p>` : ''}
    <details><summary>Zo kopieer je de lijst op je iPhone</summary>
      <ol class="steps"><li>Open je bestelling in de AH-app of op ah.nl en maak een screenshot (of meerdere).</li>
      <li>Open het screenshot in Foto’s en houd je vinger op de tekst tot die gemarkeerd wordt.</li>
      <li>Kies Selecteer alles en daarna Kopieer.</li><li>Plak de tekst hier en tik op Herken producten.</li></ol></details>`}
  </section>
  <h2>Mijn producten <small>${S.products.length}</small></h2>
  ${S.products.length ? `<input id="pf" type="search" placeholder="Zoek in mijn producten" value="${esc(ui.pf)}" aria-label="Zoek in mijn producten">
  <ul class="plist">${prods.map((p) => { const fd = food(p.f); return `<li>${badge(fd.st, true)}<div class="pn"><span>${esc(p.n)}</span><small>${esc(fd.name)} · ${esc(BADGE[fd.st]?.[1] || '')}</small></div>
    <button class="linkbtn" data-act="cls" data-type="prod" data-id="${p.id}">Wijzig</button><button class="x" data-act="delprod" data-id="${p.id}" aria-label="${esc(p.n)} verwijderen">×</button></li>`; }).join('')}</ul>`
    : '<p class="note">Nog geen producten. Importeer je boodschappen of voeg eten toe; wat je invoert, verschijnt hier vanzelf.</p>'}
  <h2>Vaste maaltijden <small>${S.recipes.length}</small></h2>
  ${S.recipes.length ? `<ul class="plist">${S.recipes.map((r) => `<li><div class="pn"><span>${esc(r.n)}</span><small>${r.it.length} ingrediënten${r.mode === 'gezin' ? ' · gezinsgerecht' : ''}</small></div>
    <button class="x" data-act="delrecipe" data-id="${r.id}" aria-label="${esc(r.n)} verwijderen">×</button></li>`).join('')}</ul>`
    : '<p class="note">Bewaar een maaltijd als vaste maaltijd (onderaan bij Eten toevoegen) om hem later met één tik in te voeren.</p>'}`;
}

function importReview() {
  const rows = ui.imp;
  const n = rows.filter((r) => r.on).length;
  const unsure = rows.filter((r) => r.on && !r.sure).length;
  return `<p class="note">${rows.length} producten gevonden${unsure ? `, ${unsure} om te controleren` : ''}. Tik op Wijzig als de indeling niet klopt.</p>
  <ul class="plist imp">${rows.map((r, i) => { const fd = food(r.f); return `<li class="${r.sure ? '' : 'unsure'}">
    <input type="checkbox" id="imp${i}" data-act="impon" data-i="${i}" ${r.on ? 'checked' : ''} aria-label="${esc(r.name)} meenemen">
    ${badge(fd.st, true)}<div class="pn"><span>${esc(r.name)}</span><small>${esc(fd.name)} · ${esc(BADGE[fd.st]?.[1] || '')}${r.sure ? '' : ' · controleer'}</small></div>
    <button class="linkbtn" data-act="cls" data-type="imp" data-id="${i}">Wijzig</button></li>`; }).join('')}</ul>
  <div class="btns"><button class="btn ghost" data-act="impcancel">Annuleer</button><button class="btn" data-act="impsave">${n} opslaan</button></div>`;
}

// ---------- Meer ----------
function viewMeer() {
  const kids = S.children.length ? S.children : [{ id: '', name: '', birth: '' }, { id: '', name: '', birth: '' }];
  const first = !S.children.length;
  let used = 0;
  try { used = (store.getItem(KEY) || '').length; } catch { /* onbekend */ }
  return `
  <header class="top"><h1>${first ? 'Kindervoeding' : 'Meer'}</h1></header>
  ${first ? '<p class="note">Vul per kind een naam (of bijnaam) en geboortemaand in. De leeftijd bepaalt welke norm geldt. Alles blijft op dit toestel.</p>' : ''}
  <h2>Kinderen</h2>
  <form id="kids">${kids.map((c, i) => `<div class="kidrow" data-id="${c.id}">
    <input id="kn${i}" name="name" placeholder="Naam" aria-label="Naam kind ${i + 1}" value="${esc(c.name)}" maxlength="20">
    <input id="kb${i}" name="birth" type="month" aria-label="Geboortemaand kind ${i + 1}" value="${esc(c.birth)}" max="${today.slice(0, 7)}"></div>`).join('')}
    <div class="btns"><button class="btn" type="submit">Opslaan</button>
    ${kids.length < 4 ? '<button class="btn ghost" type="button" data-act="addkid">Kind toevoegen</button>' : ''}</div></form>
  ${ui.msg ? `<p class="note ok">${esc(ui.msg)}</p>` : ''}
  ${first ? '' : `
  <h2>Backup</h2>
  <p class="note">Je gegevens staan alleen op dit toestel. Bewaar af en toe een backup, bijvoorbeeld in de app Bestanden.</p>
  <div class="btns"><button class="btn ghost" data-act="sharebk">Bewaar backup</button>
  <label class="btn ghost file">Zet backup terug<input type="file" id="bkfile" accept=".json,application/json"></label></div>
  ${ui.restore ? `<div class="card"><p class="note">Backup met ${ui.restore.children.length} kind(eren) en ${(ui.restore.meals || ui.restore.entries).length} invoeren. Terugzetten vervangt alles op dit toestel.</p>
    <div class="btns"><button class="btn ghost" data-act="restorecancel">Annuleer</button><button class="btn danger" data-act="restore">Vervang alles</button></div></div>` : ''}
  <p class="fine">Opslag in gebruik: ${nf(used / 1024, 0)} kB.</p>
  <h2>Normen</h2>
  <p class="note">${esc(NORM_VERSION)}. Hoeveelheden zijn gemiddelden, geen dagelijkse eis.</p>
  <div class="scroll"><table class="wk"><thead><tr><th>Groep</th><th>1–3 jaar</th><th>4–9 jaar</th></tr></thead><tbody>
  ${GROUPS.map((g) => `<tr><td>${esc(g.label)}</td>${['1-3', '4-9'].map((k) => `<td class="num">${normTxt(...NORMS[k][g.id], g)}${g.period === 'day' ? '/dag' : '/wk'}</td>`).join('')}</tr>`).join('')}
  </tbody></table></div>
  <h2>Let op bij 1–3 jaar</h2>
  <ul class="tips">${WARNINGS.map(([t, s]) => `<li>${esc(t)} ${srcLink(s)}</li>`).join('')}</ul>
  <h2>Hoe de app rekent</h2>
  <ul class="tips">
    <li>Elk product is ingedeeld volgens de criteria per productgroep van het Voedingscentrum. Hangt het oordeel af van het etiket (zout, suiker, verrijking), dan staat het product als onzeker. ${srcLink('criteria')}</li>
    <li>Producten buiten de Schijf tellen niet mee voor hun groep. Vlees en rood vlees tellen altijd mee voor de bovengrens.</li>
    <li>Portiegroottes zoals snee, plakje en stuk zijn schattingen van de app; bij elke invoer zie je de grammen en kun je ze aanpassen. ${esc(UNIT_SOURCE.ol)}</li>
    <li>Ongekookte pasta, rijst en peulvruchten rekent de app om naar gekookt gewicht (schatting: pasta ×2,5, rijst ×2,7).</li>
    <li>Deze app is een hulpmiddel en geen medisch of diëtistisch advies.</li></ul>
  <h2>Bronnen</h2>
  <ul class="tips">${SOURCES.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.title)}</a></li>`).join('')}</ul>
  <h2>Alles wissen</h2>
  <button class="btn danger" data-act="wipe">${ui.confirm === 'wipe' ? 'Zeker weten? Tik nogmaals' : 'Wis alle gegevens'}</button>`}`;
}

// ---------- Eten toevoegen ----------
function itemGrams(it, kidId, m = ui.meal) {
  const u = unitOf(food(it.f), it.u);
  if (m.mode === 'gezin') return (it.tq || 0) * u.g * (m.s[kidId] || 0) / (m.p || 1);
  return (it.q[kidId] || 0) * u.g;
}
const stepOf = (u) => (isBase(u) ? (u.k === 'ml' ? 25 : 10) : 0.5);
const defaultUnit = (f, mode) => (mode === 'gezin' ? (f.units.find((u) => u.k === 'rauw') || f.units.at(-1)) : f.units[0]);
function newItem(f, n, mode, kids) {
  const fd = food(f), u = defaultUnit(fd, mode);
  const q0 = isBase(u) ? (u.k === 'ml' ? 150 : 50) : 1;
  return { k: uid(), f, n, u: u.k, q: Object.fromEntries(kids.map((k) => [k, q0])), tq: isBase(u) ? 100 : 1 };
}

function frequent(m) {
  const cnt = new Map();
  for (const meal of S.meals.slice(-300)) {
    if (m && meal.m !== m) continue;
    for (const it of meal.it) { const k = `${it.f}|${it.n || ''}`; cnt.set(k, (cnt.get(k) || 0) + 1); }
  }
  return [...cnt.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k]) => { const i = k.indexOf('|'); const f = k.slice(0, i), n = k.slice(i + 1); return { f, n: n || food(f).name }; });
}

function resultsHtml(q) {
  const m = ui.meal;
  if (!q.trim()) {
    const fq = frequent(m.m);
    const y = S.meals.filter((x) => x.d === addDays(m.d, -1) && x.m === m.m && x.m);
    const rec = S.recipes.slice(0, 6);
    if (!y.length && !rec.length && !fq.length) return '<p class="fine">Typ wat je kind at, bijvoorbeeld “volkoren boterham”, “banaan” of “zilvervliesrijst”. Meerdere dingen tegelijk kan ook: “boterham met kaas, appel”.</p>';
    return `<div class="chips">${y.length ? '<button class="chip" data-act="sameasy">Zelfde als gisteren</button>' : ''}
      ${rec.map((r) => `<button class="chip rec" data-act="addrecipe" data-id="${r.id}">${esc(r.n)}</button>`).join('')}
      ${fq.map((x) => `<button class="chip" data-act="pick" data-f="${esc(x.f)}" data-n="${esc(x.n)}">${esc(x.n)}</button>`).join('')}</div>`;
  }
  const qn = normalize(q);
  const prods = S.products.filter((p) => normalize(p.n).includes(qn)).slice(0, 4);
  const recs = S.recipes.filter((r) => normalize(r.n).includes(qn)).slice(0, 3);
  const ids = searchFoods(q, ctx(), 7);
  const parts = splitFree(q);
  return `<ul class="res">
    ${parts.length > 1 ? `<li><button data-act="addfree"><span class="badge twijfel dot"></span><span>Voeg ${parts.length} dingen toe: ${esc(parts.join(', '))}</span></button></li>` : ''}
    ${recs.map((r) => `<li><button data-act="addrecipe" data-id="${r.id}"><span class="badge neutraal dot"></span><span>${esc(r.n)}</span><small>vaste maaltijd</small></button></li>`).join('')}
    ${prods.map((p) => `<li><button data-act="pick" data-f="${esc(p.f)}" data-n="${esc(p.n)}">${badge(food(p.f).st, true)}<span>${esc(p.n)}</span><small>${esc(food(p.f).name)}</small></button></li>`).join('')}
    ${ids.map((id) => `<li><button data-act="pick" data-f="${id}" data-n="">${badge(food(id).st, true)}<span>${esc(food(id).name)}</span><small>${esc(VAK_LABEL[food(id).vak] || '')}</small></button></li>`).join('')}
    ${parts.length <= 1 ? `<li><button data-act="addfree"><span class="badge twijfel dot"></span><span>“${esc(q.trim())}” toevoegen</span><small>app herkent het zelf</small></button></li>` : ''}
  </ul>`;
}

function mealSheet() {
  const m = ui.meal; if (!m) return '';
  const grpOf = (id) => ageGroup(S.children.find((c) => c.id === id)?.birth, m.d);
  const itemHtml = (it) => {
    const fd = food(it.f), u = unitOf(fd, it.u);
    const st = statusFor(fd, grpOf(m.kids[0]));
    const qtyCtl = (val, attr) => `<div class="qty"><button type="button" data-act="step" data-k="${it.k}" ${attr} data-n="-1" aria-label="Minder">−</button>
      <input type="number" inputmode="decimal" min="0" step="any" value="${Math.round((val || 0) * 100) / 100}" data-act="qtyin" data-k="${it.k}" ${attr} aria-label="Hoeveelheid">
      <button type="button" data-act="step" data-k="${it.k}" ${attr} data-n="1" aria-label="Meer">+</button></div>`;
    const grams = (k) => `${esc(kidName(k))} ≈ ${nf(itemGrams(it, k), fd.vak === 'ei' ? 1 : 0)} ${baseLabel(fd)}`;
    return `<li class="item">
      <div class="ih">${badge(st)}<span class="nm">${esc(it.n || fd.name)}</span><button type="button" class="x" data-act="rmitem" data-k="${it.k}" aria-label="Verwijder ${esc(it.n || fd.name)}">×</button></div>
      <button type="button" class="linkbtn cls" data-act="cls" data-type="item" data-id="${it.k}">${esc(fd.name)} · wijzig</button>
      ${fd.note ? `<p class="fine">${esc(fd.note)}</p>` : ''}
      <div class="iq"><select data-act="unit" data-k="${it.k}" aria-label="Eenheid">${fd.units.map((x) => `<option value="${x.k}" ${x.k === u.k ? 'selected' : ''}>${esc(x.label)}${x.k === 'rauw' ? ` (×${nf(x.g)} gekookt)` : isBase(x) ? '' : ` (${nf(x.g)} ${baseLabel(fd)})`}</option>`).join('')}</select>
      ${m.mode === 'gezin' ? `<div class="kq"><span>Hele gerecht</span>${qtyCtl(it.tq, '')}</div>`
        : m.kids.map((k) => `<div class="kq"><span>${esc(kidName(k))}</span>${qtyCtl(it.q[k], `data-kid="${k}"`)}</div>`).join('')}
      </div>
      ${m.mode === 'gezin' || !isBase(u) || u.k === 'rauw' ? `<p class="fine">${m.kids.map(grams).join(' · ')}</p>` : ''}
    </li>`;
  };
  return `<div class="scrim" data-act="closemeal"></div>
  <div class="sheet" role="dialog" aria-label="Eten toevoegen">
    <div class="sh"><h2>${m.id ? 'Maaltijd wijzigen' : 'Eten toevoegen'}</h2><span class="fine">${esc(dateLabel(m.d))}</span></div>
    <div class="seg small">${MOMENTS.map(([id, l]) => `<button type="button" aria-selected="${m.m === id}" data-act="moment" data-id="${id}">${l}</button>`).join('')}</div>
    ${S.children.length > 1 ? `<div class="chips who"><span class="fine">Voor</span>${S.children.map((c) => `<button type="button" class="chip${m.kids.includes(c.id) ? ' on' : ''}" data-act="who" data-id="${c.id}" aria-pressed="${m.kids.includes(c.id)}">${esc(c.name)}</button>`).join('')}</div>` : ''}
    <div class="seg small modes"><button type="button" aria-selected="${m.mode === 'kind'}" data-act="mode" data-v="kind">Portie per kind</button><button type="button" aria-selected="${m.mode === 'gezin'}" data-act="mode" data-v="gezin">Hele gerecht</button></div>
    ${m.mode === 'gezin' ? '<p class="fine">Vul de ingrediënten in voor de hele pan, bijvoorbeeld de gewichten van de verpakking. Onderaan geef je aan hoeveel elk kind at.</p>' : ''}
    <form id="qf" class="search"><input id="q" type="search" placeholder="Wat at je kind? Bijv. volkoren boterham" autocomplete="off" enterkeyhint="done" aria-label="Zoek eten"></form>
    <div id="res" class="results">${resultsHtml('')}</div>
    ${m.items.length ? `<ul class="items">${m.items.map(itemHtml).join('')}</ul>` : ''}
    ${m.mode === 'gezin' && m.items.length ? `<div class="card share">
      <label class="inline">Gerecht voor <input type="number" inputmode="numeric" min="1" step="1" id="portions" data-act="portions" value="${m.p}"> volwassen porties</label>
      ${m.kids.map((k) => `<div class="kq"><span>${esc(kidName(k))} at</span><div class="chips">${[[0.25, '¼'], [1 / 3, '⅓'], [0.5, '½'], [0.75, '¾'], [1, '1']].map(([v, l]) =>
        `<button type="button" class="chip${Math.abs((m.s[k] || 0) - v) < 0.01 ? ' on' : ''}" data-act="share" data-kid="${k}" data-v="${v}">${l}</button>`).join('')}</div></div>`).join('')}
      <p class="fine">In volwassen porties. Een kind van 1–3 jaar eet vaak een derde tot de helft (schatting van de app).</p></div>` : ''}
    ${m.items.length ? `<label class="inline"><input type="checkbox" id="asrec" data-act="asrec" ${m.asrec ? 'checked' : ''}> Bewaar als vaste maaltijd</label>
      ${m.asrec ? `<input id="recname" placeholder="Naam, bijv. Pasta bolognese" value="${esc(m.recname || '')}" maxlength="40" aria-label="Naam vaste maaltijd">` : ''}` : ''}
    <div class="btns sticky">
      ${m.id ? `<button type="button" class="btn danger" data-act="delmeal">${ui.confirm === 'delmeal' ? 'Zeker? Tik nogmaals' : 'Verwijder'}</button>` : '<button type="button" class="btn ghost" data-act="closemeal">Annuleer</button>'}
      <button type="button" class="btn" data-act="savemeal" ${m.items.length && m.kids.length ? '' : 'disabled'}>Opslaan</button></div>
  </div>`;
}

// ---------- Indeling kiezen ----------
function clsSheet() {
  const c = ui.cls; if (!c) return '';
  const m = matchFood(c.name, { custom: S.custom });
  const sugg = [m.best?.id, ...m.alts.map((x) => x.id)].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);
  return `<div class="scrim top" data-act="closecls"></div>
  <div class="sheet top" role="dialog" aria-label="Wat is dit?">
    <div class="sh"><h2>Wat is “${esc(c.name)}”?</h2></div>
    ${sugg.length ? `<h3>Suggesties</h3><ul class="res">${sugg.map((id) => `<li><button data-act="choose" data-f="${id}">${badge(food(id).st, true)}<span>${esc(food(id).name)}</span><small>${esc(BADGE[food(id).st]?.[1] || '')}</small></button></li>`).join('')}</ul>` : ''}
    <h3>Zoek</h3>
    <input id="cq" type="search" placeholder="Bijv. volkorenbrood, kaas 30+, sap" autocomplete="off" aria-label="Zoek producttype">
    <div id="cres"></div>
    <details><summary>Staat het er niet tussen? Kies zelf</summary>
      <div class="custom"><select id="cvak" aria-label="Groep">${Object.entries(VAK_LABEL).map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join('')}</select>
      <select id="cst" aria-label="Schijf van Vijf"><option value="in">In de Schijf</option><option value="uit">Buiten de Schijf</option><option value="?">Weet ik niet</option></select>
      <button class="btn" data-act="custom">Gebruik</button></div></details>
    <div class="btns"><button class="btn ghost" data-act="closecls">Annuleer</button></div>
  </div>`;
}
const clsResults = (q) => `<ul class="res">${searchFoods(q, { custom: S.custom }, 8).map((id) => `<li><button data-act="choose" data-f="${id}">${badge(food(id).st, true)}<span>${esc(food(id).name)}</span><small>${esc(BADGE[food(id).st]?.[1] || '')}</small></button></li>`).join('')}</ul>`;

function applyClass(fid) {
  const c = ui.cls;
  const key = normalize(cleanName(c.name));
  if (key) S.learn[key] = fid;
  if (c.type === 'item') {
    const it = ui.meal.items.find((x) => x.k === c.id), fd = food(fid);
    it.f = fid;
    if (!fd.units.some((u) => u.k === it.u)) { const u = defaultUnit(fd, ui.meal.mode); it.u = u.k; for (const k in it.q) it.q[k] = isBase(u) ? 50 : 1; }
  }
  if (c.type === 'prod') S.products.find((x) => x.id === c.id).f = fid;
  if (c.type === 'imp') { const r = ui.imp[+c.id]; r.f = fid; r.sure = true; }
  save();
  ui.cls = null;
}

// ---------- Render ----------
function render() {
  if (!S.children.length) ui.tab = 'meer';
  const views = { dag: viewDag, week: viewWeek, producten: viewProducten, meer: viewMeer };
  const tabs = [['dag', 'Vandaag'], ['week', 'Advies'], ['producten', 'Producten'], ['meer', 'Meer']];
  const prev = document.querySelector('.sheet:not(.top)');
  const sheetScroll = prev ? prev.scrollTop : 0;
  $app.innerHTML = `<main>${saveFailed ? '<p class="note warn">Opslaan lukt niet in deze browser; invoer gaat verloren bij sluiten.</p>' : ''}${views[ui.tab]()}</main>
  ${S.children.length ? `<nav class="tabs">${tabs.map(([id, l]) => `<button data-act="tab" data-id="${id}" aria-current="${ui.tab === id}">${l}</button>`).join('')}</nav>` : ''}
  ${mealSheet()}${clsSheet()}`;
  const sc = document.querySelector('.sheet:not(.top)');
  if (sc) sc.scrollTop = sheetScroll;
  document.body.classList.toggle('locked', !!(ui.meal || ui.cls));
}

// ---------- Acties ----------
function openMeal(existing) {
  const kids = S.children.map((c) => c.id);
  if (existing) {
    const ks = kids.filter((k) => existing.it.some((it) => it.a[k]));
    ui.meal = { id: existing.id, d: existing.d, m: existing.m, kids: ks.length ? ks : [kid().id], mode: existing.g ? 'gezin' : 'kind', p: existing.g?.p || 4,
      s: { ...Object.fromEntries(kids.map((k) => [k, 1 / 3])), ...(existing.g?.s || {}) },
      items: existing.it.map((it) => { const u = unitOf(food(it.f), it.u); return { k: uid(), f: it.f, n: it.n, u: u.k, tq: it.tq || 0,
        q: Object.fromEntries(ks.map((k) => [k, it.q?.[k] ?? (it.a[k] || 0) / u.g])) }; }) };
  } else {
    ui.meal = { id: null, d: ui.date, m: guessMoment(), kids, mode: 'kind', p: 4, s: Object.fromEntries(kids.map((k) => [k, 1 / 3])), items: [] };
  }
  ui.confirm = null;
}
function addItems(list) {
  const m = ui.meal;
  for (const { f, n } of list) m.items.push(newItem(f, n, m.mode, m.kids));
}
function addFree(text) {
  addItems(splitFree(text).map((part) => { const r = matchFood(part, ctx()); return { f: r.best?.id || '?', n: part }; }));
}
function rememberProducts(items) {
  for (const it of items) {
    if (!it.n || it.f === '?') continue;
    const key = normalize(cleanName(it.n));
    if (!key || key === normalize(food(it.f).name) || S.products.some((p) => normalize(cleanName(p.n)) === key)) continue;
    S.products.push({ id: uid(), n: it.n, f: it.f });
  }
}
function saveMeal() {
  const m = ui.meal;
  const it = m.items.map((x) => {
    const a = {};
    for (const k of m.kids) { const g = itemGrams(x, k); if (g > 0) a[k] = Math.round(g * 10) / 10; }
    return { f: x.f, n: x.n, u: x.u, ...(m.mode === 'gezin' ? { tq: x.tq } : { q: Object.fromEntries(m.kids.map((k) => [k, x.q[k] || 0])) }), a };
  }).filter((x) => Object.keys(x.a).length);
  if (!it.length) return;
  const meal = { id: m.id || uid(), d: m.d, m: m.m, it, ...(m.mode === 'gezin' ? { g: { p: m.p, s: Object.fromEntries(m.kids.map((k) => [k, m.s[k] || 0])) } } : {}) };
  S.meals = S.meals.filter((x) => x.id !== meal.id).concat(meal);
  if (m.asrec && (m.recname || '').trim()) {
    S.recipes.push({ id: uid(), n: m.recname.trim(), mode: m.mode, p: m.p, it: m.items.map(({ f, n, u, q, tq }) => ({ f, n, u, q, tq })) });
  }
  rememberProducts(m.items);
  save();
  ui.meal = null;
}

const acts = {
  tab: (d) => { ui.tab = d.id; ui.msg = ''; ui.confirm = null; ui.restore = null; if (d.id === 'dag') ui.date = today; },
  child: (d) => { ui.child = d.id; },
  day: (d) => { const n = addDays(ui.date, +d.n); if (n <= today) ui.date = n; },
  vitd: (d, el) => { const k = `${ui.date}|${kid().id}`; if (el.checked) S.vitd[k] = 1; else delete S.vitd[k]; save(); },
  partial: (d, el) => { const k = `${ui.date}|${kid().id}`; if (el.checked) S.partial[k] = 1; else delete S.partial[k]; save(); },
  copyday: () => { const y = addDays(ui.date, -1);
    S.meals.push(...S.meals.filter((m) => m.d === y).map((m) => ({ ...JSON.parse(JSON.stringify(m)), id: uid(), d: ui.date }))); save(); },
  newmeal: () => openMeal(null),
  editmeal: (d) => openMeal(S.meals.find((m) => m.id === d.id)),
  closemeal: () => { ui.meal = null; ui.confirm = null; },
  moment: (d) => { ui.meal.m = d.id; },
  who: (d) => { const m = ui.meal; if (m.kids.includes(d.id) && m.kids.length === 1) return;
    m.kids = m.kids.includes(d.id) ? m.kids.filter((k) => k !== d.id) : [...m.kids, d.id];
    for (const it of m.items) if (it.q[d.id] === undefined) it.q[d.id] = Object.values(it.q)[0] ?? 1;
    if (m.s[d.id] === undefined) m.s[d.id] = 1 / 3; },
  mode: (d) => { const m = ui.meal; if (m.mode === d.v) return; m.mode = d.v;
    for (const it of m.items) { const u = defaultUnit(food(it.f), m.mode); it.u = u.k; const q0 = isBase(u) ? (u.k === 'ml' ? 150 : 50) : 1;
      for (const k in it.q) it.q[k] = q0; it.tq = isBase(u) ? 100 : 1; } },
  pick: (d) => { addItems([{ f: d.f, n: d.n || '' }]); const q = document.getElementById('q'); if (q) q.value = ''; return 'focus'; },
  addfree: () => { const q = document.getElementById('q').value; if (q.trim()) addFree(q); return 'focus'; },
  addrecipe: (d) => { const r = S.recipes.find((x) => x.id === d.id); const m = ui.meal;
    if (r.mode === 'gezin' && !m.items.length) { m.mode = 'gezin'; m.p = r.p; }
    for (const x of r.it) { const it = newItem(x.f, x.n, m.mode, m.kids); it.u = x.u; it.tq = x.tq || it.tq;
      for (const k of m.kids) it.q[k] = x.q?.[k] ?? Object.values(x.q || {})[0] ?? it.q[k]; m.items.push(it); } },
  sameasy: () => { const m = ui.meal; const y = S.meals.filter((x) => x.d === addDays(m.d, -1) && x.m === m.m);
    for (const meal of y) { if (meal.g && !m.items.length) { m.mode = 'gezin'; m.p = meal.g.p; Object.assign(m.s, meal.g.s); }
      for (const x of meal.it) { const u = unitOf(food(x.f), x.u); m.items.push({ k: uid(), f: x.f, n: x.n, u: u.k, tq: x.tq || 0,
        q: Object.fromEntries(m.kids.map((k) => [k, x.q?.[k] ?? (x.a[k] || 0) / u.g])) }); } } },
  rmitem: (d) => { ui.meal.items = ui.meal.items.filter((x) => x.k !== d.k); },
  step: (d) => { const it = ui.meal.items.find((x) => x.k === d.k); const s = stepOf(unitOf(food(it.f), it.u)) * +d.n;
    if (d.kid) it.q[d.kid] = Math.max(0, Math.round(((it.q[d.kid] || 0) + s) * 100) / 100); else it.tq = Math.max(0, Math.round(((it.tq || 0) + s) * 100) / 100); },
  qtyin: (d, el) => { const it = ui.meal.items.find((x) => x.k === d.k); const v = Math.max(0, parseFloat(String(el.value).replace(',', '.')) || 0);
    if (d.kid) it.q[d.kid] = v; else it.tq = v; },
  unit: (d, el) => { const it = ui.meal.items.find((x) => x.k === d.k); const fd = food(it.f), from = unitOf(fd, it.u), to = unitOf(fd, el.value);
    const conv = (q) => Math.round((q * from.g / to.g) * 100) / 100;
    for (const k in it.q) it.q[k] = isBase(to) ? conv(it.q[k]) : 1;
    it.tq = isBase(to) ? conv(it.tq) : 1;
    it.u = to.k; },
  portions: (d, el) => { ui.meal.p = Math.max(1, parseInt(el.value, 10) || 1); },
  share: (d) => { ui.meal.s[d.kid] = +d.v; },
  asrec: (d, el) => { ui.meal.asrec = el.checked; },
  savemeal: () => { saveMeal(); },
  delmeal: () => { if (ui.confirm !== 'delmeal') { ui.confirm = 'delmeal'; return; } S.meals = S.meals.filter((m) => m.id !== ui.meal.id); save(); ui.meal = null; ui.confirm = null; },
  cls: (d) => {
    let name;
    if (d.type === 'item') { const it = ui.meal.items.find((x) => x.k === d.id); name = it.n || food(it.f).name; }
    else if (d.type === 'prod') name = S.products.find((p) => p.id === d.id).n;
    else name = ui.imp[+d.id].name;
    ui.cls = { type: d.type, id: d.id, name };
  },
  closecls: () => { ui.cls = null; },
  choose: (d) => applyClass(d.f),
  custom: () => { const vak = document.getElementById('cvak').value, st = document.getElementById('cst').value;
    const c = { id: `c_${uid()}`, name: ui.cls.name, vak, st }; S.custom.push(c); applyClass(c.id); },
  recognize: () => { ui.msg = '';
    ui.imp = parseList(document.getElementById('imp').value).map((r) => { const m = matchFood(r.name, ctx()); const f = m.best?.id || '?';
      return { ...r, f, sure: m.sure && f !== '?', on: food(f).st !== 'geen' }; });
    if (!ui.imp.length) { ui.imp = null; ui.msg = 'Geen producten gevonden in de tekst.'; } },
  impon: (d, el) => { ui.imp[+d.i].on = el.checked; },
  impcancel: () => { ui.imp = null; },
  impsave: () => { for (const r of ui.imp.filter((x) => x.on)) {
      const key = normalize(cleanName(r.name)); const ex = S.products.find((p) => normalize(cleanName(p.n)) === key);
      if (ex) ex.f = r.f; else S.products.push({ id: uid(), n: r.name, f: r.f }); }
    save(); ui.imp = null; },
  delprod: (d) => { S.products = S.products.filter((p) => p.id !== d.id); save(); },
  delrecipe: (d) => { S.recipes = S.recipes.filter((r) => r.id !== d.id); save(); },
  addkid: () => { saveKids(false); S.children.push({ id: uid(), name: `Kind ${S.children.length + 1}`, birth: '' }); save(); },
  sharebk: () => { shareBackup(); return false; },
  restore: () => { S = fromBackup(ui.restore); ui.child = S.children[0]?.id; ui.restore = null; save(); ui.msg = 'Backup teruggezet.'; },
  restorecancel: () => { ui.restore = null; },
  wipe: () => { if (ui.confirm !== 'wipe') { ui.confirm = 'wipe'; return; } S = blank(); ui.child = null; ui.confirm = null; save(); },
};

async function shareBackup() {
  const json = JSON.stringify(S);
  try {
    const file = new File([json], `kindervoeding-backup-${today}.json`, { type: 'application/json' });
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'Kindervoeding backup' }); ui.msg = 'Backup gedeeld.'; render(); return; }
  } catch (e) { if (e?.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(json); ui.msg = 'Delen lukt hier niet; de backup staat als tekst op het klembord.'; } catch { ui.msg = 'Delen en kopiëren lukken niet in deze browser.'; }
  render();
}

function saveKids(strict = true) {
  const rows = [...document.querySelectorAll('#kids .kidrow')].map((r) => ({
    id: r.dataset.id || uid(), name: r.querySelector('[name=name]').value.trim(), birth: r.querySelector('[name=birth]').value }));
  const keep = rows.filter((r) => r.name);
  if (strict && !keep.length) { ui.msg = 'Vul minstens één naam in.'; return; }
  const gone = S.children.filter((c) => !keep.some((k) => k.id === c.id) && S.meals.some((m) => m.it.some((it) => it.a[c.id])));
  if (strict && gone.length) { ui.msg = `${gone[0].name} heeft nog invoer; een naam leegmaken verwijdert een kind niet.`; return; }
  if (!keep.length) return;
  const isFirst = !S.children.length;
  S.children = keep; ui.child = ui.child && keep.some((k) => k.id === ui.child) ? ui.child : keep[0].id; save();
  if (strict) { ui.msg = keep.some((k) => !k.birth) ? 'Opgeslagen. Zonder geboortemaand is er geen norm.' : 'Opgeslagen.'; if (isFirst && keep.every((k) => k.birth)) { ui.tab = 'dag'; ui.msg = ''; } }
}

$app.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act]');
  if (!el || el.matches('input, select')) return;
  const wasFocus = document.activeElement?.id === 'q';
  const r = acts[el.dataset.act]?.(el.dataset, el);
  if (r === false) return;
  render();
  if (r === 'focus' && wasFocus) document.getElementById('q')?.focus();
});
$app.addEventListener('change', (ev) => {
  const el = ev.target;
  if (el.id === 'bkfile' && el.files?.[0]) {
    const reader = new FileReader();
    reader.onload = () => { try { const o = JSON.parse(reader.result); if (!validBackup(o)) throw new Error('ongeldig'); ui.restore = o; } catch { ui.msg = 'Dit bestand is geen geldige backup; er is niets gewijzigd.'; } render(); };
    reader.readAsText(el.files[0]);
    return;
  }
  if (el.matches('[data-act]') && acts[el.dataset.act]) { acts[el.dataset.act](el.dataset, el); render(); }
});
$app.addEventListener('input', (ev) => {
  const el = ev.target;
  if (el.id === 'q') document.getElementById('res').innerHTML = resultsHtml(el.value);
  if (el.id === 'cq') document.getElementById('cres').innerHTML = el.value.trim() ? clsResults(el.value) : '';
  if (el.id === 'recname') ui.meal.recname = el.value;
  if (el.id === 'pf') { ui.pf = el.value; const pos = el.selectionStart; render(); const n = document.getElementById('pf'); n.focus(); n.setSelectionRange(pos, pos); }
});
$app.addEventListener('submit', (ev) => {
  ev.preventDefault();
  if (ev.target.id === 'kids') saveKids();
  if (ev.target.id === 'qf') { const q = document.getElementById('q').value; if (q.trim()) addFree(q); render(); document.getElementById('q')?.focus(); return; }
  render();
});

render();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('./sw.js').catch(() => {});
