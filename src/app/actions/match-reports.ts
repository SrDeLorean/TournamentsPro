'use server';

import { revalidatePath } from 'next/cache';
import { validateSchema, requiredIdSchema } from '@/lib/validation';
import { z } from 'zod';
import { submitMatchReportService, getTeamRosterForMatchReportService } from '@/lib/services';
import { requireMatchReporter, requireTeamManager } from '@/lib/auth-server';
import { getActionErrorMessage } from '@/lib/action-utils';

export interface PlayerStatInput {
  userId: string;
  teamId: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  rating: number;
  isMvp: boolean;
}

export interface SubmitMatchReportInput {
  matchId: string;
  reportedByUserId: string;
  scoreHome: number;
  scoreAway: number;
  proofUrl?: string | null;
  playerStats?: PlayerStatInput[];
}

export async function submitMatchReportAction(input: SubmitMatchReportInput) {
  try {
    const actor = await requireMatchReporter(input.matchId);
    const validation = validateSchema(
      z.object({
        matchId: requiredIdSchema,
        reportedByUserId: requiredIdSchema,
        scoreHome: z.number().int().min(0).max(999),
        scoreAway: z.number().int().min(0).max(999),
        proofUrl: z.string().url().nullable().optional(),
        playerStats: z.array(z.object({
          userId: requiredIdSchema,
          teamId: requiredIdSchema,
          goals: z.number().int().min(0).default(0),
          assists: z.number().int().min(0).default(0),
          yellowCards: z.number().int().min(0).default(0),
          redCards: z.number().int().min(0).default(0),
          rating: z.number().min(0).max(10).default(6.0),
          isMvp: z.boolean().default(false),
        })).optional(),
      }),
      input
    );

    if (!validation.success) {
      return { success: false, error: validation.errors.join(', '), code: 'VALIDATION_ERROR' };
    }

    const result = await submitMatchReportService({
      ...validation.data,
      reportedByUserId: actor.userId,
    });

    if (result.success) {
      revalidatePath('/dashboard/competencias');
      revalidatePath('/[gameSlug]/partidos');
    }

    return result;
  } catch (error: unknown) {
    console.error('Error en submitMatchReportAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al enviar el reporte del partido.'), code: 'INTERNAL_ERROR' };
  }
}

export async function getTeamRosterForMatchReportAction(teamId: string) {
  try {
    if (!teamId) {
      return { success: false, roster: [], error: 'ID de equipo requerido.', code: 'MISSING_PARAMS' };
    }

    await requireTeamManager(teamId);

    const result = await getTeamRosterForMatchReportService(teamId);
    return result;
  } catch (error: unknown) {
    console.error('Error en getTeamRosterForMatchReportAction:', error);
    return { success: false, roster: [], error: getActionErrorMessage(error, 'Error al cargar plantilla.'), code: 'INTERNAL_ERROR' };
  }
}
