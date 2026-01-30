'use client';

interface ProductDescriptionWithCharacteristicsProps {
  description: string;
  /** Sekcija "Ključne karakteristike" – uvek prikazana ispod opisa */
  characteristicsSection?: { title: string; items: string[] };
}

export default function ProductDescriptionWithCharacteristics({
  description,
  characteristicsSection,
}: ProductDescriptionWithCharacteristicsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Opis proizvoda</h2>
        <div className="text-gray-700 leading-relaxed whitespace-pre-line">
          {description}
        </div>
      </div>

      {characteristicsSection && characteristicsSection.items.length > 0 && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {characteristicsSection.title}
          </h3>
          <ul className="list-disc pl-5 text-gray-700 space-y-2">
            {characteristicsSection.items.map((item, index) => (
              <li key={index} className="text-base leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
