'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TabListProps {
    tabs: {
        id: string;
        label: string;
        content: React.ReactNode;
    }[];
}

// Subtle Apple-like icons for common tab IDs
const tabIcons: Record<string, React.ReactNode> = {
    description: (
        <svg className="w-[18px] h-[18px] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
        </svg>
    ),
    specs: (
        <svg className="w-[18px] h-[18px] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 0H4.5M5.25 12h9.75m-9.75 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 0H3m12 6h5.25m-5.25 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 0H9" />
        </svg>
    ),
    eco: (
        <svg className="w-[18px] h-[18px] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    docs: (
        <svg className="w-[18px] h-[18px] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    )
};

export default function ProductDetailsTabs({ tabs }: TabListProps) {
    const [activeTab, setActiveTab] = useState(tabs[0]?.id);

    if (!tabs || tabs.length === 0) return null;

    return (
        <div className="w-full mt-10 mb-16">
            {/* Floating Apple-style Segmented Control */}
            <div className="flex justify-center mb-8 px-4 z-10 relative">
                <div className="flex gap-1 p-1.5 bg-gray-100/90 hover:bg-gray-200/60 backdrop-blur-xl rounded-full overflow-x-auto max-w-full hide-scrollbar transition-all duration-300 border border-black/[0.04] shadow-inner">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    group relative flex items-center px-6 py-3 text-[15px] font-medium rounded-full transition-colors duration-300 whitespace-nowrap outline-none
                                    ${isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-800'}
                                `}
                                style={{ WebkitTapHighlightColor: 'transparent' }}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabPill"
                                        className="absolute inset-0 bg-white rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-black/[0.04]"
                                        initial={false}
                                        transition={{ type: 'spring', stiffness: 450, damping: 35, mass: 0.8 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center tracking-tight">
                                    {tabIcons[tab.id] && (
                                        <span className={`transition-colors duration-300 ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                            {tabIcons[tab.id]}
                                        </span>
                                    )}
                                    {tab.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content Area */}
            <div className="w-full bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-b from-gray-50/30 to-transparent h-12 pointer-events-none" />
                <div className="p-8 md:p-12 lg:p-14 min-h-[350px] relative z-10">
                    <AnimatePresence mode="wait">
                        {tabs.map((tab) => {
                            if (tab.id !== activeTab) return null;
                            return (
                                <motion.div
                                    key={tab.id}
                                    initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
                                    transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
                                    className="max-w-4xl mx-auto"
                                >
                                    {tab.content}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
