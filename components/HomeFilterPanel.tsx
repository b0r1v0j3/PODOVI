'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { getVisibleFilterOptions } from '@/lib/catalog/home-filter-utils';
import {
  formatHomeNumber,
  type HomeEngineGroup,
  type HomeEngineOption,
  type HomeRangeSelection,
} from '@/lib/catalog/home-filter-engine';

/**
 * Panel filtera početne strane — ISTI JSX za desktop <aside> i mobilnu fioku.
 * Grupe, opcije, brojači i onemogućene opcije dolaze gotovi iz
 * lib/catalog/home-filter-engine.ts; panel samo prikazuje i javlja klikove.
 */

export function CheckIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 8.2 6.4 11 12.5 5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 6 8 10 12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m21 21-4.2-4.2M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FilterButton({
  active,
  label,
  count,
  onClick,
  disabled = false,
  radio = false,
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
  disabled?: boolean;
  /** Prečica opsega (jedan izbor u grupi) — za čitače ekrana radio umesto prekidača. */
  radio?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-11 w-full items-center gap-2.5 py-2 text-left text-[12px] leading-5 transition-colors lg:min-h-0 lg:py-0.5 ${
        disabled ? 'cursor-not-allowed text-ink-700 opacity-50' : 'text-ink-700 hover:text-ink-900'
      }`}
      {...(radio ? { role: 'radio', 'aria-checked': active } : { 'aria-pressed': active })}
    >
      <span
        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center border ${
          active ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 bg-white'
        }`}
        aria-hidden="true"
      >
        {active ? <CheckIcon className="h-2.5 w-2.5" /> : null}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {typeof count === 'number' ? (
        <span className="text-[12px] tabular-nums text-ink-400">{count}</span>
      ) : null}
    </button>
  );
}

export function FilterSection({
  title,
  children,
  defaultOpen = true,
  selectedCount = 0,
  note,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  selectedCount?: number;
  note?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen || selectedCount > 0);

  // Izbor koji stigne kasnije (link, čip) otvara sklopljenu grupu.
  useEffect(() => {
    if (selectedCount > 0) setIsOpen(true);
  }, [selectedCount]);

  return (
    <div className="border-t border-ink-200 py-3 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="mb-2 flex min-h-11 w-full items-center justify-between gap-3 text-left lg:min-h-0"
        aria-expanded={isOpen}
      >
        <span className="text-[11px] font-semibold uppercase tracking-label text-ink-700">
          {title}
          {selectedCount > 0 ? <span className="ml-1.5 text-ink-900">· {selectedCount}</span> : null}
        </span>
        <ChevronDownIcon className={`h-3.5 w-3.5 shrink-0 text-ink-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && note ? <p className="-mt-1 mb-2 text-[11px] leading-4 text-ink-500">{note}</p> : null}
      {isOpen ? children : null}
    </div>
  );
}

export function ExpandableFilterOptions({
  options,
  selectedValues,
  renderOption,
  limit = 8,
  forceExpanded = false,
}: {
  options: HomeEngineOption[];
  selectedValues: string[];
  renderOption: (option: HomeEngineOption) => ReactNode;
  limit?: number;
  forceExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleOptions = getVisibleFilterOptions(options, selectedValues, expanded || forceExpanded, limit);
  const hiddenCount = Math.max(options.length - visibleOptions.length, 0);
  const canToggle = !forceExpanded && options.length > limit;

  return (
    <>
      <div className="space-y-0.5">
        {visibleOptions.map(renderOption)}
      </div>
      {canToggle ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-2 min-h-11 text-left text-[12px] font-semibold text-ink-800 underline-offset-4 hover:underline lg:min-h-0"
        >
          {expanded ? 'Prikaži manje' : `Prikaži još (${hiddenCount})`}
        </button>
      ) : null}
    </>
  );
}

export function SearchableFilterOptions({
  options,
  selectedValues,
  renderOption,
  placeholder,
}: {
  options: HomeEngineOption[];
  selectedValues: string[];
  renderOption: (option: HomeEngineOption) => ReactNode;
  placeholder: string;
}) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const matchingOptions = normalizedQuery
    ? options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
    : options;

  return (
    <>
      {options.length > 12 ? (
        <label className="mb-2 flex h-11 items-center gap-2 border border-ink-200 px-3 text-ink-500 lg:h-8 lg:px-2">
          <SearchIcon className="h-3.5 w-3.5" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-[12px] text-ink-900 outline-none placeholder:text-ink-400"
          />
        </label>
      ) : null}
      {matchingOptions.length > 0 ? (
        <ExpandableFilterOptions
          options={matchingOptions}
          selectedValues={selectedValues}
          renderOption={renderOption}
          forceExpanded={Boolean(normalizedQuery)}
        />
      ) : (
        <p className="py-2 text-[12px] text-ink-500">Nema odgovarajućih opcija.</p>
      )}
    </>
  );
}

function parseInputNumber(value: string): number | null {
  const normalized = value.replace(',', '.').trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function RangeFilter({
  group,
  onRangeChange,
}: {
  group: HomeEngineGroup;
  onRangeChange: (groupId: string, range: HomeRangeSelection | null) => void;
}) {
  const range = group.range!;
  const unit = group.entry.unit || '';
  const groupId = group.entry.id;
  const [minText, setMinText] = useState(range.selected?.[0] != null ? String(range.selected[0]) : '');
  const [maxText, setMaxText] = useState(range.selected?.[1] != null ? String(range.selected[1]) : '');

  // Spoljna promena (prečica, čip, Nazad) osvežava polja.
  const selectedKey = range.selected ? `${range.selected[0]}|${range.selected[1]}` : '';
  useEffect(() => {
    setMinText(range.selected?.[0] != null ? String(range.selected[0]) : '');
    setMaxText(range.selected?.[1] != null ? String(range.selected[1]) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);

  const commit = (nextMinText = minText, nextMaxText = maxText) => {
    let min = parseInputNumber(nextMinText);
    let max = parseInputNumber(nextMaxText);
    if (min !== null && max !== null && min > max) [min, max] = [max, min];
    onRangeChange(groupId, min === null && max === null ? null : [min, max]);
  };

  return (
    <div>
      {range.presets.length > 0 ? (
        <div className="mb-2 space-y-0.5">
          {range.presets.map((preset) => (
            <FilterButton
              key={preset.label}
              radio
              active={preset.selected}
              label={preset.label}
              count={preset.count}
              disabled={preset.count === 0 && !preset.selected}
              onClick={() => onRangeChange(groupId, preset.selected ? null : [preset.min ?? null, preset.max ?? null])}
            />
          ))}
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-2 pb-1 pt-1">
        {(['min', 'max'] as const).map((side) => (
          <label key={side} className="text-[11px] text-ink-500">
            <span>{side === 'min' ? 'Od' : 'Do'}</span>
            <div className="mt-1 flex h-11 items-center border border-ink-200 px-3 lg:h-8 lg:px-2">
              <input
                type="text"
                inputMode="decimal"
                value={side === 'min' ? minText : maxText}
                placeholder={formatHomeNumber(side === 'min' ? range.bounds[0] : range.bounds[1])}
                onChange={(event) => (side === 'min' ? setMinText(event.target.value) : setMaxText(event.target.value))}
                onBlur={() => commit()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    commit();
                  }
                }}
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[12px] text-ink-900 outline-none placeholder:text-ink-400"
                aria-label={`${group.title} — ${side === 'min' ? 'najmanje' : 'najviše'} (${unit})`}
              />
              <span className="text-[11px] text-ink-400">{unit}</span>
            </div>
          </label>
        ))}
      </div>
      {range.selected ? (
        <p className="mt-1 text-[11px] text-ink-500">
          {range.count} u opsegu ·{' '}
          <button type="button" onClick={() => onRangeChange(groupId, null)} className="font-semibold text-ink-800 underline-offset-4 hover:underline">
            Poništi
          </button>
        </p>
      ) : null}
    </div>
  );
}

export interface HomeFilterPanelProps {
  groups: HomeEngineGroup[];
  onToggle: (groupId: string, value: string) => void;
  onRangeChange: (groupId: string, range: HomeRangeSelection | null) => void;
}

export default function HomeFilterPanel({ groups, onToggle, onRangeChange }: HomeFilterPanelProps) {
  return (
    <>
      {groups.map((group) => {
        const { entry } = group;
        const selectedValues = group.options?.filter((option) => option.selected).map((option) => option.value) || [];
        const renderOption = (option: HomeEngineOption) => (
          <FilterButton
            key={option.value}
            active={option.selected}
            label={option.label}
            count={option.count}
            disabled={option.disabled}
            onClick={() => onToggle(entry.id, option.value)}
          />
        );

        return (
          <FilterSection
            key={entry.id}
            title={group.title}
            defaultOpen={!entry.collapsed}
            selectedCount={group.selectedCount}
            note={entry.note}
          >
            {group.range ? (
              <RangeFilter group={group} onRangeChange={onRangeChange} />
            ) : entry.searchable ? (
              <SearchableFilterOptions
                options={group.options || []}
                selectedValues={selectedValues}
                placeholder={`Pretraži: ${group.title.toLowerCase()}`}
                renderOption={renderOption}
              />
            ) : (
              <ExpandableFilterOptions
                options={group.options || []}
                selectedValues={selectedValues}
                renderOption={renderOption}
              />
            )}
          </FilterSection>
        );
      })}
    </>
  );
}
