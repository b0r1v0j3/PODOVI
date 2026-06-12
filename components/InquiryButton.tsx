"use client";

import { useState } from 'react';
import InquiryModal from './InquiryModal';

interface InquiryButtonProps {
  product: {
    id: string;
    name: string;
    sku: string;
    url: string;
    image?: string;
    category?: string;
  };
  calculatedData?: {
    area: number;
    packages: number;
  };
}

export default function InquiryButton({ product, calculatedData }: InquiryButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn-primary w-full min-h-[44px]"
      >
        Pošalji upit
      </button>

      <InquiryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
        calculatedData={calculatedData}
      />
    </>
  );
}
