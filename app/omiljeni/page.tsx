import { Metadata } from 'next';
import FavoritesPageClient from './FavoritesPageClient';

export const metadata: Metadata = {
    title: 'Omiljeni proizvodi | Podovi',
    description: 'Vaši omiljeni proizvodi — sačuvajte podne obloge koje vam se dopadaju.',
};

export default function FavoritesPage() {
    return <FavoritesPageClient />;
}
