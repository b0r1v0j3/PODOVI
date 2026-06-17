// lib/data/essence-content.ts
// Sadržaj kompletne Essence stranice (opis, specifikacije, gradacije, obrade, vrste drveta,
// nega, prednosti, dokumenti). Izvor: alpod Essence tehnički listovi (PDF) + alpod opisi,
// verifikovano 2026-06-17. Dokumenti su migrirani na našu Supabase (bucket product-documents).

export type EssenceTextItem = { name: string; description: string };
export type EssenceFamily = { name: string; patterns: string; description: string; format: string };
export type EssenceSpecRow = { label: string; value: string };
export type EssenceDocument = { pattern: string; wood: string; size: string | null; url: string };

export const ESSENCE_INTRO =
  'Dobrodošli u Essence — premium kolekciju parketa po meri koja unosi lepotu prirodnih elemenata u vaš prostor. ' +
  'Inspirisana složenim obrascima iz prirode, Essence obuhvata tri familije: Geometry, Waves i Forest. ' +
  'Sve je dostupno u evropskom hrastu i američkom orahu, sa uljenom završnom obradom.';

export const ESSENCE_FAMILIES: EssenceFamily[] = [
  {
    name: 'Geometry',
    patterns: 'Rhombus · Trapezium · Mosaic',
    description:
      'Inspirisana geometrijskom harmonijom prirode. Oštre, čiste linije i dinamičan vizuelni efekat unose eleganciju i osećaj prostorne dubine.',
    format: 'Modul 180 × 208 mm, debljina 14–15 mm.',
  },
  {
    name: 'Waves',
    patterns: 'Ocean · Sea · Herringbone · Fish Scale',
    description:
      'Inspirisana fluidnim kretanjem vode. Nežne, tečne linije oponašaju graciozno kretanje talasa i unose spokojnu eleganciju.',
    format: 'Ocean i Sea: daske 220 × do 2190 mm (i XXL). Herringbone (riblja kost): 160 × 605 mm.',
  },
  {
    name: 'Forest',
    patterns: 'Trees · Flowers · Leaves · Branches',
    description:
      'Izuzetan raspon dimenzija dasaka, savršen za velike, otvorene prostore. Balans proporcije i prirodne elegancije.',
    format: 'Daske dužine 3–5 m (u koracima od 20 cm), širine 230–340 mm.',
  },
];

export const ESSENCE_SPECS_COMMON: EssenceSpecRow[] = [
  { label: 'Vrsta proizvoda', value: 'Parket po meri' },
  { label: 'Konstrukcija', value: 'Višeslojni inženjerski parket' },
  { label: 'Gornji sloj', value: '3 mm masivno drvo (hrast ili orah)' },
  { label: 'Jezgro', value: 'Breza (furnirska ploča)' },
  { label: 'Ukupna debljina', value: '14–15 mm (zavisi od uzorka)' },
  { label: 'Mikrofaza', value: '0,3 mm' },
  { label: 'Spoj', value: 'Usek i pero (T&G)' },
  { label: 'Završna obrada', value: 'Uljeno' },
  { label: 'Ugradnja', value: 'Puno lepljenje (beton, iverica ili drvena podloga) ili zakivanje na drvenu podlogu' },
  { label: 'Podno grejanje', value: 'Pogodno (uz protokol za ugradnju)' },
];

// Gradacije — tekst iz tehničkog lista (Elegant/Standard verbatim; Natural = srednja gradacija).
export const ESSENCE_GRADES: EssenceTextItem[] = [
  {
    name: 'Elegant',
    description: 'Drvo potpuno ujednačene strukture i boje daske. Dozvoljene su sitne kvržice; pukotine nisu dozvoljene.',
  },
  {
    name: 'Natural',
    description: 'Umerena prirodna raznolikost boje i karaktera drveta — sredina između Elegant i Standard gradacije.',
  },
  {
    name: 'Standard',
    description:
      'Daske sa prirodnom raznolikošću boje i pojavom beljike; kvržice mogu biti češće, a manje pukotine ispunjene su crnim ili prirodnim kitom.',
  },
];

// Površinske obrade — tekst iz tehničkog lista.
export const ESSENCE_FINISHES: EssenceTextItem[] = [
  { name: 'Brušeno', description: 'Glatka površina, brušena i zaštićena uljem, čuva prirodan izgled drveta.' },
  {
    name: 'Četkano',
    description: 'Meko drvo uklonjeno je četkama tako da ostaje samo tvrdo drvo. Površina je tvrđa i otpornija na ogrebotine i udarce.',
  },
  { name: 'Hoblano', description: 'Blago talasasta površina, zaštićena uljem, uz autentičan i rustičan izgled drveta.' },
  { name: 'Piljeno', description: 'Naglašena prirodna tekstura drveta, zaštićena uljem. Znatno povećana izdržljivost i otpornost.' },
];

export const ESSENCE_WOODS: EssenceTextItem[] = [
  { name: 'Evropski hrast', description: 'Topao, svetao ton i izražena tekstura; tvrd i izdržljiv — najčešći izbor za parket.' },
  { name: 'Američki orah', description: 'Bogata, tamnija boja i elegantna tekstura; luksuzan i topao izgled prostora.' },
];

export const ESSENCE_CARE: EssenceSpecRow[] = [
  { label: 'Mikroklima', value: 'Vlažnost vazduha 45–60%, temperatura vazduha 18–24 °C, temperatura poda 20–22 °C' },
  { label: 'Održavanje', value: 'Redovno usisavanje prašine, zatim čišćenje sredstvom za uljene drvene podove (detalji u tehničkom listu)' },
];

export const ESSENCE_ADVANTAGES: string[] = [
  'Parket po meri — uzorak, boja, gradacija i obrada po vašem izboru',
  'Prirodno masivno drvo (hrast ili orah) sa uljenom završnom obradom',
  'Pogodno za podno grejanje',
  'Evropski kvalitet izrade',
  'Više od 4.500 kombinacija (19 uzoraka × 20 boja × 3 gradacije × 4 obrade)',
];

// 16 tehničkih listova migriranih na našu Supabase (product-documents/essence).
const D = 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-documents/essence/';
export const ESSENCE_DOCUMENTS: EssenceDocument[] = [
  { pattern: 'Rhombus Diamond Regular', wood: 'Hrast', size: '15/3 × 180 × 208 mm', url: `${D}Rhombus_Diamond_Regular_EuropeanOak.pdf` },
  { pattern: 'Rhombus Diamond Regular', wood: 'Orah', size: '14/3 × 180 × 208 mm', url: `${D}Rhombus_Diamond_Regular_AmericanWalnut.pdf` },
  { pattern: 'Rhombus Diamond Irregular', wood: 'Hrast', size: '14/3 × 180 × 208 mm', url: `${D}Rhombus_Diamond_Irregular_EuropeanOak.pdf` },
  { pattern: 'Rhombus Diamond Irregular', wood: 'Orah', size: '14/3 × 180 × 208 mm', url: `${D}Rhombus_Diamond_Irregular_AmericanWalnut.pdf` },
  { pattern: 'Rhombus Chevron Regular', wood: 'Hrast', size: '14/3 × 180 × 208 mm', url: `${D}Rhombus_Chevron_Regular_EuropeanOak.pdf` },
  { pattern: 'Rhombus Chevron Regular', wood: 'Orah', size: '14/3 × 180 × 208 mm', url: `${D}Rhombus_Chevron_Regular_AmericanWalnut.pdf` },
  { pattern: 'Rhombus Chevron Irregular', wood: 'Hrast', size: '14/3 × 180 × 208 mm', url: `${D}Rhombus_Chevron_Irregular_EuropeanOak.pdf` },
  { pattern: 'Rhombus Chevron Irregular', wood: 'Orah', size: '14/3 × 180 × 208 mm', url: `${D}Rhombus_Chevron_Irregular_AmericanWalnut.pdf` },
  { pattern: 'Rhombus Cliff Regular', wood: 'Hrast', size: '14/3 × 180 × 208 mm', url: `${D}Rhombus_Cliff_Regular_EuropeanOak.pdf` },
  { pattern: 'Rhombus Cliff Regular', wood: 'Orah', size: '14/3 × 180 × 208 mm', url: `${D}Rhombus_Cliff_Regular_AmericanWalnut.pdf` },
  { pattern: 'Rhombus Cliff Irregular', wood: 'Hrast', size: '14/3 × 180 × 208 mm', url: `${D}Rhombus_Cliff_Irregular_EuropeanOak.pdf` },
  { pattern: 'Rhombus Cliff Irregular', wood: 'Orah', size: '14/3 × 180 × 208 mm', url: `${D}Rhombus_Cliff_Irregular_AmericanWalnut.pdf` },
  { pattern: 'Waves Ocean', wood: 'Hrast', size: '15/4 × 220 × 2190 mm', url: `${D}Waves_Ocean_and_Ocean_XXL_EuropeanOak.pdf` },
  { pattern: 'Waves Sea', wood: 'Hrast', size: '15/4 × 220 × 2190 mm', url: `${D}Waves_Sea_and_Sea_XXL_EuropeanOak.pdf` },
  { pattern: 'Waves Herringbone', wood: 'Hrast i Orah', size: '14/3 × 160 × 605 mm', url: `${D}Waves_Herringbone_EuropeanOak_and_AmericanWalnut.pdf` },
  { pattern: 'Forest Trees', wood: 'Hrast', size: 'daske 3–5 m × 230–340 mm', url: `${D}Forest_Trees_EuropeanOak.pdf` },
];
