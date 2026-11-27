// Normen: Voedingscentrum, vernieuwde Schijf van Vijf (gepresenteerd 9 april 2026).
// Overgenomen uit de tabel "Huidige aanbeveling" (eetvoorkeur met vlees en vis). Geraadpleegd 2026-11-24.
export const SOURCES = [
  { id: 'svv', title: 'Vernieuwde Schijf van Vijf: wijzigingen per doelgroep',
    url: 'https://www.voedingscentrum.nl/professionals/overzicht-wijzigingen-vernieuwde-schijf-van-vijf-per-doelgroep.aspx' },
  { id: 'dp', title: 'Dreumes en peuter',
    url: 'https://www.voedingscentrum.nl/nl/zwanger-en-kind/dreumes-en-peuter.aspx' },
  { id: 'niet', title: 'Wat geef je nog niet aan je dreumes of peuter?',
    url: 'https://www.voedingscentrum.nl/nl/zwanger-en-kind/dreumes-en-peuter/wat-geef-je-nog-niet-.aspx' },
  { id: 'drinken', title: 'Wat geef ik te drinken?',
    url: 'https://www.voedingscentrum.nl/nl/zwanger-en-kind/dreumes-en-peuter/wat-geef-ik-te-drinken-.aspx' },
  { id: 'menu', title: 'Voorbeeld dagmenu voor dreumes en peuter',
    url: 'https://www.voedingscentrum.nl/nl/zwanger-en-kind/dreumes-en-peuter/voorbeelddagmenu-voor-dreumes-en-peuter.aspx' },
];
export const NORM_VERSION = 'Voedingscentrum, Schijf van Vijf 2026 (geraadpleegd 24-11-2026)';

// period: 'day' = per dag, 'week' = per week. kind: 'range' = richtlijn, 'max' = bovengrens, 'count' = alleen tellen.
export const GROUPS = [
  { id: 'groente', label: 'Groente', unit: 'g', period: 'day', kind: 'range', step: 10, noOver: true },
  { id: 'fruit', label: 'Fruit', unit: 'g', period: 'day', kind: 'range', step: 10 },
  { id: 'brood', label: 'Volkorenbrood en -ontbijtgranen', short: 'Brood', unit: 'g', period: 'day', kind: 'range', step: 5 },
  { id: 'graan', label: 'Volkoren graanproducten en aardappelen', short: 'Graan en aardappel', unit: 'g', period: 'day', kind: 'range', step: 10 },
  { id: 'zuivel', label: 'Zuivel en zuivelalternatieven', short: 'Zuivel', unit: 'ml', period: 'day', kind: 'range', step: 25 },
  { id: 'kaas', label: 'Kaas', unit: 'g', period: 'day', kind: 'range', step: 5 },
  { id: 'vetten', label: 'Smeerbare en vloeibare vetten en oliën', short: 'Vetten en olie', unit: 'g', period: 'day', kind: 'range', step: 5 },
  { id: 'noten', label: 'Ongezouten noten', short: 'Noten', unit: 'g', period: 'day', kind: 'range', step: 5 },
  { id: 'dranken', label: 'Dranken (inclusief melk)', short: 'Dranken', unit: 'ml', period: 'day', kind: 'range', step: 50, noOver: true },
  { id: 'peulvruchten', label: 'Peulvruchten, tofu en tempé', short: 'Peulvruchten', unit: 'g', period: 'week', kind: 'range', step: 10 },
  { id: 'vis', label: 'Vis', unit: 'g', period: 'week', kind: 'range', step: 10 },
  { id: 'ei', label: 'Eieren', unit: 'st', period: 'week', kind: 'range', step: 0.5 },
  { id: 'vlees', label: 'Vlees', unit: 'g', period: 'week', kind: 'max', step: 10 },
  { id: 'roodvlees', label: 'waarvan rood vlees', unit: 'g', period: 'week', kind: 'max', derived: true },
  { id: 'buiten', label: 'Buiten de Schijf van Vijf', short: 'Buiten de Schijf', unit: 'x', period: 'week', kind: 'count', step: 1 },
];

// [min, max] per leeftijdsgroep. Dranken in ml (bron: 1 liter resp. 1,2-1,4 liter).
// Vlees: de bron noemt een weekhoeveelheid; de app behandelt die als bovengrens (keuze van de app).
export const NORMS = {
  '1-3': { groente: [50, 100], fruit: [150, 150], brood: [70, 90], graan: [50, 100], zuivel: [300, 300],
    kaas: [10, 15], vetten: [20, 20], noten: [15, 20], dranken: [1000, 1000],
    peulvruchten: [125, 125], vis: [70, 70], ei: [1, 1], vlees: [0, 150], roodvlees: [0, 100] },
  '4-9': { groente: [100, 150], fruit: [150, 150], brood: [90, 175], graan: [100, 150], zuivel: [350, 350],
    kaas: [20, 20], vetten: [25, 40], noten: [20, 25], dranken: [1200, 1400],
    peulvruchten: [190, 190], vis: [75, 75], ei: [1, 2], vlees: [0, 225], roodvlees: [0, 100] },
};
export const AGE_LABEL = { '1-3': '1 t/m 3 jaar', '4-9': '4 t/m 9 jaar' };

// Snelkeuzes. De hoeveelheden zijn schattingen van de app, geen Voedingscentrum-cijfers; pas ze bij invoer aan.
export const PRESETS = {
  groente: [['Opscheplepel groente', 50], ['Snoepgroente', 30], ['Groente op brood', 20]],
  fruit: [['Stuk fruit', 100], ['Half stuk fruit', 50], ['Handje klein fruit', 50]],
  brood: [['Volkoren boterham', 35], ['Halve boterham', 18], ['Havermout of muesli', 20]],
  graan: [['Opscheplepel pasta of rijst', 50], ['Kleine aardappel', 50]],
  zuivel: [['Beker melk', 150, { drink: 150 }], ['Schaaltje yoghurt', 150], ['Sojadrink verrijkt', 100, { drink: 100 }]],
  kaas: [['Zachte kaas op 1 boterham', 15]],
  vetten: [['Halvarine op 1 boterham', 5], ['Eetlepel olie (bereiding)', 10]],
  noten: [['Notenpasta op 1 boterham', 15]],
  dranken: [['Beker water', 150], ['Beker thee', 150], ['Slokjes water', 50]],
  peulvruchten: [['Opscheplepel peulvruchten', 60], ['Tofu of tempé', 50]],
  vis: [['Portie vis', 50], ['Vis op brood', 20]],
  ei: [['Ei', 1], ['Half ei', 0.5]],
  vlees: [['Kip of kalkoen', 50], ['Rood vlees', 50, { red: true }], ['Vleeswaren op brood', 15, { red: true }]],
  buiten: [['Koekje of snoep', 1], ['Zoet beleg', 1], ['Sap of limonade', 1], ['Hartige snack', 1]],
};

// Tips zijn suggesties van de app (geen citaten van het Voedingscentrum).
export const TIPS = {
  groente: 'Geef ook bij lunch of tussendoor groente: komkommer, tomaatjes of paprika als snoepgroente.',
  fruit: 'Verdeel fruit over de dag: een half stuk bij het ontbijt en een stuk als tussendoortje.',
  brood: 'Een extra halve volkoren boterham bij ontbijt of lunch vult dit snel aan.',
  graan: 'Kies bij de warme maaltijd volkoren pasta, zilvervliesrijst of aardappelen.',
  zuivel: 'Een beker halfvolle melk of een schaaltje yoghurt als toetje telt mee.',
  kaas: 'Zachte kaas zoals zuivelspread, hüttenkäse of mozzarella op brood.',
  vetten: 'Besmeer brood met halvarine of margarine en bak in vloeibaar vet of olie.',
  noten: 'Notenpasta of pindakaas van 100% noten op brood is een makkelijke manier.',
  dranken: 'Bied bij elk eetmoment water of lichte thee aan.',
  peulvruchten: 'Plan deze week nog een maaltijd met linzen, kikkererwten of bonen, of geef hummus op brood.',
  vis: 'Plan deze week nog een vismaaltijd of geef vis op brood.',
  ei: 'Een gekookt ei bij de lunch of door de warme maaltijd.',
  vlees: 'Vervang een vleesmaaltijd door peulvruchten, vis of ei.',
  roodvlees: 'Kies vaker kip of een vegetarische maaltijd in plaats van rund- of varkensvlees.',
};

// Aandachtspunten, samengevat uit de genoemde bronpagina's.
export const WARNINGS = [
  ['Extra vitamine D tot 4 jaar.', 'menu'],
  ['Voeg geen zout toe en beperk zoute producten zoals vleeswaren, kant-en-klare sauzen en snacks (tot 4 jaar).', 'niet'],
  ['Geen rauwe vis, rauw vlees of producten met rauwe melk of rauw ei. Ook geen rauwmelkse kaas zoals boerenkaas.', 'niet'],
  ['Gewone kaas en smeerkaas liever niet; kies zachte kaas met weinig zout.', 'niet'],
  ['Geen smeerleverworst of paté (veel vitamine A).', 'niet'],
  ['Water is de beste dorstlesser. Sap, diksap, limonade en frisdrank liever niet.', 'drinken'],
  ['Halfvolle of magere zuivel; speciale peuter- of dreumesmelk is niet nodig.', 'drinken'],
  ['De hoeveelheden zijn gemiddelden: het laagste getal past meer bij 1 jaar, het hoogste bij 3 jaar. Dring geen eten op.', 'dp'],
];
