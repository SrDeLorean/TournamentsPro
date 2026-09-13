import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processMatchAutoAdvance } from '../src/lib/services/match-auto-advance';
import { dbProvider } from '../src/lib/db/provider';

describe('Match Auto-Advance & Consensus Reporting Logic', () => {
  const mockMatches: Record<string, any> = {};
  const mockCompetitions: Record<string, any> = {};

  beforeEach(() => {
    Object.keys(mockMatches).forEach((k) => delete mockMatches[k]);
    Object.keys(mockCompetitions).forEach((k) => delete mockCompetitions[k]);

    vi.spyOn(dbProvider.matches, 'findById').mockImplementation(async (id: string) => {
      return mockMatches[id] || null;
    });

    vi.spyOn(dbProvider.matches, 'update').mockImplementation(async (id: string, partial: any) => {
      if (mockMatches[id]) {
        mockMatches[id] = { ...mockMatches[id], ...partial };
      }
      return undefined;
    });

    vi.spyOn(dbProvider.matches, 'findByCompetition').mockImplementation(async (compId: string) => {
      return Object.values(mockMatches).filter(
        (m: any) => m.competitionId === compId || m.tournamentId === compId
      );
    });

    vi.spyOn(dbProvider.competitions, 'findById').mockImplementation(async (id: string) => {
      return mockCompetitions[id] || null;
    });
  });

  // 1. Single match playoff auto-advance
  it('auto-advances winner to next match in single elimination bracket (HOME slot)', async () => {
    mockMatches['m-semis-1'] = {
      id: 'm-semis-1',
      homeTeamId: 'team-alpha',
      homeTeamName: 'Alpha Esports',
      awayTeamId: 'team-beta',
      awayTeamName: 'Beta Gaming',
      scoreHome: 3,
      scoreAway: 1,
      winnerTeamId: 'team-alpha',
      status: 'FINALIZADO',
      nextMatchId: 'm-final-1',
      nextMatchSlot: 'HOME',
      competitionId: 'comp-100',
    };

    mockMatches['m-final-1'] = {
      id: 'm-final-1',
      homeTeamId: null,
      homeTeamName: 'Ganador SF1',
      awayTeamId: null,
      awayTeamName: 'Ganador SF2',
      status: 'PENDIENTE',
      competitionId: 'comp-100',
    };

    const result = await processMatchAutoAdvance('m-semis-1');

    expect(result.advanced).toBe(true);
    expect(mockMatches['m-final-1'].homeTeamId).toBe('team-alpha');
    expect(mockMatches['m-final-1'].homeTeamName).toBe('Alpha Esports');
    expect(mockMatches['m-final-1'].awayTeamId).toBeNull();
  });

  it('auto-advances winner to next match in single elimination bracket (AWAY slot)', async () => {
    mockMatches['m-semis-2'] = {
      id: 'm-semis-2',
      homeTeamId: 'team-gamma',
      homeTeamName: 'Gamma Team',
      awayTeamId: 'team-delta',
      awayTeamName: 'Delta Squad',
      scoreHome: 0,
      scoreAway: 2,
      winnerTeamId: 'team-delta',
      status: 'FINALIZADO',
      nextMatchId: 'm-final-1',
      nextMatchSlot: 'AWAY',
      competitionId: 'comp-100',
    };

    mockMatches['m-final-1'] = {
      id: 'm-final-1',
      homeTeamId: 'team-alpha',
      homeTeamName: 'Alpha Esports',
      awayTeamId: null,
      awayTeamName: 'Ganador SF2',
      status: 'PENDIENTE',
      competitionId: 'comp-100',
    };

    const result = await processMatchAutoAdvance('m-semis-2');

    expect(result.advanced).toBe(true);
    expect(mockMatches['m-final-1'].awayTeamId).toBe('team-delta');
    expect(mockMatches['m-final-1'].awayTeamName).toBe('Delta Squad');
  });

  // 2. Best of 3 (Bo3) series auto-advance and Game 3 cancellation
  it('does NOT advance prematurely when Bo3 series is 1-0', async () => {
    mockCompetitions['comp-bo3'] = { id: 'comp-bo3', format: 'Playoff', matchMode: 'MejorDe3' };

    mockMatches['m-series1-j1'] = {
      id: 'm-series1-j1',
      competitionId: 'comp-bo3',
      homeTeamId: 'team-t1',
      homeTeamName: 'T1',
      awayTeamId: 'team-gen',
      awayTeamName: 'Gen.G',
      scoreHome: 1,
      scoreAway: 0,
      winnerTeamId: 'team-t1',
      status: 'FINALIZADO',
      nextMatchId: 'm-grand-final',
      nextMatchSlot: 'HOME',
    };

    mockMatches['m-series1-j2'] = {
      id: 'm-series1-j2',
      competitionId: 'comp-bo3',
      homeTeamId: 'team-gen',
      homeTeamName: 'Gen.G',
      awayTeamId: 'team-t1',
      awayTeamName: 'T1',
      status: 'PENDIENTE',
    };

    mockMatches['m-series1-j3'] = {
      id: 'm-series1-j3',
      competitionId: 'comp-bo3',
      homeTeamId: 'team-t1',
      homeTeamName: 'T1',
      awayTeamId: 'team-gen',
      awayTeamName: 'Gen.G',
      status: 'PENDIENTE',
      nextMatchId: 'm-grand-final',
      nextMatchSlot: 'HOME',
    };

    mockMatches['m-grand-final'] = {
      id: 'm-grand-final',
      homeTeamId: null,
      awayTeamId: null,
      status: 'PENDIENTE',
    };

    const result = await processMatchAutoAdvance('m-series1-j1');

    expect(result.isBo3SeriesDefined).toBe(false);
    expect(result.advanced).toBe(false);
    expect(mockMatches['m-grand-final'].homeTeamId).toBeNull();
  });

  it('cancels Game 3 and advances series winner when Bo3 series is won 2-0', async () => {
    mockCompetitions['comp-bo3'] = { id: 'comp-bo3', format: 'Playoff', matchMode: 'MejorDe3' };

    mockMatches['m-series1-j1'] = {
      id: 'm-series1-j1',
      competitionId: 'comp-bo3',
      homeTeamId: 'team-t1',
      homeTeamName: 'T1',
      awayTeamId: 'team-gen',
      awayTeamName: 'Gen.G',
      scoreHome: 1,
      scoreAway: 0,
      winnerTeamId: 'team-t1',
      status: 'FINALIZADO',
    };

    mockMatches['m-series1-j2'] = {
      id: 'm-series1-j2',
      competitionId: 'comp-bo3',
      homeTeamId: 'team-gen',
      homeTeamName: 'Gen.G',
      awayTeamId: 'team-t1',
      awayTeamName: 'T1',
      scoreHome: 0,
      scoreAway: 1,
      winnerTeamId: 'team-t1',
      status: 'FINALIZADO',
      nextMatchId: 'm-grand-final',
      nextMatchSlot: 'HOME',
    };

    mockMatches['m-series1-j3'] = {
      id: 'm-series1-j3',
      competitionId: 'comp-bo3',
      homeTeamId: 'team-t1',
      homeTeamName: 'T1',
      awayTeamId: 'team-gen',
      awayTeamName: 'Gen.G',
      status: 'PENDIENTE',
      nextMatchId: 'm-grand-final',
      nextMatchSlot: 'HOME',
    };

    mockMatches['m-grand-final'] = {
      id: 'm-grand-final',
      homeTeamId: null,
      homeTeamName: 'Ganador SF1',
      awayTeamId: null,
      status: 'PENDIENTE',
    };

    const result = await processMatchAutoAdvance('m-series1-j2');

    expect(result.isBo3SeriesDefined).toBe(true);
    expect(result.game3Cancelled).toBe(true);
    expect(result.advanced).toBe(true);
    expect(mockMatches['m-series1-j3'].status).toBe('CANCELADO');
    expect(mockMatches['m-grand-final'].homeTeamId).toBe('team-t1');
    expect(mockMatches['m-grand-final'].homeTeamName).toBe('T1');
  });

  // 3. Two-Legged series (Ida y Vuelta)
  it('populates Vuelta match with inverted home/away when Ida match finishes', async () => {
    mockMatches['m-round1-ida'] = {
      id: 'm-round1-ida',
      homeTeamId: 'team-real',
      homeTeamName: 'Real Madrid',
      awayTeamId: 'team-barca',
      awayTeamName: 'FC Barcelona',
      scoreHome: 2,
      scoreAway: 1,
      winnerTeamId: 'team-real',
      status: 'FINALIZADO',
      nextMatchId: 'm-round1-vuelta',
      nextMatchSlot: 'VUELTA_TARGET',
      competitionId: 'comp-twolgs',
    };

    mockMatches['m-round1-vuelta'] = {
      id: 'm-round1-vuelta',
      homeTeamId: null,
      homeTeamName: 'Por Definir',
      awayTeamId: null,
      awayTeamName: 'Por Definir',
      status: 'PENDIENTE',
      competitionId: 'comp-twolgs',
    };

    const result = await processMatchAutoAdvance('m-round1-ida');

    expect(result.advanced).toBe(true);
    // Local in vuelta is FC Barcelona (away from ida)
    expect(mockMatches['m-round1-vuelta'].homeTeamId).toBe('team-barca');
    expect(mockMatches['m-round1-vuelta'].homeTeamName).toBe('FC Barcelona');
    // Away in vuelta is Real Madrid (home from ida)
    expect(mockMatches['m-round1-vuelta'].awayTeamId).toBe('team-real');
    expect(mockMatches['m-round1-vuelta'].awayTeamName).toBe('Real Madrid');
  });

  // 4. Consensus Reporting logic evaluation
  it('verifies consensus evaluation: matches when both captains agree, conflicts when they disagree', () => {
    // Scenario A: First captain reports
    const reportCaptain1 = { homeScore: 3, awayScore: 2, userId: 'usr-capt1' };
    const matchBefore = {
      reportedScoreHome: null,
      reportedScoreAway: null,
      reportedByUserId: null,
    };
    const hasPreviousRivalA =
      matchBefore.reportedByUserId &&
      matchBefore.reportedByUserId !== reportCaptain1.userId;
    expect(hasPreviousRivalA).toBeFalsy();

    // Scenario B: Second captain reports matching score (Consensus)
    const matchAfterFirst = {
      reportedScoreHome: 3,
      reportedScoreAway: 2,
      reportedByUserId: 'usr-capt1',
    };
    const reportCaptain2Matching = { homeScore: 3, awayScore: 2, userId: 'usr-capt2' };
    const hasPreviousRivalB =
      matchAfterFirst.reportedByUserId &&
      matchAfterFirst.reportedByUserId !== reportCaptain2Matching.userId;
    const scoresMatchB =
      hasPreviousRivalB &&
      matchAfterFirst.reportedScoreHome === reportCaptain2Matching.homeScore &&
      matchAfterFirst.reportedScoreAway === reportCaptain2Matching.awayScore;

    expect(hasPreviousRivalB).toBeTruthy();
    expect(scoresMatchB).toBe(true);

    // Scenario C: Second captain reports conflicting score
    const reportCaptain2Conflict = { homeScore: 1, awayScore: 2, userId: 'usr-capt2' };
    const scoresMatchC =
      hasPreviousRivalB &&
      matchAfterFirst.reportedScoreHome === reportCaptain2Conflict.homeScore &&
      matchAfterFirst.reportedScoreAway === reportCaptain2Conflict.awayScore;
    const hasConflictC = hasPreviousRivalB && !scoresMatchC;

    expect(scoresMatchC).toBe(false);
    expect(hasConflictC).toBe(true);
  });

  // 5. Automatic Playoff Seeding upon finishing Hybrid Group Stage
  it('triggers hybrid playoff seeding when the final group stage match finishes', async () => {
    mockCompetitions['comp-hybrid-1'] = {
      id: 'comp-hybrid-1',
      format: 'Hibrido',
      qualifiersPerGroup: 1,
    };

    // Group A matches
    mockMatches['m-gA-1'] = {
      id: 'm-gA-1',
      competitionId: 'comp-hybrid-1',
      stage: 'GROUP',
      groupName: 'Grupo A',
      homeTeamId: 't-a1',
      homeTeamName: 'Alpha',
      homeTeamTag: 'ALP',
      awayTeamId: 't-a2',
      awayTeamName: 'Ant',
      awayTeamTag: 'ANT',
      scoreHome: 3,
      scoreAway: 0,
      winnerTeamId: 't-a1',
      status: 'FINALIZADO',
    };

    // Group B match (the final group match)
    mockMatches['m-gB-1'] = {
      id: 'm-gB-1',
      competitionId: 'comp-hybrid-1',
      stage: 'GROUP',
      groupName: 'Grupo B',
      homeTeamId: 't-b1',
      homeTeamName: 'Bravo',
      homeTeamTag: 'BRV',
      awayTeamId: 't-b2',
      awayTeamName: 'Bear',
      awayTeamTag: 'BER',
      scoreHome: 2,
      scoreAway: 1,
      winnerTeamId: 't-b1',
      status: 'FINALIZADO',
    };

    // Playoff Final match waiting for group winners
    mockMatches['comp-hybrid-1-po-r1-m1'] = {
      id: 'comp-hybrid-1-po-r1-m1',
      competitionId: 'comp-hybrid-1',
      stage: 'PLAYOFF',
      roundName: 'Gran Final',
      groupName: null,
      homeTeamId: null,
      homeTeamName: '1° de Grupo A',
      homeTeamTag: null,
      awayTeamId: null,
      awayTeamName: '1° de Grupo B',
      awayTeamTag: null,
      status: 'PENDIENTE',
    };

    const result = await processMatchAutoAdvance('m-gB-1');

    expect(result.hybridSeeded).toBe(true);
    // Verified direct final seeding: 1° Grupo A (Alpha) vs 1° Grupo B (Bravo)
    expect(mockMatches['comp-hybrid-1-po-r1-m1'].homeTeamId).toBe('t-a1');
    expect(mockMatches['comp-hybrid-1-po-r1-m1'].homeTeamName).toBe('Alpha');
    expect(mockMatches['comp-hybrid-1-po-r1-m1'].awayTeamId).toBe('t-b1');
    expect(mockMatches['comp-hybrid-1-po-r1-m1'].awayTeamName).toBe('Bravo');
  });
});

