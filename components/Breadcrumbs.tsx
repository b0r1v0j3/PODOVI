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

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center space-x-2 text-sm">
        <li>
          <Link
            href="/"
            className={`transition-colors
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-sm ${isDark
                ? 'text-gray-300 hover:text-white'
                : 'text-gray-600 hover:text-primary-700'
              }`}
          >
            Početna
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center space-x-2">
              <svg
                className={`h-4 w-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>

              {isLast || !item.href ? (
                <span
                  className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={`transition-colors
                             focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-sm ${isDark
                      ? 'text-gray-300 hover:text-white'
                      : 'text-gray-600 hover:text-primary-700'
                    }`}
                >
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

