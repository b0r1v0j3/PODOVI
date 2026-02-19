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

  const navLinkClass = (href: string) => {
    const active = isActive(href);
    return `text-[13px] font-medium tracking-wide transition-colors duration-200 
            focus:outline-none rounded-md px-3 py-2 ${active ? 'text-[#1d1d1f]' : 'text-[#424245] hover:text-[#1d1d1f]'
      }`;
  };

  const mobileNavLinkClass = (href: string) => {
    const active = isActive(href);
    return `block text-[17px] font-medium text-[#1d1d1f] hover:text-[#0066CC] transition-colors duration-200 py-3 border-b border-gray-100 last:border-0
            ${active ? 'text-[#0066CC]' : ''
      }`;
  };

  return (
    <header className="bg-white/70 backdrop-blur-xl shadow-sm sticky top-0 z-50 border-b border-white/20 transition-all duration-300 supports-[backdrop-filter]:bg-white/60">
      <nav className="container min-h-[48px] md:h-[52px] flex flex-wrap md:flex-nowrap items-center py-2 md:py-0">
        <div className="flex items-center justify-between w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center group mr-8">
            <span className="text-xl md:text-2xl font-semibold tracking-tight text-[#1d1d1f]">
              podovi
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={navLinkClass('/')}
              aria-current={isActive('/') ? 'page' : undefined}
            >
              Početna
            </Link>
            <Link
              href="/kategorije"
              className={navLinkClass('/kategorije')}
              aria-current={isActive('/kategorije') ? 'page' : undefined}
            >
              Kategorije
            </Link>
            <Link
              href="/brendovi"
              className={navLinkClass('/brendovi')}
              aria-current={isActive('/brendovi') ? 'page' : undefined}
            >
              Brendovi
            </Link>
            <Link
              href="/kontakt"
              className={navLinkClass('/kontakt')}
              aria-current={isActive('/kontakt') ? 'page' : undefined}
            >
              Kontakt
            </Link>

            {/* Global Search */}
            <GlobalSearch />

            {/* Favorites icon */}
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
          className={`w-full md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen
            ? 'max-h-[400px] opacity-100 mt-4 pb-4 border-t border-gray-100'
            : 'max-h-0 opacity-0'
            }`}
        >
          <div className="space-y-3">
            <Link
              href="/"
              className={mobileNavLinkClass('/')}
              aria-current={isActive('/') ? 'page' : undefined}
              onClick={() => setMobileMenuOpen(false)}
            >
              Početna
            </Link>
            <Link
              href="/kategorije"
              className={mobileNavLinkClass('/kategorije')}
              aria-current={isActive('/kategorije') ? 'page' : undefined}
              onClick={() => setMobileMenuOpen(false)}
            >
              Kategorije
            </Link>
            <Link
              href="/brendovi"
              className={mobileNavLinkClass('/brendovi')}
              aria-current={isActive('/brendovi') ? 'page' : undefined}
              onClick={() => setMobileMenuOpen(false)}
            >
              Brendovi
            </Link>
            <Link
              href="/kontakt"
              className={mobileNavLinkClass('/kontakt')}
              aria-current={isActive('/kontakt') ? 'page' : undefined}
              onClick={() => setMobileMenuOpen(false)}
            >
              Kontakt
            </Link>
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
