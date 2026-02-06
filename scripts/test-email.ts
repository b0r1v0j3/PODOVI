// Test script to verify email sending works
// Run with: npx ts-node --esm scripts/test-email.ts

import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const GMAIL_USER = process.env.GMAIL_USER || 'prodaja@podovi.online';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

if (!GMAIL_APP_PASSWORD) {
    console.error('❌ GMAIL_APP_PASSWORD is not set in .env.local');
    process.exit(1);
}

console.log('📧 Testing email configuration...');
console.log(`User: ${GMAIL_USER}`);
console.log(`Password: ${'*'.repeat(16)}`);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
    },
});

async function testEmail() {
    try {
        // Create a dummy inquiry object conforming to the Inquiry interface
        const dummyInquiry: any = {
            id: 'TEST-123456',
            productId: 'prod-123',
            productName: 'Hrast Natur Klasik',
            productSku: 'LAMINAT-007',
            productUrl: 'https://podovi.online/proizvodi/laminat-hrast',
            productImage: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=300&h=300',
            productCategory: 'Laminat 12mm',
            fullName: 'Test Korisnik',
            phone: '064 123 4567',
            email: GMAIL_USER, // Send to self
            city: 'Novi Sad',
            quantityM2: 55.5,
            message: 'Da li imate ovaj laminat na stanju u većoj količini? Treba mi za sutra.',
            preferredContact: ['email', 'call'],
            status: 'new',
            createdAt: new Date(),
        };

        console.log('\n📨 Sending enhanced test email...');

        // Copying the HTML structure from mailer.ts for testing directly
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
            
            <div style="display: flex; gap: 20px; align-items: flex-start;">
              ${dummyInquiry.productImage ? `
                <div style="flex-shrink: 0;">
                  <img src="${dummyInquiry.productImage}" alt="${dummyInquiry.productName}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1;">
                </div>
              ` : ''}
              
              <div>
                <p style="margin: 0 0 5px 0;"><strong>Naziv:</strong> <span style="font-size: 16px; color: #111827;">${dummyInquiry.productName}</span></p>
                <p style="margin: 0 0 5px 0;"><strong>SKU:</strong> ${dummyInquiry.productSku || 'N/A'}</p>
                ${dummyInquiry.productCategory ? `<p style="margin: 0 0 5px 0;"><strong>Tip:</strong> ${dummyInquiry.productCategory}</p>` : ''}
                ${dummyInquiry.quantityM2 ? `<p style="margin: 0 0 5px 0;"><strong>Količina:</strong> <span style="background: #dbeafe; padding: 2px 6px; border-radius: 4px; color: #1e40af; font-weight: bold;">${dummyInquiry.quantityM2} m²</span></p>` : ''}
                
                ${dummyInquiry.productUrl ? `
                  <div style="margin-top: 15px;">
                    <a href="${dummyInquiry.productUrl}" style="background-color: #2563eb; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block;">
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
              <p style="margin: 5px 0;"><strong>Ime i prezime:</strong> ${dummyInquiry.fullName}</p>
              <p style="margin: 5px 0;"><strong>Grad:</strong> ${dummyInquiry.city}</p>
              <p style="margin: 5px 0;"><strong>Telefon:</strong> <a href="tel:${dummyInquiry.phone}" style="color: #2563eb; text-decoration: none;">${dummyInquiry.phone}</a></p>
              <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${dummyInquiry.email}" style="color: #2563eb; text-decoration: none;">${dummyInquiry.email}</a></p>
            </div>
            <p style="margin: 15px 0 0 0;"><strong>Preferirani kontakt:</strong> ${dummyInquiry.preferredContact.map((c: any) => `
              <span style="background: #f3f4f6; color: #4b5563; padding: 2px 8px; border-radius: 12px; font-size: 13px; border: 1px solid #d1d5db; margin-right: 5px;">${c}</span>
            `).join('')}</p>
          </div>
          
          <div style="background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; border-left: 4px solid #2563eb;">
            <h3 style="margin-top: 0; color: #3730a3; font-size: 16px;">✉️ Poruka klijenta</h3>
            <p style="white-space: pre-wrap; margin-bottom: 0; color: #4b5563;">${dummyInquiry.message}</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
            <p>ID upita: ${dummyInquiry.id} • Vreme: ${new Date().toLocaleString('sr-RS', { timeZone: 'Europe/Belgrade' })}</p>
          </div>
        </div>
      </div>
    `;

        const result = await transporter.sendMail({
            from: `"Podovi Test" <${GMAIL_USER}>`,
            to: GMAIL_USER, // Send to self for testing
            subject: `🧪 Test Enhanced Email: ${dummyInquiry.productName}`,
            html,
        });

        console.log('✅ Enhanced test email sent successfully!');
        console.log(`Message ID: ${result.messageId}`);
        console.log(`\n📬 Check inbox at: ${GMAIL_USER}`);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testEmail();
