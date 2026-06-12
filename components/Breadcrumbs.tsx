import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  variant?: 'light' | 'dark';
}

export default function Breadcrumbs({ items, variant = 'light' }: BreadcrumbsProps) {
  const isDark = variant === 'dark';

  const linkClass = isDark
    ? 'text-white/60 transition-colors hover:text-white'
    : 'text-ink-500 transition-colors hover:text-ink-900';
  const currentClass = isDark ? 'text-white' : 'text-ink-900';
  const separatorClass = isDark ? 'text-white/40' : 'text-ink-400';

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
        <li>
          <Link href="/" className={linkClass}>
            Početna
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-x-2">
              <span className={separatorClass} aria-hidden="true">/</span>

              {isLast || !item.href ? (
                <span className={currentClass} aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
