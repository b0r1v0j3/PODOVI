import { Inquiry, ContactFormData } from '@/types';
import nodemailer from 'nodemailer';

export interface IMailer {
  sendInquiryEmail(inquiry: Inquiry): Promise<void>;
  sendContactEmail(contact: ContactFormData): Promise<void>;
  sendInquiryConfirmation(inquiry: Inquiry): Promise<void>;
}

// Real email implementation using Nodemailer with Gmail SMTP
export class EmailMailer implements IMailer {
  private transporter: nodemailer.Transporter;
  private adminEmail: string;

  constructor() {
    this.adminEmail = process.env.ADMIN_EMAIL || 'prodaja@podovi.online';

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || 'prodaja@podovi.online',
        pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password (not regular password)
      },
    });
  }

  async sendInquiryEmail(inquiry: Inquiry): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          🏠 Novi upit za proizvod
        </h2>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Podaci o klijentu</h3>
          <p><strong>Ime i prezime:</strong> ${inquiry.fullName}</p>
          <p><strong>Email:</strong> <a href="mailto:${inquiry.email}">${inquiry.email}</a></p>
          <p><strong>Telefon:</strong> <a href="tel:${inquiry.phone}">${inquiry.phone}</a></p>
          <p><strong>Grad:</strong> ${inquiry.city}</p>
          <p><strong>Preferirani kontakt:</strong> ${inquiry.preferredContact.join(', ')}</p>
        </div>
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #92400e;">Proizvod</h3>
          <p><strong>Naziv:</strong> ${inquiry.productName}</p>
          <p><strong>SKU:</strong> ${inquiry.productSku || 'N/A'}</p>
          ${inquiry.quantityM2 ? `<p><strong>Količina:</strong> ${inquiry.quantityM2} m²</p>` : ''}
          ${inquiry.productUrl ? `<p><a href="${inquiry.productUrl}" style="color: #2563eb;">Pogledaj proizvod →</a></p>` : ''}
        </div>
        
        <div style="background: #e0e7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #3730a3;">Poruka</h3>
          <p style="white-space: pre-wrap;">${inquiry.message}</p>
        </div>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          ID upita: ${inquiry.id}<br>
          Vreme: ${new Date().toLocaleString('sr-RS', { timeZone: 'Europe/Belgrade' })}
        </p>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"Podovi - Upiti" <${this.adminEmail}>`,
      to: this.adminEmail,
      replyTo: inquiry.email,
      subject: `🏠 Novi upit: ${inquiry.productName} - ${inquiry.fullName}`,
      html,
    });

    console.log('✅ Email poslat adminu za upit:', inquiry.id);
  }

  async sendInquiryConfirmation(inquiry: Inquiry): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          Hvala na Vašem upitu! 🏠
        </h2>
        
        <p>Poštovani <strong>${inquiry.fullName}</strong>,</p>
        
        <p>Vaš upit za proizvod <strong>${inquiry.productName}</strong> je uspešno primljen.</p>
        
        <p>Naš tim će Vas kontaktirati u najkraćem mogućem roku putem izabranog načina kontakta 
        (${inquiry.preferredContact.join(' ili ')}).</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Detalji Vašeg upita</h3>
          <p><strong>Proizvod:</strong> ${inquiry.productName}</p>
          ${inquiry.quantityM2 ? `<p><strong>Količina:</strong> ${inquiry.quantityM2} m²</p>` : ''}
          <p><strong>Vaša poruka:</strong></p>
          <p style="white-space: pre-wrap; color: #6b7280;">${inquiry.message}</p>
        </div>
        
        <p>Ukoliko imate dodatnih pitanja, slobodno nas kontaktirajte:</p>
        <ul>
          <li>Email: <a href="mailto:prodaja@podovi.online">prodaja@podovi.online</a></li>
          <li>Telefon: <a href="tel:+381641234567">064 123 4567</a></li>
        </ul>
        
        <p style="margin-top: 30px;">Srdačan pozdrav,<br><strong>Tim Podovi</strong></p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px;">
          Ovaj email je automatski generisan. Molimo ne odgovarajte direktno na ovu poruku.
        </p>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"Podovi" <${this.adminEmail}>`,
      to: inquiry.email,
      subject: `Potvrda upita - ${inquiry.productName}`,
      html,
    });

    console.log('✅ Potvrda poslata klijentu:', inquiry.email);
  }

  async sendContactEmail(contact: ContactFormData): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          📬 Nova kontakt poruka
        </h2>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Od:</strong> ${contact.fullName}</p>
          <p><strong>Email:</strong> <a href="mailto:${contact.email}">${contact.email}</a></p>
          <p><strong>Telefon:</strong> <a href="tel:${contact.phone}">${contact.phone}</a></p>
          <p><strong>Tema:</strong> ${contact.subject}</p>
        </div>
        
        <div style="background: #e0e7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #3730a3;">Poruka</h3>
          <p style="white-space: pre-wrap;">${contact.message}</p>
        </div>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          Vreme: ${new Date().toLocaleString('sr-RS', { timeZone: 'Europe/Belgrade' })}
        </p>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"Podovi - Kontakt" <${this.adminEmail}>`,
      to: this.adminEmail,
      replyTo: contact.email,
      subject: `📬 Kontakt: ${contact.subject} - ${contact.fullName}`,
      html,
    });

    console.log('✅ Kontakt email poslat:', contact.email);
  }
}

// Mock implementation for development/testing
export class MockMailer implements IMailer {
  async sendInquiryEmail(inquiry: Inquiry): Promise<void> {
    console.log('📧 [MOCK] Email poslat adminu:');
    console.log('---');
    console.log(`Od: ${inquiry.fullName} (${inquiry.email})`);
    console.log(`Proizvod: ${inquiry.productName}`);
    console.log('---');
  }

  async sendInquiryConfirmation(inquiry: Inquiry): Promise<void> {
    console.log('📧 [MOCK] Potvrda poslata klijentu:', inquiry.email);
  }

  async sendContactEmail(contact: ContactFormData): Promise<void> {
    console.log('📧 [MOCK] Kontakt email za:', contact.email);
  }
}

// Export the appropriate mailer based on environment configuration
// Use EmailMailer if GMAIL_APP_PASSWORD is set, otherwise use MockMailer
const hasEmailConfig = !!process.env.GMAIL_APP_PASSWORD;

export const mailer: IMailer = hasEmailConfig
  ? new EmailMailer()
  : new MockMailer();

// Log which mailer is being used (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log(`📧 Mailer: ${hasEmailConfig ? 'EmailMailer (SMTP)' : 'MockMailer (console only)'}`);
}
