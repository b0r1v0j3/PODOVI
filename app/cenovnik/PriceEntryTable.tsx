'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CenovnikTree, CenovnikCollection } from '@/lib/cenovnik/tree';
import {
  VAT_RATE,
  parseNum,
  formatNum,
  formatInput,
  baseToWithVat,
  withVatToBase,
} from '@/lib/cenovnik/vat';

interface ColorOption {
  code: string;
  name: string;
  slug: string;
}

interface PricePair {
  base: string;
  withVat: string;
}

interface ColorState {
  unlocked: boolean;
  base: string;
  withVat: string;
}

function collKey(c: { categorySlug: string; slug: string }): string {
  return `${c.categorySlug}:::${c.slug}`;
}

export default function PriceEntryTable({
  tree,
  vatPercent,
}: {
  tree: CenovnikTree;
  vatPercent: number;
}) {
  const router = useRouter();

  const [expandedBrand, setExpandedBrand] = useState<Record<string, boolean>>({});
  const [expandedColl, setExpandedColl] = useState<Record<string, boolean>>({});
  const [collPrices, setCollPrices] = useState<Record<string, PricePair>>({});
  const [colorStates, setColorStates] = useState<Record<string, Record<string, ColorState>>>({});
  const [colorsByColl, setColorsByColl] = useState<Record<string, ColorOption[]>>({});
  const [loadingColors, setLoadingColors] = useState<Record<string, boolean>>({});
  const [colorError, setColorError] = useState<Record<string, boolean>>({});

  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // Tagovanje uploada: izabrani brendovi (redosledom) + izabrane kolekcije po brendu.
  const [tagBrands, setTagBrands] = useState<string[]>([]);
  const [tagColls, setTagColls] = useState<Record<string, Set<string>>>({});

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // ---- VAT auto-izračun ----
  function setCollBase(key: string, raw: string) {
    const base = parseNum(raw);
    setCollPrices((s) => ({
      ...s,
      [key]: { base: raw, withVat: base == null ? '' : formatInput(baseToWithVat(base)) },
    }));
  }
  function setCollWithVat(key: string, raw: string) {
    const wv = parseNum(raw);
    setCollPrices((s) => ({
      ...s,
      [key]: { base: wv == null ? '' : formatInput(withVatToBase(wv)), withVat: raw },
    }));
  }

  function setColorBase(key: string, slug: string, raw: string) {
    const base = parseNum(raw);
    setColorStates((s) => {
      const coll = { ...(s[key] || {}) };
      const cur = coll[slug] || { unlocked: true, base: '', withVat: '' };
      coll[slug] = { ...cur, base: raw, withVat: base == null ? '' : formatInput(baseToWithVat(base)) };
      return { ...s, [key]: coll };
    });
  }
  function setColorWithVat(key: string, slug: string, raw: string) {
    const wv = parseNum(raw);
    setColorStates((s) => {
      const coll = { ...(s[key] || {}) };
      const cur = coll[slug] || { unlocked: true, base: '', withVat: '' };
      coll[slug] = { ...cur, base: wv == null ? '' : formatInput(withVatToBase(wv)), withVat: raw };
      return { ...s, [key]: coll };
    });
  }

  function toggleColorUnlock(key: string, color: ColorOption) {
    setColorStates((s) => {
      const coll = { ...(s[key] || {}) };
      const cur = coll[color.slug];
      if (cur?.unlocked) {
        coll[color.slug] = { unlocked: false, base: '', withVat: '' };
      } else {
        const cp = collPrices[key];
        coll[color.slug] = { unlocked: true, base: cp?.base || '', withVat: cp?.withVat || '' };
      }
      return { ...s, [key]: coll };
    });
  }

  // ---- Lenjo učitavanje boja ----
  async function loadColors(c: CenovnikCollection) {
    const key = collKey(c);
    if (loadingColors[key]) return;
    if (colorsByColl[key] && !colorError[key]) return;
    setColorError((s) => ({ ...s, [key]: false }));
    setLoadingColors((s) => ({ ...s, [key]: true }));
    try {
      const res = await fetch(
        `/api/colors?category=${encodeURIComponent(c.categorySlug)}&collection=${encodeURIComponent(c.slug)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      let colors: ColorOption[] = [];
      if (Array.isArray(data.collections)) {
        const match = data.collections.find((x: any) => x.slug === c.slug) || data.collections[0];
        colors = ((match?.colors || []) as any[]).map((x) => ({
          code: String(x.code || ''),
          name: String(x.name || ''),
          slug: String(x.slug || x.code || ''),
        }));
      } else if (Array.isArray(data.colors)) {
        colors = (data.colors as any[]).map((x) => ({
          code: String(x.code || ''),
          name: String(x.name || ''),
          slug: String(x.slug || x.code || ''),
        }));
      }
      setColorsByColl((s) => ({ ...s, [key]: colors }));
    } catch {
      setColorError((s) => ({ ...s, [key]: true }));
      setColorsByColl((s) => ({ ...s, [key]: [] }));
    }
    setLoadingColors((s) => ({ ...s, [key]: false }));
  }

  function toggleCollection(c: CenovnikCollection) {
    const key = collKey(c);
    const willOpen = !expandedColl[key];
    setExpandedColl((s) => ({ ...s, [key]: willOpen }));
    if (willOpen && c.colorCount > 0) loadColors(c);
  }

  function addTagBrand(brandId: string) {
    setTagBrands((prev) => (prev.includes(brandId) ? prev : [...prev, brandId]));
  }
  function removeTagBrand(brandId: string) {
    setTagBrands((prev) => prev.filter((id) => id !== brandId));
    setTagColls((prev) => {
      const next = { ...prev };
      delete next[brandId];
      return next;
    });
  }
  function toggleTagColl(brandId: string, ck: string) {
    setTagColls((prev) => {
      const set = new Set(prev[brandId] || []);
      if (set.has(ck)) set.delete(ck);
      else set.add(ck);
      return { ...prev, [brandId]: set };
    });
  }

  function buildTags(): string[] {
    const tags: string[] = [];
    for (const brandId of tagBrands) {
      const brand = tree.brands.find((b) => b.brandId === brandId);
      if (!brand) continue;
      const set = tagColls[brandId];
      if (set && set.size > 0) {
        for (const c of brand.collections) {
          if (set.has(collKey(c))) tags.push(`${brand.brandName} — ${c.name}`);
        }
      } else {
        tags.push(brand.brandName);
      }
    }
    return tags;
  }

  // ---- Slanje ----
  async function handleSubmit() {
    setSubmitting(true);
    setResult(null);

    const collections: any[] = [];
    for (const brand of tree.brands) {
      for (const c of brand.collections) {
        const key = collKey(c);
        const cp = collPrices[key];
        const base = parseNum(cp?.base);
        const withVat = parseNum(cp?.withVat);

        const cs = colorStates[key] || {};
        const meta = colorsByColl[key] || [];
        const overrides: any[] = [];
        for (const slug of Object.keys(cs)) {
          const st = cs[slug];
          if (!st.unlocked) continue;
          const ob = parseNum(st.base);
          const ow = parseNum(st.withVat);
          if (ob == null && ow == null) continue;
          const m = meta.find((x) => x.slug === slug);
          overrides.push({ colorSlug: slug, colorCode: m?.code, colorName: m?.name, base: ob, withVat: ow });
        }

        if (base != null || withVat != null || overrides.length > 0) {
          collections.push({
            collectionSlug: c.slug,
            collectionName: c.name,
            categorySlug: c.categorySlug,
            categoryName: c.categoryName,
            brandId: c.brandId,
            brandName: brand.brandName,
            base,
            withVat,
            colorOverrides: overrides,
          });
        }
      }
    }

    const fd = new FormData();
    fd.append('payload', JSON.stringify({ vatRate: VAT_RATE, collections }));
    if (note.trim()) fd.append('note', note.trim());
    fd.append('tags', JSON.stringify(buildTags()));
    if (file) fd.append('file', file);

    try {
      const res = await fetch('/api/cenovnik/submit', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setResult({ ok: true, msg: 'Uspešno poslato na pregled. Hvala!' });
      } else {
        setResult({ ok: false, msg: data.error || 'Greška pri slanju.' });
      }
    } catch {
      setResult({ ok: false, msg: 'Greška u komunikaciji. Pokušajte ponovo.' });
    }
    setSubmitting(false);
  }

  async function handleLogout() {
    await fetch('/api/cenovnik/logout', { method: 'POST' }).catch(() => {});
    router.refresh();
  }

  return (
    <div className="container py-10 md:py-14">
      {/* Zaglavlje */}
      <div className="mb-6 flex items-start justify-between gap-4 border-b border-ink-200 pb-5">
        <div>
          <p className="eyebrow mb-2">Podovi</p>
          <h1 className="text-[28px] md:text-[34px]">Unos cena</h1>
        </div>
        <button type="button" onClick={handleLogout} className="btn-link mt-2 shrink-0">
          Odjava
        </button>
      </div>

      <div className="mb-8 border-l-2 border-ink-900 bg-paper px-4 py-3 text-[14px] text-ink-600">
        Ništa se ne objavljuje automatski. Sve što unesete stiže nama na pregled i odobravanje.
        PDV se računa automatski ({vatPercent}%).
      </div>

      {/* Sekcija: unos po kolekcijama */}
      <div className="mb-3 flex items-baseline justify-between">
        <p className="eyebrow">Unos po kolekcijama</p>
        <p className="text-[11px] text-ink-500">
          {tree.totalCollections} kolekcija · {tree.totalColors} boja
        </p>
      </div>

      <div className="mb-12 border-t border-ink-200">
        {tree.brands.map((brand) => {
          const open = expandedBrand[brand.brandId];
          return (
            <div key={brand.brandId} className="border-b border-ink-200">
              <button
                type="button"
                onClick={() => setExpandedBrand((s) => ({ ...s, [brand.brandId]: !s[brand.brandId] }))}
                className="flex w-full items-center justify-between py-4 text-left"
                aria-expanded={open}
              >
                <span className="text-[16px] text-ink-900">{brand.brandName}</span>
                <span className="flex items-center gap-3 text-[12px] text-ink-500">
                  {brand.collections.length} kolekcija
                  <span aria-hidden>{open ? '▾' : '▸'}</span>
                </span>
              </button>

              {open ? (
                <div className="pb-2">
                  {/* header kolona */}
                  <div className="hidden grid-cols-[1fr_130px_130px_36px] gap-3 border-b border-ink-200 pb-2 md:grid">
                    <span className="eyebrow">Kolekcija</span>
                    <span className="eyebrow text-right">Bez PDV-a</span>
                    <span className="eyebrow text-right">Sa PDV-om</span>
                    <span />
                  </div>

                  {brand.collections.map((c) => {
                    const key = collKey(c);
                    const cp = collPrices[key] || { base: '', withVat: '' };
                    const collOpen = expandedColl[key];
                    const colors = colorsByColl[key] || [];
                    return (
                      <div key={key} className="border-b border-ink-200 last:border-b-0">
                        <div className="grid grid-cols-[1fr_130px_130px_36px] items-center gap-3 py-3">
                          <div className="min-w-0">
                            <span className="block truncate text-[15px] text-ink-900">{c.name}</span>
                            <span className="text-[11px] text-ink-500">
                              {c.categoryName}
                              {c.colorCount > 0 ? ` · ${c.colorCount} boja` : ' · bez boja'}
                            </span>
                          </div>
                          <input
                            className="input text-right"
                            inputMode="decimal"
                            placeholder="0"
                            aria-label={`Cena bez PDV-a — ${c.name}`}
                            value={cp.base}
                            onChange={(e) => setCollBase(key, e.target.value)}
                          />
                          <input
                            className="input text-right"
                            inputMode="decimal"
                            placeholder="0"
                            aria-label={`Cena sa PDV-om — ${c.name}`}
                            value={cp.withVat}
                            onChange={(e) => setCollWithVat(key, e.target.value)}
                          />
                          <div className="text-right">
                            {c.colorCount > 0 ? (
                              <button
                                type="button"
                                onClick={() => toggleCollection(c)}
                                className="px-2 py-1 text-ink-500 hover:text-ink-900"
                                aria-label={collOpen ? 'Sakrij boje' : 'Prikaži boje'}
                                aria-expanded={collOpen}
                              >
                                {collOpen ? '▾' : '▸'}
                              </button>
                            ) : null}
                          </div>
                        </div>

                        {collOpen ? (
                          <div className="mb-3 bg-paper px-3 py-3">
                            <p className="mb-3 text-[11px] uppercase tracking-label text-ink-500">
                              Boje u kolekciji · štikliraj „posebna cena” da otključaš pojedinačnu
                            </p>

                            {loadingColors[key] ? (
                              <p className="py-2 text-[13px] text-ink-500">Učitavanje boja…</p>
                            ) : colorError[key] ? (
                              <p className="py-2 text-[13px] text-red-600">
                                Greška pri učitavanju boja.{' '}
                                <button
                                  type="button"
                                  onClick={() => loadColors(c)}
                                  className="underline hover:opacity-70"
                                >
                                  Pokušaj ponovo
                                </button>
                              </p>
                            ) : colors.length === 0 ? (
                              <p className="py-2 text-[13px] text-ink-500">Nema posebnih boja za ovu kolekciju.</p>
                            ) : (
                              <div>
                                {colors.map((color) => {
                                  const st = (colorStates[key] || {})[color.slug];
                                  const unlocked = Boolean(st?.unlocked);
                                  return (
                                    <div
                                      key={color.slug}
                                      className={`grid grid-cols-[22px_1fr_110px_110px] items-center gap-3 py-2 ${
                                        unlocked ? '' : 'opacity-40'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        className="h-4 w-4 accent-ink-900"
                                        checked={unlocked}
                                        onChange={() => toggleColorUnlock(key, color)}
                                        aria-label={`Posebna cena — ${color.code} ${color.name}`}
                                      />
                                      <span className="truncate text-[14px] text-ink-900">
                                        {color.code ? `${color.code} — ` : ''}
                                        {color.name}
                                        {unlocked ? (
                                          <span className="ml-2 text-[11px] text-ink-500">posebna cena</span>
                                        ) : null}
                                      </span>
                                      {unlocked ? (
                                        <>
                                          <input
                                            className="input text-right"
                                            inputMode="decimal"
                                            placeholder="bez PDV"
                                            aria-label={`Cena bez PDV-a — ${color.name}`}
                                            value={st?.base || ''}
                                            onChange={(e) => setColorBase(key, color.slug, e.target.value)}
                                          />
                                          <input
                                            className="input text-right"
                                            inputMode="decimal"
                                            placeholder="sa PDV"
                                            aria-label={`Cena sa PDV-om — ${color.name}`}
                                            value={st?.withVat || ''}
                                            onChange={(e) => setColorWithVat(key, color.slug, e.target.value)}
                                          />
                                        </>
                                      ) : (
                                        <>
                                          <span className="text-right text-[14px] text-ink-500">
                                            {formatNum(parseNum(cp.base)) || '—'}
                                          </span>
                                          <span className="text-right text-[14px] text-ink-500">
                                            {formatNum(parseNum(cp.withVat)) || '—'}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Sekcija: upload celog cenovnika */}
      <p className="eyebrow mb-4">Upload celog cenovnika</p>

      <label
        htmlFor="cenovnik-file"
        className="mb-4 flex cursor-pointer flex-col items-center justify-center border border-dashed border-ink-200 px-6 py-10 text-center text-[14px] text-ink-500 hover:border-ink-900"
      >
        {file ? (
          <span className="text-ink-900">{file.name}</span>
        ) : (
          <span>Klikni da izabereš PDF, Excel ili CSV fajl</span>
        )}
        <input
          id="cenovnik-file"
          type="file"
          accept=".pdf,.xls,.xlsx,.csv,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            if (f && f.size > 15 * 1024 * 1024) {
              setResult({ ok: false, msg: 'Fajl je prevelik (maksimum 15 MB).' });
              e.target.value = '';
              setFile(null);
              return;
            }
            setResult(null);
            setFile(f);
          }}
        />
      </label>

      <div className="mb-5">
        <label className="label" htmlFor="cenovnik-note">
          Za šta su ove cene? (opciono)
        </label>
        <textarea
          id="cenovnik-note"
          className="input resize-y"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <p className="mb-1 text-[11px] uppercase tracking-label text-ink-500">
        Označi na šta se odnosi (opciono)
      </p>
      <p className="mb-3 text-[13px] text-ink-500">
        Izaberi brend, pa kolekcije tog brenda. Možeš dodati više brendova.
      </p>

      <div className="mb-4 max-w-xs">
        <select
          aria-label="Dodaj brend"
          className="w-full border border-ink-200 bg-transparent px-3 py-2 text-[14px] text-ink-900 focus:border-ink-900 focus:outline-none"
          value=""
          onChange={(e) => {
            if (e.target.value) addTagBrand(e.target.value);
          }}
        >
          <option value="">+ Dodaj brend…</option>
          {tree.brands
            .filter((b) => !tagBrands.includes(b.brandId))
            .map((b) => (
              <option key={b.brandId} value={b.brandId}>
                {b.brandName}
              </option>
            ))}
        </select>
      </div>

      <div className="mb-10 space-y-3">
        {tagBrands.map((brandId) => {
          const brand = tree.brands.find((b) => b.brandId === brandId);
          if (!brand) return null;
          const set = tagColls[brandId] || new Set<string>();

          const byCat = new Map<string, typeof brand.collections>();
          for (const c of brand.collections) {
            const arr = byCat.get(c.categoryName) || [];
            arr.push(c);
            byCat.set(c.categoryName, arr);
          }

          return (
            <div key={brandId} className="border border-ink-200 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-[15px] text-ink-900">
                  {brand.brandName}
                  <span className="ml-2 text-[12px] text-ink-500">
                    {set.size > 0 ? `${set.size} kolekcija izabrano` : 'cele kolekcije brenda'}
                  </span>
                </span>
                <button type="button" onClick={() => removeTagBrand(brandId)} className="btn-link shrink-0">
                  Ukloni
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto pr-1">
                {Array.from(byCat.entries()).map(([cat, colls]) => (
                  <div key={cat} className="mb-3">
                    <p className="mb-2 text-[11px] uppercase tracking-label text-ink-500">{cat}</p>
                    <div className="flex flex-wrap gap-2">
                      {colls.map((c) => {
                        const ck = collKey(c);
                        const active = set.has(ck);
                        return (
                          <button
                            key={ck}
                            type="button"
                            onClick={() => toggleTagColl(brandId, ck)}
                            className={`border px-3 py-1 text-[12px] transition-colors ${
                              active
                                ? 'border-ink-900 bg-ink-900 text-white'
                                : 'border-ink-200 text-ink-600 hover:border-ink-900'
                            }`}
                          >
                            {c.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Akcije */}
      {result ? (
        <p
          role="alert"
          className={`mb-5 border px-4 py-3 text-sm ${
            result.ok
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-600'
          }`}
        >
          {result.msg}
        </p>
      ) : null}

      <div className="flex flex-col items-stretch justify-between gap-4 border-t border-ink-200 pt-6 sm:flex-row sm:items-center">
        <a href="/api/cenovnik/template" className="btn-secondary text-center">
          Preuzmi praznu tabelu
        </a>
        <button type="button" onClick={handleSubmit} className="btn-primary" disabled={submitting}>
          {submitting ? 'Slanje…' : 'Pošalji na pregled'}
        </button>
      </div>
    </div>
  );
}
