import { describe, expect, it } from 'vitest';

import {
  buildIdentityWarnings,
  buildRecentActivity,
  normalizeCompetitiveId,
} from '@/lib/dashboard-insights';

describe('dashboard insights', () => {
  it('normalizes accents and separators without losing the identifier meaning', () => {
    expect(normalizeCompetitiveId(' Jón-Chiko_123 ')).toBe('jonchiko123');
  });

  it('detects visual impersonation globally and inside the same discipline', () => {
    const warnings = buildIdentityWarnings([
      { id: '1', name: 'Jon', gamertag: 'jonchiko123', primaryGameSlug: 'eafc26', gameProfiles: { valorant: { gameId: 'JonChiko' } } },
      { id: '2', name: 'Fake', gamertag: 'jonchik0123', primaryGameSlug: 'eafc26', gameProfiles: { valorant: { gameId: 'J0nChiko' } } },
    ]);

    expect(warnings.some((warning) => warning.scope === 'global')).toBe(true);
    expect(warnings.some((warning) => warning.scope === 'game' && warning.gameSlug === 'valorant')).toBe(true);
  });

  it('does not compare game identifiers from different disciplines or duplicate pairs', () => {
    const warnings = buildIdentityWarnings([
      { id: '1', name: 'One', gamertag: 'alphaOne', primaryGameSlug: 'eafc26', gameProfiles: { valorant: { gameId: 'SharedId' } } },
      { id: '2', name: 'Two', gamertag: 'otherTwo', primaryGameSlug: 'lol', gameProfiles: { lol: { gameId: 'SharedId' } } },
    ]);

    expect(warnings).toHaveLength(0);
  });

  it('builds day, week and month activity windows from real dates', () => {
    const now = new Date('2026-09-04T12:00:00.000Z');
    const activity = buildRecentActivity([
      '2026-09-04T10:00:00.000Z',
      '2026-09-01T10:00:00.000Z',
      '2026-08-15T10:00:00.000Z',
      null,
    ], now);

    expect(activity).toEqual({ day: 1, week: 2, month: 3 });
  });
});
