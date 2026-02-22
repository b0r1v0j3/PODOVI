import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import ContactForm from '@/components/ContactForm';
import { Suspense } from 'react';

export const metadata = {
  title: 'Pošalji upit - Podovi',
  description: 'Pošaljite upit za proizvode koji vas interesuju. Naš tim će vam se javiti u najkraćem roku.',
};

export default function InquiryPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container pt-6 pb-16">
        <div className="mb-4">
          <Breadcrumbs items={[{ label: 'Upiti' }]} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Form Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Kontakt Forma</h2>
              <Suspense fallback={<div className="p-8 text-center">Učitavanje forme...</div>}>
                <ContactForm />
              </Suspense>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            {/* Contact Info */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Kontakt Informacije</h3>
              <ul className="space-y-6">
                <li className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mr-4">
                    <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Telefon</span>
                    <a href="tel:+381212982444" className="text-lg font-medium text-gray-900 hover:text-primary-600 transition-colors">
                      +381 21 2982 444
                    </a>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mr-4">
                    <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</span>
                    <a href="mailto:prodaja@podovi.online" className="text-lg font-medium text-gray-900 hover:text-primary-600 transition-colors break-all">
                      prodaja@podovi.online
                    </a>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mr-4">
                    <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Lokacija</span>
                    <a
                      href="https://www.google.com/maps/place/Podovi+doo/@45.2573343,19.8190724,17z"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-medium text-gray-900 hover:text-primary-600 transition-colors"
                    >
                      Hajduk Veljkova 11,<br />Novi Sad, Srbija
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            {/* Why Choose Us (Compact) */}
            <div className="bg-gray-100 rounded-2xl p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Zašto izabrati nas?</h3>
              <ul className="space-y-4">
                <li className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Brz odgovor na upite
                </li>
                <li className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Stručno savetovanje
                </li>
                <li className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
