import { FOODS, CLASSES } from './foods.js';

// Tekst naar vergelijkbare vorm: kleine letters, geen accenten, vaste codes voor zout/suiker/vet.
export function normalize(s) {
  s = String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  s = s.replace(/['’`´]/g, '').replace(/&/g, ' en ');
  s = s.replace(/\bongezouten\b|\bzonder (toegevoegd |toegevoegde |extra )?zout\b|\bzoutloos\b|\bgeen zout toegevoegd\b/g, ' xnosalt ');
  s = s.replace(/\bzonder (toegevoegde? |extra )?suikers?\b|\bongezoet\b|\bsuikervrij\b|\bgeen suiker toegevoegd\b|\bzero suiker\b/g, ' xnosugar ');
  s = s.replace(/\bhalf ?volle?\b/g, ' halfvol ').replace(/\bmagere\b/g, ' mager ').replace(/\bvolle\b/g, ' vol ');
  s = s.replace(/(\d{2})\s*\+/g, ' plus$1 ').replace(/\b100\s*%/g, ' 100procent ').replace(/(^|\s)0\s*%/g, ' 0procent ');
  s = s.replace(/\bbiologische?\b/g, ' bio ').replace(/\btempeh\b/g, 'tempe').replace(/\bhalf om half\b/g, ' half om half ');
  return s.replace(/[^a-z0-9]+/g, ' ').trim();
}

// Prijs, gewicht, aantal en winkelmerk uit een productregel halen.
const SIZE = /\b\d+(?:[.,]\d+)?\s*(?:x\s*\d+(?:[.,]\d+)?\s*)?(?:g|gr|gram|kg|kilo|ml|cl|l|ltr|liter|stuks?|st|pak|zakjes?|bakjes?|blikjes?|flessen|fles|rollen|tabletten|porties?)\b\.?/gi;
export function cleanName(raw) {
  let s = String(raw || '');
  s = s.replace(/€\s*\d+(?:[.,]\d{1,2})?/g, ' ').replace(/\b\d+[.,]\d{2}\b/g, ' ');
  s = s.replace(SIZE, ' ').replace(/^\s*\d+\s*[x×]\s*/i, ' ').replace(/\s[x×]\s*\d+\s*$/i, ' ');
  s = s.replace(/\b(per stuk|per kilo|per kg|per 100 gram|ca\.|circa|bonus|nieuw|aanbieding)\b/gi, ' ');
  s = s.replace(/^\s*(ah|albert heijn|jumbo|plus|g'woon|gwoon|excellent|terra|basic)\b\s*/i, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

// Een trefwoord-token past op een woord: kort (≤3) exact, 4 letters aan begin of eind, langer overal in het woord.
function tokHit(t, words) {
  for (const w of words) {
    if (t.length <= 3 ? w === t : t.length === 4 ? (w.startsWith(t) || w.endsWith(t)) : w.includes(t)) return t.length;
  }
  return 0;
}
const COMPILED = {};
// Trefwoordzinnen voorbewerken; @klasse wordt een lijst alternatieven.
for (const f of Object.values(FOODS)) {
  COMPILED[f.id] = { not: f.not.map((n) => (n.startsWith('@') ? CLASSES[n.slice(1)].map(normalize) : [normalize(n)])) };
  COMPILED[f.id].phrases = f.kw.map((p) => {
    const ph = p.split(/\s+/).filter(Boolean).flatMap((t) => (t.startsWith('@') ? [CLASSES[t.slice(1)].map(normalize)] : normalize(t).split(' ').filter(Boolean).map((x) => [x])));
    ph.bonus = p.startsWith('!') ? 3 : 0;
    return ph;
  });
}

function scoreFood(id, words) {
  const c = COMPILED[id];
  if (c.not.some((alts) => alts.some((n) => n.split(' ').every((x) => words.includes(x)) || words.some((w) => w === n || (n.length > 4 && w.includes(n)))))) return 0;
  let best = 0;
  for (const ph of c.phrases) {
    let s = 0;
    for (const alts of ph) {
      const hit = Math.max(...alts.map((a) => (a.includes(' ') ? (a.split(' ').every((x) => tokHit(x, words)) ? a.length - 1 : 0) : tokHit(a, words))));
      if (!hit) { s = 0; break; }
      s += hit;
    }
    // Een trefwoord dat precies een heel woord is, weegt iets zwaarder.
    if (s && ph.length === 1 && ph[0].length === 1 && words.includes(ph[0][0])) s += 0.5;
    if (s) s += ph.bonus;
    best = Math.max(best, s);
  }
  return best;
}

// ctx: { learn: {genormaliseerde naam: foodId}, custom: [{id, name, vak, st}] }
export function matchFood(name, ctx = {}) {
  const key = normalize(cleanName(name));
  if (!key) return { key, best: null, alts: [], sure: false };
  if (ctx.learn?.[key]) return { key, best: { id: ctx.learn[key], score: 99 }, alts: [], sure: true, learned: true };
  const words = key.split(' ');
  const res = [];
  for (const id of Object.keys(FOODS)) {
    const s = scoreFood(id, words);
    if (s > 0) res.push({ id, score: s });
  }
  for (const c of ctx.custom || []) {
    const ck = normalize(c.name);
    if (ck && (key === ck || (ck.length > 3 && key.includes(ck)))) res.push({ id: c.id, score: ck.length + 1 });
  }
  res.sort((a, b) => b.score - a.score);
  const best = res[0] || null;
  const second = res.find((r) => r.id !== best?.id && st(r.id, ctx) !== st(best.id, ctx));
  const sure = !!best && best.score >= 4 && (!second || best.score - second.score >= 2);
  return { key, best, alts: res.slice(1, 6), sure };
}
const st = (id, ctx) => FOODS[id]?.st || ctx.custom?.find((c) => c.id === id)?.st;

// Zoeken tijdens typen: elk woord moet ergens in naam of trefwoorden beginnen of voorkomen.
const SEARCH = Object.values(FOODS).filter((f) => f.st !== 'geen').map((f) => ({ id: f.id, words: normalize(`${f.name} ${f.kw.join(' ').replace(/@\w+/g, '')}`).split(' ') }));
export function searchFoods(q, ctx = {}, limit = 8) {
  const qn = normalize(q);
  if (!qn) return [];
  const qt = qn.split(' ');
  const scores = new Map();
  for (const f of SEARCH) {
    let s = 0;
    for (const t of qt) {
      let h = 0;
      for (const w of f.words) { if (w === t) h = Math.max(h, t.length * 3); else if (w.startsWith(t)) h = Math.max(h, t.length * 2); else if (t.length >= 3 && w.includes(t)) h = Math.max(h, t.length); }
      if (!h) { s = 0; break; }
      s += h;
    }
    if (s) scores.set(f.id, s);
  }
  const m = matchFood(q, ctx);
  if (m.best) scores.set(m.best.id, Math.max(scores.get(m.best.id) || 0, 1000 + m.best.score));
  for (const c of ctx.custom || []) { const ck = normalize(c.name); if (ck.includes(qn) || qn.includes(ck)) scores.set(c.id, 900); }
  return [...scores.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
}

// Plaktekst (AH-bestelling, kassabon, Live Text) naar productregels.
const JUNK = /^(bonus|aanbieding|actie|korting|totaal|subtotaal|bezorg|statiegeld|bekijk|toevoegen|verwijder|vervang|op voorraad|niet leverbaar|niet geleverd|bestelling|besteld|bezorgd|geleverd|aantal|prijs|per stuk|per kilo|nutri|mijn |favorieten|zoeken|winkelmand|afrekenen|betaald|kassabon|btw|pinnen|wisselgeld|bonuskaart|airmiles|zegels|spaar|artikel|product|omschrijving|bedrag|datum|tijd|filiaal|klantenservice|bedankt|tot ziens|www\.|http)/i;
export function parseList(text) {
  const seen = new Set();
  const out = [];
  for (let line of String(text || '').split(/\r?\n/)) {
    line = line.replace(/\t/g, ' ').trim();
    if (!line || line.length < 3 || JUNK.test(line)) continue;
    if (/^[\d\s.,:€x×+\-/%]+$/.test(line)) continue;
    const qm = line.match(/^\s*(\d+)\s*[x×]\s+/i) || line.match(/\s[x×]\s*(\d+)\s*$/i);
    const name = cleanName(line);
    if (!/[a-z]{3}/i.test(name)) continue;
    const key = normalize(name);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ raw: line, name, qty: qm ? +qm[1] : 1 });
  }
  return out;
}

// Vrije invoer "boterham met kaas, appel" naar losse ingrediënten.
export function splitFree(text) {
  return String(text || '').split(/\s*(?:,|;|\+|&|\bmet\b|\ben\b)\s*/i).map((s) => s.trim()).filter((s) => s.length > 1);
}
