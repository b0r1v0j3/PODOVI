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
    <div className="bg-[#F5F5F7] rounded-3xl p-8 h-full flex flex-col justify-center">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-[20px] font-semibold tracking-tight text-[#1D1D1F]">Ekološke karakteristike</h3>
      </div>

      <ul className="space-y-4">
        {allFeatures.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <div className="mt-1 flex-shrink-0">
              <svg className="w-4 h-4 text-[#86868B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-[15px] leading-relaxed text-[#1D1D1F] font-medium">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
