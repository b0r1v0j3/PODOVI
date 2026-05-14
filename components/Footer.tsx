import PodoviWordmark from './PodoviWordmark';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-[#111111] text-[#C7C7C7]">
      <div className="h-px bg-white/10" />

      <div>
        <div className="container py-12 md:py-14">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,560px)_minmax(280px,360px)] md:justify-between md:gap-14">
            {/* About + Branding */}
            <div>
              {/* Logo matching header style */}
              <div className="mb-4">
                <PodoviWordmark textClassName="text-2xl text-white" lineClassName="h-[2px]" />
              </div>
              <p className="text-sm leading-7 text-white/55">
                Pažljivo biramo podne obloge i prateći asortiman za domove, lokale i projekte.
                Pomažemo vam da uporedite materijale, nijanse i tehnička rešenja, kako bi izbor poda bio jednostavan,
                siguran i usklađen sa prostorom.
              </p>
              {/* Social Links */}
              <div className="flex items-center gap-3 mt-5">
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-300 hover:bg-white hover:text-[#111111]"
                  aria-label="Instagram"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-300 hover:bg-white hover:text-[#111111]"
                  aria-label="Facebook"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385h-3.047v-3.47h3.047v-2.642c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.514c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385c5.737-.9 10.125-5.864 10.125-11.854z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-white">Kontakt</h3>
              <ul className="space-y-3 text-sm text-white/55">
                <li className="flex items-start group">
                  <div className="mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 transition-colors duration-200 group-hover:bg-white/15">
                    <svg className="h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <a href="tel:+381212982444" className="hover:text-white transition-colors duration-200 pt-1">+381 21 2982 444</a>
                </li>
                <li className="flex items-start group">
                  <div className="mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 transition-colors duration-200 group-hover:bg-white/15">
                    <svg className="h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <a href="mailto:podovidoo@gmail.com" className="hover:text-white transition-colors duration-200 pt-1">podovidoo@gmail.com</a>
                </li>
                <li className="flex items-start group">
                  <div className="mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 transition-colors duration-200 group-hover:bg-white/15">
                    <svg className="h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <a
                    href="https://www.google.com/maps/place/Podovi+doo/@45.2573343,19.8190724,17z/data=!3m1!4b1!4m6!3m5!1s0x475b112b635bb5e5:0xd096487f1e881485!8m2!3d45.2573306!4d19.8239433!16s%2Fg%2F11ymw3vs8b?entry=ttu&g_ep=EgoyMDI2MDEwNy4wIKXMDSoASAFQAw%3D%3D"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors duration-200 pt-1"
                  >
                    Hajduk Veljkova 11, Novi Sad
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pb-24 pt-8 text-center text-sm leading-6 text-white/35 md:pb-0">
            <p>&copy; {currentYear} Podovi DOO. Sva prava zadržana.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
