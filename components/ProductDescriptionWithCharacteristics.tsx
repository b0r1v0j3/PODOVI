'use client';

import { FaCheck, FaWater, FaVolumeMute, FaShieldAlt, FaLeaf, FaTools, FaTemperatureHigh, FaRegStar } from 'react-icons/fa';
import { MdCleaningServices, MdTouchApp } from 'react-icons/md';

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
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Opis proizvoda</h2>
        <div className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
          {description}
        </div>
      </div>

      {characteristicsSection && characteristicsSection.items.length > 0 && (
        <div className="border-t border-gray-100 pt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            {characteristicsSection.title}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {characteristicsSection.items.map((item, index) => {
              const Icon = getIconForCharacteristic(item);
              return (
                <div
                  key={index}
                  className="flex items-start p-4 rounded-xl bg-gray-50 border border-gray-100 transition-all duration-300 hover:shadow-md hover:border-primary-100 group"
                >
                  <div className="flex-shrink-0 mt-1 mr-4 text-primary-600 bg-white p-2 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-gray-700 font-medium leading-relaxed self-center">
                    {item}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to pick icons based on text content
function getIconForCharacteristic(text: string) {
  const t = text.toLowerCase();
  if (t.includes('vod') || t.includes('vlag')) return FaWater;
  if (t.includes('zvuk') || t.includes('akust')) return FaVolumeMute;
  if (t.includes('otpor') || t.includes('habanj') || t.includes('ogreb')) return FaShieldAlt;
  if (t.includes('eko') || t.includes('recikl') || t.includes('zdrav') || t.includes('prirod')) return FaLeaf;
  if (t.includes('postav') || t.includes('ugrad') || t.includes('klik')) return FaTools;
  if (t.includes('topl') || t.includes('podno')) return FaTemperatureHigh;
  if (t.includes('održav') || t.includes('čišć')) return MdCleaningServices;
  if (t.includes('udob') || t.includes('komfor')) return MdTouchApp;
  if (t.includes('dizajn') || t.includes('izgled')) return FaRegStar;

  return FaCheck;
}
