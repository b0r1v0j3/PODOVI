import nextConfig from '../../next.config.mjs';
import { describe, expect, it } from 'vitest';
import { isOptimizableImageSrc, shouldBypassNextImageOptimization } from '@/lib/utils/image-runtime';

describe('Image runtime contracts', () => {
  it('optimizes only local and allowlisted remote image hosts', () => {
    expect(isOptimizableImageSrc('/images/categories/otiraci.jpg')).toBe(true);
    expect(isOptimizableImageSrc('https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/otiraci/test.jpg')).toBe(true);
    expect(isOptimizableImageSrc('https://media.tarkett-image.com/medium/example.jpg')).toBe(true);
    expect(isOptimizableImageSrc('https://cdn.gerflor.com/product/stc/fra/catalogue-assets/mipolam-technic-el5-eu.jpg')).toBe(true);
    expect(isOptimizableImageSrc('https://www.podovi.online/images/brands/techem-logo-en.png')).toBe(true);

    expect(isOptimizableImageSrc('https://www.techem-wycieraczki.com.pl/wp-content/uploads/example.jpg')).toBe(false);
    expect(isOptimizableImageSrc('http://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/otiraci/test.jpg')).toBe(false);
    expect(shouldBypassNextImageOptimization('https://www.techem-wycieraczki.com.pl/wp-content/uploads/example.jpg')).toBe(true);
  });

  it('keeps next/image remotePatterns on an explicit allowlist', () => {
    const remotePatterns = nextConfig.images?.remotePatterns || [];
    const hostnames = remotePatterns.map((pattern) => pattern.hostname);

    expect(hostnames).toContain('nnjmrfwepylrheykalik.supabase.co');
    expect(hostnames).toContain('media.tarkett-image.com');
    expect(hostnames).toContain('cdn.gerflor.com');
    expect(hostnames).toContain('www.podovi.online');
    expect(hostnames).toContain('podovi.online');
    expect(hostnames).not.toContain('**');
  });
});
