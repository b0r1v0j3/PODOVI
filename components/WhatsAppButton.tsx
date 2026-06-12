'use client';

import { FaWhatsapp } from 'react-icons/fa';
import { useCompare } from '@/lib/context/CompareContext';

export default function WhatsAppButton() {
  const { compareItems } = useCompare();
  const phoneNumber = '38163299444'; // Format without + for WhatsApp URL
  const message = encodeURIComponent('Pozdrav! Zanima me vaš katalog podnih obloga, lajsni i otirača.');
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  // Kada je CompareBar vidljiv (~68px na dnu), podigni dugme na desktopu da ga ne prekrije
  const desktopOffset = compareItems.length > 0 ? 'md:bottom-24' : 'md:bottom-6';

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-20 ${desktopOffset} right-4 md:right-8 z-40 flex h-12 w-12 items-center justify-center bg-[#25D366] text-white transition-colors duration-200 hover:bg-[#20BA5A] group`}
      aria-label="Kontaktirajte nas na WhatsApp"
    >
      <FaWhatsapp className="text-2xl" />
      <span className="absolute right-14 bg-ink-900 text-white px-3 py-2 text-[13px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        Pošaljite poruku
      </span>
    </a>
  );
}
