// components/configurator/EssenceInfo.tsx
// Kompletne info-sekcije Essence stranice (ispod konfiguratora). Server komponenta — statičan sadržaj.
import Image from 'next/image';
import {
  ESSENCE_INTRO,
  ESSENCE_FAMILIES,
  ESSENCE_SPECS_COMMON,
  ESSENCE_GRADES,
  ESSENCE_FINISHES,
  ESSENCE_WOODS,
  ESSENCE_CARE,
  ESSENCE_ADVANTAGES,
  ESSENCE_DOCUMENTS,
} from '@/lib/data/essence-content';
import { ESSENCE_GRADATIONS, ESSENCE_SURFACES } from '@/lib/data/essence-configurator-axes';

function imageFor(name: string, list: { name: string; image: string | null }[]): string | null {
  return list.find((x) => x.name === name)?.image || null;
}

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-ink-200 pt-12 mt-12">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-normal tracking-tight text-ink-900 sm:text-3xl">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function VisualCards({ items, images }: { items: { name: string; description: string }[]; images: { name: string; image: string | null }[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => {
        const img = imageFor(it.name, images);
        return (
          <div key={it.name} className="border border-ink-200">
            <div className="relative aspect-[4/3] bg-paper">
              {img && <Image src={img} alt={it.name} fill sizes="(max-width:768px) 100vw, 25vw" className="object-cover" />}
            </div>
            <div className="p-4">
              <div className="text-[15px] font-medium text-ink-900">{it.name}</div>
              <p className="mt-1.5 text-[13px] leading-6 text-ink-600">{it.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SpecTable({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className="max-w-3xl border-t border-ink-200">
      {rows.map((r) => (
        <div key={r.label} className="flex flex-col gap-1 border-b border-ink-200 py-3 sm:flex-row sm:justify-between sm:gap-6">
          <dt className="text-[13px] text-ink-500">{r.label}</dt>
          <dd className="text-[14px] font-medium text-ink-900 sm:text-right">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function EssenceInfo() {
  const docsByPattern = ESSENCE_DOCUMENTS.reduce<Record<string, typeof ESSENCE_DOCUMENTS>>((acc, d) => {
    (acc[d.pattern] = acc[d.pattern] || []).push(d);
    return acc;
  }, {});

  return (
    <div className="mt-4">
      {/* O kolekciji */}
      <Section eyebrow="O kolekciji" title="Tri familije, beskrajne kombinacije">
        <p className="max-w-3xl text-[15px] leading-7 text-ink-600">{ESSENCE_INTRO}</p>
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
          {ESSENCE_FAMILIES.map((f) => (
            <div key={f.name} className="border border-ink-200 p-5">
              <div className="text-[17px] font-medium text-ink-900">{f.name}</div>
              <div className="mt-0.5 text-[12px] uppercase tracking-label text-ink-400">{f.patterns}</div>
              <p className="mt-3 text-[13px] leading-6 text-ink-600">{f.description}</p>
              <p className="mt-3 text-[12px] leading-5 text-ink-500">{f.format}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Specifikacije */}
      <Section eyebrow="Tehnički podaci" title="Specifikacije">
        <SpecTable rows={ESSENCE_SPECS_COMMON} />
        <p className="mt-3 max-w-3xl text-[12px] leading-5 text-ink-500">
          Tačne dimenzije i gradacije razlikuju se po uzorku i vrsti drveta — pogledajte tehničke listove u sekciji Dokumenti.
        </p>
      </Section>

      {/* Gradacije */}
      <Section eyebrow="Izgled drveta" title="Gradacije">
        <VisualCards items={ESSENCE_GRADES} images={ESSENCE_GRADATIONS} />
      </Section>

      {/* Površinske obrade */}
      <Section eyebrow="Tekstura površine" title="Površinske obrade">
        <VisualCards items={ESSENCE_FINISHES} images={ESSENCE_SURFACES} />
      </Section>

      {/* Vrste drveta */}
      <Section eyebrow="Materijal" title="Vrste drveta">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {ESSENCE_WOODS.map((w) => (
            <div key={w.name} className="border border-ink-200 p-5">
              <div className="text-[15px] font-medium text-ink-900">{w.name}</div>
              <p className="mt-1.5 text-[13px] leading-6 text-ink-600">{w.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Skladištenje i nega */}
      <Section eyebrow="Preporuke" title="Skladištenje i održavanje">
        <SpecTable rows={ESSENCE_CARE} />
      </Section>

      {/* Prednosti */}
      <Section eyebrow="Zašto Essence" title="Prednosti">
        <ul className="max-w-3xl">
          {ESSENCE_ADVANTAGES.map((a) => (
            <li key={a} className="flex gap-3 border-b border-ink-200 py-3 text-[14px] text-ink-700">
              <span aria-hidden="true" className="text-ink-900">—</span>
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Dokumenti */}
      <Section eyebrow="Za preuzimanje" title="Dokumenti — tehnički listovi">
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
          {Object.entries(docsByPattern).map(([pattern, docs]) => (
            <div key={pattern} className="border-b border-ink-200 pb-4">
              <div className="text-[14px] font-medium text-ink-900">{pattern}</div>
              <div className="mt-2 flex flex-col gap-1.5">
                {docs.map((d) => (
                  <a
                    key={d.url}
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-baseline justify-between gap-4 text-[13px] text-ink-600 hover:text-ink-900"
                  >
                    <span className="border-b border-transparent group-hover:border-ink-900">
                      Preuzmi PDF · {d.wood}
                    </span>
                    {d.size && <span className="text-[12px] text-ink-400">{d.size}</span>}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
