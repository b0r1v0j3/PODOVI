import { GET as colorDataRouteGet } from '@/app/api/color-data/route';
import { GET as colorsRouteGet } from '@/app/api/colors/route';
import tarkettLajsneData from '@/public/data/tarkett_lajsne_variants.json';
import tarkettVinylHomeColorsData from '@/public/data/tarkett_vinyl_home_colors.json';
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

type NestedCollection = {
  slug: string;
  name: string;
  colors?: Array<{
    code?: string;
    name?: string;
    slug?: string;
    image?: string;
    image_url?: string;
  }>;
};

const fixtureCollection = (((tarkettLajsneData as any).collections || []) as NestedCollection[]).find(
  (collection) => collection.slug && (collection.colors || []).some((color) => Boolean(color.image || color.image_url))
);

if (!fixtureCollection) {
  throw new Error('Contract test fixture missing: no lajsne collection with image-backed variants.');
}

const fixtureColor = (fixtureCollection.colors || []).find((color) => Boolean(color.image || color.image_url));
if (!fixtureColor) {
  throw new Error('Contract test fixture missing: no image-backed lajsne color variant.');
}

const vinylFixtureCollection = ((((tarkettVinylHomeColorsData as any).collections || []) as NestedCollection[])).find(
  (collection) => collection.slug === 'tarkett-bold'
);

const vinylFixtureColor = (vinylFixtureCollection?.colors || []).find((color: any) => color.slug === 'tarkett-bold-color-mist-1');

if (!vinylFixtureCollection || !vinylFixtureColor) {
  throw new Error('Contract test fixture missing: no Tarkett Bold selected-color docs/specs fixture.');
}

function buildNestedColorSlug(collectionSlug: string, color: { code?: string; name?: string; slug?: string }) {
  if (color.slug) {
    return color.slug;
  }
  const nameSlug = String(color.name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${collectionSlug}-${color.code || 'color'}-${nameSlug}`.replace(/-+/g, '-');
}

describe('color API contracts', () => {
  it('returns stable nested color payload shape for /api/colors', async () => {
    const request = new NextRequest(
      `http://localhost/api/colors?category=lajsne&collection=${encodeURIComponent(fixtureCollection.slug)}`
    );
    const response = await colorsRouteGet(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body.collections)).toBe(true);
    expect(body.collections.length).toBeGreaterThan(0);

    const firstCollection = body.collections[0];
    const compactContract = {
      totalColors: body.totalColors,
      collectionCount: body.collections.length,
      firstCollection: {
        slug: firstCollection.slug,
        name: firstCollection.name,
        colorCount: firstCollection.colorCount,
        sampleColors: (firstCollection.colors || []).slice(0, 3).map((color: any) => ({
          slug: color.slug,
          code: color.code,
          name: color.name,
          imageUrl: color.image_url,
          characteristicKeys: Object.keys(color.characteristics || {}).sort().slice(0, 8),
        })),
      },
    };

    expect(compactContract).toMatchSnapshot();
  });

  it('returns stable documents + characteristics shape for /api/color-data', async () => {
    const colorSlug = buildNestedColorSlug(fixtureCollection.slug, fixtureColor);
    const request = new NextRequest(
      `http://localhost/api/color-data?categoryId=11&color=${encodeURIComponent(colorSlug)}`
    );
    const response = await colorDataRouteGet(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveProperty('documents');
    expect(body).toHaveProperty('characteristics');

    const sortedCharacteristics = Object.fromEntries(
      Object.entries(body.characteristics || {}).sort(([left], [right]) => left.localeCompare(right))
    );

    const compactContract = {
      colorSlug,
      documentCount: Array.isArray(body.documents) ? body.documents.length : 0,
      documents: (body.documents || []).slice(0, 4).map((document: any) => ({
        title: document.title,
        url: document.url,
      })),
      characteristicKeys: Object.keys(sortedCharacteristics),
      characteristics: Object.fromEntries(Object.entries(sortedCharacteristics).slice(0, 12)),
    };

    expect(compactContract).toMatchSnapshot();
  });

  it('returns selected-color docs + spec payload for a nested vinyl color with color-level documents', async () => {
    const request = new NextRequest(
      `http://localhost/api/color-data?categoryId=2&color=${encodeURIComponent(vinylFixtureColor.slug!)}`
    );
    const response = await colorDataRouteGet(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body.documents)).toBe(true);
    expect(Array.isArray(body.specs)).toBe(true);
    expect(body.documents.length).toBeGreaterThan(0);
    expect(body.specs.length).toBeGreaterThan(0);

    const compactContract = {
      colorSlug: vinylFixtureColor.slug,
      documentCount: body.documents.length,
      documents: body.documents.slice(0, 4).map((document: any) => ({
        title: document.title,
        url: document.url,
      })),
      specCount: body.specs.length,
      specSample: body.specs.slice(0, 12).map((spec: any) => ({
        key: spec.key,
        label: spec.label,
        value: spec.value,
      })),
      characteristicKeys: Object.keys(body.characteristics || {}).sort().slice(0, 12),
    };

    expect(compactContract).toMatchSnapshot();
  });
});
