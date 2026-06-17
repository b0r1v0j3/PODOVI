// app/parket/essence/page.tsx
import { Metadata } from 'next';
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
