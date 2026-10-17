# Podovi customer ordering and SCHÖNOX Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development for the bounded assignments below; root integrates and verifies the whole result.

**Goal:** Deliver email customer accounts, automatic 10% rebate, sales-confirmed orders and the current SCHÖNOX catalog with prices pending Monday's price list.

**Architecture:** Preserve the Next.js catalog and add a separate commerce service with server-resolved variants/prices and atomic order persistence. Browser state stores only cart references; authenticated APIs verify Supabase users. SCHÖNOX uses a source-backed dataset and existing catalog integration patterns.

**Tech Stack:** Existing Next.js 14, React 18, TypeScript, Supabase JS/Postgres, Nodemailer and Vitest.

**Spec:** `docs/superpowers/specs/2026-10-17-customer-ordering-schonox.md`

## Global Constraints

- Confirmed customer default rebate is exactly 10%; individual override replaces it, including 0%.
- Orders require Podovi sales confirmation; no card charge or stock promise.
- Unknown prices remain null; SCHÖNOX has no prices until 19.10.2026 price list.
- Source-backed complete European/global SCHÖNOX program, Serbian copy, first-party assets.
- Preserve existing design language, inquiry flow, disabled CRM and unrelated changes.
- Work on `codex/podovi-commerce-schonox`; no automatic production deployment.

## Review Focus

- Client-supplied price, rebate, customer ID or status cannot alter authoritative results.
- A valid color belonging to a different collection cannot become an order line.
- Missing/zero prices and unverified stock/package defaults never become sale promises.
- Duplicate submit and email failure cannot create lost or duplicate orders.
- Private user data/session must not enter public listing caches or another account.

### Task 1: Server commerce and persistence

Files: `lib/commerce/*`, `app/api/commerce/*`, `app/api/ops/commerce/*`, `supabase/*`, commerce contract tests.

- [ ] Write failing behavior tests for 10%/0%, identity/variant/quantity validation, unknown prices, ownership and idempotency.
- [ ] Implement shared types, catalog line resolver, integer-money quote, verified-user service and atomic order repository/RPC migration.
- [ ] Add session, quote, own-order list/detail, order submission and staff-authorized management endpoints.
- [ ] Escape email content and report mail delivery separately from committed order success.
- [ ] Run focused tests; report required DB/Auth/SMTP configuration without printing secrets.

### Task 2: Customer and staff interaction

Files: `lib/context/CommerceContext.tsx`, `components/commerce/*`, `app/nalog/*`, `app/korpa/*`, staff order page, Header/layout/PDP integrations and focused tests.

Consumes: commerce shared types/API contract from Task 1. Cart inputs are `{productSlug, variantSlug?, quantity}`; prices only come from quote API. Produces the complete browser flow.

- [ ] Add persistent cart references and authenticated account state using existing Supabase browser client.
- [ ] Build email-link sign-in, confirmation return, account/order history, cart and sales-confirmed checkout with unpriced-line wording.
- [ ] Connect exact selected PDP variant and mobile CTA; keep inquiry access.
- [ ] Show 10% membership and server-calculated prices consistently without changing public listing caches.
- [ ] Add authorized staff order/status and individual-rebate surface.
- [ ] Verify keyboard/mobile and preserve cart across sign-in; run focused tests.

### Task 3: Complete source-backed SCHÖNOX catalog

Files: extractor/source manifest, `public/data/schonox_products.json`, first-party assets, catalog loader/repository/brand/filter/PDP integration and catalog tests.

- [ ] Enumerate the official European/global Sika SCHÖNOX floor/tile/marine and ancillaries product lists; record canonical URLs, duplicates and exclusions.
- [ ] Reuse exact local KH/RM/ZM media, fetch remaining official images/documents and write dated source-backed Serbian product records without prices or stock assertions.
- [ ] Add the SCHÖNOX brand and Pribor product groups throughout catalog/search/filters/PDP/sitemap/counts.
- [ ] Write and run completeness, no-hotlink, no-fake-stock, no-price and resolver tests.

### Task 4: Whole-change verification and handoff

- [ ] Review all three workstreams together; fix shared contract or stock/price inconsistencies.
- [ ] Run contract suite, lint, TypeScript, image checks and production build.
- [ ] Inspect local desktop/mobile ordering and representative SCHÖNOX pages.
- [ ] Update AGENTS.md, architecture workflow and README with actual delivered behavior, data coverage and release prerequisites.
- [ ] Obtain independent security/correctness review and fix actionable issues before reporting readiness.
