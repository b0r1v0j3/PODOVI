import { existsSync } from 'node:fs';
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

  it('keeps the public inquiry and contact endpoints in place', () => {
    expect(existsSync(resolve(process.cwd(), 'app/api/contact/route.ts'))).toBe(true);
    expect(existsSync(resolve(process.cwd(), 'app/api/inquiries/route.ts'))).toBe(true);
  });
});
