import { Brand, Category } from '@/types';

export interface ListingPageCopy {
  heading: string;
  lead: string;
  body?: string;
  bullets: string[];
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
}

function dedupeKeywords(keywords: string[]) {
  return Array.from(new Set(keywords.map((keyword) => keyword.trim()).filter(Boolean)));
}

export function getCategoryPageCopy(category: Category): ListingPageCopy {
  if (category.slug === 'otiraci') {
    return {
      heading: 'Otirači',
      lead: 'Aluminijumski, unutrašnji, spoljašnji i specijalni otirači za ulazne zone, poslovne objekte, hale i tehničke prostore.',
      body: 'U kategoriji Otirači nalaze se Techem sistemi za zadržavanje prljavštine i vlage, reklamni modeli, industrijske podloge i rešenja za prostore sa povišenim higijenskim ili bezbednosnim zahtevima. Asortiman je namenjen objektima u kojima ulazna zona mora da ostane funkcionalna, reprezentativna i laka za održavanje.',
      bullets: [
        'Aluminijumski sistemi za frekventne ulaze i objekte sa kolicima',
        'Unutrašnji i spoljašnji otirači za kontrolu vlage, peska i blata',
        'Specijalne, higijenske i industrijske podloge za zahtevne zone',
      ],
      metaTitle: 'Otirači za Ulazne Zone | Aluminijumski, Spoljašnji i Industrijski | podovi.online',
      metaDescription: 'Techem otirači za ulazne zone: aluminijumski sistemi, unutrašnji i spoljašnji otirači, reklamni i specijalni modeli za kancelarije, objekte, hale i tehničke prostore.',
      keywords: dedupeKeywords([
        'otirači',
        'otiraci',
        'aluminijumski otirači',
        'otirači za ulazne zone',
        'industrijski otirači',
        'spoljašnji otirači',
        'unutrašnji otirači',
        'techem',
        'Srbija',
      ]),
    };
  }

  return {
    heading: category.name,
    lead: category.description,
    bullets: [],
    metaTitle: `${category.name} Podovi | podovi.online`,
    metaDescription: category.description,
    keywords: dedupeKeywords([
      category.name,
      'podovi',
      'podne obloge',
      'Srbija',
    ]),
  };
}

export function getBrandPageCopy(brand: Brand): ListingPageCopy {
  if (brand.slug === 'techem') {
    return {
      heading: 'Techem',
      lead: 'Techem razvija sisteme za ulazne zone: aluminijumske otirače, unutrašnje i spoljašnje modele, reklamne otirače i specijalne podloge za objekte sa različitim nivoima opterećenja.',
      body: 'U Techem ponudi na podovi.online nalaze se rešenja za kancelarije, javne objekte, hale, maloprodajne prostore i druge ulaze gde su važni trajnost, kontrola nečistoće i uredan prvi utisak. Katalog je organizovan tako da lako uporediš standardne, dekorativne i tehnički zahtevnije sisteme i pošalješ upit za konkretan model.',
      bullets: [
        'Sistemski aluminijumski otirači za ulaze sa velikom frekvencijom',
        'Reklamni, dizajnerski i higijenski specijalizovani modeli',
        'Rešenja za poslovne, javne, industrijske i tehničke prostore',
      ],
      metaTitle: 'Techem Otirači i Ulazni Sistemi | podovi.online',
      metaDescription: 'Techem katalog na podovi.online obuhvata aluminijumske otirače, unutrašnje i spoljašnje modele, reklamne i specijalne podloge za ulazne zone poslovnih, javnih i industrijskih objekata.',
      keywords: dedupeKeywords([
        'Techem',
        'Techem otirači',
        'aluminijumski otirači',
        'ulazni sistemi',
        'reklamni otirači',
        'industrijske podloge',
        'otirači za objekte',
        'Srbija',
      ]),
    };
  }

  return {
    heading: brand.name,
    lead: brand.description,
    bullets: [],
    metaTitle: `${brand.name} Katalog | Podovi Doo`,
    metaDescription: `${brand.description} - Pogledajte ${brand.name} kolekcije i proizvode u našoj ponudi.`,
    keywords: dedupeKeywords([
      brand.name,
      'podovi',
      'podne obloge',
      'Srbija',
    ]),
  };
}
