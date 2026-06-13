// Izolovan mejler za potrebe stranice /cenovnik.
// Šalje SA podovi@konzorcijum.com preko Resend-a (domen konzorcijum.com verifikovan
// na Resend nalogu). Ako RESEND_API_KEY nije postavljen, koristi postojeći Gmail/SMTP
// kao fallback (sa gmail adresom kao pošiljaocem), a u krajnjem slučaju samo loguje.
// NAMERNO ne dira postojeći lib/mailer/mailer.ts (upiti/kontakt ostaju na Gmail-u).

import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { PriceSubmissionPayload } from '@/types';
import { formatNum } from '@/lib/cenovnik/vat';

export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

const KONZORCIJUM_FROM = process.env.CENOVNIK_FROM_EMAIL || 'podovi@konzorcijum.com';
const FROM_NAME = 'Podovi';

/** Escape korisničkog unosa pre umetanja u HTML mejla (sprečava HTML/JS injekciju). */
function escapeHtml(s: string | null | undefined): string {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function notifyTo(): string {
  // Obaveštenja o unosu cena idu vlasniku na lični mejl.
  return process.env.CENOVNIK_NOTIFY_EMAIL || 'cvetkovicborivoje@gmail.com';
}

function gmailFrom(): string {
  return process.env.ADMIN_EMAIL || process.env.GMAIL_USER || 'podovidoo@gmail.com';
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: MailAttachment[];
}

let resendClient: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

let gmailTransport: nodemailer.Transporter | null = null;
function getGmailTransport(): nodemailer.Transporter | null {
  if (!process.env.GMAIL_APP_PASSWORD) return null;
  if (!gmailTransport) {
    gmailTransport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || 'podovidoo@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return gmailTransport;
}

async function sendMail(args: SendArgs): Promise<void> {
  const resend = getResend();
  if (resend) {
    const { error } = await resend.emails.send({
      from: `${FROM_NAME} <${KONZORCIJUM_FROM}>`,
      to: args.to,
      subject: args.subject,
      html: args.html,
      replyTo: args.replyTo,
      attachments: args.attachments?.map((a) => ({ filename: a.filename, content: a.content })),
    });
    if (error) throw new Error(`Resend error: ${error.message || JSON.stringify(error)}`);
    console.log('✅ Cenovnik mejl poslat (Resend):', args.subject);
    return;
  }

  const transport = getGmailTransport();
  if (transport) {
    await transport.sendMail({
      from: `"${FROM_NAME}" <${gmailFrom()}>`,
      to: args.to,
      subject: args.subject,
      html: args.html,
      replyTo: args.replyTo,
      attachments: args.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });
    console.log('✅ Cenovnik mejl poslat (Gmail fallback):', args.subject);
    return;
  }

  console.log('📧 [MOCK] Cenovnik mejl (nije konfigurisan transport):', args.subject, '→', args.to);
}

// ------------------------------------------------------------------
// 1) Obaveštenje vlasniku o novom unosu cena (na pregled/odobravanje)
// ------------------------------------------------------------------
export interface PriceSubmissionNotificationInput {
  id: string;
  submittedBy: string;
  payload: PriceSubmissionPayload;
  note?: string;
  tags?: string[];
  file?: MailAttachment | null;
}

function priceCell(base?: number | null, withVat?: number | null): string {
  if ((base === null || base === undefined) && (withVat === null || withVat === undefined)) {
    return '<span style="color:#9ca3af">—</span>';
  }
  return `${formatNum(base ?? null) || '—'} / ${formatNum(withVat ?? null) || '—'}`;
}

export function buildPriceSubmissionEmailHtml(input: PriceSubmissionNotificationInput): string {
  const { payload } = input;
  const priced = (payload.collections || []).filter(
    (c) => c.base != null || c.withVat != null || (c.colorOverrides && c.colorOverrides.length > 0)
  );
  const overrideCount = priced.reduce((sum, c) => sum + (c.colorOverrides?.length || 0), 0);

  const rows = priced
    .map((c) => {
      const overrides = (c.colorOverrides || [])
        .map(
          (o) =>
            `<div style="font-size:12px;color:#555;padding-left:12px">↳ ${escapeHtml(
              o.colorName || o.colorSlug
            )}: ${priceCell(o.base, o.withVat)}</div>`
        )
        .join('');
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:13px">
          <strong>${escapeHtml(c.brandName || '')}</strong> — ${escapeHtml(c.collectionName)}
          <span style="color:#9ca3af">(${escapeHtml(c.categoryName || c.categorySlug)})</span>
          ${overrides}
        </td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:13px;text-align:right;white-space:nowrap">
          ${priceCell(c.base, c.withVat)}
        </td>
      </tr>`;
    })
    .join('');

  const tags = (input.tags || []).filter(Boolean);

  const html = `
  <div style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:680px;margin:0 auto;color:#111">
    <h2 style="font-size:20px;margin:0 0 4px">Novi unos cena za pregled</h2>
    <p style="color:#555;margin:0 0 18px">Tatjana je poslala cene. <strong>Ništa nije objavljeno</strong> — pregledaj i ručno odobri.</p>

    <div style="border:1px solid #e5e5e5;padding:14px 16px;margin-bottom:16px">
      <div style="font-size:13px;color:#555">ID unosa: <code>${input.id}</code></div>
      <div style="font-size:13px;color:#555">Kolekcija sa cenom: <strong>${priced.length}</strong> · Posebne cene po boji: <strong>${overrideCount}</strong></div>
      <div style="font-size:13px;color:#555">PDV stopa: <strong>${Math.round(payload.vatRate * 100)}%</strong></div>
      ${input.file ? `<div style="font-size:13px;color:#16794f">📎 Priložen cenovnik: <strong>${escapeHtml(input.file.filename)}</strong></div>` : ''}
    </div>

    ${
      input.note
        ? `<div style="border-left:3px solid #111;padding:8px 14px;margin-bottom:16px;background:#fafafa">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#888;margin-bottom:4px">Poruka</div>
            <div style="font-size:14px;white-space:pre-wrap">${escapeHtml(input.note)}</div>
          </div>`
        : ''
    }

    ${
      tags.length
        ? `<div style="margin-bottom:16px">${tags
            .map(
              (t) =>
                `<span style="display:inline-block;border:1px solid #ddd;padding:3px 10px;font-size:12px;margin:0 6px 6px 0">${escapeHtml(t)}</span>`
            )
            .join('')}</div>`
        : ''
    }

    ${
      rows
        ? `<table style="width:100%;border-collapse:collapse;border-top:1px solid #e5e5e5">
            <thead><tr>
              <th style="text-align:left;padding:6px 10px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#888">Kolekcija</th>
              <th style="text-align:right;padding:6px 10px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#888">Bez / Sa PDV</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>`
        : '<p style="color:#888">Nije uneta nijedna cena u tabelu (možda je poslat samo priloženi cenovnik).</p>'
    }

    <p style="font-size:12px;color:#9ca3af;margin-top:24px">Podovi · automatsko obaveštenje sa stranice /cenovnik</p>
  </div>`;
  return html;
}

export async function sendPriceSubmissionNotification(
  input: PriceSubmissionNotificationInput
): Promise<void> {
  const priced = (input.payload.collections || []).filter(
    (c) => c.base != null || c.withVat != null || (c.colorOverrides && c.colorOverrides.length > 0)
  );
  await sendMail({
    to: notifyTo(),
    subject: `Cenovnik — novi unos (${priced.length} kolekcija)`,
    html: buildPriceSubmissionEmailHtml(input),
    replyTo: notifyTo(),
    attachments: input.file ? [input.file] : undefined,
  });
}

// ------------------------------------------------------------------
// 2) Onboarding mejl Tatjani (kredencijali + SEO/AI pitch)
// ------------------------------------------------------------------
export interface VendorOnboardingInput {
  to: string;
  username: string;
  password: string;
  url: string;
  pitchHtml?: string;
}

export function defaultOnboardingPitchHtml(): string {
  return `
    <h3 style="font-size:16px;margin:24px 0 8px">Zašto su cene presudne za sajt</h3>
    <p style="font-size:14px;line-height:1.7;color:#333">
      Pretraživači (Google) i AI asistenti (ChatGPT, Gemini, Copilot) sajtove sa <strong>kompletnim cenama</strong>
      tretiraju kao „kompletne" i rangiraju ih znatno više. Sajtovi bez cena spadaju u grupu
      <strong>nepotpunih</strong> — slabije se rangiraju, retko ih AI preporučuje, i imaju minimalan organski (besplatan) saobraćaj.
    </p>
    <p style="font-size:14px;line-height:1.7;color:#333">
      Procene za kompletan katalog sa cenama su drastične:
    </p>
    <table style="width:100%;border-collapse:collapse;margin:8px 0 16px">
      <tr>
        <td style="border:1px solid #eee;padding:10px;font-size:13px">Organske posete</td>
        <td style="border:1px solid #eee;padding:10px;font-size:13px;text-align:right"><strong>do 100×–1000×</strong> više</td>
      </tr>
      <tr>
        <td style="border:1px solid #eee;padding:10px;font-size:13px">AI preporuke proizvoda</td>
        <td style="border:1px solid #eee;padding:10px;font-size:13px;text-align:right"><strong>višestruko</strong> veće</td>
      </tr>
      <tr>
        <td style="border:1px solid #eee;padding:10px;font-size:13px">Upiti i prodaja</td>
        <td style="border:1px solid #eee;padding:10px;font-size:13px;text-align:right">prate rast saobraćaja</td>
      </tr>
    </table>
    <p style="font-size:14px;line-height:1.7;color:#333">
      Drugim rečima — bez cena sav ovaj potencijal ostaje neiskorišćen. Unos cena je najbrži korak
      sa najvećim efektom.
    </p>`;
}

export function buildOnboardingEmailHtml(input: VendorOnboardingInput): string {
  const pitch = input.pitchHtml ?? defaultOnboardingPitchHtml();
  return `
  <div style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:640px;margin:0 auto;color:#111">
    <h2 style="font-size:22px;margin:0 0 6px">Unos cena — Podovi</h2>
    <p style="font-size:15px;line-height:1.7;color:#333">Poštovana Tatjana,</p>
    <p style="font-size:15px;line-height:1.7;color:#333">
      Pripremili smo posebnu stranicu gde lako možete uneti cene proizvoda. Stranica je privatna
      (nije nigde na sajtu) i ništa što unesete ne ide odmah na sajt — sve prvo dolazi nama na pregled.
    </p>

    <div style="border:1px solid #111;padding:16px 18px;margin:18px 0">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#888;margin-bottom:8px">Pristup</div>
      <div style="font-size:15px;margin-bottom:4px">Link: <a href="${escapeHtml(input.url)}" style="color:#111">${escapeHtml(input.url)}</a></div>
      <div style="font-size:15px;margin-bottom:4px">Korisničko ime: <strong>${escapeHtml(input.username)}</strong></div>
      <div style="font-size:15px">Lozinka: <strong>${escapeHtml(input.password)}</strong></div>
    </div>

    <h3 style="font-size:16px;margin:20px 0 8px">Kako funkcioniše</h3>
    <ul style="font-size:14px;line-height:1.8;color:#333;padding-left:18px">
      <li>Unesite cenu <strong>bez PDV-a</strong> ili <strong>sa PDV-om</strong> — druga se računa sama.</li>
      <li>Cena se unosi po kolekciji; ako neka boja ima drugačiju cenu, štiklirajte je i unesite posebno.</li>
      <li>Možete i da <strong>otpremite ceo cenovnik</strong> (PDF/Excel) — mi ćemo izvući cene.</li>
      <li>Možete i da <strong>preuzmete praznu tabelu</strong> i popunite je van sajta.</li>
    </ul>

    ${pitch}

    <p style="font-size:14px;line-height:1.7;color:#333;margin-top:20px">
      Ako bilo šta zatreba, slobodno zovite Borivoja.
    </p>
    <p style="font-size:12px;color:#9ca3af;margin-top:20px">Borivoje · podovi@konzorcijum.com</p>
  </div>`;
}

export async function sendVendorOnboarding(input: VendorOnboardingInput): Promise<void> {
  await sendMail({
    to: input.to,
    subject: 'Unos cena na sajtu — pristup i uputstvo',
    html: buildOnboardingEmailHtml(input),
    replyTo: notifyTo(),
  });
}
