import { describe, expect, it } from 'vitest';
import { splitProductTitle } from '@/lib/utils/name-parser';
import {
  areProductCardTextsEqual,
  cleanProductCardShortDescription,
  getProductCardDisplayName,
} from '@/lib/utils/product-card-text';

describe('product card text contracts', () => {
  it('collapses Gerflor Armonia collection cards to one visible product name', () => {
    const displayName = getProductCardDisplayName('Gerflor Armonia 400', 'Gerflor');
    const split = splitProductTitle(displayName, 'Armonia 400');

    expect(displayName).toBe('Armonia 400');
    expect(split).toEqual({ collection: '', color: 'Armonia 400' });
    expect(
      cleanProductCardShortDescription('Tekstilne podne ploče Armonia 400', {
        productName: 'Gerflor Armonia 400',
        displayName,
        splitColor: split.color,
        splitCollection: split.collection,
        brandName: 'Gerflor',
      })
    ).toBeNull();
  });

  it('keeps collection and color split when both add useful context', () => {
    const displayName = getProductCardDisplayName('EDGE Dark Teak', 'TimberTech');
    const split = splitProductTitle(displayName, 'EDGE');

    expect(displayName).toBe('EDGE Dark Teak');
    expect(split).toEqual({ collection: 'EDGE', color: 'Dark Teak' });
    expect(areProductCardTextsEqual(split.collection, split.color)).toBe(false);
  });

  it('strips the brand from collection labels before splitting card titles', () => {
    const displayName = getProductCardDisplayName('BLOQ Assembly', 'BLOQ');
    const displayCollection = getProductCardDisplayName('BLOQ Assembly', 'BLOQ');
    const split = splitProductTitle(displayName, displayCollection);

    expect(displayName).toBe('Assembly');
    expect(split).toEqual({ collection: '', color: 'Assembly' });
  });

  it('keeps genuinely descriptive card copy after duplicate cleanup', () => {
    expect(
      cleanProductCardShortDescription('Homogeni vinil za clean room i visoko kontrolisane prostore.', {
        productName: 'Mipolam Biocontrol Clean',
        displayName: 'Mipolam Biocontrol Clean',
        splitColor: 'Mipolam Biocontrol Clean',
        brandName: 'Gerflor',
      })
    ).toBe('Homogeni vinil za clean room i visoko kontrolisane prostore.');
  });
});
