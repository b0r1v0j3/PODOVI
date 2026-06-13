import { PriceSubmission, PriceSubmissionPayload, PriceSubmissionStatus } from '@/types';
import { getServerSupabase, hasSupabaseServiceRoleConfig } from '@/lib/supabase/client';

export interface CreatePriceSubmissionInput {
  payload: PriceSubmissionPayload;
  note?: string;
  tags?: string[];
  fileName?: string;
  fileMime?: string;
  submittedBy?: string;
}

function toPriceSubmission(row: any): PriceSubmission {
  return {
    id: row.id,
    status: (row.status as PriceSubmissionStatus) || 'new',
    payload: row.payload || { vatRate: 0.2, collections: [] },
    note: row.note || undefined,
    tags: row.tags || [],
    fileName: row.file_name || undefined,
    fileMime: row.file_mime || undefined,
    submittedBy: row.submitted_by || 'tatjana',
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  };
}

/**
 * Upisuje submission u Supabase. Best-effort: ako baza nije konfigurisana ili upis
 * padne, vraća null (pozivalac svejedno šalje mejl-obaveštenje sa svim podacima).
 */
export async function createPriceSubmission(
  input: CreatePriceSubmissionInput
): Promise<PriceSubmission | null> {
  if (!hasSupabaseServiceRoleConfig()) return null;

  try {
    const client = getServerSupabase();
    const row = {
      status: 'new' as const,
      payload: input.payload,
      note: input.note || null,
      tags: input.tags || [],
      file_name: input.fileName || null,
      file_mime: input.fileMime || null,
      submitted_by: input.submittedBy || 'tatjana',
    };

    const { data, error } = await client
      .from('price_submissions')
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error('createPriceSubmission error:', error.message);
      return null;
    }

    console.log('✅ Price submission sačuvan u Supabase:', data.id);
    return toPriceSubmission(data);
  } catch (err: any) {
    console.error('createPriceSubmission unexpected error:', err?.message || err);
    return null;
  }
}

export async function listPriceSubmissions(): Promise<PriceSubmission[]> {
  if (!hasSupabaseServiceRoleConfig()) return [];
  try {
    const client = getServerSupabase();
    const { data, error } = await client
      .from('price_submissions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('listPriceSubmissions error:', error.message);
      return [];
    }
    return ((data as any[]) || []).map(toPriceSubmission);
  } catch {
    return [];
  }
}
