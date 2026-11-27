import test from 'node:test';
import assert from 'node:assert/strict';
import { ageGroup, addDays, dayTotals, assessWeek } from '../logic.js';

test('leeftijdsgroep', () => {
  assert.equal(ageGroup('2024-11', '2026-11-24'), '1-3');
  assert.equal(ageGroup('2023-05', '2026-11-24'), '1-3'); // 3,5 jaar
  assert.equal(ageGroup('2022-11', '2026-11-24'), '4-9'); // net 4
  assert.equal(ageGroup('2026-05', '2026-11-24'), null);
  assert.equal(ageGroup('', '2026-11-24'), null);
});
test('addDays over maandgrens', () => {
  assert.equal(addDays('2026-12-01', -1), '2026-11-30');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});
const E = (date, group, amount, x = {}) => ({ childId: 'a', date, group, amount, ...x });
test('dagtotalen: melk telt mee als drank, rood vlees apart', () => {
  const t = dayTotals([E('2026-11-24', 'zuivel', 150, { drink: 150 }), E('2026-11-24', 'dranken', 200),
    E('2026-11-24', 'vlees', 50, { red: true }), E('2026-11-24', 'vlees', 40), E('2026-11-23', 'fruit', 100)], 'a', '2026-11-24');
  assert.deepEqual(t, { zuivel: 150, dranken: 350, vlees: 90, roodvlees: 50 });
});
test('weekbeoordeling', () => {
  const es = [];
  for (const d of ['2026-11-23', '2026-11-24']) es.push(E(d, 'groente', 60), E(d, 'fruit', 100), E(d, 'zuivel', 500));
  es.push(E('2026-11-22', 'fruit', 10)); // onvolledige dag
  es.push(E('2026-11-24', 'vlees', 120, { red: true }), E('2026-11-23', 'vis', 70));
  const a = assessWeek(es, 'a', '2026-11-24', '1-3', { '2026-11-22|a': true });
  const r = Object.fromEntries(a.rows.map((x) => [x.id, x]));
  assert.equal(a.fullDays, 2);
  assert.equal(r.groente.status, 'ok');
  assert.equal(r.fruit.value, 100);
  assert.equal(r.fruit.status, 'under'); // 100 < 0,8 x 150
  assert.equal(r.zuivel.status, 'over');
  assert.equal(r.brood.status, 'under');
  assert.equal(r.vis.status, 'ok');
  assert.equal(r.peulvruchten.status, 'todo');
  assert.equal(r.vlees.status, 'ok');
  assert.equal(r.roodvlees.status, 'over');
  assert.equal(r.buiten.status, 'none');
});
