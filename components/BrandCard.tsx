'use client';

import Link from 'next/link';
import { Brand } from '@/types';

interface BrandCardProps {
  brand: Brand;
}

export default function BrandCard({ brand }: BrandCardProps) {
  return (
    <Link href={`/brendovi/${brand.slug}`}>
      <div className="card card-hover cursor-pointer h-full group">
        {/* Accent bar */}
        <div className="h-1 bg-gradient-to-r from-primary-500 to-primary-700"></div>

        <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8 relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/svg%3E")`
          }}></div>

          <div className="text-center relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
              <span className="text-2xl font-bold text-white">
                {brand.name.charAt(0)}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors duration-300">
              {brand.name}
            </h2>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-4 text-sm leading-relaxed">
            {brand.description}
          </p>
          {brand.countryOfOrigin && (
            <p className="text-xs text-gray-500 mb-4 flex items-center">
              <svg className="w-3.5 h-3.5 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{brand.countryOfOrigin}</span>
            </p>
          )}
          <div className="flex gap-3 items-center pt-2 border-t border-gray-100">
            <span className="text-sm text-primary-600 font-semibold flex items-center group-hover:text-primary-700 transition-colors">
              Pogledaj proizvode
              <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
            {brand.website && (
              <a
                href={brand.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-gray-600 font-medium ml-auto flex items-center transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Sajt
                <svg className="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
