import { brandRepository } from '@/lib/repositories/brand-repository';
import BrandCard from '@/components/BrandCard';
import Breadcrumbs from '@/components/Breadcrumbs';

export const metadata = {
  title: 'Brendovi - Podovi',
  description: 'Radimo sa vodećim evropskim proizvođačima podnih obloga. Quick-Step, Tarkett, Balterio, Kronotex i mnogi drugi.',
};

export default async function BrandsPage() {
  const brands = await brandRepository.findAll();

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <section className="relative bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTItMnYyaDJ2LTJoLTJ6bTQgMHYyaDJ2LTJoLTJ6bTQgMHYyaDJ2LTJoLTJ6bTQgMHYyaDJ2LTJoLTJ6bTQgMHYyaDJ2LTJoLTJ6bTIgMnYyaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bS0yIDJ2Mmgydi0yaC0yem0tNCAwdjJoMnYtMmgtMnptLTQgMHYyaDJ2LTJoLTJ6bS00IDB2Mmgydi0yaC0yem0tNCAwdjJoMnYtMmgtMnptLTItMnYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>
        <div className="container py-12 md:py-16 relative z-10">
          <div className="mb-4">
            <Breadcrumbs items={[{ label: 'Brendovi' }]} variant="dark" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Naši brendovi
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl">
            Radimo sa vodećim evropskim proizvođačima koji garantuju vrhunski kvalitet
          </p>
        </div>
      </section>

      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {brands.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      </div>
    </div>
  );
}
