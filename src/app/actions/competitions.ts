'use server';

import { revalidatePath } from 'next/cache';
import { dbProvider } from '@/lib/db/provider';
import {
  AuthorizationError,
  getServerUserSession,
  requireCompetitionManager,
  requireServerActor,
  requireTeamManager,
} from '@/lib/auth-server';
import { validateSchema, createCompetitionSchema } from '@/lib/validation';
import { z } from 'zod';
import { createCompetitionService, generateFixtureService } from '@/lib/services';
import { getActionErrorMessage, stringFormValue } from '@/lib/action-utils';

export type CompetitionStatus = 'Borrador' | 'Inscripcion' | 'En Curso' | 'Finalizada' | 'Eliminada' | 'Activo' | 'Finalizado' | 'Deshabilitado';

export interface CompetitionData {
  id: string;
  name: string;
  game_slug: string;
  organizer_id: string | null;
  organizer_name: string | null;
  organization_id: string | null;
  season_id: string | null;
  prize_pool: string | null;
  transfer_market_mode: 'ABIERTO' | 'CERRADO' | 'SIN_MERCADO';
  mode_format: string;
  format?: string;
  match_mode?: string;
  group_count?: number;
  qualifiers_per_group?: number;
  status: CompetitionStatus;
  fecha_limite_inscripcion: string | null;
  fecha_inicio: string;
  fecha_termino: string | null;
  description: string | null;
  created_at: string;
}

export interface CompetitionTeamData {
  id: string;
  competition_id: string;
  team_id: string;
  team_name: string;
  team_tag: string | null;
  enrolled_at: string;
  status: 'INSCRITO' | 'CONFIRMADO' | 'RETIRADO';
}

interface PlayoffMatchRow {
  next_match_id: string | null;
  next_match_slot: 'HOME' | 'AWAY' | 'VUELTA_TARGET' | null;
  home_team_id: string | null;
  team_home_id: string | null;
  away_team_id: string | null;
  team_away_id: string | null;
  home_team_name: string | null;
  away_team_name: string | null;
}

export async function createCompetitionAction(formData: FormData): Promise<{
  success: boolean; message?: string; competitionId?: string; error?: string; code?: string;
}> {
  try {
    const actor = await requireServerActor(['Administrador', 'Organizador']);
    const rawData = {
      name: stringFormValue(formData, 'name')?.trim(),
      gameSlug: stringFormValue(formData, 'gameSlug') || 'eafc26',
      modeFormat: stringFormValue(formData, 'modeFormat') || '11v11',
      fechaLimiteInscripcion: stringFormValue(formData, 'fechaLimiteInscripcion'),
      fechaInicio: stringFormValue(formData, 'fechaInicio'),
      fechaTermino: stringFormValue(formData, 'fechaTermino'),
      description: stringFormValue(formData, 'description')?.trim() || null,
      prizePool: stringFormValue(formData, 'prizePool')?.trim() || null,
      transferMarketMode: stringFormValue(formData, 'transferMarketMode') || 'ABIERTO',
      format: stringFormValue(formData, 'format') || 'Liga',
      matchMode: stringFormValue(formData, 'matchMode') || 'PartidoUnico',
      playoffMatchMode: stringFormValue(formData, 'playoffMatchMode') || undefined,
      seasonId: stringFormValue(formData, 'seasonId') || null,
      newSeasonName: stringFormValue(formData, 'newSeasonName')?.trim(),
    };

    const validation = validateSchema(createCompetitionSchema, rawData);

    if (!validation.success) {
      return { success: false, error: validation.errors.join(', '), code: 'VALIDATION_ERROR' };
    }

    const data = validation.data;

    const session = await getServerUserSession();
    const organizerId = actor.userId;
    const organizerName = session?.name || 'Organizador';
    const organizationId = session?.organizationId || null;

    let finalSeasonId = data.seasonId;
    if (data.newSeasonName && data.newSeasonName !== '') {
      const { createSeasonService } = await import('@/lib/services');
      const seasonRes = await createSeasonService(data.newSeasonName, organizationId || undefined);
      if (seasonRes.success && seasonRes.seasonId) {
        finalSeasonId = seasonRes.seasonId;
      }
    }

    const result = await createCompetitionService(
      { ...data, seasonId: finalSeasonId },
      organizerId,
      organizerName,
      organizationId
    );

    if (result.success) {
      revalidatePath('/dashboard/competencias');
      return { success: true, message: `Competencia "${data.name}" creada exitosamente.`, competitionId: result.competition?.id };
    }

    return result;
  } catch (error: unknown) {
    console.error('Error en createCompetitionAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al crear la competencia.'), code: 'INTERNAL_ERROR' };
  }
}

export async function updateCompetitionStatusAction(id: string, newStatus: CompetitionStatus) {
  try {
    if (!id || !newStatus) {
      return { success: false, error: 'ID de competencia y estado requeridos.', code: 'MISSING_PARAMS' };
    }

    await requireCompetitionManager(id);

    const session = await getServerUserSession();
    if (session?.role !== 'Administrador') {
      const comp = await dbProvider.competitions.findById(id);
      if (comp) {
        const isOwner = (session?.organizationId && comp.organizationId === session.organizationId) || comp.organizerId === session?.userId;
        if (!isOwner) {
          return { success: false, error: 'No tienes autorización para modificar competencias fuera de tu Organización.', code: 'FORBIDDEN' };
        }
      }
    }

    await dbProvider.competitions.update(id, { status: newStatus });

    revalidatePath('/dashboard/competencias');
    revalidatePath(`/dashboard/competencias/${id}`);
    return { success: true, message: `Estado de la competencia actualizado a "${newStatus}".` };
  } catch (error: unknown) {
    console.error('Error en updateCompetitionStatusAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al actualizar el estado.'), code: 'INTERNAL_ERROR' };
  }
}

export async function enrollTeamAction(competitionId: string, teamId: string, teamName: string, teamTag?: string) {
  try {
    if (!competitionId || !teamId) {
      return { success: false, error: 'Competencia y equipo son requeridos.', code: 'MISSING_PARAMS' };
    }

    try {
      await requireTeamManager(teamId);
    } catch (error) {
      if (!(error instanceof AuthorizationError)) throw error;
      await requireCompetitionManager(competitionId);
    }

    const [comp, team] = await Promise.all([
      dbProvider.competitions.findById(competitionId),
      dbProvider.teams.findById(teamId),
    ]);

    if (comp && team && comp.gameSlug !== team.gameSlug) {
      return {
        success: false,
        error: `Restricción de juego: No puedes inscribir un equipo de ${team.gameSlug.toUpperCase()} en una competencia de ${comp.gameSlug.toUpperCase()}.`,
        code: 'GAME_MISMATCH',
      };
    }

    const enrollId = `ct-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await dbProvider.competitions.upsertCompetitionTeam(enrollId, competitionId, teamId, teamName, teamTag || null);

    revalidatePath(`/dashboard/competencias/${competitionId}`);
    return { success: true, message: `Equipo "${teamName}" inscrito correctamente.` };
  } catch (error: unknown) {
    console.error('Error en enrollTeamAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al inscribir equipo.'), code: 'INTERNAL_ERROR' };
  }
}

export async function enrollIndividualAthleteAction(
  competitionId: string,
  userId: string,
  userName: string,
  gamertag?: string
): Promise<{ success: boolean; message?: string; error?: string; code?: string }> {
  try {
    if (!competitionId || !userId) {
      return { success: false, error: 'Competencia y atleta son requeridos.', code: 'MISSING_PARAMS' };
    }

    const actor = await requireServerActor();
    if (actor.userId !== userId && actor.role !== 'Administrador') {
      await requireCompetitionManager(competitionId);
    }

    const result = await dbProvider.withTransaction(async (transaction) => {
      const compRows = await transaction.query<{ game_slug: string }>(
        'SELECT game_slug FROM competitions WHERE id = ? FOR UPDATE',
        [competitionId],
      );
      if (compRows.length === 0) {
        return { success: false, error: 'Competencia no encontrada.', code: 'NOT_FOUND' };
      }

      const gameSlug = compRows[0].game_slug;
      const athleteLabel = gamertag || userName;
      await transaction.query('SELECT id FROM users WHERE id = ? FOR UPDATE', [userId]);
      const existingTeams = await transaction.query<{ id: string }>(
        'SELECT id FROM teams WHERE captain_id = ? AND game_slug = ? LIMIT 1 FOR UPDATE',
        [userId, gameSlug],
      );
      let teamId = existingTeams[0]?.id;

      if (!teamId) {
        teamId = `team-solo-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await transaction.execute(
          `INSERT INTO teams (id, name, tag, game_slug, captain_id, captain_name, platform, members_count, max_members, color, status)
           VALUES (?, ?, 'SOLO', ?, ?, ?, 'CROSSPLAY', 1, 2, '#00F0FF', 'Activo')`,
          [teamId, athleteLabel, gameSlug, userId, userName],
        );
        await transaction.execute(
          `INSERT INTO team_members (id, team_id, user_id, tactical_position, role_in_team)
           VALUES (?, ?, ?, 'Individual', 'Capitan')
           ON DUPLICATE KEY UPDATE role_in_team = 'Capitan'`,
          [`tm-solo-${Date.now()}`, teamId, userId],
        );
      }

      await transaction.execute(
        `INSERT INTO competition_teams (id, competition_id, team_id, team_name, team_tag, status)
         VALUES (?, ?, ?, ?, 'SOLO', 'CONFIRMADO')
         ON DUPLICATE KEY UPDATE status = 'CONFIRMADO', team_name = VALUES(team_name)`,
        [`ct-${Date.now()}-${Math.floor(Math.random() * 1000)}`, competitionId, teamId, athleteLabel],
      );
      return { success: true, message: `Atleta "${athleteLabel}" inscrito correctamente.` };
    });

    if (result.success) revalidatePath(`/dashboard/competencias/${competitionId}`);
    return result;
  } catch (error: unknown) {
    console.error('Error en enrollIndividualAthleteAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al inscribir atleta individual.'), code: 'INTERNAL_ERROR' };
  }
}

export async function removeEnrolledTeamAction(competitionId: string, teamId: string) {
  try {
    try {
      await requireTeamManager(teamId);
    } catch (error) {
      if (!(error instanceof AuthorizationError)) throw error;
      await requireCompetitionManager(competitionId);
    }
    await dbProvider.competitions.removeEnrolledTeam(competitionId, teamId);

    revalidatePath(`/dashboard/competencias/${competitionId}`);
    return { success: true, message: 'Equipo retirado de la competencia.' };
  } catch (error: unknown) {
    console.error('Error en removeEnrolledTeamAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al retirar equipo.'), code: 'INTERNAL_ERROR' };
  }
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

export async function generateFixtureAction(
  competitionId: string,
  configOptions?: Partial<FixtureConfig>
): Promise<{ success: boolean; message?: string; error?: string; code?: string }> {
  try {
    await requireCompetitionManager(competitionId);
    const enrolledTeams = await dbProvider.competitions.getEnrolledTeams(competitionId);

    if (enrolledTeams.length < 2) {
      return { success: false, error: 'Se requieren al menos 2 equipos confirmados para generar el fixture.', code: 'NOT_ENOUGH_TEAMS' };
    }

    const competition = await dbProvider.competitions.findById(competitionId);

    if (!competition) {
      return { success: false, error: 'Competencia no encontrada.', code: 'NOT_FOUND' };
    }
    const parsedFormat = z.enum(['Liga', 'Playoff', 'Hibrido']).safeParse(configOptions?.format || competition.format || competition.modeFormat);
    const format: FixtureConfig['format'] = parsedFormat.success ? parsedFormat.data : 'Liga';
    let matchMode = configOptions?.matchMode || (competition.matchMode as any) || 'PartidoUnico';
    if (format === 'Liga' && matchMode === 'MejorDe3') {
      matchMode = 'PartidoUnico';
    }
    const playoffMatchMode = configOptions?.playoffMatchMode;
    const startDateBase = configOptions?.startDate || competition.fechaInicio || new Date().toISOString();

    const config: FixtureConfig = {
      startDate: startDateBase,
      selectedDays: configOptions?.selectedDays?.length ? configOptions.selectedDays : ['Martes', 'Jueves'],
      selectedTimes: configOptions?.selectedTimes?.length ? configOptions.selectedTimes : ['20:00'],
      matchMode,
      playoffMatchMode,
      format,
      groupCount: configOptions?.groupCount || 3,
      qualifiersPerGroup: configOptions?.qualifiersPerGroup || 2,
    };

    const result = await generateFixtureService(competitionId, config);

    if (result.success) {
      revalidatePath(`/dashboard/competencias/${competitionId}`);
      const modeLabel = matchMode === 'IdaVuelta' ? 'Ida y Vuelta' : matchMode === 'MejorDe3' ? 'Mejor de 3 (Bo3)' : 'Partido Único';
      return {
        success: true,
        message: `¡Fixture guardado (${format} - ${modeLabel})! Se crearon ${result.matchesCreated} partidos de forma exitosa.`,
      };
    }

    return result;
  } catch (error: unknown) {
    console.error('Error en generateFixtureAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al guardar el fixture.'), code: 'INTERNAL_ERROR' };
  }
}

export async function regenerateFixtureAction(
  competitionId: string,
  configOptions?: Partial<FixtureConfig> & { confirmedNameCheck?: string }
): Promise<{ success: boolean; message?: string; error?: string; code?: string }> {
  try {
    await requireCompetitionManager(competitionId);
    const competition = await dbProvider.competitions.findById(competitionId);

    if (!competition) {
      return { success: false, error: 'Competencia no encontrada.', code: 'NOT_FOUND' };
    }

    const count = await dbProvider.competitions.getReportedMatchesCount(competitionId);
    const hasReportedResults = count > 0;

    if (hasReportedResults) {
      const typedName = (configOptions?.confirmedNameCheck || '').trim();
      if (typedName !== competition.name.trim()) {
        return {
          success: false,
          error: `El nombre ingresado ("${typedName}") no coincide exactamente con "${competition.name}".`,
          code: 'NAME_MISMATCH',
        };
      }
    }

    return await generateFixtureAction(competitionId, configOptions);
  } catch (error: unknown) {
    console.error('Error en regenerateFixtureAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al regenerar el fixture.'), code: 'INTERNAL_ERROR' };
  }
}

export async function advancePlayoffWinnerAction(
  matchId: string,
  winnerTeamId: string,
  winnerTeamName: string
): Promise<{ success: boolean; message?: string; error?: string; code?: string }> {
  try {
    if (!matchId || !winnerTeamId) {
      return { success: false, error: 'ID de partido y equipo ganador requeridos.', code: 'MISSING_PARAMS' };
    }

    const competitionId = await dbProvider.competitions.getMatchCompetitionId(matchId);
    if (!competitionId) {
      return { success: false, error: 'El partido no está asociado a una competencia o no existe.', code: 'INVALID_MATCH' };
    }

    await requireCompetitionManager(competitionId);
    const result = await dbProvider.withTransaction(async (transaction) => {
      const lockedMatches = await transaction.query<PlayoffMatchRow>('SELECT * FROM matches WHERE id = ? FOR UPDATE', [matchId]);
      if (lockedMatches.length === 0) return { success: false, error: 'Partido no encontrado.', code: 'NOT_FOUND' };
      const currentMatch = lockedMatches[0];
      if (currentMatch.next_match_id) {
        await transaction.query('SELECT id FROM matches WHERE id = ? FOR UPDATE', [currentMatch.next_match_id]);
      }

      const res = await transaction.execute(
        "UPDATE matches SET winner_team_id = ?, status = 'TERMINADO' WHERE id = ? AND status <> 'TERMINADO'",
        [winnerTeamId, matchId]
      );

      if ((res as any).affectedRows !== 1) {
        throw new Error('El partido ya fue finalizado por otro usuario.');
      }

      if (!currentMatch.next_match_id) {
        return { success: true, message: `¡Partido finalizado! El equipo "${winnerTeamName}" ha ganado la competencia.` };
      }

      const nextMatchId = currentMatch.next_match_id;
      const nextSlot = currentMatch.next_match_slot || 'HOME';
      const isBo3Target = /-j1$/i.test(nextMatchId);
      const isTwoLegTarget = /-ida$/i.test(nextMatchId);

      if (nextSlot === 'VUELTA_TARGET') {
        await transaction.execute(
          `UPDATE matches SET home_team_id = ?, home_team_name = ?, team_home_id = ?, away_team_id = ?, away_team_name = ?, team_away_id = ? WHERE id = ?`,
          [
            currentMatch.away_team_id || currentMatch.team_away_id,
            currentMatch.away_team_name,
            currentMatch.away_team_id || currentMatch.team_away_id,
            currentMatch.home_team_id || currentMatch.team_home_id,
            currentMatch.home_team_name,
            currentMatch.home_team_id || currentMatch.team_home_id,
            nextMatchId,
          ],
        );
      } else if (nextSlot === 'HOME') {
        if (isBo3Target) {
          const nextJ1 = nextMatchId;
          const nextJ2 = nextMatchId.replace(/-j1$/i, '-j2');
          const nextJ3 = nextMatchId.replace(/-j1$/i, '-j3');
          await transaction.execute(
            'UPDATE matches SET home_team_id = ?, home_team_name = ?, team_home_id = ? WHERE id IN (?, ?)',
            [winnerTeamId, winnerTeamName, winnerTeamId, nextJ1, nextJ3]
          );
          await transaction.execute(
            'UPDATE matches SET away_team_id = ?, away_team_name = ?, team_away_id = ? WHERE id = ?',
            [winnerTeamId, winnerTeamName, winnerTeamId, nextJ2]
          );
        } else if (isTwoLegTarget) {
          const nextIda = nextMatchId;
          const nextVuelta = nextMatchId.replace(/-ida$/i, '-vuelta');
          await transaction.execute(
            'UPDATE matches SET home_team_id = ?, home_team_name = ?, team_home_id = ? WHERE id = ?',
            [winnerTeamId, winnerTeamName, winnerTeamId, nextIda]
          );
          await transaction.execute(
            'UPDATE matches SET away_team_id = ?, away_team_name = ?, team_away_id = ? WHERE id = ?',
            [winnerTeamId, winnerTeamName, winnerTeamId, nextVuelta]
          );
        } else {
          await transaction.execute(
            'UPDATE matches SET home_team_id = ?, home_team_name = ?, team_home_id = ? WHERE id = ?',
            [winnerTeamId, winnerTeamName, winnerTeamId, nextMatchId],
          );
        }
      } else if (nextSlot === 'AWAY') {
        if (isBo3Target) {
          const nextJ1 = nextMatchId;
          const nextJ2 = nextMatchId.replace(/-j1$/i, '-j2');
          const nextJ3 = nextMatchId.replace(/-j1$/i, '-j3');
          await transaction.execute(
            'UPDATE matches SET away_team_id = ?, away_team_name = ?, team_away_id = ? WHERE id IN (?, ?)',
            [winnerTeamId, winnerTeamName, winnerTeamId, nextJ1, nextJ3]
          );
          await transaction.execute(
            'UPDATE matches SET home_team_id = ?, home_team_name = ?, team_home_id = ? WHERE id = ?',
            [winnerTeamId, winnerTeamName, winnerTeamId, nextJ2]
          );
        } else if (isTwoLegTarget) {
          const nextIda = nextMatchId;
          const nextVuelta = nextMatchId.replace(/-ida$/i, '-vuelta');
          await transaction.execute(
            'UPDATE matches SET away_team_id = ?, away_team_name = ?, team_away_id = ? WHERE id = ?',
            [winnerTeamId, winnerTeamName, winnerTeamId, nextIda]
          );
          await transaction.execute(
            'UPDATE matches SET home_team_id = ?, home_team_name = ?, team_home_id = ? WHERE id = ?',
            [winnerTeamId, winnerTeamName, winnerTeamId, nextVuelta]
          );
        } else {
          await transaction.execute(
            'UPDATE matches SET away_team_id = ?, away_team_name = ?, team_away_id = ? WHERE id = ?',
            [winnerTeamId, winnerTeamName, winnerTeamId, nextMatchId],
          );
        }
      }
      return { success: true, message: `¡Auto-avance exitoso! "${winnerTeamName}" avanza a la siguiente llave (${nextMatchId}).` };
    });

    if (result.success) revalidatePath(`/dashboard/competencias/${competitionId}`);
    return result;
  } catch (error: unknown) {
    console.error('Error en advancePlayoffWinnerAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al ejecutar el auto-avance del ganador.'), code: 'INTERNAL_ERROR' };
  }
}

export async function reportMatchResultAction(matchId: string, homeScore: number, awayScore: number): Promise<{ success: boolean; message?: string; error?: string; code?: string }> {
  try {
    const competitionId = await dbProvider.competitions.getMatchCompetitionId(matchId);
    if (!competitionId) throw new Error('Partido no encontrado');
    await requireCompetitionManager(competitionId);
    const result = await dbProvider.withTransaction(async (transaction) => {
      const lockedMatches = await transaction.query<any>('SELECT * FROM matches WHERE id = ? FOR UPDATE', [matchId]);
      if (lockedMatches.length === 0) return { success: false, error: 'Partido no encontrado.', code: 'NOT_FOUND' };
      const currentMatch = lockedMatches[0];

      const { parseBo3GameInfo, evaluateBo3Series } = await import('@/lib/bo3-series');
      const gameInfo = parseBo3GameInfo(currentMatch);

      if (gameInfo.isBo3 && gameInfo.gameNumber === 3) {
        const compMatches = await transaction.query<any>('SELECT * FROM matches WHERE competition_id = ? OR tournament_id = ?', [competitionId, competitionId]);
        const seriesMatches = compMatches.filter((m: any) => parseBo3GameInfo(m).baseSeriesId === gameInfo.baseSeriesId);
        const evalResult = evaluateBo3Series(seriesMatches);
        if (evalResult.isGame3Locked || evalResult.isDefined) {
          return {
            success: false,
            error: `La serie al Mejor de 3 ya fue definida (${evalResult.scoreSummary}). El Juego 3 no es requerido y no puede ser reportado.`,
            code: 'BO3_SERIES_ALREADY_DEFINED',
          };
        }
      }

      const winnerId = homeScore > awayScore
        ? (currentMatch.team_home_id || currentMatch.home_team_id)
        : awayScore > homeScore
          ? (currentMatch.team_away_id || currentMatch.away_team_id)
          : null;

      await transaction.execute(
        "UPDATE matches SET home_score = ?, away_score = ?, winner_team_id = ?, status = 'TERMINADO' WHERE id = ?",
        [homeScore, awayScore, winnerId, matchId]
      );

      // Check if Bo3 series is now defined (e.g. 2-0 sweep or 2-1)
      if (gameInfo.isBo3) {
        const compMatches = await transaction.query<any>('SELECT * FROM matches WHERE competition_id = ? OR tournament_id = ?', [competitionId, competitionId]);
        const seriesMatches = compMatches
          .map((m: any) => m.id === matchId ? { ...m, score_home: homeScore, score_away: awayScore, status: 'TERMINADO', winner_team_id: winnerId } : m)
          .filter((m: any) => parseBo3GameInfo(m).baseSeriesId === gameInfo.baseSeriesId);
        const evalResult = evaluateBo3Series(seriesMatches);

        if (evalResult.isDefined && evalResult.winnerTeamId) {
          const game3 = evalResult.game3;
          if (game3 && game3.status !== 'TERMINADO' && game3.status !== 'FINALIZADO') {
            await transaction.execute(
              "UPDATE matches SET status = 'CANCELADO' WHERE id = ?",
              [game3.id]
            );
          }

          // Auto advance winner if nextMatchId exists
          const anchorNextMatchId = (game3 as any)?.next_match_id || currentMatch.next_match_id;
          const anchorNextSlot = (game3 as any)?.next_match_slot || currentMatch.next_match_slot || 'HOME';
          if (anchorNextMatchId) {
            const seriesWinnerName = evalResult.winnerTeamName || '';
            const isBo3Next = /-j1$/i.test(anchorNextMatchId);
            const isTwoLegNext = /-ida$/i.test(anchorNextMatchId);
            if (isBo3Next) {
              const nextJ1 = anchorNextMatchId;
              const nextJ2 = anchorNextMatchId.replace(/-j1$/i, '-j2');
              const nextJ3 = anchorNextMatchId.replace(/-j1$/i, '-j3');
              if (anchorNextSlot === 'AWAY') {
                await transaction.execute(
                  'UPDATE matches SET away_team_id = ?, away_team_name = ?, team_away_id = ? WHERE id IN (?, ?)',
                  [evalResult.winnerTeamId, seriesWinnerName, evalResult.winnerTeamId, nextJ1, nextJ3]
                );
                await transaction.execute(
                  'UPDATE matches SET home_team_id = ?, home_team_name = ?, team_home_id = ? WHERE id = ?',
                  [evalResult.winnerTeamId, seriesWinnerName, evalResult.winnerTeamId, nextJ2]
                );
              } else {
                await transaction.execute(
                  'UPDATE matches SET home_team_id = ?, home_team_name = ?, team_home_id = ? WHERE id IN (?, ?)',
                  [evalResult.winnerTeamId, seriesWinnerName, evalResult.winnerTeamId, nextJ1, nextJ3]
                );
                await transaction.execute(
                  'UPDATE matches SET away_team_id = ?, away_team_name = ?, team_away_id = ? WHERE id = ?',
                  [evalResult.winnerTeamId, seriesWinnerName, evalResult.winnerTeamId, nextJ2]
                );
              }
            } else if (isTwoLegNext) {
              const nextIda = anchorNextMatchId;
              const nextVuelta = anchorNextMatchId.replace(/-ida$/i, '-vuelta');
              if (anchorNextSlot === 'AWAY') {
                await transaction.execute('UPDATE matches SET away_team_id = ?, away_team_name = ?, team_away_id = ? WHERE id = ?', [evalResult.winnerTeamId, seriesWinnerName, evalResult.winnerTeamId, nextIda]);
                await transaction.execute('UPDATE matches SET home_team_id = ?, home_team_name = ?, team_home_id = ? WHERE id = ?', [evalResult.winnerTeamId, seriesWinnerName, evalResult.winnerTeamId, nextVuelta]);
              } else {
                await transaction.execute('UPDATE matches SET home_team_id = ?, home_team_name = ?, team_home_id = ? WHERE id = ?', [evalResult.winnerTeamId, seriesWinnerName, evalResult.winnerTeamId, nextIda]);
                await transaction.execute('UPDATE matches SET away_team_id = ?, away_team_name = ?, team_away_id = ? WHERE id = ?', [evalResult.winnerTeamId, seriesWinnerName, evalResult.winnerTeamId, nextVuelta]);
              }
            } else {
              if (anchorNextSlot === 'AWAY') {
                await transaction.execute(
                  'UPDATE matches SET away_team_id = ?, away_team_name = ?, team_away_id = ? WHERE id = ?',
                  [evalResult.winnerTeamId, seriesWinnerName, evalResult.winnerTeamId, anchorNextMatchId]
                );
              } else {
                await transaction.execute(
                  'UPDATE matches SET home_team_id = ?, home_team_name = ?, team_home_id = ? WHERE id = ?',
                  [evalResult.winnerTeamId, seriesWinnerName, evalResult.winnerTeamId, anchorNextMatchId]
                );
              }
            }
          }
        }
      } else if (currentMatch.next_match_id) {
        // Auto-avance para Partido Único e Ida y Vuelta
        const nextMatchId = currentMatch.next_match_id;
        const nextSlot = currentMatch.next_match_slot || 'HOME';
        const isBo3Next = /-j1$/i.test(nextMatchId);
        const isTwoLegNext = /-ida$/i.test(nextMatchId);

        if (nextSlot === 'VUELTA_TARGET') {
          // IDA completada: poblar partido de VUELTA con localía invertida
          await transaction.execute(
            `UPDATE matches SET home_team_id = ?, home_team_name = ?, team_home_id = ?, away_team_id = ?, away_team_name = ?, team_away_id = ? WHERE id = ?`,
            [
              currentMatch.away_team_id || currentMatch.team_away_id,
              currentMatch.away_team_name,
              currentMatch.away_team_id || currentMatch.team_away_id,
              currentMatch.home_team_id || currentMatch.team_home_id,
              currentMatch.home_team_name,
              currentMatch.home_team_id || currentMatch.team_home_id,
              nextMatchId,
            ]
          );
        } else if (winnerId) {
          // Partido con ganador definido: avanzar automáticamente a la siguiente ronda
          const winnerTeamName = winnerId === (currentMatch.home_team_id || currentMatch.team_home_id)
            ? currentMatch.home_team_name
            : currentMatch.away_team_name;

          if (isBo3Next) {
            const nextJ1 = nextMatchId;
            const nextJ2 = nextMatchId.replace(/-j1$/i, '-j2');
            const nextJ3 = nextMatchId.replace(/-j1$/i, '-j3');
            if (nextSlot === 'AWAY') {
              await transaction.execute('UPDATE matches SET away_team_id = ?, away_team_name = ?, team_away_id = ? WHERE id IN (?, ?)', [winnerId, winnerTeamName, winnerId, nextJ1, nextJ3]);
              await transaction.execute('UPDATE matches SET home_team_id = ?, home_team_name = ?, team_home_id = ? WHERE id = ?', [winnerId, winnerTeamName, winnerId, nextJ2]);
            } else {
              await transaction.execute('UPDATE matches SET home_team_id = ?, home_team_name = ?, team_home_id = ? WHERE id IN (?, ?)', [winnerId, winnerTeamName, winnerId, nextJ1, nextJ3]);
              await transaction.execute('UPDATE matches SET away_team_id = ?, away_team_name = ?, team_away_id = ? WHERE id = ?', [winnerId, winnerTeamName, winnerId, nextJ2]);
            }
          } else if (isTwoLegNext) {
            const nextIda = nextMatchId;
            const nextVuelta = nextMatchId.replace(/-ida$/i, '-vuelta');
            if (nextSlot === 'AWAY') {
              await transaction.execute('UPDATE matches SET away_team_id = ?, away_team_name = ?, team_away_id = ? WHERE id = ?', [winnerId, winnerTeamName, winnerId, nextIda]);
              await transaction.execute('UPDATE matches SET home_team_id = ?, home_team_name = ?, team_home_id = ? WHERE id = ?', [winnerId, winnerTeamName, winnerId, nextVuelta]);
            } else {
              await transaction.execute('UPDATE matches SET home_team_id = ?, home_team_name = ?, team_home_id = ? WHERE id = ?', [winnerId, winnerTeamName, winnerId, nextIda]);
              await transaction.execute('UPDATE matches SET away_team_id = ?, away_team_name = ?, team_away_id = ? WHERE id = ?', [winnerId, winnerTeamName, winnerId, nextVuelta]);
            }
          } else {
            if (nextSlot === 'AWAY') {
              await transaction.execute('UPDATE matches SET away_team_id = ?, away_team_name = ?, team_away_id = ? WHERE id = ?', [winnerId, winnerTeamName, winnerId, nextMatchId]);
            } else {
              await transaction.execute('UPDATE matches SET home_team_id = ?, home_team_name = ?, team_home_id = ? WHERE id = ?', [winnerId, winnerTeamName, winnerId, nextMatchId]);
            }
          }
        }
      }

      return { success: true, message: 'Resultado registrado correctamente.' };
    });

    if (result.success) revalidatePath(`/dashboard/competencias/${competitionId}`);
    return result;
  } catch (error: unknown) {
    console.error('Error reportando partido:', error);
    return { success: false, error: getActionErrorMessage(error, 'Ocurrió un error en el servidor') };
  }
}

export async function getPublicCompetitionsAction(gameSlug: string): Promise<{
  success: boolean; competitions?: CompetitionData[]; error?: string;
}> {
  try {
    const comps = await dbProvider.competitions.findByGameSlug(gameSlug);
    const publicComps = comps
      .filter(c => ['Inscripcion', 'En Curso', 'Borrador', 'Activo', 'En_Juego'].includes(c.status))
      .map(c => ({
        id: c.id,
        name: c.name,
        game_slug: c.gameSlug,
        organizer_id: c.organizerId,
        organizer_name: c.organizerName,
        organization_id: c.organizationId,
        season_id: c.seasonId,
        prize_pool: c.prizePool,
        transfer_market_mode: c.transferMarketMode as any,
        mode_format: c.modeFormat,
        status: c.status as any,
        fecha_limite_inscripcion: c.fechaLimiteInscripcion,
        fecha_inicio: c.fechaInicio,
        fecha_termino: c.fechaTermino,
        description: c.description,
        created_at: c.createdAt,
      }));
    return { success: true, competitions: publicComps };
  } catch (error: unknown) {
    console.error('Error fetching public competitions:', error);
    return { success: false, error: getActionErrorMessage(error, 'Ocurrió un error en el servidor') };
  }
}
