import { describe, expect, it } from 'vitest';
import { isBo3Match, parseBo3GameInfo, evaluateBo3Series } from '@/lib/bo3-series';
import { generatePlayoffBracket } from '@/lib/matchmaking-bracket';
import { buildRoundPairs } from '@/components/tournaments/playoff-bracket';
import { generateFixtureSchedule } from '@/app/dashboard/competencias/[id]/fixture-generator';

describe('Bo3 Series Logic & Detection', () => {
  it('detects Bo3 matches from matchMode, roundName, or ID suffix', () => {
    expect(isBo3Match({ matchMode: 'MejorDe3' })).toBe(true);
    expect(isBo3Match({ round_name: 'Cuartos de Final (Juego 1)' })).toBe(true);
    expect(isBo3Match({ id: 'p-comp123-r1-m1-j2' })).toBe(true);
    expect(isBo3Match({ id: 'm-comp123-j1-m1-j3' })).toBe(true);
    expect(isBo3Match({ id: 'p-comp123-r1-m1', round_name: 'Final' })).toBe(false);
  });

  it('parses gameNumber and baseSeriesId accurately', () => {
    const info1 = parseBo3GameInfo({ id: 'p-comp123-r1-m1-j1', round_name: 'Semifinales (Juego 1)' });
    expect(info1.isBo3).toBe(true);
    expect(info1.gameNumber).toBe(1);
    expect(info1.baseSeriesId).toBe('p-comp123-r1-m1');

    const info2 = parseBo3GameInfo({ id: 'p-comp123-r1-m1-j2' });
    expect(info2.gameNumber).toBe(2);

    const info3 = parseBo3GameInfo({ id: 'm-comp123-j2-m1-j3' });
    expect(info3.gameNumber).toBe(3);
    expect(info3.baseSeriesId).toBe('m-comp123-j2-m1');
  });

  it('evaluates series state: 0-0 unplayed', () => {
    const matches = [
      { id: 'm-1-j1', home_team_id: 'teamA', away_team_id: 'teamB', home_team_name: 'Team A', away_team_name: 'Team B', status: 'PENDIENTE' },
      { id: 'm-1-j2', home_team_id: 'teamB', away_team_id: 'teamA', home_team_name: 'Team B', away_team_name: 'Team A', status: 'PENDIENTE' },
      { id: 'm-1-j3', home_team_id: 'teamA', away_team_id: 'teamB', home_team_name: 'Team A', away_team_name: 'Team B', status: 'PENDIENTE' },
    ];
    const result = evaluateBo3Series(matches);
    expect(result.isDefined).toBe(false);
    expect(result.teamAWins).toBe(0);
    expect(result.teamBWins).toBe(0);
    expect(result.isGame3Locked).toBe(false);
    expect(result.winnerTeamId).toBeNull();
  });

  it('evaluates series state: 1-0 in progress (Team A won Game 1)', () => {
    const matches = [
      { id: 'm-1-j1', home_team_id: 'teamA', away_team_id: 'teamB', score_home: 3, score_away: 1, status: 'TERMINADO' },
      { id: 'm-1-j2', home_team_id: 'teamB', away_team_id: 'teamA', status: 'PENDIENTE' },
      { id: 'm-1-j3', home_team_id: 'teamA', away_team_id: 'teamB', status: 'PENDIENTE' },
    ];
    const result = evaluateBo3Series(matches);
    expect(result.isDefined).toBe(false);
    expect(result.teamAWins).toBe(1);
    expect(result.teamBWins).toBe(0);
    expect(result.isGame3Locked).toBe(false);
  });

  it('evaluates series state: 2-0 SWEEP (Team A wins Game 1 and Game 2) -> Game 3 IS LOCKED', () => {
    const matches = [
      { id: 'm-1-j1', home_team_id: 'teamA', away_team_id: 'teamB', score_home: 2, score_away: 0, status: 'TERMINADO' },
      // In J2, localía is inverted: Team B is home, Team A is away! Team A wins (away score > home score)
      { id: 'm-1-j2', home_team_id: 'teamB', away_team_id: 'teamA', score_home: 1, score_away: 2, status: 'TERMINADO' },
      { id: 'm-1-j3', home_team_id: 'teamA', away_team_id: 'teamB', status: 'PENDIENTE' },
    ];
    const result = evaluateBo3Series(matches);
    expect(result.isDefined).toBe(true);
    expect(result.teamAWins).toBe(2);
    expect(result.teamBWins).toBe(0);
    expect(result.winnerTeamId).toBe('teamA');
    expect(result.isGame3Locked).toBe(true);
  });

  it('evaluates series state: 1-1 TIE (Game 3 REQUIRED, NOT LOCKED)', () => {
    const matches = [
      { id: 'm-1-j1', home_team_id: 'teamA', away_team_id: 'teamB', score_home: 2, score_away: 0, status: 'TERMINADO' },
      // In J2, Team B wins (home score > away score)
      { id: 'm-1-j2', home_team_id: 'teamB', away_team_id: 'teamA', score_home: 3, score_away: 1, status: 'TERMINADO' },
      { id: 'm-1-j3', home_team_id: 'teamA', away_team_id: 'teamB', status: 'PENDIENTE' },
    ];
    const result = evaluateBo3Series(matches);
    expect(result.isDefined).toBe(false);
    expect(result.teamAWins).toBe(1);
    expect(result.teamBWins).toBe(1);
    expect(result.isGame3Locked).toBe(false);
  });

  it('evaluates series state: 2-1 (Team B wins Game 3 to take series)', () => {
    const matches = [
      { id: 'm-1-j1', home_team_id: 'teamA', away_team_id: 'teamB', score_home: 2, score_away: 1, status: 'TERMINADO' },
      { id: 'm-1-j2', home_team_id: 'teamB', away_team_id: 'teamA', score_home: 2, score_away: 0, status: 'TERMINADO' },
      // Game 3: Team B wins as away team
      { id: 'm-1-j3', home_team_id: 'teamA', away_team_id: 'teamB', score_home: 0, score_away: 1, status: 'TERMINADO' },
    ];
    const result = evaluateBo3Series(matches);
    expect(result.isDefined).toBe(true);
    expect(result.teamAWins).toBe(1);
    expect(result.teamBWins).toBe(2);
    expect(result.winnerTeamId).toBe('teamB');
    expect(result.isGame3Locked).toBe(false);
  });
});

describe('Playoff Bracket Generation with MejorDe3', () => {
  it('generates 3 games per matchup with inverted localía for Game 2', () => {
    const teams = [
      { id: 't1', name: 'Team Alpha', tag: 'ALP' },
      { id: 't2', name: 'Team Beta', tag: 'BET' },
      { id: 't3', name: 'Team Gamma', tag: 'GAM' },
      { id: 't4', name: 'Team Delta', tag: 'DEL' },
    ];

    const nodes = generatePlayoffBracket('comp-test-123', teams, 'MejorDe3');
    // 4 teams = 2 rounds (Semis and Final).
    // Round 1 (Semis): 2 matchups * 3 games = 6 games.
    // Round 2 (Final): 1 matchup * 3 games = 3 games.
    // Total = 9 matches.
    expect(nodes.length).toBe(9);

    const r1Matches = nodes.filter((n) => n.roundOrder === 1);
    expect(r1Matches.length).toBe(6);

    // Check Match 1 in Semis
    const m1J1 = r1Matches.find((n) => n.id.endsWith('-m1-j1'));
    const m1J2 = r1Matches.find((n) => n.id.endsWith('-m1-j2'));
    const m1J3 = r1Matches.find((n) => n.id.endsWith('-m1-j3'));

    expect(m1J1).toBeDefined();
    expect(m1J2).toBeDefined();
    expect(m1J3).toBeDefined();

    // J1: t1 vs t2
    expect(m1J1?.homeTeamId).toBe('t1');
    expect(m1J1?.awayTeamId).toBe('t2');

    // J2: reversed localía (t2 vs t1)
    expect(m1J2?.homeTeamId).toBe('t2');
    expect(m1J2?.awayTeamId).toBe('t1');

    // J3: t1 vs t2
    expect(m1J3?.homeTeamId).toBe('t1');
    expect(m1J3?.awayTeamId).toBe('t2');
  });
});

describe('Playoff Bracket UI Pairing with Bo3', () => {
  it('groups J1, J2, J3 matches of the same matchup into one Bo3 series card', () => {
    const mockMatches = [
      {
        id: 'p-comp1-r1-m1-j1',
        round_name: 'Semifinales (Juego 1)',
        home_team_name: 'Team Alpha',
        home_team_tag: 'ALP',
        away_team_name: 'Team Beta',
        away_team_tag: 'BET',
        score_home: 2,
        score_away: 0,
        status: 'TERMINADO',
      },
      {
        id: 'p-comp1-r1-m1-j2',
        round_name: 'Semifinales (Juego 2)',
        home_team_name: 'Team Beta',
        home_team_tag: 'BET',
        away_team_name: 'Team Alpha',
        away_team_tag: 'ALP',
        score_home: 1,
        score_away: 3,
        status: 'TERMINADO',
      },
      {
        id: 'p-comp1-r1-m1-j3',
        round_name: 'Semifinales (Juego 3)',
        home_team_name: 'Team Alpha',
        home_team_tag: 'ALP',
        away_team_name: 'Team Beta',
        away_team_tag: 'BET',
        score_home: null,
        score_away: null,
        status: 'CANCELADO',
      },
    ];

    const pairsMap = buildRoundPairs(mockMatches as any);
    expect(pairsMap.has('Semifinales')).toBe(true);

    const semisPairs = pairsMap.get('Semifinales')!;
    expect(semisPairs.length).toBe(1);

    const series = semisPairs[0];
    expect(series.isBo3).toBe(true);
    expect(series.ida.id).toBe('p-comp1-r1-m1-j1');
    expect(series.vuelta?.id).toBe('p-comp1-r1-m1-j2');
    expect(series.game3?.id).toBe('p-comp1-r1-m1-j3');
  });
});

describe('Format Restrictions & Dual Match Mode (Liga, Playoff, Híbrido)', () => {
  const teams = [
    { id: 't1', name: 'Team Alpha', tag: 'ALP' },
    { id: 't2', name: 'Team Beta', tag: 'BET' },
    { id: 't3', name: 'Team Gamma', tag: 'GAM' },
    { id: 't4', name: 'Team Delta', tag: 'DEL' },
  ];
  const timeSlots = [
    { dayLabel: 'Martes', time: '22:40' },
    { dayLabel: 'Jueves', time: '23:10' },
  ];

  it('Liga format strictly disallows Bo3 games, generating only single/double round robin matches', () => {
    // Even if MejorDe3 was passed as matchMode, Liga must never generate -j1, -j2, -j3 matches
    const matches = generateFixtureSchedule(
      teams,
      '2026-03-10',
      timeSlots,
      'MejorDe3' as any,
      'Liga'
    );
    expect(matches.length).toBeGreaterThan(0);
    // None of the matches should be Bo3 game suffix
    const bo3Matches = matches.filter((m) => /-j[123]$/.test(m.id));
    expect(bo3Matches.length).toBe(0);
  });

  it('Hibrido format supports dual mode: single-match groups + Bo3 playoff series', () => {
    const hybridTeams = [
      { id: 't1', name: 'Team 1' },
      { id: 't2', name: 'Team 2' },
      { id: 't3', name: 'Team 3' },
      { id: 't4', name: 'Team 4' },
      { id: 't5', name: 'Team 5' },
      { id: 't6', name: 'Team 6' },
    ];
    // Group stage: Solo Ida (PartidoUnico)
    // Playoff stage: MejorDe3
    const matches = generateFixtureSchedule(
      hybridTeams,
      '2026-03-10',
      timeSlots,
      'PartidoUnico',
      'Hibrido',
      2, // 2 groups
      2, // 2 qualifiers per group = 4 playoff teams
      ['Martes', 'Jueves'],
      ['22:40', '23:10'],
      'MejorDe3'
    );

    const groupMatches = matches.filter((m) => m.stageLabel.includes('Grupo'));
    const playoffMatches = matches.filter((m) => m.stageLabel.includes('Playoffs'));

    // In group matches: no Bo3 suffixes
    const groupBo3 = groupMatches.filter((m) => /-j[123]$/.test(m.id));
    expect(groupBo3.length).toBe(0);

    // In playoff matches: Bo3 matches present (e.g. -j1, -j2, -j3)
    const playoffBo3 = playoffMatches.filter((m) => /-j[123]$/.test(m.id));
    expect(playoffBo3.length).toBeGreaterThan(0);
  });

  it('Custom dynamic time slots: matches rotate through custom written times (22:40 and 23:10)', () => {
    const customTimes = ['22:40', '23:10'];
    const matches = generateFixtureSchedule(
      teams,
      '2026-03-10',
      timeSlots,
      'PartidoUnico',
      'Liga',
      3,
      2,
      ['Martes', 'Jueves'],
      customTimes
    );

    expect(matches.length).toBeGreaterThan(0);
    const usedTimes = new Set(matches.map((m) => m.scheduledTime));
    expect(usedTimes.has('22:40')).toBe(true);
    expect(usedTimes.has('23:10')).toBe(true);
    // Should only use the custom times provided
    usedTimes.forEach((t) => {
      expect(customTimes).toContain(t);
    });
  });
});
