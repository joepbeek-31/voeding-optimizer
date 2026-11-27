// Bouwt de Claude-artifactversie als één HTML-pagina, met normen, voedingsdatabase en rekenregels ingebakken.
// Gebruik: node artifact/build.mjs <uitvoerpad>
import { readFileSync, writeFileSync } from 'node:fs';
const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const bundle = ['guidelines.js', 'foods.js', 'logic.js']
  .map((f) => read(f).replace(/^import .*$/gm, '').replace(/^export /gm, '')).join('\n')
  .replace(/<\/script/gi, '<\\/script');
const tpl = readFileSync(new URL('./template.html', import.meta.url), 'utf8');
writeFileSync(process.argv[2] || 'kindervoeding.html', tpl.replace('/*BUNDLE*/', () => bundle));
