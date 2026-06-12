'use client';

interface ProductBenefitsProps {
    benefits: string[];
}

export default function ProductBenefits({ benefits }: ProductBenefitsProps) {
    if (!benefits || benefits.length === 0) return null;

    return (
        <div className="border-t border-ink-200 pt-8">
            <h3 className="eyebrow mb-6">Prednosti</h3>
            <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                        <svg className="w-4 h-4 text-ink-900 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[15px] text-ink-600 leading-relaxed">{benefit}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
