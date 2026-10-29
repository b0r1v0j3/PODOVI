# SCHÖNOX Catalog Fixes Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development for the independent tasks below. Root integrates and verifies the result.

**Goal:** Apply every accepted correction from the 22 October catalog audit.

**Architecture:** Fix image presentation in the existing shared component and retain the catalog pipeline. Refresh official assets through the existing extractor, with content-addressed storage paths and localized editorial data. Correct the current filter engine and asynchronous URL state without changing its public contract.

**Tech Stack:** Existing Next.js 14, React 18, TypeScript, Supabase Storage, Node/sharp and Vitest.

**Spec:** `docs/schonox-improvements.md`

## Global Constraints

- Preserve the 135-product European/global floor/tile/marine scope, Serbian content, `on_request` availability and unknown prices.
- Reuse exact catalog media first; acquire only official manufacturer originals. No new dependency or generated packaging.
- Preserve room/decor cropping, ISR, slim client data, inquiries, retired BLOQ and disabled CRM. Do not restore customer commerce.
- Never overwrite a valid file with an invalid response or expose credentials. Changed asset bytes receive a new URL.

## Review Focus

- Active fallback image, not just the first source, determines the packshot presentation.
- Missing price cannot pass a numeric price range, while incomplete technical attributes retain the agreed policy.
- URL sorting cannot be erased by a temporarily empty color list or Back/Forward navigation.
- Larger upstream images may still be low resolution or differently framed; check their actual bytes/dimensions.
- Manufacturer contradictions and missing technical sheets must remain visible instead of becoming invented commercial facts.

### Task 1: Whole-product image presentation

Files: `components/ProductImage.tsx`, affected callers and focused image contracts.

- [x] Trace every image caller and write a failing packshot-versus-roomshot test, including fallback selection.
- [x] Implement one shared presentation decision: SCHÖNOX contain/white/padding, existing behavior elsewhere.
- [x] Remove conflicting caller classes where required; run focused tests with one worker.

### Task 2: Official assets, content and reliable refresh

Files: `tools/extract_schonox_catalog.js`, `tools/schonox-copy.json`, localized details data, dataset, manifest, media catalogs and extractor runbook.

Interface: `tools/schonox-details.json` maps product slug to a full Serbian description string; `schonox-copy.json` remains the short-description map. The extractor appends the commercial/document note and preserves existing valid prices.

- [x] Add meaningful self-checks for high-resolution source URLs, validated refresh and hashed publication.
- [x] Fetch/verify higher-resolution official images; reuse existing good cutouts; publish immutable assets and record hashes.
- [x] Localize source descriptions and correct FPL PLUS/D/GEA/2K PU SOLID without resolving uncertain commercial facts by guessing.
- [x] Distinguish attached technical sheets from other documents; refresh dataset/manifest and run source/catalog contracts.

### Task 3: Filter correctness and small usability fixes

Files: `lib/catalog/home-filter-engine.ts`, `components/HomeProductTabs.tsx`, `HomeFilterPanel.tsx`, `RecentlyViewed.tsx`, `ProductColorSelector.tsx` and related tests.

- [x] Reproduce the unpriced range and premature sort reset with failing checks, then fix the shared causes.
- [x] Keep counts, URL history and missing technical data policy consistent.
- [x] Correct flat-product labels/category discovery, literal zero history price and effect cleanup warning.
- [x] Run focused tests and preserve keyboard/focus/mobile behavior.

### Task 4: Integration and release verification

- [x] Review all changes together; request an independent review and fix actionable findings.
- [x] Run the full bounded contract suite, lint, image validation and production build.
- [x] Inspect desktop/mobile, representative packaging and all image surfaces, URL reload/Back and inquiry links.
- [x] Update project documentation and record remaining commercial/configuration limits with evidence.

Completed 2026-10-29 after resuming the interrupted session. Verification and source limitations are recorded in `docs/schonox-improvements.md`; the public asset HEAD audit covers 521 unique URLs with zero failures.
