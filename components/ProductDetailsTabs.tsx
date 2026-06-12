interface TabListProps {
    tabs: {
        id: string;
        label: string;
        content: React.ReactNode;
    }[];
}

export default function ProductDetailsTabs({ tabs }: TabListProps) {
    if (!tabs || tabs.length === 0) return null;

    return (
        <div className="w-full mt-10 mb-16">
            {tabs.map((tab) => (
                <section
                    key={tab.id}
                    id={tab.id}
                    aria-labelledby={`section-h-${tab.id}`}
                    className="border-t border-ink-200 py-10 md:py-12"
                >
                    <h2 id={`section-h-${tab.id}`} className="eyebrow mb-6">{tab.label}</h2>
                    {tab.content}
                </section>
            ))}
        </div>
    );
}
