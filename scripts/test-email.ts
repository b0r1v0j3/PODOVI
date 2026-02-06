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
        // Verify connection
        console.log('\n🔄 Verifying SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP connection successful!');

        // Send test email
        console.log('\n📨 Sending test email...');
        const result = await transporter.sendMail({
            from: `"Podovi Test" <${GMAIL_USER}>`,
            to: GMAIL_USER, // Send to self for testing
            subject: '🧪 Test email - Podovi sistem radi!',
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #2563eb;">✅ Email sistem uspešno konfigurisan!</h2>
          <p>Ovaj email potvrđuje da je email sistem za Podovi sajt ispravno podešen.</p>
          <p><strong>Vreme testa:</strong> ${new Date().toLocaleString('sr-RS', { timeZone: 'Europe/Belgrade' })}</p>
          <hr>
          <p style="color: #6b7280; font-size: 12px;">Ovo je automatski generisan test email.</p>
        </div>
      `,
        });

        console.log('✅ Test email sent successfully!');
        console.log(`Message ID: ${result.messageId}`);
        console.log(`\n📬 Check inbox at: ${GMAIL_USER}`);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testEmail();
