"use client";

import { useState } from 'react';

interface FlooringCalculatorProps {
  productName: string;
  coveragePerPackage?: number; // m² po pakovanju
}

export default function FlooringCalculator({
  productName,
  coveragePerPackage = 2.25,
}: FlooringCalculatorProps) {
  const [area, setArea] = useState<string>('');
  const [calculated, setCalculated] = useState(false);

  const WASTE_PERCENTAGE = 5; // 5% otpada

  const handleCalculate = () => {
    if (area && parseFloat(area) > 0) {
      setCalculated(true);
    }
  };

  const areaNumber = parseFloat(area) || 0;
  const wasteAmount = areaNumber * (WASTE_PERCENTAGE / 100);
  const totalAreaWithWaste = areaNumber + wasteAmount;
  const packagesNeeded = Math.ceil(totalAreaWithWaste / coveragePerPackage);
  const totalCoverage = packagesNeeded * coveragePerPackage;

  return (
    <div className="border border-ink-200 p-6">
      <div className="mb-6">
        <p className="eyebrow mb-2">Kalkulator</p>
        <h3 className="text-lg font-medium text-ink-900">
          Kalkulator potrebne količine
        </h3>
        <p className="text-[13px] text-ink-600 mt-1">
          Izračunajte koliko paketa vam je potrebno za vaš prostor
        </p>
      </div>

      <div className="mb-6">
        <label htmlFor="area-input" className="label">
          Površina prostora (m²) <span className="text-red-500">*</span>
        </label>
        <div className="flex items-end gap-3">
          <input
            id="area-input"
            type="number"
            min="0"
            step="0.01"
            value={area}
            onChange={(e) => {
              setArea(e.target.value);
              setCalculated(false);
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleCalculate()}
            placeholder="Unesite površinu u m²..."
            className="input flex-1"
          />
          <button
            onClick={handleCalculate}
            disabled={!area || parseFloat(area) <= 0}
            className="btn-primary min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Izračunaj
          </button>
        </div>
        <p className="text-[13px] text-ink-500 mt-2">
          Jedno pakovanje pokriva {coveragePerPackage} m²
        </p>
      </div>

      {calculated && areaNumber > 0 && (
        <div className="space-y-6">
          {/* Rezultati */}
          <div>
            <p className="eyebrow mb-2">Rezultat proračuna</p>

            <div className="flex justify-between border-b border-ink-200 py-[9px] text-[13px]">
              <span className="text-ink-500">Vaša površina</span>
              <span className="text-ink-900">{areaNumber.toFixed(2)} m²</span>
            </div>

            <div className="flex justify-between border-b border-ink-200 py-[9px] text-[13px]">
              <span className="text-ink-500">Otpad ({WASTE_PERCENTAGE}%)</span>
              <span className="text-ink-900">+{wasteAmount.toFixed(2)} m²</span>
            </div>

            <div className="flex justify-between border-b border-ink-200 py-[9px] text-[13px]">
              <span className="text-ink-500">Ukupno potrebno</span>
              <span className="text-ink-900">{totalAreaWithWaste.toFixed(2)} m²</span>
            </div>

            <div className="flex items-baseline justify-between border-b border-ink-200 py-[9px]">
              <span className="text-[13px] text-ink-500">Broj paketa</span>
              <span className="text-2xl font-normal text-ink-900">
                {packagesNeeded} <span className="text-[13px] text-ink-500">kom</span>
              </span>
            </div>

            <p className="text-[13px] text-ink-500 mt-2">
              Ukupna pokrivenost: {totalCoverage.toFixed(2)} m²
            </p>
          </div>

          {/* Info */}
          <p className="text-[13px] text-ink-600 leading-relaxed">
            Preporuka: uračunali smo samo 5% otpada (umesto standardnih 10%), što znači uštedu za vas.
            Za prostorije sa dosta uglova ili dijagonalno postavljanje, razmotrite dodavanje još 1–2 paketa.
          </p>

          {/* CTA napomena */}
          <p className="text-[13px] text-ink-600">
            Kliknite na dugme „Pošalji upit” gore na stranici da pošaljete upit za {packagesNeeded} paketa.
          </p>
        </div>
      )}
    </div>
  );
}
