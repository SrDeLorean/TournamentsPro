import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('competition management page authorization', () => {
  it('performs a secure competition-scope check before loading management data', () => {
    const routeSource = readFileSync(
      new URL('../src/app/dashboard/competencias/[id]/page.tsx', import.meta.url),
      'utf8',
    );
    const source = readFileSync(
      new URL('../src/features/competitions/pages/competition-detail-page.tsx', import.meta.url),
      'utf8',
    );
    const guard = source.indexOf('await requireCompetitionManager(id)');
    const dataLoad = source.indexOf('await getCompetitionDetails(id)');

    expect(guard).toBeGreaterThan(-1);
    expect(dataLoad).toBeGreaterThan(guard);
    expect(routeSource).toContain("@/features/competitions/pages/competition-detail-page");
  });
});
