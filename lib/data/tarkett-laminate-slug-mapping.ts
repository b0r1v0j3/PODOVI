const TARKETT_LAMINATE_SLUG_ALIASES: Record<string, string> = {
  'easy-line-832-4v-aberdeen-oak-brown': 'aberdeen-oak-brown',
  'easy-line-832-4v-empire-oak-grey': 'empire-oak-grey',
  'easy-line-832-4v-kingsley-oak-beige': 'kingsley-oak-beige',
  'easy-line-832-4v-sierra-oak-beige': 'sierra-oak-beige',
  'easy-line-832-4v-turnberry-oak-nature': 'turnberry-oak-nature',
  'journey-731-4v-oak-natural': 'journey-731-4v-panonian-oak',
  'river-1233-4v-bistra': 'river-1233-4v-wr-bistra',
  'river-1233-4v-drava': 'river-1233-4v-wr-drava',
  'river-1233-4v-strumica': 'river-1233-4v-wr-strumica',
  'river-1233-4v-tara': 'river-1233-4v-wr-tara',
  'river-1233-4v-una': 'river-1233-4v-wr-una',
  'river-1233-4v-vit': 'river-1233-4v-wr-vit',
  'timeless-1232-4v-canadian-oak': 'timeless-1233-4v-canadian-oak',
  'timeless-1232-4v-southern-oak': 'timeless-1233-4v-southern-oak',
  'winter-832-oak-rustic-silver': 'winter-832-rustic-silver',
  'woodstock-chatillon-oak-brown': 'chatillon-oak-brown',
  'woodstock-chatillon-oak-sand': 'chatillon-oak-sand',
  'woodstock-nomad-oak-light': 'nomad-oak-light',
  'woodstock-summit-oak-cream': 'summit-oak-cream',
  'woodstock-summit-oak-grey': 'summit-oak-grey',
  'woodstock-summit-oak-white': 'summit-oak-white',
};

export function normalizeTarkettLaminateSlug(slug: string): string {
  if (!slug || typeof slug !== 'string') return '';
  const normalizedSlug = slug.toLowerCase();
  return TARKETT_LAMINATE_SLUG_ALIASES[normalizedSlug] ?? normalizedSlug;
}

export function isLegacyTarkettLaminateSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return false;
  return Boolean(TARKETT_LAMINATE_SLUG_ALIASES[slug.toLowerCase()]);
}

