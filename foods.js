// Voedingsdatabase van de app.
// Indeling in of buiten de Schijf van Vijf volgt de Voedingscentrum-criteria per productgroep
// (publicatie 9 april 2026, zie SOURCES in guidelines.js). Waar het oordeel van het etiket afhangt
// (zout, suiker, verrijking) staat status '?'. Portiegroottes zijn schattingen van de app,
// behalve waar 'bron' bij UNIT_SOURCE staat.
//
// Regelformaat: id|naam|vak|status|trefwoorden|eenheden|vlaggen|betere keuze|opmerking
//   status: in | uit | ? | neutraal | geen
//   trefwoorden: komma-gescheiden zinnen; alle woorden van een zin moeten voorkomen; @klasse = een van de woorden uit CLASSES
//   eenheden: sleutel:gram (of ml/stuks). Leeg = standaard voor het vak.
//   !woord = merknaam of sterk signaal (weegt zwaarder)
//   vlaggen: red (rood vlees), drink (telt ook als drinken), treat (snoep/koek/ijs/chips), zoet (zoete drank),
//            ml, out13 (telt voor 1-3 jaar niet mee), k=d / k=w (dag-/weekkeuze), w13=<code>, not=<woorden>

export const UNIT_LABELS = {
  g: 'gram', ml: 'ml', stuk: 'stuk', half: 'halve', snee: 'snee', halvesnee: 'halve snee', bol: 'bolletje',
  ol: 'opscheplepel', el: 'eetlepel', tl: 'theelepel', hand: 'handje', plak: 'plakje', beker: 'beker',
  glas: 'glas', schaal: 'klein schaaltje', portie: 'kinderportie', ei: 'ei', besmeer: 'boterham besmeerd',
  partje: 'partje', schijf: 'schijfje', reep: 'reepje', roosje: 'roosje', cherry: 'snoeptomaatje',
  teen: 'teentje', kriel: 'krieltje', doosje: 'doosje', pakje: 'pakje', slok: 'paar slokjes', blokje: 'blokje',
  kom: 'kom', potje: 'potje', koek: 'koek', rauw: 'gram ongekookt', stukje: 'stukje', snoepje: 'snoepje',
};

// Eenheden met een Voedingscentrum-bron; de rest is een schatting van de app.
export const UNIT_SOURCE = {
  ol: 'Opscheplepel ≈ 50 g: "50-100 gram groente (1-2 opscheplepels)" (Voedingscentrum, avondeten dreumes en peuter).',
  schaal: 'Klein schaaltje 50-100 ml yoghurt (Voedingscentrum, toetjes dreumes en peuter); app gebruikt 75 ml.',
  blokje: 'Klein blokje chocolade ≈ 7 g (Voedingscentrum, dag- en weekkeuzes).',
};

const DEFAULT_UNITS = {
  groente: 'ol:50 el:15', fruit: 'stuk:100 hand:50', brood: 'snee:35 halvesnee:17.5', graan: 'ol:50',
  zuivel: 'beker:150 schaal:75 el:15', kaas: 'plak:15', vetten: 'besmeer:5 el:13 tl:4',
  noten: 'besmeer:10 el:15 tl:5', dranken: 'beker:150 glas:200 slok:50', peulvruchten: 'ol:50 el:15',
  vis: 'portie:50', ei: 'ei:1 half:0.5', vlees: 'portie:50', vega: 'portie:50', overig: 'stuk:10 el:15',
};

export const CLASSES = {
  brood: ['brood', 'boterham', 'boterhammen', 'bol', 'bollen', 'bolletje', 'bolletjes', 'pistolet', 'puntjes', 'tijger', 'casino', 'desem', 'stokbrood', 'baguette', 'ciabatta', 'broodje', 'broodjes', 'sandwich', 'vloerbrood', 'heel', 'half'],
  pasta: ['pasta', 'spaghetti', 'penne', 'macaroni', 'fusilli', 'farfalle', 'tagliatelle', 'linguine', 'lasagnebladen', 'orzo', 'rigatoni', 'conchiglie', 'orecchiette', 'spirelli', 'vermicelli', 'tortiglioni'],
  smaak: ['aardbei', 'aardbeien', 'framboos', 'frambozen', 'perzik', 'abrikoos', 'kers', 'kersen', 'bosvruchten', 'vanille', 'stracciatella', 'mango', 'banaan', 'citroen', 'honing', 'chocolade', 'mokka', 'limoen', 'passievrucht', 'rabarber', 'kokos', 'blauwe bes', 'aardbei-banaan'],
};

export const W13 = {
  lever: 'Geen smeerleverworst of paté onder 4 jaar: veel vitamine A.',
  rauw: 'Geen rauw vlees of rauwe vis onder 4 jaar.',
  rauwmelk: 'Geen kaas of melk van rauwe melk (zoals boerenkaas) onder 4 jaar.',
  noten: 'Geen hele noten of pinda’s onder 4 jaar (verslikken); geef notenpasta.',
  kaas13: 'Voor 1–3 jaar telt alleen zachte kaas; gewone kaas bevat veel zout en verzadigd vet.',
  zout: 'Veel zout; de nieren van kinderen tot 4 jaar kunnen dat nog niet goed verwerken.',
  druif: 'Halveer druiven en snoeptomaatjes onder 4 jaar (verslikken).',
};

const RAW = `
groente|Groente|groente|in|groente,groenten,groentemix,wokgroente,roerbakgroente,soepgroente,diepvriesgroente,rauwkost,snijbiet,waterkers,koolraap,pastinaak,schorseneren,artisjok,okra,raapstelen,postelein,taugé,tauge,venkel,koolrabi,paksoi,pak choi,chinese kool,snijbonen,groene groente
broccoli|Broccoli|groente|in|broccoli,broccoliroosjes,bimi|ol:50 roosje:15
bloemkool|Bloemkool|groente|in|bloemkool,bloemkoolroosjes,bloemkoolrijst|ol:50 roosje:15
wortel|Wortel|groente|in|wortel,wortels,wortelen,worteltjes,winterpeen,bospeen,peen,wortelreepjes,wortelschijfjes|ol:50 stuk:50 reep:8
sperziebonen|Sperziebonen|groente|in|sperziebonen,sperzieboontjes,haricots verts,boontjes
doperwten|Doperwten/peultjes|groente|in|doperwten,doperwtjes,erwtjes,erwten,peultjes,peulen,sugarsnaps,tuinbonen,tuinboontjes,erwten en worteltjes
spinazie|Spinazie|groente|in|spinazie,bladspinazie,babyspinazie
spinazie_creme|Spinazie à la crème|groente|uit|spinazie a la creme,a la creme,roomspinazie,spinazie creme|||Kies spinazie zonder room of zout (vers of diepvries).
sla|Sla|groente|in|sla,slamix,kropsla,ijsbergsla,veldsla,rucola,romaine,eikenbladsla,salade,little gem,melange|hand:10 ol:25
komkommer|Komkommer|groente|in|komkommer,komkommers,minikomkommer,snackkomkommer|schijf:8 reep:15 ol:50
komkommersalade|Komkommersalade|groente|uit|komkommersalade,farmersalade,selleriesalade,koolsla,rauwkostsalade|el:25|k=d|Kies gewone komkommer of rauwkost zonder dressing.
tomaat|Tomaat|groente|in|tomaat,tomaten,tomaatjes,cherrytomaat,cherrytomaten,snoeptomaat,snoeptomaatjes,trostomaten,romatomaten,pomodori|stuk:80 cherry:15 ol:50|w13=druif
paprika|Paprika|groente|in|paprika,paprikas,puntpaprika,snackpaprika,paprikareepjes|reep:15 stuk:150 ol:50
courgette|Courgette|groente|in|courgette,courgettes,courgetti
prei|Prei|groente|in|prei,preien,preiringen
ui|Ui|groente|in|ui,uien,rode ui,sjalot,sjalotten,lente ui,lenteui,bosui,uitjes|stuk:80 el:10
knoflook|Knoflook|groente|in|knoflook,knoflookteen,knoflookteentjes|teen:4
champignons|Champignons/paddenstoelen|groente|in|champignon,champignons,paddenstoel,paddenstoelen,kastanjechampignons,oesterzwammen,shiitake,portobello
pompoen|Pompoen|groente|in|pompoen,flespompoen,butternut,hokkaido
biet|Rode biet|groente|in|biet,bieten,rode biet,rode bieten,bietjes
kool|Kool|groente|in|kool,rode kool,witte kool,spitskool,savooiekool,groene kool
rodekool_appel|Rode kool met appel|groente|?|rode kool appel,rodekool appel,rode kool met appeltjes||||Vaak met toegevoegde suiker; controleer het etiket.
boerenkool|Boerenkool|groente|in|boerenkool
andijvie|Andijvie|groente|in|andijvie
spruitjes|Spruitjes|groente|in|spruitjes,spruiten
selderij|Selderij|groente|in|bleekselderij,knolselderij,selderij,selder|ol:50 stuk:40
aubergine|Aubergine|groente|in|aubergine,aubergines
mais|Maïs|groente|?|mais,maiskorrels,maiskolf,maiskolfjes,suikermais|ol:50 el:15|||Mais uit blik bevat vaak toegevoegd zout of suiker; controleer het etiket.
avocado|Avocado|groente|in|avocado,avocados|stuk:100 el:15
asperges|Asperges|groente|in|asperge,asperges,groene asperges
radijs|Radijs|groente|in|radijs,radijsjes|stuk:8
snoepgroente|Snoepgroente|groente|in|snoepgroente,snackgroente,snack groente,snackgroenten,groentesnack|stuk:15 hand:30
tomatenpuree|Tomatenpuree|groente|in|tomatenpuree,tomatenconcentraat|el:15 tl:5
passata|Passata/tomatenblokjes|groente|in|passata,gezeefde tomaten,tomatenblokjes,tomaten blokjes,gepelde tomaten,tomaten in blik|ol:50 el:15|||Kies zonder toegevoegd zout.
zuurkool|Zuurkool|groente|uit|zuurkool|ol:50|k=d|Zuurkool bevat veel zout; kies verse kool.
zuur|Ingelegde groente|groente|uit|augurk,augurken,augurkjes,zilveruitjes,amsterdamse uitjes,piccalilly,kimchi,zuurgoed,zeewiersalade,zeekraal|stuk:10|k=d|Ingelegde groente bevat veel zout; kies verse groente.
olijven|Olijven|groente|uit|olijf,olijven|stuk:4|k=d|Olijven bevatten veel zout.
fruit|Fruit|fruit|in|fruit,fruitmix,fruitsalade,fruitbakje,gemengd fruit,diepvriesfruit,vers fruit,fruitschaal|stuk:100 schaal:100 hand:50
appel|Appel|fruit|in|appel,appels,appeltje,appeltjes,elstar,jonagold,granny smith,pink lady,kanzi,goudreinet,appelpartjes,appelschijfjes|stuk:130 partje:20
peer|Peer|fruit|in|peer,peren,conference,doyenne|stuk:140 partje:20
banaan|Banaan|fruit|in|banaan,bananen,babybanaan,babybananen|stuk:100 half:50
sinaasappel|Sinaasappel|fruit|in|sinaasappel,sinaasappels,handsinaasappels,perssinaasappels|stuk:140 partje:20
mandarijn|Mandarijn|fruit|in|mandarijn,mandarijnen,clementine,clementines,satsuma|stuk:60 partje:6
kiwi|Kiwi|fruit|in|kiwi,kiwis,kiwi gold|stuk:70
aardbei|Aardbeien|fruit|in|aardbei,aardbeien|stuk:12 hand:50
druiven|Druiven|fruit|in|druif,druiven,witte druiven,blauwe druiven,pitloze druiven|stuk:5 hand:50|w13=druif
bessen|Bessen|fruit|in|blauwe bessen,blauwebessen,bosbessen,frambozen,bramen,rode bessen,bessen,zwarte bessen|hand:50 el:15
meloen|Meloen|fruit|in|meloen,watermeloen,galiameloen,cantaloupe,honingmeloen|partje:100
mango|Mango|fruit|in|mango,mangostukjes|partje:50 stuk:200
ananas|Ananas|fruit|in|ananas,ananasstukjes,ananasschijven|schijf:80 stukje:15
steenvrucht|Perzik/pruim/kersen|fruit|in|perzik,perziken,nectarine,nectarines,abrikoos,abrikozen,pruim,pruimen,kersen,kers|stuk:100
gedroogd|Gedroogd fruit|fruit|in|rozijnen,krenten,gedroogde abrikozen,gedroogd fruit,dadels,dadel,vijgen,gedroogde mango,gedroogde appel|doosje:14 el:10 stuk:8|||In de Schijf zonder toegevoegd suiker.
appelmoes|Appelmoes|fruit|?|appelmoes,appelmoes in pot|el:20 schaal:100|||Vaak met toegevoegd suiker; kies zonder toegevoegde suiker.
appelmoes_zs|Appelmoes zonder suiker|fruit|in|appelmoes xnosugar,fruitmoes xnosugar,appel peer moes xnosugar|el:20 schaal:100
fruit_siroop|Fruit op siroop|fruit|uit|op siroop,in siroop,lichte siroop,fruitcocktail|schaal:100||Kies fruit op eigen sap of vers fruit.
knijpfruit|Knijpfruit|fruit|uit|knijpfruit,knijpzakje,fruitknijpzak,fruit2day,fruit 2 day,fruitreep,fruitrepen,fruitrolletje,fruitstaafje|stuk:90||Geef liever een stuk fruit.
kokos|Kokos|fruit|uit|kokos,kokosrasp,kokosnoot,kokosmelk,kokosroom|el:5|k=d|Kokos bevat veel verzadigd vet.
brood_volkoren|Volkorenbrood|brood|in|volkorenbrood,volkoren @brood,fijn volkoren,grof volkoren,volkorenbol,volkorenbollen,volkoren pistolet,speltvolkoren,volkoren spelt,volkoren boterham|snee:35 halvesnee:17.5 bol:50
brood_bruin|Bruinbrood|brood|in|bruinbrood,bruin @brood,bruine @brood,tarwebrood,tarwe volkoren|snee:35 halvesnee:17.5 bol:50
brood_rogge|Roggebrood|brood|in|roggebrood,pumpernickel,friese roggebrood|snee:45
brood_wit|Witbrood|brood|uit|witbrood,wit @brood,witte @brood,casino,tijgerbrood,tijger,stokbrood,baguette,ciabatta,pistolet,pistolets,witte bollen,puntjes,afbakbroodjes,afbakbrood,focaccia,brioche,hamburgerbroodjes,hamburgerbollen,hotdogbroodjes,toastbrood,bagel,bagels,sandwiches|snee:35 halvesnee:17.5 bol:50|not=volkoren,bruin,bruine,rogge|Kies volkoren- of bruinbrood.
brood_onbekend|Brood (soort onbekend)|brood|?|brood,boterham,boterhammen,broodje,broodjes,bolletje,bolletjes,meergranen,meergranenbrood,spelt,speltbrood,desem,desembrood,zonnebloembrood,waldkorn,maisbrood,vloerbrood,zuurdesem|snee:35 halvesnee:17.5 bol:50|||Controleer of er volkoren of bruin op het etiket staat.
krentenbol|Krentenbol/suikerbrood|brood|uit|krentenbol,krentenbollen,krentenbrood,rozijnenbrood,rozijnenbollen,suikerbrood,kerststol,stol,paasbrood|bol:50 snee:35|k=w|Een volkoren boterham is een betere keuze.
croissant|Croissant/hartig broodje|brood|uit|croissant,croissants,chocoladebroodje,saucijzenbroodje,saucijzenbroodjes,worstenbroodje,worstenbroodjes,kaasbroodje,kaasbroodjes,pain au chocolat,bladerdeeg,appelflap|stuk:45|k=w|Een volkoren boterham is een betere keuze.
beschuit_vk|Volkoren beschuit|brood|in|volkoren beschuit,volkorenbeschuit|stuk:10
beschuit|Beschuit|brood|uit|beschuit,beschuiten,bolletje beschuit|stuk:10|k=d|Kies volkoren beschuit.
cracker_vk|Volkoren cracker|brood|in|volkoren cracker,volkoren crackers,volkorencrackers,volkoren knackebrod,knackebrod volkoren,rogge knackebrod,volkoren toast|stuk:10
cracker|Cracker/toast|brood|uit|cracker,crackers,knackebrod,toast,toastjes,cream crackers,crostini,soepstengel,soepstengels,grissini,croutons|stuk:10|k=d|Kies een volkoren cracker die in de Schijf staat.
rijstwafel|Rijst- of maïswafel|brood|uit|rijstwafel,rijstwafels,maiswafel,maiswafels,rijstcracker,rijstkoekje,rijstkoekjes,maiswafeltjes|stuk:8|k=d|Kies een volkoren cracker of boterham.
wrap_vk|Volkoren wrap/pita|brood|in|volkoren wrap,volkoren wraps,volkorenwrap,volkoren tortilla,volkoren pita,volkorenpita|stuk:60
wrap|Wrap/pita|brood|uit|wrap,wraps,tortilla,tortillas,pita,pitabroodje,pitabroodjes,naan,flatbread,pizzabodem|stuk:60|not=volkoren|Kies volkoren wraps of pita.
pannenkoek_vk|Volkoren pannenkoek|brood|in|volkoren pannenkoek,volkoren pannenkoeken,volkoren pancakes|stuk:50
pannenkoek|Pannenkoek|brood|uit|pannenkoek,pannenkoeken,pancake,pancakes,poffertjes,flensjes,pannenkoekmix,pannenkoekenmix,beslagmix|stuk:50|not=volkoren|Bak pannenkoeken met (half) volkorenmeel.
meel_vk|Volkorenmeel|brood|in|volkorenmeel,volkoren meel,volkorenbloem,speltmeel volkoren|el:10
bloem|Bloem/witte meel|brood|uit|bloem,tarwebloem,patentbloem,zelfrijzend bakmeel,zelfrijzend,cakemeel,bakmeel|el:10|not=volkoren|Gebruik (half) volkorenmeel.
havermout|Havermout/Brinta|brood|in|havermout,havervlokken,oats,oatmeal,porridge,brinta,volkoren ontbijtgranen|el:10 portie:30
muesli_zs|Muesli zonder suiker|brood|in|muesli xnosugar,ongezoete muesli,muesli zonder toegevoegde suiker|el:10 portie:30
muesli|Muesli|brood|?|muesli|el:10 portie:30|||Muesli zonder toegevoegd suiker staat in de Schijf; controleer het etiket.
cruesli|Krokante muesli/granola|brood|uit|cruesli,granola,krokante muesli,crunchy muesli|el:10 portie:30||Kies havermout of muesli zonder toegevoegde suiker.
ontbijtgranen|Gezoete ontbijtgranen|brood|uit|cornflakes,choco pops,chocopops,frosties,honey pops,cheerios,rice krispies,coco pops,kelloggs,ontbijtgranen,weetabix,special k,smacks,tresor,kinderontbijt|el:10 portie:30||Kies havermout of Brinta.
pasta_vk|Volkorenpasta|graan|in|volkorenpasta,volkoren @pasta,volkorenspaghetti,volkorenpenne,volkorenmacaroni|ol:50 rauw:2.5
pasta|Witte pasta|graan|uit|@pasta|ol:50 rauw:2.5|not=volkoren,volkorenpasta,linzenpasta,kikkererwtenpasta,erwtenpasta|Kies volkorenpasta.
pasta_peul|Peulvruchtenpasta|graan|in|linzenpasta,kikkererwtenpasta,erwtenpasta,bonenpasta,peulvruchtenpasta|ol:50 rauw:2.5
rijst_zv|Zilvervliesrijst|graan|in|zilvervliesrijst,zilvervlies,bruine rijst,volkoren rijst,volkorenrijst,wilde rijst|ol:50 rauw:2.7
rijst|Witte rijst|graan|uit|rijst,basmati,basmatirijst,jasmijnrijst,pandanrijst,risotto,risottorijst,sushirijst,witte rijst,langgraanrijst|ol:50 rauw:2.7|not=zilvervlies,bruine,volkoren,wilde|Kies zilvervliesrijst.
couscous_vk|Volkoren couscous|graan|in|volkoren couscous,volkorencouscous,volkoren parelcouscous|ol:50 rauw:2.5
couscous|Couscous|graan|uit|couscous,parelcouscous|ol:50 rauw:2.5|not=volkoren|Kies volkoren couscous.
bulgur|Bulgur|graan|in|bulgur,bulghur|ol:50 rauw:2.5
quinoa|Quinoa/boekweit/gierst|graan|in|quinoa,boekweit,amarant,amaranth,gierst,gort,parelgort|ol:50 rauw:2.7
noedels_vk|Volkoren noedels|graan|in|volkoren noedels,volkorennoedels,volkoren mie,soba,boekweitnoedels|ol:50 rauw:2.5
noedels|Noedels/mie|graan|uit|noedels,mie,mihoen,ramen,eiermie,woknoedels,udon,rijstnoedels|ol:50 rauw:2.5|not=volkoren|Kies volkoren noedels.
aardappel|Aardappelen|graan|in|aardappel,aardappelen,aardappels,krieltjes,kriel,piepers,vastkokende,kruimige,roseval,nicola,opperdoezer|stuk:60 kriel:25 ol:50
puree|Aardappelpuree|graan|in|puree,aardappelpuree,stamppot|ol:50|||In de Schijf als je geen zout of suiker toevoegt.
puree_poeder|Puree uit pakje|graan|uit|pureepoeder,puree poeder,pureevlokken,instant puree,puree mix,aardappelpureepoeder|ol:50||Maak puree van verse aardappelen.
zoete_aardappel|Zoete aardappel|graan|in|zoete aardappel,zoete aardappelen,bataat|stuk:150 ol:50
friet|Friet (gefrituurd)|graan|uit|patat,friet,frites,patatje,frietjes|portie:50|k=w|Maak friet in de oven of airfryer zonder zout.
ovenfriet|Ovenfriet/aardappelpartjes|graan|?|ovenfriet,ovenfrites,airfryer friet,airfryerfriet,ovenpatat,diepvriesfriet,aardappelpartjes,aardappelschijfjes,wedges,rosti|portie:50|||In de Schijf als er geen zout is toegevoegd; controleer het etiket.
kroketjes|Aardappelkroketjes|graan|uit|aardappelkroketjes,kroketjes,aardappelrondjes,hash browns|stuk:20|k=w|Kies gekookte of gebakken aardappelen.
gnocchi|Gnocchi|graan|?|gnocchi|ol:50
peul|Bonen|peulvruchten|in|peulvruchten,bonen,bonenmix,bruine bonen,kidneybonen,witte bonen,zwarte bonen,borlottibonen,cannellinibonen,limabonen,kapucijners,mungbonen,pintobonen|ol:50 el:15 rauw:2.2|||Kies zonder toegevoegd zout of spoel ze af.
kikkererwten|Kikkererwten|peulvruchten|in|kikkererwten,kikkererwt|ol:50 el:15 rauw:2.2
linzen|Linzen/spliterwten|peulvruchten|in|linzen,rode linzen,groene linzen,beluga linzen,spliterwten|ol:50 el:15 rauw:2.5
edamame|Edamame/sojabonen|peulvruchten|in|edamame,sojabonen,sojaboontjes|ol:50 hand:30
bonen_saus|Bonen in saus|peulvruchten|uit|bonen in tomatensaus,witte bonen in tomatensaus,baked beans,bonen in saus|ol:50||Kies bonen zonder saus en voeg zelf tomaat toe.
hummus|Hummus|peulvruchten|?|hummus,houmous|el:15 besmeer:10|||In de Schijf met genoeg peulvrucht en weinig zout; controleer het etiket.
falafel|Falafel|peulvruchten|?|falafel,falafelballetjes|stuk:20|||Niet gefrituurd en met weinig zout staat het in de Schijf.
tofu|Tofu/tempé naturel|peulvruchten|in|tofu,tempe,tofu naturel,tempe naturel,tofublok|portie:50
tofu_gek|Gemarineerde tofu/tempé|peulvruchten|?|gemarineerde tofu,tofu gemarineerd,gekruide tofu,tempe reepjes,gekruide tempe,tempe gemarineerd,tofu reepjes,tofublokjes|portie:50|||Let op zout en suiker op het etiket.
noten_zz|Ongezouten noten/zaden|noten|in|xnosalt noten,xnosalt pindas,xnosalt cashewnoten,walnoten,hazelnoten,amandelen,pecannoten,paranoten,macadamia,studentenhaver,zaden,pitten,zonnebloempitten,pompoenpitten,sesamzaad,sesam,lijnzaad,chiazaad,hennepzaad,pijnboompitten|hand:15 el:10|w13=noten
noten_g|Gezouten noten|noten|uit|gezouten,borrelnoten,japanse mix,cocktailnoten,chocoladepinda,chocoladepindas,honingpinda,honingpindas,coated peanuts|hand:15||Kies ongezouten noten (onder 4 jaar als notenpasta).
noten_onb|Noten|noten|?|noten,nootjes,pindas,pinda,cashewnoten,cashews,pistachenoten,pistache,notenmix,mixed nuts|hand:15 el:10|w13=noten||Kies ongezouten.
notenpasta|Notenpasta 100%|noten|in|100procent pindakaas,pindakaas 100procent,100procent pinda,xnosalt pindakaas,pindakaas xnosalt,notenpasta,amandelpasta,cashewpasta,100procent hazelnootpasta,pindapasta
pindakaas|Pindakaas|noten|uit|pindakaas,calve pindakaas|||Kies 100% pindakaas zonder toegevoegd zout of suiker.
vis|Vis|vis|in|vis,visfilet,zalm,zalmfilet,kabeljauw,kabeljauwfilet,koolvis,pangasius,tilapia,schol,scholfilet,heek,wijting,forel,makreel,sardines,sardientjes,tonijn,tonijnstukken,garnalen,gamba,gambas,scampi,mosselen,inktvis,zeebaars,dorade,victoriabaars,vispakket|portie:50
vis_paneer|Gepaneerde vis|vis|?|lekkerbek,lekkerbekje,kibbeling,vissticks,visstick,fishsticks,fish sticks,gepaneerde vis,visburger,visnuggets|stuk:25 portie:50|||In de Schijf bij minstens 70% vis en niet te veel zout; controleer het etiket.
vis_gerookt|Gerookte vis|vis|?|gerookte zalm,gerookte makreel,gerookte forel,bokking,paling|plak:10 portie:50|||Vaak veel zout; controleer het etiket.
haring|Haring|vis|?|haring,hollandse nieuwe,maatjes,zoute haring,zure haring,rolmops|stuk:50|w13=rauw||Vaak veel zout.
surimi|Surimi/visvervanger|vis|uit|surimi,krabsticks,krab sticks,crab sticks,visvervanger,vegan tonijn|stuk:15||Kies echte vis zoals zalm of kabeljauw.
ei|Ei|ei|in|ei,eieren,eitje,eitjes,scharreleieren,kippeneieren,omelet,roerei,spiegelei,gekookt ei
eiersalade|Eiersalade|ei|uit|eiersalade,gevuld ei,gevulde eieren|el:25||Geef een gekookt ei op brood.
kip|Kip/kalkoen (vers)|vlees|in|kipfilet,kipfilets,kippenfilet,kipdijfilet,kippendij,kippendijen,kipdij,kipdrumsticks,drumsticks,kippenpoten,kippenbouten,kipbout,hele kip,kip,kipreepjes,kipfiletreepjes,kipblokjes,kipfiletblokjes,kipgehakt,kalkoen,kalkoenfilet,kalkoenreepjes,scharrelkip,konijn,eendenborst|portie:50
kip_bewerkt|Gemarineerde kip/shoarma|vlees|uit|kipshoarma,shoarma,gyros,kipgyros,gemarineerde kip,kip gemarineerd,kippenvleugels,kipkluifjes,kipspiesjes,sate,satespiesjes,kip tandoori,kip tikka,pulled chicken|portie:50||Kies onbewerkte kip en kruid zelf zonder zout.
kip_paneer|Kipnuggets/schnitzel|vlees|uit|kipnuggets,nuggets,kipschnitzel,schnitzel,cordon bleu,kipcorn,kipburger,crispy chicken,chicken nuggets,kipkrokant|stuk:20|k=w|Kies onbewerkte kipfilet.
rund_mager|Mager rundvlees|vlees|in|mager rundergehakt,rundergehakt mager,tartaar,biefstuk,runderbiefstuk,kogelbiefstuk,entrecote,ossenhaas,riblappen,riblap,runderreepjes,rundvlees,sucadelappen,runderlappen|portie:50|red
carpaccio|Carpaccio|vlees|in|carpaccio|plak:10|red out13 w13=rauw
gehakt|Gehakt/hamburger|vlees|uit|gehakt,rundergehakt,half om half gehakt,half om half,varkensgehakt,gehaktballen,gehaktbal,gehaktballetjes,hamburger,hamburgers,burgers,slavink,slavinken,saucijs,saucijzen,blinde vinken|portie:50|red|Kies mager rundergehakt of kipgehakt.
varken|Mager varkensvlees|vlees|in|varkenshaas,varkensfilet,varkensfiletlap,hamlap,mager hamlap,fricandeau,haaskarbonade,varkenshaasmedaillons,varkensreepjes,varkenslappen|portie:50|red
varken_vet|Vet varkensvlees|vlees|uit|speklap,speklappen,spareribs,karbonade,schouderkarbonade,procureur,buikspek,varkensribben,porchetta,pulled pork|portie:50|red|Kies varkenshaas of magere hamlap.
lam|Lam/wild|vlees|in|lamsvlees,lamskotelet,lamskoteletten,lamsbout,lamsrack,lamsfilet,hertenbiefstuk,hert,wild|portie:50|red
worst|Worst|vlees|uit|worst,worstjes,rookworst,braadworst,knakworst,knakworstjes,frankfurter,cocktailworstjes,chipolata,merguez,bratwurst,hotdog|stuk:25|red k=w w13=zout|Kies onbewerkt vlees, vis of peulvruchten.
spek|Spek/bacon|vlees|uit|spek,spekjes,spekreepjes,spekblokjes,bacon,ontbijtspek,pancetta,lardons|el:10 plak:10|red k=w w13=zout|Gebruik geen spek of maar heel weinig.
vleeswaren|Vleeswaren|vlees|uit|vleeswaren,ham,beenham,achterham,schouderham,boterhamworst,cervelaat,salami,chorizo,rookvlees,gebraden gehakt,pastrami,rosbief,casselerrib,pekelvlees,hamworst,leverkaas,grillworst,snijworst,fricandeau beleg,vleesbeleg|plak:11|red k=w w13=zout|Vleeswaren bevatten veel zout; kies kaas 30+, ei, hummus of notenpasta.
vleeswaren_wit|Kip- of kalkoenbeleg|vlees|uit|kipfilet plakken,kipfilet beleg,gerookte kipfilet,gegrilde kipfilet,kalkoenfilet plakken,kalkoenfilet beleg,gerookte kalkoen,kipfilet vleeswaren,kipfilet naturel plakken,kipbeleg|plak:11|k=w w13=zout|Vleeswaren bevatten veel zout; kies ei, hummus of notenpasta.
rauwe_ham|Rauwe ham|vlees|uit|rauwe ham,parmaham,serranoham,prosciutto,coppa|plak:11|red k=w w13=rauw|Vleeswaren bevatten veel zout.
leverworst|Leverworst/paté|vlees|uit|leverworst,smeerleverworst,pate,leverpastei,smeerworst|el:15 besmeer:10|red k=w w13=lever|Geef ei, hummus of notenpasta op brood.
filet_am|Filet americain|vlees|uit|filet americain,americain,ossenworst|besmeer:15|red k=w w13=rauw|Geef ei, hummus of notenpasta op brood.
vleessalade|Vlees- of vissalade|vlees|uit|kipkerriesalade,kip kerrie salade,huzarensalade,beenhamsalade,vleessalade,tonijnsalade,zalmsalade,krabsalade|el:25|k=w|Kies kaas 30+, ei of hummus.
vega|Vleesvervanger|vega|?|vegaburger,vegetarische burger,groenteburger,vega gehakt,vegagehakt,vegetarisch gehakt,vegetarische balletjes,vegakip,vegetarische kipstukjes,vegetarische stukjes,vivera,de vegetarische slager,garden gourmet,quorn,seitan,vegan burger,plantaardige burger,veggie burger,vegaschnitzel,vegetarische schnitzel,vegaworst,vegetarische nuggets|portie:50|||In de Schijf als het verrijkt is met ijzer en vitamine B12 en niet te zout; controleer het etiket.
vega_beleg|Vegetarische vleeswaren|vega|uit|vegetarische vleeswaren,vega vleeswaren,vegetarische boterhamworst,vega beleg,plantaardig beleg|plak:11|k=d|Kies kaas 30+, ei, hummus of notenpasta.
melk|Halfvolle/magere melk|zuivel|in|melk,halfvol melk,mager melk,melk halfvol,melk mager,koemelk,verse melk,houdbare melk,lactosevrije melk,weidemelk,bio melk,melk 0procent|beker:150 glas:200 el:15|drink ml
melk_vol|Volle melk|zuivel|uit|vol melk,melk vol,boerenmelk|beker:150 glas:200|ml|Kies halfvolle of magere melk.
melk_rauw|Rauwe melk|zuivel|uit|rauwe melk,rauwmelks,ongepasteuriseerde melk|beker:150|ml w13=rauwmelk|Kies halfvolle of magere melk.
karnemelk|Karnemelk|zuivel|in|karnemelk|beker:150 glas:200|drink ml
yoghurt|Halfvolle/magere yoghurt|zuivel|in|halfvol yoghurt,mager yoghurt,yoghurt halfvol,yoghurt mager,yoghurt 0procent,skyr,skyr naturel,biogarde|schaal:75 el:15 beker:150|ml
yoghurt_onb|Yoghurt|zuivel|?|yoghurt,yoghurt naturel,naturel yoghurt|schaal:75 el:15 beker:150|ml||Kies halfvolle of magere yoghurt zonder suiker.
yoghurt_vol|Volle/Griekse yoghurt|zuivel|uit|vol yoghurt,yoghurt vol,griekse yoghurt,turkse yoghurt,griekse stijl,bulgaarse yoghurt,roomyoghurt|schaal:75 el:15|ml not=0procent,mager|Kies halfvolle of magere yoghurt.
toetje|Vruchtenyoghurt/vla/toetje|zuivel|uit|vruchtenyoghurt,yoghurt @smaak,kinderyoghurt,danoontje,petit filou,yoghurt met vruchten,fruityoghurt,toetje,toetjes,dessert,monte,mona,pudding,chocoladepudding,vla,vanillevla,chocoladevla,griesmeelpudding,rijstepap,rijstpap,kwarktoetje,kwark @smaak,vruchtenkwark,roomkwark,kwarkdessert|schaal:75|ml|Geef halfvolle yoghurt of magere kwark met vers fruit.
kwark|Magere kwark|zuivel|in|mager kwark,kwark mager,kwark 0procent,platte kaas|schaal:75 el:20|ml
kwark_onb|Kwark|zuivel|?|kwark,halfvol kwark,vol kwark|schaal:75 el:20|ml||Kies magere kwark.
drinkyoghurt|Drinkyoghurt/zuiveldrank|zuivel|uit|drinkyoghurt,yoghurtdrank,yoghurtdrink,fristi,actimel,yakult,zuiveldrank,breaker,vifit|beker:150 pakje:200|ml zoet|Geef water of halfvolle melk.
chocomel|Chocolademelk|zuivel|uit|chocolademelk,chocomel,choco melk,cacaomelk,chocomelk,warme chocolademelk|beker:150 pakje:200|ml zoet|Geef halfvolle melk of water.
optimel|Light zuiveldrank|zuivel|in|optimel,light drinkyoghurt,drinkyoghurt light,zuiveldrank light|beker:150|drink ml
room|Room/crème fraîche|zuivel|uit|slagroom,kookroom,room,creme fraiche,zure room,mascarpone,koffieroom,cremefraiche|el:20|ml k=d|Gebruik halfvolle melk of magere yoghurt in saus.
sojadrink|Sojadrink (verrijkt)|zuivel|in|sojadrink,soja drink,sojamelk,alpro soja,erwtendrink|beker:150 el:15|drink ml not=bio,vanille,chocolade,choco,aardbei
sojadrink_x|Sojadrink (bio of met smaak)|zuivel|uit|bio sojadrink,sojadrink bio,sojadrink vanille,sojadrink chocolade,soja chocolade,alpro vanille,alpro chocolade,bio sojamelk|beker:150|ml|Kies sojadrink verrijkt met calcium en vitamine B12 (niet biologisch).
sojayoghurt|Sojayoghurt (verrijkt)|zuivel|in|sojayoghurt,soja yoghurt,sojagurt,alpro naturel|schaal:75|ml not=bio,@smaak
sojayoghurt_x|Sojayoghurt (bio of met smaak)|zuivel|uit|bio sojayoghurt,sojayoghurt @smaak,sojayoghurt bio|schaal:75|ml|Kies verrijkte sojayoghurt naturel.
haverdrink|Haver-/amandel-/rijstdrink|zuivel|uit|haverdrink,havermelk,oatly,amandeldrink,amandelmelk,rijstdrink,rijstmelk,kokosdrink,cashewdrink,hazelnootdrink,plantaardige drink|beker:150|ml|Kies halfvolle melk of verrijkte sojadrink; haverdrink bevat te weinig eiwit.
dreumesmelk|Dreumes-/groeimelk|zuivel|?|dreumesmelk,peutermelk,groeimelk,opvolgmelk,nutrilon,kruimelmelk|beker:150|drink ml||Niet nodig vanaf 1 jaar; gewone halfvolle melk volstaat.
kaas30|Kaas 20+/30+|kaas|in|plus30,plus20,kaas light,milner,slankie|plak:15 el:7|out13 w13=kaas13
kaas48|Kaas 40+/48+|kaas|uit|plus40,plus45,plus48,plus50,plus60,goudse kaas,gouda,jong belegen,belegen,oude kaas,jonge kaas,extra belegen,overjarig,komijnekaas,edammer,leerdammer,maasdammer,old amsterdam,beemster,cheddar,emmentaler,gruyere,parmezaan,parmigiano,grana padano,pecorino,manchego,raclette,brie,feta,blauwe kaas,roquefort,gorgonzola,kaasstengels|plak:15 el:7|not=plus30,plus20 w13=kaas13|Kies 30+ kaas, of voor 1–3 jaar zachte kaas zoals mozzarella of hüttenkäse.
kaas_onb|Kaas (soort onbekend)|kaas|?|kaas,kaasplakken,kaasblokjes,geraspte kaas,kaas geraspt,strooikaas|plak:15 el:7|w13=kaas13||Kies 30+ kaas; voor 1–3 jaar zachte kaas.
zachte_kaas|Zachte kaas|kaas|in|mozzarella,mozzarella light,ricotta,huttenkase,cottage cheese,zuivelspread,philadelphia light,roomkaas light,verse geitenkaas,zachte geitenkaas,geitenkaas zacht,camembert|el:15 besmeer:10 plak:15
smeerkaas|Smeerkaas/roomkaas|kaas|uit|smeerkaas,roomkaas,philadelphia,boursin,kruidenkaas,smeltkaas,la vache qui rit,kiri,toastkaas|el:15 besmeer:10|w13=zout|Kies zuivelspread met weinig zout, hüttenkäse of mozzarella.
kaas_rauw|Rauwmelkse kaas|kaas|uit|boerenkaas,rauwmelkse kaas,au lait cru,rauwmelks|plak:15|w13=rauwmelk|Kies 30+ kaas van gepasteuriseerde melk.
halvarine|Halvarine/margarine (kuipje)|vetten|in|halvarine,margarine,blue band,becel,zachte margarine,smeerbaar vet,bertolli|besmeer:5 el:13 tl:4
olie|Olie/vloeibaar bakvet|vetten|in|olie,olijfolie,zonnebloemolie,arachideolie,koolzaadolie,raapzaadolie,sesamolie,wokolie,vloeibare margarine,bak en braad vloeibaar,vloeibaar bakken en braden,vloeibaar|el:13 tl:4
boter|Roomboter|vetten|uit|roomboter,boter,ghee,kruidenboter,bakboter|besmeer:5 el:13|not=boterham|Kies halvarine of margarine uit een kuipje, of vloeibaar bak- en braadvet.
vet_hard|Hard vet/kokosolie|vetten|uit|kokosolie,kokosvet,frituurvet,palmolie,reuzel,ossewit,ossenwit,harde margarine,blok margarine|el:13||Kies vloeibare olie of vloeibaar bak- en braadvet.
water|Water|dranken|in|water,kraanwater,bronwater,mineraalwater,spa,spa blauw,spa rood,chaudfontaine,sourcy,bruiswater,water met smaak,water met een smaakje|beker:150 glas:200 slok:50|ml
thee|Thee zonder suiker|dranken|in|thee,kruidenthee,rooibos,rooibosthee,vruchtenthee,muntthee,kamillethee,groene thee,zwarte thee,venkelthee,fruitthee,gemberthee|beker:150 glas:200|ml
koffie|Koffie|dranken|in|koffie,koffiebonen,espresso,koffiepads,koffiecups,nespresso,senseo|beker:150|ml
sap|Sap/smoothie|dranken|uit|sap,sapje,sapjes,vruchtensap,appelsap,sinaasappelsap,jus d orange,multivruchtensap,multisap,druivensap,perensap,ananassap,tomatensap,groentesap,wortelsap,bietensap,cranberrysap,smoothie,smoothies,appelsientje,kokoswater,verse jus|beker:150 pakje:200 glas:200|ml zoet k=w|Geef water of lichte thee, en fruit om te eten.
limonade|Limonade/frisdrank|dranken|uit|limonade,limonadesiroop,siroop,ranja,diksap,aanmaaklimonade,karvan cevitam,roosvicee,wicky,capri sun,caprisun,taksi,dubbeldrank,dubbelfris,dubbelfrisss,fruitdrank,fruitdrink,drinkpakje,ijsthee,ice tea,cola,fanta,sprite,7up,sinas,cassis,frisdrank,ginger ale,tonic,energiedrank,sportdrank,vitaminwater,rivella,fuze tea|beker:150 glas:200 pakje:200|ml zoet k=w|Geef water of lichte thee.
fris_light|Light frisdrank/limonade|dranken|uit|cola zero,cola light,pepsi max,zero sugar,light frisdrank,frisdrank light,limonade xnosugar,siroop xnosugar,ranja xnosugar,diksap xnosugar,limonadesiroop xnosugar,fanta zero,sprite zero|glas:200 beker:150|ml k=d|Water is de beste dorstlesser.
koekje|Koekje (klein)|overig|uit|koekje,koekjes,biscuit,biscuitjes,mariakaakje,mariakaakjes,maria biscuit,speculaas,speculaasjes,kinderkoekje,kinderkoekjes,liga,sultana,evergreen,bastogne,lu,prince,oreo,krakeling,eierkoek,kokosmakroon|stuk:10|treat k=d|Geef groente, fruit of een volkoren cracker.
koek|Koek/gebak|overig|uit|koek,stroopwafel,stroopwafels,ontbijtkoek,peperkoek,gemberkoek,roze koek,gevulde koek,spekkoek,boterkoek,gebak,taart,appeltaart,vlaai,cake,muffin,muffins,cupcake,brownie,donut,donuts,wafel,wafels,luikse wafel,tompouce,soesjes,mergpijp,kwarktaart|stuk:25|treat k=w|Houd het klein: voor een kind onder 4 jaar maximaal een kwart van een volwassen portie.
snoep|Snoep/chocolade|overig|uit|snoep,snoepjes,drop,dropjes,winegums,winegum,zuurtjes,lolly,lollys,chocolade,chocoladereep,chocola,melkchocolade,pure chocolade,bonbons,haribo,smarties,kitkat,mars,snickers,twix,milka,tonys chocolonely,chocolonely,paaseitjes,chocoladeletter,pepernoten,kruidnoten,schuimpjes,toffees,kauwgom,marshmallows,zuurstok,spekken|snoepje:5 blokje:7|treat k=d|Geef snoep eerder één keer per week dan elke dag, en houd het klein.
chips|Chips/zoutjes|overig|uit|chips,paprikachips,paprika chips,naturel chips,ribbelchips,pringles,lays,doritos,tortillachips,nachos,zoutjes,borrelzoutjes,tuc,popcorn,zoute stengels,pretzels,cheetos,wokkels,chipito,groentechips|hand:10 stuk:2|treat|Voor een kind 1–4 jaar zijn 2–3 chips een kinderportie.
ijs|IJs|overig|uit|ijs,ijsje,ijsjes,roomijs,waterijs,raket,raketje,magnum,cornetto,ola,sorbet,sorbetijs,frozen yoghurt,ijslolly,softijs,schepijs|bolletje:50 stuk:55|treat k=d|Houd het klein, bijvoorbeeld een raketje of een bolletje sorbetijs.
hagelslag|Zoet broodbeleg|overig|uit|hagelslag,chocoladehagel,vlokken,chocoladevlokken,vruchtenhagel,anijshagel,muisjes,gestampte muisjes,de ruijter,venz,chocopasta,chocoladepasta,choco pasta,nutella,hazelnootpasta,speculoospasta,kokosbrood|tl:5 el:10 besmeer:10|k=d|Kies notenpasta (100%), zuivelspread, hüttenkäse, banaan of groente op brood.
jam|Jam/appelstroop|overig|uit|jam,aardbeienjam,frambozenjam,abrikozenjam,kersenjam,bosvruchtenjam,confiture,fruitspread,fruitbeleg,marmelade,appelstroop,perenstroop,dadelstroop,halvajam|el:20 tl:7 besmeer:15|k=d|Kies notenpasta (100%), zuivelspread, banaan of groente op brood.
suiker|Suiker/honing|overig|uit|suiker,kristalsuiker,basterdsuiker,rietsuiker,poedersuiker,honing,agavesiroop,ahornsiroop,maple syrup,kokosbloesemsuiker,vanillesuiker|el:20 tl:5|k=d|Gebruik zo min mogelijk suiker.
zout|Zout/bouillon/smaakmaker|overig|uit|zout,keukenzout,zeezout,bouillon,bouillonblokje,bouillonblokjes,bouillonpoeder,maggi,aromat,ketjap,sojasaus,ketjap manis,vissaus,oestersaus,kipkruiden,gehaktkruiden,shoarmakruiden,nasi kruiden,mix voor,fixx,smaakmaker,jus,juspoeder,jus de veau,gravy|el:5 tl:5|k=d w13=zout|Gebruik losse kruiden zonder zout; voeg geen zout toe voor kinderen onder 4 jaar.
saus|Saus|overig|uit|saus,ketchup,tomatenketchup,mayonaise,mayo,fritessaus,curry,curryketchup,knoflooksaus,barbecuesaus,bbq saus,cocktailsaus,satesaus,pindasaus,sweet chili,chilisaus,sambal,mosterd,pesto,tapenade,dressing,slasaus,saladedressing,hollandaise,bearnaise,pastasaus,tomatensaus,bolognesesaus,spaghettisaus,dolmio,currysaus,woksaus,roomsaus,kaassaus,aioli,remoulade,tartaarsaus,tomato frito|el:17 tl:6|k=d|Gebruik weinig saus; maak tomatensaus zelf van passata of tomatenblokjes.
soep|Soep|overig|?|soep,tomatensoep,groentesoep,kippensoep,erwtensoep,snert,bruine bonensoep,unox soep,cup a soup,goulashsoep,pompoensoep,champignonsoep|kom:150|||Kant-en-klare soep bevat vaak veel zout; zelfgemaakte soep kun je als ingrediënten invoeren.
kant|Kant-en-klaar/snack|overig|uit|pizza,pizzas,lasagne,ovenschotel,kant en klaar,kant en klare maaltijd,magnetronmaaltijd,nasi,nasi goreng,bami,bami goreng,loempia,loempias,bitterbal,bitterballen,kroket,kroketten,frikandel,frikandellen,kaassouffle,mexicano,berenklauw,quiche,shoarmabroodje,doner,kebab,happy meal,mcdonalds,burger king,kfc,snack,snacks,sushi,sashimi,poke|stuk:50 portie:100|k=w|Kook zelf met verse ingrediënten; die kun je hier als gezinsgerecht invoeren.
babyvoeding|Baby-/peutervoeding|overig|?|!olvarit,babyvoeding,peuterhapje,groentepotje,fruitpotje,ellas kitchen,peutermaaltijd,kindermaaltijd,bambix,babypap,pap|potje:200|||Controleer het etiket.
neutraal|Kruiden/specerijen|overig|neutraal|kruiden,specerijen,peper,zwarte peper,kaneel,nootmuskaat,komijn,kerrie,currypoeder,kurkuma,paprikapoeder,chilipoeder,chilivlokken,oregano,basilicum,peterselie,dille,bieslook,koriander,tijm,rozemarijn,laurier,munt,gember,gemberpoeder,knoflookpoeder,uienpoeder,italiaanse kruiden,provencaalse kruiden,vanille,vanillestokje,vanille extract,gist,bakpoeder,baking soda,gelatine,agar agar,citroensap,limoensap,azijn,balsamico,wijnazijn,appelazijn,ijsblokjes,citroen,limoen,maizena|tl:2
geen|Geen voeding|geen|geen|luiers,luier,pampers,billendoekjes,vochtige doekjes,toiletpapier,wc papier,keukenpapier,keukenrol,tissues,zakdoekjes,wasmiddel,wasverzachter,afwasmiddel,vaatwastabletten,vaatwasmiddel,allesreiniger,schoonmaakmiddel,schoonmaak,ontkalker,shampoo,conditioner,douchegel,zeep,handzeep,tandpasta,tandenborstel,deodorant,scheermesjes,maandverband,tampons,zonnebrand,bodylotion,vuilniszakken,afvalzakken,aluminiumfolie,huishoudfolie,bakpapier,boterhamzakjes,diepvrieszakken,batterijen,kaarsen,bloemen,boeket,tulpen,planten,kattenvoer,hondenvoer,kattenbakvulling,dierenvoer,statiegeld,tas,tassen,bezorgkosten,servetten,lucifers,aansteker,paracetamol,pleisters,vitamine,vitamines,multivitamine,wattenstaafjes
`;

function parseUnits(spec, vak, flags) {
  const out = [];
  for (const part of (spec || DEFAULT_UNITS[vak] || '').split(/\s+/).filter(Boolean)) {
    const [k, v] = part.split(':');
    out.push({ k, label: UNIT_LABELS[k] || k, g: parseFloat(v) });
  }
  if (vak !== 'ei') {
    const base = flags.ml || vak === 'dranken' ? 'ml' : 'g';
    out.push({ k: base, label: UNIT_LABELS[base], g: 1 });
  }
  return out;
}

function parseFlags(s) {
  const f = {};
  for (const t of (s || '').split(/\s+/).filter(Boolean)) {
    const [k, v] = t.split('=');
    f[k] = v === undefined ? true : v;
  }
  if (f.not) f.not = f.not.split(',');
  return f;
}

export const FOODS = {};
for (const line of RAW.trim().split('\n')) {
  const [id, name, vak, st, kw, units, flagStr, swap, note] = line.split('|');
  const flags = parseFlags(flagStr);
  FOODS[id] = {
    id, name, vak, st, kw: kw.split(','), units: parseUnits(units, vak, flags),
    red: !!flags.red, drink: !!flags.drink, treat: !!flags.treat, zoet: !!flags.zoet, out13: !!flags.out13,
    k: flags.k || null, w13: flags.w13 || null, not: flags.not || [], swap: swap || '', note: note || '',
  };
}

export const UNKNOWN = { id: '?', name: 'Niet herkend', vak: null, st: '?', kw: [], units: [{ k: 'g', label: 'gram', g: 1 }],
  red: false, drink: false, treat: false, zoet: false, out13: false, k: null, w13: null, not: [], swap: '', note: 'Kies wat dit is.' };

// Eigen producttypes van de gebruiker (custom) hebben dezelfde vorm.
export function getFood(id, custom) {
  if (FOODS[id]) return FOODS[id];
  const c = custom?.find((x) => x.id === id);
  if (c) return { ...UNKNOWN, ...c, kw: [], units: c.units || parseUnits('', c.vak, {}), note: '' };
  return UNKNOWN;
}

export const VAK_LABEL = {
  groente: 'Groente', fruit: 'Fruit', brood: 'Brood en ontbijtgranen', graan: 'Graan en aardappel',
  zuivel: 'Zuivel', kaas: 'Kaas', vetten: 'Vetten en olie', noten: 'Noten en zaden', dranken: 'Dranken',
  peulvruchten: 'Peulvruchten, tofu en tempé', vis: 'Vis', ei: 'Ei', vlees: 'Vlees', vega: 'Vleesvervanger',
  overig: 'Overig',
};
