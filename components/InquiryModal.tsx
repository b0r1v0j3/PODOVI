"use client";

import { useState, useEffect, useRef, FormEvent } from 'react';
import { InquiryFormData, PreferredContact } from '@/types';
import { useScrollLock } from './useScrollLock';

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export default function InquiryModal({ isOpen, onClose, product, calculatedData }: InquiryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  // Premesti fokus na naslov potvrde kada je upit uspešno poslat
  useEffect(() => {
    if (isSuccess) {
      successHeadingRef.current?.focus();
    }
  }, [isSuccess]);

  // Zakljucaj scroll pozadine dok je modal otvoren
  useScrollLock(isOpen);

  // Zatvori modal na Escape i upravljaj fokusom dok je otvoren
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    // Pri otvaranju fokus ulazi u dijalog — na dugme za zatvaranje
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // Vrati fokus na element koji je otvorio modal
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen, onClose]);

  const [formData, setFormData] = useState<InquiryFormData>({
    productId: product.id,
    productName: product.name,
    productSku: product.sku,
    productUrl: product.url,
    productImage: product.image,
    productCategory: product.category,
    fullName: '',
    phone: '',
    email: '',
    city: '',
    quantityM2: '',
    message: calculatedData
      ? `Zainteresovan/a sam za ${calculatedData.packages} paketa (${calculatedData.area.toFixed(2)} m² + 5% otpada).`
      : '',
    preferredContact: [],
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Greška pri slanju upita');
      }

      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        // Reset form
        setFormData({
          ...formData,
          fullName: '',
          phone: '',
          email: '',
          city: '',
          quantityM2: '',
          message: '',
          preferredContact: [],
        });
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri slanju upita');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePreferredContact = (method: PreferredContact) => {
    setFormData(prev => ({
      ...prev,
      preferredContact: prev.preferredContact.includes(method)
        ? prev.preferredContact.filter(m => m !== method)
        : [...prev.preferredContact, method],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-black/20"
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pošalji upit"
          className="inline-block align-bottom bg-white border border-ink-200 text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full"
        >
          {isSuccess ? (
            <div role="status" className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 border border-ink-200 text-ink-900 mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 ref={successHeadingRef} tabIndex={-1} className="text-2xl font-normal text-ink-900 mb-2">
                Upit uspešno poslat!
              </h3>
              <p className="text-ink-600">
                Kontaktiraćemo vas u najkraćem mogućem roku.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex gap-4">
                    {product.image && (
                      <div className="w-20 h-20 flex-shrink-0 bg-paper overflow-hidden border border-ink-200">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-medium text-ink-900 leading-tight">
                        Pošalji upit
                      </h3>
                      <p className="font-normal text-ink-600 mt-1">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 text-[13px] text-ink-500 mt-1">
                        <span>SKU: {product.sku}</span>
                        {product.category && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{product.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    ref={closeButtonRef}
                    onClick={onClose}
                    aria-label="Zatvori"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-ink-500 hover:text-ink-900 transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="fullName" className="label">
                      Ime i prezime <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="input"
                    />
                  </div>

                  {/* Phone and Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="label">
                        Telefon <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="input"
                        placeholder="+381..."
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="label">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>

                  {/* City and Quantity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="label">
                        Grad <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="city"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label htmlFor="quantityM2" className="label">
                        Količina (m²)
                      </label>
                      <input
                        type="number"
                        id="quantityM2"
                        value={formData.quantityM2}
                        onChange={(e) => setFormData({ ...formData, quantityM2: e.target.value })}
                        className="input"
                        placeholder="Opciono"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="label">
                      Poruka <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="input"
                      placeholder="Ostavite dodatne informacije ili pitanja..."
                    />
                  </div>

                  {/* Preferred Contact */}
                  <div>
                    <label className="label">
                      Preferirani način kontakta <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { value: 'call' as PreferredContact, label: 'Poziv', icon: '📞' },
                        { value: 'email' as PreferredContact, label: 'Email', icon: '📧' },
                        { value: 'viber' as PreferredContact, label: 'Viber', icon: '💬' },
                        { value: 'whatsapp' as PreferredContact, label: 'WhatsApp', icon: '💬' },
                      ].map((method) => (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => togglePreferredContact(method.value)}
                          className={`p-3 min-h-[44px] border text-sm font-medium transition-colors ${formData.preferredContact.includes(method.value)
                              ? 'border-ink-900 bg-ink-900 text-white'
                              : 'border-ink-200 bg-white text-ink-600 hover:border-ink-900 hover:text-ink-900'
                            }`}
                        >
                          {method.label}
                        </button>
                      ))}
                    </div>
                    {formData.preferredContact.length === 0 && (
                      <p className="text-xs text-red-600 mt-1">
                        Izaberite najmanje jedan način kontakta
                      </p>
                    )}
                  </div>

                  {error && (
                    <div role="alert" className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn-secondary flex-1 min-h-[44px] disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      Otkaži
                    </button>
                    <button
                      type="submit"
                      className="btn-primary flex-1 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSubmitting || formData.preferredContact.length === 0}
                    >
                      {isSubmitting ? 'Slanje...' : 'Pošalji upit'}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
