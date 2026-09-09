// =============================================================================
// TournamentsPro — Competitions, Seasons & Fixtures Service
// =============================================================================

import type { Competition, IDatabaseProvider, Match } from '@/lib/db/interfaces';
import { dbProvider } from '@/lib/db/provider';
import { validateSchema } from '@/lib/validation';
import { GAMES_CATALOG } from '@/lib/games-data';
import { getErrorMessage, type GameConfigurationRow } from './types';

export interface CreateCompetitionInput {
  name: string;
  gameSlug: 'eafc26' | 'valorant' | 'csgo' | 'lol' | 'rocketleague' | 'fortnite';
  modeFormat: string;
  format?: 'Liga' | 'Playoff' | 'Hibrido';
  matchMode?: 'PartidoUnico' | 'IdaVuelta' | 'MejorDe3';
  fechaLimiteInscripcion?: string | null;
  fechaInicio: string;
  fechaTermino?: string | null;
  description?: string | null;
  prizePool?: string | null;
  transferMarketMode?: 'ABIERTO' | 'CERRADO' | 'SIN_MERCADO';
  seasonId?: string | null;
  newSeasonName?: string;
  organizationId?: string | null;
  status?: string;
}

export interface CreateCompetitionResult {
  success: boolean;
  competition?: Competition;
  message?: string;
  error?: string;
  code?: string;
}

export async function createCompetitionService(
  data: CreateCompetitionInput,
  organizerId: string,
  organizerName: string,
  organizationId: string | null
): Promise<CreateCompetitionResult> {
  const { createCompetitionSchema } = await import('@/lib/validation');
  const validation = validateSchema(createCompetitionSchema, data);

  if (!validation.success) {
    return { success: false, error: validation.errors.join(', '), code: 'VALIDATION_ERROR' };
  }

  const { name, gameSlug, modeFormat, format, matchMode, fechaLimiteInscripcion, fechaInicio, fechaTermino, description, prizePool, transferMarketMode, seasonId, newSeasonName } = validation.data;

  let finalSeasonId = seasonId;
  if (newSeasonName && newSeasonName.trim()) {
    const season = await dbProvider.seasons.create({
      name: newSeasonName.trim(),
      organizationId: organizationId || undefined,
    });
    finalSeasonId = season.id;
  }

  const competition = await dbProvider.competitions.create({
    name,
    gameSlug,
    organizerId,
    organizerName,
    organizationId,
    seasonId: finalSeasonId,
    prizePool,
    transferMarketMode,
    modeFormat,
    format: format || 'Liga',
    matchMode: matchMode || 'PartidoUnico',
    status: data.status || 'Inscripcion',
    fechaLimiteInscripcion: fechaLimiteInscripcion ? new Date(fechaLimiteInscripcion).toISOString().slice(0, 19).replace('T', ' ') : null,
    fechaInicio: new Date(fechaInicio).toISOString().slice(0, 19).replace('T', ' '),
    fechaTermino: fechaTermino ? new Date(fechaTermino).toISOString().slice(0, 19).replace('T', ' ') : null,
    description,
  });

  return { success: true, competition };
}

export interface FixtureConfig {
  startDate: string;
  selectedDays: string[];
  selectedTimes: string[];
  matchMode: 'PartidoUnico' | 'IdaVuelta' | 'MejorDe3';
  playoffMatchMode?: 'PartidoUnico' | 'IdaVuelta' | 'MejorDe3';
  format: 'Liga' | 'Playoff' | 'Hibrido';
  groupCount: number;
  qualifiersPerGroup: number;
}

export interface FixtureGenerationResult {
  success: boolean;
  matchesCreated?: number;
  message?: string;
  error?: string;
  code?: string;
}

interface GeneratedMatchData {
  id: string;
  matchdayNumber: number;
  stage: string;
  roundName?: string | null;
  groupName?: string | null;
  nextMatchId?: string | null;
  nextMatchSlot?: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  scheduledTime: string;
  scheduledDateTimeISO: string;
}

export async function generateFixtureService(
  competitionId: string,
  config: FixtureConfig
): Promise<FixtureGenerationResult> {
  return dbProvider.withTransaction(async (transaction) => {
    const competition = await transaction.competitions.findById(competitionId);
    if (!competition) {
      return { success: false, error: 'Competencia no encontrada', code: 'NOT_FOUND' };
    }

    const enrolledTeamsData = await transaction.competitions.getEnrolledTeams(competitionId);
    if (enrolledTeamsData.length < 2) {
      return { success: false, error: 'Se requieren al menos 2 equipos confirmados', code: 'NOT_ENOUGH_TEAMS' };
    }

    const teams = enrolledTeamsData.map((team: any) => ({
      id: String(team.team_id || team.teamId || team.id),
      name: String(team.team_name || team.teamName || team.name),
      tag: (team.team_tag || team.teamTag || team.tag || null) as string | null,
    }));

    await transaction.matches.deleteByCompetition(competitionId);

    const { startDate, selectedDays, selectedTimes, matchMode, playoffMatchMode, format, groupCount, qualifiersPerGroup } = config;
    const effectiveMatchMode = format === 'Liga' && matchMode === 'MejorDe3' ? 'PartidoUnico' : matchMode;

    const totalSavedMatches = await generateMatchesForFormat(
      transaction,
      competitionId,
      teams,
      format,
      effectiveMatchMode,
      startDate,
      selectedDays,
      selectedTimes,
      groupCount,
      qualifiersPerGroup,
      playoffMatchMode,
    );

    await transaction.competitions.update(competitionId, {
      status: 'Activo',
      format: config.format,
      matchMode: effectiveMatchMode,
      groupCount: config.groupCount,
      qualifiersPerGroup: config.qualifiersPerGroup,
    });

    return { success: true, matchesCreated: totalSavedMatches };
  });
}

async function generateMatchesForFormat(
  transaction: IDatabaseProvider,
  competitionId: string,
  teams: { id: string; name: string; tag: string | null }[],
  format: 'Liga' | 'Playoff' | 'Hibrido',
  matchMode: 'PartidoUnico' | 'IdaVuelta' | 'MejorDe3',
  startDate: string,
  selectedDays: string[],
  selectedTimes: string[],
  groupCount: number,
  qualifiersPerGroup: number,
  playoffMatchMode?: 'PartidoUnico' | 'IdaVuelta' | 'MejorDe3'
): Promise<number> {
  const { getMatchdayDateTime } = await import('@/lib/fixture-date-scheduler');
  const { distributeTeamsIntoGroups, generatePlayoffBracket } = await import('@/lib/matchmaking-bracket');
  
  const compClean = competitionId.replace(/[^a-zA-Z0-9]/g, '').slice(-12);
  
  const days = selectedDays.length > 0 ? selectedDays : ['Martes', 'Jueves'];
  const times = selectedTimes.length > 0 ? selectedTimes : ['20:00'];
  
  const timeSlotsConfig: { dayLabel: string; time: string }[] = [];
  days.forEach(dayLabel => times.forEach(time => timeSlotsConfig.push({ dayLabel, time })));

  const getScheduledDateTime = (matchdayNumber: number) => {
    const info = getMatchdayDateTime(matchdayNumber, startDate, days, times);
    return { scheduledTime: info.timeStr, scheduledDateTimeISO: info.iso };
  };

  const matchesToInsert: Partial<Match>[] = [];

  const insertMatch = async (matchData: GeneratedMatchData) => {
    matchesToInsert.push({
      id: matchData.id,
      tournamentId: competitionId,
      competitionId: competitionId,
      matchday: matchData.matchdayNumber,
      round: matchData.matchdayNumber,
      stage: matchData.stage,
      roundName: matchData.roundName || null,
      groupName: matchData.groupName || null,
      nextMatchId: matchData.nextMatchId || null,
      nextMatchSlot: matchData.nextMatchSlot || null,
      teamHomeId: matchData.homeTeamId,
      homeTeamId: matchData.homeTeamId,
      teamAwayId: matchData.awayTeamId,
      awayTeamId: matchData.awayTeamId,
      homeTeamName: matchData.homeTeamName,
      awayTeamName: matchData.awayTeamName,
      status: 'PENDIENTE',
      scheduledTime: matchData.scheduledTime,
      scheduledAt: matchData.scheduledDateTimeISO,
    });
  };

  if (format === 'Playoff') {
    const playoffMode = playoffMatchMode || matchMode;
    const playoffNodes = generatePlayoffBracket(competitionId, teams, playoffMode);
    for (const node of playoffNodes.reverse()) {
      let matchdayNumber = node.roundOrder;
      if (playoffMode === 'IdaVuelta') {
        matchdayNumber = (node.roundOrder - 1) * 2 + (node.legType === 'VUELTA' ? 2 : 1);
      } else if (playoffMode === 'MejorDe3') {
        const jNum = /-j([123])$/i.exec(node.id)?.[1] || '1';
        matchdayNumber = (node.roundOrder - 1) * 3 + Number(jNum);
      }
      const timing = getScheduledDateTime(matchdayNumber);
      
      await insertMatch({
        id: node.id, matchdayNumber, stage: 'PLAYOFF', roundName: node.roundName,
        nextMatchId: node.nextMatchId, nextMatchSlot: node.nextMatchSlot,
        homeTeamId: node.homeTeamId, awayTeamId: node.awayTeamId,
        homeTeamName: node.homeTeamName, awayTeamName: node.awayTeamName,
        ...timing
      });
    }
  } else if (format === 'Hibrido') {
    const groups = distributeTeamsIntoGroups(teams, groupCount);
    let maxGroupMatchday = 1;
    // Fase de grupos: SOLO IDA o IDA Y VUELTA (nunca Bo3)
    const groupMatchMode = matchMode === 'IdaVuelta' ? 'IdaVuelta' : 'PartidoUnico';
    const totalLegs = groupMatchMode === 'IdaVuelta' ? 2 : 1;

    for (const [groupIndex, group] of groups.entries()) {
      const groupTeams = [...group.teams];
      if (groupTeams.length % 2 !== 0) groupTeams.push({ id: 'BYE', name: 'DESCANSO (BYE)', tag: null });
      
      const numTeams = groupTeams.length;
      const singleRoundMatchesCount = numTeams - 1;
      const matchesPerRound = numTeams / 2;

      for (let leg = 0; leg < totalLegs; leg++) {
        for (let round = 0; round < singleRoundMatchesCount; round++) {
          const matchdayNumber = leg * singleRoundMatchesCount + round + 1;
          if (matchdayNumber > maxGroupMatchday) maxGroupMatchday = matchdayNumber;
          const timing = getScheduledDateTime(matchdayNumber);

          for (let matchIndex = 0; matchIndex < matchesPerRound; matchIndex++) {
            const rawHomeIndex = (round + matchIndex) % (numTeams - 1);
            let rawAwayIndex = (numTeams - 1 - matchIndex + round) % (numTeams - 1);
            if (matchIndex === 0) rawAwayIndex = numTeams - 1;

            const homeIndex = leg === 0 ? rawHomeIndex : rawAwayIndex;
            const awayIndex = leg === 0 ? rawAwayIndex : rawHomeIndex;

            const home = groupTeams[homeIndex];
            const away = groupTeams[awayIndex];

            if (home.id !== 'BYE' && away.id !== 'BYE') {
              await insertMatch({
                id: `m-${compClean}-g${groupIndex + 1}-j${matchdayNumber}-m${matchIndex + 1}`,
                matchdayNumber, stage: 'GROUP', groupName: group.groupName,
                homeTeamId: home.id, awayTeamId: away.id,
                homeTeamName: home.name, awayTeamName: away.name,
                ...timing
              });
            }
          }
        }
      }
    }

    const playoffTeamCount = groupCount * qualifiersPerGroup;
    // Fase de Playoffs en formato Híbrido: soporta PartidoUnico, IdaVuelta o MejorDe3
    const playoffMode = playoffMatchMode || matchMode;
    const playoffNodes = generatePlayoffBracket(competitionId, teams.slice(0, playoffTeamCount), playoffMode, true, groupCount, qualifiersPerGroup);

    for (const node of playoffNodes.reverse()) {
      let playoffRoundOffset = node.roundOrder;
      if (playoffMode === 'IdaVuelta') {
        playoffRoundOffset = (node.roundOrder - 1) * 2 + (node.legType === 'VUELTA' ? 2 : 1);
      } else if (playoffMode === 'MejorDe3') {
        const jNum = /-j([123])$/i.exec(node.id)?.[1] || '1';
        playoffRoundOffset = (node.roundOrder - 1) * 3 + Number(jNum);
      }
      const matchdayNumber = maxGroupMatchday + playoffRoundOffset;
      const timing = getScheduledDateTime(matchdayNumber);

      await insertMatch({
        id: node.id, matchdayNumber, stage: 'PLAYOFF', roundName: node.roundName,
        nextMatchId: node.nextMatchId, nextMatchSlot: node.nextMatchSlot,
        homeTeamId: node.homeTeamId, awayTeamId: node.awayTeamId,
        homeTeamName: node.homeTeamName, awayTeamName: node.awayTeamName,
        ...timing
      });
    }
  } else {
    // Liga: SOLO IDA o IDA Y VUELTA (nunca Bo3)
    const teamsCopy = [...teams];
    if (teamsCopy.length % 2 !== 0) teamsCopy.push({ id: 'BYE', name: 'DESCANSO (BYE)', tag: null });
    
    const numTeams = teamsCopy.length;
    const singleRoundMatchesCount = numTeams - 1;
    const matchesPerRound = numTeams / 2;
    const leagueMatchMode = matchMode === 'IdaVuelta' ? 'IdaVuelta' : 'PartidoUnico';
    const totalLegs = leagueMatchMode === 'IdaVuelta' ? 2 : 1;

    for (let leg = 0; leg < totalLegs; leg++) {
      for (let round = 0; round < singleRoundMatchesCount; round++) {
        const matchdayNumber = leg * singleRoundMatchesCount + round + 1;
        const timing = getScheduledDateTime(matchdayNumber);

        for (let matchIndex = 0; matchIndex < matchesPerRound; matchIndex++) {
          const rawHomeIndex = (round + matchIndex) % (numTeams - 1);
          let rawAwayIndex = (numTeams - 1 - matchIndex + round) % (numTeams - 1);
          if (matchIndex === 0) rawAwayIndex = numTeams - 1;

          const homeIndex = leg === 0 ? rawHomeIndex : rawAwayIndex;
          const awayIndex = leg === 0 ? rawAwayIndex : rawHomeIndex;

          const home = teamsCopy[homeIndex];
          const away = teamsCopy[awayIndex];

          if (home.id !== 'BYE' && away.id !== 'BYE') {
            await insertMatch({
              id: `m-${compClean}-j${matchdayNumber}-m${matchIndex + 1}`,
              matchdayNumber, stage: 'GROUP', groupName: 'LIGA',
              homeTeamId: home.id, awayTeamId: away.id,
              homeTeamName: home.name, awayTeamName: away.name,
              ...timing
            });
          }
        }
      }
    }
  }

  await transaction.matches.createMany(matchesToInsert);
  return matchesToInsert.length;
}

export interface CreateSeasonResult {
  success: boolean;
  message?: string;
  seasonId?: string;
  seasonName?: string;
  error?: string;
  code?: string;
}

export async function createSeasonService(
  name: string,
  organizationId?: string,
  startDate?: string,
  endDate?: string
): Promise<CreateSeasonResult> {
  try {
    if (!name || name.trim() === '') {
      return { success: false, error: 'El nombre de la temporada es obligatorio.', code: 'VALIDATION_ERROR' };
    }

    const season = await dbProvider.seasons.create({
      name: name.trim(),
      organizationId: organizationId || null,
      startDate: startDate || null,
      endDate: endDate || null,
      status: 'Activa',
    });

    return {
      success: true,
      message: `Temporada "${name.trim()}" creada exitosamente.`,
      seasonId: season.id,
      seasonName: season.name,
    };
  } catch (error: unknown) {
    console.error('Error en createSeasonService:', error);
    return { success: false, error: getErrorMessage(error, 'Error al crear la temporada.'), code: 'INTERNAL_ERROR' };
  }
}

export interface GameDynamicConfig {
  gameSlug: string;
  name: string;
  maxSquadCap: number;
  maxTransfersPerWindow: number;
  postExpirationDays: number;
  positions: string[];
  brandColor: string;
}

export async function getGameConfigurationService(gameSlug: string): Promise<GameDynamicConfig> {
  const fallbackCap = gameSlug === 'eafc26' ? 20 : 7;
  const fallbackPositions = GAMES_CATALOG[gameSlug]?.positions || ['MCO', 'DFC', 'LD', 'LI', 'MCD', 'MC', 'DC'];
  const fallbackColor = GAMES_CATALOG[gameSlug]?.brandColor || '#00F0FF';
  const fallbackName = GAMES_CATALOG[gameSlug]?.name || gameSlug.toUpperCase();

  try {
    await dbProvider.query(
      `INSERT INTO \`games\` (\`slug\`, \`name\`, \`category\`, \`team_size\`, \`max_roster_members\`, \`max_squad_cap\`, \`max_transfers_per_window\`, \`post_expiration_days\`, \`positions_json\`, \`brand_color\`)
       VALUES (?, ?, ?, 11, 45, ?, 3, 7, ?, ?)
       ON DUPLICATE KEY UPDATE \`max_squad_cap\` = VALUES(\`max_squad_cap\`)`,
      [gameSlug, fallbackName, 'Deportes', fallbackCap, JSON.stringify(fallbackPositions), fallbackColor]
    ).catch(() => {});

    const rows = await dbProvider.query<GameConfigurationRow>(
      `SELECT slug, name, max_squad_cap, max_transfers_per_window, post_expiration_days, positions_json, brand_color FROM games WHERE slug = ?`,
      [gameSlug]
    );

    if (rows && rows.length > 0) {
      const row = rows[0];
      let parsedPositions: string[] = fallbackPositions;
      if (row.positions_json) {
        try {
          parsedPositions = typeof row.positions_json === 'string' ? JSON.parse(row.positions_json) : row.positions_json;
        } catch {
          parsedPositions = fallbackPositions;
        }
      }

      return {
        gameSlug: row.slug,
        name: row.name || fallbackName,
        maxSquadCap: Number(row.max_squad_cap) || fallbackCap,
        maxTransfersPerWindow: Number(row.max_transfers_per_window) || 3,
        postExpirationDays: Number(row.post_expiration_days) || 7,
        positions: Array.isArray(parsedPositions) && parsedPositions.length > 0 ? parsedPositions : fallbackPositions,
        brandColor: row.brand_color || fallbackColor,
      };
    }
  } catch (err) {
    console.error('MySQL Error in getGameConfigurationService:', err);
  }

  return {
    gameSlug,
    name: fallbackName,
    maxSquadCap: fallbackCap,
    maxTransfersPerWindow: 3,
    postExpirationDays: 7,
    positions: fallbackPositions,
    brandColor: fallbackColor,
  };
}
