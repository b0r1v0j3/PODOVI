# Essence Premium konfigurator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 4-step wizard at `/parket/essence` (uzorak → boja → gradacija → obrada) that ends in a "finalni proizvod" summary whose CTA opens a pre-filled `/upiti` inquiry.

**Architecture:** Server page loads configurator data (19 patterns from the existing alpod JSON + 20 colors / 3 gradations / 4 surfaces from a committed axis module) through one typed loader, and hands it to a client wizard composed of small presentational units (`ConfiguratorStep`, `ConfiguratorSummary`). Pure quote logic (code + `/upiti` href) lives in its own tested module. Axis images hotlink from `www.alpod.rs` (already allow-listed in `next.config.mjs`); an optional script later migrates them to Supabase.

**Tech Stack:** Next.js 14 App Router, TypeScript, TailwindCSS 3 (existing `ink`/`paper` tokens, `container`, `btn-primary`, `eyebrow`, no border-radius/no-shadow "Galerija" language), Vitest contract tests (node env), `next/image`, `next/link`.

Spec: `docs/superpowers/specs/2026-06-17-parket-essence-konfigurator-design.md`

---

## File Structure

**Create:**
- `lib/configurator/types.ts` — shared types (`EssenceOption`, `EssenceSelection`, `EssenceConfiguratorData`, `EssenceStepKey`). Imported by both server loader and client components, so it must NOT import `fs`.
- `lib/configurator/essence-quote.ts` — pure functions: `isComplete`, `buildEssenceCode`, `buildEssenceName`, `buildInquiryHref`. No I/O, no React. TDD.
- `lib/data/essence-configurator-axes.ts` — committed axis data: `ESSENCE_COLORS` (20), `ESSENCE_GRADATIONS` (3), `ESSENCE_SURFACES` (4), each `EssenceOption` with real alpod image URLs.
- `lib/data/essence-configurator.ts` — server loader `getEssenceConfiguratorData()`: patterns from `public/data/alpod_floor_collections.json` + axes from the axis module. TDD.
- `components/configurator/ConfiguratorStep.tsx` — presentational option grid (reused for all 4 steps). Client.
- `components/configurator/ConfiguratorSummary.tsx` — "Vaš izbor" rows + finalni proizvod card + CTA. Client.
- `components/configurator/EssenceConfigurator.tsx` — wizard orchestrator (state + stepper). Client.
- `components/configurator/EssenceConfiguratorBanner.tsx` — entry-point link block for the Parket category. Server-safe.
- `app/parket/essence/page.tsx` — server route page.
- `tests/contracts/essence-quote-contract.test.ts` — quote-logic tests.
- `tests/contracts/essence-configurator-contract.test.ts` — loader/data tests.

**Modify:**
- `components/ContactForm.tsx` — read `konfigurator`/`uzorak`/`boja`/`gradacija`/`obrada`/`sifra` URL params and pre-fill subject + message.
- `app/kategorije/[slug]/page.tsx:841` — render `<EssenceConfiguratorBanner />` when `category.slug === 'parket'`.
- `app/sitemap.ts` — add the `/parket/essence` static page.
- `tools/migrate_alpod_images.js` — (optional, Task 11) include axis images in migration.

---

## Task 1: Shared types

**Files:**
- Create: `lib/configurator/types.ts`

- [ ] **Step 1: Create the types module**

```typescript
// lib/configurator/types.ts
// Tipovi za Essence konfigurator. NE sme da uvozi `fs` — koristi se i na klijentu.

export type EssenceStepKey = 'uzorak' | 'boja' | 'gradacija' | 'obrada';

export type EssenceOption = {
  code: string;
  name: string;
  image: string | null;
  family?: string;
  lifestyle?: string | null;
};

export type EssenceSelection = {
  uzorak: EssenceOption | null;
  boja: EssenceOption | null;
  gradacija: EssenceOption | null;
  obrada: EssenceOption | null;
};

export type EssenceConfiguratorData = {
  patterns: EssenceOption[];
  colors: EssenceOption[];
  gradations: EssenceOption[];
  surfaces: EssenceOption[];
};
```

- [ ] **Step 2: Typecheck**

Run: `cd PODOVI && npx tsc --noEmit`
Expected: no new errors referencing `lib/configurator/types.ts`.

- [ ] **Step 3: Commit**

```bash
cd PODOVI
git add lib/configurator/types.ts
git commit -m "feat(konfigurator): shared Essence types"
```

---

## Task 2: Pure quote logic (TDD)

**Files:**
- Test: `tests/contracts/essence-quote-contract.test.ts`
- Create: `lib/configurator/essence-quote.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/contracts/essence-quote-contract.test.ts
import { describe, expect, it } from 'vitest';
import { isComplete, buildEssenceCode, buildEssenceName, buildInquiryHref } from '@/lib/configurator/essence-quote';
import type { EssenceSelection } from '@/lib/configurator/types';

const opt = (code: string, name: string) => ({ code, name, image: null });

const full: EssenceSelection = {
  uzorak: opt('ESS-01', 'Rhombus Diamond Regular'),
  boja: opt('C03', 'Dark Oak'),
  gradacija: opt('E', 'Elegant'),
  obrada: opt('B', 'Brušeno'),
};
const partial: EssenceSelection = { ...full, obrada: null };

describe('essence-quote', () => {
  it('isComplete is true only when all four chosen', () => {
    expect(isComplete(full)).toBe(true);
    expect(isComplete(partial)).toBe(false);
  });

  it('buildEssenceName needs only the pattern', () => {
    expect(buildEssenceName(partial)).toBe('Essence Premium Rhombus Diamond Regular');
    expect(buildEssenceName({ ...full, uzorak: null })).toBeNull();
  });

  it('buildEssenceCode concatenates codes, null when incomplete', () => {
    expect(buildEssenceCode(full)).toBe('ESS-01-C03EB');
    expect(buildEssenceCode(partial)).toBeNull();
  });

  it('buildInquiryHref builds a /upiti link with encoded params', () => {
    const href = buildInquiryHref(full)!;
    expect(href.startsWith('/upiti?')).toBe(true);
    expect(href).toContain('konfigurator=essence');
    expect(href).toContain('sifra=ESS-01-C03EB');
    expect(href).toContain('boja=Dark+Oak');
    expect(href).toContain(encodeURIComponent('Essence Premium Rhombus Diamond Regular').replace(/%20/g, '+'));
    expect(buildInquiryHref(partial)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd PODOVI && npm run test:contract -- essence-quote`
Expected: FAIL — `Cannot find module '@/lib/configurator/essence-quote'`.

- [ ] **Step 3: Write minimal implementation**

```typescript
// lib/configurator/essence-quote.ts
import type { EssenceSelection, EssenceOption } from './types';

type CompleteSelection = { [K in keyof EssenceSelection]: EssenceOption };

export function isComplete(sel: EssenceSelection): sel is CompleteSelection {
  return Boolean(sel.uzorak && sel.boja && sel.gradacija && sel.obrada);
}

export function buildEssenceName(sel: EssenceSelection): string | null {
  return sel.uzorak ? `Essence Premium ${sel.uzorak.name}` : null;
}

export function buildEssenceCode(sel: EssenceSelection): string | null {
  if (!isComplete(sel)) return null;
  return `${sel.uzorak.code}-${sel.boja.code}${sel.gradacija.code}${sel.obrada.code}`;
}

export function buildInquiryHref(sel: EssenceSelection): string | null {
  if (!isComplete(sel)) return null;
  const params = new URLSearchParams({
    konfigurator: 'essence',
    name: `Essence Premium ${sel.uzorak.name}`,
    uzorak: sel.uzorak.name,
    boja: sel.boja.name,
    gradacija: sel.gradacija.name,
    obrada: sel.obrada.name,
    sifra: buildEssenceCode(sel)!,
  });
  return `/upiti?${params.toString()}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd PODOVI && npm run test:contract -- essence-quote`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
cd PODOVI
git add lib/configurator/essence-quote.ts tests/contracts/essence-quote-contract.test.ts
git commit -m "feat(konfigurator): pure quote logic (code + /upiti href) with tests"
```

---

## Task 3: Axis data module

**Files:**
- Create: `lib/data/essence-configurator-axes.ts`

Image URLs below are the real alpod assets (verified live 2026-06-17). The `www.alpod.rs/wp-content/uploads/**` host is already allow-listed in `next.config.mjs`, so `next/image` renders them directly.

- [ ] **Step 1: Create the axis data module**

```typescript
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
```

- [ ] **Step 2: Typecheck**

Run: `cd PODOVI && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
cd PODOVI
git add lib/data/essence-configurator-axes.ts
git commit -m "feat(konfigurator): Essence axis data (20 colors, 3 gradations, 4 surfaces)"
```

---

## Task 4: Data loader (TDD)

**Files:**
- Test: `tests/contracts/essence-configurator-contract.test.ts`
- Create: `lib/data/essence-configurator.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/contracts/essence-configurator-contract.test.ts
import { describe, expect, it } from 'vitest';
import { getEssenceConfiguratorData } from '@/lib/data/essence-configurator';

describe('Essence konfigurator — podaci', () => {
  const data = getEssenceConfiguratorData();

  it('ima 19 uzoraka, 20 boja, 3 gradacije, 4 obrade', () => {
    expect(data.patterns).toHaveLength(19);
    expect(data.colors).toHaveLength(20);
    expect(data.gradations).toHaveLength(3);
    expect(data.surfaces).toHaveLength(4);
  });

  it('svaki uzorak ima ESS- šifru, ime, sliku i familiju', () => {
    for (const p of data.patterns) {
      expect(p.code).toMatch(/^ESS-\d{2}$/);
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.image).toBeTruthy();
      expect(['Rhombus', 'Trapezium', 'Mosaic', 'Waves', 'Forest']).toContain(p.family);
    }
  });

  it('svaka osa ima jedinstvene šifre i slike', () => {
    for (const axis of [data.colors, data.gradations, data.surfaces]) {
      const codes = axis.map((o) => o.code);
      expect(new Set(codes).size).toBe(codes.length);
      expect(axis.every((o) => Boolean(o.image))).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd PODOVI && npm run test:contract -- essence-configurator`
Expected: FAIL — `Cannot find module '@/lib/data/essence-configurator'`.

- [ ] **Step 3: Write minimal implementation**

```typescript
// lib/data/essence-configurator.ts
// Server-only loader: uzorci iz alpod JSON-a + ose iz axis modula.
import { readFileSync } from 'fs';
import { join } from 'path';
import type { EssenceConfiguratorData, EssenceOption } from '@/lib/configurator/types';
import { ESSENCE_COLORS, ESSENCE_GRADATIONS, ESSENCE_SURFACES } from '@/lib/data/essence-configurator-axes';

const ESSENCE_SLUG = 'podovi-parket-essence-premium';

type RawPattern = {
  code?: string;
  name?: string;
  image?: string;
  image_url?: string;
  lifestyle_url?: string;
  characteristics?: Record<string, string>;
};

function loadPatterns(): EssenceOption[] {
  try {
    const file = join(process.cwd(), 'public', 'data', 'alpod_floor_collections.json');
    const data = JSON.parse(readFileSync(file, 'utf8')) as { collections: Array<{ slug?: string; colors?: RawPattern[] }> };
    const collection = data.collections?.find((c) => c.slug === ESSENCE_SLUG);
    return (collection?.colors || []).map((p) => ({
      code: p.code || '',
      name: p.name || '',
      image: p.image || p.image_url || null,
      lifestyle: p.lifestyle_url || p.image || p.image_url || null,
      family: p.characteristics?.['Podkolekcija'] || '',
    }));
  } catch {
    return [];
  }
}

export function getEssenceConfiguratorData(): EssenceConfiguratorData {
  return {
    patterns: loadPatterns(),
    colors: ESSENCE_COLORS,
    gradations: ESSENCE_GRADATIONS,
    surfaces: ESSENCE_SURFACES,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd PODOVI && npm run test:contract -- essence-configurator`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd PODOVI
git add lib/data/essence-configurator.ts tests/contracts/essence-configurator-contract.test.ts
git commit -m "feat(konfigurator): data loader (patterns + axes) with contract test"
```

---

## Task 5: ConfiguratorStep component

**Files:**
- Create: `components/configurator/ConfiguratorStep.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/configurator/ConfiguratorStep.tsx
'use client';

import Image from 'next/image';
import type { EssenceOption } from '@/lib/configurator/types';

interface ConfiguratorStepProps {
  label: string;
  items: EssenceOption[];
  selectedCode: string | null;
  onSelect: (option: EssenceOption) => void;
}

export default function ConfiguratorStep({ label, items, selectedCode, onSelect }: ConfiguratorStepProps) {
  return (
    <div>
      <p className="mb-4 text-[13px] text-ink-600">
        <span className="font-medium text-ink-900">Izaberite {label.toLowerCase()}</span> · {items.length} opcija
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {items.map((item) => {
          const selected = item.code === selectedCode;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => onSelect(item)}
              aria-pressed={selected}
              className={`group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 ${selected ? 'ring-2 ring-ink-900' : ''}`}
            >
              <div className="relative aspect-square overflow-hidden border border-ink-200 bg-paper">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 20vw"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center px-2 text-center text-[12px] text-ink-500">
                    {item.name}
                  </span>
                )}
                {selected && (
                  <span className="absolute right-0 top-0 bg-ink-900 px-1 text-white" aria-hidden="true">✓</span>
                )}
              </div>
              <div className="mt-1.5 text-[12px] leading-tight text-ink-900">{item.name}</div>
              {item.family && <div className="text-[11px] text-ink-400">{item.family}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd PODOVI && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
cd PODOVI
git add components/configurator/ConfiguratorStep.tsx
git commit -m "feat(konfigurator): ConfiguratorStep option grid"
```

---

## Task 6: ConfiguratorSummary component

**Files:**
- Create: `components/configurator/ConfiguratorSummary.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/configurator/ConfiguratorSummary.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { EssenceSelection } from '@/lib/configurator/types';
import { isComplete, buildEssenceCode, buildEssenceName, buildInquiryHref } from '@/lib/configurator/essence-quote';

const ROWS: Array<{ key: keyof EssenceSelection; label: string }> = [
  { key: 'uzorak', label: 'Uzorak' },
  { key: 'boja', label: 'Boja' },
  { key: 'gradacija', label: 'Gradacija' },
  { key: 'obrada', label: 'Obrada' },
];

export default function ConfiguratorSummary({ selection }: { selection: EssenceSelection }) {
  const complete = isComplete(selection);
  const chosenCount = ROWS.filter((r) => selection[r.key]).length;
  const preview = selection.uzorak?.lifestyle || selection.uzorak?.image || null;

  return (
    <div className="border border-ink-200 p-4">
      <p className="eyebrow mb-3">Vaš izbor</p>

      <div className="relative mb-4 aspect-[4/3] border border-ink-200 bg-paper">
        {preview ? (
          <Image src={preview} alt={selection.uzorak?.name || ''} fill sizes="320px" className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-[12px] text-ink-400">izaberite uzorak</span>
        )}
      </div>

      <dl>
        {ROWS.map((row) => {
          const value = selection[row.key]?.name;
          return (
            <div key={row.key} className="flex justify-between gap-3 border-b border-ink-200 py-2 text-[13px]">
              <dt className="text-ink-400">{row.label}</dt>
              <dd className={`text-right ${value ? 'font-medium text-ink-900' : 'text-ink-400'}`}>{value || '—'}</dd>
            </div>
          );
        })}
      </dl>

      {complete ? (
        <div className="mt-4 border border-ink-900 p-3">
          <p className="eyebrow">Finalni proizvod</p>
          <p className="mt-1 text-[14px] font-medium leading-snug text-ink-900">{buildEssenceName(selection)}</p>
          <p className="mt-0.5 text-[12px] text-ink-600">
            {selection.boja!.name} · {selection.gradacija!.name} · {selection.obrada!.name}
          </p>
          <p className="mt-1.5 text-[11px] text-ink-400">šifra: {buildEssenceCode(selection)}</p>
          <Link href={buildInquiryHref(selection)!} className="btn-primary mt-3 block w-full text-center">
            Zatraži ponudu
          </Link>
        </div>
      ) : (
        <p className="mt-4 text-center text-[12px] text-ink-400">{chosenCount}/4 izabrano</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd PODOVI && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
cd PODOVI
git add components/configurator/ConfiguratorSummary.tsx
git commit -m "feat(konfigurator): ConfiguratorSummary with finalni proizvod + CTA"
```

---

## Task 7: EssenceConfigurator wizard

**Files:**
- Create: `components/configurator/EssenceConfigurator.tsx`

- [ ] **Step 1: Create the wizard**

```tsx
// components/configurator/EssenceConfigurator.tsx
'use client';

import { useState } from 'react';
import type { EssenceConfiguratorData, EssenceOption, EssenceSelection, EssenceStepKey } from '@/lib/configurator/types';
import ConfiguratorStep from './ConfiguratorStep';
import ConfiguratorSummary from './ConfiguratorSummary';

const EMPTY: EssenceSelection = { uzorak: null, boja: null, gradacija: null, obrada: null };

export default function EssenceConfigurator({ data }: { data: EssenceConfiguratorData }) {
  const steps: Array<{ key: EssenceStepKey; label: string; items: EssenceOption[] }> = [
    { key: 'uzorak', label: 'Uzorak', items: data.patterns },
    { key: 'boja', label: 'Boja', items: data.colors },
    { key: 'gradacija', label: 'Gradacija', items: data.gradations },
    { key: 'obrada', label: 'Obrada', items: data.surfaces },
  ];

  const [selection, setSelection] = useState<EssenceSelection>(EMPTY);
  const [active, setActive] = useState(0);

  function handleSelect(key: EssenceStepKey, option: EssenceOption) {
    const next = { ...selection, [key]: option };
    setSelection(next);
    const firstEmpty = steps.findIndex((s) => !next[s.key]);
    setActive(firstEmpty === -1 ? active : firstEmpty);
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-6 flex border-y border-ink-200">
          {steps.map((step, i) => {
            const done = Boolean(selection[step.key]);
            return (
              <button
                key={step.key}
                type="button"
                onClick={() => setActive(i)}
                aria-current={i === active ? 'step' : undefined}
                className={`flex-1 border-r border-ink-200 px-2 py-3 text-center last:border-r-0 ${i === active ? 'bg-paper' : ''}`}
              >
                <span className="block text-[11px] text-ink-400">korak {i + 1}</span>
                <span className={`text-[13px] ${i === active ? 'font-medium text-ink-900' : 'text-ink-700'}`}>
                  {step.label}{done ? ' ✓' : ''}
                </span>
              </button>
            );
          })}
        </div>

        <ConfiguratorStep
          label={steps[active].label}
          items={steps[active].items}
          selectedCode={selection[steps[active].key]?.code || null}
          onSelect={(option) => handleSelect(steps[active].key, option)}
        />
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <ConfiguratorSummary selection={selection} />
      </aside>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd PODOVI && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
cd PODOVI
git add components/configurator/EssenceConfigurator.tsx
git commit -m "feat(konfigurator): EssenceConfigurator wizard (stepper + state)"
```

---

## Task 8: Route page `/parket/essence`

**Files:**
- Create: `app/parket/essence/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// app/parket/essence/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import EssenceConfigurator from '@/components/configurator/EssenceConfigurator';
import { getEssenceConfiguratorData } from '@/lib/data/essence-configurator';

export const metadata: Metadata = {
  title: 'Essence Premium — parket po meri | Podovi',
  description: 'Sklopite svoj parket po meri u 4 koraka: uzorak, boja, gradacija i površinska obrada. Zatražite ponudu za vašu kombinaciju.',
};

export default function EssenceConfiguratorPage() {
  const data = getEssenceConfiguratorData();

  return (
    <div className="bg-white min-h-screen">
      <div className="container py-6">
        <div className="mb-4">
          <Breadcrumbs items={[{ label: 'Parket', href: '/kategorije/parket' }, { label: 'Essence Premium' }]} />
        </div>

        <section className="mb-8 max-w-3xl">
          <p className="eyebrow">Parket · konfigurator</p>
          <h1 className="mt-3 text-3xl font-normal tracking-tight text-ink-900 sm:text-5xl">
            Essence Premium — parket po meri
          </h1>
          <p className="mt-4 text-base leading-7 text-ink-600 sm:text-lg">
            Sklopite svoj parket u 4 koraka. Izaberite uzorak, boju, gradaciju i površinsku obradu, pa zatražite ponudu za vašu kombinaciju.
          </p>
        </section>

        <EssenceConfigurator data={data} />
      </div>
    </div>
  );
}
```

Note: `Breadcrumbs` accepts `{ label, href? }` items — confirmed in `components/Breadcrumbs.tsx:3-6` (`BreadcrumbItem` has optional `href`). The "Parket" crumb links to `/kategorije/parket`; the last item renders as plain text.

- [ ] **Step 2: Typecheck**

Run: `cd PODOVI && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
cd PODOVI
git add app/parket/essence/page.tsx
git commit -m "feat(konfigurator): /parket/essence route page"
```

---

## Task 9: ContactForm pre-fill from configurator

**Files:**
- Modify: `components/ContactForm.tsx`

The form already reads `product`/`color`/`ref`/`category`/`name` and builds `subject`/`message` in a `useEffect`. Add a configurator branch that takes priority when `konfigurator=essence`.

- [ ] **Step 1: Read the configurator params**

In `components/ContactForm.tsx`, after the existing `const initialName = searchParams.get('name') || '';` (line 14), add:

```tsx
    const initialKonfigurator = searchParams.get('konfigurator') || '';
    const initialUzorak = searchParams.get('uzorak') || '';
    const initialBoja = searchParams.get('boja') || '';
    const initialGradacija = searchParams.get('gradacija') || '';
    const initialObrada = searchParams.get('obrada') || '';
    const initialSifra = searchParams.get('sifra') || '';
```

- [ ] **Step 2: Add the configurator pre-fill branch**

Replace the existing details `useEffect` (lines 35-62) so the configurator case is handled first:

```tsx
    useEffect(() => {
        if (initialName) {
            setFormData(prev => ({ ...prev, subject: `Upit za: ${initialName}` }));
        } else if (initialProduct) {
            setFormData(prev => ({ ...prev, subject: `Upit za proizvod: ${initialProduct}` }));
        }

        if (initialKonfigurator === 'essence' && initialUzorak) {
            const lines =
                `Uzorak: ${initialUzorak}\n` +
                `Boja: ${initialBoja}\n` +
                `Gradacija: ${initialGradacija}\n` +
                `Obrada: ${initialObrada}\n` +
                (initialSifra ? `Šifra: ${initialSifra}\n` : '');
            setFormData(prev => ({
                ...prev,
                message: `Poštovani,\n\nŽeleo bih ponudu za parket po meri (Essence Premium) sa sledećom konfiguracijom:\n${lines}\nMolim vas za ponudu i informaciju o dostupnosti.\n\nHvala.`,
            }));
            return;
        }

        if (initialCategory || initialColor || initialRef) {
            let details = '';
            if (initialCategory) details += `Kategorija: ${initialCategory}\n`;
            if (initialName) details += `Proizvod: ${initialName}\n`;
            if (initialColor) details += `Boja/Dezen: ${initialColor}\n`;
            if (initialRef) details += `Referenca: ${initialRef}\n`;

            if (details) {
                setFormData(prev => ({
                    ...prev,
                    message: `Poštovani,\n\nZainteresovan sam za sledeći proizvod:\n${details}\nMolim vas za ponudu i informaciju o dostupnosti.\n\nHvala.`,
                }));
            }
        }
    }, [initialProduct, initialCategory, initialColor, initialRef, initialName, initialKonfigurator, initialUzorak, initialBoja, initialGradacija, initialObrada, initialSifra]);
```

- [ ] **Step 3: Typecheck**

Run: `cd PODOVI && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
cd PODOVI
git add components/ContactForm.tsx
git commit -m "feat(konfigurator): /upiti pre-fill from Essence configurator params"
```

---

## Task 10: Entry banner on the Parket category

**Files:**
- Create: `components/configurator/EssenceConfiguratorBanner.tsx`
- Modify: `app/kategorije/[slug]/page.tsx:841`

- [ ] **Step 1: Create the banner component**

```tsx
// components/configurator/EssenceConfiguratorBanner.tsx
import Link from 'next/link';

export default function EssenceConfiguratorBanner() {
  return (
    <Link
      href="/parket/essence"
      className="mb-8 flex flex-col gap-3 border border-ink-900 p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="eyebrow">Novo · parket po meri</p>
        <p className="mt-1 text-lg font-medium text-ink-900">Essence Premium konfigurator</p>
        <p className="mt-1 text-[13px] text-ink-600">Sklopite svoj parket u 4 koraka i zatražite ponudu.</p>
      </div>
      <span className="btn-primary self-start sm:self-auto">Otvori konfigurator</span>
    </Link>
  );
}
```

- [ ] **Step 2: Import the banner in the category page**

At the top of `app/kategorije/[slug]/page.tsx`, after the existing `import Breadcrumbs from '@/components/Breadcrumbs';` (line 15), add:

```tsx
import EssenceConfiguratorBanner from '@/components/configurator/EssenceConfiguratorBanner';
```

- [ ] **Step 3: Render the banner for Parket**

In `app/kategorije/[slug]/page.tsx`, immediately after the intro `</section>` (currently line 841) and before the `{/* Traka filtera: ... */}` comment, add:

```tsx
        {category.slug === 'parket' && <EssenceConfiguratorBanner />}
```

- [ ] **Step 4: Typecheck**

Run: `cd PODOVI && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
cd PODOVI
git add components/configurator/EssenceConfiguratorBanner.tsx app/kategorije/[slug]/page.tsx
git commit -m "feat(konfigurator): entry banner on Parket category"
```

---

## Task 11: Sitemap entry

**Files:**
- Modify: `app/sitemap.ts:70-76`

- [ ] **Step 1: Add the static page entry**

In `app/sitemap.ts`, inside the `staticPages` array, after the `/upiti` entry (line 75), add:

```tsx
    {
      url: `${baseUrl}/parket/essence`,
      lastModified: sharedCatalogLastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
```

- [ ] **Step 2: Typecheck**

Run: `cd PODOVI && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
cd PODOVI
git add app/sitemap.ts
git commit -m "feat(konfigurator): add /parket/essence to sitemap"
```

---

## Task 12: Build + manual verification (gate)

**Files:** none (verification only)

- [ ] **Step 1: Run the full contract suite**

Run: `cd PODOVI && npm run test:contract`
Expected: PASS, including the existing `podovi-import-contract` (Essence collection still 19 patterns) and the two new suites.

- [ ] **Step 2: Production build**

Run: `cd PODOVI && npm run build`
Expected: build succeeds; `/parket/essence` appears in the route list.

- [ ] **Step 3: Manual walkthrough on dev**

Run: `cd PODOVI && npm run dev`, then open `http://localhost:3000/parket/essence`.
Verify:
- All 4 step grids render with real images (19 patterns, 20 colors, 3 gradations, 4 surfaces).
- Selecting an option advances to the next step; stepper shows ✓ and allows going back.
- When all 4 are chosen, "finalni proizvod" shows the pattern image, name `Essence Premium <uzorak>`, the `boja · gradacija · obrada` line, and a šifra.
- "Zatraži ponudu" opens `/upiti` with subject `Upit za: Essence Premium <uzorak>` and a message listing uzorak/boja/gradacija/obrada/šifra.
- `/kategorije/parket` shows the entry banner linking to `/parket/essence`.

- [ ] **Step 4: Commit any fixes from verification**

```bash
cd PODOVI
git add -A
git commit -m "fix(konfigurator): verification adjustments"
```

(If nothing needed fixing, skip this commit.)

---

## Task 13 (OPTIONAL, later): Migrate axis images to Supabase

Do this only when removing the dependency on the alpod CDN (project principle: host all images on Supabase). Until then, hotlinking works because `www.alpod.rs/wp-content/uploads/**` is allow-listed.

**Files:**
- Create: `tools/migrate_essence_axes_images.js`
- Modify: `lib/data/essence-configurator-axes.ts` (URLs rewritten by the script)

- [ ] **Step 1: Create the migration script (reuses `tools/lib/ingest-core.js`)**

```javascript
// tools/migrate_essence_axes_images.js
// Migrira Essence axis slike (alpod.rs) → Supabase, pa prepiše URL-ove u axis modulu.
//   node tools/migrate_essence_axes_images.js [--dry-run]
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const core = require('./lib/ingest-core.js');

const AXES = path.join(process.cwd(), 'lib', 'data', 'essence-configurator-axes.ts');
const BUCKET = 'product-images';
const DEST_PREFIX = 'products/alpod-migrated/essence-axes';
const DRY = process.argv.includes('--dry-run');
const isAlpod = (u) => /^https?:\/\/www\.alpod\.rs\/.*\.(?:jpg|jpeg|png|webp)/i.test(u);

function destPath(url) {
  const m = url.match(/uploads\/(.+)\.(?:jpg|jpeg|png|webp)/i);
  const stem = core.slugify((m ? m[1] : url).replace(/\//g, '-')).slice(0, 80);
  const hash = crypto.createHash('md5').update(url).digest('hex').slice(0, 6);
  return `${DEST_PREFIX}/${stem}-${hash}.jpg`;
}

(async () => {
  const src = fs.readFileSync(AXES, 'utf8');
  const urls = [...new Set((src.match(/https?:\/\/www\.alpod\.rs\/[^`'"\s)]+/g) || []).filter(isAlpod))];
  console.log(`🎯 axis slika: ${urls.length}${DRY ? ' (DRY-RUN)' : ''}`);
  if (DRY) { console.log(urls.map(destPath).slice(0, 3)); return; }

  const supabase = core.getSupabase();
  const map = {};
  for (const url of urls) {
    let buf = await core.downloadAsset(url);
    const meta = await sharp(buf).metadata();
    if (meta.format !== 'jpeg') buf = await sharp(buf).jpeg({ quality: 90 }).toBuffer();
    map[url] = await core.uploadToBucket(supabase, BUCKET, destPath(url), buf);
    await core.sleep(200);
  }
  let out = src;
  for (const [from, to] of Object.entries(map)) out = out.split(from).join(to);
  if (out !== src) { fs.writeFileSync(AXES, out); console.log('💾 essence-configurator-axes.ts ažuriran'); }
})().catch((e) => { console.error('❌', e); process.exit(1); });
```

- [ ] **Step 2: Dry run, then real run (needs Supabase env in `.env.local`)**

Run: `cd PODOVI && node tools/migrate_essence_axes_images.js --dry-run`
Then: `cd PODOVI && node tools/migrate_essence_axes_images.js`
Expected: 27 images uploaded; axis module URLs now point to `nnjmrfwepylrheykalik.supabase.co/...essence-axes/...`.

- [ ] **Step 3: Re-run tests + build + commit**

```bash
cd PODOVI
npm run test:contract -- essence-configurator
npm run build
git add tools/migrate_essence_axes_images.js lib/data/essence-configurator-axes.ts
git commit -m "chore(konfigurator): migrate Essence axis images to Supabase"
```

---

## Self-review notes

- **Spec coverage:** wizard tok (Tasks 5-7), uzorci iz baze + ose skinute (Tasks 3-4 + axis URLs verified live), finalni proizvod + CTA (Task 6), `/upiti` prefill (Task 9), Galerija stil (Tasks 5-8 use `ink`/`paper`/`btn-primary`/no-radius), entry link (Task 10), sitemap (Task 11), fallback na ton/naziv kada slika fali (ConfiguratorStep `item.image ? … : name`), Supabase migracija (Task 13). All spec sections map to a task.
- **Mobile:** summary stacks below steps on mobile (`grid-cols-1`), sticky only on `lg`. A dedicated mobile sticky bottom CTA bar was descoped as polish; revisit if the owner asks.
- **Type consistency:** `EssenceOption`/`EssenceSelection`/`EssenceConfiguratorData` defined once in `lib/configurator/types.ts`; `buildEssenceCode`/`buildInquiryHref` names match across quote module, summary, and tests.
- **No live scraper:** axis data is committed static data with verified URLs; image fetching only happens in the optional Supabase migration, with the alpod fallback always working via the allow-list.
- **Token guardrail (verified in `tailwind.config.ts` + `app/globals.css`):** `ink` only has stops `900/700/600/500/400/200` (NO `ink-100`, NO `ink-300`). `paper` is a SINGLE color → use `bg-paper`, never `bg-paper-100`. Components `btn-primary`, `btn-link`, `eyebrow`, `label`, `input`, `container`, tracking `tracking-label` all exist. Do not invent intermediate stops.
