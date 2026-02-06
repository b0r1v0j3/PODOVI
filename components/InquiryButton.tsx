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
        className="btn-primary w-full text-lg py-4"
      >
        <svg className="w-5 h-5 mr-2 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
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
