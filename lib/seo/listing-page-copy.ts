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

  if (category.slug === 'alat') {
    return {
      heading: 'Alat',
      lead: 'Romus profesionalni alati za pripremu podloge, sečenje, zavarivanje, ugradnju i završnu obradu podova.',
      body: 'U kategoriji Alat nalaze se proizvodi iz odabranog Romus asortimana sa javnim cenama: ručni alati, mašine, pribor, potrošni delovi i oprema za podopolagače. Fokus je na rasprodaji dostupnog lagera, bez proširivanja na taktilne površine, lajsne, otirače i ostali Romus program.',
      bullets: [
        'Alati za pripremu podloge, skidanje obloga, brušenje i mešanje',
        'Noževi, sečiva, alati za merenje, sečenje i zavarivanje podova',
        'Mašine, rasveta, transportna oprema i potrošni delovi sa prikazanim cenama',
      ],
      metaTitle: 'Romus Alat za Podove | Cene i Rasprodaja Lagera | podovi.online',
      metaDescription: 'Romus alat za podopolagače sa cenama: priprema podloge, sečenje, zavarivanje, mašine, pribor i potrošni delovi za rasprodaju lagera.',
      keywords: dedupeKeywords([
        'Romus alat',
        'alat za podove',
        'podopolagacki alat',
        'alat za zavarivanje podova',
        'alat za pripremu podloge',
        'sečiva za podove',
        'rasprodaja alata',
        'Srbija',
      ]),
    };
  }

  if (category.slug === 'vestacka-trava') {
    return {
      heading: 'Veštačka trava',
      lead: 'Tarkett veštačka trava za sportske terene, terase, igrališta i spoljne prostore — realističan izgled, UV stabilnost i dug vek trajanja.',
      body: 'U kategoriji Veštačka trava nalaze se Tarkett kolekcije veštačkog travnatog pokrivača namenjene sportskim terenima, dekorativnim i pejzažnim površinama. Svaka kolekcija dolazi sa tehničkim specifikacijama (visina flora, težina, garancija, UV stabilnost) i uputstvom za ugradnju, a cena se dobija na upit.',
      bullets: [
        'Veštačka trava za sportske terene, terase i igrališta',
        'Realističan izgled, UV stabilnost i otpornost na spoljne uslove',
        'Tehničke specifikacije i uputstvo za ugradnju uz svaku kolekciju',
      ],
      metaTitle: 'Veštačka Trava | Tarkett za Sport, Terase i Spoljne Prostore | podovi.online',
      metaDescription: 'Tarkett veštačka trava za sportske terene, terase, igrališta i pejzaž: realističan izgled, UV stabilnost i dug vek trajanja. Cena na upit.',
      keywords: dedupeKeywords([
        'veštačka trava',
        'vestacka trava',
        'Tarkett veštačka trava',
        'veštačka trava za teren',
        'sportska veštačka trava',
        'veštačka trava za terasu',
        'dekorativna veštačka trava',
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

  if (brand.slug === 'romus') {
    return {
      heading: 'Romus',
      lead: 'Romus profesionalni alati, pribor i oprema za podopolagače, organizovani kao izdvojena ponuda za rasprodaju lagera.',
      body: 'Romus katalog na podovi.online obuhvata samo alat iz odabranog asortimana: pripremu podloge, ručne alate, specijalne alate, mašine i opremu za rad. Ostali Romus programi nisu deo ove ponude.',
      bullets: [
        'Profesionalni alati za ugradnju i obradu podova',
        'Pribor, sečiva, mašine i potrošni delovi sa prikazanim cenama',
        'Izdvojena ponuda za rasprodaju postojećeg lagera',
      ],
      metaTitle: 'Romus Alat | podovi.online',
      metaDescription: 'Romus alat i oprema za podopolagače na podovi.online: priprema podloge, sečenje, zavarivanje, mašine i potrošni delovi sa cenama.',
      keywords: dedupeKeywords([
        'Romus',
        'Romus alat',
        'alat za podove',
        'podopolagački alat',
        'rasprodaja alata',
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
