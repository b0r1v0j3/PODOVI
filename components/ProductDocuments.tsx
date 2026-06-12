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

interface DocumentsSourceConfig {
    categoryKey: string;
    dataUrl: string;
    preferIndex: boolean;
}

function normalizeDocumentUrl(url: string) {
    const value = String(url || '').trim();
    if (!value) return '';
    if (!/media\.tarkett-image\.com/i.test(value) || !/\.pdf(?:\?|$)/i.test(value)) {
        return value;
    }

    return value
        .replace('://media.tarkett-image.com/large-high/', '://media.tarkett-image.com/docs/')
        .replace('://media.tarkett-image.com/large/', '://media.tarkett-image.com/docs/')
        .replace('://media.tarkett-image.com/medium/', '://media.tarkett-image.com/docs/');
}

function normalizeDocuments(documents: Document[] = []): Document[] {
    const seen = new Set<string>();

    return documents.reduce<Document[]>((result, document) => {
        const url = normalizeDocumentUrl(document?.url || '');
        if (!url || seen.has(url)) {
            return result;
        }

        seen.add(url);
        result.push({
            title: String(document?.title || '').trim() || 'Dokument',
            url,
        });
        return result;
    }, []);
}

function getDocumentsSourceConfig(categoryId: string): DocumentsSourceConfig | null {
    if (categoryId === '1') {
        return { categoryKey: 'laminat', dataUrl: '/data/tarkett_documents_index.json', preferIndex: true };
    }

    if (categoryId === '3') {
        return { categoryKey: 'parket', dataUrl: '/data/tarkett_documents_index.json', preferIndex: true };
    }

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
                        : categoryId === '9'
                            ? 'industrijske-ploce'
                            : categoryId === '10'
                                ? 'sport'
                                : '';

    if (!categoryKey) {
        return null;
    }

    return { categoryKey, dataUrl: '/data/documents_index.json', preferIndex: false };
}

export default function ProductDocuments({ initialDocuments = [], categoryId, collectionSlug }: ProductDocumentsProps) {
    const searchParams = useSearchParams();
    const [documents, setDocuments] = useState<Document[]>(normalizeDocuments(initialDocuments));
    const [activeDocument, setActiveDocument] = useState<Document | null>(null);
    const colorSlug = searchParams.get('color');

    useEffect(() => {
        let isActive = true;

        const loadDocuments = async () => {
            let nextDocuments = normalizeDocuments(initialDocuments);

            if (colorSlug) {
                try {
                    const res = await fetch(`/api/color-data?color=${encodeURIComponent(colorSlug)}&categoryId=${encodeURIComponent(categoryId)}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.documents && data.documents.length > 0) {
                            nextDocuments = normalizeDocuments(data.documents);
                        }
                    }
                } catch {
                    // Ignore fetch errors, fall through to collection-level docs
                }
            }

            const sourceConfig = getDocumentsSourceConfig(categoryId);

            if (collectionSlug && sourceConfig) {
                try {
                    const response = await fetch(sourceConfig.dataUrl, { cache: 'no-store' });
                    if (response.ok) {
                        const index = await response.json();
                        const normalizedCollectionSlug = collectionSlug
                            .replace(/^gerflor-/, '')
                            .replace(/^tarkett-/, '')
                            .replace(/^wolflor-/, '');

                        const docsFromIndex = index?.[sourceConfig.categoryKey]?.[normalizedCollectionSlug]
                            ? normalizeDocuments(index[sourceConfig.categoryKey][normalizedCollectionSlug])
                            : [];

                        const shouldUseIndex = docsFromIndex.length > 0 && (sourceConfig.preferIndex || !nextDocuments || nextDocuments.length === 0);

                        if (shouldUseIndex) {
                            nextDocuments = docsFromIndex;
                            if (!sourceConfig.preferIndex && colorSlug && nextDocuments.length > 3) {
                                nextDocuments = nextDocuments.slice(0, 3);
                            }
                        }
                    }
                } catch (error) {
                    // Ignore index load errors
                }
            }

            if (isActive) {
                setDocuments(normalizeDocuments(nextDocuments));
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
            {activeDocument ? (
                <div className="flex flex-col border border-ink-200 bg-white overflow-hidden mb-8">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-200 bg-white p-4">
                        <button
                            onClick={() => setActiveDocument(null)}
                            className="flex min-h-[44px] items-center gap-2 text-[13px] text-ink-600 hover:text-ink-900 transition-colors cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Nazad na listu
                        </button>
                        <h4 className="text-[13px] font-medium text-ink-900 truncate flex-1 block max-w-full lg:max-w-md text-center">
                            {activeDocument.title}
                        </h4>
                        <div className="flex items-center gap-2 ml-auto">
                            <a
                                href={activeDocument.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary inline-flex items-center gap-2"
                                title="Otvori u novom tabu"
                            >
                                Preuzmi
                            </a>
                        </div>
                    </div>
                    <div className="w-full bg-paper" style={{ height: '75vh', minHeight: '600px' }}>
                        <object
                            data={activeDocument.url}
                            type="application/pdf"
                            className="w-full h-full"
                        >
                            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                                <svg className="w-12 h-12 text-ink-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p className="text-ink-500 text-[13px] mb-6">Vaš pretraživač ne podržava ugrađeni PDF pregled.</p>
                                <a
                                    href={activeDocument.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-primary inline-flex items-center gap-2"
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
                <div className="max-w-3xl">
                    {documents.map((doc, index) => (
                        <button
                            key={`${doc.url}-${index}`}
                            onClick={() => setActiveDocument(doc)}
                            className="group flex w-full min-h-[44px] items-center gap-3 border-b border-ink-200 py-[9px] text-left cursor-pointer"
                        >
                            <svg className="w-4 h-4 text-ink-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            <span className="flex-1 min-w-0 truncate text-[13px] text-ink-900">{doc.title}</span>
                            <svg className="w-4 h-4 text-ink-500 transition-colors group-hover:text-ink-900 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
