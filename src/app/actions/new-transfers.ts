'use server';

import { dbProvider } from '@/lib/db/provider';
import { revalidatePath } from 'next/cache';
import { AuthorizationError, requireServerActor, requireTeamManager, requireUserManager } from '@/lib/auth-server';
import { respondPlayerContractOfferService } from '@/lib/services';
import { getActionErrorMessage } from '@/lib/action-utils';

export async function issueNewContractOfferService(teamId: string, playerUserId: string, offeredByUserId: string, orgNames: string[], position: string, gameSlug: string) {
  try {
    const actor = await requireTeamManager(teamId);
    if (!orgNames || orgNames.length === 0) throw new Error('Debe seleccionar al menos una organización.');
    
    for (const orgName of orgNames) {
      const offerId = `off-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const pitchMessage = `[Organización: ${orgName}] Propuesta formal de contrato.`;
      
      await dbProvider.query(
        `INSERT INTO transfer_offers (id, game_slug, team_id, player_user_id, offered_by_user_id, position, pitch_message, offer_type, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'OFERTA_CLUB', 'PENDIENTE')`,
        [offerId, gameSlug, teamId, playerUserId, actor.userId, position, pitchMessage]
      );
    }
    
    revalidatePath('/');
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
    if (!offers || offers.length === 0) throw new Error('Oferta no encontrada.');
    const offer = offers[0];
    if (actor.role !== 'Administrador' && offer.player_user_id !== actor.userId) {
      throw new AuthorizationError('Solo el destinatario puede responder esta oferta', 403, 'FORBIDDEN');
    }

    const result = await respondPlayerContractOfferService(offerId, offer.player_user_id, action === 'ACEPTADO');
    if (!result.success) throw new Error(result.error || 'No se pudo responder la oferta.');
    revalidatePath('/');
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
      `SELECT o.*, u.name as player_name, u.gamertag, u.avatar_url 
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
