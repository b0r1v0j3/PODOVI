// components/configurator/ConfiguratorStep.tsx
'use client';

import Image from 'next/image';
import type { EssenceOption } from '@/lib/configurator/types';

interface ConfiguratorStepProps {
  label: string;
  items: EssenceOption[];
  selectedCode: string | null;
  onSelect: (option: EssenceOption) => void;
  // 'pattern' = landscape tile, cela slika vidljiva (bele konture oblika parketa);
  // 'swatch' = kvadrat (boje/gradacije/obrade).
  variant?: 'pattern' | 'swatch';
}

export default function ConfiguratorStep({ label, items, selectedCode, onSelect, variant = 'swatch' }: ConfiguratorStepProps) {
  const isPattern = variant === 'pattern';
  const gridClass = isPattern
    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';
  // Uzorci: pločica istog odnosa kao slika (1200x846) + object-cover → popunjava bez crnih ivica, kontura ostaje.
  const tileClass = isPattern ? 'aspect-[1200/846] bg-ink-900' : 'aspect-square bg-paper';
  const fitClass = 'object-cover';
  const emptyTextClass = isPattern ? 'text-white/60' : 'text-ink-500';

  return (
    <div>
      <p className="mb-4 text-[13px] text-ink-600">
        <span className="font-medium text-ink-900">Izaberite {label.toLowerCase()}</span> · {items.length} opcija
      </p>
      <div className={`grid gap-3 ${gridClass}`}>
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
              <div className={`relative overflow-hidden border border-ink-200 ${tileClass}`}>
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className={fitClass}
                  />
                ) : (
                  <span className={`flex h-full items-center justify-center px-2 text-center text-[12px] ${emptyTextClass}`}>
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
