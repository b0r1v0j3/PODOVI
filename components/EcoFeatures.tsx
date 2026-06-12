interface EcoFeaturesProps {
  features: string[];
  underfloorHeating?: boolean;
}

export default function EcoFeatures({ features, underfloorHeating }: EcoFeaturesProps) {
  if ((!features || features.length === 0) && !underfloorHeating) return null;

  const allFeatures = [...features];
  if (underfloorHeating) {
    allFeatures.push("Kompatibilno sa podnim grejanjem");
  }

  return (
    <div className="h-full">
      <h3 className="eyebrow mb-6">Ekološke karakteristike</h3>
      <ul className="space-y-3">
        {allFeatures.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <svg className="w-4 h-4 mt-0.5 text-ink-900 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-[13px] leading-relaxed text-ink-900">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
