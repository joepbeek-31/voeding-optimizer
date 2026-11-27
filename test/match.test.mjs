import test from 'node:test';
import assert from 'node:assert/strict';
import { matchFood, parseList, cleanName, normalize, splitFree, searchFoods } from '../match.js';

// Realistische productnamen (AH-stijl) met verwachte indeling.
const CASES = [
  ['AH Halfvolle melk 1 L', 'melk'], ['Campina Halfvolle melk', 'melk'], ['AH Volle melk', 'melk_vol'], ['AH Magere melk', 'melk'],
  ['AH Karnemelk', 'karnemelk'], ['Chocomel Vol 1L', 'chocomel'], ['AH Halfvolle yoghurt', 'yoghurt'], ['AH Griekse yoghurt', 'yoghurt_vol'],
  ['AH Griekse yoghurt 0% vet', 'yoghurt'], ['AH Yoghurt aardbei', 'toetje'], ['AH Magere kwark', 'kwark'], ['Danoontje aardbei 6 x 50 g', 'toetje'],
  ['AH Vanillevla', 'toetje'], ['Alpro Sojadrink original', 'sojadrink'], ['AH Biologisch Sojadrink', 'sojadrink_x'], ['Oatly Haverdrink', 'haverdrink'],
  ['AH Volkoren tijgerbrood heel', 'brood_volkoren'], ['AH Tijgerbrood wit heel', 'brood_wit'], ['AH Fijn volkoren half', 'brood_volkoren'],
  ['AH Bruin casino', 'brood_bruin'], ['AH Meergranen', 'brood_onbekend'], ['AH Krentenbollen 6 stuks', 'krentenbol'], ['Roggebrood Fries', 'brood_rogge'],
  ['AH Volkoren beschuit', 'beschuit_vk'], ['Bolletje Beschuit', 'beschuit'], ['AH Rijstwafels naturel', 'rijstwafel'], ['AH Volkoren wraps', 'wrap_vk'],
  ['AH Tortilla wraps', 'wrap'], ['Quaker Havermout', 'havermout'], ['Brinta', 'havermout'], ['Kellogg\'s Cornflakes', 'ontbijtgranen'], ['Cruesli rozijn', 'cruesli'],
  ['AH Volkoren spaghetti', 'pasta_vk'], ['AH Spaghetti', 'pasta'], ['De Cecco Penne rigate', 'pasta'], ['AH Volkoren penne', 'pasta_vk'],
  ['AH Zilvervliesrijst', 'rijst_zv'], ['AH Basmatirijst', 'rijst'], ['AH Volkoren couscous', 'couscous_vk'], ['AH Couscous', 'couscous'],
  ['AH Kruimige aardappelen 2 kg', 'aardappel'], ['AH Krieltjes', 'aardappel'], ['AH Zoete aardappel', 'zoete_aardappel'], ['AH Ovenfriet', 'ovenfriet'],
  ['AH Bruine bonen', 'peul'], ['AH Kikkererwten', 'kikkererwten'], ['AH Rode linzen', 'linzen'], ['AH Hummus naturel', 'hummus'], ['AH Tofu naturel', 'tofu'],
  ['AH Witte bonen in tomatensaus', 'bonen_saus'],
  ['Calvé Pindakaas', 'pindakaas'], ['AH Pindakaas 100% pinda', 'notenpasta'], ['AH Walnoten', 'noten_zz'], ['AH Cashewnoten ongezouten', 'noten_zz'],
  ['AH Pinda\'s gezouten', 'noten_g'],
  ['AH Kipfilet', 'kip'], ['AH Kipfilet plakken', 'vleeswaren_wit'], ['AH Kipdijfilet', 'kip'], ['AH Rundergehakt', 'gehakt'], ['AH Mager rundergehakt', 'rund_mager'],
  ['AH Half om half gehakt', 'gehakt'], ['AH Biefstuk', 'rund_mager'], ['AH Varkenshaas', 'varken'], ['AH Speklappen', 'varken_vet'], ['Unox Rookworst', 'worst'],
  ['AH Achterham', 'vleeswaren'], ['AH Boterhamworst', 'vleeswaren'], ['AH Smeerleverworst', 'leverworst'], ['AH Kipshoarma', 'kip_bewerkt'], ['AH Kipnuggets', 'kip_paneer'],
  ['AH Zalmfilet', 'vis'], ['AH Kabeljauwfilet', 'vis'], ['AH Vissticks', 'vis_paneer'], ['AH Gerookte zalm', 'vis_gerookt'], ['AH Tonijn in water', 'vis'],
  ['AH Scharreleieren 10 stuks', 'ei'],
  ['AH Jong belegen 48+ plakken', 'kaas48'], ['AH Jong belegen 30+ kaas', 'kaas30'], ['Milner 30+ belegen', 'kaas30'], ['AH Mozzarella', 'zachte_kaas'],
  ['AH Hüttenkäse', 'zachte_kaas'], ['Philadelphia Original', 'smeerkaas'], ['AH Geraspte kaas', 'kaas_onb'], ['AH Boerenkaas belegen', 'kaas_rauw'],
  ['Blue Band Halvarine', 'halvarine'], ['AH Olijfolie extra vierge', 'olie'], ['AH Roomboter ongezouten', 'boter'], ['AH Vloeibaar bakken en braden', 'olie'],
  ['AH Broccoli', 'broccoli'], ['AH Snoeptomaten', 'tomaat'], ['AH Komkommer', 'komkommer'], ['AH Sperziebonen', 'sperziebonen'], ['AH Spinazie à la crème', 'spinazie_creme'],
  ['AH Wokgroente', 'groente'], ['AH Rode kool met appeltjes', 'rodekool_appel'], ['AH Prei', 'prei'], ['AH Bananen', 'banaan'], ['AH Elstar appels', 'appel'],
  ['AH Mandarijnen', 'mandarijn'], ['AH Blauwe bessen', 'bessen'], ['AH Appelmoes', 'appelmoes'], ['AH Appelmoes zonder toegevoegde suiker', 'appelmoes_zs'],
  ['Hero Fruit2day', 'knijpfruit'], ['AH Rozijnen', 'gedroogd'],
  ['AH Appelsap', 'sap'], ['Appelsientje Sinaasappel', 'sap'], ['Roosvicee', 'limonade'], ['Karvan Cévitam aardbei', 'limonade'], ['Wicky', 'limonade'],
  ['Coca-Cola Zero', 'fris_light'], ['AH Limonadesiroop zonder suiker', 'fris_light'], ['Spa blauw', 'water'], ['Pickwick rooibos thee', 'thee'],
  ['AH Hagelslag melk', 'hagelslag'], ['AH Aardbeienjam', 'jam'], ['AH Appelstroop', 'jam'], ['Nutella', 'hagelslag'], ['AH Honing', 'suiker'],
  ['LU Liga', 'koekje'], ['AH Stroopwafels', 'koek'], ['AH Ontbijtkoek', 'koek'], ['Haribo Goudbeertjes', 'snoep'], ['Lay\'s Paprika chips', 'chips'],
  ['Ola Raket', 'ijs'], ['AH Ketchup', 'saus'], ['AH Pastasaus basilicum', 'saus'], ['AH Bouillonblokjes', 'zout'], ['AH Pizza margherita', 'kant'],
  ['AH Tomatensoep', 'soep'], ['Olvarit groente', 'babyvoeding'], ['AH Kaneel', 'neutraal'],
  ['Pampers Baby-Dry', 'geen'], ['AH Toiletpapier', 'geen'], ['Dreft afwasmiddel', 'geen'], ['AH Vegetarische burger', 'vega'], ['AH Pannenkoekenmix', 'pannenkoek'],
  ['Volkoren pannenkoeken', 'pannenkoek_vk'], ['AH Passata', 'passata'], ['AH Tomatenpuree', 'tomatenpuree'], ['AH Edamame', 'edamame'],
];

for (const [name, want] of CASES) {
  test(`herkent "${name}"`, () => {
    const m = matchFood(name);
    assert.equal(m.best?.id, want, `kreeg ${m.best?.id} (alternatieven: ${m.alts.map((a) => `${a.id}:${a.score}`).join(', ')})`);
  });
}

test('normalisatie', () => {
  assert.equal(normalize('AH Pindakaas 100% pinda'), 'ah pindakaas 100procent pinda');
  assert.equal(normalize('Halfvolle melk'), 'halfvol melk');
  assert.equal(normalize("Pinda's ongezouten"), 'pindas xnosalt');
  assert.equal(normalize('Kaas 30+'), 'kaas plus30');
  assert.equal(cleanName('2 x AH Halfvolle melk 1 L € 1,19'), 'Halfvolle melk');
  assert.equal(cleanName('AH Bananen per kilo'), 'Bananen');
});

test('plaklijst van een bestelling', () => {
  const text = `Mijn bestellingen
AH Halfvolle melk
1 liter
€ 1,19
2
AH Volkoren tijgerbrood heel
800 g
€ 2,39
Bonus
AH Bananen
5 stuks
Pampers Baby-Dry maat 5
Subtotaal € 24,10
Bezorgkosten € 5,95
AH Halfvolle melk`;
  const items = parseList(text);
  assert.deepEqual(items.map((i) => i.name), ['Halfvolle melk', 'Volkoren tijgerbrood heel', 'Bananen', 'Pampers Baby-Dry maat 5']);
});

test('vrije invoer splitsen', () => {
  assert.deepEqual(splitFree('boterham met kaas, appel en melk'), ['boterham', 'kaas', 'appel', 'melk']);
});

test('geleerde koppeling wint', () => {
  const m = matchFood('AH Meergranen', { learn: { [normalize('Meergranen')]: 'brood_bruin' } });
  assert.equal(m.best.id, 'brood_bruin');
  assert.equal(m.sure, true);
});

test('zoeken tijdens typen', () => {
  assert.ok(searchFoods('volk').includes('brood_volkoren'));
  assert.equal(searchFoods('banaan')[0], 'banaan');
  assert.ok(searchFoods('zilverv').includes('rijst_zv'));
});
