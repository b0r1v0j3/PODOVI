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
    <div className="bg-gradient-to-b from-[#FFFFFF] to-[#F9F9FB] rounded-[28px] p-8 h-full flex flex-col justify-center border border-[#E5E5EA] shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-3.5 mb-7">
        <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-[21px] font-semibold tracking-[-0.01em] text-[#1D1D1F]">Ekološke karakteristike</h3>
      </div>

      <ul className="space-y-4.5">
        {allFeatures.map((feature, index) => (
          <li key={index} className="flex items-start gap-3.5">
            <div className="mt-1.5 flex-shrink-0">
              <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <span className="text-[15px] leading-relaxed text-[#424245] font-medium">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
