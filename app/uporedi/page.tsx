import { Metadata } from 'next';
import ComparePageClient from './ComparePageClient';

export const metadata: Metadata = {
    title: 'Uporedi proizvode | Podovi',
    description: 'Uporedite podne obloge jedan pored drugog — specifikacije, cene i karakteristike.',
};

export default function ComparePage() {
    return <ComparePageClient />;
}
