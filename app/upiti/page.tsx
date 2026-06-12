import Breadcrumbs from '@/components/Breadcrumbs';
import ContactForm from '@/components/ContactForm';
import { Suspense } from 'react';

export const metadata = {
  title: 'Pošalji upit - Podovi',
  description: 'Pošaljite upit za proizvode koji vas interesuju. Naš tim će vam se javiti u najkraćem roku.',
};

export default function InquiryPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="container pt-6 pb-24">
        <div className="mb-10">
          <Breadcrumbs items={[{ label: 'Upiti' }]} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-20">
          {/* Form Column */}
          <div className="lg:col-span-2">
            <h2 className="eyebrow mb-8">Kontakt Forma</h2>
            <Suspense fallback={<div className="h-64 bg-paper animate-pulse" aria-label="Učitavanje forme" />}>
              <ContactForm />
            </Suspense>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-12">
            {/* Contact Info */}
            <div>
              <h3 className="eyebrow mb-4">Kontakt Informacije</h3>
              <div className="border-t border-ink-200">
                <div className="flex justify-between gap-4 border-b border-ink-200 py-[9px] text-[13px]">
                  <span className="text-ink-500">Telefon</span>
                  <a href="tel:+381212982444" className="text-ink-900 text-right hover:opacity-60 transition-opacity">
                    +381 21 2982 444
                  </a>
                </div>
                <div className="flex justify-between gap-4 border-b border-ink-200 py-[9px] text-[13px]">
                  <span className="text-ink-500">Email</span>
                  <a href="mailto:podovidoo@gmail.com" className="text-ink-900 text-right break-all hover:opacity-60 transition-opacity">
                    podovidoo@gmail.com
                  </a>
                </div>
                <div className="flex justify-between gap-4 border-b border-ink-200 py-[9px] text-[13px]">
                  <span className="text-ink-500">Lokacija</span>
                  <a
                    href="https://www.google.com/maps/place/Podovi+doo/@45.2573343,19.8190724,17z"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink-900 text-right hover:opacity-60 transition-opacity"
                  >
                    Hajduk Veljkova 11,<br />Novi Sad, Srbija
                  </a>
                </div>
              </div>
            </div>

            {/* Why Choose Us (Compact) */}
            <div>
              <h3 className="eyebrow mb-4">Zašto izabrati nas?</h3>
              <ul className="border-t border-ink-200">
                <li className="flex items-center gap-3 border-b border-ink-200 py-[9px] text-[13px] text-ink-900">
                  <svg className="w-4 h-4 flex-shrink-0 text-ink-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Brz odgovor na upite
                </li>
                <li className="flex items-center gap-3 border-b border-ink-200 py-[9px] text-[13px] text-ink-900">
                  <svg className="w-4 h-4 flex-shrink-0 text-ink-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Stručno savetovanje
                </li>
                <li className="flex items-center gap-3 border-b border-ink-200 py-[9px] text-[13px] text-ink-900">
                  <svg className="w-4 h-4 flex-shrink-0 text-ink-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Najbolji odnos cene i kvaliteta
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
