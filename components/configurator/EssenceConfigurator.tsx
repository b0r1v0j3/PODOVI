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
