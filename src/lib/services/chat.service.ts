// =============================================================================
// TournamentsPro — eSports Internal Chat & Moderation Service
// =============================================================================

import { randomUUID } from 'crypto';
import type { DatabaseParams } from '@/lib/db';
import { dbProvider } from '@/lib/db/provider';
import {
  getErrorMessage,
  type ChatThreadDTO,
  type ChatMessageDTO,
  type ChatThreadRow,
  type ChatMessageRow,
  type ChatReportDTO,
  type UserChatHistoryDTO,
  type UserChatHistoryMessageItem,
} from './types';

const isSupabaseProvider = () => (process.env.DATABASE_PROVIDER || 'mysql').toLowerCase() === 'supabase';

interface TypingEntry {
  threadId: string;
  userId: string;
  userName: string;
  expiresAt: number;
}

const typingCache = new Map<string, TypingEntry>();

function clearTypingEntry(threadId: string, userId: string) {
  typingCache.delete(`${threadId}:${userId}`);
}

function cleanupTypingCache() {
  const now = Date.now();
  for (const [key, entry] of typingCache.entries()) {
    if (entry.expiresAt <= now) {
      typingCache.delete(key);
    }
  }
}

export async function getChatThreadsService(
  userId: string,
  userRole: string,
  gameSlug: string = 'eafc26',
  channelFilter: string = 'ALL'
): Promise<ChatThreadDTO[]> {
  try {
    const isAdmin = userRole === 'Administrador' || userRole === 'Admin';

    if (isSupabaseProvider()) {
      const { supabase } = await import('@/lib/db/supabase/client');
      let query = supabase.from('chat_threads').select('*');

      if (!isAdmin) {
        query = query.or(`participant_a_id.eq.${userId},participant_b_id.eq.${userId},participant_b_id.eq.usr-all`);
      }

      if (gameSlug && gameSlug !== 'ALL') {
        query = query.eq('game_slug', gameSlug);
      }

      if (channelFilter && channelFilter !== 'ALL') {
        query = query.eq('channel_type', channelFilter);
      }

      query = query.order('last_message_at', { ascending: false });

      const { data: threads, error } = await query;
      if (error || !threads) return [];

      const threadIds = threads.map((t) => t.id);
      const unreadMap = new Map<string, number>();

      if (threadIds.length > 0) {
        const { data: unreadMsgs } = await supabase
          .from('chat_messages')
          .select('thread_id')
          .in('thread_id', threadIds)
          .eq('is_read', false)
          .neq('sender_id', userId);

        if (unreadMsgs) {
          for (const msg of unreadMsgs) {
            unreadMap.set(msg.thread_id, (unreadMap.get(msg.thread_id) || 0) + 1);
          }
        }
      }

      return threads.map((t) => {
        const isParticipantA = t.participant_a_id === userId;
        const isParticipantB = t.participant_b_id === userId;
        const isSelf = isParticipantA || isParticipantB;

        const otherId = isParticipantA ? t.participant_b_id : t.participant_a_id;
        const otherName = isSelf
          ? (isParticipantA ? t.participant_b_name : t.participant_a_name)
          : `${t.participant_a_name} & ${t.participant_b_name}`;
        const otherRole = isSelf
          ? (isParticipantA ? t.participant_b_role : t.participant_a_role)
          : `${t.participant_a_role} / ${t.participant_b_role}`;

        return {
          id: t.id,
          channelType: t.channel_type as any,
          gameSlug: t.game_slug,
          title: t.title || (otherName ? `Chat con ${otherName}` : 'Conversación Directa'),
          participantId: otherId || '',
          participantName: otherName || t.participant_a_name,
          participantRole: otherRole || t.participant_a_role,
          lastMessageText: t.last_message_text || 'Sin mensajes aún',
          lastMessageAt: t.last_message_at
            ? new Date(t.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '',
          unreadCount: unreadMap.get(t.id) || 0,
        } as any;
      });
    }

    // MySQL flow
    let whereClause = isAdmin
      ? '1=1'
      : `(ct.participant_a_id = ? OR ct.participant_b_id = ? OR ct.participant_b_id = 'usr-all')`;
    const queryParams: DatabaseParams = isAdmin ? [] : [userId, userId];

    if (gameSlug && gameSlug !== 'ALL') {
      whereClause += ` AND ct.game_slug = ?`;
      queryParams.push(gameSlug);
    }

    if (channelFilter !== 'ALL') {
      whereClause += ` AND ct.channel_type = ?`;
      queryParams.push(channelFilter);
    }

    const threads = await dbProvider.query<ChatThreadRow>(
      `SELECT ct.*, 
        (SELECT COUNT(*) FROM chat_messages cm WHERE cm.thread_id = ct.id AND cm.sender_id != ? AND cm.is_read = 0) as unread_count
       FROM chat_threads ct
       WHERE ${whereClause}
       ORDER BY ct.last_message_at DESC`,
      [userId, ...queryParams]
    );

    return threads.map((t) => {
      const isParticipantA = t.participant_a_id === userId;
      const isParticipantB = t.participant_b_id === userId;
      const isSelf = isParticipantA || isParticipantB;

      const otherId = isParticipantA ? t.participant_b_id : t.participant_a_id;
      const otherName = isSelf
        ? (isParticipantA ? t.participant_b_name : t.participant_a_name)
        : `${t.participant_a_name} & ${t.participant_b_name}`;
      const otherRole = isSelf
        ? (isParticipantA ? t.participant_b_role : t.participant_a_role)
        : `${t.participant_a_role} / ${t.participant_b_role}`;

      return {
        id: t.id,
        channelType: t.channel_type as any,
        gameSlug: t.game_slug,
        title: t.title || (otherName ? `Chat con ${otherName}` : 'Conversación Directa'),
        participantId: otherId || '',
        participantName: otherName || t.participant_a_name,
        participantRole: otherRole || t.participant_a_role,
        lastMessageText: t.last_message_text || 'Sin mensajes aún',
        lastMessageAt: t.last_message_at
          ? new Date(t.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '',
        unreadCount: Number(t.unread_count) || 0,
      } as any;
    });
  } catch (err) {
    console.error('Error en getChatThreadsService:', err);
    return [];
  }
}

export async function getThreadMessagesService(threadId: string): Promise<ChatMessageDTO[]> {
  try {
    if (isSupabaseProvider()) {
      const { supabase } = await import('@/lib/db/supabase/client');
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error || !messages) return [];

      // Marcar mensajes como leídos en segundo plano
      void supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('thread_id', threadId)
        .eq('is_read', false);

      return messages.map((m) => ({
        id: m.id,
        threadId: m.thread_id,
        senderId: m.sender_id,
        senderName: m.sender_name,
        senderRole: m.sender_role,
        text: m.message_text,
        timestamp: m.created_at
          ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '',
      } as any));
    }

    // MySQL flow
    const messages = await dbProvider.query<ChatMessageRow>(
      `SELECT * FROM chat_messages WHERE thread_id = ? ORDER BY created_at ASC`,
      [threadId]
    );

    void dbProvider.query(
      `UPDATE chat_messages SET is_read = 1 WHERE thread_id = ? AND is_read = 0`,
      [threadId]
    ).catch(() => {});

    return messages.map((m) => ({
      id: m.id,
      threadId: m.thread_id,
      senderId: m.sender_id,
      senderName: m.sender_name,
      senderRole: m.sender_role,
      text: m.message_text,
      timestamp: m.created_at
        ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '',
    } as any));
  } catch (error) {
    console.error('Error en getThreadMessagesService:', error);
    return [];
  }
}

export async function sendChatMessageService(
  threadId: string,
  senderId: string,
  senderName: string,
  senderRole: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const user = await dbProvider.users.findById(senderId);
    if (user) {
      if (user.status === 'Baneado' || user.status === 'Suspendido') {
        return {
          success: false,
          error: `Tu cuenta se encuentra con estado "${user.status}" en el sistema y no puedes enviar mensajes.`,
        };
      }
      if (user.isBanned) {
        return {
          success: false,
          error: `Has sido silenciado/baneado de la mensajería. Motivo: ${user.banReason || 'Infracción de reglamento eSports.'}`,
        };
      }
    }

    const messageId = `cm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    if (isSupabaseProvider()) {
      const { supabase } = await import('@/lib/db/supabase/client');
      const { error: msgErr } = await supabase.from('chat_messages').insert({
        id: messageId,
        thread_id: threadId,
        sender_id: senderId,
        sender_name: senderName,
        sender_role: senderRole,
        message_text: text,
        is_read: false,
        created_at: now,
      });

      if (msgErr) {
        console.error('Error insertando mensaje en Supabase:', msgErr);
        return { success: false, error: 'Error al enviar mensaje.' };
      }

      await supabase
        .from('chat_threads')
        .update({
          last_message_text: text,
          last_message_at: now,
        })
        .eq('id', threadId);

      clearTypingEntry(threadId, senderId);
      return { success: true, messageId };
    }

    // MySQL flow
    await dbProvider.query(
      `INSERT INTO chat_messages (id, thread_id, sender_id, sender_name, sender_role, message_text)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [messageId, threadId, senderId, senderName, senderRole, text]
    );

    await dbProvider.query(
      `UPDATE chat_threads SET last_message_text = ?, last_message_at = NOW() WHERE id = ?`,
      [text, threadId]
    );

    clearTypingEntry(threadId, senderId);
    await dbProvider.query(`DELETE FROM chat_typing_status WHERE thread_id = ? AND user_id = ?`, [threadId, senderId]).catch(() => {});

    return { success: true, messageId };
  } catch (err: unknown) {
    console.error('Error en sendChatMessageService:', err);
    return { success: false, error: getErrorMessage(err, 'Error al enviar mensaje.') };
  }
}

export async function updateTypingStatusService(threadId: string, userId: string, userName: string) {
  if (!threadId || !userId) return { success: false };
  cleanupTypingCache();
  typingCache.set(`${threadId}:${userId}`, {
    threadId,
    userId,
    userName: userName || 'Usuario',
    expiresAt: Date.now() + 4000,
  });
  return { success: true };
}

export async function clearTypingStatusService(threadId: string, userId: string) {
  if (!threadId || !userId) return { success: false };
  clearTypingEntry(threadId, userId);
  return { success: true };
}

export async function getTypingUsersService(threadId: string, currentUserId: string): Promise<string[]> {
  if (!threadId || !currentUserId) return [];
  cleanupTypingCache();
  const typingNames: string[] = [];
  for (const entry of typingCache.values()) {
    if (entry.threadId === threadId && entry.userId !== currentUserId) {
      typingNames.push(entry.userName);
    }
  }
  return typingNames;
}

export async function createOrGetDirectThreadService(
  currentUserId: string,
  currentUserName: string,
  currentUserRole: string,
  targetUserId: string,
  targetUserName: string,
  targetUserRole: string,
  gameSlug: string,
  channelType: 'DIRECTO' | 'SQUAD_EQUIPO' | 'SOPORTE_ORGANIZADOR' | 'ANUNCIO_ADMIN' = 'DIRECTO',
  title?: string
) {
  try {
    const threadTitle = title || `Chat con ${targetUserName}`;
    const now = new Date().toISOString();

    if (isSupabaseProvider()) {
      const { supabase } = await import('@/lib/db/supabase/client');
      const { data: existing } = await supabase
        .from('chat_threads')
        .select('id')
        .eq('channel_type', channelType)
        .eq('game_slug', gameSlug)
        .or(`and(participant_a_id.eq.${currentUserId},participant_b_id.eq.${targetUserId}),and(participant_a_id.eq.${targetUserId},participant_b_id.eq.${currentUserId})`)
        .limit(1);

      if (existing && existing.length > 0) {
        return { success: true, threadId: existing[0].id };
      }

      const newThreadId = `ct-${Date.now()}`;
      const { error } = await supabase.from('chat_threads').insert({
        id: newThreadId,
        channel_type: channelType,
        game_slug: gameSlug,
        title: threadTitle,
        participant_a_id: currentUserId,
        participant_a_name: currentUserName,
        participant_a_role: currentUserRole,
        participant_b_id: targetUserId,
        participant_b_name: targetUserName,
        participant_b_role: targetUserRole,
        last_message_text: 'Conversación iniciada.',
        last_message_at: now,
        created_at: now,
      });

      if (error) {
        console.error('Error al crear hilo en Supabase:', error);
        return { success: false, error: 'Error al crear hilo de chat.' };
      }

      return { success: true, threadId: newThreadId };
    }

    // MySQL flow
    const existing = await dbProvider.query<{ id: string }>(
      `SELECT id FROM chat_threads 
       WHERE channel_type = ? AND game_slug = ? AND 
             ((participant_a_id = ? AND participant_b_id = ?) OR (participant_a_id = ? AND participant_b_id = ?))`,
      [channelType, gameSlug, currentUserId, targetUserId, targetUserId, currentUserId]
    );

    if (existing && existing.length > 0) {
      return { success: true, threadId: existing[0].id };
    }

    const newThreadId = `ct-${Date.now()}`;
    await dbProvider.query(
      `INSERT INTO chat_threads (id, channel_type, game_slug, title, participant_a_id, participant_a_name, participant_a_role, participant_b_id, participant_b_name, participant_b_role, last_message_text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Conversación iniciada.')`,
      [
        newThreadId,
        channelType,
        gameSlug,
        threadTitle,
        currentUserId,
        currentUserName,
        currentUserRole,
        targetUserId,
        targetUserName,
        targetUserRole,
      ]
    );

    return { success: true, threadId: newThreadId };
  } catch (err: unknown) {
    console.error('Error en createOrGetDirectThreadService:', err);
    return { success: false, error: getErrorMessage(err, 'Error al crear hilo de chat.') };
  }
}

export async function getUsersByRoleService(role: string) {
  try {
    const normalized = role.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let rolesToMatch: string[] = [role];

    if (normalized.includes('capitan')) {
      rolesToMatch = ['Capitan', 'Capitán', 'capitan', 'capitán'];
    } else if (normalized.includes('admin')) {
      rolesToMatch = ['Administrador', 'administrador', 'Admin', 'admin'];
    } else if (normalized.includes('organiz')) {
      rolesToMatch = ['Organizador', 'organizador'];
    } else if (normalized.includes('jugador') || normalized.includes('atleta')) {
      rolesToMatch = ['Jugador', 'jugador', 'Atleta', 'atleta'];
    }

    const users = await dbProvider.users.findAll({
      where: { role: rolesToMatch },
      orderBy: 'name',
      orderDirection: 'ASC',
      limit: 200,
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      gamertag: u.gamertag,
      role: u.role,
      gameSlug: u.primaryGameSlug,
      isBanned: Boolean(u.isBanned),
      banReason: u.banReason,
    }));
  } catch (err) {
    console.error('Error en getUsersByRoleService:', err);
    return [];
  }
}

export async function banUserFromChatService(targetUserId: string, reason?: string) {
  try {
    const reasonText = reason?.trim() || 'Sanción disciplinaria por infracción de reglamento en chat eSports.';
    await dbProvider.users.update(targetUserId, {
      isBanned: true,
      banReason: reasonText,
    });
    return { success: true, message: 'Usuario sancionado y baneado exitosamente.' };
  } catch (err: unknown) {
    console.error('Error en banUserFromChatService:', err);
    return { success: false, error: getErrorMessage(err, 'Error al banear usuario.') };
  }
}

export async function unbanUserFromChatService(targetUserId: string) {
  try {
    await dbProvider.users.update(targetUserId, {
      isBanned: false,
      banReason: null,
    });
    return { success: true, message: 'Sanción levantada. El usuario puede escribir nuevamente.' };
  } catch (err: unknown) {
    console.error('Error en unbanUserFromChatService:', err);
    return { success: false, error: getErrorMessage(err, 'Error al desbanear usuario.') };
  }
}

export async function checkUserBanStatusService(userId: string) {
  try {
    const user = await dbProvider.users.findById(userId);
    if (user) {
      const isSystemBanned = user.status === 'Baneado' || user.status === 'Suspendido';
      const isChatBanned = Boolean(user.isBanned);
      return {
        isBanned: isSystemBanned || isChatBanned,
        isChatBanned,
        isSystemBanned,
        status: user.status || 'Activo',
        reason: user.banReason || (isSystemBanned ? `Cuenta con estado ${user.status}` : null),
      };
    }
    return { isBanned: false, isChatBanned: false, isSystemBanned: false, status: 'Activo', reason: null };
  } catch (err) {
    console.error('Error en checkUserBanStatusService:', err);
    return { isBanned: false, isChatBanned: false, isSystemBanned: false, status: 'Activo', reason: null };
  }
}

export interface ReportChatMessageParams {
  reporterId: string;
  reporterName: string;
  reporterRole: string;
  reportedUserId: string;
  reportedUserName: string;
  threadId: string;
  messageId: string;
  messageText: string;
  reason: string;
  details?: string;
}

export async function reportChatMessageService(
  params: ReportChatMessageParams
): Promise<{ success: boolean; reportId?: string; error?: string }> {
  try {
    const reportId = randomUUID();
    const now = new Date().toISOString();
    const metadata = {
      reporterId: params.reporterId,
      reporterName: params.reporterName,
      reporterRole: params.reporterRole,
      reportedUserId: params.reportedUserId,
      reportedUserName: params.reportedUserName,
      threadId: params.threadId,
      messageId: params.messageId,
      messageText: params.messageText,
      reason: params.reason,
      details: params.details?.trim() || null,
      status: 'Pendiente',
      moderatorNotes: null,
      resolvedBy: null,
      resolvedAt: null,
      createdAt: now,
    };

    if (isSupabaseProvider()) {
      const { supabase } = await import('@/lib/db/supabase/client');
      const { error } = await supabase.from('security_audit_log').insert({
        id: reportId,
        actor_user_id: params.reporterId,
        actor_role: params.reporterRole,
        action_name: 'CHAT_MESSAGE_REPORTED',
        resource_type: 'chat_report',
        resource_id: params.reportedUserId,
        outcome: 'PENDING',
        metadata_json: JSON.stringify(metadata),
        created_at: now,
      });

      if (error) {
        console.error('Error insertando reporte en supabase:', error);
        return { success: false, error: 'No se pudo registrar el reporte' };
      }
      return { success: true, reportId };
    }

    // MySQL flow
    await dbProvider.query(
      `INSERT INTO security_audit_log
        (id, actor_user_id, actor_role, action_name, resource_type, resource_id, outcome, metadata_json, created_at)
       VALUES (?, ?, ?, 'CHAT_MESSAGE_REPORTED', 'chat_report', ?, 'PENDING', ?, ?)`,
      [reportId, params.reporterId, params.reporterRole, params.reportedUserId, JSON.stringify(metadata), now]
    );

    return { success: true, reportId };
  } catch (err: unknown) {
    console.error('Error en reportChatMessageService:', err);
    return { success: false, error: getErrorMessage(err, 'Error al registrar el reporte.') };
  }
}

export async function getChatReportsService(statusFilter?: string): Promise<ChatReportDTO[]> {
  try {
    let rows: any[] = [];
    if (isSupabaseProvider()) {
      const { supabase } = await import('@/lib/db/supabase/client');
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('*')
        .eq('resource_type', 'chat_report')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error || !data) {
        console.error('Error obteniendo reportes en supabase:', error);
        return [];
      }
      rows = data;
    } else {
      rows = await dbProvider.query<any>(
        `SELECT * FROM security_audit_log
         WHERE resource_type = 'chat_report'
         ORDER BY created_at DESC
         LIMIT 100`
      );
    }

    const reports: ChatReportDTO[] = [];
    for (const row of rows) {
      let meta: any = {};
      try {
        meta = typeof row.metadata_json === 'string' ? JSON.parse(row.metadata_json) : (row.metadata_json || {});
      } catch {
        meta = {};
      }

      const status = meta.status || (row.outcome === 'RESOLVED_BANNED' ? 'Sancionado' : row.outcome === 'RESOLVED_DISMISSED' ? 'Descartado' : 'Pendiente');

      if (statusFilter && statusFilter !== 'ALL' && status !== statusFilter) {
        continue;
      }

      reports.push({
        id: row.id,
        reporterUserId: meta.reporterId || row.actor_user_id,
        reporterName: meta.reporterName || 'Usuario',
        reporterRole: meta.reporterRole || row.actor_role,
        reportedUserId: meta.reportedUserId || row.resource_id,
        reportedUserName: meta.reportedUserName || 'Desconocido',
        threadId: meta.threadId || '',
        messageId: meta.messageId || '',
        messageText: meta.messageText || '',
        reason: meta.reason || 'Comportamiento Inadecuado',
        details: meta.details || null,
        status: status as any,
        moderatorNotes: meta.moderatorNotes || null,
        resolvedBy: meta.resolvedBy || null,
        resolvedAt: meta.resolvedAt || null,
        createdAt: row.created_at || meta.createdAt || new Date().toISOString(),
      });
    }

    return reports;
  } catch (err) {
    console.error('Error en getChatReportsService:', err);
    return [];
  }
}

export async function resolveChatReportService(
  reportId: string,
  status: 'Sancionado' | 'Descartado',
  moderatorNotes?: string,
  moderatorName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const outcome = status === 'Sancionado' ? 'RESOLVED_BANNED' : 'RESOLVED_DISMISSED';
    const now = new Date().toISOString();

    if (isSupabaseProvider()) {
      const { supabase } = await import('@/lib/db/supabase/client');
      const { data: row, error: fetchErr } = await supabase
        .from('security_audit_log')
        .select('*')
        .eq('id', reportId)
        .single();

      if (fetchErr || !row) {
        return { success: false, error: 'Reporte no encontrado' };
      }

      let meta: any = {};
      try {
        meta = typeof row.metadata_json === 'string' ? JSON.parse(row.metadata_json) : (row.metadata_json || {});
      } catch {
        meta = {};
      }

      meta.status = status;
      meta.moderatorNotes = moderatorNotes || null;
      meta.resolvedBy = moderatorName || 'Moderador';
      meta.resolvedAt = now;

      const { error: updateErr } = await supabase
        .from('security_audit_log')
        .update({
          outcome,
          metadata_json: JSON.stringify(meta),
        })
        .eq('id', reportId);

      if (updateErr) {
        return { success: false, error: 'Error actualizando el reporte' };
      }

      return { success: true };
    }

    // MySQL flow
    const rows = await dbProvider.query<any>(
      `SELECT * FROM security_audit_log WHERE id = ? LIMIT 1`,
      [reportId]
    );
    if (!rows || rows.length === 0) {
      return { success: false, error: 'Reporte no encontrado' };
    }
    const row = rows[0];
    let meta: any = {};
    try {
      meta = typeof row.metadata_json === 'string' ? JSON.parse(row.metadata_json) : (row.metadata_json || {});
    } catch {
      meta = {};
    }

    meta.status = status;
    meta.moderatorNotes = moderatorNotes || null;
    meta.resolvedBy = moderatorName || 'Moderador';
    meta.resolvedAt = now;

    await dbProvider.query(
      `UPDATE security_audit_log
       SET outcome = ?, metadata_json = ?
       WHERE id = ?`,
      [outcome, JSON.stringify(meta), reportId]
    );

    return { success: true };
  } catch (err: unknown) {
    console.error('Error en resolveChatReportService:', err);
    return { success: false, error: getErrorMessage(err, 'Error al resolver reporte.') };
  }
}

export async function getUserChatHistoryService(targetUserId: string): Promise<UserChatHistoryDTO | null> {
  try {
    const user = await dbProvider.users.findById(targetUserId);
    if (!user) return null;

    let rawMessages: any[] = [];
    const threadDetailsMap = new Map<string, { channelType?: string; gameSlug?: string; title?: string }>();

    if (isSupabaseProvider()) {
      const { supabase } = await import('@/lib/db/supabase/client');
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('sender_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (!error && data) {
        rawMessages = data;
        const threadIds = [...new Set(data.map((m) => m.thread_id).filter(Boolean))];
        if (threadIds.length > 0) {
          const { data: threads } = await supabase
            .from('chat_threads')
            .select('id, channel_type, game_slug, title')
            .in('id', threadIds);
          if (threads) {
            for (const t of threads) {
              threadDetailsMap.set(t.id, {
                channelType: t.channel_type,
                gameSlug: t.game_slug,
                title: t.title,
              });
            }
          }
        }
      }
    } else {
      rawMessages = await dbProvider.query<any>(
        `SELECT m.*, t.channel_type, t.game_slug, t.title as thread_title
         FROM chat_messages m
         LEFT JOIN chat_threads t ON m.thread_id = t.id
         WHERE m.sender_id = ?
         ORDER BY m.created_at DESC
         LIMIT 200`,
        [targetUserId]
      );
      for (const m of rawMessages) {
        if (m.thread_id && !threadDetailsMap.has(m.thread_id)) {
          threadDetailsMap.set(m.thread_id, {
            channelType: m.channel_type,
            gameSlug: m.game_slug,
            title: m.thread_title,
          });
        }
      }
    }

    const messages: UserChatHistoryMessageItem[] = rawMessages.map((m) => {
      const tInfo = threadDetailsMap.get(m.thread_id);
      return {
        id: m.id,
        threadId: m.thread_id,
        channelType: tInfo?.channelType || m.channel_type || 'DIRECTO',
        gameSlug: tInfo?.gameSlug || m.game_slug || '',
        threadTitle: tInfo?.title || m.thread_title || 'Canal de Chat',
        messageText: m.message_text,
        createdAt: m.created_at || '',
        timestamp: m.created_at
          ? new Date(m.created_at).toLocaleString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '',
        isRead: Boolean(m.is_read),
      };
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        gamertag: user.gamertag,
        email: user.email,
        role: user.role,
        isBanned: Boolean(user.isBanned),
        banReason: user.banReason,
        status: user.status,
      },
      messages,
      totalMessages: messages.length,
    };
  } catch (err) {
    console.error('Error en getUserChatHistoryService:', err);
    return null;
  }
}
