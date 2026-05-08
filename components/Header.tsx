"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import GlobalSearch from './GlobalSearch';
import { useFavorites } from '@/lib/context/FavoritesContext';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { count: favCount } = useFavorites();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const mobileNavLinkClass = (href: string) => {
    const active = isActive(href);
    return `block text-[17px] font-medium text-[#1d1d1f] hover:text-[#0066CC] transition-colors duration-200 py-3 border-b border-gray-100 last:border-0
            ${active ? 'text-[#0066CC]' : ''
      }`;
  };

  return (
    <header className="sticky top-0 z-50 isolate bg-white transition-colors duration-200">
      <nav className="container min-h-[44px] md:h-[48px] flex flex-wrap md:flex-nowrap items-center justify-between">
        <div className="flex items-center justify-between w-full h-[44px] md:h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center group md:w-[190px] lg:w-[220px] md:flex-shrink-0">
            <span className="text-xl md:text-2xl font-semibold tracking-tighter text-[#1D1D1F]">
              podovi
            </span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 justify-center px-4 lg:px-8">
            <GlobalSearch />
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center justify-end gap-4 lg:gap-5 md:w-[190px] lg:w-[220px] md:flex-shrink-0">
            <Link
              href="/omiljeni"
              className={`relative p-2 rounded-md transition-colors duration-200 hover:text-red-500 ${isActive('/omiljeni') ? 'text-red-500' : 'text-gray-600'}`}
              title="Omiljeni proizvodi"
            >
              <svg className="w-5 h-5" fill={isActive('/omiljeni') ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {favCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {favCount > 9 ? '9+' : favCount}
                </span>
              )}
            </Link>

            <Link
              href="/upiti"
              className={`btn-primary px-4 py-1.5 text-xs rounded-full ${isActive('/upiti') ? '' : ''}`}
              aria-current={isActive('/upiti') ? 'page' : undefined}
            >
              Pošalji upit
            </Link>
          </div>

          {/* Mobile: search + menu */}
          <div className="md:hidden flex items-center gap-1">
            <GlobalSearch />
            <button
              type="button"
              className="p-2 text-gray-800 hover:text-primary-700 transition-colors
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Zatvori meni" : "Otvori meni"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          id="mobile-menu"
          className={`w-full md:hidden overflow-hidden bg-white transition-all duration-300 ease-in-out ${mobileMenuOpen
            ? 'max-h-[220px] opacity-100 pb-4 border-t border-gray-100'
            : 'max-h-0 opacity-0'
            }`}
        >
          <div className="space-y-3">
            <Link
              href="/omiljeni"
              className={mobileNavLinkClass('/omiljeni')}
              aria-current={isActive('/omiljeni') ? 'page' : undefined}
              onClick={() => setMobileMenuOpen(false)}
            >
              ❤️ Omiljeni {favCount > 0 && `(${favCount})`}
            </Link>
            <Link
              href="/upiti"
              className="block btn-primary text-center focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-current={isActive('/upiti') ? 'page' : undefined}
              onClick={() => setMobileMenuOpen(false)}
            >
              Pošalji upit
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
