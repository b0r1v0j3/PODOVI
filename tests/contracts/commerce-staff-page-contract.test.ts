import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { middleware } from '@/middleware';

afterEach(() => vi.unstubAllEnvs());

describe('staff order page perimeter', () => {
  it('fails closed without staff authentication configuration, including descendants', () => {
    for (const name of ['OPS_BASIC_AUTH_USERNAME', 'OPS_BASIC_AUTH_PASSWORD', 'CRM_BASIC_AUTH_USERNAME', 'CRM_BASIC_AUTH_PASSWORD']) vi.stubEnv(name, '');
    for (const path of ['/ops/porudzbine', '/ops/porudzbine/details']) {
      const response = middleware(new NextRequest(`https://www.podovi.online${path}`));
      expect(response.status).toBe(503);
      expect(response.headers.get('x-middleware-next')).toBeNull();
      expect(response.headers.get('cache-control')).toContain('no-store');
    }
  });

  it('challenges unauthenticated access and only forwards valid credentials privately', () => {
    vi.stubEnv('OPS_BASIC_AUTH_USERNAME', 'staff'); vi.stubEnv('OPS_BASIC_AUTH_PASSWORD', 'test-only');
    const denied = middleware(new NextRequest('https://www.podovi.online/ops/porudzbine'));
    expect(denied.status).toBe(401);
    expect(denied.headers.get('www-authenticate')).toContain('Basic');
    const allowed = middleware(new NextRequest('https://www.podovi.online/ops/porudzbine', { headers: { Authorization: `Basic ${Buffer.from('staff:test-only').toString('base64')}` } }));
    expect(allowed.headers.get('x-middleware-next')).toBe('1');
    expect(allowed.headers.get('cache-control')).toContain('private, no-store');
  });
});
