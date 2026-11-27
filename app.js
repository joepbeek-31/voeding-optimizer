import { GROUPS, NORMS, PRESETS, TIPS, SOURCES, WARNINGS, NORM_VERSION, AGE_LABEL } from './guidelines.js';
import { iso, addDays, ageGroup, dayTotals, assessWeek } from './logic.js';

const KEY = 'kindervoeding-v1';
const blank = () => ({ children: [], entries: [], partial: {}, vitd: {} });
let S = blank();
try { S = { ...blank(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { /* zonder opslag werkt de app in het geheugen */ }
let saveFailed = false;
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); saveFailed = false; } catch { saveFailed = true; } };

const today = iso(new Date());
const ui = { tab: 'dag', date: today, child: S.children[0]?.id || null, sheet: null, confirm: null, msg: '' };
const $app = document.getElementById('app');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const G = Object.fromEntries(GROUPS.map((g) => [g.id, g]));
const nf = (v) => (Math.round(v * 10) / 10).toLocaleString('nl-NL');
const amt = (v, g) => (g.unit === 'x' ? `${nf(v)}×` : g.unit === 'st' ? nf(v) : `${nf(Math.round(v))} ${g.unit}`);
const norm = (min, max, g) => {
  if (min === null) return '';
  const u = g.unit === 'st' ? '' : ` ${g.unit}`;
  if (g.kind === 'max') return `max ${nf(max)}${u}`;
  return min === max ? `${nf(min)}${u}` : `${nf(min)}–${nf(max)}${u}`;
};
const dateLabel = (d) => {
  if (d === today) return 'Vandaag';
  if (d === addDays(today, -1)) return 'Gisteren';
  const [y, m, dd] = d.split('-').map(Number);
  return new Date(y, m - 1, dd).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
};
const kid = () => S.children.find((c) => c.id === ui.child) || S.children[0];

function childBar() {
  if (S.children.length < 2) return '';
  return `<div class="seg" role="tablist" aria-label="Kind">${S.children.map((c) =>
    `<button role="tab" aria-selected="${c.id === kid().id}" data-act="child" data-id="${c.id}">${esc(c.name)}</button>`).join('')}</div>`;
}

function bar(value, min, max, g, status) {
  if (min === null || g.kind === 'count') return '';
  const top = (max || 1) * (g.kind === 'max' ? 1 : 1.25);
  const pct = Math.min(100, (value / top) * 100);
  const band = g.kind === 'max' ? '' : `<i class="band" style="left:${(min / top) * 100}%;width:${((max - min) / top) * 100}%"></i>`;
  return `<div class="bar ${status}">${band}<b style="width:${pct}%"></b></div>`;
}

function viewDag() {
  const c = kid(), grp = ageGroup(c.birth, ui.date), norms = NORMS[grp] || {};
  const t = dayTotals(S.entries, c.id, ui.date);
  const wk = assessWeek(S.entries, c.id, ui.date, grp, S.partial);
  const W = Object.fromEntries(wk.rows.map((r) => [r.id, r]));
  const pk = `${ui.date}|${c.id}`;
  const row = (g) => {
    const [min, max] = norms[g.id] || [null, null];
    const isW = g.period === 'week';
    const v = isW ? W[g.id].value : t[g.id] || 0;
    const st = isW ? W[g.id].status : min !== null && v >= min ? 'ok' : 'none';
    return `<li class="row${g.derived ? ' sub' : ''}">
      <div class="rt"><span class="nm">${esc(g.short || g.label)}</span>
      <span class="num">${amt(v, g)}${min !== null && g.kind !== 'count' ? `<small> / ${norm(min, max, g)}</small>` : ''}</span></div>
      ${bar(v, min, max, g, st)}
      ${g.derived ? '' : `<button class="add" data-act="add" data-g="${g.id}" aria-label="${esc(g.label)} toevoegen">+</button>`}</li>`;
  };
  const list = S.entries.filter((e) => e.childId === c.id && e.date === ui.date);
  const y = addDays(ui.date, -1);
  const hasY = S.entries.some((e) => e.childId === c.id && e.date === y);
  return `
  <header class="top"><div class="datenav">
    <button data-act="day" data-n="-1" aria-label="Vorige dag">‹</button>
    <h1>${esc(dateLabel(ui.date))}</h1>
    <button data-act="day" data-n="1" aria-label="Volgende dag" ${ui.date >= today ? 'disabled' : ''}>›</button></div>
    ${childBar()}</header>
  ${grp ? '' : `<p class="note">Voor ${esc(c.name)} is geen norm beschikbaar. De app ondersteunt 1 t/m 9 jaar; controleer de geboortemaand onder Meer.</p>`}
  <div class="toggles">
    ${grp === '1-3' ? `<label><input type="checkbox" id="vitd" data-act="vitd" ${S.vitd[pk] ? 'checked' : ''}> Vitamine D gegeven</label>` : ''}
    <label><input type="checkbox" id="partial" data-act="partial" ${S.partial[pk] ? 'checked' : ''}> Dag onvolledig (bijv. opvang)</label>
  </div>
  <h2>Per dag <small>${grp ? esc(AGE_LABEL[grp]) : ''}</small></h2>
  <ul class="rows">${GROUPS.filter((g) => g.period === 'day').map(row).join('')}</ul>
  <h2>Per week <small>laatste 7 dagen</small></h2>
  <ul class="rows">${GROUPS.filter((g) => g.period === 'week').map(row).join('')}</ul>
  <h2>Ingevoerd <small>${list.length}</small></h2>
  ${list.length ? `<ul class="log">${list.map((e) => `<li><span>${esc(e.label)}</span><span class="num">${amt(e.amount, G[e.group])}</span>
    <button data-act="del" data-id="${e.id}" aria-label="${esc(e.label)} verwijderen">×</button></li>`).join('')}</ul>`
    : `<p class="note">Nog niets ingevoerd. Tik op + bij een groep.</p>`}
  ${!list.length && hasY ? `<button class="btn ghost" data-act="copy">Kopieer ${esc(dateLabel(y)).toLowerCase()}</button>` : ''}`;
}

const STATUS = { under: 'Te weinig', todo: 'Nog te gaan', ok: 'Op koers', over: 'Boven richtlijn', none: '–' };
function viewWeek() {
  const c = kid(), grp = ageGroup(c.birth, today);
  const a = assessWeek(S.entries, c.id, today, grp, S.partial);
  const flagged = a.rows.filter((r) => ['under', 'todo', 'over'].includes(r.status) && TIPS[r.id] && (r.status !== 'over' || G[r.id].kind === 'max'));
  const vd = a.dates.filter((d) => S.vitd[`${d}|${c.id}`]).length;
  return `
  <header class="top"><h1>Laatste 7 dagen</h1>${childBar()}</header>
  ${!grp ? `<p class="note">Geen norm beschikbaar voor ${esc(c.name)}.</p>` : `
  <p class="note">${a.fullDays} van 7 dagen volledig ingevuld. Dagnormen zijn het gemiddelde over die dagen.${grp === '1-3' ? ` Vitamine D afgevinkt op ${vd} van 7 dagen.` : ''}</p>
  ${a.fullDays ? '' : '<p class="note">Vul minstens één dag in om een beoordeling te zien.</p>'}
  <table class="wk"><thead><tr><th>Groep</th><th>Gemeten</th><th>Richtlijn</th><th>Status</th></tr></thead><tbody>
  ${a.rows.map((r) => { const g = G[r.id]; return `<tr class="${g.derived ? 'sub' : ''}"><td>${esc(g.short || g.label)}</td>
    <td class="num">${r.value === null ? '–' : amt(r.value, g)}</td>
    <td class="num">${norm(r.min, r.max, g)}${g.kind === 'count' ? '' : g.period === 'day' ? '/dag' : '/wk'}</td>
    <td><span class="pill ${r.status}">${STATUS[r.status]}</span></td></tr>`; }).join('')}
  </tbody></table>
  ${flagged.length ? `<h2>Suggesties</h2><ul class="tips">${flagged.map((r) => `<li><strong>${esc(G[r.id].short || G[r.id].label)}</strong> ${esc(TIPS[r.id])}</li>`).join('')}</ul>
  <p class="fine">Suggesties komen van de app, niet van het Voedingscentrum.</p>` : ''}`}`;
}

function viewMeer() {
  const kids = S.children.length ? S.children : [{ id: '', name: '', birth: '' }, { id: '', name: '', birth: '' }];
  const first = !S.children.length;
  return `
  <header class="top"><h1>${first ? 'Kindervoeding' : 'Meer'}</h1></header>
  ${first ? '<p class="note">Vul per kind een naam en geboortemaand in. De leeftijd bepaalt welke norm geldt. Alles blijft op dit toestel.</p>' : ''}
  <h2>Kinderen</h2>
  <form id="kids">${kids.map((c, i) => `<div class="kidrow" data-id="${c.id}">
    <input id="kn${i}" name="name" placeholder="Naam" aria-label="Naam kind ${i + 1}" value="${esc(c.name)}" maxlength="20">
    <input id="kb${i}" name="birth" type="month" aria-label="Geboortemaand kind ${i + 1}" value="${esc(c.birth)}" max="${today.slice(0, 7)}"></div>`).join('')}
    <div class="btns"><button class="btn" type="submit">Opslaan</button>
    ${kids.length < 4 ? '<button class="btn ghost" type="button" data-act="addkid">Kind toevoegen</button>' : ''}</div></form>
  ${ui.msg ? `<p class="note ok">${esc(ui.msg)}</p>` : ''}
  ${first ? '' : `
  <h2>Normen</h2>
  <p class="note">${esc(NORM_VERSION)}. Hoeveelheden zijn gemiddelden, geen dagelijkse eis.</p>
  <div class="scroll"><table class="wk"><thead><tr><th>Groep</th><th>1–3 jaar</th><th>4–9 jaar</th></tr></thead><tbody>
  ${GROUPS.filter((g) => g.kind !== 'count').map((g) => `<tr><td>${esc(g.label)}</td>${['1-3', '4-9'].map((k) =>
    `<td class="num">${norm(...NORMS[k][g.id], g)}${g.period === 'day' ? '/dag' : '/wk'}</td>`).join('')}</tr>`).join('')}
  </tbody></table></div>
  <h2>Let op bij 1–3 jaar</h2>
  <ul class="tips">${WARNINGS.map(([t, s]) => `<li>${esc(t)} <a href="${SOURCES.find((x) => x.id === s).url}" target="_blank" rel="noopener">bron</a></li>`).join('')}</ul>
  <h2>Bronnen</h2>
  <ul class="tips">${SOURCES.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.title)}</a></li>`).join('')}</ul>
  <p class="fine">Deze app is een hulpmiddel en geen medisch of diëtistisch advies. Portiegroottes bij de snelkeuzes zijn schattingen; marges rond de richtlijn (−20% / +25%) zijn een keuze van de app.</p>
  <h2>Backup</h2>
  <p class="note">Kopieer de tekst hieronder om je gegevens te bewaren, of plak een eerdere backup en kies Terugzetten.</p>
  <textarea id="backup" rows="4" aria-label="Backup">${esc(JSON.stringify(S))}</textarea>
  <div class="btns"><button class="btn ghost" data-act="copybk">Kopieer</button><button class="btn ghost" data-act="restore">Terugzetten</button>
  <button class="btn danger" data-act="wipe">${ui.confirm === 'wipe' ? 'Zeker weten? Tik nogmaals' : 'Alles wissen'}</button></div>`}`;
}

function sheet() {
  const s = ui.sheet; if (!s) return '';
  const g = G[s.g];
  return `<div class="scrim" data-act="close"></div>
  <form class="sheet" id="addf" role="dialog" aria-label="${esc(g.label)} toevoegen">
    <h2>${esc(g.label)}</h2>
    <div class="chips">${(PRESETS[s.g] || []).map((p, i) => `<button type="button" class="chip${s.p === i ? ' on' : ''}" data-act="preset" data-i="${i}">${esc(p[0])}</button>`).join('')}</div>
    <label class="fld">Omschrijving<input id="alabel" name="label" value="${esc(s.label)}" maxlength="40" autocomplete="off"></label>
    <div class="qty"><button type="button" data-act="step" data-n="-1" aria-label="Minder">−</button>
      <label><input id="aamt" name="amount" type="number" inputmode="decimal" min="0" step="any" value="${s.amount}" aria-label="Hoeveelheid"> <span>${g.unit === 'x' ? 'keer' : g.unit === 'st' ? 'stuks' : g.unit}</span></label>
      <button type="button" data-act="step" data-n="1" aria-label="Meer">+</button></div>
    ${g.unit === 'x' || g.unit === 'st' ? '' : '<p class="fine">Portiegrootte is een schatting; pas aan wat je kind at.</p>'}
    ${S.children.length > 1 ? `<div class="chips who">${S.children.map((c) => `<label class="chip${s.who.includes(c.id) ? ' on' : ''}"><input type="checkbox" id="who-${c.id}" name="who" value="${c.id}" ${s.who.includes(c.id) ? 'checked' : ''}>${esc(c.name)}</label>`).join('')}</div>` : ''}
    <div class="btns"><button class="btn ghost" type="button" data-act="close">Annuleer</button><button class="btn" type="submit">Toevoegen</button></div>
  </form>`;
}

function render() {
  if (!S.children.length) ui.tab = 'meer';
  const v = ui.tab === 'dag' ? viewDag() : ui.tab === 'week' ? viewWeek() : viewMeer();
  const tabs = [['dag', 'Vandaag'], ['week', 'Week'], ['meer', 'Meer']];
  $app.innerHTML = `<main>${saveFailed ? '<p class="note warn">Opslaan lukt niet in deze browser; invoer gaat verloren bij sluiten.</p>' : ''}${v}</main>
  ${S.children.length ? `<nav class="tabs">${tabs.map(([id, l]) => `<button data-act="tab" data-id="${id}" aria-current="${ui.tab === id}">${l}</button>`).join('')}</nav>` : ''}
  ${sheet()}`;
}

function readSheet() {
  const f = document.getElementById('addf'); if (!f || !ui.sheet) return;
  ui.sheet.label = f.label.value;
  ui.sheet.amount = Math.max(0, parseFloat(String(f.amount.value).replace(',', '.')) || 0);
  if (S.children.length > 1) ui.sheet.who = [...f.querySelectorAll('[name=who]:checked')].map((x) => x.value);
}

const acts = {
  tab: (d) => { ui.tab = d.id; ui.msg = ''; ui.confirm = null; if (d.id === 'dag') ui.date = today; },
  child: (d) => { ui.child = d.id; },
  day: (d) => { const n = addDays(ui.date, +d.n); if (n <= today) ui.date = n; },
  add: (d) => { const p = PRESETS[d.g]?.[0]; ui.sheet = { g: d.g, p: 0, label: p?.[0] || G[d.g].label, amount: p?.[1] ?? G[d.g].step, x: p?.[2] || {}, who: [kid().id] }; },
  preset: (d) => { readSheet(); const p = PRESETS[ui.sheet.g][+d.i]; Object.assign(ui.sheet, { p: +d.i, label: p[0], amount: p[1], x: p[2] || {} }); },
  step: (d) => { readSheet(); const st = G[ui.sheet.g].step; ui.sheet.amount = Math.max(0, Math.round((ui.sheet.amount + st * +d.n) * 10) / 10); },
  close: () => { ui.sheet = null; },
  del: (d) => { S.entries = S.entries.filter((e) => e.id !== d.id); save(); },
  copy: () => { const y = addDays(ui.date, -1), c = kid().id;
    S.entries.push(...S.entries.filter((e) => e.childId === c && e.date === y).map((e) => ({ ...e, id: uid(), date: ui.date }))); save(); },
  vitd: (d, el) => { const k = `${ui.date}|${kid().id}`; if (el.checked) S.vitd[k] = 1; else delete S.vitd[k]; save(); },
  partial: (d, el) => { const k = `${ui.date}|${kid().id}`; if (el.checked) S.partial[k] = 1; else delete S.partial[k]; save(); },
  addkid: () => { saveKids(false); S.children.push({ id: uid(), name: `Kind ${S.children.length + 1}`, birth: '' }); save(); },
  copybk: () => { const t = document.getElementById('backup'); t.select();
    (navigator.clipboard?.writeText(t.value) || Promise.reject()).then(() => { ui.msg = 'Backup gekopieerd.'; render(); }, () => {}); return false; },
  restore: () => { try { const o = JSON.parse(document.getElementById('backup').value);
      if (!Array.isArray(o.children) || !Array.isArray(o.entries)) throw 0;
      S = { ...blank(), ...o }; ui.child = S.children[0]?.id; save(); ui.msg = 'Backup teruggezet.';
    } catch { ui.msg = 'Dit is geen geldige backup; er is niets gewijzigd.'; } },
  wipe: () => { if (ui.confirm !== 'wipe') { ui.confirm = 'wipe'; return; } S = blank(); ui.child = null; ui.confirm = null; save(); },
};

function saveKids(strict = true) {
  const rows = [...document.querySelectorAll('#kids .kidrow')].map((r) => ({
    id: r.dataset.id || uid(), name: r.querySelector('[name=name]').value.trim(), birth: r.querySelector('[name=birth]').value }));
  const keep = rows.filter((r) => r.name);
  if (strict && !keep.length) { ui.msg = 'Vul minstens één naam in.'; return; }
  const gone = S.children.filter((c) => !keep.some((k) => k.id === c.id) && S.entries.some((e) => e.childId === c.id));
  if (strict && gone.length) { ui.msg = `${gone[0].name} heeft nog invoer; een naam leegmaken verwijdert een kind niet.`; return; }
  if (!strict && !keep.length) return;
  S.children = keep; ui.child = ui.child && keep.some((k) => k.id === ui.child) ? ui.child : keep[0].id; save();
  if (strict) { ui.msg = keep.some((k) => !k.birth) ? 'Opgeslagen. Zonder geboortemaand is er geen norm.' : 'Opgeslagen.'; if (S.entries.length === 0 && keep.every((k) => k.birth)) { ui.tab = 'dag'; ui.msg = ''; } }
}

$app.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act]'); if (!el || el.matches('input')) return;
  if (acts[el.dataset.act](el.dataset, el) !== false) render();
});
$app.addEventListener('change', (ev) => {
  const el = ev.target;
  if (el.matches('input[data-act]')) { acts[el.dataset.act](el.dataset, el); render(); }
  else if (el.name === 'who') { readSheet(); render(); }
});
$app.addEventListener('submit', (ev) => {
  ev.preventDefault();
  if (ev.target.id === 'kids') saveKids();
  if (ev.target.id === 'addf') {
    readSheet(); const s = ui.sheet;
    if (s.amount > 0 && s.who.length) {
      for (const c of s.who) S.entries.push({ id: uid(), date: ui.date, childId: c, group: s.g, amount: s.amount, label: s.label.trim() || G[s.g].label, ...s.x });
      save(); ui.sheet = null;
    }
  }
  render();
});
render();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('./sw.js').catch(() => {});
