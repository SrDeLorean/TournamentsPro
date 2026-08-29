import { describe, expect, it } from 'vitest';
import { calculateStandings, type ClassificationMatch } from '../src/features/competitions/classification/classification-model';

function match(overrides: Partial<ClassificationMatch>): ClassificationMatch {
  return {
    id: 'match-1',
    home_team_name: 'Alpha', home_team_tag: 'ALP',
    away_team_name: 'Beta', away_team_tag: 'BET',
    score_home: 2, score_away: 1, status: 'FINALIZADO', round_name: 'Fecha 1',
    tournament_name: 'Liga', organization_name: 'Org', group_name: 'A',
    ...overrides,
  };
}

describe('calculateStandings', () => {
  it('orders by points, goal difference and goals scored', () => {
    const standings = calculateStandings([
      match({ id: '1' }),
      match({ id: '2', home_team_name: 'Beta', home_team_tag: 'BET', away_team_name: 'Gamma', away_team_tag: 'GAM', score_home: 3, score_away: 0 }),
    ]);
    expect(standings.map((team) => team.name)).toEqual(['Beta', 'Alpha', 'Gamma']);
    expect(standings[0]).toMatchObject({ pts: 3, dif: 2, gf: 4 });
  });

  it('keeps scheduled teams at zero and excludes playoff rounds', () => {
    const standings = calculateStandings([
      match({ status: 'PROGRAMADO', score_home: null, score_away: null }),
      match({ id: 'playoff', round_name: 'Gran Final' }),
    ]);
    expect(standings).toHaveLength(2);
    expect(standings.every((team) => team.pts === 0 && team.pj === 0)).toBe(true);
  });

  it('preserves club logos and keeps the tag available as fallback', () => {
    const standings = calculateStandings([
      match({ home_team_logo_url: '/uploads/alpha.svg', away_team_logo_url: null }),
    ]);

    expect(standings.find((team) => team.name === 'Alpha')).toMatchObject({
      tag: 'ALP',
      logoUrl: '/uploads/alpha.svg',
    });
    expect(standings.find((team) => team.name === 'Beta')).toMatchObject({
      tag: 'BET',
      logoUrl: null,
    });
  });
});
