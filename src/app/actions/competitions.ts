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
import { competitionRepository } from '@/lib/repositories';
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
  match_mode?: string;
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
      const comp = await competitionRepository.findById(id);
      if (comp) {
        const isOwner = (session?.organizationId && comp.organizationId === session.organizationId) || comp.organizerId === session?.userId;
        if (!isOwner) {
          return { success: false, error: 'No tienes autorización para modificar competencias fuera de tu Organización.', code: 'FORBIDDEN' };
        }
      }
    }

    await competitionRepository.update(id, { status: newStatus });

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

    const { competitionRepository, teamRepository } = await import('@/lib/repositories');
    const [comp, team] = await Promise.all([
      competitionRepository.findById(competitionId),
      teamRepository.findById(teamId),
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
  matchMode: 'PartidoUnico' | 'IdaVuelta';
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

    const competitions = await dbProvider.query<CompetitionData>(
      `SELECT * FROM competitions WHERE id = ?`,
      [competitionId]
    );

    if (!competitions || competitions.length === 0) {
      return { success: false, error: 'Competencia no encontrada.', code: 'NOT_FOUND' };
    }

    const competition = competitions[0];
    const parsedFormat = z.enum(['Liga', 'Playoff', 'Hibrido']).safeParse(configOptions?.format || competition.mode_format);
    const format: FixtureConfig['format'] = parsedFormat.success ? parsedFormat.data : 'Liga';
    const matchMode = configOptions?.matchMode || 'PartidoUnico';
    const startDateBase = configOptions?.startDate || competition.fecha_inicio || new Date().toISOString();

    const config: FixtureConfig = {
      startDate: startDateBase,
      selectedDays: configOptions?.selectedDays?.length ? configOptions.selectedDays : ['Martes', 'Jueves'],
      selectedTimes: configOptions?.selectedTimes?.length ? configOptions.selectedTimes : ['20:00'],
      matchMode,
      format,
      groupCount: configOptions?.groupCount || 3,
      qualifiersPerGroup: configOptions?.qualifiersPerGroup || 2,
    };

    const result = await generateFixtureService(competitionId, config);

    if (result.success) {
      revalidatePath(`/dashboard/competencias/${competitionId}`);
      return {
        success: true,
        message: `¡Fixture guardado en MySQL (${format} - ${matchMode === 'IdaVuelta' ? 'Ida y Vuelta' : 'Partido Único'})! Se crearon ${result.matchesCreated} partidos de forma exitosa.`,
      };
    }

    return result;
  } catch (error: unknown) {
    console.error('Error en generateFixtureAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al guardar el fixture en MySQL.'), code: 'INTERNAL_ERROR' };
  }
}

export async function regenerateFixtureAction(
  competitionId: string,
  configOptions?: Partial<FixtureConfig> & { confirmedNameCheck?: string }
): Promise<{ success: boolean; message?: string; error?: string; code?: string }> {
  try {
    await requireCompetitionManager(competitionId);
    const competitions = await dbProvider.query<CompetitionData>(
      `SELECT * FROM competitions WHERE id = ?`,
      [competitionId]
    );

    if (!competitions || competitions.length === 0) {
      return { success: false, error: 'Competencia no encontrada.', code: 'NOT_FOUND' };
    }

    const competition = competitions[0];

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
        await transaction.execute(
          'UPDATE matches SET home_team_id = ?, home_team_name = ?, team_home_id = ? WHERE id = ?',
          [winnerTeamId, winnerTeamName, winnerTeamId, nextMatchId],
        );
      } else if (nextSlot === 'AWAY') {
        await transaction.execute(
          'UPDATE matches SET away_team_id = ?, away_team_name = ?, team_away_id = ? WHERE id = ?',
          [winnerTeamId, winnerTeamName, winnerTeamId, nextMatchId],
        );
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
