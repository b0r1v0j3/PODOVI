// Jednokratna skripta: šalje Tatjani onboarding mejl (pristup + uputstvo + SEO/AI pitch).
//
// Pokretanje (iz PODOVI/):
//   npx tsx scripts/send-tatjana-onboarding.ts tatjana@primer.com
//
// Potrebno (u .env / .env.local ili Vercel env):
//   RESEND_API_KEY        — da bi mejl išao SA podovi@konzorcijum.com
//   (opciono) CENOVNIK_URL, CENOVNIK_USER, CENOVNIK_PASS
//
// Bez RESEND_API_KEY-a pada na Gmail fallback (from neće biti konzorcijum) ili mock.

import 'dotenv/config';
import { sendVendorOnboarding } from '@/lib/mailer/cenovnik-mailer';

async function main() {
  const to = process.argv[2] || process.env.TATJANA_EMAIL;
  if (!to) {
    console.error('Upotreba: npx tsx scripts/send-tatjana-onboarding.ts <email>');
    console.error('   (ili postavi TATJANA_EMAIL u .env)');
    process.exit(1);
  }

  const url = process.env.CENOVNIK_URL || 'https://www.podovi.online/cenovnik';
  const username = process.env.CENOVNIK_USER || 'podovi';
  const password = process.env.CENOVNIK_PASS || 'online';

  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠  RESEND_API_KEY nije postavljen — mejl NEĆE ići sa podovi@konzorcijum.com.');
  }

  console.log(`Šaljem onboarding mejl na: ${to}`);
  console.log(`Link: ${url}  |  korisnik: ${username}  |  lozinka: ${password}`);

  await sendVendorOnboarding({ to, username, password, url });
  console.log('✅ Gotovo.');
}

main().catch((err) => {
  console.error('Greška pri slanju:', err?.message || err);
  process.exit(1);
});
