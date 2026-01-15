import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center space-x-2 text-sm">
        <li>
          <Link
            href="/"
            className="text-gray-600 hover:text-primary-700 transition-colors
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-sm"
          >
            Početna
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center space-x-2">
              <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
              
              {isLast || !item.href ? (
                <span
                  className="text-gray-900 font-medium"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-gray-600 hover:text-primary-700 transition-colors
                             focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-sm"
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
