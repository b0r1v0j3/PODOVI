import { ContactFormData } from '@/types';
import nodemailer from 'nodemailer';

export interface IMailer {
  sendContactEmail(contact: ContactFormData): Promise<void>;
}

// Real email implementation using Nodemailer with Gmail SMTP
export class EmailMailer implements IMailer {
  private transporter: nodemailer.Transporter;
  private adminEmail: string;

  constructor() {
    this.adminEmail = process.env.ADMIN_EMAIL || 'podovidoo@gmail.com';

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || 'podovidoo@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password (not regular password)
      },
    });
  }

  async sendContactEmail(contact: ContactFormData): Promise<void> {
    const isProductInquiry = !!contact.productName;

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #374151;">
        <div style="background-color: ${isProductInquiry ? '#2563eb' : '#4b5563'}; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h2 style="color: white; margin: 0; font-size: 24px;">${isProductInquiry ? '🏠 Upit za proizvod' : '📬 Nova kontakt poruka'}</h2>
        </div>
        
        <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; padding: 30px;">
          
          ${isProductInquiry ? `
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
            <h3 style="margin-top: 0; color: #1e40af; font-size: 18px; border-bottom: 1px solid #cbd5e1; padding-bottom: 10px; margin-bottom: 15px;">
              � Informacije o proizvodu
            </h3>
            
            <div style="display: flex; align-items: flex-start;">
              ${contact.productImage ? `
                <div style="flex-shrink: 0; margin-right: 24px;">
                  <img src="${contact.productImage}" alt="${contact.productName}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1;">
                </div>
              ` : ''}
              
              <div>
                <p style="margin: 0 0 8px 0;"><strong>Naziv:</strong> <span style="font-size: 16px; color: #111827;">${contact.productName}</span></p>
                ${contact.productCategory ? `<p style="margin: 0 0 8px 0;"><strong>Tip:</strong> ${contact.productCategory}</p>` : ''}
                
                ${contact.productUrl ? `
                  <div style="margin-top: 20px;">
                    <a href="${contact.productUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block;">
                      Pogledaj proizvod na sajtu →
                    </a>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
          ` : ''}

          <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #e5e7eb;">
            <h3 style="margin-top: 0; color: #374151; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 15px;">
              👤 Podaci o pošiljaocu
            </h3>
            <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
              <p style="margin: 5px 0;"><strong>Ime i prezime:</strong> ${contact.fullName}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${contact.email}" style="color: #2563eb; text-decoration: none;">${contact.email}</a></p>
              <p style="margin: 5px 0;"><strong>Telefon:</strong> <a href="tel:${contact.phone}" style="color: #2563eb; text-decoration: none;">${contact.phone}</a></p>
              ${!isProductInquiry ? `<p style="margin: 5px 0;"><strong>Tema:</strong> ${contact.subject}</p>` : ''}
            </div>
          </div>
          
          <div style="background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; border-left: 4px solid ${isProductInquiry ? '#2563eb' : '#4b5563'};">
            <h3 style="margin-top: 0; color: #3730a3; font-size: 16px;">✉️ Poruka</h3>
            <p style="white-space: pre-wrap; margin-bottom: 0; color: #4b5563;">${contact.message}</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
            <p>Vreme: ${new Date().toLocaleString('sr-RS', { timeZone: 'Europe/Belgrade' })}</p>
          </div>
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"Podovi - Kontakt" <${this.adminEmail}>`,
      to: this.adminEmail,
      replyTo: contact.email,
      subject: isProductInquiry
        ? `🏠 Upit za: ${contact.productName} (${contact.fullName})`
        : `📬 Kontakt: ${contact.subject} - ${contact.fullName}`,
      html,
    });

    console.log('✅ Kontakt email poslat:', contact.email);
  }
}

// Mock implementation for development/testing
export class MockMailer implements IMailer {
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
