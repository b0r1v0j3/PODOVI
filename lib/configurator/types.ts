// lib/configurator/types.ts
// Tipovi za Essence konfigurator. NE sme da uvozi `fs` — koristi se i na klijentu.

export type EssenceStepKey = 'uzorak' | 'boja' | 'gradacija' | 'obrada';

export type EssenceOption = {
  code: string;
  name: string;
  image: string | null;
  family?: string;
  lifestyle?: string | null;
};

export type EssenceSelection = {
  uzorak: EssenceOption | null;
  boja: EssenceOption | null;
  gradacija: EssenceOption | null;
  obrada: EssenceOption | null;
};

export type EssenceConfiguratorData = {
  patterns: EssenceOption[];
  colors: EssenceOption[];
  gradations: EssenceOption[];
  surfaces: EssenceOption[];
};
