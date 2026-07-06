"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import PodoviWordmark from './PodoviWordmark';
import { useFavorites } from '@/lib/context/FavoritesContext';
import { useScrollLock } from './useScrollLock';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { count: favCount } = useFavorites();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Scroll lock dok je mobilni meni otvoren
  useScrollLock(mobileMenuOpen);

  // Escape + fokus dok je mobilni meni otvoren
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const menuButton = menuButtonRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    // Pri otvaranju fokus ide na prvi fokusabilni element u overlay-u
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Pri zatvaranju (Escape, link, dugme) fokus se vraća na trigger
      menuButton?.focus();
    };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 isolate border-b border-ink-200 bg-white">
      <nav className="mx-auto grid h-14 w-full max-w-[1536px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 md:h-[60px] lg:gap-8">
        {/* Logo */}
        <Link href="/" className="flex min-h-[44px] items-center">
          <PodoviWordmark textClassName="text-xl md:text-2xl text-ink-900" />
        </Link>

        <div className="hidden w-[590px] justify-center md:flex">
          <div className="w-full max-w-[590px]">
            <GlobalSearch variant="bar" />
          </div>
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center justify-end gap-5 md:flex">
          <Link
            href="/omiljeni"
            className={`relative flex min-h-[44px] min-w-[44px] items-center justify-center transition-colors duration-200 ${isActive('/omiljeni') ? 'text-ink-900' : 'text-ink-900 hover:text-ink-600'}`}
            title="Omiljeni proizvodi"
          >
            <Heart className="h-5 w-5" fill={isActive('/omiljeni') ? 'currentColor' : 'none'} strokeWidth={1.7} />
            {favCount > 0 && (
              <span className="absolute right-0 top-1 flex h-4 w-4 items-center justify-center bg-ink-900 text-[10px] font-medium text-white">
                {favCount > 9 ? '9+' : favCount}
              </span>
            )}
          </Link>

          <Link
            href="/upiti"
            className="inline-flex h-9 w-[176px] items-center justify-center rounded-[4px] bg-ink-900 text-[13px] font-semibold text-white transition-colors hover:bg-ink-700"
            aria-current={isActive('/upiti') ? 'page' : undefined}
          >
            Pošalji upit
          </Link>
        </div>

        {/* Mobile: search + menu trigger */}
        <div className="flex items-center gap-1 md:hidden">
          <GlobalSearch />
          <button
            ref={menuButtonRef}
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
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Mobilni meni"
          className="fixed inset-0 z-[60] flex flex-col bg-white md:hidden"
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
