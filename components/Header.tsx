"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import GlobalSearch from './GlobalSearch';
import PodoviWordmark from './PodoviWordmark';
import { useFavorites } from '@/lib/context/FavoritesContext';
import { useScrollLock } from './useScrollLock';
import { OPEN_HOME_FILTERS_EVENT } from '@/lib/catalog/home-filter-events';
import { useCommerce } from '@/lib/context/CommerceContext';
import { FiShoppingBag, FiUser } from 'react-icons/fi';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { count: favCount } = useFavorites();
  const { count: cartCount, customer } = useCommerce();
  const isHomepage = pathname === '/';
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const handleMobileAction = () => {
    if (isHomepage) {
      window.dispatchEvent(new Event(OPEN_HOME_FILTERS_EVENT));
      return;
    }

    setMobileMenuOpen(true);
  };

  // Scroll lock dok je mobilni meni otvoren
  useScrollLock(mobileMenuOpen);

  // Escape + fokus dok je mobilni meni otvoren
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const menuButton = menuButtonRef.current;
    const desktopMediaQuery = window.matchMedia('(min-width: 1024px)');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    const handleDesktopResize = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    desktopMediaQuery.addEventListener('change', handleDesktopResize);

    // Pri otvaranju fokus ide na prvi fokusabilni element u overlay-u
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      desktopMediaQuery.removeEventListener('change', handleDesktopResize);
      // Pri zatvaranju (Escape, link, dugme) fokus se vraća na trigger
      menuButton?.focus();
    };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 isolate border-b border-ink-200 bg-white">
      <nav className="mx-auto grid h-14 w-full max-w-[1536px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 md:h-[60px] lg:grid-cols-[auto_minmax(180px,1fr)_auto] lg:gap-6 lg:px-6">
        {/* Logo */}
        <Link href="/" className="flex min-h-[44px] items-center">
          <PodoviWordmark textClassName="text-xl md:text-2xl text-ink-900" />
        </Link>

        <div className="hidden w-full justify-center lg:flex">
          <div className="w-full max-w-[590px]">
            <GlobalSearch variant="bar" />
          </div>
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center justify-end gap-3 lg:flex">
          <Link href="/nalog" aria-current={isActive('/nalog') ? 'page' : undefined} className="flex min-h-[44px] items-center gap-2 text-xs text-ink-900"><FiUser size={18} aria-hidden="true" />Nalog{customer ? ` · ${customer.discountPercent}%` : ''}</Link>
          <Link href="/korpa" aria-current={isActive('/korpa') ? 'page' : undefined} className="flex min-h-[44px] items-center gap-2 text-xs text-ink-900"><FiShoppingBag size={18} aria-hidden="true" />Korpa ({cartCount})</Link>
          <Link
            href="/omiljeni"
            className={`relative flex min-h-[44px] min-w-[44px] items-center justify-center transition-colors duration-200 ${isActive('/omiljeni') ? 'text-ink-900' : 'text-ink-900 hover:text-ink-600'}`}
            title="Omiljeni proizvodi"
          >
            <svg className="h-5 w-5" fill={isActive('/omiljeni') ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.3 6.3a4.5 4.5 0 0 1 6.4 0L12 7.6l1.3-1.3a4.5 4.5 0 1 1 6.4 6.4L12 20.4l-7.7-7.7a4.5 4.5 0 0 1 0-6.4Z" />
            </svg>
            {favCount > 0 && (
              <span className="absolute right-0 top-1 flex h-4 w-4 items-center justify-center bg-ink-900 text-[10px] font-medium text-white">
                {favCount > 9 ? '9+' : favCount}
              </span>
            )}
          </Link>

          <Link
            href="/upiti"
            className="inline-flex h-11 px-4 items-center justify-center bg-ink-900 text-[13px] font-semibold text-white transition-colors hover:bg-ink-700"
            aria-current={isActive('/upiti') ? 'page' : undefined}
          >
            Pošalji upit
          </Link>
        </div>

        {/* Mobile: pravo search polje u sredini */}
        <div className="min-w-0 lg:hidden">
          <GlobalSearch variant="inline" />
        </div>

        {/* Na početnoj je desna akcija filter; drugde ostaje navigacioni meni. */}
        <div className="flex justify-end lg:hidden">
          <button
            ref={menuButtonRef}
            type="button"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-ink-900 transition-colors duration-200 hover:text-ink-600"
            onClick={handleMobileAction}
            aria-label={isHomepage ? 'Otvori filtere' : 'Otvori meni'}
            aria-haspopup="dialog"
            aria-expanded={isHomepage ? undefined : mobileMenuOpen}
            aria-controls={isHomepage ? 'home-filter-drawer' : 'mobile-menu'}
            data-testid={isHomepage ? 'home-filters-trigger' : undefined}
          >
            {isHomepage ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      <nav aria-label="Nalog i korpa" className="flex items-center justify-end gap-5 border-t border-ink-100 px-4 lg:hidden">
        <Link href="/nalog" className="flex min-h-[44px] items-center gap-2 text-xs"><FiUser aria-hidden="true" />Nalog{customer ? ` · ${customer.discountPercent}%` : ''}</Link>
        <Link href="/korpa" className="flex min-h-[44px] items-center gap-2 text-xs"><FiShoppingBag aria-hidden="true" />Korpa ({cartCount})</Link>
      </nav>

      {/* Mobile full-screen menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Mobilni meni"
          className="fixed inset-0 z-[60] flex flex-col bg-white lg:hidden"
        >
          <div className="border-b border-ink-200">
            <div className="container flex h-14 items-center justify-between">
              <Link href="/" onClick={closeMobileMenu} className="flex min-h-[44px] items-center">
                <PodoviWordmark textClassName="text-xl text-ink-900" />
              </Link>
              <button
                ref={closeButtonRef}
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
            <Link href="/nalog" onClick={closeMobileMenu} className="flex min-h-[44px] items-center border-b border-ink-200 py-5 text-[26px] text-ink-900">Moj nalog</Link>
            <Link href="/korpa" onClick={closeMobileMenu} className="flex min-h-[44px] items-center justify-between border-b border-ink-200 py-5 text-[26px] text-ink-900">Korpa <span className="text-sm">({cartCount})</span></Link>
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
