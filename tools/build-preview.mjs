// Bouwt één losstaand HTML-bestand (voor een preview zonder hosting). Gebruik: node tools/build-preview.mjs <uitvoerpad>
import { readFileSync, writeFileSync } from 'node:fs';
const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const js = ['guidelines.js', 'logic.js', 'app.js'].map((f) => read(f).replace(/^import .*$/gm, '').replace(/^export /gm, '')).join('\n');
const out = `<title>Kindervoeding</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>${read('styles.css')}</style>
<div id="app"></div>
<script>(() => {${js}})();</script>`;
writeFileSync(process.argv[2] || 'preview.html', out);
