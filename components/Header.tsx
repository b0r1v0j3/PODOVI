"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import GlobalSearch from './GlobalSearch';
import PodoviWordmark from './PodoviWordmark';
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

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 isolate border-b border-ink-200 bg-white">
      <nav className="container flex h-14 items-center justify-between md:h-16">
        {/* Logo */}
        <Link href="/" className="flex min-h-[44px] items-center">
          <PodoviWordmark textClassName="text-xl md:text-2xl text-ink-900" />
        </Link>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex lg:gap-4">
          <GlobalSearch />

          <Link
            href="/omiljeni"
            className={`relative flex min-h-[44px] min-w-[44px] items-center justify-center transition-colors duration-200 ${isActive('/omiljeni') ? 'text-ink-900' : 'text-ink-600 hover:text-ink-900'}`}
            title="Omiljeni proizvodi"
          >
            <svg className="h-5 w-5" fill={isActive('/omiljeni') ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {favCount > 0 && (
              <span className="absolute right-0 top-1 flex h-4 w-4 items-center justify-center bg-ink-900 text-[10px] font-medium text-white">
                {favCount > 9 ? '9+' : favCount}
              </span>
            )}
          </Link>

          <Link
            href="/upiti"
            className="btn-primary px-5 py-2"
            aria-current={isActive('/upiti') ? 'page' : undefined}
          >
            Pošalji upit
          </Link>
        </div>

        {/* Mobile: search + menu trigger */}
        <div className="flex items-center gap-1 md:hidden">
          <GlobalSearch />
          <button
            type="button"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-ink-900 transition-colors duration-200 hover:text-ink-600"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Otvori meni"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile full-screen menu */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="fixed inset-0 z-[60] flex flex-col bg-white md:hidden">
          <div className="border-b border-ink-200">
            <div className="container flex h-14 items-center justify-between">
              <Link href="/" onClick={closeMobileMenu} className="flex min-h-[44px] items-center">
                <PodoviWordmark textClassName="text-xl text-ink-900" />
              </Link>
              <button
                type="button"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center text-ink-900 transition-colors duration-200 hover:text-ink-600"
                onClick={closeMobileMenu}
                aria-label="Zatvori meni"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <nav className="container flex flex-1 flex-col justify-center" aria-label="Mobilna navigacija">
            <Link
              href="/omiljeni"
              className="flex min-h-[44px] items-center justify-between border-b border-ink-200 py-6 text-[26px] font-normal text-ink-900"
              aria-current={isActive('/omiljeni') ? 'page' : undefined}
              onClick={closeMobileMenu}
            >
              <span>Omiljeni</span>
              {favCount > 0 && <span className="text-[13px] text-ink-500">({favCount})</span>}
            </Link>
            <Link
              href="/upiti"
              className="flex min-h-[44px] items-center justify-between py-6 text-[26px] font-normal text-ink-900"
              aria-current={isActive('/upiti') ? 'page' : undefined}
              onClick={closeMobileMenu}
            >
              <span>Pošalji upit</span>
              <span aria-hidden="true">→</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
