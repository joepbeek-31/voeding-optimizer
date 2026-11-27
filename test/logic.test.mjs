import test from 'node:test';
import assert from 'node:assert/strict';
import { ageGroup, addDays, dayStats, assessWeek, advise, statusFor } from '../logic.js';
import { FOODS } from '../foods.js';
import { blank, migrateV1, fromBackup } from '../store.js';

test('leeftijdsgroep', () => {
  assert.equal(ageGroup('2024-11', '2026-11-24'), '1-3');
  assert.equal(ageGroup('2023-05', '2026-11-24'), '1-3');
  assert.equal(ageGroup('2022-11', '2026-11-24'), '4-9');
  assert.equal(ageGroup('2026-05', '2026-11-24'), null);
});
test('addDays over maandgrens', () => {
  assert.equal(addDays('2026-12-01', -1), '2026-11-30');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

const S0 = () => ({ ...blank(), children: [{ id: 'a', name: 'A', birth: '2024-01' }, { id: 'b', name: 'B', birth: '2022-06' }] });
const meal = (d, m, items) => ({ id: Math.random().toString(36), d, m, it: items.map(([f, a]) => ({ f, a })) });

test('kaas 30+ telt voor 4+ wel, voor 1-3 niet', () => {
  assert.equal(statusFor(FOODS.kaas30, '1-3'), 'uit');
  assert.equal(statusFor(FOODS.kaas30, '4-9'), 'in');
});

test('dagtotalen: buiten de Schijf telt niet mee, melk telt als drinken, vlees altijd voor bovengrens', () => {
  const S = S0();
  S.meals.push(meal('2026-11-24', 'ontbijt', [['brood_volkoren', { a: 35, b: 70 }], ['brood_wit', { a: 35 }], ['melk', { a: 150 }]]));
  S.meals.push(meal('2026-11-24', 'avond', [['gehakt', { a: 40 }], ['kip', { a: 30 }], ['neutraal', { a: 2 }]]));
  S.meals.push(meal('2026-11-24', 'tussen', [['koekje', { a: 10 }], ['sap', { a: 150 }]]));
  const d = dayStats(S, 'a', '2026-11-24', '1-3');
  assert.equal(d.t.brood, 35);
  assert.equal(d.t.zuivel, 150);
  assert.equal(d.t.dranken, 150);
  assert.equal(d.t.vlees, 70);
  assert.equal(d.t.roodvlees, 40);
  assert.deepEqual(d.out.map((o) => o.food.id).sort(), ['brood_wit', 'gehakt', 'koekje', 'sap']);
  assert.equal(d.treats, 1);
  assert.equal(d.zoet, 1);
  assert.equal(d.snacks, 1);
  assert.equal(d.items, 7); // kruiden (neutraal) tellen niet
  assert.equal(dayStats(S, 'b', '2026-11-24', '4-9').t.brood, 70);
});

test('weekbeoordeling en advies', () => {
  const S = S0();
  for (const d of ['2026-11-22', '2026-11-23', '2026-11-24']) {
    S.meals.push(meal(d, 'ontbijt', [['brood_wit', { a: 70 }], ['hagelslag', { a: 10 }], ['melk', { a: 300 }]]));
    S.meals.push(meal(d, 'avond', [['broccoli', { a: 80 }], ['aardappel', { a: 80 }], ['worst', { a: 60 }]]));
    S.meals.push(meal(d, 'tussen', [['banaan', { a: 150 }], ['water', { a: 800 }], ['leverworst', { a: 10 }]]));
  }
  const a = assessWeek(S, 'a', '2026-11-24', '1-3');
  const r = Object.fromEntries(a.rows.map((x) => [x.id, x]));
  assert.equal(a.fullDays, 3);
  assert.equal(r.brood.value, 0);
  assert.equal(r.brood.status, 'under');
  assert.equal(r.groente.status, 'ok');
  assert.equal(r.fruit.status, 'ok');
  assert.equal(r.vlees.value, 210); // worst + leverworst
  assert.equal(r.vlees.status, 'over');
  assert.equal(r.roodvlees.value, 210);
  assert.equal(a.weekkeuze, 6);
  const adv = advise(a, '1-3');
  assert.equal(adv[0].kind, 'warn');
  assert.ok(adv.some((x) => x.kind === 'warn' && /leverworst/i.test(x.text)));
  const brood = adv.find((x) => x.group === 'brood');
  assert.match(brood.text, /telt niet mee/);
  assert.match(brood.text, /volkoren/i);
  assert.ok(adv.some((x) => x.kind === 'week'));
  assert.ok(adv.some((x) => x.kind === 'vitd'));
  assert.ok(adv.some((x) => x.group === 'vis'));
});

test('dag niet compleet telt niet mee voor daggemiddelde', () => {
  const S = S0();
  S.meals.push(meal('2026-11-24', 'lunch', [['appel', { a: 50 }]]));
  S.meals.push(meal('2026-11-23', 'lunch', [['appel', { a: 150 }]]));
  S.partial['2026-11-24|a'] = 1;
  const a = assessWeek(S, 'a', '2026-11-24', '1-3');
  assert.equal(a.fullDays, 1);
  assert.equal(a.rows.find((x) => x.id === 'fruit').value, 150);
});

test('migratie van versie 1', () => {
  const v1 = { children: [{ id: 'a', name: 'A', birth: '2024-01' }], partial: {}, vitd: { '2026-11-24|a': 1 }, entries: [
    { id: '1', date: '2026-11-24', childId: 'a', group: 'brood', amount: 35, label: 'Volkoren boterham' },
    { id: '2', date: '2026-11-24', childId: 'a', group: 'zuivel', amount: 150, label: 'Beker melk', drink: 150 },
    { id: '3', date: '2026-11-24', childId: 'a', group: 'vlees', amount: 50, label: 'Rood vlees', red: true },
    { id: '4', date: '2026-11-24', childId: 'a', group: 'buiten', amount: 1, label: 'Sap of limonade' },
    { id: '5', date: '2026-11-24', childId: 'a', group: 'groente', amount: 60, label: 'Opscheplepel groente' }] };
  const S = migrateV1(v1);
  assert.equal(S.meals.length, 5);
  const d = dayStats(S, 'a', '2026-11-24', '1-3');
  assert.equal(d.t.brood, 35);
  assert.equal(d.t.zuivel, 150);
  assert.equal(d.t.dranken, 150);
  assert.equal(d.t.roodvlees, 50);
  assert.equal(d.t.groente, 60);
  assert.equal(d.zoet, 1);
  assert.equal(S.vitd['2026-11-24|a'], 1);
  assert.equal(fromBackup(v1).meals.length, 5);
});
