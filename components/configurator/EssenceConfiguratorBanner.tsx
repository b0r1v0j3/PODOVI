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
