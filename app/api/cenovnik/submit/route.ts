import { NextRequest, NextResponse } from 'next/server';
import { isValidSessionToken, CENOVNIK_COOKIE } from '@/lib/cenovnik/auth';
import { createPriceSubmission } from '@/lib/repositories/price-submission-repository';
import { sendPriceSubmissionNotification, MailAttachment } from '@/lib/mailer/cenovnik-mailer';
import { VAT_RATE } from '@/lib/cenovnik/vat';
import { PriceSubmissionPayload } from '@/types';

export const runtime = 'nodejs';

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizePayload(raw: any): PriceSubmissionPayload {
  const vatRate = typeof raw?.vatRate === 'number' && raw.vatRate > 0 ? raw.vatRate : VAT_RATE;
  const collections = Array.isArray(raw?.collections)
    ? raw.collections
        .map((c: any) => ({
          collectionSlug: String(c?.collectionSlug || ''),
          collectionName: String(c?.collectionName || c?.collectionSlug || ''),
          categorySlug: String(c?.categorySlug || ''),
          categoryName: c?.categoryName ? String(c.categoryName) : undefined,
          brandId: String(c?.brandId || ''),
          brandName: c?.brandName ? String(c.brandName) : undefined,
          base: num(c?.base),
          withVat: num(c?.withVat),
          colorOverrides: Array.isArray(c?.colorOverrides)
            ? c.colorOverrides
                .map((o: any) => ({
                  colorSlug: String(o?.colorSlug || ''),
                  colorCode: o?.colorCode ? String(o.colorCode) : undefined,
                  colorName: o?.colorName ? String(o.colorName) : undefined,
                  base: num(o?.base),
                  withVat: num(o?.withVat),
                }))
                .filter((o: any) => o.colorSlug)
            : [],
        }))
        .filter((c: any) => c.collectionSlug)
    : [];
  return { vatRate, collections };
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(CENOVNIK_COOKIE)?.value;
  if (!isValidSessionToken(token)) {
    return NextResponse.json({ error: 'Neautorizovano' }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Neispravan zahtev (očekivan form-data)' }, { status: 400 });
  }

  let payload: PriceSubmissionPayload;
  try {
    payload = normalizePayload(JSON.parse(String(form.get('payload') || '{}')));
  } catch {
    return NextResponse.json({ error: 'Neispravan format podataka.' }, { status: 400 });
  }

  const noteRaw = form.get('note');
  const note = noteRaw ? String(noteRaw).slice(0, 5000) : undefined;

  let tags: string[] = [];
  try {
    const parsed = JSON.parse(String(form.get('tags') || '[]'));
    if (Array.isArray(parsed)) tags = parsed.map((t) => String(t)).filter(Boolean).slice(0, 50);
  } catch {
    tags = [];
  }

  // Opcioni priložen fajl (cenovnik) — ide kao prilog u mejlu vlasniku.
  let attachment: MailAttachment | null = null;
  const file = form.get('file');
  if (file && typeof file === 'object' && 'arrayBuffer' in (file as any)) {
    const f = file as File;
    const buf = Buffer.from(await f.arrayBuffer());
    if (buf.length > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'Fajl je prevelik (maksimum 15 MB).' }, { status: 400 });
    }
    if (buf.length > 0) {
      attachment = {
        filename: f.name || 'cenovnik',
        content: buf,
        contentType: f.type || undefined,
      };
    }
  }

  const hasPrices = payload.collections.some(
    (c) => c.base != null || c.withVat != null || (c.colorOverrides && c.colorOverrides.length > 0)
  );

  if (!hasPrices && !attachment && !note) {
    return NextResponse.json(
      { error: 'Unesite bar jednu cenu, priložite cenovnik ili napišite poruku.' },
      { status: 400 }
    );
  }

  // 1) Sačuvaj u bazu (best-effort — ne objavljuje se ništa)
  const saved = await createPriceSubmission({
    payload,
    note,
    tags,
    fileName: attachment?.filename,
    fileMime: attachment?.contentType,
  });
  const id = saved?.id || `local-${Date.now()}`;

  // 2) Pošalji obaveštenje vlasniku (sa priloženim cenovnikom ako postoji)
  let emailOk = false;
  try {
    await sendPriceSubmissionNotification({
      id,
      submittedBy: saved?.submittedBy || 'tatjana',
      payload,
      note,
      tags,
      file: attachment,
    });
    emailOk = true;
  } catch (err: any) {
    console.error('sendPriceSubmissionNotification error:', err?.message || err);
  }

  // Ako ni baza ni mejl nisu uspeli, javljamo grešku da se može pokušati ponovo.
  if (!saved && !emailOk) {
    return NextResponse.json(
      { error: 'Trenutno ne možemo da sačuvamo unos. Pokušajte ponovo za koji minut.' },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, id, emailSent: emailOk, saved: Boolean(saved) }, { status: 201 });
}
