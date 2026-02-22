import { categoryRepository } from '@/lib/repositories/category-repository';
import CategoryCard from '@/components/CategoryCard';
import Breadcrumbs from '@/components/Breadcrumbs';

export const metadata = {
  title: 'Kategorije - Podovi',
  description: 'Pregledajte sve kategorije podnih obloga. Laminat, vinil, parket, terasni podovi i ostale podne obloge.',
};

export default async function CategoriesPage() {
  const categories = await categoryRepository.findAll();

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="container py-4">
          <Breadcrumbs items={[{ label: 'Kategorije' }]} />
        </div>
      </div>

      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </div>
  );
}
