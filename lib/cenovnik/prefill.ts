import { baseToWithVat, withVatToBase, parseNum, formatInput } from './vat';

export interface PricePair {
    base: string;
    withVat: string;
}

// Pred-popuni par cena iz postojeće cene SA PDV-om (katalog `price`, npr. Romus).
// "Sa PDV-om" = cena; "Bez PDV-a" = withVatToBase(cena). Prazno ako cene nema.
export function initialPricePair(existingPrice?: number): PricePair {
    if (typeof existingPrice !== 'number' || !(existingPrice > 0)) {
        return { base: '', withVat: '' };
    }
    return {
        base: formatInput(withVatToBase(existingPrice)),
        withVat: formatInput(existingPrice),
    };
}

// Da li je red promenjen u odnosu na pred-popunjenu cenu (SA PDV-om).
// Bez unosa → nije izmena. Bez baseline-a → svaki unos je izmena. Sa baseline-om →
// izmena samo ako se trenutna vrednost (SA PDV-om) razlikuje.
export function isCollectionChanged(current: PricePair, existingPrice?: number): boolean {
    const wv = parseNum(current?.withVat);
    const base = parseNum(current?.base);
    const cur = wv != null ? wv : base != null ? baseToWithVat(base) : null;
    if (cur == null) return false;
    if (typeof existingPrice !== 'number' || !(existingPrice > 0)) return true;
    return Math.abs(cur - existingPrice) > 0.001;
}
