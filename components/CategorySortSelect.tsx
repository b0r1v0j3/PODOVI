'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { CategorySortMode } from '@/components/CategoryToolbar';

interface CategorySortSelectProps {
  sortMode: CategorySortMode;
  hasPriceSort: boolean;
}

/**
 * Minimalan "Sortiraj:" select u toolbar redu kategorije (stil kao select u
 * HomeProductTabs). Menja SAMO ?sort= parametar — svi aktivni filteri ostaju.
 * 'preporuceno' je default pa se tada parametar briše iz URL-a.
 */
export default function CategorySortSelect({ sortMode, hasPriceSort }: CategorySortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'preporuceno') {
      params.delete('sort');
    } else {
      params.set('sort', value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <label className="flex items-center gap-2 text-[12px] text-ink-500">
      <span>Sortiraj:</span>
      <select
        value={sortMode}
        onChange={(event) => handleChange(event.target.value)}
        className="h-9 border border-ink-200 bg-white px-3 text-[12px] text-ink-900 outline-none transition-colors focus:border-ink-900"
      >
        <option value="preporuceno">Preporučeno</option>
        <option value="naziv">Naziv</option>
        {hasPriceSort && <option value="cena">Cena</option>}
        <option value="najnovije">Najnovije</option>
      </select>
    </label>
  );
}
