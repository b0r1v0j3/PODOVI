import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('disabled CRM route contract', () => {
  it('has no page or server-action entrypoint behind the middleware response', () => {
    const executableEntrypoints = [
      'app/crm/page.tsx',
      'app/crm/actions.ts',
    ].filter((relativePath) => existsSync(resolve(process.cwd(), relativePath)));

    expect(executableEntrypoints).toEqual([]);
  });

  it('keeps the public contact endpoint and has no public inquiry mail endpoint', () => {
    expect(existsSync(resolve(process.cwd(), 'app/api/contact/route.ts'))).toBe(true);
    // Uklonjeno 26.11.2026 (odluka vlasnika): javni POST je slao mejl sa našeg Gmail-a na adrese iz zahteva.
    expect(existsSync(resolve(process.cwd(), 'app/api/inquiries/route.ts'))).toBe(false);
  });

  it('sends mail only to the site admin, never to an address taken from a request', () => {
    const mailer = readFileSync(resolve(process.cwd(), 'lib/mailer/mailer.ts'), 'utf8');
    const recipients = Array.from(mailer.matchAll(/\b(to|cc|bcc):\s*([^,\r\n]+)/g), (match) => match[2].trim());

    expect(recipients).toEqual(['this.adminEmail']);
  });
});
