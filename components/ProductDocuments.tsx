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
    const [activeDocument, setActiveDocument] = useState<Document | null>(null);
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
                                        : categoryId === '8'
                                            ? 'elektroprovodni'
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

            {activeDocument ? (
                <div className="flex flex-col bg-white border border-gray-200 rounded-[1.25rem] shadow-sm overflow-hidden mb-8 transition-all duration-300">
                    <div className="flex flex-wrap items-center justify-between p-4 bg-gray-50 border-b border-gray-200 gap-4">
                        <button
                            onClick={() => setActiveDocument(null)}
                            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-red-50"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Nazad na listu
                        </button>
                        <h4 className="text-sm font-bold text-gray-900 truncate flex-1 block max-w-full lg:max-w-md text-center">
                            {activeDocument.title}
                        </h4>
                        <div className="flex items-center gap-2 ml-auto">
                            <a
                                href={activeDocument.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors px-4 py-2 rounded-lg"
                                title="Otvori u novom tabu"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Preuzmi
                            </a>
                        </div>
                    </div>
                    <div className="w-full bg-gray-100" style={{ height: '75vh', minHeight: '600px' }}>
                        <object
                            data={activeDocument.url}
                            type="application/pdf"
                            className="w-full h-full"
                        >
                            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                                <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p className="text-gray-500 mb-4 font-medium">Vaš pretraživač ne podržava ugrađeni PDF pregled.</p>
                                <a
                                    href={activeDocument.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors px-6 py-2.5 rounded-xl shadow-sm hover:shadow-md"
                                >
                                    Preuzmi PDF direktno
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                </a>
                            </div>
                        </object>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 max-w-3xl">
                    {documents.map((doc, index) => (
                        <button
                            key={`${doc.url}-${index}`}
                            onClick={() => setActiveDocument(doc)}
                            className="group flex flex-row items-center p-5 bg-white border border-gray-100 rounded-[1.25rem] shadow-sm hover:shadow-md hover:border-red-100 transition-all duration-300 w-full text-left cursor-pointer"
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
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-3 shrink-0 text-xs font-semibold text-red-600 uppercase tracking-wide">
                                Otvori pregled
                            </div>
                            <svg className="w-6 h-6 text-gray-300 group-hover:text-red-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
