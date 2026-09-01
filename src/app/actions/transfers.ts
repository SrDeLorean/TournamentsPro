'use server';

import { revalidatePath } from 'next/cache';
import { dbProvider } from '@/lib/db/provider';
import { validateSchema, requiredIdSchema, uuidSchema } from '@/lib/validation';
import { z } from 'zod';
import {
  requireCompetitionManager,
  requireServerActor,
  requireTeamManager,
  requireUserManager,
} from '@/lib/auth-server';
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
  respondOrdinaryTransferApplicationService,
  cancelTransferOfferService,
  cancelTransferPostService,
  sendClubContractOfferService,
  CreateTransferPostData,
} from '@/lib/services';
import { getActionErrorMessage } from '@/lib/action-utils';

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
    const actor = await requireServerActor();
    if (data.type === 'OFERTA_CLUB') {
      await requireTeamManager(data.teamId);
    }
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
      userId: data.type === 'POSTULACION_JUGADOR' ? actor.userId : validation.data.userId,
      competitionId: validation.data.competitionId || undefined,
    });

    if (result.success) {
      revalidatePath('/atleta/ofertas');
      revalidatePath('/club/reclutamiento');
    }

    return result;
  } catch (error: unknown) {
    console.error('Error en createTransferApplicationAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al procesar transferencia.'), code: 'INTERNAL_ERROR' };
  }
}

export async function approveExtraordinaryTransferAction(applicationId: string, organizerUserId: string) {
  try {
    if (!applicationId || !organizerUserId) {
      return { success: false, error: 'ID de solicitud y organizador requeridos.', code: 'MISSING_PARAMS' };
    }

    const actor = await requireServerActor(['Administrador', 'Organizador']);
    const applications = await dbProvider.query<{ competition_id: string | null; team_id: string }>(
      'SELECT competition_id, team_id FROM transfer_applications WHERE id = ? LIMIT 1',
      [applicationId],
    );
    if (!applications[0]) return { success: false, error: 'Solicitud no encontrada.', code: 'NOT_FOUND' };
    if (applications[0].competition_id) await requireCompetitionManager(applications[0].competition_id);
    else await requireTeamManager(applications[0].team_id);

    const result = await approveExtraordinaryTransferService(applicationId, actor.userId);

    if (result.success) {
      revalidatePath('/dashboard/competencias');
      revalidatePath('/club/plantilla');
    }

    return result;
  } catch (error: unknown) {
    console.error('Error en approveExtraordinaryTransferAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al aprobar traspaso extraordinario.'), code: 'INTERNAL_ERROR' };
  }
}

export async function rejectExtraordinaryTransferAction(applicationId: string, organizerUserId: string, reason?: string) {
  try {
    if (!applicationId || !organizerUserId) {
      return { success: false, error: 'ID de solicitud y organizador requeridos.', code: 'MISSING_PARAMS' };
    }

    const actor = await requireServerActor(['Administrador', 'Organizador']);
    const applications = await dbProvider.query<{ competition_id: string | null; team_id: string }>(
      'SELECT competition_id, team_id FROM transfer_applications WHERE id = ? LIMIT 1',
      [applicationId],
    );
    if (!applications[0]) return { success: false, error: 'Solicitud no encontrada.', code: 'NOT_FOUND' };
    if (applications[0].competition_id) await requireCompetitionManager(applications[0].competition_id);
    else await requireTeamManager(applications[0].team_id);

    const result = await rejectExtraordinaryTransferService(applicationId, actor.userId, reason);

    if (result.success) {
      revalidatePath('/dashboard/competencias');
    }

    return result;
  } catch (error: unknown) {
    console.error('Error en rejectExtraordinaryTransferAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al rechazar traspaso extraordinario.'), code: 'INTERNAL_ERROR' };
  }
}

export async function getAthleteTransferHistoryAction(userId: string, organizationId?: string) {
  try {
    if (!userId) {
      return { success: false, error: 'ID de usuario requerido', code: 'MISSING_PARAMS' };
    }
    await requireUserManager(userId);
    const history = await getAthleteTransferHistoryService(userId, organizationId);
    return { success: true, data: history };
  } catch (error: unknown) {
    console.error('Error en getAthleteTransferHistoryAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al obtener historial.'), code: 'INTERNAL_ERROR' };
  }
}

export async function createTransferPostAction(data: CreateTransferPostData) {
  try {
    const actor = await requireServerActor();
    if (data.type === 'CLUB_RECLUTA_JUGADOR') {
      if (!data.teamId) return { success: false, error: 'Equipo requerido.', code: 'MISSING_TEAM' };
      await requireTeamManager(data.teamId);
    }
    const user = await dbProvider.users.findById(actor.userId);
    const res = await createTransferPostService({
      ...data,
      userId: actor.userId,
      userName: user?.name || 'Usuario',
      userGamertag: user?.gamertag || 'Usuario',
    });
    if (res.success) {
      revalidatePath(`/${data.gameSlug}/traspasos`);
    }
    return res;
  } catch (error: unknown) {
    console.error('Error en createTransferPostAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al crear publicación.'), code: 'INTERNAL_ERROR' };
  }
}

export async function getTransferPostsAction(
  gameSlug: string,
  timeFilter: 'TODAY' | '3_DAYS' | '7_DAYS' | 'ALL' = 'ALL'
) {
  try {
    const posts = await getTransferPostsService(gameSlug, timeFilter);
    return { success: true, data: posts };
  } catch (error: unknown) {
    console.error('Error en getTransferPostsAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al consultar publicaciones.'), code: 'INTERNAL_ERROR' };
  }
}

export async function getCompletedTransfersAction(gameSlug: string) {
  try {
    const logs = await getCompletedTransfersService(gameSlug);
    return { success: true, data: logs };
  } catch (error: unknown) {
    console.error('Error en getCompletedTransfersAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al obtener traspasos realizados.'), code: 'INTERNAL_ERROR' };
  }
}

export async function getGameConfigurationAction(gameSlug: string) {
  try {
    const config = await getGameConfigurationService(gameSlug);
    return { success: true, data: config };
  } catch (error: unknown) {
    console.error('Error en getGameConfigurationAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al obtener configuración de juego.') };
  }
}

export async function getPlayerContractOffersAction(userId: string, gameSlug: string) {
  try {
    await requireUserManager(userId);
    const offers = await getPlayerContractOffersService(userId, gameSlug);
    return { success: true, data: offers };
  } catch (error: unknown) {
    console.error('Error en getPlayerContractOffersAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al consultar ofertas de contrato.') };
  }
}

export async function respondPlayerContractOfferAction(offerId: string, userId: string, accept: boolean) {
  try {
    const actor = await requireServerActor();
    const res = await respondPlayerContractOfferService(offerId, actor.userId, accept);
    if (res.success) {
      revalidatePath('/atleta/ofertas');
    }
    return res;
  } catch (error: unknown) {
    console.error('Error en respondPlayerContractOfferAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al responder oferta.') };
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
    const actor = await requireTeamManager(data.teamId);
    const res = await sendClubContractOfferService({ ...data, offeredByUserId: actor.userId });
    if (res.success) {
      revalidatePath('/atleta/ofertas');
      revalidatePath('/club/reclutamiento');
    }
    return res;
  } catch (error: unknown) {
    console.error('Error en sendClubContractOfferAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al enviar oferta de contrato.') };
  }
}

export async function getOutgoingOffersAction(teamId: string, gameSlug: string) {
  try {
    await requireTeamManager(teamId);
    const offers = await dbProvider.query<Record<string, unknown>>(
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
  } catch (error: unknown) {
    console.error('Error en getOutgoingOffersAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al obtener solicitudes enviadas.') };
  }
}

export async function cancelTransferOfferAction(offerId: string) {
  try {
    const offers = await dbProvider.query<{ team_id: string }>('SELECT team_id FROM transfer_offers WHERE id = ? LIMIT 1', [offerId]);
    if (!offers[0]) return { success: false, error: 'Oferta no encontrada.' };
    await requireTeamManager(offers[0].team_id);
    const result = await cancelTransferOfferService(offerId, offers[0].team_id);
    if (!result.success) return result;
    revalidatePath('/atleta/ofertas');
    revalidatePath('/club/reclutamiento');
    return result;
  } catch (error: unknown) {
    console.error('Error en cancelTransferOfferAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al cancelar oferta.') };
  }
}

export async function respondOrdinaryTransferApplicationAction(applicationId: string, accept: boolean) {
  try {
    const actor = await requireServerActor();
    const applications = await dbProvider.query<{ team_id: string }>(
      'SELECT team_id FROM transfer_applications WHERE id = ? LIMIT 1',
      [applicationId],
    );
    if (!applications[0]) return { success: false, error: 'Solicitud no encontrada.' };
    await requireTeamManager(applications[0].team_id);
    const result = await respondOrdinaryTransferApplicationService(applicationId, actor.userId, accept);
    if (result.success) {
      revalidatePath('/atleta/ofertas');
      revalidatePath('/club/reclutamiento');
      revalidatePath('/club/plantilla');
    }
    return result;
  } catch (error: unknown) {
    return { success: false, error: getActionErrorMessage(error, 'Error al responder solicitud.') };
  }
}

export async function cancelTransferApplicationAction(applicationId: string) {
  try {
    const actor = await requireServerActor();
    const applications = await dbProvider.query<{ applicant_user_id: string }>(
      'SELECT applicant_user_id FROM transfer_applications WHERE id = ? LIMIT 1',
      [applicationId],
    );
    if (!applications[0] || applications[0].applicant_user_id !== actor.userId) {
      return { success: false, error: 'Solicitud no encontrada.' };
    }
    return await respondOrdinaryTransferApplicationService(applicationId, actor.userId, false);
  } catch (error: unknown) {
    return { success: false, error: getActionErrorMessage(error, 'Error al cancelar solicitud.') };
  }
}

export async function cancelTransferPostAction(postId: string, teamId?: string) {
  try {
    const actor = await requireServerActor();
    if (teamId) await requireTeamManager(teamId);
    const result = await cancelTransferPostService(postId, actor.userId, teamId);
    if (result.success) revalidatePath('/traspasos');
    return result;
  } catch (error: unknown) {
    return { success: false, error: getActionErrorMessage(error, 'Error al cerrar publicación.') };
  }
}

export async function issueNewContractOfferService(
  teamId: string,
  playerUserId: string,
  offeredByUserId: string,
  orgNames: string[],
  position: string,
  gameSlug: string
) {
  try {
    const actor = await requireTeamManager(teamId);
    if (!orgNames || orgNames.length === 0) orgNames = ['Organización General'];

    for (const orgName of orgNames) {
      const offerId = `off-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const pitchMessage = `[Organización: ${orgName}] Propuesta formal de contrato eSports.`;

      await dbProvider.query(
        `INSERT INTO transfer_offers (id, game_slug, team_id, player_user_id, offered_by_user_id, position, pitch_message, offer_type, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'OFERTA_CLUB', 'PENDIENTE')`,
        [offerId, gameSlug, teamId, playerUserId, actor.userId, position, pitchMessage]
      );
    }

    revalidatePath('/dashboard/equipos');
    revalidatePath('/club/reclutamiento');
    return { success: true, message: `Contratos emitidos para ${orgNames.length} organización(es).` };
  } catch (error: unknown) {
    console.error('Error en issueNewContractOfferService:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al emitir oferta.') };
  }
}

export async function respondNewContractOfferService(offerId: string, action: 'ACEPTADO' | 'RECHAZADO') {
  try {
    const actor = await requireServerActor();
    const offers = await dbProvider.query<{ player_user_id: string }>('SELECT player_user_id FROM transfer_offers WHERE id = ?', [offerId]);
    if (!offers || offers.length === 0) return { success: false, error: 'Oferta no encontrada.' };
    const offer = offers[0];
    if (actor.role !== 'Administrador' && offer.player_user_id !== actor.userId) {
      return { success: false, error: 'Solo el destinatario puede responder esta oferta' };
    }

    const result = await respondPlayerContractOfferService(offerId, offer.player_user_id, action === 'ACEPTADO');
    if (!result.success) return { success: false, error: result.error || 'No se pudo responder la oferta.' };
    
    revalidatePath('/dashboard/equipos');
    revalidatePath('/equipos');
    revalidatePath('/club/plantilla');
    revalidatePath('/atleta/ofertas');
    return { success: true, message: `Oferta ${action.toLowerCase()} con éxito.` };
  } catch (error: unknown) {
    console.error('Error en respondNewContractOfferService:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al responder oferta.') };
  }
}

export async function getSentContractsByTeamAction(teamId: string) {
  try {
    await requireTeamManager(teamId);
    const rows = await dbProvider.query<Record<string, unknown>>(
      `SELECT o.*, u.name as player_name, u.gamertag, u.avatar_url, u.foto
       FROM transfer_offers o
       JOIN users u ON o.player_user_id = u.id
       WHERE o.team_id = ?
       ORDER BY o.created_at DESC`,
      [teamId]
    );
    return { success: true, offers: rows };
  } catch (error: unknown) {
    return { success: false, offers: [], error: getActionErrorMessage(error, 'Error al consultar contratos.') };
  }
}

export async function getUserOffersAction(userId: string) {
  try {
    await requireUserManager(userId);
    const rows = await dbProvider.query<Record<string, unknown>>(
      `SELECT o.*, t.name as team_name, t.tag as team_tag, t.logo_url 
       FROM transfer_offers o
       JOIN teams t ON o.team_id = t.id
       WHERE o.player_user_id = ? AND o.status = 'PENDIENTE'
       ORDER BY o.created_at DESC`,
      [userId]
    );
    return { success: true, offers: rows };
  } catch (error: unknown) {
    return { success: false, offers: [], error: getActionErrorMessage(error, 'Error al consultar ofertas.') };
  }
}

