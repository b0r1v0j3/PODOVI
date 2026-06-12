interface CertificationBadgesProps {
  certifications: string[];
}

export default function CertificationBadges({ certifications }: CertificationBadgesProps) {
  if (!certifications || certifications.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {certifications.map((cert) => (
        <span
          key={cert}
          className="inline-flex items-center border border-ink-200 px-3 py-1.5 text-[12px] text-ink-900 transition-colors hover:border-ink-900"
          title={cert}
        >
          {cert}
        </span>
      ))}
    </div>
  );
}
