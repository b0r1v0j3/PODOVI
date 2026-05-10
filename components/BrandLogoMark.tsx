type BrandLogoMarkProps = {
  brand: {
    name: string;
    logo?: string | null;
  } | null;
};

function hasUsableBrandLogo(logo?: string | null): logo is string {
  return Boolean(logo && !logo.includes('/images/placeholder'));
}

export default function BrandLogoMark({ brand }: BrandLogoMarkProps) {
  if (!brand) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500">Brend:</span>
      {hasUsableBrandLogo(brand.logo) ? (
        <span
          className="inline-flex h-12 max-w-[190px] items-center rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-sm"
          title={brand.name}
        >
          <img
            src={brand.logo}
            alt={`${brand.name} logo`}
            className="max-h-9 w-auto max-w-[160px] object-contain"
            loading="eager"
            decoding="async"
          />
        </span>
      ) : (
        <span className="text-gray-900 font-semibold">{brand.name}</span>
      )}
    </div>
  );
}
