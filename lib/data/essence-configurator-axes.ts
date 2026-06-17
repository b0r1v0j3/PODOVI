// lib/data/essence-configurator-axes.ts
// Boje/gradacije/obrade za Essence konfigurator (izvor: alpod.rs, verifikovano 2026-06-17).
// Sve slike su migrirane na našu Supabase (product-images/products/alpod-migrated/essence).
import type { EssenceOption } from '@/lib/configurator/types';


// Prave (različite) slike uzoraka sa alpod Essence galerije (verifikovano 2026-06-17).
// Naša baza ima generičku placeholder sliku za sve uzorke, pa je loader override-uje ovim.
// Ključ = naziv uzorka iz alpod_floor_collections.json (collections[].colors[].name).
export const ESSENCE_PATTERN_IMAGES: Record<string, string> = {
  'Rhombus Diamond Regular': 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-pattern-diamond-regular-oak-1-5c015b.jpg?v=20260617202653',
  'Rhombus Diamond Irregular': 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-pattern-diamond-irregular-oak-1-6d2f2f.jpg?v=20260617202654',
  'Rhombus Chevron Regular': 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-pattern-chevron-regular-oak-1-99f7aa.jpg?v=20260617202655',
  'Rhombus Chevron Irregular': 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-pattern-chevron-irregular-oak-1-10ac4f.jpg?v=20260617202655',
  'Rhombus Cliff Regular': 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-pattern-cliff-regular-oak-1-e128d0.jpg?v=20260617202656',
  'Rhombus Cliff Irregular': 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-pattern-cliff-irregular-oak-1-15ef54.jpg?v=20260617202657',
  'Trapezium Hive Regular': 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-trapezium-hive-regular-topdown-oak-web-1-ce760f.jpg?v=20260617202657',
  'Trapezium Hive Irregular': 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-essence-trapezium-hive-irregular-topdown-lines-6-web1-1-a9590f.jpg?v=20260617202658',
  'Trapezium Aloe': 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-trapezium-aloe-oak-lines-03-web-1-600db1.jpg?v=20260617202658',
  'Mosaic Stellar': 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-pattern-stellar-oak-1-f98a72.jpg?v=20260617202659',
  'Mosaic Threads': 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-pattern-threads-oak-1-25db69.jpg?v=20260617202700',
  'Waves Ocean': 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-wave-ocean-5da6da.jpg?v=20260617202700',
  'Waves Sea': 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-pattern-waves-sea-1-11c578.jpg?v=20260617202701',
  'Waves Herringbone': 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-wave-herringbone-bd83a8.jpg?v=20260617202702',
  'Waves Fish Scale': 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-pattern-fish-scale-oak-1-11217a.jpg?v=20260617202702',
  'Forest Trees': 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-pattern-forest-trees-1-f36c70.jpg?v=20260617202703',
  'Forest Flowers': 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-pattern-flower-oak-1-c3d73c.jpg?v=20260617202703',
  'Forest Leaves': 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-pattern-leafs-oak-1-c47f83.jpg?v=20260617202704',
  'Forest Branches': 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-pattern-branches-oak-1-eab096.jpg?v=20260617202704',
};

export const ESSENCE_COLORS: EssenceOption[] = [
  { code: 'C01', name: 'Cappuccino', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-essence-color-140-300x300-bea5d4.jpg?v=20260617202705' },
  { code: 'C02', name: 'Slim Coconut', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-essence-color-171-300x300-67024b.jpg?v=20260617202705' },
  { code: 'C03', name: 'Dark Oak', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-essence-color-229-300x300-d912ff.jpg?v=20260617202706' },
  { code: 'C04', name: 'Natural', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-neutral-color-242-1-300x300-d283cd.jpg?v=20260617202706' },
  { code: 'C05', name: 'Vanilla', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-essence-color-276-300x300-2c66bc.jpg?v=20260617202707' },
  { code: 'C06', name: 'Dark Chocolate', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-dark-chocolate-color-314-1-300x300-aff64d.jpg?v=20260617202707' },
  { code: 'C07', name: 'Castle Brown', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-castle-brown-503-1-300x300-985357.jpg?v=20260617202708' },
  { code: 'C08', name: 'Pure', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-essence-color-532-300x300-4a9f2d.jpg?v=20260617202708' },
  { code: 'C09', name: 'Tobacco', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-essence-color-548-300x300-825fea.jpg?v=20260617202708' },
  { code: 'C10', name: 'White 5', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-white-5-551-1-300x300-af7039.jpg?v=20260617202709' },
  { code: 'C11', name: 'Caramel', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-caramel-604-1-300x300-d36b64.jpg?v=20260617202709' },
  { code: 'C12', name: 'Foggy', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-essence-color-609-300x300-db11d2.jpg?v=20260617202710' },
  { code: 'C13', name: 'Invisible', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-invisible-612-1-300x300-c86075.jpg?v=20260617202710' },
  { code: 'C14', name: 'Light Mist', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-essence-color-646-300x300-fd4074.jpg?v=20260617202710' },
  { code: 'C15', name: 'Smoke Brown', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-essence-color-702-300x300-76c4bb.jpg?v=20260617202711' },
  { code: 'C16', name: 'Dark Walnut', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-essence-color-705-300x300-bbd6c7.jpg?v=20260617202711' },
  { code: 'C17', name: 'Beige', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-beige-706-1-300x300-7faffc.jpg?v=20260617202712' },
  { code: 'C18', name: 'White New', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-essence-color-711-300x300-e1a4cc.jpg?v=20260617202712' },
  { code: 'C19', name: 'Nordic White', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-arctic-white-715-1-300x300-3f4dd0.jpg?v=20260617202713' },
  { code: 'C20', name: 'Dark Brown', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-12-essence-color-730-300x300-3d68b2.jpg?v=20260617202713' },
];

export const ESSENCE_GRADATIONS: EssenceOption[] = [
  { code: 'E', name: 'Elegant', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-03-elegant-gradation-1-768x650-e9b4a7.jpg?v=20260617202714' },
  { code: 'N', name: 'Natural', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-03-natural-gradation-1-768x650-22de36.jpg?v=20260617202714' },
  { code: 'S', name: 'Standard', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-03-standard-gradation-1-768x650-7ae3b6.jpg?v=20260617202715' },
];

export const ESSENCE_SURFACES: EssenceOption[] = [
  { code: 'B', name: 'Brušeno', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-02-bruseno-4-768x658-a1d02b.jpg?v=20260617202715' },
  { code: 'C', name: 'Četkano', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-02-krtaceno-4-768x658-9caddf.jpg?v=20260617202715' },
  { code: 'H', name: 'Hoblano', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-02-skobljano-4-768x658-fdcaf8.jpg?v=20260617202716' },
  { code: 'P', name: 'Piljeno', image: 'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/alpod-migrated/essence/2025-02-zagano-4-768x658-4b7401.jpg?v=20260617202716' },
];
