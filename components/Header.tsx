"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const navLinkClass = (href: string) => {
    const active = isActive(href);
    return `text-gray-800 hover:text-primary-700 transition-all duration-200 
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-sm px-2 py-1 ${
              active ? 'text-primary-700 ring-2 ring-primary-600 ring-offset-2' : ''
            }`;
  };

  const mobileNavLinkClass = (href: string) => {
    const active = isActive(href);
    return `block text-gray-800 hover:text-primary-700 transition-colors duration-200 py-2
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-sm ${
              active ? 'text-primary-700 font-semibold' : ''
            }`;
  };

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100 transition-all duration-300">
      <nav className="container py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <div className="relative">
              <div className="text-2xl md:text-3xl font-bold lowercase tracking-tight">
                <span className="text-gray-900 relative inline-block pb-2">
                  podovi
                  <div className="absolute -bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 
                                  transform origin-center transition-transform duration-300 group-hover:scale-x-110 rounded-full"></div>
                </span>
              </div>
              {/* Subtle shadow effect */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-primary-600/20 blur-sm"></div>
            </div>
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
            <Link 
              href="/upiti" 
              className={`btn-primary focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                isActive('/upiti') ? 'ring-2 ring-primary-600 ring-offset-2' : ''
              }`}
              aria-current={isActive('/upiti') ? 'page' : undefined}
            >
              Pošalji upit
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 text-gray-800 hover:text-primary-700 transition-colors
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

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div 
            id="mobile-menu" 
            className="md:hidden mt-4 pb-4 space-y-3 animate-fadeIn"
          >
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
              href="/upiti" 
              className="block btn-primary text-center focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-current={isActive('/upiti') ? 'page' : undefined}
              onClick={() => setMobileMenuOpen(false)}
            >
              Pošalji upit
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
