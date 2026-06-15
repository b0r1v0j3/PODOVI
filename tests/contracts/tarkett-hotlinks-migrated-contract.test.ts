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
