import { GROUPS, NORMS } from './guidelines.js';

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
export function dayTotals(entries, childId, date) {
  const t = {};
  for (const e of entries) {
    if (e.childId !== childId || e.date !== date) continue;
    t[e.group] = (t[e.group] || 0) + e.amount;
    if (e.drink) t.dranken = (t.dranken || 0) + e.drink;
    if (e.group === 'vlees' && e.red) t.roodvlees = (t.roodvlees || 0) + e.amount;
  }
  return t;
}
export const UNDER = 0.8, OVER = 1.25; // marges van de app rond de richtlijn

// Beoordeling over de 7 dagen t/m endDate. Dagnormen: gemiddelde over volledig ingevulde dagen.
export function assessWeek(entries, childId, endDate, group, partial = {}) {
  const norms = NORMS[group];
  const dates = Array.from({ length: 7 }, (_, i) => addDays(endDate, i - 6));
  const totals = dates.map((d) => dayTotals(entries, childId, d));
  const full = totals.filter((t, i) => Object.keys(t).length && !partial[`${dates[i]}|${childId}`]);
  const rows = GROUPS.map((g) => {
    const [min, max] = norms?.[g.id] || [null, null];
    let value, status = 'none';
    if (g.period === 'day') {
      value = full.length ? full.reduce((s, t) => s + (t[g.id] || 0), 0) / full.length : null;
      if (value !== null && min !== null) {
        status = value < min * UNDER ? 'under' : value > max * OVER && !g.noOver ? 'over' : 'ok';
      }
    } else {
      value = totals.reduce((s, t) => s + (t[g.id] || 0), 0);
      if (g.kind === 'max') status = value > max ? 'over' : 'ok';
      else if (g.kind === 'range' && min !== null) status = value < min ? 'todo' : value > max * OVER ? 'over' : 'ok';
    }
    return { id: g.id, value, min, max, status };
  });
  return { rows, fullDays: full.length, dates };
}
