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
                    aria-label={tab.label}
                    className="border-t border-ink-200 py-10 md:py-12"
                >
                    <h2 className="eyebrow mb-6">{tab.label}</h2>
                    {tab.content}
                </section>
            ))}
        </div>
    );
}
