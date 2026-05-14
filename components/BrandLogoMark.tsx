type BrandLogoMarkProps = {
  brand: {
    name: string;
    logo?: string | null;
  } | null;
};

function hasUsableBrandLogo(logo?: string | null): logo is string {
  return Boolean(logo && !logo.includes('/images/placeholder'));
}

function isRetiredPodoviPlaceholder(logo?: string | null) {
  return Boolean(logo && logo.includes('/images/brands/podovi.svg'));
}

export default function BrandLogoMark({ brand }: BrandLogoMarkProps) {
  if (!brand) {
    return null;
  }

  if (brand.name.toLowerCase() === 'podovi' && (!hasUsableBrandLogo(brand.logo) || isRetiredPodoviPlaceholder(brand.logo))) {
    return (
      <div className="flex items-center">
        <span className="text-3xl font-semibold lowercase tracking-tighter text-[#1D1D1F]">
          podovi
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      {hasUsableBrandLogo(brand.logo) ? (
        <img
          src={brand.logo}
          alt={`${brand.name} logo`}
          className="h-10 w-auto max-w-[180px] object-contain"
          title={brand.name}
          loading="eager"
          decoding="async"
        />
      ) : (
        <span className="text-gray-900 font-semibold">{brand.name}</span>
      )}
    </div>
  );
}
