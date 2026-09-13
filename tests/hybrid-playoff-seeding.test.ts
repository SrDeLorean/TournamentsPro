import { describe, expect, it } from 'vitest';
import { buildHybridPlayoffSeedAssignments, type HybridSeedMatch } from '../src/features/competitions/classification/hybrid-playoff-seeding';

function groupMatch(overrides: Partial<HybridSeedMatch>): HybridSeedMatch {
  return {
    id: 'g-a-1', groupName: 'Grupo A', roundName: null, matchday: 1, status: 'TERMINADO',
    homeTeamId: 'a1', homeTeamName: 'Alpha', homeTeamTag: 'ALP', scoreHome: 3,
    awayTeamId: 'a2', awayTeamName: 'Atlas', awayTeamTag: 'ATL', scoreAway: 0,
    ...overrides,
  };
}

describe('hybrid playoff seeding', () => {
  const finishedGroups: HybridSeedMatch[] = [
    groupMatch({ id: 'ga', groupName: 'Grupo A' }),
    groupMatch({ id: 'gb', groupName: 'Grupo B', homeTeamId: 'b1', homeTeamName: 'Bravo', homeTeamTag: 'BRA', awayTeamId: 'b2', awayTeamName: 'Boreal', awayTeamTag: 'BOR', scoreHome: 2, scoreAway: 0 }),
  ];

  it('waits until every league-stage match is official', () => {
    const result = buildHybridPlayoffSeedAssignments([
      ...finishedGroups,
      groupMatch({ id: 'pending', groupName: 'Grupo A', status: 'PENDIENTE' }),
    ], 2);
    expect(result.ready).toBe(false);
    expect(result.assignments).toEqual([]);
  });

  it('crosses first and second places and keeps both legs in one series', () => {
    const result = buildHybridPlayoffSeedAssignments([
      ...finishedGroups,
      groupMatch({ id: 'p-r1-m1-ida', groupName: null, roundName: 'Semifinales (Ida)', matchday: 2, status: 'PENDIENTE', homeTeamId: null, homeTeamName: '1° de Grupo A', homeTeamTag: null, scoreHome: null, awayTeamId: null, awayTeamName: '2° de Grupo B', awayTeamTag: null, scoreAway: null }),
      groupMatch({ id: 'p-r1-m1-vuelta', groupName: null, roundName: 'Semifinales (Vuelta)', matchday: 3, status: 'PENDIENTE', homeTeamId: null, homeTeamName: '2° de Grupo B', homeTeamTag: null, scoreHome: null, awayTeamId: null, awayTeamName: '1° de Grupo A', awayTeamTag: null, scoreAway: null }),
      groupMatch({ id: 'p-r1-m2-ida', groupName: null, roundName: 'Semifinales (Ida)', matchday: 2, status: 'PENDIENTE', homeTeamId: null, homeTeamName: '1° de Grupo B', homeTeamTag: null, scoreHome: null, awayTeamId: null, awayTeamName: '2° de Grupo A', awayTeamTag: null, scoreAway: null }),
      groupMatch({ id: 'p-r1-m2-vuelta', groupName: null, roundName: 'Semifinales (Vuelta)', matchday: 3, status: 'PENDIENTE', homeTeamId: null, homeTeamName: '2° de Grupo A', homeTeamTag: null, scoreHome: null, awayTeamId: null, awayTeamName: '1° de Grupo B', awayTeamTag: null, scoreAway: null }),
    ], 2);

    expect(result.ready).toBe(true);
    expect(result.assignments).toHaveLength(2);
    expect(result.assignments[0]).toMatchObject({
      matchIds: ['p-r1-m1-ida', 'p-r1-m1-vuelta'],
      home: { id: 'a1', name: 'Alpha' },
      away: { id: 'b2', name: 'Boreal' },
    });
  });

  it('resolves best runner-up (Mejor 2°) for 3 groups with 1 qualifier to complete 4-team playoff', () => {
    const threeGroups: HybridSeedMatch[] = [
      groupMatch({ id: 'ga', groupName: 'Grupo A', homeTeamId: 'a1', homeTeamName: 'Alpha', scoreHome: 3, awayTeamId: 'a2', awayTeamName: 'Atlas', scoreAway: 0 }),
      groupMatch({ id: 'gb', groupName: 'Grupo B', homeTeamId: 'b1', homeTeamName: 'Bravo', scoreHome: 2, awayTeamId: 'b2', awayTeamName: 'Boreal', scoreAway: 0 }),
      groupMatch({ id: 'gc', groupName: 'Grupo C', homeTeamId: 'c1', homeTeamName: 'Charlie', scoreHome: 1, awayTeamId: 'c2', awayTeamName: 'Cosmos', scoreAway: 0 }),
      // Playoff matches (Semifinales)
      groupMatch({ id: 'p-r1-m1', groupName: null, roundName: 'Semifinales', matchday: 2, status: 'PENDIENTE', homeTeamId: null, homeTeamName: '1° de Grupo A', awayTeamId: null, awayTeamName: 'Mejor 2°' }),
      groupMatch({ id: 'p-r1-m2', groupName: null, roundName: 'Semifinales', matchday: 2, status: 'PENDIENTE', homeTeamId: null, homeTeamName: '1° de Grupo B', awayTeamId: null, awayTeamName: '1° de Grupo C' }),
    ];

    const result = buildHybridPlayoffSeedAssignments(threeGroups, 1);
    expect(result.ready).toBe(true);
    expect(result.assignments).toHaveLength(2);

    // M1: 1° Grupo A (Alpha) vs Mejor 2° (Cosmos: -1 DG vs Boreal -2 and Atlas -3)
    expect(result.assignments[0]).toMatchObject({
      matchIds: ['p-r1-m1'],
      home: { id: 'a1', name: 'Alpha' },
      away: { id: 'c2', name: 'Cosmos' },
    });

    // M2: 1° Grupo B (Bravo) vs 1° Grupo C (Charlie)
    expect(result.assignments[1]).toMatchObject({
      matchIds: ['p-r1-m2'],
      home: { id: 'b1', name: 'Bravo' },
      away: { id: 'c1', name: 'Charlie' },
    });
  });
});
