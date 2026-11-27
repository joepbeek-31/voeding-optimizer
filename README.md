# Kindervoeding

PWA om per kind bij te houden wat het eet, afgezet tegen de Schijf van Vijf van het Voedingscentrum (versie 2026, groepen 1–3 en 4–9 jaar).

## Wat de app doet

- **Eten invoeren per maaltijd**: typ wat je kind at ("volkoren boterham met pindakaas, melk"); de app herkent elk ingrediënt, bepaalt de Schijf-groep en of het in of buiten de Schijf valt. Porties in huismaten (snee, opscheplepel, beker) of grammen, per kind apart.
- **Gezinsgerecht**: vul de ingrediënten van de hele pan in (bijv. 400 g ongekookte volkorenpasta) en geef per kind aan welk deel van een volwassen portie het at.
- **Boodschappen importeren**: plak de productlijst van een AH-bestelling of kassabon (bijv. via Live Text op een screenshot). Prijzen, gewichten en niet-voeding worden eruit gefilterd.
- **Leert van correcties**: als je een indeling wijzigt, onthoudt de app dat voor die productnaam.
- **Advies**: weekoverzicht per kind met de belangrijkste verbeterpunten, betere keuzes voor producten buiten de Schijf, en aandachtspunten voor 1–3 jaar (zout, rauw vlees, leverworst, hele noten, zoete dranken, snoep, vitamine D). Elk advies verwijst naar de Voedingscentrum-pagina waar het op rust.

## Bestanden

| Bestand | Inhoud |
|---|---|
| `guidelines.js` | Normen per leeftijdsgroep, bronnen, tips |
| `foods.js` | Voedingsdatabase (± 190 producttypes) met indeling volgens de Voedingscentrum-criteria per productgroep |
| `match.js` | Herkenning van productnamen en plaklijsten |
| `logic.js` | Dag- en weekberekening, adviezen |
| `store.js` | Opslag en migratie van versie 1 |
| `app.js` | Interface |

Gegevens staan alleen lokaal in de browser (localStorage). Backup via Meer → Bewaar backup.

Indeling waar het etiket beslist (zout, suiker, verrijking) staat als "onzeker". Portiegroottes, de omrekening ongekookt → gekookt en de marges (−20% / +25%) zijn schattingen of keuzes van de app.

## Ontwikkelen

```
python3 -m http.server 8000   # lokaal draaien
npm test                      # herkenning en rekenlogica testen
```

Geen medisch of diëtistisch advies.
