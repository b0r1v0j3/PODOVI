'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

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
                try {
                    const res = await fetch(`/api/color-data?color=${encodeURIComponent(colorSlug)}&categoryId=${encodeURIComponent(categoryId)}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.documents && data.documents.length > 0) {
                            nextDocuments = data.documents;
                        }
                    }
                } catch {
                    // Ignore fetch errors, fall through to collection-level docs
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
                                    : categoryId === '2'
                                        ? 'vinil'
                                        : '';

                        const docsFromIndex = categoryKey && index?.[categoryKey]?.[normalizedCollectionSlug]
                            ? index[categoryKey][normalizedCollectionSlug]
                            : [];

                        if (docsFromIndex.length > 0) {
                            nextDocuments = docsFromIndex;
                            if (colorSlug && nextDocuments.length > 3) {
                                nextDocuments = nextDocuments.slice(0, 3);
                            }
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
        <div className="w-full">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Tehnička dokumentacija
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 max-w-3xl">
                {documents.map((doc, index) => (
                    <a
                        key={`${doc.url}-${index}`}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-row items-center p-5 bg-white border border-gray-100 rounded-[1.25rem] shadow-sm hover:shadow-md hover:border-red-100 transition-all duration-300"
                    >
                        <div className="bg-red-50 p-3 rounded-xl group-hover:bg-red-100 transition-colors mr-5 shrink-0">
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
                        <svg className="w-6 h-6 text-gray-300 group-hover:text-red-500 transition-colors ml-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </a>
                ))}
            </div>
        </div>
    );
}
