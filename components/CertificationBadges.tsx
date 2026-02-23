interface CertificationBadgesProps {
  certifications: string[];
}

const certIcons: Record<string, string> = {
  "FloorScore": "🌿",
  "Indoor Air Comfort Gold": "🏅",
  "M1": "✓",
  "A+": "A+",
  "CE": "CE",
  "REACH": "🇪🇺",
  "EPD": "♻️",
  "ISO 9001": "ISO",
  "ISO 14001": "🌍",
  "Cradle to Cradle Silver": "🔄",
  "Cradle to Cradle Gold": "🔄",
  "Cradle to Cradle Bronze": "🔄",
  "BREEAM A+": "✓",
  "BREEAM A": "✓",
  "GreenTag Level A": "🌿",
  "GreenTag Level B": "🌿",
};

export default function CertificationBadges({ certifications }: CertificationBadgesProps) {
  if (!certifications || certifications.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {certifications.map((cert) => (
        <span
          key={cert}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium bg-white border border-[#E5E5EA] text-[#1D1D1F] shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors hover:border-[#D1D1D6]"
          title={cert}
        >
          <span className="text-sm opacity-80">{certIcons[cert] || "✓"}</span>
          {cert}
        </span>
      ))}
    </div>
  );
}
