import type { Metadata } from 'next';
import LeadSaveButton from '@/components/crm/LeadSaveButton';
import {
  getFollowUpState,
  inquiryStatusFlow,
  inquiryStatusMap,
  isClosedInquiryStatus,
} from '@/lib/crm/inquiry-status';
import { inquiryRepository } from '@/lib/repositories/inquiry-repository';
import { hasSupabaseServiceRoleConfig } from '@/lib/supabase/client';
import { Inquiry, PreferredContact } from '@/types';
import { updateLeadAction } from './actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'CRM | Podovi.online',
  description: 'Interni CRM pregled leadova i prodajnog toka.',
  robots: {
    index: false,
    follow: false,
  },
};

const dateFormatter = new Intl.DateTimeFormat('sr-RS', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const preferredContactLabels: Record<PreferredContact, string> = {
  call: 'Poziv',
  email: 'Email',
  viber: 'Viber',
  whatsapp: 'WhatsApp',
};

function getBelgradeToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Belgrade',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function formatPreferredContacts(methods: PreferredContact[]) {
  if (!methods.length) {
    return 'Nije označeno';
  }

  return methods.map((method) => preferredContactLabels[method]).join(', ');
}

function formatQuantity(value?: number) {
  if (!value) {
    return null;
  }

  return `${value.toLocaleString('sr-RS')} m²`;
}

function sortLeads(leads: Inquiry[], today: string) {
  return [...leads].sort((left, right) => {
    const leftState = getFollowUpState(left, today);
    const rightState = getFollowUpState(right, today);
    const priority = { overdue: 0, today: 1, upcoming: 2, none: 3 };

    if (priority[leftState] !== priority[rightState]) {
      return priority[leftState] - priority[rightState];
    }

    if (left.nextContactDate && right.nextContactDate && left.nextContactDate !== right.nextContactDate) {
      return left.nextContactDate.localeCompare(right.nextContactDate);
    }

    if (left.nextContactDate && !right.nextContactDate) {
      return -1;
    }

    if (!left.nextContactDate && right.nextContactDate) {
      return 1;
    }

    return right.createdAt.getTime() - left.createdAt.getTime();
  });
}

function getFollowUpBadge(inquiry: Inquiry, today: string) {
  const state = getFollowUpState(inquiry, today);

  if (state === 'overdue') {
    return {
      label: `Kasni od ${inquiry.nextContactDate}`,
      className: 'border border-rose-200 bg-rose-50 text-rose-700',
    };
  }

  if (state === 'today') {
    return {
      label: 'Follow-up danas',
      className: 'border border-amber-200 bg-amber-50 text-amber-800',
    };
  }

  if (state === 'upcoming') {
    return {
      label: `Sledeći kontakt ${inquiry.nextContactDate}`,
      className: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }

  if (isClosedInquiryStatus(inquiry.status)) {
    return {
      label: 'Lead zatvoren',
      className: 'border border-stone-200 bg-stone-50 text-stone-600',
    };
  }

  return {
    label: 'Bez zakazanog follow-up-a',
    className: 'border border-slate-200 bg-slate-50 text-slate-600',
  };
}

function SummaryCard({
  title,
  value,
  helper,
}: {
  title: string;
  value: number;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{helper}</p>
    </div>
  );
}

function LeadCard({ inquiry, today }: { inquiry: Inquiry; today: string }) {
  const statusMeta = inquiryStatusMap[inquiry.status];
  const followUpBadge = getFollowUpBadge(inquiry, today);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          {inquiry.productImage ? (
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <img
                src={inquiry.productImage}
                alt={inquiry.productName || 'Lead proizvod'}
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.chipClassName}`}>
                {statusMeta.label}
              </span>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${followUpBadge.className}`}>
                {followUpBadge.label}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {inquiry.fullName}
              </h3>
              <p className="text-sm text-slate-600">
                {inquiry.city || 'Grad nije unet'} · {dateFormatter.format(inquiry.createdAt)}
              </p>
            </div>

            <div className="space-y-1 text-sm text-slate-700">
              <p>
                <span className="font-medium text-slate-900">Proizvod:</span>{' '}
                {inquiry.productName || 'Opšti upit'}
              </p>
              {inquiry.productCategory ? (
                <p>
                  <span className="font-medium text-slate-900">Kategorija:</span>{' '}
                  {inquiry.productCategory}
                </p>
              ) : null}
              {formatQuantity(inquiry.quantityM2) ? (
                <p>
                  <span className="font-medium text-slate-900">Količina:</span>{' '}
                  {formatQuantity(inquiry.quantityM2)}
                </p>
              ) : null}
              <p>
                <span className="font-medium text-slate-900">Kontakt:</span>{' '}
                {formatPreferredContacts(inquiry.preferredContact)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={`tel:${inquiry.phone}`}
            className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-primary-300 hover:text-primary-700"
          >
            Pozovi
          </a>
          <a
            href={`mailto:${inquiry.email}`}
            className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-primary-300 hover:text-primary-700"
          >
            Email
          </a>
          {inquiry.productUrl ? (
            <a
              href={inquiry.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-primary-300 hover:text-primary-700"
            >
              Otvori proizvod
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="mb-2 text-sm font-semibold text-slate-900">Originalni upit</p>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {inquiry.message || 'Poruka nije ostavljena.'}
          </p>
          <div className="mt-3 grid gap-1 text-sm text-slate-600">
            <p>
              <span className="font-medium text-slate-900">Telefon:</span> {inquiry.phone}
            </p>
            <p>
              <span className="font-medium text-slate-900">Email:</span> {inquiry.email}
            </p>
          </div>
        </div>

        <form action={updateLeadAction} className="space-y-4 rounded-xl border border-slate-200 p-4">
          <input type="hidden" name="id" value={inquiry.id} />

          <div>
            <label htmlFor={`status-${inquiry.id}`} className="mb-1 block text-sm font-medium text-slate-700">
              Status leada
            </label>
            <select
              id={`status-${inquiry.id}`}
              name="status"
              defaultValue={inquiry.status}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              {inquiryStatusFlow.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={`next-contact-${inquiry.id}`} className="mb-1 block text-sm font-medium text-slate-700">
              Sledeći kontakt
            </label>
            <input
              id={`next-contact-${inquiry.id}`}
              type="date"
              name="nextContactDate"
              defaultValue={inquiry.nextContactDate || ''}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>

          <div>
            <label htmlFor={`notes-${inquiry.id}`} className="mb-1 block text-sm font-medium text-slate-700">
              Beleške
            </label>
            <textarea
              id={`notes-${inquiry.id}`}
              name="notes"
              rows={5}
              defaultValue={inquiry.notes || ''}
              placeholder="Šta je dogovoreno, šta poslati, kada zvati ponovo..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>

          <LeadSaveButton className="w-full" />
        </form>
      </div>
    </article>
  );
}

export default async function CrmPage() {
  const hasServiceRole = hasSupabaseServiceRoleConfig();
  const today = getBelgradeToday();
  const inquiries = hasServiceRole ? await inquiryRepository.findAll() : [];
  const openLeads = inquiries.filter((inquiry) => !isClosedInquiryStatus(inquiry.status));
  const overdueFollowUps = openLeads.filter((inquiry) => getFollowUpState(inquiry, today) === 'overdue');
  const dueToday = openLeads.filter((inquiry) => getFollowUpState(inquiry, today) === 'today');

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="container py-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600">
              Interni CRM
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
              Leadovi i osnovni sales flow za Podovi
            </h1>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              Ovo je prvi radni skeleton iznad postojećih product inquiry upita: vidiš sve leadove,
              vodiš ih kroz status, planiraš sledeći kontakt i zapisuješ interne beleške bez
              paralelnog sistema van sajta.
            </p>
          </div>

          <div className="rounded-2xl border border-primary-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            CRM trenutno čita postojeću `inquiries` bazu i dodaje joj `status`, `sledeći kontakt`
            i `beleške`.
          </div>
        </div>

        {!hasServiceRole ? (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            `SUPABASE_SERVICE_ROLE_KEY` nije dostupan u okruženju, pa CRM može da se otvori ali ne
            može da učita leadove iz baze. Kada env bude prisutan, ista stranica odmah postaje
            operativna.
          </div>
        ) : null}

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <SummaryCard
            title="Ukupno leadova"
            value={inquiries.length}
            helper="Svi product inquiry upiti koji su do sada stigli kroz sajt."
          />
          <SummaryCard
            title="Follow-up danas"
            value={dueToday.length}
            helper="Leadovi koje bi trebalo ispratiti u toku dana."
          />
          <SummaryCard
            title="Kasneći follow-up"
            value={overdueFollowUps.length}
            helper="Otvoreni leadovi kojima je sledeći kontakt već probijen."
          />
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          {inquiryStatusFlow.map((status) => {
            const count = inquiries.filter((inquiry) => inquiry.status === status.value).length;

            return (
              <div
                key={status.value}
                className={`rounded-full px-4 py-2 text-sm font-medium ${status.chipClassName}`}
              >
                {status.label}: {count}
              </div>
            );
          })}
        </div>

        <div className="space-y-6">
          {inquiryStatusFlow.map((status) => {
            const leads = sortLeads(
              inquiries.filter((inquiry) => inquiry.status === status.value),
              today
            );

            return (
              <section
                key={status.value}
                className={`rounded-3xl border p-5 ${status.sectionClassName}`}
              >
                <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{status.label}</h2>
                    <p className="text-sm text-slate-600">{status.description}</p>
                  </div>
                  <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm">
                    {leads.length} lead{leads.length === 1 ? '' : 'a'}
                  </span>
                </div>

                {leads.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center text-sm text-slate-500">
                    Trenutno nema leadova u ovoj fazi.
                  </div>
                ) : (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {leads.map((inquiry) => (
                      <LeadCard key={inquiry.id} inquiry={inquiry} today={today} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-600 shadow-sm">
          Sledeći praktičan korak je da ovaj skeleton dobije zaštitu pristupa i istoriju pojedinačnih
          aktivnosti po leadu. Za sada je fokus ostao na najkraćem putu do upotrebljivog pregleda i
          ručnog vođenja prodaje.
        </div>
      </div>
    </div>
  );
}
