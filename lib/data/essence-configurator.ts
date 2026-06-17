// lib/data/essence-configurator.ts
// Server-only loader: uzorci iz alpod JSON-a + ose iz axis modula.
import { readFileSync } from 'fs';
import { join } from 'path';
import type { EssenceConfiguratorData, EssenceOption } from '@/lib/configurator/types';
import { ESSENCE_COLORS, ESSENCE_GRADATIONS, ESSENCE_SURFACES, ESSENCE_PATTERN_IMAGES } from '@/lib/data/essence-configurator-axes';

const ESSENCE_SLUG = 'podovi-parket-essence-premium';

type RawPattern = {
  code?: string;
  name?: string;
  image?: string;
  image_url?: string;
  lifestyle_url?: string;
  characteristics?: Record<string, string>;
};

function loadPatterns(): EssenceOption[] {
  try {
    const file = join(process.cwd(), 'public', 'data', 'alpod_floor_collections.json');
    const data = JSON.parse(readFileSync(file, 'utf8')) as { collections: Array<{ slug?: string; colors?: RawPattern[] }> };
    const collection = data.collections?.find((c) => c.slug === ESSENCE_SLUG);
    return (collection?.colors || []).map((p) => {
      // Prava slika uzorka sa alpoda (baza ima generički placeholder za sve uzorke).
      const patternImage = ESSENCE_PATTERN_IMAGES[p.name || ''] || null;
      return {
        code: p.code || '',
        name: p.name || '',
        image: patternImage || p.image || p.image_url || null,
        lifestyle: patternImage || p.lifestyle_url || p.image || p.image_url || null,
        family: p.characteristics?.['Podkolekcija'] || '',
      };
    });
  } catch {
    return [];
  }
}

export function getEssenceConfiguratorData(): EssenceConfiguratorData {
  return {
    patterns: loadPatterns(),
    colors: ESSENCE_COLORS,
    gradations: ESSENCE_GRADATIONS,
    surfaces: ESSENCE_SURFACES,
  };
}
