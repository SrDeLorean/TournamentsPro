// =============================================================================
// TournamentsPro — Competitions, Seasons & Fixtures Service
// =============================================================================

import type { Competition, IDatabaseProvider } from '@/lib/db/interfaces';
import { dbProvider } from '@/lib/db/provider';
import { validateSchema } from '@/lib/validation';
import { GAMES_CATALOG } from '@/lib/games-data';
import { getErrorMessage, type GameConfigurationRow } from './types';

export interface CreateCompetitionInput {
  name: string;
  gameSlug: 'eafc26' | 'valorant' | 'csgo' | 'lol' | 'rocketleague' | 'fortnite';
  modeFormat: string;
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

  const { name, gameSlug, modeFormat, fechaLimiteInscripcion, fechaInicio, fechaTermino, description, prizePool, transferMarketMode, seasonId, newSeasonName } = validation.data;

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
  matchMode: 'PartidoUnico' | 'IdaVuelta';
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
    const competitions = await transaction.query<{ id: string }>(
      'SELECT id FROM competitions WHERE id = ? FOR UPDATE',
      [competitionId],
    );
    if (competitions.length === 0) {
      return { success: false, error: 'Competencia no encontrada', code: 'NOT_FOUND' };
    }

    const enrolledTeamsData = await transaction.query<{
      team_id: string;
      team_name: string;
      team_tag: string | null;
    }>(
      "SELECT team_id, team_name, team_tag FROM competition_teams WHERE competition_id = ? AND status = 'CONFIRMADO' FOR UPDATE",
      [competitionId],
    );
    if (enrolledTeamsData.length < 2) {
      return { success: false, error: 'Se requieren al menos 2 equipos confirmados', code: 'NOT_ENOUGH_TEAMS' };
    }

    const teams = enrolledTeamsData.map((team) => ({
      id: team.team_id,
      name: team.team_name,
      tag: team.team_tag,
    }));

    await transaction.execute(
      'DELETE FROM matches WHERE competition_id = ? OR tournament_id = ?',
      [competitionId, competitionId],
    );

    const { startDate, selectedDays, selectedTimes, matchMode, format, groupCount, qualifiersPerGroup } = config;
    const totalSavedMatches = await generateMatchesForFormat(
      transaction,
      competitionId,
      teams,
      format,
      matchMode,
      startDate,
      selectedDays,
      selectedTimes,
      groupCount,
      qualifiersPerGroup,
    );

    await transaction.execute(
      `UPDATE competitions
          SET status = 'Activo', format = ?, match_mode = ?, group_count = ?, qualifiers_per_group = ?
        WHERE id = ?`,
      [config.format, config.matchMode, config.groupCount, config.qualifiersPerGroup, competitionId],
    );

    return { success: true, matchesCreated: totalSavedMatches };
  });
}

async function generateMatchesForFormat(
  transaction: IDatabaseProvider,
  competitionId: string,
  teams: { id: string; name: string; tag: string | null }[],
  format: 'Liga' | 'Playoff' | 'Hibrido',
  matchMode: 'PartidoUnico' | 'IdaVuelta',
  startDate: string,
  selectedDays: string[],
  selectedTimes: string[],
  groupCount: number,
  qualifiersPerGroup: number
): Promise<number> {
  const { getMatchdayDateTime } = await import('@/lib/fixture-date-scheduler');
  const { distributeTeamsIntoGroups, generatePlayoffBracket } = await import('@/lib/matchmaking-bracket');
  
  let totalSavedMatches = 0;
  const compClean = competitionId.replace(/[^a-zA-Z0-9]/g, '');
  
  const days = selectedDays.length > 0 ? selectedDays : ['Martes', 'Jueves'];
  const times = selectedTimes.length > 0 ? selectedTimes : ['20:00'];
  
  const timeSlotsConfig: { dayLabel: string; time: string }[] = [];
  days.forEach(dayLabel => times.forEach(time => timeSlotsConfig.push({ dayLabel, time })));

  const getScheduledDateTime = (matchdayNumber: number) => {
    const info = getMatchdayDateTime(matchdayNumber, startDate, days, times);
    return { scheduledTime: info.timeStr, scheduledDateTimeISO: info.iso };
  };

  const insertMatch = async (matchData: GeneratedMatchData) => {
    await transaction.execute(
      `INSERT INTO matches
        (id, tournament_id, competition_id, matchday, round, stage, round_name, group_name,
         next_match_id, next_match_slot, team_home_id, home_team_id, team_away_id, away_team_id,
         home_team_name, away_team_name, status, scheduled_time, scheduled_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', ?, ?, NOW())`,
      [
        matchData.id, competitionId, competitionId, matchData.matchdayNumber, matchData.matchdayNumber,
        matchData.stage, matchData.roundName || null, matchData.groupName || null,
        matchData.nextMatchId || null, matchData.nextMatchSlot || null,
        matchData.homeTeamId, matchData.homeTeamId, matchData.awayTeamId, matchData.awayTeamId,
        matchData.homeTeamName, matchData.awayTeamName, matchData.scheduledTime, matchData.scheduledDateTimeISO,
      ],
    );
    totalSavedMatches++;
  };

  if (format === 'Playoff') {
    const playoffNodes = generatePlayoffBracket(competitionId, teams, matchMode);
    for (const node of playoffNodes.reverse()) {
      let matchdayNumber = node.roundOrder;
      if (matchMode === 'IdaVuelta') {
        matchdayNumber = (node.roundOrder - 1) * 2 + (node.legType === 'VUELTA' ? 2 : 1);
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

    for (const [groupIndex, group] of groups.entries()) {
      const groupTeams = [...group.teams];
      if (groupTeams.length % 2 !== 0) groupTeams.push({ id: 'BYE', name: 'DESCANSO (BYE)', tag: null });
      
      const numTeams = groupTeams.length;
      const singleRoundMatchesCount = numTeams - 1;
      const matchesPerRound = numTeams / 2;
      const totalLegs = matchMode === 'IdaVuelta' ? 2 : 1;

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
    const playoffNodes = generatePlayoffBracket(competitionId, teams.slice(0, playoffTeamCount), matchMode, true, groupCount, qualifiersPerGroup);

    for (const node of playoffNodes.reverse()) {
      let playoffRoundOffset = node.roundOrder;
      if (matchMode === 'IdaVuelta') {
        playoffRoundOffset = (node.roundOrder - 1) * 2 + (node.legType === 'VUELTA' ? 2 : 1);
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
    const teamsCopy = [...teams];
    if (teamsCopy.length % 2 !== 0) teamsCopy.push({ id: 'BYE', name: 'DESCANSO (BYE)', tag: null });
    
    const numTeams = teamsCopy.length;
    const singleRoundMatchesCount = numTeams - 1;
    const matchesPerRound = numTeams / 2;
    const totalLegs = matchMode === 'IdaVuelta' ? 2 : 1;

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

  return totalSavedMatches;
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
