import { describe, expect, it } from 'vitest';
import { productRepository } from '@/lib/repositories/product-repository';

describe('GTI Max Connect cena', () => {
  it('izlaže cenu 9.999 RSD po m² kroz product repository', async () => {
    const product = await productRepository.findBySlug('gerflor-gti-max-connect');

    expect(product).not.toBeNull();
    expect(product?.price).toBe(9999);
    expect(product?.priceUnit).toBe('m²');
  });
});
