/**
 * Opis grupa filtera početne strane koji ide pregledaču (serijalizabilan, bez
 * parsera i mapa). Gradi ga server (lib/catalog/home-catalog-index.ts), a
 * koriste ga engine, URL ugovor i UI.
 */

export type HomeGroupKind = 'list' | 'boolean' | 'range';

export interface HomeRangePresetEntry {
  label: string;
  min?: number;
  max?: number;
}

export interface HomeFacetSchemaEntry {
  /** Opšta grupa: param; kategorijska: `${categorySlug}.${param}`; plus 'category' i 'brand'. */
  id: string;
  param: string;
  scope: 'all' | string;
  label: string;
  kind: HomeGroupKind;
  unit?: 'mm' | 'dB' | 'RSD';
  presets?: HomeRangePresetEntry[];
  minCoverage?: number;
  order?: string[];
  optionLabels?: Record<string, string>;
  chipPrefix?: string;
  collapsed?: boolean;
  note?: string;
  sortByCount?: boolean;
  /** Pretraga unutar dugačke liste (brendovi, kolekcije). */
  searchable?: boolean;
}

export const TYPE_GROUP_PARAM = 'type';
export const COLLECTION_GROUP_PARAM = 'collection';

export function homeGroupId(scope: 'all' | string, param: string): string {
  return scope === 'all' ? param : `${scope}.${param}`;
}

/** Ljudska labela opcije (prevod iz definicije ili iz podataka). */
export function homeOptionLabel(entry: HomeFacetSchemaEntry, value: string): string {
  return entry.optionLabels?.[value] ?? value;
}

/** Stari kategorijski param koji je na početnoj postao drugačija grupa (stari linkovi). */
export const LEGACY_HOME_FACET_ALIASES: Record<string, Record<string, string>> = {
  laminat: { klasa: 'ac' },
};

/** Stari `application=` (pogađanje iz opisa) → nova grupa Namena prostora. */
export const LEGACY_APPLICATION_TO_NAMENA: Record<string, string> = {
  'stambeni prostor': 'Stambeni',
  'komercijalni prostor': 'Komercijalni',
};
