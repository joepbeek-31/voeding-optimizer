# Kindervoeding

PWA om per kind bij te houden wat het eet, afgezet tegen de Schijf van Vijf van het Voedingscentrum (versie 2026, groepen 1–3 en 4–9 jaar).

- Geen build-stap: statische bestanden (`index.html`, `app.js`, `logic.js`, `guidelines.js`, `styles.css`).
- Gegevens staan alleen lokaal in de browser (localStorage); backup via Meer → Backup.
- Normen en bronnen staan in `guidelines.js`. Portiegroottes van snelkeuzes en de marges (−20% / +25%) zijn keuzes van de app, geen Voedingscentrum-cijfers.

## Gebruik

```
python3 -m http.server 8000   # lokaal draaien
npm test                      # rekenlogica testen
npm run preview -- uit.html   # één losstaand HTML-bestand bouwen
```

Op iPhone: host de map via HTTPS, open in Safari en kies Deel → Zet op beginscherm.

Geen medisch of diëtistisch advies.
