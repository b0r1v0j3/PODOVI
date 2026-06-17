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
