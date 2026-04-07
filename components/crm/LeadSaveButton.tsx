'use client';

import { useFormStatus } from 'react-dom';

type LeadSaveButtonProps = {
  className?: string;
};

export default function LeadSaveButton({ className = '' }: LeadSaveButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70 ${className}`.trim()}
    >
      {pending ? 'Čuvam...' : 'Sačuvaj lead'}
    </button>
  );
}
