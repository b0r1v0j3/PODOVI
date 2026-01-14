# GitHub Issue - Image Loading Problem

**Title:** [BUG] Images not loading for collections from "55 Looselay" onwards

## Problem Description

Images are not loading correctly on product pages, especially for collections from "55 Looselay" onwards.

## Website URL
**Production:** https://www.podovi.online

## Repository
https://github.com/cvetkovicborivoje-hub/PODOVI.git

## Affected URLs
- https://www.podovi.online/proizvodi/creation-saga2-terra-35021566
- https://www.podovi.online/proizvodi/creation-55-looselay-terra-39741566
- https://www.podovi.online/proizvodi/creation-55-clic-acoustic-ball-39750555
- https://www.podovi.online/kategorije/lvt

## Technical Stack
- Next.js 14.2.5
- React 18.3.1
- TypeScript
- Image data: `public/data/lvt_colors_complete.json` (583 color entries, 18 collections)
- Product data: `lib/data/gerflor-products-generated.ts`

## Key Components
1. **ColorGrid Component** (`components/ColorGrid.tsx`):
   - Displays color grid for product collections
   - Loads data from `/data/lvt_colors_complete.json`
   - Uses Next.js Image component with `unoptimized` and `quality={100}` props

2. **Product Pages** (`app/proizvodi/[slug]/page.tsx`):
   - Displays individual product details
   - Uses ColorGrid component for color variations

3. **JSON Data** (`public/data/lvt_colors_complete.json`):
   - Contains 583 color entries
   - 18 collections
   - Image URLs stored as paths like `/images/products/lvt/colors/{collection}/{code}-{name}/pod/{filename}.jpg`

## Current Issues
1. **Image Loading Problems:**
   - Images from collections like `creation-55-looselay`, `creation-55-clic`, `creation-70`, `creation-saga2` are not loading
   - ColorGrid component is not displaying images correctly
   - Some product pages show broken image icons

2. **Data Issues:**
   - 26 products with "Unknown" codes have wrong image paths
   - 42 orphaned folders (folders not referenced in JSON)
   - URL encoding issues were recently fixed (601 URLs decoded)

## Recent Changes
1. Fixed URL encoding issues - decoded 601 URLs in JSON (reduced issues from 649 to 48)
2. Fixed collection name extraction logic in ColorGrid (supports 2, 3, and 4-part collections)
3. Removed debug logging

## Expected Behavior
Images should load correctly for all collections and display in ColorGrid component.

## Actual Behavior
Images are not loading for collections from "55 Looselay" onwards. ColorGrid shows broken image icons or empty spaces.

## Steps to Reproduce
1. Go to https://www.podovi.online/kategorije/lvt
2. Navigate to any product from collections: creation-55-looselay, creation-55-clic, creation-70, creation-saga2
3. Observe that images are not loading

## Files to Review
- `components/ColorGrid.tsx` - Main component for displaying color grids
- `public/data/lvt_colors_complete.json` - Image data (583 entries, 18 collections)
- `app/proizvodi/[slug]/page.tsx` - Product page
- `lib/data/gerflor-products-generated.ts` - Product data

## Questions for Analysis
1. Why are images not loading for collections from "55 Looselay" onwards?
2. Is the collection name extraction logic correct?
3. Are there issues with how Next.js Image component handles image paths?
4. Should we use `unoptimized` prop or regular Next.js Image optimization?
5. How should we handle products with "Unknown" codes?

## Test Results
Recent deep testing found:
- 48 remaining issues (down from 649)
- 26 wrong paths (Unknown code products)
- 42 orphaned folders
- Collection extraction logic: ✅ Working correctly
- URL encoding: ✅ Fixed (601 URLs decoded)
