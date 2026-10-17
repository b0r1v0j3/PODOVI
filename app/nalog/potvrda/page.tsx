import type { Metadata } from 'next';
import AuthConfirmation from '@/components/commerce/AuthConfirmation';

export const metadata: Metadata = { title: 'Potvrda mejla | Podovi', robots: { index: false, follow: false } };

export default function ConfirmAccountPage() {
  return <AuthConfirmation />;
}
