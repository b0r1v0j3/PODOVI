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

export default function ProductDetailsTabs({ tabs }: TabListProps) {
    const [activeTab, setActiveTab] = useState(tabs[0]?.id);

    if (!tabs || tabs.length === 0) return null;

    return (
        <div className="w-full mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header / Tabs Navigation */}
            <div className="flex justify-center border-b border-gray-100 bg-gray-50/50 p-2 sm:p-4">
                <div className="flex gap-2 p-1 bg-gray-100/80 rounded-xl overflow-x-auto max-w-full hide-scrollbar">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                  relative px-6 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap
                  ${isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}
                `}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabBackground"
                                        className="absolute inset-0 bg-white rounded-lg shadow-sm"
                                        initial={false}
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                                    />
                                )}
                                <span className="relative z-10">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="p-6 md:p-10 min-h-[300px]">
                <AnimatePresence mode="wait">
                    {tabs.map((tab) => {
                        if (tab.id !== activeTab) return null;
                        return (
                            <motion.div
                                key={tab.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="max-w-4xl mx-auto"
                            >
                                {tab.content}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
