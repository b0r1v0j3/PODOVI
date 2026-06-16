import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const pendingPath = path.join(DATA_DIR, 'tarkett-migration-pending.json');
const pending: Array<{ url: string; reason?: string }> = fs.existsSync(pendingPath)
  ? JSON.parse(fs.readFileSync(pendingPath, 'utf8'))
  : [];
const allowed = new Set(pending.map((p) => p.url));

describe('S4: Tarkett hotlinkovi migrirani (osim pending)', () => {
  it('nijedan media.tarkett-image.com URL u public/data osim onih u pending listi', () => {
    const offenders: string[] = [];
    for (const f of fs.readdirSync(DATA_DIR).filter((x) => x.endsWith('.json'))) {
      if (f === 'tarkett-migration-pending.json') continue;
      const s = fs.readFileSync(path.join(DATA_DIR, f), 'utf8');
      const urls = s.match(/https:\/\/media\.tarkett-image\.com\/[^\s"'\\)]+/g) || [];
      for (const u of urls) if (!allowed.has(u)) offenders.push(`${f}: ${u}`);
    }
    expect(offenders, `nemigrirani hotlinkovi van pending:\n${offenders.slice(0, 20).join('\n')}`).toEqual([]);
  });

  it('pending lista je mala (samo oversized + upstream-403, ne masovno)', () => {
    expect(pending.length).toBeLessThan(40);
  });

  it('pending su samo oversized ili 403/timeout/upload (ne tihi nepoznati propusti)', () => {
    const bad = pending.filter((p) => !/> limit|403|Timeout|Upload|nije PDF|HTTP [45]/.test(p.reason || ''));
    expect(bad.map((p) => p.reason), 'neočekivani razlozi u pending').toEqual([]);
  });
});

const gerflorPendingPath = path.join(DATA_DIR, 'gerflor-migration-pending.json');
const gerflorPending: Array<{ url: string }> = fs.existsSync(gerflorPendingPath)
  ? JSON.parse(fs.readFileSync(gerflorPendingPath, 'utf8'))
  : [];
const gerflorAllowed = new Set(gerflorPending.map((p) => p.url.split('?')[0]));

describe('S4: Gerflor cdn dokumenti migrirani (osim pending)', () => {
  // cdn.gerflor.com se javlja u public/data + lib/data/manual-collection-products.ts
  const files = [
    ...fs.readdirSync(DATA_DIR).filter((x) => x.endsWith('.json')).map((x) => path.join(DATA_DIR, x)),
    path.join(process.cwd(), 'lib', 'data', 'manual-collection-products.ts'),
  ];
  it('nijedan cdn.gerflor.com URL osim onih u gerflor pending listi', () => {
    const offenders: string[] = [];
    for (const fp of files) {
      if (!fs.existsSync(fp) || fp.endsWith('gerflor-migration-pending.json')) continue;
      const s = fs.readFileSync(fp, 'utf8');
      const urls = s.match(/https?:\/\/cdn\.gerflor\.com\/[^"'\\\n]+/g) || [];
      for (const u of urls) if (!gerflorAllowed.has(u.split('?')[0])) offenders.push(`${path.basename(fp)}: ${u}`);
    }
    expect(offenders, `nemigrirani gerflor hotlinkovi:\n${offenders.slice(0, 20).join('\n')}`).toEqual([]);
  });
});
