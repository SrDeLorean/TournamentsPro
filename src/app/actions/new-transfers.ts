'use server';

import { queryDB } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function issueNewContractOfferService(teamId: string, playerUserId: string, offeredByUserId: string, orgNames: string[], position: string, gameSlug: string) {
  try {
    if (!orgNames || orgNames.length === 0) throw new Error('Debe seleccionar al menos una organización.');
    
    for (const orgName of orgNames) {
      const offerId = `off-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const pitchMessage = `[Organización: ${orgName}] Propuesta formal de contrato.`;
      
      await queryDB(
        `INSERT INTO transfer_offers (id, game_slug, team_id, player_user_id, offered_by_user_id, position, pitch_message, offer_type, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'OFERTA_CLUB', 'PENDIENTE')`,
        [offerId, gameSlug, teamId, playerUserId, offeredByUserId, position, pitchMessage]
      );
    }
    
    revalidatePath('/');
    return { success: true, message: `Contratos emitidos para ${orgNames.length} organización(es).` };
  } catch (error: any) {
    console.error('Error en issueNewContractOfferService:', error);
    return { success: false, error: error.message };
  }
}

export async function respondNewContractOfferService(offerId: string, action: 'ACEPTADO' | 'RECHAZADO') {
  try {
    const offers = await queryDB<any>(`SELECT * FROM transfer_offers WHERE id = ?`, [offerId]);
    if (!offers || offers.length === 0) throw new Error('Oferta no encontrada.');
    const offer = offers[0];
    
    await queryDB(`UPDATE transfer_offers SET status = ? WHERE id = ?`, [action, offerId]);
    
    if (action === 'ACEPTADO') {
      let orgName = 'Organización General';
      if (offer.pitch_message) {
        const match = offer.pitch_message.match(/\[Organización:\s*([^\]]+)\]/i);
        if (match && match[1]) {
          orgName = match[1].trim();
        }
      }
      
      const memberId = `tm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      await queryDB(
        `INSERT INTO team_members (id, team_id, user_id, organization_name, tactical_position, role_in_team)
         VALUES (?, ?, ?, ?, ?, 'Jugador')
         ON DUPLICATE KEY UPDATE tactical_position = VALUES(tactical_position)`,
        [memberId, offer.team_id, offer.player_user_id, orgName, offer.position || 'DFC']
      );
    }
    
    revalidatePath('/');
    return { success: true, message: `Oferta ${action.toLowerCase()} con éxito.` };
  } catch (error: any) {
    console.error('Error en respondNewContractOfferService:', error);
    return { success: false, error: error.message };
  }
}

export async function getSentContractsByTeamAction(teamId: string) {
  try {
    const rows = await queryDB<any>(
      `SELECT o.*, u.name as player_name, u.gamertag, u.avatar_url 
       FROM transfer_offers o
       JOIN users u ON o.player_user_id = u.id
       WHERE o.team_id = ?
       ORDER BY o.created_at DESC`,
      [teamId]
    );
    return { success: true, offers: rows };
  } catch (error: any) {
    return { success: false, offers: [], error: error.message };
  }
}

export async function getUserOffersAction(userId: string) {
  try {
    const rows = await queryDB<any>(
      `SELECT o.*, t.name as team_name, t.tag as team_tag, t.logo_url 
       FROM transfer_offers o
       JOIN teams t ON o.team_id = t.id
       WHERE o.player_user_id = ? AND o.status = 'PENDIENTE'
       ORDER BY o.created_at DESC`,
      [userId]
    );
    return { success: true, offers: rows };
  } catch (error: any) {
    return { success: false, offers: [], error: error.message };
  }
}
