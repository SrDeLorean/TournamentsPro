import { calculateStandings, isFinalizedMatchStatus, type ClassificationMatch } from './classification-model';
import { calculateHybridPlayoffStructure } from '@/lib/matchmaking-bracket';

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
  const identities = new Map<string, QualifiedTeam>();
  const standingsByGroup = new Map<string, ReturnType<typeof calculateStandings>>();

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

    scoped.forEach((match) => {
      if (match.homeTeamId && match.homeTeamName) {
        identities.set(match.homeTeamName.toLowerCase(), {
          id: match.homeTeamId,
          name: match.homeTeamName,
          tag: match.homeTeamTag || match.homeTeamName.slice(0, 3).toUpperCase(),
        });
      }
      if (match.awayTeamId && match.awayTeamName) {
        identities.set(match.awayTeamName.toLowerCase(), {
          id: match.awayTeamId,
          name: match.awayTeamName,
          tag: match.awayTeamTag || match.awayTeamName.slice(0, 3).toUpperCase(),
        });
      }
    });

    standingsByGroup.set(groupName, standings);
  });

  const structure = calculateHybridPlayoffStructure(groups.length, qualifiersPerGroup);
  const teamBySeed = new Map<string, QualifiedTeam>();

  // 1. Mapear clasificados directos (ej. "1° de Grupo A", "2° de Grupo B")
  groups.forEach((groupName) => {
    const standings = standingsByGroup.get(groupName) || [];
    for (let rank = 0; rank < qualifiersPerGroup && rank < standings.length; rank++) {
      const standing = standings[rank];
      const identity = identities.get(standing.name.toLowerCase());
      if (identity) {
        teamBySeed.set(`${rank + 1}° de ${groupName}`.toLowerCase(), identity);
      }
    }
  });

  // 2. Mapear cupos de repesca / wildcards (ej. "Mejor 2°", "1° Mejor 3°") si se requieren
  if (structure.wildcardCount > 0) {
    const runnerUps: Array<{ standing: ReturnType<typeof calculateStandings>[number]; identity: QualifiedTeam }> = [];
    groups.forEach((groupName) => {
      const standings = standingsByGroup.get(groupName) || [];
      // Los candidatos a wildcard inician desde la posición de corte de clasificados directos
      for (let rank = qualifiersPerGroup; rank < standings.length; rank++) {
        const standing = standings[rank];
        const identity = identities.get(standing.name.toLowerCase());
        if (identity) {
          runnerUps.push({ standing, identity });
        }
      }
    });

    // Criterio FIFA/eSports: PTS desc -> DIF desc -> GF desc -> G desc
    runnerUps.sort((a, b) => {
      if (b.standing.pts !== a.standing.pts) return b.standing.pts - a.standing.pts;
      if (b.standing.dif !== a.standing.dif) return b.standing.dif - a.standing.dif;
      if (b.standing.gf !== a.standing.gf) return b.standing.gf - a.standing.gf;
      return b.standing.g - a.standing.g;
    });

    structure.wildcardSeeds.forEach((wildcardLabel, idx) => {
      if (runnerUps[idx]) {
        teamBySeed.set(wildcardLabel.toLowerCase(), runnerUps[idx].identity);
      }
    });
  }

  const playoffMatches = matches.filter((match) => playoffRoundWeight(baseRoundName(match.roundName)) < Number.MAX_SAFE_INTEGER);
  const firstRoundName = [...new Set(playoffMatches.map((match) => baseRoundName(match.roundName)))]
    .sort((left, right) => playoffRoundWeight(left) - playoffRoundWeight(right))[0];
  if (!firstRoundName) return { ready: true, assignments: [] };

  const series = new Map<string, HybridSeedMatch[]>();
  playoffMatches
    .filter((match) => baseRoundName(match.roundName) === firstRoundName)
    .forEach((match) => {
      const baseId = match.id.replace(/-(ida|vuelta)$/i, '');
      series.set(baseId, [...(series.get(baseId) || []), match]);
    });

  const sortedSeries = [...series.entries()].sort(([left], [right]) => left.localeCompare(right));
  const assignments: HybridSeedAssignment[] = [];

  sortedSeries.forEach(([, seriesMatches], idx) => {
    const representative = seriesMatches.find((m) => !/-vuelta$/i.test(m.id)) || seriesMatches[0];
    const matchIds = seriesMatches
      .map((m) => m.id)
      .sort((left, right) => left.includes('-ida') ? -1 : right.includes('-ida') ? 1 : left.localeCompare(right));

    // Buscar equipos por etiqueta sembrada en el partido o por el orden de la estructura matemática
    const rawHomeName = (representative.homeTeamName || '').toLowerCase().trim();
    const rawAwayName = (representative.awayTeamName || '').toLowerCase().trim();

    let home = teamBySeed.get(rawHomeName);
    let away = teamBySeed.get(rawAwayName);

    if (!home || !away) {
      const fallbackPair = structure.seedPairs[idx];
      if (fallbackPair) {
        if (!home) home = teamBySeed.get(fallbackPair.homeSeed.toLowerCase());
        if (!away) away = teamBySeed.get(fallbackPair.awaySeed.toLowerCase());
      }
    }

    if (home && away) {
      assignments.push({ matchIds, home, away });
    }
  });

  return { ready: true, assignments };
}
