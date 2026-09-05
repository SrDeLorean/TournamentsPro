'use server';

import { revalidatePath } from 'next/cache';
import { dbProvider } from '@/lib/db/provider';
import {
  getServerUserSession,
  requireServerActor,
  requireThreadParticipant,
  requireUserManager,
} from '@/lib/auth-server';
import {
  getChatThreadsService,
  getThreadMessagesService,
  sendChatMessageService,
  createOrGetDirectThreadService,
  getUsersByRoleService,
  banUserFromChatService,
  unbanUserFromChatService,
  checkUserBanStatusService,
  updateTypingStatusService,
  clearTypingStatusService,
  getTypingUsersService,
  reportChatMessageService,
  getChatReportsService,
  resolveChatReportService,
  getUserChatHistoryService,
} from '@/lib/services';
import { consumeSecurityRateLimit, revokeUserSessions, writeSecurityAudit } from '@/lib/security';
import { getActionErrorMessage } from '@/lib/action-utils';

export async function getChatThreadsAction(
  userId: string,
  userRole: string,
  gameSlug: string = 'eafc26',
  channelFilter: string = 'ALL'
) {
  try {
    const actor = await requireServerActor();
    const threads = await getChatThreadsService(actor.userId, actor.role, gameSlug, channelFilter);
    return { success: true, data: threads };
  } catch (error: unknown) {
    console.error('Error en getChatThreadsAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al obtener conversaciones.'), data: [] };
  }
}

export async function getThreadMessagesAction(threadId: string) {
  try {
    await requireThreadParticipant(threadId);
    const messages = await getThreadMessagesService(threadId);
    return { success: true, data: messages };
  } catch (error: unknown) {
    console.error('Error en getThreadMessagesAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al obtener mensajes.'), data: [] };
  }
}

export async function sendChatMessageAction(
  threadId: string,
  senderId: string,
  senderName: string,
  senderRole: string,
  text: string
) {
  try {
    if (!threadId || !senderId || !text.trim()) {
      return { success: false, error: 'Parámetros requeridos incompletos.' };
    }

    const actor = await requireThreadParticipant(threadId);
    const session = await getServerUserSession();
    const rateLimit = await consumeSecurityRateLimit('chat-message', actor.userId, 30, 60 * 1_000);
    if (!rateLimit.allowed) {
      return { success: false, error: `Demasiados mensajes. Reintenta en ${rateLimit.retryAfter} segundos.` };
    }

    const res = await sendChatMessageService(threadId, actor.userId, session?.name || 'Usuario', actor.role, text);
    if (res.success) {
      revalidatePath('/mensajes');
      revalidatePath('/dashboard/moderacion');
    }
    return res;
  } catch (error: unknown) {
    console.error('Error en sendChatMessageAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al enviar mensaje.') };
  }
}

export async function createOrGetDirectThreadAction(
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
    const actor = await requireServerActor();
    const session = await getServerUserSession();
    if (channelType === 'ANUNCIO_ADMIN' && actor.role !== 'Administrador') {
      return { success: false, error: 'Solo Administración puede crear anuncios globales.' };
    }
    if (channelType === 'SOPORTE_ORGANIZADOR' && !['Administrador', 'Organizador'].includes(actor.role)) {
      return { success: false, error: 'No tienes permiso para crear este canal.' };
    }
    const target = await dbProvider.users.findById(targetUserId);
    if (!target) return { success: false, error: 'Usuario destino no encontrado.' };

    const res = await createOrGetDirectThreadService(
      actor.userId,
      session?.name || 'Usuario',
      actor.role,
      target.id,
      target.name,
      target.role,
      gameSlug,
      channelType,
      title
    );
    if (res.success) {
      revalidatePath('/mensajes');
      revalidatePath('/dashboard/moderacion');
    }
    return res;
  } catch (error: unknown) {
    console.error('Error en createOrGetDirectThreadAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al iniciar chat.') };
  }
}

export async function getUsersByRoleAction(role: string) {
  try {
    await requireServerActor();
    const users = await getUsersByRoleService(role);
    return { success: true, data: users };
  } catch (error: unknown) {
    console.error('Error en getUsersByRoleAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al consultar usuarios por rol.'), data: [] };
  }
}

export async function banUserFromChatAction(targetUserId: string, reason?: string) {
  try {
    const actor = await requireServerActor(['Administrador', 'Organizador']);
    const target = await dbProvider.users.findById(targetUserId);
    if (target && actor.role === 'Organizador') {
      if (target.role === 'Administrador' || target.role === 'Organizador') {
        return { success: false, error: 'Los organizadores no pueden sancionar a otros organizadores o administradores.' };
      }
    }

    const res = await banUserFromChatService(targetUserId, reason);
    if (res.success) {
      await revokeUserSessions(targetUserId);
      await writeSecurityAudit({
        actor,
        action: 'CHAT_USER_BANNED',
        resourceType: 'user',
        resourceId: targetUserId,
        metadata: { reason },
      });
      revalidatePath('/mensajes');
      revalidatePath('/dashboard/moderacion');
    }
    return res;
  } catch (error: unknown) {
    console.error('Error en banUserFromChatAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al banear usuario.') };
  }
}

export async function unbanUserFromChatAction(targetUserId: string) {
  try {
    const actor = await requireServerActor(['Administrador', 'Organizador']);
    const target = await dbProvider.users.findById(targetUserId);
    if (target && actor.role === 'Organizador') {
      if (target.role === 'Administrador' || target.role === 'Organizador') {
        return { success: false, error: 'No tienes permisos para modificar sanciones de este usuario.' };
      }
    }

    const res = await unbanUserFromChatService(targetUserId);
    if (res.success) {
      await writeSecurityAudit({
        actor,
        action: 'CHAT_USER_UNBANNED',
        resourceType: 'user',
        resourceId: targetUserId,
      });
      revalidatePath('/mensajes');
      revalidatePath('/dashboard/moderacion');
    }
    return res;
  } catch (error: unknown) {
    console.error('Error en unbanUserFromChatAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al desbanear usuario.') };
  }
}

export async function checkUserBanStatusAction(userId: string) {
  try {
    await requireUserManager(userId);
    const res = await checkUserBanStatusService(userId);
    return { success: true, data: res };
  } catch (error: unknown) {
    console.error('Error en checkUserBanStatusAction:', error);
    return { success: false, data: { isBanned: false, reason: null } };
  }
}

export async function updateTypingStatusAction(threadId: string, userId: string, userName: string) {
  void userId;
  void userName;
  const actor = await requireThreadParticipant(threadId);
  const session = await getServerUserSession();
  return await updateTypingStatusService(threadId, actor.userId, session?.name || 'Usuario');
}

export async function clearTypingStatusAction(threadId: string, userId: string) {
  void userId;
  const actor = await requireThreadParticipant(threadId);
  return await clearTypingStatusService(threadId, actor.userId);
}

export async function getTypingUsersAction(threadId: string, currentUserId: string) {
  void currentUserId;
  const actor = await requireThreadParticipant(threadId);
  const users = await getTypingUsersService(threadId, actor.userId);
  return { success: true, data: users };
}

export async function reportChatMessageAction(params: {
  threadId: string;
  messageId: string;
  messageText: string;
  reportedUserId: string;
  reportedUserName: string;
  reason: string;
  details?: string;
}) {
  try {
    const actor = await requireServerActor();
    const session = await getServerUserSession();
    await requireThreadParticipant(params.threadId);

    const rateLimit = await consumeSecurityRateLimit('report-chat-message', actor.userId, 10, 60 * 1_000);
    if (!rateLimit.allowed) {
      return { success: false, error: `Demasiados reportes. Reintenta en ${rateLimit.retryAfter} segundos.` };
    }

    const res = await reportChatMessageService({
      reporterId: actor.userId,
      reporterName: session?.name || 'Usuario',
      reporterRole: actor.role,
      reportedUserId: params.reportedUserId,
      reportedUserName: params.reportedUserName,
      threadId: params.threadId,
      messageId: params.messageId,
      messageText: params.messageText,
      reason: params.reason,
      details: params.details,
    });

    if (res.success) {
      revalidatePath('/dashboard/moderacion');
    }

    return res;
  } catch (error: unknown) {
    console.error('Error en reportChatMessageAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al enviar reporte.') };
  }
}

export async function getChatReportsAction(statusFilter?: string) {
  try {
    await requireServerActor(['Administrador', 'Organizador']);
    const reports = await getChatReportsService(statusFilter);
    return { success: true, data: reports };
  } catch (error: unknown) {
    console.error('Error en getChatReportsAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al obtener reportes.'), data: [] };
  }
}

export async function resolveChatReportAction(
  reportId: string,
  status: 'Sancionado' | 'Descartado',
  moderatorNotes?: string
) {
  try {
    const actor = await requireServerActor(['Administrador', 'Organizador']);
    const session = await getServerUserSession();
    const res = await resolveChatReportService(
      reportId,
      status,
      moderatorNotes,
      session?.name || actor.role
    );

    if (res.success) {
      await writeSecurityAudit({
        actor,
        action: status === 'Sancionado' ? 'CHAT_REPORT_SANCTIONED' : 'CHAT_REPORT_DISMISSED',
        resourceType: 'chat_report',
        resourceId: reportId,
        metadata: { status, moderatorNotes },
      });
      revalidatePath('/dashboard/moderacion');
    }

    return res;
  } catch (error: unknown) {
    console.error('Error en resolveChatReportAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al resolver reporte.') };
  }
}

export async function getUserChatHistoryAction(targetUserId: string) {
  try {
    await requireServerActor(['Administrador', 'Organizador']);
    const history = await getUserChatHistoryService(targetUserId);
    if (!history) {
      return { success: false, error: 'Usuario no encontrado o sin historial.' };
    }
    return { success: true, data: history };
  } catch (error: unknown) {
    console.error('Error en getUserChatHistoryAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al obtener historial de chat.') };
  }
}

