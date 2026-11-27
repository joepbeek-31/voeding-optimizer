// Bouwt de proefversie als één HTML-pagina (Claude-artifact) met de voedingsdatabase ingebakken.
// Gebruik: node artifact/build.mjs <uitvoerpad>
import { readFileSync, writeFileSync } from 'node:fs';
import { FOODS } from '../foods.js';
const foods = Object.values(FOODS).filter((f) => f.st !== 'geen').map((f) => [f.id, f.name, f.vak, f.st, f.swap || '']);
const tpl = readFileSync(new URL('./template.html', import.meta.url), 'utf8');
writeFileSync(process.argv[2] || 'proef.html', tpl.replace('/*FOODS*/[]', JSON.stringify(foods).replace(/</g, '\\u003c')));
