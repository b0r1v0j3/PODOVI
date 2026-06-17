// lib/data/essence-configurator-axes.ts
// Boje/gradacije/obrade za Essence konfigurator (izvor: alpod.rs, verifikovano 2026-06-17).
// Slike hotlink sa alpod.rs (host dozvoljen u next.config.mjs); opciono kasnije migrirano na Supabase.
import type { EssenceOption } from '@/lib/configurator/types';

const C = 'https://www.alpod.rs/wp-content/uploads/2025/12/';
const G = 'https://www.alpod.rs/wp-content/uploads/2025/03/';
const S = 'https://www.alpod.rs/wp-content/uploads/2025/02/';

export const ESSENCE_COLORS: EssenceOption[] = [
  { code: 'C01', name: 'Cappuccino', image: `${C}Essence-color-140-300x300.webp` },
  { code: 'C02', name: 'Slim Coconut', image: `${C}Essence-color-171-300x300.webp` },
  { code: 'C03', name: 'Dark Oak', image: `${C}Essence-color-229-300x300.webp` },
  { code: 'C04', name: 'Natural', image: `${C}neutral_color_242-1-300x300.jpg` },
  { code: 'C05', name: 'Vanilla', image: `${C}Essence-color-276-300x300.webp` },
  { code: 'C06', name: 'Dark Chocolate', image: `${C}dark_chocolate_color_314-1-300x300.jpg` },
  { code: 'C07', name: 'Castle Brown', image: `${C}castle_brown_503-1-300x300.jpg` },
  { code: 'C08', name: 'Pure', image: `${C}Essence-color-532-300x300.webp` },
  { code: 'C09', name: 'Tobacco', image: `${C}Essence-color-548-300x300.webp` },
  { code: 'C10', name: 'White 5', image: `${C}white_5_551-1-300x300.jpg` },
  { code: 'C11', name: 'Caramel', image: `${C}caramel_604-1-300x300.jpg` },
  { code: 'C12', name: 'Foggy', image: `${C}Essence-color-609-300x300.webp` },
  { code: 'C13', name: 'Invisible', image: `${C}invisible_612-1-300x300.jpg` },
  { code: 'C14', name: 'Light Mist', image: `${C}Essence-color-646-300x300.webp` },
  { code: 'C15', name: 'Smoke Brown', image: `${C}Essence-color-702-300x300.webp` },
  { code: 'C16', name: 'Dark Walnut', image: `${C}Essence-color-705-300x300.webp` },
  { code: 'C17', name: 'Beige', image: `${C}beige_706-1-300x300.jpg` },
  { code: 'C18', name: 'White New', image: `${C}Essence-color-711-300x300.webp` },
  { code: 'C19', name: 'Nordic White', image: `${C}arctic_white_715-1-300x300.jpg` },
  { code: 'C20', name: 'Dark Brown', image: `${C}Essence-color-730-300x300.webp` },
];

export const ESSENCE_GRADATIONS: EssenceOption[] = [
  { code: 'E', name: 'Elegant', image: `${G}elegant_gradation-1-768x650.webp` },
  { code: 'N', name: 'Natural', image: `${G}natural_gradation-1-768x650.webp` },
  { code: 'S', name: 'Standard', image: `${G}standard_gradation-1-768x650.webp` },
];

export const ESSENCE_SURFACES: EssenceOption[] = [
  { code: 'B', name: 'Brušeno', image: `${S}bruseno-4-768x658.jpg` },
  { code: 'C', name: 'Četkano', image: `${S}krtaceno-4-768x658.jpg` },
  { code: 'H', name: 'Hoblano', image: `${S}skobljano-4-768x658.jpg` },
  { code: 'P', name: 'Piljeno', image: `${S}zagano-4-768x658.jpg` },
];
