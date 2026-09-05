// =============================================================================
// TournamentsPro — Transfers, Market & Contract Offers Service
// =============================================================================

import { randomUUID } from 'crypto';
import { executeCas, type DatabaseParams } from '@/lib/db';
import { dbProvider } from '@/lib/db/provider';
import {
  getErrorMessage,
  type ContractCandidate,
  type ContractCandidateDatabaseRow,
  type TransferApplicationRow,
  type TransferHistoryRow,
  type TransferPostRow,
  type ContractOfferRow,
} from './types';

export interface CreateTransferResult {
  success: boolean;
  applicationId?: string;
  isExtraordinary?: boolean;
  error?: string;
  code?: string;
}

export interface AthleteTransferHistoryItem {
  id: string;
  gameSlug: string;
  fromTeamName: string | null;
  toTeamName: string;
  signedAt: string;
  transferType: string;
}

export interface AthleteTransferHistoryResult {
  userId: string;
  totalMovements: number;
  recentTransfers: AthleteTransferHistoryItem[];
}

export interface CreateTransferPostData {
  gameSlug: string;
  type: 'JUGADOR_BUSCA_CLUB' | 'CLUB_RECLUTA_JUGADOR';
  userId: string;
  userName: string;
  userGamertag: string;
  teamId?: string;
  teamName?: string;
  position: string;
  platform: string;
  message: string;
}

export async function getAllPlayersForContractOfferService(gameSlug: string, searchQuery?: string) {
  try {
    let sql = `
      SELECT 
        u.id, u.name, u.gamertag, u.email, u.position, u.primary_game_slug, u.organization_id, u.avatar_url, u.foto,
        MAX(tm.team_id) as current_team_id,
        MAX(t.name) as current_team_name,
        MAX(t.tag) as current_team_tag
      FROM users u
      LEFT JOIN team_members tm ON tm.user_id = u.id
      LEFT JOIN teams t ON tm.team_id = t.id
      WHERE u.is_banned = 0
    `;
    const params: DatabaseParams = [];

    if (searchQuery && searchQuery.trim()) {
      const q = `%${searchQuery.trim()}%`;
      sql += ` AND (u.name LIKE ? OR u.gamertag LIKE ? OR u.position LIKE ? OR u.email LIKE ?)`;
      params.push(q, q, q, q);
    }

    sql += ` GROUP BY u.id ORDER BY u.name ASC LIMIT 100`;

    const rows = await dbProvider.query<ContractCandidateDatabaseRow>(sql, params);
    const players: ContractCandidate[] = rows.map((row) => ({
      ...row,
      organization_id: row.organization_id ?? undefined,
      avatar_url: row.avatar_url ?? undefined,
      foto: row.foto ?? undefined,
      current_team_id: row.current_team_id ?? undefined,
      current_team_name: row.current_team_name ?? undefined,
      current_team_tag: row.current_team_tag ?? undefined,
    }));
    return { success: true, players };
  } catch (error: unknown) {
    console.error('Error en getAllPlayersForContractOfferService:', error);
    return { success: false, players: [], error: getErrorMessage(error, 'Error al buscar todos los jugadores') };
  }
}

export async function sendClubContractOfferService(data: {
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
    if (!data.teamId || !data.playerUserId) {
      return { success: false, error: 'ID de equipo y jugador requeridos.' };
    }

    const orgsToProcess = data.organizationIds && data.organizationIds.length > 0
      ? data.organizationIds
      : data.organizationId
      ? [data.organizationId]
      : ['Organización General'];

    return await dbProvider.withTransaction(async (transaction) => {
      const teams = await transaction.teams.findById(data.teamId).then(r => r ? [{ id: r.id }] : []);
      const players = await transaction.users.findById(data.playerUserId).then(r => r ? [{ id: r.id }] : []);
      if (teams.length === 0 || players.length === 0) return { success: false, error: 'Equipo o jugador no encontrado.' };

      const pending = await transaction.query<{ pitch_message: string | null }>(
        `SELECT pitch_message FROM transfer_offers
          WHERE team_id = ? AND player_user_id = ? AND status = 'PENDIENTE' FOR UPDATE`,
        [data.teamId, data.playerUserId],
      );
      let count = 0;
      for (const orgNameOrId of orgsToProcess) {
        const prefix = `[Organización: ${orgNameOrId}]`;
        if (pending.some((offer) => offer.pitch_message?.startsWith(prefix))) continue;
        const pitchText = `${prefix} ${data.pitchMessage || 'Oferta formal de contrato para unirse a la plantilla de la escuadra.'}`;
        await transaction.execute(
          `INSERT INTO transfer_offers (id, game_slug, team_id, player_user_id, offered_by_user_id, position, pitch_message, offer_type, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'OFERTA_CLUB', 'PENDIENTE')`,
          [randomUUID(), data.gameSlug || 'eafc26', data.teamId, data.playerUserId, data.offeredByUserId, data.position || 'DC', pitchText],
        );
        count++;
      }
      return { success: true, count, message: `Se emitieron ${count} propuesta(s) de contrato independiente(s) por Organización.` };
    });
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Error al enviar ofertas de contrato.') };
  }
}

export async function createTransferApplicationService(data: {
  teamId: string;
  userId: string;
  gameSlug: string;
  position: string;
  pitchMessage?: string;
  type: 'POSTULACION_JUGADOR' | 'OFERTA_CLUB';
  competitionId?: string;
}): Promise<CreateTransferResult> {
  const { teamId, userId, gameSlug, position, pitchMessage, type, competitionId } = data;

  return dbProvider.withTransaction(async (transaction) => {
    const teams = await transaction.query<{ id: string; max_members: number }>(
      'SELECT id, max_members FROM teams WHERE id = ? FOR UPDATE',
      [teamId],
    );
    if (teams.length === 0) return { success: false, error: 'Equipo no encontrado', code: 'TEAM_NOT_FOUND' };
    const users = await transaction.users.findById(userId, { forUpdate: true }).then(r => r ? [{ id: r.id }] : []);
    if (users.length === 0) return { success: false, error: 'Jugador no encontrado', code: 'USER_NOT_FOUND' };

    const maxSquadSize = Math.min(teams[0].max_members || 45, gameSlug === 'eafc26' ? 20 : 7);
    const currentMembersCount = await transaction.query<{ total: number }>(
      'SELECT COUNT(*) as total FROM team_members WHERE team_id = ? FOR UPDATE',
      [teamId],
    );
    if ((currentMembersCount[0]?.total ?? 0) >= maxSquadSize) {
      return { success: false, error: `El equipo ha alcanzado la capacidad máxima de plantilla (${maxSquadSize} atletas).`, code: 'SQUAD_FULL' };
    }

    let marketMode: 'ABIERTO' | 'CERRADO' | 'SIN_MERCADO' = 'ABIERTO';
    let isCompetitionActive = false;
    if (competitionId) {
      const comps = await transaction.query<{ transfer_market_mode: 'ABIERTO' | 'CERRADO' | 'SIN_MERCADO'; status: string }>(
        'SELECT transfer_market_mode, status FROM competitions WHERE id = ? FOR UPDATE',
        [competitionId],
      );
      if (comps.length === 0) return { success: false, error: 'Competencia no encontrada', code: 'COMPETITION_NOT_FOUND' };
      marketMode = comps[0].transfer_market_mode;
      isCompetitionActive = ['EN_CURSO', 'IN_PROGRESS', 'En Curso', 'En_Juego'].includes(comps[0].status);
    }
    if (marketMode === 'SIN_MERCADO') {
      return { success: false, error: 'Mercado de transferencias deshabilitado en esta competencia', code: 'MARKET_CLOSED' };
    }

    const duplicates = await transaction.query<{ id: string }>(
      `SELECT id FROM transfer_applications
        WHERE team_id = ? AND applicant_user_id = ? AND application_type = ? AND status = 'PENDIENTE' FOR UPDATE`,
      [teamId, userId, type],
    );
    if (duplicates.length > 0) return { success: false, error: 'Ya existe una solicitud pendiente.', code: 'DUPLICATE_APPLICATION' };

    const appId = randomUUID();
    const isExtraordinary = marketMode === 'CERRADO' || isCompetitionActive;
    await transaction.execute(
      `INSERT INTO transfer_applications (id, team_id, applicant_user_id, game_slug, position, pitch_message, application_type, status, is_extraordinary, organizer_approval_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', ?, ?)`,
      [appId, teamId, userId, gameSlug, position, pitchMessage || null, type, isExtraordinary ? 1 : 0, isExtraordinary ? 'PENDIENTE_ORGANIZADOR' : 'NINGUNO'],
    );
    return { success: true, applicationId: appId, isExtraordinary };
  });
}

export async function respondOrdinaryTransferApplicationService(
  applicationId: string,
  processedByUserId: string,
  accept: boolean,
): Promise<{ success: boolean; error?: string }> {
  return dbProvider.withTransaction(async (transaction) => {
    const applications = await transaction.query<TransferApplicationRow>(
      `SELECT * FROM transfer_applications
        WHERE id = ? AND status = 'PENDIENTE' AND organizer_approval_status = 'NINGUNO' FOR UPDATE`,
      [applicationId],
    );
    if (applications.length === 0) return { success: false, error: 'Solicitud ordinaria no encontrada o ya procesada.' };
    const application = applications[0];

    if (!accept) {
      await executeCas(transaction,
        `UPDATE transfer_applications SET status = 'RECHAZADO', processed_by = ?, processed_at = NOW()
          WHERE id = ? AND status = 'PENDIENTE' AND organizer_approval_status = 'NINGUNO'`,
        [processedByUserId, applicationId],
        'La solicitud ya fue procesada.',
      );
      return { success: true };
    }

    await transaction.query('SELECT id FROM users WHERE id = ? FOR UPDATE', [application.applicant_user_id]);
    const teams = await transaction.query<{ id: string; name: string; max_members: number }>(
      'SELECT id, name, max_members FROM teams WHERE id = ? FOR UPDATE',
      [application.team_id],
    );
    if (teams.length === 0) return { success: false, error: 'Equipo no encontrado.' };
    const counts = await transaction.query<{ total: number }>(
      'SELECT COUNT(*) AS total FROM team_members WHERE team_id = ? FOR UPDATE',
      [application.team_id],
    );
    const limit = Math.min(teams[0].max_members || 45, application.game_slug === 'eafc26' ? 20 : 7);
    if ((counts[0]?.total ?? 0) >= limit) return { success: false, error: 'El equipo alcanzó su capacidad máxima.' };

    const previousTeams = await transaction.query<{ id: string; name: string }>(
      `SELECT t.id, t.name FROM teams t JOIN team_members tm ON tm.team_id = t.id
        WHERE tm.user_id = ? FOR UPDATE`,
      [application.applicant_user_id],
    );
    await executeCas(transaction,
      `UPDATE transfer_applications SET status = 'ACEPTADO', processed_by = ?, processed_at = NOW()
        WHERE id = ? AND status = 'PENDIENTE' AND organizer_approval_status = 'NINGUNO'`,
      [processedByUserId, applicationId],
      'La solicitud ya fue procesada.',
    );
    await transaction.execute('DELETE FROM team_members WHERE user_id = ?', [application.applicant_user_id]);
    await transaction.execute(
      `INSERT INTO team_members (id, team_id, user_id, tactical_position, role_in_team) VALUES (?, ?, ?, ?, 'Jugador')`,
      [randomUUID(), application.team_id, application.applicant_user_id, application.position],
    );
    await transaction.execute(
      `INSERT INTO transfer_history_logs
        (id, game_slug, player_user_id, from_team_id, from_team_name, to_team_id, to_team_name, approved_by_user_id, transfer_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'TRASPASO_DIRECTO')`,
      [
        randomUUID(), application.game_slug, application.applicant_user_id, previousTeams[0]?.id || null,
        previousTeams[0]?.name || 'Agente Libre', application.team_id, teams[0].name, processedByUserId,
      ],
    );
    for (const previousTeam of previousTeams) {
      await transaction.execute(
        'UPDATE teams SET members_count = (SELECT COUNT(*) FROM team_members WHERE team_id = ?) WHERE id = ?',
        [previousTeam.id, previousTeam.id],
      );
    }
    await transaction.execute(
      'UPDATE teams SET members_count = (SELECT COUNT(*) FROM team_members WHERE team_id = ?) WHERE id = ?',
      [application.team_id, application.team_id],
    );
    await transaction.execute(
      "UPDATE transfer_market_posts SET status = 'COMPLETADO' WHERE user_id = ? AND status = 'ACTIVO'",
      [application.applicant_user_id],
    );
    return { success: true };
  });
}

export async function cancelTransferOfferService(offerId: string, expectedTeamId: string) {
  return dbProvider.withTransaction(async (transaction) => {
    const offers = await transaction.query<{ id: string; team_id: string }>(
      "SELECT id, team_id FROM transfer_offers WHERE id = ? AND status = 'PENDIENTE' FOR UPDATE",
      [offerId],
    );
    if (offers.length === 0 || offers[0].team_id !== expectedTeamId) return { success: false, error: 'Oferta no encontrada o ya procesada.' };
    await executeCas(transaction,
      "UPDATE transfer_offers SET status = 'CANCELADO' WHERE id = ? AND team_id = ? AND status = 'PENDIENTE'",
      [offerId, expectedTeamId],
      'La oferta ya fue procesada.',
    );
    return { success: true, message: 'Oferta cancelada correctamente.' };
  });
}

export async function approveExtraordinaryTransferService(applicationId: string, organizerUserId: string): Promise<{ success: boolean; error?: string }> {
  return dbProvider.withTransaction(async (transaction) => {
    const apps = await transaction.query<TransferApplicationRow>(
      `SELECT * FROM transfer_applications
        WHERE id = ? AND status = 'PENDIENTE' AND organizer_approval_status = 'PENDIENTE_ORGANIZADOR'
        FOR UPDATE`,
      [applicationId],
    );
    if (apps.length === 0) return { success: false, error: 'Solicitud no encontrada o ya procesada' };
    const app = apps[0];

    await transaction.query('SELECT id FROM users WHERE id = ? FOR UPDATE', [app.applicant_user_id]);

    const newTeams = await transaction.query<{ name: string }>(
      'SELECT name FROM teams WHERE id = ? FOR UPDATE',
      [app.team_id],
    );
    if (newTeams.length === 0) return { success: false, error: 'Equipo no encontrado' };

    const maxSquadSize = app.game_slug === 'eafc26' ? 20 : 7;
    const currentMembersCount = await transaction.query<{ total: number }>(
      'SELECT COUNT(*) as total FROM team_members WHERE team_id = ?',
      [app.team_id],
    );
    if ((currentMembersCount[0]?.total ?? 0) >= maxSquadSize) {
      return { success: false, error: `No se puede aprobar. El equipo ya alcanzó su tope máximo de ${maxSquadSize} jugadores.` };
    }

    const prevTeams = await transaction.query<{ id: string; name: string }>(
      `SELECT t.id, t.name FROM teams t JOIN team_members tm ON tm.team_id = t.id
        WHERE tm.user_id = ? FOR UPDATE`,
      [app.applicant_user_id],
    );
    const fromTeamId = prevTeams[0]?.id || null;
    const fromTeamName = prevTeams[0]?.name || 'Agente Libre';

    await executeCas(transaction,
      `UPDATE transfer_applications
          SET status = 'ACEPTADO', organizer_approval_status = 'APROBADO_ORGANIZADOR', processed_by = ?, processed_at = NOW()
        WHERE id = ? AND status = 'PENDIENTE' AND organizer_approval_status = 'PENDIENTE_ORGANIZADOR'`,
      [organizerUserId, applicationId],
      'La solicitud ya fue procesada por otro usuario.',
    );

    await transaction.execute(
      `INSERT INTO team_members (id, team_id, user_id, tactical_position, role_in_team)
       VALUES (?, ?, ?, ?, 'Jugador')
       ON DUPLICATE KEY UPDATE tactical_position = VALUES(tactical_position)`,
      [randomUUID(), app.team_id, app.applicant_user_id, app.position],
    );
    await transaction.execute(
      `INSERT INTO transfer_history_logs (id, game_slug, player_user_id, from_team_id, from_team_name, to_team_id, to_team_name, approved_by_user_id, transfer_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'EXTRAORDINARIO')`,
      [randomUUID(), app.game_slug, app.applicant_user_id, fromTeamId, fromTeamName, app.team_id, newTeams[0].name, organizerUserId],
    );
    await transaction.execute(
      "UPDATE transfer_market_posts SET status = 'COMPLETADO' WHERE user_id = ? AND type = 'JUGADOR_BUSCA_CLUB'",
      [app.applicant_user_id],
    );
    await transaction.execute(
      'UPDATE teams SET members_count = (SELECT COUNT(*) FROM team_members WHERE team_id = ?) WHERE id = ?',
      [app.team_id, app.team_id],
    );
    return { success: true };
  });
}

export async function rejectExtraordinaryTransferService(applicationId: string, organizerUserId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  void reason;
  await dbProvider.query(
    `UPDATE transfer_applications SET status = 'RECHAZADO', organizer_approval_status = 'RECHAZADO_ORGANIZADOR', processed_by = ?, processed_at = NOW() WHERE id = ?`,
    [organizerUserId, applicationId]
  );
  return { success: true };
}

export async function getAthleteTransferHistoryService(userId: string, organizationId?: string): Promise<AthleteTransferHistoryResult> {
  const params: DatabaseParams = [userId];
  let orgWhere = '';
  if (organizationId) {
    orgWhere = ' AND (organization_id = ? OR organization_id IS NULL)';
    params.push(organizationId);
  }

  const logs = await dbProvider.query<TransferHistoryRow>(
    `SELECT id, game_slug, from_team_name, to_team_name, signed_at, transfer_type 
     FROM transfer_history_logs 
     WHERE player_user_id = ? ${orgWhere}
     ORDER BY signed_at DESC 
     LIMIT 10`,
    params
  );

  const countRes = await dbProvider.query<{ total: number }>(
    `SELECT COUNT(*) as total FROM transfer_history_logs WHERE player_user_id = ? ${orgWhere}`,
    params
  );

  const totalMovements = countRes[0]?.total || logs.length;

  return {
    userId,
    totalMovements,
    recentTransfers: logs.map((l) => ({
      id: l.id,
      gameSlug: l.game_slug,
      fromTeamName: l.from_team_name || 'Agente Libre',
      toTeamName: l.to_team_name,
      signedAt: l.signed_at,
      transferType: l.transfer_type,
    })),
  };
}

export async function createTransferPostService(data: CreateTransferPostData): Promise<{ success: boolean; postId?: string; error?: string }> {
  const { gameSlug, type, userId, userName, userGamertag, teamId, teamName, position, platform, message } = data;

  const postId = randomUUID();

  try {
    return await dbProvider.withTransaction(async (transaction) => {
      const users = await transaction.users.findById(userId, { forUpdate: true }).then(r => r ? [{ id: r.id }] : []);
      if (users.length === 0) return { success: false, error: 'Usuario no encontrado.' };
      if (type === 'CLUB_RECLUTA_JUGADOR') {
        if (!teamId) return { success: false, error: 'Equipo requerido.' };
        const teams = await transaction.teams.findById(teamId, { forUpdate: true }).then(r => r ? [{ id: r.id }] : []);
        if (teams.length === 0) return { success: false, error: 'Equipo no encontrado.' };
      }

      const activePosts = await transaction.query<{ id: string }>(
        type === 'JUGADOR_BUSCA_CLUB'
          ? `SELECT id FROM transfer_market_posts
              WHERE user_id = ? AND game_slug = ? AND type = 'JUGADOR_BUSCA_CLUB' AND status = 'ACTIVO' FOR UPDATE`
          : `SELECT id FROM transfer_market_posts
              WHERE team_id = ? AND game_slug = ? AND type = 'CLUB_RECLUTA_JUGADOR' AND position = ? AND status = 'ACTIVO' FOR UPDATE`,
        type === 'JUGADOR_BUSCA_CLUB' ? [userId, gameSlug] : [teamId, gameSlug, position],
      );
      if (activePosts.length > 0) {
        await transaction.execute(
          `UPDATE transfer_market_posts SET status = 'CADUCADO'
            WHERE id IN (${activePosts.map(() => '?').join(', ')}) AND status = 'ACTIVO'`,
          activePosts.map((post) => post.id),
        );
      }
      await transaction.execute(
        `INSERT INTO transfer_market_posts
          (id, game_slug, type, user_id, user_name, user_gamertag, team_id, team_name, position, platform, status, message, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVO', ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
        [postId, gameSlug, type, userId, userName, userGamertag, teamId || null, teamName || null, position, platform, message],
      );
      return { success: true, postId };
    });
  } catch (err: unknown) {
    console.error('Error al crear publicación en BD:', err);
    return { success: false, error: getErrorMessage(err, 'Error en BD') };
  }
}

export async function cancelTransferPostService(postId: string, actorUserId: string, expectedTeamId?: string) {
  return dbProvider.withTransaction(async (transaction) => {
    const posts = await transaction.query<{ id: string; user_id: string; team_id: string | null }>(
      "SELECT id, user_id, team_id FROM transfer_market_posts WHERE id = ? AND status = 'ACTIVO' FOR UPDATE",
      [postId],
    );
    const post = posts[0];
    if (!post || (post.user_id !== actorUserId && (!expectedTeamId || post.team_id !== expectedTeamId))) {
      return { success: false, error: 'Publicación no encontrada o no autorizada.' };
    }
    await executeCas(transaction,
      "UPDATE transfer_market_posts SET status = 'CADUCADO' WHERE id = ? AND status = 'ACTIVO'",
      [postId],
      'La publicación ya fue cerrada.',
    );
    return { success: true };
  });
}

export async function getTransferPostsService(
  gameSlug: string,
  timeFilter: 'TODAY' | '3_DAYS' | '7_DAYS' | 'ALL' = 'ALL'
) {
  try {
    await dbProvider.query(
      `UPDATE transfer_market_posts SET status = 'CADUCADO' WHERE expires_at < NOW() AND status = 'ACTIVO'`
    );

    let timeClause = '';
    if (timeFilter === 'TODAY') {
      timeClause = ' AND created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)';
    } else if (timeFilter === '3_DAYS') {
      timeClause = ' AND created_at >= DATE_SUB(NOW(), INTERVAL 3 DAY)';
    } else if (timeFilter === '7_DAYS') {
      timeClause = ' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    }

    const posts = await dbProvider.query<TransferPostRow>(
      `SELECT id, game_slug, type, user_id, user_name, user_gamertag, team_id, team_name, position, platform, status, message, expires_at, created_at
       FROM transfer_market_posts
       WHERE game_slug = ? AND status = 'ACTIVO' ${timeClause}
       ORDER BY created_at DESC`,
      [gameSlug]
    );

    return posts.map((p) => ({
      id: p.id,
      gameSlug: p.game_slug,
      type: p.type,
      userId: p.user_id,
      userName: p.user_name,
      userGamertag: p.user_gamertag,
      teamId: p.team_id,
      teamName: p.team_name,
      position: p.position,
      platform: p.platform,
      status: p.status,
      message: p.message,
      expiresAt: p.expires_at,
      createdAt: p.created_at,
    }));
  } catch (err) {
    console.error('MySQL Error in getTransferPostsService:', err);
    return [];
  }
}

export async function getCompletedTransfersService(gameSlug: string) {
  try {
    const logs = await dbProvider.query<TransferHistoryRow>(
      `SELECT thl.id, thl.game_slug, thl.player_user_id, COALESCE(u.name, 'Atleta Oficial') as player_name, COALESCE(u.gamertag, 'Atleta') as player_gamertag, 
              thl.from_team_name, thl.to_team_name, thl.transfer_type, thl.signed_at
       FROM transfer_history_logs thl
       LEFT JOIN users u ON thl.player_user_id = u.id
       WHERE thl.game_slug = ?
       ORDER BY thl.signed_at DESC
       LIMIT 50`,
      [gameSlug]
    );

    return logs.map((l) => ({
      id: l.id,
      gameSlug: l.game_slug,
      playerName: l.player_name || 'Atleta Oficial',
      playerGamertag: l.player_gamertag || 'Atleta',
      fromTeamName: l.from_team_name || 'Agente Libre',
      toTeamName: l.to_team_name,
      transferType: l.transfer_type,
      signedAt: l.signed_at,
    }));
  } catch (err) {
    console.error('MySQL Error in getCompletedTransfersService:', err);
    return [];
  }
}

export async function getPlayerContractOffersService(userId: string, gameSlug: string) {
  try {
    const offers = await dbProvider.query<ContractOfferRow>(
      `SELECT o.id, o.game_slug, o.team_id, COALESCE(t.name, 'Escuadra Oficial') as team_name, COALESCE(t.tag, 'PRO') as team_tag, o.position, o.pitch_message, o.status, o.created_at
       FROM transfer_offers o
       LEFT JOIN teams t ON o.team_id = t.id
       WHERE o.player_user_id = ? AND o.game_slug = ? AND o.offer_type = 'OFERTA_CLUB' AND o.status = 'PENDIENTE'
       ORDER BY o.created_at DESC`,
      [userId, gameSlug]
    );

    return offers.map((off) => ({
      id: off.id,
      gameSlug: off.game_slug,
      teamId: off.team_id,
      teamName: off.team_name,
      teamTag: off.team_tag,
      position: off.position,
      pitchMessage: off.pitch_message || 'Propuesta de vinculación oficial para torneo',
      status: off.status,
      createdAt: off.created_at,
    }));
  } catch (err) {
    console.error('Error en getPlayerContractOffersService:', err);
    return [];
  }
}

export async function respondPlayerContractOfferService(
  offerId: string,
  userId: string,
  accept: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!accept) {
      return await dbProvider.withTransaction(async (transaction) => {
        await executeCas(transaction,
          "UPDATE transfer_offers SET status = 'RECHAZADO' WHERE id = ? AND player_user_id = ? AND status = 'PENDIENTE'",
          [offerId, userId],
          'Oferta no encontrada o ya procesada.',
        );
        return { success: true };
      });
    }

    return await dbProvider.withTransaction(async (transaction) => {
      const offers = await transaction.query<ContractOfferRow>(
        "SELECT * FROM transfer_offers WHERE id = ? AND player_user_id = ? AND status = 'PENDIENTE' FOR UPDATE",
        [offerId, userId],
      );
      if (offers.length === 0) return { success: false, error: 'Oferta no encontrada o ya procesada.' };
      const offer = offers[0];

      await transaction.query('SELECT id FROM users WHERE id = ? FOR UPDATE', [userId]);

      const targetTeam = await transaction.query<{ name: string }>(
        'SELECT name FROM teams WHERE id = ? FOR UPDATE',
        [offer.team_id],
      );
      if (targetTeam.length === 0) return { success: false, error: 'Equipo no encontrado.' };

      const maxSquadSize = offer.game_slug === 'eafc26' ? 20 : 7;
      const rosterCount = await transaction.query<{ total: number }>(
        'SELECT COUNT(*) as total FROM team_members WHERE team_id = ?',
        [offer.team_id],
      );
      if ((rosterCount[0]?.total ?? 0) >= maxSquadSize) {
        return { success: false, error: `No se puede aceptar. La escuadra ya cuenta con el máximo permitido de ${maxSquadSize} jugadores.` };
      }

      // Salida Limpia
      const previousTeams = await transaction.query<{ team_id: string; team_name: string }>(
        `SELECT tm.team_id, t.name as team_name 
         FROM team_members tm
         JOIN teams t ON tm.team_id = t.id
         WHERE tm.user_id = ? AND t.game_slug = ? AND tm.team_id != ? FOR UPDATE`,
        [userId, offer.game_slug, offer.team_id],
      );

      let fromTeamId: string | null = null;
      let fromTeamName = 'Agente Libre';

      for (const prev of previousTeams) {
        fromTeamId = prev.team_id;
        fromTeamName = prev.team_name;
        await transaction.execute(
          'DELETE FROM team_members WHERE team_id = ? AND user_id = ?',
          [prev.team_id, userId],
        );
        await transaction.execute(
          'UPDATE teams SET members_count = (SELECT COUNT(*) FROM team_members WHERE team_id = ?) WHERE id = ?',
          [prev.team_id, prev.team_id],
        );
      }

      let orgName = 'Organización General';
      const organizationMatch = offer.pitch_message?.match(/\[Organización:\s*([^\]]+)\]/i);
      if (organizationMatch?.[1]) orgName = organizationMatch[1].trim();

      await executeCas(transaction,
        "UPDATE transfer_offers SET status = 'ACEPTADO' WHERE id = ? AND player_user_id = ? AND status = 'PENDIENTE'",
        [offerId, userId],
        'La oferta ya fue procesada por otro usuario.',
      );
      await transaction.execute(
        'DELETE FROM team_members WHERE user_id = ? AND LOWER(organization_name) = LOWER(?)',
        [userId, orgName],
      );
      await transaction.execute(
        `INSERT INTO team_members (id, team_id, user_id, organization_name, tactical_position, role_in_team)
         VALUES (?, ?, ?, ?, ?, 'Jugador')
         ON DUPLICATE KEY UPDATE tactical_position = VALUES(tactical_position)`,
        [randomUUID(), offer.team_id, userId, orgName, offer.position || 'DFC'],
      );
      await transaction.execute(
        `INSERT INTO transfer_history_logs (id, game_slug, player_user_id, from_team_id, from_team_name, to_team_id, to_team_name, approved_by_user_id, transfer_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'LIBRE')`,
        [randomUUID(), offer.game_slug, userId, fromTeamId, fromTeamName, offer.team_id, targetTeam[0].name, userId],
      );
      await transaction.execute(
        "UPDATE transfer_market_posts SET status = 'COMPLETADO' WHERE user_id = ? AND type = 'JUGADOR_BUSCA_CLUB'",
        [userId],
      );
      await transaction.execute(
        'UPDATE teams SET members_count = (SELECT COUNT(*) FROM team_members WHERE team_id = ?) WHERE id = ?',
        [offer.team_id, offer.team_id],
      );
      return { success: true };
    });
  } catch (err: unknown) {
    console.error('Error al responder oferta de contrato:', err);
    return { success: false, error: getErrorMessage(err, 'Error al procesar contrato.') };
  }
}
