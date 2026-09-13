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
  winnerTeamId?: string | null;
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
 * 2.1 ALGORITMO CANÓNICO DE CABEZAS DE SERIE (TOURNAMENT SEEDING)
 * Distribuye las semillas de modo que los mejores (#1 y #2) queden en extremos opuestos del bracket
 * y no se enfrenten antes de la Gran Final.
 */
export function getTournamentSeedingPairs(bracketSize: number): [number, number][] {
  if (bracketSize < 2) return [[1, 2]];
  let seeds = [1, 2];
  while (seeds.length < bracketSize) {
    const nextSeeds: number[] = [];
    const sum = seeds.length * 2 + 1;
    for (const s of seeds) {
      nextSeeds.push(s);
      nextSeeds.push(sum - s);
    }
    seeds = nextSeeds;
  }
  const pairs: [number, number][] = [];
  for (let i = 0; i < seeds.length; i += 2) {
    pairs.push([seeds[i], seeds[i + 1]]);
  }
  return pairs;
}

export interface HybridPlayoffStructure {
  groupCount: number;
  qualifiersPerGroup: number;
  directQualifiers: number;
  bracketSize: number;
  wildcardCount: number;
  wildcardRank: number;
  wildcardLabel: string;
  wildcardSeeds: string[];
  initialRoundName: string;
  seedPairs: Array<{ homeSeed: string; awaySeed: string }>;
}

function buildHybridSeedList(
  groupCount: number,
  qualifiersPerGroup: number,
  wildcardSeeds: string[]
): string[] {
  const groupNames = Array.from({ length: groupCount }, (_, i) => `Grupo ${String.fromCharCode(65 + i)}`);
  const seeds: string[] = [];

  for (let q = 1; q <= qualifiersPerGroup; q++) {
    const rankLabel = `${q}°`;
    const shift = q === 1 ? 0 : 1;
    for (let g = 0; g < groupCount; g++) {
      const gIdx = (g + shift) % groupCount;
      seeds.push(`${rankLabel} de ${groupNames[gIdx]}`);
    }
  }

  wildcardSeeds.forEach((ws) => seeds.push(ws));
  return seeds;
}

function resolveSameGroupClashes(
  pairs: Array<{ homeSeed: string; awaySeed: string }>
): Array<{ homeSeed: string; awaySeed: string }> {
  const extractGroup = (seed: string): string | null => {
    const match = seed.match(/Grupo\s+([A-Z0-9]+)/i);
    return match ? match[1].toUpperCase() : null;
  };

  const result = pairs.map((p) => ({ ...p }));
  for (let i = 0; i < result.length; i++) {
    const homeGrp = extractGroup(result[i].homeSeed);
    const awayGrp = extractGroup(result[i].awaySeed);
    if (homeGrp && awayGrp && homeGrp === awayGrp) {
      for (let j = 0; j < result.length; j++) {
        if (i === j) continue;
        const otherHomeGrp = extractGroup(result[j].homeSeed);
        const otherAwayGrp = extractGroup(result[j].awaySeed);
        if (homeGrp !== otherAwayGrp && otherHomeGrp !== awayGrp) {
          const temp = result[i].awaySeed;
          result[i].awaySeed = result[j].awaySeed;
          result[j].awaySeed = temp;
          break;
        }
      }
    }
  }
  return result;
}

/**
 * 2.2 MOTOR DE CIERRE MATEMÁTICO DE PLAYOFF HÍBRIDO (POTENCIAS DE 2 & WILDCARDS)
 * Calcula clasificados directos, tamaño objetivo de bracket (2, 4, 8, 16, 32...) y
 * cupos de repesca (Mejores Segundos, Mejores Terceros) cuando los grupos o clasificados
 * no completan una llave par.
 */
export function calculateHybridPlayoffStructure(
  groupCount: number,
  qualifiersPerGroup: number
): HybridPlayoffStructure {
  const G = Math.max(1, groupCount);
  const Q = Math.max(1, qualifiersPerGroup);
  const directQualifiers = G * Q;
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(Math.max(2, directQualifiers))));
  const wildcardCount = bracketSize - directQualifiers;
  const wildcardRank = Q + 1;
  const rankSuffix = `${wildcardRank}°`;

  let wildcardLabel = '';
  let wildcardSeeds: string[] = [];

  if (wildcardCount === 1) {
    wildcardLabel = `Mejor ${rankSuffix}`;
    wildcardSeeds = [wildcardLabel];
  } else if (wildcardCount > 1) {
    wildcardLabel = `${wildcardCount} Mejores ${rankSuffix}`;
    if (wildcardCount <= G) {
      wildcardSeeds = Array.from({ length: wildcardCount }, (_, i) => `${i + 1}° Mejor ${rankSuffix}`);
    } else {
      const fromFirstRank = Array.from({ length: G }, (_, i) => `${i + 1}° Mejor ${rankSuffix}`);
      const remaining = wildcardCount - G;
      const nextRankSuffix = `${wildcardRank + 1}°`;
      const fromSecondRank = Array.from({ length: remaining }, (_, i) => `${i + 1}° Mejor ${nextRankSuffix}`);
      wildcardSeeds = [...fromFirstRank, ...fromSecondRank];
    }
  }

  const initialRoundName = getRoundNameByTeamCount(bracketSize);
  const rawSeeds = buildHybridSeedList(G, Q, wildcardSeeds);
  const seedingPairs = getTournamentSeedingPairs(bracketSize);

  let seedPairs = seedingPairs.map(([homeSeedIdx, awaySeedIdx]) => ({
    homeSeed: rawSeeds[homeSeedIdx - 1] || `Semilla #${homeSeedIdx}`,
    awaySeed: rawSeeds[awaySeedIdx - 1] || `Semilla #${awaySeedIdx}`,
  }));

  seedPairs = resolveSameGroupClashes(seedPairs);

  return {
    groupCount: G,
    qualifiersPerGroup: Q,
    directQualifiers,
    bracketSize,
    wildcardCount,
    wildcardRank,
    wildcardLabel,
    wildcardSeeds,
    initialRoundName,
    seedPairs,
  };
}

/**
 * 3. GENERACIÓN DE LLAVES DE PLAYOFF DE IZQUIERDA A DERECHA (OCTAVOS -> CUARTOS -> SEMIS -> FINAL)
 */
export function generatePlayoffBracket(
  competitionId: string,
  qualifiedTeams: TeamItem[],
  matchMode: 'PartidoUnico' | 'IdaVuelta' | 'MejorDe3' = 'PartidoUnico',
  isHybrid: boolean = false,
  groupCount = 4,
  qualifiersPerGroup = 2
): PlayoffMatchNode[] {
  const hybridStructure = isHybrid
    ? calculateHybridPlayoffStructure(groupCount, qualifiersPerGroup)
    : null;
  const bracketSize = isHybrid
    ? hybridStructure!.bracketSize
    : Math.pow(2, Math.ceil(Math.log2(Math.max(2, qualifiedTeams.length))));

  if (bracketSize < 2) return [];

  const compClean = competitionId.replace(/[^a-zA-Z0-9]/g, '').slice(-10);
  const roundsTotal = Math.ceil(Math.log2(bracketSize));
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

  // Emparejamiento por cabezas de serie para torneos estándar
  const seedingPairs = getTournamentSeedingPairs(bracketSize);

  // Mapa para registrar pases automáticos a la siguiente ronda (ej. por BYE en Ronda 1)
  const preAdvancements = new Map<string, { slot: 'HOME' | 'AWAY'; teamId: string; teamName: string }>();

  roundStructures.forEach((roundInfo, rIdx) => {
    for (let m = 0; m < roundInfo.matchCount; m++) {
      const isLastRound = rIdx === roundStructures.length - 1;
      const nextRoundOrder = roundInfo.roundOrder + 1;
      const nextMatchIndex = Math.floor(m / 2) + 1;
      const nextSlotChoice: 'HOME' | 'AWAY' = m % 2 === 0 ? 'HOME' : 'AWAY';

      // Asignación de equipos o semillas en Primera Ronda (rIdx === 0)
      let homeTeamId: string | null = null;
      let homeTeamName = 'Por Definir';
      let awayTeamId: string | null = null;
      let awayTeamName = 'Por Definir';
      let status: PlayoffMatchNode['status'] = 'PENDIENTE';
      let winnerTeamId: string | null = null;

      if (rIdx === 0) {
        if (isHybrid && hybridStructure && hybridStructure.seedPairs[m]) {
          homeTeamName = hybridStructure.seedPairs[m].homeSeed;
          awayTeamName = hybridStructure.seedPairs[m].awaySeed;
        } else {
          const [seedHome, seedAway] = seedingPairs[m] || [m * 2 + 1, m * 2 + 2];
          const homeTeam = qualifiedTeams[seedHome - 1];
          const awayTeam = qualifiedTeams[seedAway - 1];

          if (homeTeam) {
            homeTeamId = homeTeam.id;
            homeTeamName = homeTeam.name;
          } else {
            homeTeamName = 'DESCANSO (BYE)';
          }

          if (awayTeam) {
            awayTeamId = awayTeam.id;
            awayTeamName = awayTeam.name;
          } else {
            awayTeamName = homeTeam ? 'DESCANSO (BYE)' : 'Por Definir';
          }

          // Si uno tiene BYE y el otro equipo existe, auto-avanza a la siguiente ronda
          if (homeTeam && !awayTeam) {
            status = 'TERMINADO';
            winnerTeamId = homeTeam.id;
          } else if (awayTeam && !homeTeam) {
            status = 'TERMINADO';
            winnerTeamId = awayTeam.id;
          }
        }
      } else {
        // Rondas posteriores: verificar si hubo un pase previo por BYE
        const baseTargetKey = `r${roundInfo.roundOrder}-m${m + 1}`;
        const adv = preAdvancements.get(baseTargetKey);
        if (adv) {
          if (adv.slot === 'HOME') {
            homeTeamId = adv.teamId;
            homeTeamName = adv.teamName;
          } else {
            awayTeamId = adv.teamId;
            awayTeamName = adv.teamName;
          }
        }
      }

      // Definir IDs según el formato
      if (matchMode === 'MejorDe3') {
        const matchIdJ1 = `p-${compClean}-r${roundInfo.roundOrder}-m${m + 1}-j1`;
        const matchIdJ2 = `p-${compClean}-r${roundInfo.roundOrder}-m${m + 1}-j2`;
        const matchIdJ3 = `p-${compClean}-r${roundInfo.roundOrder}-m${m + 1}-j3`;
        const targetNextRoundId = !isLastRound
          ? `p-${compClean}-r${nextRoundOrder}-m${nextMatchIndex}-j1`
          : null;

        if (winnerTeamId && !isLastRound) {
          const targetKey = `r${nextRoundOrder}-m${nextMatchIndex}`;
          preAdvancements.set(targetKey, {
            slot: nextSlotChoice,
            teamId: winnerTeamId,
            teamName: homeTeamId === winnerTeamId ? homeTeamName : awayTeamName,
          });
        }

        // Nodo Juego 1: Local vs Visitante
        bracketMatches.push({
          id: matchIdJ1,
          competitionId,
          roundName: `${roundInfo.roundName} (Juego 1)`,
          roundOrder: roundInfo.roundOrder,
          legType: 'UNICO',
          homeTeamName,
          awayTeamName,
          homeTeamId,
          awayTeamId,
          nextMatchId: matchIdJ2,
          nextMatchSlot: 'HOME',
          status,
          winnerTeamId,
        });

        // Nodo Juego 2: Localía invertida
        bracketMatches.push({
          id: matchIdJ2,
          competitionId,
          roundName: `${roundInfo.roundName} (Juego 2)`,
          roundOrder: roundInfo.roundOrder,
          legType: 'UNICO',
          homeTeamName: awayTeamName,
          awayTeamName: homeTeamName,
          homeTeamId: awayTeamId,
          awayTeamId: homeTeamId,
          nextMatchId: targetNextRoundId,
          nextMatchSlot: !isLastRound ? nextSlotChoice : null,
          status,
          winnerTeamId,
        });

        // Nodo Juego 3: Desempate condicional
        bracketMatches.push({
          id: matchIdJ3,
          competitionId,
          roundName: `${roundInfo.roundName} (Juego 3)`,
          roundOrder: roundInfo.roundOrder,
          legType: 'UNICO',
          homeTeamName,
          awayTeamName,
          homeTeamId,
          awayTeamId,
          nextMatchId: targetNextRoundId,
          nextMatchSlot: !isLastRound ? nextSlotChoice : null,
          status: status === 'TERMINADO' ? 'TERMINADO' : 'PENDIENTE',
          winnerTeamId,
        });
      } else if (matchMode === 'IdaVuelta') {
        const matchIdIda = `p-${compClean}-r${roundInfo.roundOrder}-m${m + 1}-ida`;
        const matchIdVuelta = `p-${compClean}-r${roundInfo.roundOrder}-m${m + 1}-vuelta`;
        const targetNextRoundId = !isLastRound
          ? `p-${compClean}-r${nextRoundOrder}-m${nextMatchIndex}-ida`
          : null;

        if (winnerTeamId && !isLastRound) {
          const targetKey = `r${nextRoundOrder}-m${nextMatchIndex}`;
          preAdvancements.set(targetKey, {
            slot: nextSlotChoice,
            teamId: winnerTeamId,
            teamName: homeTeamId === winnerTeamId ? homeTeamName : awayTeamName,
          });
        }

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
          status,
          winnerTeamId,
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
          status,
          winnerTeamId,
        });
      } else {
        // PARTIDO ÚNICO
        const matchId = `p-${compClean}-r${roundInfo.roundOrder}-m${m + 1}`;
        const targetNextRoundId = !isLastRound
          ? `p-${compClean}-r${nextRoundOrder}-m${nextMatchIndex}`
          : null;

        if (winnerTeamId && !isLastRound) {
          const targetKey = `r${nextRoundOrder}-m${nextMatchIndex}`;
          preAdvancements.set(targetKey, {
            slot: nextSlotChoice,
            teamId: winnerTeamId,
            teamName: homeTeamId === winnerTeamId ? homeTeamName : awayTeamName,
          });
        }

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
          status,
          winnerTeamId,
        });
      }
    }
  });

  return bracketMatches;
}

/**
 * 4. EMPAREJAMIENTOS CRUZADOS HÍBRIDOS (CRUCES CON CIERRE DE POTENCIAS DE 2 Y REPESCA)
 */
export function generateHybridCrossSeedings(
  groups: GroupDistributionResult[],
  qualifiersPerGroup: number
): { homeSeed: string; awaySeed: string }[] {
  const structure = calculateHybridPlayoffStructure(groups.length, qualifiersPerGroup);
  return structure.seedPairs;
}
