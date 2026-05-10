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
