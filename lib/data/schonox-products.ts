import type { Product } from '@/types';
import dataset from '@/public/data/schonox_products.json';

/** Flat products share Pribor discovery but keep manufacturer dates and availability. */
export function getAllSchonoxProducts(): Product[] {
  return dataset.products.map((record) => ({
    ...record,
    availability: 'on_request',
    images: record.images.map((image, index) => ({
      ...image,
      id: `${record.id}-image-${index}`,
      isPrimary: index === 0,
      order: index,
    })),
    specs: record.specs.map((spec) => ({ ...spec })),
    documents: record.documents.map((document) => ({ ...document })),
    detailsSections: record.detailsSections.map((section) => ({ ...section, items: [...section.items] })),
    createdAt: new Date(dataset.generatedAt),
    updatedAt: new Date(dataset.generatedAt),
  }));
}
