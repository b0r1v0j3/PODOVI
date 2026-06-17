// lib/configurator/essence-quote.ts
import type { EssenceSelection, EssenceOption } from './types';

type CompleteSelection = { [K in keyof EssenceSelection]: EssenceOption };

export function isComplete(sel: EssenceSelection): sel is CompleteSelection {
  return Boolean(sel.uzorak && sel.boja && sel.gradacija && sel.obrada);
}

export function buildEssenceName(sel: EssenceSelection): string | null {
  return sel.uzorak ? `Essence Premium ${sel.uzorak.name}` : null;
}

export function buildEssenceCode(sel: EssenceSelection): string | null {
  if (!isComplete(sel)) return null;
  return `${sel.uzorak.code}-${sel.boja.code}${sel.gradacija.code}${sel.obrada.code}`;
}

export function buildInquiryHref(sel: EssenceSelection): string | null {
  if (!isComplete(sel)) return null;
  const params = new URLSearchParams({
    konfigurator: 'essence',
    name: `Essence Premium ${sel.uzorak.name}`,
    uzorak: sel.uzorak.name,
    boja: sel.boja.name,
    gradacija: sel.gradacija.name,
    obrada: sel.obrada.name,
    sifra: buildEssenceCode(sel)!,
  });
  return `/upiti?${params.toString()}`;
}
