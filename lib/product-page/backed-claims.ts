import { getFacetValues, getUniversalFacetDefs, type FacetSpecLike } from '@/lib/catalog/facet-config';
import { isProductPriceExpired as isPastBelgradeDate } from '@/lib/utils/product-price';
import certificateRegistry from '@/public/data/certificate_validity.json';
import { parseDescriptionToSections } from '@/lib/product-page/spec-helpers';

type DocumentLike = { title?: string | null; url?: string | null };
type VerifiedDocument = { claim: string | null; validUntil?: string };

// PDFs whose content was read: what they really certify and until when. Unlisted documents are judged by title.
const VERIFIED_DOCUMENTS: Record<string, VerifiedDocument> = certificateRegistry.documents;
const verifiedRecord = (document: DocumentLike) => {
  const file = String(document?.url ?? '').split('?')[0].split('/').pop() ?? '';
  return Object.prototype.hasOwnProperty.call(VERIFIED_DOCUMENTS, file) ? VERIFIED_DOCUMENTS[file] : undefined;
};

export interface BackedClaims {
  certifications: string[];
  ecoFeatures: string[];
  underfloorHeating: boolean;
}

// Key + label as lowercase words ("ce_oznaka CE oznaka" → ce, oznaka); internal "__" specs never count.
const words = (spec: FacetSpecLike) =>
  spec.key.startsWith('__') ? [] : `${spec.key} ${spec.label ?? ''}`.toLowerCase().split(/[^a-z0-9+À-ɏ]+/);
const findSpec = (specs: FacetSpecLike[], key: (w: string[]) => boolean, value: RegExp = /\S/) =>
  specs.find((spec) => key(words(spec)) && value.test(String(spec.value ?? '')));
const hasWord = (...names: string[]) => (w: string[]) => names.some((name) => w.includes(name));
const hasPart = (part: RegExp) => (w: string[]) => w.some((x) => part.test(x));
const anySpec = (w: string[]) => w.length > 0;
const hasDocument = (documents: DocumentLike[], title: RegExp) =>
  documents.some((document) => title.test(String(document?.title ?? '')));

const NOT_NO = /^(?!\s*(ne|no|nema)\b)\S/i;
const PERCENT = /\d+(?:[.,]\d+)?\s*%/;
// Largest "≤ N µg" limit in a TVOC value ("Platina (≤ 10 µg / m³), Zlato (≤ 100 µg / m³)" → 100); -Infinity if none.
const tvocLimit = (value: string) =>
  Math.max(...(value.match(/[≤<]\s*\d+(?:[.,]\d+)?\s*µg/g) ?? []).map((limit) => parseFloat(limit.replace(/[^\d,.]/g, '').replace(',', '.'))));
const DOP_DOCUMENT = /(^|[^a-z])dop([^a-z]|$)|(deklaracij\w*|izjava) o (performans|svojstvima)|declaration of perf|^ce$/i;
const heatingFacet = getUniversalFacetDefs().find((def) => def.param === 'grejanje');

const ECO_SECTION = /^(okruženje|održivost|environment|sustainability)/i;
/**
 * Tekst proizvođača koji PDP već prikazuje: eko-sekcije opisa i „Ključne karakteristike".
 * shortcut: „Ključne karakteristike" se čitaju uvek, a van kategorija 1/3/6 PDP ih prikazuje samo kad opis nema
 * sekcija (25.11.2026 nijedan proizvod nema oba); uskladiti sa DescriptionSection ako se to promeni.
 */
export const manufacturerEcoText = (description?: string | null, detailsSections?: Array<{ title: string; items: string[] }> | null) => [
  ...parseDescriptionToSections(description ?? '').filter((section) => ECO_SECTION.test(section.title)).flatMap((section) => section.items),
  ...(detailsSections ?? []).filter((section) => section.title === 'Ključne karakteristike').flatMap((section) => section.items),
];

// Eko-činjenice iz teksta; sertifikate iz teksta namerno ne čitamo (tekst nema rok važenja).
const NUM = String.raw`(\d+(?:[.,]\d+)?)`;
const TEXT = {
  pvcFree: /\bbez pvc/i,
  phthalateFree: /(?:bez|ne sadrži)\s+ftalat\w*(\s*\((?:osim|except)[^)]*\))?|phthalate[- ]free/i,
  recycled: new RegExp(String.raw`(?:\b(do|up to|u proseku)\s+)?${NUM}\s*%\s*recikliran\w*\s+(?:sadržaj|materijal)`, 'i'),
  fullyRecyclable: /(?:100\s*%|potpuno)\s*(?:se može\s+|može da se\s+)?(?:reciklabil|reciklira\b|reciklirati)/i,
  recyclableAfterUse: /pogodan za recikliranje|može se reciklirati|recikliranje nakon upotrebe/i,
  natural: new RegExp(String.raw`${NUM}\s*%\s*prirodn\w*\s+sastoj`, 'i'),
  renewable: new RegExp(String.raw`${NUM}\s*%\s*brzo obnovljiv\w*\s+sastoj`, 'i'),
  tvoc: /\bT?VOC\b(.*?)([<≤])\s*(\d+(?:[.,]\d+)?)\s*(?:[µμ]g|micrograms?)/i,
};
const toNumber = (value: string) => parseFloat(value.replace(',', '.'));

/**
 * Sadržaj kartice „Sertifikati" na PDP-u: samo tvrdnje koje potvrđuje specifikacija ili naslov važećeg dokumenta
 * te kolekcije (ili izabrane boje), plus eko-činjenice iz teksta proizvođača koji stranica prikazuje
 * (`manufacturerEcoText`). Bez potvrde nema stavke — nikakve generičke liste po kategoriji.
 */
export function getBackedClaims(specs: FacetSpecLike[] = [], pageDocuments: DocumentLike[] = [], now = new Date(), manufacturerText: string[] = []): BackedClaims {
  const documents = pageDocuments.filter((document) => !verifiedRecord(document));
  const verifiedClaims = new Set(pageDocuments.map(verifiedRecord)
    .filter((record) => record?.claim && !(record.validUntil && isPastBelgradeDate(record.validUntil, now)))
    .map((record) => record!.claim));
  const breeam = findSpec(specs, hasWord('breeam'), /^[A-E]\+*$/);
  const certifications: Array<[string, unknown]> = [
    ['CE', findSpec(specs, hasWord('ce', 'dop'))
      || findSpec(specs, (w) => hasPart(/^performans/)(w) && hasWord('izjava', 'deklaracija')(w))
      || findSpec(specs, hasWord('sertifikati'), /\bCE\b/)
      || hasDocument(documents, DOP_DOCUMENT)],
    ['EPD', findSpec(specs, hasPart(/^epd/), NOT_NO) || hasDocument(documents, /epd|fdes|environment(al)?[ _]product[ _]declaration/i)],
    ['FloorScore', findSpec(specs, hasPart(/floorscore/), /^(da|yes)\b/i) || hasDocument(documents, /floorscore/i)],
    ['Indoor Air Comfort Gold', hasDocument(documents, /(\biac\b|indoor air comfort).*gold/i)],
    ['M1', findSpec(specs, hasWord('rts'), /\bM1\b/)],
    ['A+', findSpec(specs, (w) => w.includes('label') && hasPart(/^emission/)(w), /^A\+$/)],
    ['Cradle to Cradle', hasDocument(documents, /cradle to cradle|\bc2c\b/i)],
    [`BREEAM ${breeam?.value}`, breeam],
    ['Sertifikat o kvalitetu vazduha', hasDocument(documents, /kvalitet\w* vazduha|indoor[ _]air[ _](quality|comfort)|(^|[^a-z])voc([^a-z]|$)|emisij/i)],
  ];

  // Specifikacija ima prednost; tekst proizvođača dopunjuje samo vrste tvrdnji koje specifikacija ne pominje.
  const lines = manufacturerText.map((line) => line.replace(/%%/g, '%'));
  const fromText = (pattern: RegExp, label: (match: RegExpMatchArray, line: string) => string | false) => {
    for (const line of lines) {
      const match = line.match(pattern);
      const value = match && label(match, line);
      if (value) return value;
    }
    return undefined;
  };
  const phthalateSpec = findSpec(specs, hasPart(/ftalat|phtalat|phthalat/));
  const recycled = findSpec(specs, hasPart(/recikl|recycl/), PERCENT)?.value.match(PERCENT)?.[0];
  const natural = findSpec(specs, anySpec, /\d+\s*%\s*prirodn/i);
  // Only a low-emission class is an eco advantage (≤ 1000 µg/m³ is the legal TVOC28 limit); the weakest value wins.
  const [weakestTvoc] = specs
    .filter((spec) => hasWord('tvoc', 'voc')(words(spec)) && !words(spec).includes('rts'))
    .map((spec) => ({ value: spec.value, limit: tvocLimit(spec.value) }))
    .filter(({ limit }) => limit > 0)
    .sort((a, b) => b.limit - a.limit);
  const [weakestTextTvoc] = lines
    .map((line) => line.match(TEXT.tvoc))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .sort((a, b) => toNumber(b[3]) - toNumber(a[3]));

  const ecoFeatures = [
    fromText(TEXT.pvcFree, () => 'Bez PVC-a'),
    phthalateSpec
      ? findSpec(specs, hasPart(/ftalat|phtalat|phthalat/), /ne sadrži|bez ftalata|free/i) && 'Bez ftalata'
      // „bez ftalata (osim u recikliranom sadržaju)" zadržava izuzetak; izuzetak van zagrade = nema tvrdnje.
      : fromText(TEXT.phthalateFree, (match, line) => (match[1] || !/osim|except|izuzev/i.test(line)) && `Bez ftalata${match[1] ? ` ${match[1].trim()}` : ''}`),
    recycled
      ? `${recycled.replace(/\s+%/, '%')} recikliranog sadržaja`
      : fromText(TEXT.recycled, (match) => `${match[1] ? (/proseku/i.test(match[1]) ? 'U proseku ' : 'Do ') : ''}${match[2]}% recikliranog sadržaja`),
    fromText(TEXT.fullyRecyclable, () => '100% reciklabilno') ?? fromText(TEXT.recyclableAfterUse, () => 'Pogodno za recikliranje nakon upotrebe'),
    findSpec(specs, anySpec, /econyl/i) && 'ECONYL® reciklirana vlakna',
    natural ? natural.value : fromText(TEXT.natural, (match) => `${match[1]}% prirodnih sastojaka`),
    fromText(TEXT.renewable, (match) => `${match[1]}% brzo obnovljivih sastojaka`),
    weakestTvoc
      ? weakestTvoc.limit <= 100 && `TVOC emisije: ${weakestTvoc.value.replace(/\s*\/\s*/g, '/')}`
      : weakestTextTvoc && toNumber(weakestTextTvoc[3]) <= 100
        && `TVOC emisije${/28\s*(dana|days)/i.test(weakestTextTvoc[1]) ? ' nakon 28 dana' : ''}: ${weakestTextTvoc[2]} ${weakestTextTvoc[3]} µg/m³`,
  ].filter((feature): feature is string => Boolean(feature));

  // Isto čitanje kao filter „Podno grejanje", ali mešovita kolekcija (Da + Ne) ne dobija tvrdnju.
  const heating = heatingFacet ? getFacetValues({ specs }, heatingFacet) : [];

  return {
    certifications: certifications.filter(([label, backed]) => backed || verifiedClaims.has(label)).map(([label]) => label),
    ecoFeatures,
    underfloorHeating: heating.includes('Da') && !heating.includes('Ne'),
  };
}
