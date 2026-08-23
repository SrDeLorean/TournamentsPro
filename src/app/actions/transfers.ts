'use server';

import { revalidatePath } from 'next/cache';
import { queryDB } from '@/lib/db';
import { validateSchema, requiredIdSchema, uuidSchema } from '@/lib/validation';
import { z } from 'zod';
import {
  createTransferApplicationService,
  approveExtraordinaryTransferService,
  rejectExtraordinaryTransferService,
  getAthleteTransferHistoryService,
  createTransferPostService,
  getTransferPostsService,
  getCompletedTransfersService,
  getGameConfigurationService,
  getPlayerContractOffersService,
  respondPlayerContractOfferService,
  sendClubContractOfferService,
  CreateTransferPostData,
} from '@/lib/services';

export interface TransferApplicationData {
  id: string;
  team_id: string;
  team_name?: string;
  applicant_user_id: string;
  applicant_user_name?: string;
  game_slug: string;
  position: string;
  pitch_message: string | null;
  application_type: 'POSTULACION_JUGADOR' | 'OFERTA_CLUB';
  status: 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO';
  is_extraordinary: boolean;
  organizer_approval_status: 'NINGUNO' | 'PENDIENTE_ORGANIZADOR' | 'APROBADO_ORGANIZADOR' | 'RECHAZADO_ORGANIZADOR';
  created_at: string;
}

export async function createTransferApplicationAction(data: {
  teamId: string;
  userId: string;
  gameSlug: 'eafc26' | 'valorant' | 'csgo' | 'lol' | 'rocketleague' | 'fortnite';
  position: string;
  pitchMessage?: string;
  type: 'POSTULACION_JUGADOR' | 'OFERTA_CLUB';
  competitionId?: string;
}) {
  try {
    const validation = validateSchema(
      z.object({
        teamId: requiredIdSchema,
        userId: requiredIdSchema,
        gameSlug: z.enum(['eafc26', 'valorant', 'csgo', 'lol', 'rocketleague', 'fortnite']),
        position: z.string().min(1).max(30),
        pitchMessage: z.string().max(1000).optional(),
        type: z.enum(['POSTULACION_JUGADOR', 'OFERTA_CLUB']),
        competitionId: uuidSchema,
      }),
      data
    );

    if (!validation.success) {
      return { success: false, error: validation.errors.join(', '), code: 'VALIDATION_ERROR' };
    }

    const result = await createTransferApplicationService({
      ...validation.data,
      competitionId: validation.data.competitionId || undefined,
    });

    if (result.success) {
      revalidatePath('/atleta/ofertas');
      revalidatePath('/club/reclutamiento');
    }

    return result;
  } catch (error: any) {
    console.error('Error en createTransferApplicationAction:', error);
    return { success: false, error: error?.message || 'Error al procesar transferencia.', code: 'INTERNAL_ERROR' };
  }
}

export async function approveExtraordinaryTransferAction(applicationId: string, organizerUserId: string) {
  try {
    if (!applicationId || !organizerUserId) {
      return { success: false, error: 'ID de solicitud y organizador requeridos.', code: 'MISSING_PARAMS' };
    }

    const result = await approveExtraordinaryTransferService(applicationId, organizerUserId);

    if (result.success) {
      revalidatePath('/dashboard/competencias');
      revalidatePath('/club/plantilla');
    }

    return result;
  } catch (error: any) {
    console.error('Error en approveExtraordinaryTransferAction:', error);
    return { success: false, error: error?.message || 'Error al aprobar traspaso extraordinario.', code: 'INTERNAL_ERROR' };
  }
}

export async function rejectExtraordinaryTransferAction(applicationId: string, organizerUserId: string, reason?: string) {
  try {
    if (!applicationId || !organizerUserId) {
      return { success: false, error: 'ID de solicitud y organizador requeridos.', code: 'MISSING_PARAMS' };
    }

    const result = await rejectExtraordinaryTransferService(applicationId, organizerUserId, reason);

    if (result.success) {
      revalidatePath('/dashboard/competencias');
    }

    return result;
  } catch (error: any) {
    console.error('Error en rejectExtraordinaryTransferAction:', error);
    return { success: false, error: error?.message || 'Error al rechazar traspaso extraordinario.', code: 'INTERNAL_ERROR' };
  }
}

export async function getAthleteTransferHistoryAction(userId: string, organizationId?: string) {
  try {
    if (!userId) {
      return { success: false, error: 'ID de usuario requerido', code: 'MISSING_PARAMS' };
    }
    const history = await getAthleteTransferHistoryService(userId, organizationId);
    return { success: true, data: history };
  } catch (error: any) {
    console.error('Error en getAthleteTransferHistoryAction:', error);
    return { success: false, error: error?.message || 'Error al obtener historial.', code: 'INTERNAL_ERROR' };
  }
}

export async function createTransferPostAction(data: CreateTransferPostData) {
  try {
    const res = await createTransferPostService(data);
    if (res.success) {
      revalidatePath(`/${data.gameSlug}/traspasos`);
    }
    return res;
  } catch (error: any) {
    console.error('Error en createTransferPostAction:', error);
    return { success: false, error: error?.message || 'Error al crear publicación.', code: 'INTERNAL_ERROR' };
  }
}

export async function getTransferPostsAction(
  gameSlug: string,
  timeFilter: 'TODAY' | '3_DAYS' | '7_DAYS' | 'ALL' = 'ALL'
) {
  try {
    const posts = await getTransferPostsService(gameSlug, timeFilter);
    return { success: true, data: posts };
  } catch (error: any) {
    console.error('Error en getTransferPostsAction:', error);
    return { success: false, error: error?.message || 'Error al consultar publicaciones.', code: 'INTERNAL_ERROR' };
  }
}

export async function getCompletedTransfersAction(gameSlug: string) {
  try {
    const logs = await getCompletedTransfersService(gameSlug);
    return { success: true, data: logs };
  } catch (error: any) {
    console.error('Error en getCompletedTransfersAction:', error);
    return { success: false, error: error?.message || 'Error al obtener traspasos realizados.', code: 'INTERNAL_ERROR' };
  }
}

export async function getGameConfigurationAction(gameSlug: string) {
  try {
    const config = await getGameConfigurationService(gameSlug);
    return { success: true, data: config };
  } catch (error: any) {
    console.error('Error en getGameConfigurationAction:', error);
    return { success: false, error: error?.message || 'Error al obtener configuración de juego.' };
  }
}

export async function getPlayerContractOffersAction(userId: string, gameSlug: string) {
  try {
    const offers = await getPlayerContractOffersService(userId, gameSlug);
    return { success: true, data: offers };
  } catch (error: any) {
    console.error('Error en getPlayerContractOffersAction:', error);
    return { success: false, error: error?.message || 'Error al consultar ofertas de contrato.' };
  }
}

export async function respondPlayerContractOfferAction(offerId: string, userId: string, accept: boolean) {
  try {
    const res = await respondPlayerContractOfferService(offerId, userId, accept);
    if (res.success) {
      revalidatePath('/atleta/ofertas');
    }
    return res;
  } catch (error: any) {
    console.error('Error en respondPlayerContractOfferAction:', error);
    return { success: false, error: error?.message || 'Error al responder oferta.' };
  }
}

export async function sendClubContractOfferAction(data: {
  teamId: string;
  playerUserId: string;
  offeredByUserId: string;
  position: string;
  organizationId?: string;
  organizationIds?: string[];
  pitchMessage?: string;
  gameSlug?: string;
}) {
  try {
    const res = await sendClubContractOfferService(data);
    if (res.success) {
      revalidatePath('/atleta/ofertas');
      revalidatePath('/club/reclutamiento');
    }
    return res;
  } catch (error: any) {
    console.error('Error en sendClubContractOfferAction:', error);
    return { success: false, error: error?.message || 'Error al enviar oferta de contrato.' };
  }
}

export async function getOutgoingOffersAction(teamId: string, gameSlug: string) {
  try {
    const offers = await queryDB<any>(
      `SELECT 
        tro.id,
        tro.game_slug,
        tro.team_id,
        tro.player_user_id,
        tro.position,
        tro.pitch_message,
        tro.offer_type,
        tro.status,
        tro.created_at,
        u.name as player_name,
        u.gamertag as player_gamertag
       FROM transfer_offers tro
       JOIN users u ON tro.player_user_id = u.id
       WHERE tro.team_id = ? AND (tro.game_slug = ? OR ? = 'ALL')
       ORDER BY tro.created_at DESC`,
      [teamId, gameSlug, gameSlug]
    );
    return { success: true, data: offers };
  } catch (error: any) {
    console.error('Error en getOutgoingOffersAction:', error);
    return { success: false, error: error?.message || 'Error al obtener solicitudes enviadas.' };
  }
}

export async function cancelTransferOfferAction(offerId: string) {
  try {
    await queryDB(`UPDATE transfer_offers SET status = 'CANCELADO' WHERE id = ?`, [offerId]);
    revalidatePath('/atleta/ofertas');
    revalidatePath('/club/reclutamiento');
    return { success: true, message: 'Oferta cancelada correctamente.' };
  } catch (error: any) {
    console.error('Error en cancelTransferOfferAction:', error);
    return { success: false, error: error?.message || 'Error al cancelar oferta.' };
  }
}