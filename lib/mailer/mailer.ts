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
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #374151;">
        <div style="background-color: #2563eb; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h2 style="color: white; margin: 0; font-size: 24px;">🏠 Novi upit za proizvod</h2>
        </div>
        
        <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; padding: 30px;">
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
            <h3 style="margin-top: 0; color: #1e40af; font-size: 18px; border-bottom: 1px solid #cbd5e1; padding-bottom: 10px; margin-bottom: 15px;">
              📦 Informacije o proizvodu
            </h3>
            
            <div style="display: flex; align-items: flex-start;">
              ${inquiry.productImage ? `
                <div style="flex-shrink: 0; margin-right: 24px;">
                  <img src="${inquiry.productImage}" alt="${inquiry.productName}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1;">
                </div>
              ` : ''}
              
              <div>
                <p style="margin: 0 0 5px 0;"><strong>Naziv:</strong> <span style="font-size: 16px; color: #111827;">${inquiry.productName}</span></p>
                <p style="margin: 0 0 5px 0;"><strong>SKU:</strong> ${inquiry.productSku || 'N/A'}</p>
                ${inquiry.productCategory ? `<p style="margin: 0 0 5px 0;"><strong>Tip:</strong> ${inquiry.productCategory}</p>` : ''}
                ${inquiry.quantityM2 ? `<p style="margin: 0 0 5px 0;"><strong>Količina:</strong> <span style="background: #dbeafe; padding: 2px 6px; border-radius: 4px; color: #1e40af; font-weight: bold;">${inquiry.quantityM2} m²</span></p>` : ''}
                
                ${inquiry.productUrl ? `
                  <div style="margin-top: 20px;">
                    <a href="${inquiry.productUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block;">
                      Pogledaj proizvod na sajtu →
                    </a>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #e5e7eb;">
            <h3 style="margin-top: 0; color: #374151; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 15px;">
              👤 Podaci o klijentu
            </h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <p style="margin: 5px 0;"><strong>Ime i prezime:</strong> ${inquiry.fullName}</p>
              <p style="margin: 5px 0;"><strong>Grad:</strong> ${inquiry.city}</p>
              <p style="margin: 5px 0;"><strong>Telefon:</strong> <a href="tel:${inquiry.phone}" style="color: #2563eb; text-decoration: none;">${inquiry.phone}</a></p>
              <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${inquiry.email}" style="color: #2563eb; text-decoration: none;">${inquiry.email}</a></p>
            </div>
            <p style="margin: 15px 0 0 0;"><strong>Preferirani kontakt:</strong> ${inquiry.preferredContact.map(c => `
              <span style="background: #f3f4f6; color: #4b5563; padding: 2px 8px; border-radius: 12px; font-size: 13px; border: 1px solid #d1d5db; margin-right: 5px;">${c}</span>
            `).join('')}</p>
          </div>
          
          <div style="background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; border-left: 4px solid #2563eb;">
            <h3 style="margin-top: 0; color: #3730a3; font-size: 16px;">✉️ Poruka klijenta</h3>
            <p style="white-space: pre-wrap; margin-bottom: 0; color: #4b5563;">${inquiry.message}</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
            <p>ID upita: ${inquiry.id} • Vreme: ${new Date().toLocaleString('sr-RS', { timeZone: 'Europe/Belgrade' })}</p>
          </div>
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"Podovi - Upiti" <${this.adminEmail}>`,
      to: this.adminEmail,
      replyTo: inquiry.email,
      subject: `🏠 Novi upit: ${inquiry.productName} (${inquiry.fullName})`,
      html,
    });

    console.log('✅ Email poslat adminu za upit:', inquiry.id);
  }

  async sendInquiryConfirmation(inquiry: Inquiry): Promise<void> {
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #374151;">
        <div style="text-align: center; padding: 30px 0;">
          <h2 style="color: #2563eb; font-size: 28px; margin: 0;">Hvala na Vašem upitu!</h2>
          <p style="font-size: 16px; color: #6b7280; margin-top: 10px;">Potvrđujemo prijem vašeg upita.</p>
        </div>
        
        <div style="background: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <p>Poštovani/a <strong>${inquiry.fullName}</strong>,</p>
          
          <p>Uspešno smo primili Vaš upit za proizvod. Naš tim prodaje će Vas kontaktirati u najkraćem mogućem roku putem izabranog kanala (${inquiry.preferredContact.join(' ili ')}).</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #edf2f7; display: flex; gap: 20px;">
            ${inquiry.productImage ? `
              <div style="flex-shrink: 0;">
                <img src="${inquiry.productImage}" alt="${inquiry.productName}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1;">
              </div>
            ` : ''}
            <div>
              <p style="margin: 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Proizvod</p>
              <h3 style="margin: 4px 0 8px 0; color: #0f172a; font-size: 18px;">${inquiry.productName}</h3>
              <div style="font-size: 14px; color: #475569;">
                ${inquiry.quantityM2 ? `<span>Količina: <strong>${inquiry.quantityM2} m²</strong></span>` : ''}
              </div>
            </div>
          </div>
          
          <p>Ukoliko imate bilo kakvih dodatnih pitanja u međuvremenu, slobodno nas pozovite ili pišite.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0;"><strong>Kontakt prodaje:</strong></p>
            <ul style="list-style: none; padding: 0; margin-top: 10px;">
              <li style="margin-bottom: 8px;">📧 <a href="mailto:prodaja@podovi.online" style="color: #2563eb; text-decoration: none;">prodaja@podovi.online</a></li>
              <li>📞 <a href="tel:+381641234567" style="color: #2563eb; text-decoration: none;">064 123 4567</a></li>
            </ul>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Podovi doo. Sva prava zadržana.</p>
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"Podovi Podrška" <${this.adminEmail}>`,
      to: inquiry.email,
      subject: `Potvrda prijema upita - ${inquiry.productName}`,
      html,
    });

    console.log('✅ Potvrda poslata klijentu:', inquiry.email);
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
