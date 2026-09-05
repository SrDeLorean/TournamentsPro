import { describe, expect, it } from 'vitest';

import { buildPublicPortalSummary } from '@/lib/public-home-summary';

const users = [
  { id: 'u1', role: 'Jugador', isBanned: false },
  { id: 'u2', role: 'Administrador', isBanned: false },
  { id: 'u3', role: 'Jugador', isBanned: true },
];
const organizations = [{ id: 'o1', name: 'Liga Roja', tag: 'LR', country: 'CL', allowedGames: ['eafc26'], isBanned: false }];
const teams = [{ id: 't1', name: 'Rojo FC', tag: 'RFC', gameSlug: 'eafc26', organizationId: 'o1', membersCount: 11, logoUrl: null, isBanned: false }];
const competitions = [{ id: 'c1', name: 'Liga Uno', gameSlug: 'eafc26', organizationId: 'o1', status: 'EN_CURSO', modeFormat: '11v11', fechaInicio: '2026-09-01' }];
const matches = [
  { id: 'm1', competitionId: 'c1', teamHomeId: 't1', teamAwayId: null, homeTeamName: 'Rojo FC', awayTeamName: 'Azul FC', scoreHome: 2, scoreAway: 1, scheduledAt: '2026-09-04T20:00:00Z', status: 'FINALIZADO' },
];

describe('public portal summary', () => {
  it('filters banned and administrative accounts from public totals', () => {
    const summary = buildPublicPortalSummary({ users, organizations, teams, competitions, matches });
    expect(summary.counts.users).toBe(1);
    expect(summary.counts.organizations).toBe(1);
    expect(summary.counts.teams).toBe(1);
  });

  it('scopes every public collection to the requested game', () => {
    const summary = buildPublicPortalSummary({ users, organizations, teams, competitions, matches }, 'valorant');
    expect(summary.counts.teams).toBe(0);
    expect(summary.competitions).toHaveLength(0);
    expect(summary.matches).toHaveLength(0);
  });

  it('joins matches with their competition and organization without exposing private user data', () => {
    const summary = buildPublicPortalSummary({ users, organizations, teams, competitions, matches }, 'eafc26');
    expect(summary.matches[0]).toMatchObject({ competitionName: 'Liga Uno', organizationName: 'Liga Roja', home: 'Rojo FC', score: '2 - 1' });
    expect(summary).not.toHaveProperty('emails');
  });

  it('does not publish drafts, disabled competitions or matches from sanctioned entities', () => {
    const summary = buildPublicPortalSummary({
      users,
      organizations: [...organizations, { id: 'o2', name: 'Oculta', tag: 'OC', country: 'CL', allowedGames: ['eafc26'], isBanned: true }],
      teams: [...teams, { id: 't2', name: 'Bloqueado', tag: 'BLQ', gameSlug: 'eafc26', organizationId: 'o2', membersCount: 10, logoUrl: null, isBanned: true }],
      competitions: [...competitions, { id: 'draft', name: 'Secreto', gameSlug: 'eafc26', organizationId: 'o1', status: 'Borrador', modeFormat: '5v5', fechaInicio: '2026-10-01' }],
      matches: [...matches, { id: 'hidden', competitionId: 'draft', teamHomeId: 't2', teamAwayId: 't1', homeTeamName: 'Bloqueado', awayTeamName: 'Rojo FC', scoreHome: null, scoreAway: null, scheduledAt: '2026-10-01', status: 'PROGRAMADO' }],
    }, 'eafc26');
    expect(summary.competitions.map((competition) => competition.id)).not.toContain('draft');
    expect(summary.matches.map((match) => match.id)).not.toContain('hidden');
  });
});
