'use server';

import { revalidatePath } from 'next/cache';
import { normalizeInquiryStatus } from '@/lib/crm/inquiry-status';
import { inquiryRepository } from '@/lib/repositories/inquiry-repository';

function normalizeNotes(value: FormDataEntryValue | null) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .trim();
}

function normalizeDate(value: FormDataEntryValue | null) {
  const normalized = String(value || '').trim();

  if (!normalized) {
    return null;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
}

export async function updateLeadAction(formData: FormData) {
  const id = String(formData.get('id') || '').trim();

  if (!id) {
    throw new Error('Lead ID nedostaje.');
  }

  await inquiryRepository.updateLead(id, {
    status: normalizeInquiryStatus(String(formData.get('status') || 'new')),
    nextContactDate: normalizeDate(formData.get('nextContactDate')),
    notes: normalizeNotes(formData.get('notes')),
  });

  revalidatePath('/crm');
}
