/**
 * 🏆 MÓDULO DE MATCHMAKING DEPORTIVO Y AUTO-AVANCE (BRACKET SYSTEM)
 * Plataforma eSports: TournamentsPro
 */

export interface TeamItem {
  id: string;
  name: string;
  tag?: string | null;
}

export interface GroupDistributionResult {
  groupName: string;
  teams: TeamItem[];
  count: number;
}

export interface PlayoffMatchNode {
  id: string;
  competitionId: string;
  roundName: string; // ej. 'Octavos de Final', 'Cuartos de Final', 'Semifinales', 'Final'
  roundOrder: number; // 1 = Primera Ronda, 2 = Cuartos/Semis, 3/4 = Final
  legType: 'UNICO' | 'IDA' | 'VUELTA';
  homeTeamName: string;
  awayTeamName: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  nextMatchId: string | null;
  nextMatchSlot: 'HOME' | 'AWAY' | 'VUELTA_TARGET' | null;
  status: 'PENDIENTE' | 'POR_REVISAR' | 'TERMINADO' | 'DISPUTADO';
}

/**
 * 1. ALGORITMO DE DISTRIBUCIÓN DE GRUPOS ASIMÉTRICO
 */
export function distributeTeamsIntoGroups(
  teams: TeamItem[],
  groupCount: number
): GroupDistributionResult[] {
  if (groupCount <= 0 || teams.length === 0) return [];

  const actualGroupCount = Math.min(groupCount, teams.length);
  const baseSize = Math.floor(teams.length / actualGroupCount);
  let remainder = teams.length % actualGroupCount;

  const result: GroupDistributionResult[] = [];
  let currentIndex = 0;

  for (let i = 0; i < actualGroupCount; i++) {
    const groupName = `Grupo ${String.fromCharCode(65 + i)}`;
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder--;

    const groupSize = baseSize + extra;
    const groupTeams = teams.slice(currentIndex, currentIndex + groupSize);
    currentIndex += groupSize;

    result.push({
      groupName,
      teams: groupTeams,
      count: groupTeams.length,
    });
  }

  return result;
}

/**
 * 2. OBTENER NOMBRE DE RONDA SEGÚN CANTIDAD DE EQUIPOS EN RONDA
 */
export function getRoundNameByTeamCount(teamCount: number): string {
  if (teamCount <= 2) return 'Final';
  if (teamCount <= 4) return 'Semifinales';
  if (teamCount <= 8) return 'Cuartos de Final';
  if (teamCount <= 16) return 'Octavos de Final';
  if (teamCount <= 32) return '16avos de Final';
  return `Ronda de ${teamCount}`;
}

/**
 * 3. GENERACIÓN DE LLAVES DE PLAYOFF DE IZQUIERDA A DERECHA (OCTAVOS -> CUARTOS -> SEMIS -> FINAL)
 */
export function generatePlayoffBracket(
  competitionId: string,
  qualifiedTeams: TeamItem[],
  matchMode: 'PartidoUnico' | 'IdaVuelta' = 'PartidoUnico',
  isHybrid: boolean = false,
  groupCount = 4,
  qualifiersPerGroup = 2
): PlayoffMatchNode[] {
  const count = isHybrid ? groupCount * qualifiersPerGroup : qualifiedTeams.length;
  if (count < 2) return [];

  const compClean = competitionId.replace(/[^a-zA-Z0-9]/g, '').slice(-10);
  const roundsTotal = Math.ceil(Math.log2(count));
  const bracketMatches: PlayoffMatchNode[] = [];

  // PUSH en orden cronológico: Ronda 1 (Octavos/Cuartos) -> Ronda N (Final)
  const roundStructures: { roundOrder: number; roundName: string; matchCount: number }[] = [];
  for (let r = roundsTotal; r >= 1; r--) {
    const teamsInRound = Math.pow(2, r);
    roundStructures.push({
      roundOrder: roundsTotal - r + 1,
      roundName: getRoundNameByTeamCount(teamsInRound),
      matchCount: teamsInRound / 2,
    });
  }

  // Generar semillas para la primera ronda si es Híbrido (1° Grupo A vs 2° Grupo B, etc.)
  const hybridSeedings: { homeSeed: string; awaySeed: string }[] = [];
  if (isHybrid) {
    const groupNames = Array.from({ length: groupCount }, (_, i) => `Grupo ${String.fromCharCode(65 + i)}`);
    const totalMatchCount = (groupCount * qualifiersPerGroup) / 2;
    const half = Math.ceil(totalMatchCount / 2);

    for (let m = 0; m < totalMatchCount; m++) {
      if (m < half) {
        const gHomeIdx = m % groupCount;
        const gAwayIdx = (m + 1) % groupCount;
        hybridSeedings.push({
          homeSeed: `1° de ${groupNames[gHomeIdx]}`,
          awaySeed: `2° de ${groupNames[gAwayIdx]}`,
        });
      } else {
        const offset = m - half;
        const gHomeIdx = (offset + 1) % groupCount;
        const gAwayIdx = offset % groupCount;
        hybridSeedings.push({
          homeSeed: `1° de ${groupNames[gHomeIdx]}`,
          awaySeed: `2° de ${groupNames[gAwayIdx]}`,
        });
      }
    }
  }

  roundStructures.forEach((roundInfo, rIdx) => {
    for (let m = 0; m < roundInfo.matchCount; m++) {
      const isLastRound = rIdx === roundStructures.length - 1;
      const nextRoundOrder = roundInfo.roundOrder + 1;
      const nextMatchIndex = Math.floor(m / 2) + 1;
      const nextSlotChoice: 'HOME' | 'AWAY' = m % 2 === 0 ? 'HOME' : 'AWAY';

      // Asignación de equipos o semillas en Primera Ronda (rIdx === 0: Octavos/Cuartos)
      let homeTeamId: string | null = null;
      let homeTeamName = 'Por Definir';
      let awayTeamId: string | null = null;
      let awayTeamName = 'Por Definir';

      if (rIdx === 0) {
        if (isHybrid && hybridSeedings[m]) {
          homeTeamName = hybridSeedings[m].homeSeed;
          awayTeamName = hybridSeedings[m].awaySeed;
        } else {
          const homeTeam = qualifiedTeams[m * 2];
          const awayTeam = qualifiedTeams[m * 2 + 1];
          if (homeTeam) { homeTeamId = homeTeam.id; homeTeamName = homeTeam.name; }
          if (awayTeam) { awayTeamId = awayTeam.id; awayTeamName = awayTeam.name; }
        }
      }

      if (matchMode === 'IdaVuelta') {
        const matchIdIda = `p-${compClean}-r${roundInfo.roundOrder}-m${m + 1}-ida`;
        const matchIdVuelta = `p-${compClean}-r${roundInfo.roundOrder}-m${m + 1}-vuelta`;
        const targetNextRoundId = !isLastRound
          ? `p-${compClean}-r${nextRoundOrder}-m${nextMatchIndex}-ida`
          : null;

        // Nodo IDA
        bracketMatches.push({
          id: matchIdIda,
          competitionId,
          roundName: `${roundInfo.roundName} (Ida)`,
          roundOrder: roundInfo.roundOrder,
          legType: 'IDA',
          homeTeamName,
          awayTeamName,
          homeTeamId,
          awayTeamId,
          nextMatchId: matchIdVuelta,
          nextMatchSlot: 'VUELTA_TARGET',
          status: 'PENDIENTE',
        });

        // Nodo VUELTA: Localía invertida. La final no tiene nextMatchId
        bracketMatches.push({
          id: matchIdVuelta,
          competitionId,
          roundName: `${roundInfo.roundName} (Vuelta)`,
          roundOrder: roundInfo.roundOrder,
          legType: 'VUELTA',
          homeTeamName: awayTeamName,
          awayTeamName: homeTeamName,
          homeTeamId: awayTeamId,
          awayTeamId: homeTeamId,
          nextMatchId: targetNextRoundId,
          nextMatchSlot: !isLastRound ? nextSlotChoice : null,
          status: 'PENDIENTE',
        });
      } else {
        // PARTIDO ÚNICO
        const matchId = `p-${compClean}-r${roundInfo.roundOrder}-m${m + 1}`;
        const targetNextRoundId = !isLastRound
          ? `p-${compClean}-r${nextRoundOrder}-m${nextMatchIndex}`
          : null;

        bracketMatches.push({
          id: matchId,
          competitionId,
          roundName: roundInfo.roundName,
          roundOrder: roundInfo.roundOrder,
          legType: 'UNICO',
          homeTeamName,
          awayTeamName,
          homeTeamId,
          awayTeamId,
          nextMatchId: targetNextRoundId,
          nextMatchSlot: !isLastRound ? nextSlotChoice : null,
          status: 'PENDIENTE',
        });
      }
    }
  });

  return bracketMatches;
}

/**
 * 4. EMPAREJAMIENTOS CRUZADOS HÍBRIDOS (CRUZAR 1ROS Y 2DOS DE GRUPO)
 */
export function generateHybridCrossSeedings(
  groups: GroupDistributionResult[],
  qualifiersPerGroup: number
): { homeSeed: string; awaySeed: string }[] {
  const seedings: { homeSeed: string; awaySeed: string }[] = [];

  for (let i = 0; i < groups.length; i++) {
    const currentGroup = groups[i].groupName;
    const nextGroup = groups[(i + 1) % groups.length].groupName;

    for (let q = 1; q <= qualifiersPerGroup; q++) {
      const opposingPos = qualifiersPerGroup - q + 1;
      seedings.push({
        homeSeed: `1° de ${currentGroup}`,
        awaySeed: `${opposingPos}° de ${nextGroup}`,
      });
    }
  }

  return seedings;
}
