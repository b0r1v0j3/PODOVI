import { NextRequest } from 'next/server';
import { getMiddlewareMatchers } from 'next/dist/build/analysis/get-page-static-info';
import { getMiddlewareRouteMatcher } from 'next/dist/shared/lib/router/utils/middleware-route-matcher';
import { describe, expect, it } from 'vitest';
import { config, middleware } from '@/middleware';

const EXPECTED_MATCHERS = [
  '/data/((?!documents_index\\.json$|tarkett_documents_index\\.json$).*)',
  '/crm/:path*',
  '/api/ops/:path*',
  '/proizvodi/allegro',
];

describe('middleware runtime contract', () => {
  it('registers only paths that actually need middleware work', () => {
    expect(config.matcher).toEqual(EXPECTED_MATCHERS);
  });

  it.each([
    ['/data/lvt_colors_complete.json', true],
    ['/crm', true],
    ['/crm/leads', true],
    ['/api/ops', true],
    ['/api/ops/change-sets', true],
    ['/proizvodi/allegro', true],
    ['/proizvodi/allegro/', true],
    ['/data/documents_index.json', false],
    ['/data/tarkett_documents_index.json', false],
    ['/proizvodi/tarkett-lajsne-za-stepenice', false],
    ['/_next/static/chunks/app.js', false],
    ['/_next/image', false],
    ['/favicon.ico', false],
    ['/robots.txt', false],
  ] as const)('matches %s = %s through the Next 14 matcher parser', (pathname, expected) => {
    const parsedMatchers = getMiddlewareMatchers(config.matcher, {});
    const matches = getMiddlewareRouteMatcher(parsedMatchers);

    expect(matches(pathname, {} as never, {})).toBe(expected);
  });

  it.each([
    ['GET', '/crm'],
    ['GET', '/crm/leads'],
    ['POST', '/crm'],
  ] as const)('returns 404 for disabled CRM access: %s %s', (method, pathname) => {
    const response = middleware(
      new NextRequest(`https://www.podovi.online${pathname}`, { method })
    );

    expect(response.status).toBe(404);
    expect(response.headers.get('x-middleware-next')).toBeNull();
    expect(response.headers.get('cache-control')).toBe('private, no-store, max-age=0');
  });

  it('blocks private catalog JSON while preserving the public document indexes', () => {
    const blockedResponse = middleware(
      new NextRequest('https://www.podovi.online/data/lvt_colors_complete.json')
    );
    const allowedResponse = middleware(
      new NextRequest('https://www.podovi.online/data/documents_index.json')
    );

    expect(blockedResponse.status).toBe(403);
    expect(blockedResponse.headers.get('x-middleware-next')).toBeNull();
    expect(allowedResponse.status).toBe(200);
    expect(allowedResponse.headers.get('x-middleware-next')).toBe('1');
  });

  it('keeps the Allegro invalid-color canonical redirect', () => {
    const response = middleware(
      new NextRequest('https://www.podovi.online/proizvodi/allegro?color=nepostojeca-boja')
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://www.podovi.online/proizvodi/allegro?color=hrast-essence-2-strip'
    );
  });
});
