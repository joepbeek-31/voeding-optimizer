import { matchFood } from './match.js';
import { FOODS } from './foods.js';

export const KEY = 'kindervoeding';
export const OLD_KEY = 'kindervoeding-v1'; // versie 1 blijft onaangeroerd staan als reservekopie
export const uid = () => Math.random().toString(36).slice(2, 10);
export const blank = () => ({ v: 2, children: [], meals: [], partial: {}, vitd: {}, products: [], learn: {}, recipes: [], custom: [] });

// Versie 1 bewaarde losse invoer per groep; zet die om naar maaltijden met herkende producten.
const V1_GROUP_FOOD = { groente: 'groente', fruit: 'fruit', brood: 'brood_volkoren', graan: 'aardappel', zuivel: 'melk', kaas: 'kaas30',
  vetten: 'halvarine', noten: 'notenpasta', dranken: 'water', peulvruchten: 'peul', vis: 'vis', ei: 'ei', vlees: 'kip', buiten: 'koekje' };
export function migrateV1(o) {
  const S = { ...blank(), children: o.children || [], partial: o.partial || {}, vitd: o.vitd || {} };
  for (const e of o.entries || []) {
    let f = V1_GROUP_FOOD[e.group] || 'groente';
    const m = matchFood(e.label || '');
    if (m.best && FOODS[m.best.id] && (FOODS[m.best.id].vak === e.group || e.group === 'buiten')) f = m.best.id;
    if (e.group === 'vlees' && e.red && !FOODS[f].red) f = 'rund_mager';
    const grams = e.group === 'buiten' ? 1 : e.amount;
    S.meals.push({ id: uid(), d: e.date, m: null, it: [{ f, n: e.label, u: FOODS[f].units.at(-1).k, a: { [e.childId]: grams } }] });
  }
  return S;
}

export function load(storage) {
  try {
    const raw = storage.getItem(KEY);
    if (raw) return { ...blank(), ...JSON.parse(raw) };
    const old = storage.getItem(OLD_KEY);
    if (old) return migrateV1(JSON.parse(old));
  } catch { /* lege start */ }
  return blank();
}

export function validBackup(o) {
  return o && Array.isArray(o.children) && (Array.isArray(o.meals) || Array.isArray(o.entries));
}
export function fromBackup(o) {
  return Array.isArray(o.meals) ? { ...blank(), ...o } : migrateV1(o);
}
