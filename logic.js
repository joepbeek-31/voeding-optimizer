import { GROUPS, NORMS, TIPS } from './guidelines.js';
import { getFood, W13 } from './foods.js';

export function iso(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function addDays(isoStr, n) {
  const [y, m, d] = isoStr.split('-').map(Number);
  return iso(new Date(y, m - 1, d + n));
}
// birth: 'YYYY-MM'. Zonder dag rekenen we vanaf de eerste van de maand.
export function ageYears(birth, dateIso) {
  if (!/^\d{4}-\d{2}$/.test(birth || '')) return null;
  const [by, bm] = birth.split('-').map(Number);
  const [y, m] = dateIso.split('-').map(Number);
  return (y * 12 + m - (by * 12 + bm)) / 12;
}
export function ageGroup(birth, dateIso) {
  const a = ageYears(birth, dateIso);
  if (a === null || a < 1) return null;
  if (a < 4) return '1-3';
  if (a < 10) return '4-9';
  return null;
}

// Status van een product voor een leeftijdsgroep: 'in' | 'uit' | '?' | 'neutraal' | 'geen'.
export function statusFor(food, grp) {
  if (food.st === 'in' && food.out13 && grp === '1-3') return 'uit';
  return food.st;
}

const NORM_IDS = new Set(GROUPS.map((g) => g.id));
export const UNDER = 0.8, OVER = 1.25; // marges van de app rond de richtlijn

// Alles wat een kind op één dag at, opgeteld.
// Producten buiten de Schijf tellen niet mee voor hun groep. Vlees en rood vlees tellen altijd mee
// voor de bovengrens, ook bewerkt vlees (keuze van de app: de grens is bedoeld om vlees te beperken).
export function dayStats(S, childId, date, grp) {
  const t = {}, out = [], unsure = [], warns = [], variety = new Set();
  let items = 0, treats = 0, zoet = 0, dag = 0, week = 0;
  const snackMeals = new Set();
  for (const meal of S.meals) {
    if (meal.d !== date) continue;
    for (const it of meal.it) {
      const g = it.a?.[childId];
      if (!g) continue;
      const food = getFood(it.f, S.custom);
      const st = statusFor(food, grp);
      if (st === 'neutraal' || st === 'geen') continue;
      items++;
      const label = it.n || food.name;
      if (food.vak === 'vlees') {
        t.vlees = (t.vlees || 0) + g;
        if (food.red) t.roodvlees = (t.roodvlees || 0) + g;
      }
      if (st === 'in' || st === '?') {
        if (food.vak !== 'vlees' && NORM_IDS.has(food.vak)) t[food.vak] = (t[food.vak] || 0) + g;
        if (food.drink) t.dranken = (t.dranken || 0) + g;
        if (st === '?') unsure.push({ food, label, g });
        if ((food.vak === 'groente' || food.vak === 'fruit') && st === 'in') variety.add(`${food.vak}:${food.id === food.vak ? label.toLowerCase() : food.id}`);
      } else {
        out.push({ food, label, g });
      }
      if (food.treat) treats++;
      if (food.zoet) zoet++;
      if (food.k === 'd') dag++;
      if (food.k === 'w') week++;
      if (food.w13 && grp === '1-3') warns.push({ food, label, g, w: food.w13 });
      if (meal.m === 'tussen') snackMeals.add(meal.id);
    }
  }
  return { t, out, unsure, warns, variety, items, treats, zoet, dag, week, snacks: snackMeals.size };
}

// Beoordeling over de 7 dagen t/m endDate. Dagnormen: gemiddelde over volledig ingevulde dagen.
export function assessWeek(S, childId, endDate, grp) {
  const norms = NORMS[grp] || {};
  const dates = Array.from({ length: 7 }, (_, i) => addDays(endDate, i - 6));
  const days = dates.map((d) => dayStats(S, childId, d, grp));
  const full = days.filter((x, i) => x.items && !S.partial[`${dates[i]}|${childId}`]);
  const rows = GROUPS.map((g) => {
    const [min, max] = norms[g.id] || [null, null];
    let value, status = 'none';
    if (g.period === 'day') {
      value = full.length ? full.reduce((s, x) => s + (x.t[g.id] || 0), 0) / full.length : null;
      if (value !== null && min !== null) status = value < min * UNDER ? 'under' : value > max * OVER && !g.noOver ? 'over' : 'ok';
    } else {
      value = days.reduce((s, x) => s + (x.t[g.id] || 0), 0);
      if (g.kind === 'max') status = value > max ? 'over' : 'ok';
      else if (min !== null) status = value < min ? 'todo' : value > max * OVER ? 'over' : 'ok';
    }
    return { id: g.id, value, min, max, status };
  });
  const agg = (key) => {
    const m = new Map();
    for (const x of days) for (const o of x[key]) {
      const k = (o.food.id === '?' ? `?${o.label}` : o.food.id) + (o.w || '');
      const e = m.get(k) || { food: o.food, labels: new Set(), n: 0, g: 0, w: o.w };
      e.labels.add(o.label); e.n++; e.g += o.g; m.set(k, e);
    }
    return [...m.values()].sort((a, b) => b.n - a.n);
  };
  const sum = (k, arr = days) => arr.reduce((s, x) => s + x[k], 0);
  const variety = new Set(days.flatMap((x) => [...x.variety]));
  return {
    rows, dates, fullDays: full.length, loggedDays: days.filter((x) => x.items).length,
    out: agg('out'), unsure: agg('unsure'), warns: agg('warns'),
    treats: sum('treats'), zoet: sum('zoet'), weekkeuze: sum('week'),
    snacksPerDay: full.length ? sum('snacks', full) / full.length : 0,
    groenteSoorten: [...variety].filter((v) => v.startsWith('groente:')).length,
    fruitSoorten: [...variety].filter((v) => v.startsWith('fruit:')).length,
    vitd: dates.filter((d) => S.vitd[`${d}|${childId}`]).length,
  };
}

const GL = Object.fromEntries(GROUPS.map((g) => [g.id, g]));
const fmt = (v, g) => `${Math.round(v)}${g.unit === 'st' ? '' : ` ${g.unit}`}`;
const names = (e) => [...e.labels].slice(0, 3).join(', ');

// Adviezen, belangrijkste eerst. Elk advies verwijst naar een bronpagina (src = id uit SOURCES).
export function advise(a, grp) {
  const list = [];
  if (!grp || !a.loggedDays) return list;
  const outByVak = {};
  for (const e of a.out) (outByVak[e.food.vak] ||= []).push(e);
  const usedOut = new Set();

  for (const e of a.warns) {
    list.push({ prio: 100, kind: 'warn', title: names(e), text: W13[e.w], src: e.w === 'noten' || e.w === 'druif' ? 'tussendoor' : 'niet' });
  }
  for (const r of a.rows) {
    const g = GL[r.id];
    if (r.status === 'under' || r.status === 'todo') {
      if (g.period === 'day' && !a.fullDays) continue;
      const gap = r.min ? 1 - (r.value || 0) / r.min : 1;
      const outs = outByVak[r.id] || [];
      outs.forEach((e) => usedOut.add(e.food.id));
      const swap = outs.find((e) => e.food.swap);
      list.push({
        prio: (g.period === 'day' ? 45 : 35) + gap * 25, kind: 'gap', group: r.id,
        title: `${g.short || g.label}: ${g.period === 'day' ? 'gemiddeld ' : ''}${fmt(r.value || 0, g)} van ${fmt(r.min, g)}${g.period === 'day' ? ' per dag' : ' per week'}`,
        text: swap ? `${names(swap)} telt niet mee, want dat staat niet in de Schijf van Vijf. ${swap.food.swap}` : TIPS[r.id], src: 'svv',
      });
    } else if (r.status === 'over' && g.kind === 'max') {
      list.push({ prio: 45, kind: 'over', group: r.id,
        title: `${g.short || g.label}: ${fmt(r.value, g)} in 7 dagen, richtlijn maximaal ${fmt(r.max, g)}`, text: TIPS[r.id], src: 'svv' });
    }
  }
  if (a.zoet) {
    list.push({ prio: 72, kind: 'drink', title: `Zoete dranken: ${a.zoet}× in 7 dagen`,
      text: 'Water is de beste dorstlesser. Sap, diksap, limonade en frisdrank kun je beter niet geven.', src: 'drinken' });
  }
  if (grp === '1-3' && a.treats > 1) {
    list.push({ prio: 62, kind: 'treat', title: `Snoep, koek, chips of ijs: ${a.treats}× in 7 dagen`,
      text: 'Geef dit eerder één keer per week dan één keer per dag, en houd het klein (minder dan 75 kcal).', src: 'tussendoor' });
  }
  if (a.weekkeuze > 3) {
    list.push({ prio: 55, kind: 'week', title: `Weekkeuzes: ${a.weekkeuze}× in 7 dagen`,
      text: 'Het Voedingscentrum adviseert maximaal 3 weekkeuzes per week, zoals vleeswaren, frisdrank, sap, krentenbollen of grote koeken.', src: 'watstaat' });
  }
  if (grp === '1-3' && a.snacksPerDay > 2) {
    list.push({ prio: 45, kind: 'snack', title: `Gemiddeld ${a.snacksPerDay.toLocaleString('nl-NL', { maximumFractionDigits: 1 })} tussendoortjes per dag`,
      text: 'Geef bij voorkeur niet vaker dan 2 keer iets extra’s, zodat je kind trek houdt in de hoofdmaaltijden. Water kan altijd.', src: 'tussendoor' });
  }
  if (grp === '1-3' && a.loggedDays >= 3 && a.vitd < a.loggedDays) {
    list.push({ prio: 35, kind: 'vitd', title: `Vitamine D afgevinkt op ${a.vitd} van ${a.loggedDays} ingevulde dagen`,
      text: 'Je kind heeft tot 4 jaar extra vitamine D nodig.', src: 'menu' });
  }
  for (const e of a.out) {
    if (usedOut.has(e.food.id) || !e.food.swap || e.food.treat || e.food.zoet) continue;
    list.push({ prio: 30 + Math.min(e.n, 5) * 2, kind: 'swap', title: `Buiten de Schijf: ${names(e)}${e.n > 1 ? ` (${e.n}×)` : ''}`, text: e.food.swap, src: 'criteria' });
  }
  if (a.unsure.length) {
    list.push({ prio: 20, kind: 'unsure', title: `Onzeker of het in de Schijf staat: ${a.unsure.slice(0, 4).map(names).join(', ')}`,
      text: 'Controleer het etiket of zoek het op in de Kies Ik Gezond?-app. Pas daarna de indeling aan onder Producten.', src: 'watstaat' });
  }
  if (a.fullDays >= 4 && a.groenteSoorten < 3) {
    list.push({ prio: 15, kind: 'variety', title: `${a.groenteSoorten} soort${a.groenteSoorten === 1 ? '' : 'en'} groente in 7 dagen`,
      text: 'Varieer volop met groente.', src: 'avond' });
  }
  return list.sort((x, y) => y.prio - x.prio);
}

// Groepen die op koers zijn, voor een positieve samenvatting.
export function goodGroups(a) {
  return a.rows.filter((r) => r.status === 'ok' && GL[r.id].kind !== 'max').map((r) => GL[r.id].short || GL[r.id].label);
}
