'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import lvtColorsData from '@/public/data/lvt_colors_complete.json';
import linoleumColorsData from '@/public/data/linoleum_colors_complete.json';
import carpetColorsData from '@/public/data/carpet_tiles_complete.json';

interface Document {
    title: string;
    url: string;
}

interface ProductDocumentsProps {
    initialDocuments?: Document[];
    categoryId: string;
    collectionSlug?: string;
}

export default function ProductDocuments({ initialDocuments = [], categoryId, collectionSlug }: ProductDocumentsProps) {
    const searchParams = useSearchParams();
    const [documents, setDocuments] = useState<Document[]>(initialDocuments);
    const colorSlug = searchParams.get('color');

    useEffect(() => {
        let isActive = true;

        const loadDocuments = async () => {
            let nextDocuments = initialDocuments;

            if (colorSlug) {
                // Load color documents from JSON
                const isLinoleum = categoryId === '7';
                const isCarpet = categoryId === '4';
                const colorsData = isLinoleum ? linoleumColorsData : isCarpet ? carpetColorsData : lvtColorsData;
                const colors = (colorsData as { colors?: any[] }).colors || [];

                // Try exact match first
                let color = colors.find((c: any) => c.slug === colorSlug);

                // If not found, try to find by partial match
                if (!color) {
                    color = colors.find((c: any) => {
                        const cSlug = c.slug || '';
                        return cSlug.includes(colorSlug) || colorSlug.includes(cSlug);
                    });
                }

                if (color && color.documents && Array.isArray(color.documents)) {
                    nextDocuments = color.documents;
                }
            }

            if ((!nextDocuments || nextDocuments.length === 0) && collectionSlug) {
                try {
                    const response = await fetch('/data/documents_index.json', { cache: 'no-store' });
                    if (response.ok) {
                        const index = await response.json();
                        const normalizedCollectionSlug = collectionSlug.replace(/^gerflor-/, '');
                        const categoryKey = categoryId === '6'
                            ? 'lvt'
                            : categoryId === '4'
                                ? 'carpet'
                                : categoryId === '7'
                                    ? 'linoleum'
                                    : '';

                        const docsFromIndex = categoryKey && index?.[categoryKey]?.[normalizedCollectionSlug]
                            ? index[categoryKey][normalizedCollectionSlug]
                            : [];

                        if (docsFromIndex.length > 0) {
                            nextDocuments = docsFromIndex;
                        }
                    }
                } catch (error) {
                    // Ignore index load errors
                }
            }

            if (isActive) {
                setDocuments(nextDocuments);
            }
        };

        loadDocuments();
        return () => {
            isActive = false;
        };
    }, [colorSlug, categoryId, initialDocuments, collectionSlug]);

    if (!documents || documents.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 h-full">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Tehnička dokumentacija
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {documents.map((doc, index) => (
                    <a
                        key={`${doc.url}-${index}`}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center p-4 border border-gray-100 rounded-xl hover:bg-primary-50 hover:border-primary-200 transition-all duration-300"
                    >
                        <div className="bg-red-50 p-2.5 rounded-lg group-hover:bg-red-100 transition-colors mr-4">
                            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A1 1 0 0111 2.293l4.707 4.707a1 1 0 01.293.707V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 truncate">
                                {doc.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">PDF dokument</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </a>
                ))}
            </div>
        </div>
    );
}
