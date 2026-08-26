'use server';

import { revalidatePath } from 'next/cache';
import { queryDB } from '@/lib/db';
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
    const targets = await queryDB<{ id: string; name: string; role: string }>(
      'SELECT id, name, role FROM users WHERE id = ? LIMIT 1',
      [targetUserId],
    );
    const target = targets[0];
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
    const actor = await requireServerActor(['Administrador']);
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
    }
    return res;
  } catch (error: unknown) {
    console.error('Error en banUserFromChatAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al banear usuario.') };
  }
}

export async function unbanUserFromChatAction(targetUserId: string) {
  try {
    const actor = await requireServerActor(['Administrador']);
    const res = await unbanUserFromChatService(targetUserId);
    if (res.success) {
      await writeSecurityAudit({
        actor,
        action: 'CHAT_USER_UNBANNED',
        resourceType: 'user',
        resourceId: targetUserId,
      });
      revalidatePath('/mensajes');
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
