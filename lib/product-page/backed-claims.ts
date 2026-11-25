import { getFacetValues, getUniversalFacetDefs, type FacetSpecLike } from '@/lib/catalog/facet-config';
import { isProductPriceExpired as isPastBelgradeDate } from '@/lib/utils/product-price';
import certificateRegistry from '@/public/data/certificate_validity.json';

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

/**
 * Sadržaj kartice „Sertifikati" na PDP-u: samo tvrdnje koje potvrđuje specifikacija ili naslov važećeg dokumenta
 * te kolekcije (ili izabrane boje). Bez potvrde nema stavke — nikakve generičke liste po kategoriji.
 */
export function getBackedClaims(specs: FacetSpecLike[] = [], pageDocuments: DocumentLike[] = [], now = new Date()): BackedClaims {
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

  const ecoFeatures: string[] = [];
  if (findSpec(specs, hasPart(/ftalat|phtalat|phthalat/), /ne sadrži|bez ftalata|free/i)) ecoFeatures.push('Bez ftalata');
  const recycled = findSpec(specs, hasPart(/recikl|recycl/), PERCENT)?.value.match(PERCENT)?.[0];
  if (recycled) ecoFeatures.push(`${recycled.replace(/\s+%/, '%')} recikliranog sadržaja`);
  if (findSpec(specs, anySpec, /econyl/i)) ecoFeatures.push('ECONYL® reciklirana vlakna');
  const natural = findSpec(specs, anySpec, /\d+\s*%\s*prirodn/i);
  if (natural) ecoFeatures.push(natural.value);
  // Only a low-emission class is an eco advantage (≤ 1000 µg/m³ is the legal TVOC28 limit); the weakest value wins.
  const [weakestTvoc] = specs
    .filter((spec) => hasWord('tvoc', 'voc')(words(spec)) && !words(spec).includes('rts'))
    .map((spec) => ({ value: spec.value, limit: tvocLimit(spec.value) }))
    .filter(({ limit }) => limit > 0)
    .sort((a, b) => b.limit - a.limit);
  if (weakestTvoc && weakestTvoc.limit <= 100) ecoFeatures.push(`TVOC emisije: ${weakestTvoc.value.replace(/\s*\/\s*/g, '/')}`);

  // Isto čitanje kao filter „Podno grejanje", ali mešovita kolekcija (Da + Ne) ne dobija tvrdnju.
  const heating = heatingFacet ? getFacetValues({ specs }, heatingFacet) : [];

  return {
    certifications: certifications.filter(([label, backed]) => backed || verifiedClaims.has(label)).map(([label]) => label),
    ecoFeatures,
    underfloorHeating: heating.includes('Da') && !heating.includes('Ne'),
  };
}
