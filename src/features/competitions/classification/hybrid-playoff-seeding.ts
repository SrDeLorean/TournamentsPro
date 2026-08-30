import { calculateStandings, isFinalizedMatchStatus, type ClassificationMatch } from './classification-model';

export interface HybridSeedMatch {
  id: string;
  groupName: string | null;
  roundName: string | null;
  matchday: number | null;
  status: string;
  homeTeamId: string | null;
  homeTeamName: string | null;
  homeTeamTag: string | null;
  scoreHome: number | null;
  awayTeamId: string | null;
  awayTeamName: string | null;
  awayTeamTag: string | null;
  scoreAway: number | null;
}

interface QualifiedTeam { id: string; name: string; tag: string }
export interface HybridSeedAssignment { matchIds: string[]; home: QualifiedTeam; away: QualifiedTeam }

function isGroupStageMatch(match: HybridSeedMatch): boolean {
  return Boolean(match.groupName && /^grupo\s+/i.test(match.groupName.trim()));
}

function baseRoundName(roundName: string | null): string {
  return (roundName || '').replace(/\s*\((ida|vuelta)\)\s*/i, '').trim();
}

function playoffRoundWeight(roundName: string): number {
  const normalized = roundName.toLowerCase();
  if (normalized.includes('dieciseisavos')) return 1;
  if (normalized.includes('octavos')) return 2;
  if (normalized.includes('cuartos')) return 3;
  if (normalized.includes('semifinal')) return 4;
  if (normalized.includes('final')) return 5;
  return Number.MAX_SAFE_INTEGER;
}

export function buildHybridPlayoffSeedAssignments(
  matches: readonly HybridSeedMatch[],
  qualifiersPerGroup: number,
): { ready: boolean; assignments: HybridSeedAssignment[] } {
  const groupMatches = matches.filter(isGroupStageMatch);
  if (!groupMatches.length || groupMatches.some((match) => !isFinalizedMatchStatus(match.status))) {
    return { ready: false, assignments: [] };
  }

  const groups = [...new Set(groupMatches.map((match) => match.groupName!))].sort((left, right) => left.localeCompare(right));
  const qualifiedByGroup = new Map<string, QualifiedTeam[]>();

  groups.forEach((groupName) => {
    const scoped = groupMatches.filter((match) => match.groupName === groupName);
    const standings = calculateStandings(scoped.map((match): ClassificationMatch => ({
      id: match.id,
      home_team_name: match.homeTeamName || 'Equipo Local',
      home_team_tag: match.homeTeamTag || 'LOC',
      away_team_name: match.awayTeamName || 'Equipo Visitante',
      away_team_tag: match.awayTeamTag || 'VIS',
      score_home: match.scoreHome,
      score_away: match.scoreAway,
      status: match.status,
      round_name: match.roundName || `Fecha ${match.matchday || 1}`,
      tournament_name: 'Competencia híbrida',
      organization_name: 'Organización',
      group_name: groupName,
      matchday: match.matchday || undefined,
    })));
    const identities = new Map<string, QualifiedTeam>();
    scoped.forEach((match) => {
      if (match.homeTeamId && match.homeTeamName) identities.set(match.homeTeamName.toLowerCase(), { id: match.homeTeamId, name: match.homeTeamName, tag: match.homeTeamTag || match.homeTeamName.slice(0, 3).toUpperCase() });
      if (match.awayTeamId && match.awayTeamName) identities.set(match.awayTeamName.toLowerCase(), { id: match.awayTeamId, name: match.awayTeamName, tag: match.awayTeamTag || match.awayTeamName.slice(0, 3).toUpperCase() });
    });
    qualifiedByGroup.set(groupName, standings.slice(0, Math.max(1, qualifiersPerGroup)).flatMap((standing) => {
      const identity = identities.get(standing.name.toLowerCase());
      return identity ? [identity] : [];
    }));
  });

  const seedPairs: Array<{ home: QualifiedTeam; away: QualifiedTeam }> = [];
  for (let index = 0; index < groups.length; index += 2) {
    const first = qualifiedByGroup.get(groups[index]) || [];
    const second = qualifiedByGroup.get(groups[index + 1] || groups[0]) || [];
    const pairCount = Math.min(first.length, second.length, Math.max(1, qualifiersPerGroup));
    for (let rank = 0; rank < pairCount; rank += 1) {
      seedPairs.push({ home: first[rank], away: second[pairCount - rank - 1] });
    }
  }

  const playoffMatches = matches.filter((match) => playoffRoundWeight(baseRoundName(match.roundName)) < Number.MAX_SAFE_INTEGER);
  const firstRoundName = [...new Set(playoffMatches.map((match) => baseRoundName(match.roundName)))]
    .sort((left, right) => playoffRoundWeight(left) - playoffRoundWeight(right))[0];
  if (!firstRoundName) return { ready: true, assignments: [] };

  const series = new Map<string, string[]>();
  playoffMatches
    .filter((match) => baseRoundName(match.roundName) === firstRoundName)
    .forEach((match) => {
      const baseId = match.id.replace(/-(ida|vuelta)$/i, '');
      series.set(baseId, [...(series.get(baseId) || []), match.id]);
    });

  const sortedSeries = [...series.entries()].sort(([left], [right]) => left.localeCompare(right));
  const assignments = sortedSeries.slice(0, seedPairs.length).map(([, matchIds], index) => ({
    matchIds: matchIds.sort((left, right) => left.includes('-ida') ? -1 : right.includes('-ida') ? 1 : left.localeCompare(right)),
    ...seedPairs[index],
  }));

  return { ready: true, assignments };
}
