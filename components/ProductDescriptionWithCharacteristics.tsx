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
    <div className="space-y-10">
      <div className="max-w-3xl text-[15px] md:text-base text-ink-600 leading-relaxed whitespace-pre-line">
        {description}
      </div>

      {characteristicsSection && characteristicsSection.items.length > 0 && (
        <div>
          <h3 className="eyebrow mb-4">
            {characteristicsSection.title}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
            {characteristicsSection.items.map((item, index) => {
              const Icon = getIconForCharacteristic(item);
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 border-b border-ink-200 py-[9px]"
                >
                  <Icon className="w-4 h-4 mt-0.5 text-ink-500 flex-shrink-0" />
                  <span className="text-[13px] text-ink-900 leading-relaxed">
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
