import { Inquiry, InquiryStatus } from '@/types';

export type InquiryStatusMeta = {
  value: InquiryStatus;
  label: string;
  description: string;
  chipClassName: string;
  sectionClassName: string;
};

export const inquiryStatusFlow: InquiryStatusMeta[] = [
  {
    value: 'new',
    label: 'Novi leadovi',
    description: 'Sveži upiti koji još čekaju prvi odgovor.',
    chipClassName: 'bg-slate-100 text-slate-700 border border-slate-200',
    sectionClassName: 'border-slate-200 bg-slate-50',
  },
  {
    value: 'contacted',
    label: 'Kontaktirani',
    description: 'Kupac je kontaktiran i razgovor je otvoren.',
    chipClassName: 'bg-sky-100 text-sky-700 border border-sky-200',
    sectionClassName: 'border-sky-200 bg-sky-50',
  },
  {
    value: 'qualified',
    label: 'Kvalifikovani',
    description: 'Lead ima realan potencijal i sledeći korak je jasan.',
    chipClassName: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
    sectionClassName: 'border-indigo-200 bg-indigo-50',
  },
  {
    value: 'offer_sent',
    label: 'Ponuda poslata',
    description: 'Ponuda ili okvirna cena su već poslati kupcu.',
    chipClassName: 'bg-amber-100 text-amber-800 border border-amber-200',
    sectionClassName: 'border-amber-200 bg-amber-50',
  },
  {
    value: 'negotiation',
    label: 'Pregovori',
    description: 'Lead je aktivan i razgovor je u završnoj fazi.',
    chipClassName: 'bg-orange-100 text-orange-800 border border-orange-200',
    sectionClassName: 'border-orange-200 bg-orange-50',
  },
  {
    value: 'won',
    label: 'Dobijeno',
    description: 'Prodaja je uspešno zatvorena.',
    chipClassName: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    sectionClassName: 'border-emerald-200 bg-emerald-50',
  },
  {
    value: 'lost',
    label: 'Izgubljeno',
    description: 'Lead je izgubljen ili je kupac odustao.',
    chipClassName: 'bg-rose-100 text-rose-700 border border-rose-200',
    sectionClassName: 'border-rose-200 bg-rose-50',
  },
  {
    value: 'closed',
    label: 'Zatvoreno',
    description: 'Legacy zatvoren lead bez jasne win/loss oznake.',
    chipClassName: 'bg-stone-100 text-stone-700 border border-stone-200',
    sectionClassName: 'border-stone-200 bg-stone-50',
  },
];

export const inquiryStatusMap = Object.fromEntries(
  inquiryStatusFlow.map((status) => [status.value, status])
) as Record<InquiryStatus, InquiryStatusMeta>;

export const closedInquiryStatuses: InquiryStatus[] = ['won', 'lost', 'closed'];

export function normalizeInquiryStatus(status?: string | null): InquiryStatus {
  const fallback: InquiryStatus = 'new';

  if (!status) {
    return fallback;
  }

  const normalized = status.trim().toLowerCase() as InquiryStatus;
  return inquiryStatusMap[normalized] ? normalized : fallback;
}

export function isClosedInquiryStatus(status: InquiryStatus) {
  return closedInquiryStatuses.includes(status);
}

export function getFollowUpState(inquiry: Inquiry, today: string) {
  if (!inquiry.nextContactDate || isClosedInquiryStatus(inquiry.status)) {
    return 'none' as const;
  }

  if (inquiry.nextContactDate < today) {
    return 'overdue' as const;
  }

  if (inquiry.nextContactDate === today) {
    return 'today' as const;
  }

  return 'upcoming' as const;
}
