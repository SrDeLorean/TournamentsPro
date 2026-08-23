'use server';

import { revalidatePath } from 'next/cache';
import { queryDB } from '@/lib/db';
import { getServerUserSession } from '@/lib/auth-server';
import { validateSchema, createCompetitionSchema } from '@/lib/validation';
import { z } from 'zod';
import { createCompetitionService, generateFixtureService } from '@/lib/services';
import { competitionRepository } from '@/lib/repositories';
import { GAMES_CATALOG } from '@/lib/games-data';

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

export async function createCompetitionAction(formData: FormData) {
  try {
    const rawData = {
      name: (formData.get('name') as string)?.trim(),
      gameSlug: (formData.get('gameSlug') as string) || 'eafc26',
      modeFormat: (formData.get('modeFormat') as string) || '11v11',
      fechaLimiteInscripcion: formData.get('fechaLimiteInscripcion') as string,
      fechaInicio: formData.get('fechaInicio') as string,
      fechaTermino: formData.get('fechaTermino') as string,
      description: (formData.get('description') as string)?.trim() || null,
      prizePool: (formData.get('prizePool') as string)?.trim() || null,
      transferMarketMode: ((formData.get('transferMarketMode') as string) || 'ABIERTO') as 'ABIERTO' | 'CERRADO' | 'SIN_MERCADO',
      status: ((formData.get('status') as string) || 'Inscripcion') as CompetitionStatus,
      seasonId: (formData.get('seasonId') as string) || null,
      newSeasonName: (formData.get('newSeasonName') as string)?.trim(),
    };

    const validation = validateSchema(createCompetitionSchema, rawData);

    if (!validation.success) {
      return { success: false, error: validation.errors.join(', '), code: 'VALIDATION_ERROR' };
    }

    const data = validation.data;

    const session = await getServerUserSession();
    const organizerId = session?.userId || 'usr-organizer';
    const organizerName = session?.name || 'Organizador Oficial';
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
  } catch (error: any) {
    console.error('Error en createCompetitionAction:', error);
    return { success: false, error: error?.message || 'Error al crear la competencia.', code: 'INTERNAL_ERROR' };
  }
}

export async function updateCompetitionStatusAction(id: string, newStatus: CompetitionStatus) {
  try {
    if (!id || !newStatus) {
      return { success: false, error: 'ID de competencia y estado requeridos.', code: 'MISSING_PARAMS' };
    }

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
  } catch (error: any) {
    console.error('Error en updateCompetitionStatusAction:', error);
    return { success: false, error: error?.message || 'Error al actualizar el estado.', code: 'INTERNAL_ERROR' };
  }
}

export async function enrollTeamAction(competitionId: string, teamId: string, teamName: string, teamTag?: string) {
  try {
    if (!competitionId || !teamId) {
      return { success: false, error: 'Competencia y equipo son requeridos.', code: 'MISSING_PARAMS' };
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
    await queryDB(
      `INSERT INTO competition_teams (id, competition_id, team_id, team_name, team_tag, status)
       VALUES (?, ?, ?, ?, ?, 'CONFIRMADO')
       ON DUPLICATE KEY UPDATE status = 'CONFIRMADO'`,
      [enrollId, competitionId, teamId, teamName, teamTag || null]
    );

    revalidatePath(`/dashboard/competencias/${competitionId}`);
    return { success: true, message: `Equipo "${teamName}" inscrito correctamente.` };
  } catch (error: any) {
    console.error('Error en enrollTeamAction:', error);
    return { success: false, error: error?.message || 'Error al inscribir equipo.', code: 'INTERNAL_ERROR' };
  }
}

export async function enrollIndividualAthleteAction(
  competitionId: string,
  userId: string,
  userName: string,
  gamertag?: string
) {
  try {
    if (!competitionId || !userId) {
      return { success: false, error: 'Competencia y atleta son requeridos.', code: 'MISSING_PARAMS' };
    }

    const compRows = await queryDB<{ game_slug: string }>(
      `SELECT game_slug FROM competitions WHERE id = ?`,
      [competitionId]
    );

    if (compRows.length === 0) {
      return { success: false, error: 'Competencia no encontrada.', code: 'NOT_FOUND' };
    }

    const gameSlug = compRows[0].game_slug;
    const athleteLabel = gamertag || userName;

    const existingTeams = await queryDB<{ id: string }>(
      `SELECT id FROM teams WHERE captain_id = ? AND game_slug = ? LIMIT 1`,
      [userId, gameSlug]
    );

    let teamId = existingTeams.length > 0 ? existingTeams[0].id : null;

    if (!teamId) {
      teamId = `team-solo-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await queryDB(
        `INSERT INTO teams (id, name, tag, game_slug, captain_id, captain_name, platform, members_count, max_members, color, status)
         VALUES (?, ?, 'SOLO', ?, ?, ?, 'CROSSPLAY', 1, 2, '#00F0FF', 'Activo')`,
        [teamId, athleteLabel, gameSlug, userId, userName]
      );

      await queryDB(
        `INSERT INTO team_members (id, team_id, user_id, tactical_position, role_in_team)
         VALUES (?, ?, ?, 'Individual', 'Capitan')
         ON DUPLICATE KEY UPDATE role_in_team = 'Capitan'`,
        [`tm-solo-${Date.now()}`, teamId, userId]
      );
    }

    return await enrollTeamAction(competitionId, teamId, athleteLabel, 'SOLO');
  } catch (error: any) {
    console.error('Error en enrollIndividualAthleteAction:', error);
    return { success: false, error: error?.message || 'Error al inscribir atleta individual.', code: 'INTERNAL_ERROR' };
  }
}

export async function removeEnrolledTeamAction(competitionId: string, teamId: string) {
  try {
    await queryDB(`DELETE FROM competition_teams WHERE competition_id = ? AND team_id = ?`, [competitionId, teamId]);

    revalidatePath(`/dashboard/competencias/${competitionId}`);
    return { success: true, message: 'Equipo retirado de la competencia.' };
  } catch (error: any) {
    console.error('Error en removeEnrolledTeamAction:', error);
    return { success: false, error: error?.message || 'Error al retirar equipo.', code: 'INTERNAL_ERROR' };
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
) {
  try {
    const enrolledTeams = await queryDB<CompetitionTeamData>(
      `SELECT * FROM competition_teams WHERE competition_id = ? AND status = 'CONFIRMADO'`,
      [competitionId]
    );

    if (enrolledTeams.length < 2) {
      return { success: false, error: 'Se requieren al menos 2 equipos confirmados para generar el fixture.', code: 'NOT_ENOUGH_TEAMS' };
    }

    const competitions = await queryDB<CompetitionData>(
      `SELECT * FROM competitions WHERE id = ?`,
      [competitionId]
    );

    if (!competitions || competitions.length === 0) {
      return { success: false, error: 'Competencia no encontrada.', code: 'NOT_FOUND' };
    }

    const competition = competitions[0];
    const format = configOptions?.format || (competition.mode_format as any) || 'Liga';
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
  } catch (error: any) {
    console.error('Error en generateFixtureAction:', error);
    return { success: false, error: error?.message || 'Error al guardar el fixture en MySQL.', code: 'INTERNAL_ERROR' };
  }
}

export async function regenerateFixtureAction(
  competitionId: string,
  configOptions?: Partial<FixtureConfig> & { confirmedNameCheck?: string }
) {
  try {
    const competitions = await queryDB<CompetitionData>(
      `SELECT * FROM competitions WHERE id = ?`,
      [competitionId]
    );

    if (!competitions || competitions.length === 0) {
      return { success: false, error: 'Competencia no encontrada.', code: 'NOT_FOUND' };
    }

    const competition = competitions[0];

    const reportedMatches = await queryDB<any>(
      `SELECT COUNT(*) as count FROM matches 
       WHERE (competition_id = ? OR tournament_id = ?) 
       AND (status IN ('POR_REVISAR', 'TERMINADO', 'DISPUTADO', 'FINALIZADO') 
            OR reported_score_home IS NOT NULL OR reported_score_away IS NOT NULL)`,
      [competitionId, competitionId]
    );

    const hasReportedResults = (reportedMatches[0]?.count || 0) > 0;

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
  } catch (error: any) {
    console.error('Error en regenerateFixtureAction:', error);
    return { success: false, error: error?.message || 'Error al regenerar el fixture.', code: 'INTERNAL_ERROR' };
  }
}

export async function advancePlayoffWinnerAction(
  matchId: string,
  winnerTeamId: string,
  winnerTeamName: string
) {
  try {
    if (!matchId || !winnerTeamId) {
      return { success: false, error: 'ID de partido y equipo ganador requeridos.', code: 'MISSING_PARAMS' };
    }

    const currentMatches = await queryDB<any>(`SELECT * FROM matches WHERE id = ?`, [matchId]);
    if (!currentMatches || currentMatches.length === 0) {
      return { success: false, error: 'Partido no encontrado.', code: 'NOT_FOUND' };
    }

    const currentMatch = currentMatches[0];
    const competitionId = currentMatch.competition_id || currentMatch.tournament_id;

    await queryDB(`UPDATE matches SET winner_team_id = ?, status = 'TERMINADO' WHERE id = ?`, [
      winnerTeamId,
      matchId,
    ]);

    if (!currentMatch.next_match_id) {
      revalidatePath(`/dashboard/competencias/${competitionId}`);
      return { success: true, message: `¡Partido finalizado! El equipo "${winnerTeamName}" ha ganado la competencia.` };
    }

    const nextMatchId = currentMatch.next_match_id;
    const nextSlot = currentMatch.next_match_slot || 'HOME';

    if (nextSlot === 'VUELTA_TARGET') {
      await queryDB(
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
    } else if (nextSlot === 'HOME') {
      await queryDB(
        `UPDATE matches SET home_team_id = ?, home_team_name = ?, team_home_id = ? WHERE id = ?`,
        [winnerTeamId, winnerTeamName, winnerTeamId, nextMatchId]
      );
    } else if (nextSlot === 'AWAY') {
      await queryDB(
        `UPDATE matches SET away_team_id = ?, away_team_name = ?, team_away_id = ? WHERE id = ?`,
        [winnerTeamId, winnerTeamName, winnerTeamId, nextMatchId]
      );
    }

    revalidatePath(`/dashboard/competencias/${competitionId}`);
    return {
      success: true,
      message: `¡Auto-avance exitoso! "${winnerTeamName}" avanza a la siguiente llave (${nextMatchId}).`,
    };
  } catch (error: any) {
    console.error('Error en advancePlayoffWinnerAction:', error);
    return { success: false, error: error?.message || 'Error al ejecutar el auto-avance del ganador.', code: 'INTERNAL_ERROR' };
  }
}