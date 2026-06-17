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

      <div className="relative mb-4 aspect-[1200/846] border border-ink-200 bg-paper">
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
