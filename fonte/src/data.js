// GeoGame — base de países e fronteiras terrestres
// Formato de cada linha: ISO2|Nome|Capital|Continente|lat|lon|apelidos;separados;por;ponto-e-vírgula
// Continentes: EU Europa · AS Ásia · EA Europa e Ásia · AF África · NA América do Norte
//              CA América Central e Caribe · SA América do Sul · OC Oceania
(function (root) {
const COUNTRIES = `
PT|Portugal|Lisboa|EU|39.6|-8.0|portugal
ES|Espanha|Madri|EU|40.2|-3.6|spain;españa
FR|França|Paris|EU|46.6|2.4|france
AD|Andorra|Andorra-a-Velha|EU|42.55|1.58|andorra
MC|Mônaco|Mônaco|EU|43.74|7.42|monaco;mónaco
BE|Bélgica|Bruxelas|EU|50.6|4.6|belgium
NL|Países Baixos|Amsterdã|EU|52.2|5.5|holanda;netherlands;holland
LU|Luxemburgo|Luxemburgo|EU|49.8|6.1|luxembourg
DE|Alemanha|Berlim|EU|51.1|10.4|germany;deutschland
CH|Suíça|Berna|EU|46.8|8.2|switzerland
LI|Liechtenstein|Vaduz|EU|47.16|9.55|listenstaine
AT|Áustria|Viena|EU|47.6|14.1|austria
IT|Itália|Roma|EU|42.8|12.6|italy
SM|San Marino|San Marino|EU|43.94|12.46|são marinho
VA|Vaticano|Cidade do Vaticano|EU|41.9|12.45|santa sé;holy see;vatican;cidade do vaticano
SI|Eslovênia|Liubliana|EU|46.1|14.8|slovenia;eslovénia
HR|Croácia|Zagreb|EU|45.1|15.6|croatia
BA|Bósnia e Herzegovina|Sarajevo|EU|44.2|17.8|bósnia;bosnia and herzegovina
ME|Montenegro|Podgorica|EU|42.8|19.3|montenegro
RS|Sérvia|Belgrado|EU|44.0|20.8|serbia
XK|Kosovo|Pristina|EU|42.6|20.9|kosovo
AL|Albânia|Tirana|EU|41.1|20.0|albania
MK|Macedônia do Norte|Escópia|EU|41.6|21.7|macedônia;macedónia do norte;north macedonia
GR|Grécia|Atenas|EU|39.1|22.0|greece
BG|Bulgária|Sófia|EU|42.7|25.3|bulgaria
RO|Romênia|Bucareste|EU|45.9|25.0|roménia;romania
MD|Moldávia|Chisinau|EU|47.2|28.5|moldova
UA|Ucrânia|Kiev|EU|49.0|31.4|ukraine
HU|Hungria|Budapeste|EU|47.2|19.4|hungary
SK|Eslováquia|Bratislava|EU|48.7|19.5|slovakia
CZ|Tchéquia|Praga|EU|49.8|15.5|república tcheca;república checa;chéquia;czechia;czech republic
PL|Polônia|Varsóvia|EU|52.1|19.4|polónia;poland
LT|Lituânia|Vilnius|EU|55.2|23.9|lithuania
LV|Letônia|Riga|EU|56.9|24.6|letónia;latvia
EE|Estônia|Tallinn|EU|58.7|25.5|estónia;estonia
BY|Belarus|Minsk|EU|53.7|28.0|bielorrússia
RU|Rússia|Moscou|EA|61.5|98.0|russia
FI|Finlândia|Helsinque|EU|64.5|26.0|finland
SE|Suécia|Estocolmo|EU|62.8|16.7|sweden
NO|Noruega|Oslo|EU|64.5|12.5|norway
DK|Dinamarca|Copenhague|EU|56.0|9.6|denmark
GB|Reino Unido|Londres|EU|54.0|-2.5|uk;united kingdom;grã-bretanha;inglaterra;great britain
IE|Irlanda|Dublin|EU|53.2|-8.0|ireland
IS|Islândia|Reykjavík|EU|64.9|-18.6|iceland
MT|Malta|Valletta|EU|35.9|14.4|malta
CY|Chipre|Nicósia|EU|35.0|33.2|cyprus
TR|Turquia|Ancara|EA|39.0|35.2|turkey;türkiye
GE|Geórgia|Tbilisi|AS|42.2|43.5|georgia
AM|Armênia|Erevan|AS|40.2|45.0|arménia;armenia
AZ|Azerbaijão|Baku|AS|40.3|47.7|azerbaijan
IR|Irã|Teerã|AS|32.5|54.3|irão;iran
IQ|Iraque|Bagdá|AS|33.0|43.7|iraq
SY|Síria|Damasco|AS|35.0|38.5|syria
LB|Líbano|Beirute|AS|33.9|35.9|lebanon
IL|Israel|Jerusalém (status internacional disputado)|AS|31.4|35.0|israel
PS|Palestina|Ramallah (sede administrativa)|AS|31.9|35.25|estado da palestina;palestine
JO|Jordânia|Amã|AS|31.2|36.5|jordan
SA|Arábia Saudita|Riad|AS|24.0|45.0|saudi arabia
KW|Kuwait|Cidade do Kuwait|AS|29.3|47.6|koweit;coveite
QA|Catar|Doha|AS|25.3|51.2|qatar
AE|Emirados Árabes Unidos|Abu Dhabi|AS|23.9|54.2|eau;uae;emirados;united arab emirates
OM|Omã|Mascate|AS|21.0|57.0|oman
YE|Iêmen|Sanaa|AS|15.6|47.6|iémen;yemen
BH|Bahrein|Manama|AS|26.0|50.55|bahrain;barém
KZ|Cazaquistão|Astana|AS|48.2|67.3|kazakhstan
UZ|Uzbequistão|Tashkent|AS|41.7|63.2|uzbekistan
TM|Turcomenistão|Asgabate|AS|39.0|59.4|turkmenistan;turquemenistão
KG|Quirguistão|Bishkek|AS|41.5|74.6|quirguizistão;kyrgyzstan
TJ|Tadjiquistão|Duchambe|AS|38.8|71.0|tajiquistão;tajikistan
AF|Afeganistão|Cabul|AS|33.9|66.0|afghanistan
PK|Paquistão|Islamabad|AS|29.9|69.4|pakistan
IN|Índia|Nova Délhi|AS|22.9|79.6|india
NP|Nepal|Katmandu|AS|28.3|84.0|nepal
BT|Butão|Thimphu|AS|27.4|90.4|bhutan
BD|Bangladesh|Daca|AS|23.8|90.3|bangladexe
MM|Mianmar|Naypyidaw|AS|21.2|96.5|myanmar;birmânia;burma
CN|China|Pequim|AS|36.5|103.8|china
MN|Mongólia|Ulan Bator|AS|46.8|103.1|mongolia
KP|Coreia do Norte|Pyongyang|AS|40.2|127.2|coréia do norte;north korea
KR|Coreia do Sul|Seul|AS|36.4|127.8|coréia do sul;south korea
JP|Japão|Tóquio|AS|36.5|138.5|japan
TW|Taiwan|Taipé|AS|23.7|121.0|taiwan
VN|Vietnã|Hanói|AS|16.0|106.3|vietname;vietnam
LA|Laos|Vientiane|AS|18.5|103.8|laos
KH|Camboja|Phnom Penh|AS|12.7|104.9|cambodia
TH|Tailândia|Bangkok|AS|15.1|101.0|thailand
MY|Malásia|Kuala Lumpur|AS|4.2|101.9|malaysia
SG|Singapura|Singapura|AS|1.35|103.8|singapore
BN|Brunei|Bandar Seri Begawan|AS|4.5|114.7|brunei
ID|Indonésia|Jacarta|AS|-2.5|118.0|indonesia
TL|Timor-Leste|Díli|AS|-8.8|125.9|timor;east timor
PH|Filipinas|Manila|AS|12.0|122.5|philippines
LK|Sri Lanka|Sri Jayawardenepura Kotte|AS|7.9|80.7|ceilão
MV|Maldivas|Malé|AS|3.2|73.2|maldives
EG|Egito|Cairo|AF|26.6|30.0|egypt
LY|Líbia|Trípoli|AF|27.0|17.0|libya
TN|Tunísia|Túnis|AF|34.0|9.5|tunisia
DZ|Argélia|Argel|AF|28.0|2.6|algeria
MA|Marrocos|Rabat|AF|31.8|-6.9|morocco
EH|Saara Ocidental|El Aaiún (território disputado)|AF|24.5|-13.0|sahara ocidental;western sahara
MR|Mauritânia|Nouakchott|AF|20.3|-10.4|mauritania
ML|Mali|Bamako|AF|17.4|-3.5|mali
NE|Níger|Niamey|AF|17.6|9.4|niger
TD|Chade|N'Djamena|AF|15.4|18.7|chad;tchad
SD|Sudão|Cartum|AF|15.9|30.0|sudan
SS|Sudão do Sul|Juba|AF|7.3|30.3|south sudan
ER|Eritreia|Asmara|AF|15.4|38.8|eritrea
ET|Etiópia|Adis Abeba|AF|8.6|39.6|ethiopia
DJ|Djibuti|Djibuti|AF|11.8|42.6|djibouti;jibuti
SO|Somália|Mogadíscio|AF|6.0|46.0|somalia
KE|Quênia|Nairóbi|AF|0.5|37.9|quénia;kenya
UG|Uganda|Kampala|AF|1.3|32.4|uganda
RW|Ruanda|Kigali|AF|-2.0|29.9|rwanda
BI|Burundi|Gitega|AF|-3.4|29.9|burundi
TZ|Tanzânia|Dodoma|AF|-6.3|34.8|tanzania
CD|RD Congo|Kinshasa|AF|-2.9|23.6|república democrática do congo;rdc;drc;congo-kinshasa;zaire
CG|Congo|Brazzaville|AF|-0.8|15.2|república do congo;congo-brazzaville
GA|Gabão|Libreville|AF|-0.6|11.8|gabon
GQ|Guiné Equatorial|Malabo|AF|1.6|10.5|equatorial guinea
CM|Camarões|Iaundé|AF|5.7|12.7|cameroon
CF|República Centro-Africana|Bangui|AF|6.6|20.5|centro-africana;rca;central african republic
NG|Nigéria|Abuja|AF|9.6|8.1|nigeria
BJ|Benin|Porto-Novo|AF|9.6|2.3|benim
TG|Togo|Lomé|AF|8.5|0.9|togo
GH|Gana|Acra|AF|7.9|-1.2|ghana
BF|Burkina Faso|Uagadugu|AF|12.3|-1.7|burkina
CI|Costa do Marfim|Yamoussoukro|AF|7.6|-5.6|côte d'ivoire;ivory coast
LR|Libéria|Monróvia|AF|6.4|-9.4|liberia
SL|Serra Leoa|Freetown|AF|8.5|-11.8|sierra leone
GN|Guiné|Conacri|AF|10.4|-10.9|guiné-conacri;guinea
GW|Guiné-Bissau|Bissau|AF|12.0|-15.0|guinea-bissau
SN|Senegal|Dacar|AF|14.4|-14.5|senegal
GM|Gâmbia|Banjul|AF|13.45|-15.4|gambia
AO|Angola|Luanda|AF|-12.3|17.5|angola
ZM|Zâmbia|Lusaka|AF|-13.4|27.8|zambia
MW|Malawi|Lilongwe|AF|-13.2|34.3|malaui
MZ|Moçambique|Maputo|AF|-17.3|35.5|mozambique
ZW|Zimbábue|Harare|AF|-19.0|29.8|zimbabwe
BW|Botsuana|Gaborone|AF|-22.2|23.8|botswana
NA|Namíbia|Windhoek|AF|-22.1|17.2|namibia
ZA|África do Sul|Pretória|AF|-29.0|25.1|south africa
LS|Lesoto|Maseru|AF|-29.6|28.2|lesotho
SZ|Essuatíni|Mbabane|AF|-26.5|31.5|eswatini;suazilândia;swaziland
MG|Madagascar|Antananarivo|AF|-19.4|46.7|madagáscar
MU|Maurício|Port Louis|AF|-20.3|57.6|ilhas maurício;mauritius
SC|Seicheles|Victoria|AF|-4.7|55.5|seychelles
KM|Comores|Moroni|AF|-11.9|43.9|comoros
CV|Cabo Verde|Praia|AF|15.1|-23.6|cape verde
ST|São Tomé e Príncipe|São Tomé|AF|0.3|6.7|sao tome
CA|Canadá|Ottawa|NA|58.0|-100.0|canada
US|Estados Unidos|Washington, D.C.|NA|39.8|-98.6|eua;usa;estados unidos da américa;united states
MX|México|Cidade do México|NA|23.6|-102.5|mexico
GT|Guatemala|Cidade da Guatemala|CA|15.7|-90.4|guatemala
BZ|Belize|Belmopan|CA|17.2|-88.7|belize
SV|El Salvador|San Salvador|CA|13.8|-88.9|salvador
HN|Honduras|Tegucigalpa|CA|14.8|-86.6|honduras
NI|Nicarágua|Manágua|CA|12.9|-85.0|nicaragua
CR|Costa Rica|San José|CA|9.9|-84.2|costa rica
PA|Panamá|Cidade do Panamá|CA|8.5|-80.1|panama
CU|Cuba|Havana|CA|21.6|-79.0|cuba
JM|Jamaica|Kingston|CA|18.1|-77.3|jamaica
HT|Haiti|Porto Príncipe|CA|19.0|-72.7|haiti
DO|República Dominicana|Santo Domingo|CA|18.9|-70.5|dominicana;dominican republic
BS|Bahamas|Nassau|CA|24.3|-76.6|bahamas
TT|Trinidad e Tobago|Port of Spain|CA|10.45|-61.3|trinidad;trinidad and tobago
BB|Barbados|Bridgetown|CA|13.2|-59.55|barbados
LC|Santa Lúcia|Castries|CA|13.9|-61.0|saint lucia
GD|Granada|St. George's|CA|12.1|-61.7|grenada
VC|São Vicente e Granadinas|Kingstown|CA|13.25|-61.2|saint vincent
AG|Antígua e Barbuda|Saint John's|CA|17.1|-61.8|antigua
DM|Dominica|Roseau|CA|15.4|-61.35|dominica
KN|São Cristóvão e Névis|Basseterre|CA|17.3|-62.7|são cristóvão;saint kitts
CO|Colômbia|Bogotá|SA|3.9|-73.1|colombia
VE|Venezuela|Caracas|SA|7.1|-66.2|venezuela
GY|Guiana|Georgetown|SA|4.8|-58.9|guyana
SR|Suriname|Paramaribo|SA|4.1|-55.9|surinã
EC|Equador|Quito|SA|-1.4|-78.4|ecuador
PE|Peru|Lima|SA|-9.2|-74.4|perú
BO|Bolívia|Sucre (La Paz é a sede do governo)|SA|-16.7|-64.7|bolivia
BR|Brasil|Brasília|SA|-10.8|-53.1|brazil
PY|Paraguai|Assunção|SA|-23.2|-58.4|paraguay
UY|Uruguai|Montevidéu|SA|-32.8|-56.0|uruguay
AR|Argentina|Buenos Aires|SA|-35.4|-65.2|argentina
CL|Chile|Santiago|SA|-30.0|-70.8|chile
AU|Austrália|Camberra|OC|-25.7|134.5|australia
NZ|Nova Zelândia|Wellington|OC|-41.5|172.8|new zealand
PG|Papua-Nova Guiné|Port Moresby|OC|-6.5|145.0|papua;papua new guinea
FJ|Fiji|Suva|OC|-17.8|178.0|fiji
SB|Ilhas Salomão|Honiara|OC|-9.6|160.2|salomão;solomon islands
VU|Vanuatu|Port Vila|OC|-16.0|167.5|vanuatu
WS|Samoa|Apia|OC|-13.7|-172.2|samoa
TO|Tonga|Nukualofa|OC|-21.2|-175.2|tonga
KI|Kiribati|Tarawa do Sul|OC|1.4|173.0|kiribati
FM|Micronésia|Palikir|OC|6.9|158.2|micronesia
MH|Ilhas Marshall|Majuro|OC|7.1|171.2|marshall
PW|Palau|Ngerulmud|OC|7.5|134.6|palau
NR|Nauru|Yaren|OC|-0.53|166.93|nauru
TV|Tuvalu|Funafuti|OC|-8.5|179.2|tuvalu
`;

// Fronteiras terrestres (cada par aparece uma vez).
// Regras: só fronteiras terrestres do território integral; territórios ultramarinos
// e dependências (Guiana Francesa, Gibraltar, bases britânicas em Chipre, São Martinho)
// ficam de fora. Ceuta/Melilla (Espanha–Marrocos) e Kaliningrado (Rússia–Polônia/Lituânia) contam.
const BORDERS = `
PT-ES ES-FR ES-AD ES-MA FR-AD FR-BE FR-LU FR-DE FR-CH FR-IT FR-MC
BE-NL BE-DE BE-LU NL-DE LU-DE DE-DK DE-PL DE-CZ DE-AT DE-CH
CH-IT CH-AT CH-LI AT-LI AT-IT AT-SI AT-HU AT-SK AT-CZ IT-SM IT-VA IT-SI
SI-HR SI-HU HR-HU HR-RS HR-BA HR-ME BA-RS BA-ME ME-RS ME-XK ME-AL
RS-HU RS-RO RS-BG RS-MK RS-XK XK-AL XK-MK AL-MK AL-GR MK-BG MK-GR
GR-BG GR-TR BG-RO BG-TR RO-HU RO-UA RO-MD MD-UA HU-SK HU-UA
SK-CZ SK-PL SK-UA CZ-PL PL-UA PL-BY PL-LT PL-RU LT-LV LT-BY LT-RU
LV-EE LV-RU LV-BY EE-RU BY-UA BY-RU UA-RU FI-SE FI-NO FI-RU NO-SE NO-RU GB-IE
TR-GE TR-AM TR-AZ TR-IR TR-IQ TR-SY GE-RU GE-AZ GE-AM AM-AZ AM-IR AZ-RU AZ-IR
RU-KZ RU-CN RU-MN RU-KP IR-IQ IR-TM IR-AF IR-PK IQ-SY IQ-JO IQ-SA IQ-KW
SY-LB SY-JO SY-IL LB-IL IL-JO IL-EG IL-PS PS-JO PS-EG JO-SA
SA-KW SA-QA SA-AE SA-OM SA-YE AE-OM OM-YE
KZ-CN KZ-KG KZ-UZ KZ-TM UZ-KG UZ-TJ UZ-AF UZ-TM TM-AF KG-TJ KG-CN TJ-AF TJ-CN
AF-PK AF-CN PK-IN PK-CN IN-CN IN-NP IN-BT IN-BD IN-MM NP-CN BT-CN BD-MM
MM-CN MM-LA MM-TH CN-MN CN-KP CN-VN CN-LA KP-KR LA-VN LA-KH LA-TH
TH-KH TH-MY KH-VN MY-BN MY-ID ID-TL ID-PG
EG-SD EG-LY MA-DZ MA-EH EH-DZ EH-MR DZ-TN DZ-LY DZ-NE DZ-ML DZ-MR TN-LY
LY-NE LY-TD LY-SD SD-TD SD-CF SD-SS SD-ER SD-ET SS-ET SS-KE SS-UG SS-CD SS-CF
ER-ET ER-DJ DJ-ET DJ-SO ET-SO ET-KE SO-KE KE-UG KE-TZ UG-TZ UG-RW UG-CD
RW-TZ RW-BI RW-CD BI-TZ BI-CD TZ-CD TZ-ZM TZ-MW TZ-MZ
CD-CF CD-CG CD-AO CD-ZM CG-CF CG-CM CG-GA CG-AO GA-CM GA-GQ GQ-CM
CM-NG CM-TD CM-CF CF-TD TD-NE TD-NG NE-NG NE-BJ NE-BF NE-ML NG-BJ
BJ-TG BJ-BF TG-GH TG-BF GH-BF GH-CI BF-CI BF-ML CI-ML CI-GN CI-LR
LR-GN LR-SL SL-GN GN-GW GN-SN GN-ML GW-SN SN-GM SN-ML SN-MR ML-MR
AO-ZM AO-NA ZM-MW ZM-MZ ZM-ZW ZM-BW ZM-NA MW-MZ MZ-ZW MZ-ZA MZ-SZ
ZW-BW ZW-ZA BW-NA BW-ZA NA-ZA ZA-LS ZA-SZ
CA-US US-MX MX-GT MX-BZ GT-BZ GT-HN GT-SV SV-HN HN-NI NI-CR CR-PA PA-CO
CO-VE CO-BR CO-PE CO-EC VE-GY VE-BR GY-SR GY-BR SR-BR EC-PE
PE-BR PE-BO PE-CL BO-BR BO-PY BO-AR BO-CL PY-BR PY-AR AR-BR AR-UY AR-CL UY-BR
HT-DO
`;

const CONTINENTS = {
  EU: 'Europa', AS: 'Ásia', EA: 'Europa e Ásia', AF: 'África',
  NA: 'América do Norte', CA: 'América Central e Caribe', SA: 'América do Sul', OC: 'Oceania'
};

root.GEO_DATA = { COUNTRIES, BORDERS, CONTINENTS };
})(typeof window !== 'undefined' ? window : globalThis);
