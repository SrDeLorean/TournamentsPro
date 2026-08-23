'use server';

import { revalidatePath } from 'next/cache';
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

export async function getChatThreadsAction(
  userId: string,
  userRole: string,
  gameSlug: string = 'eafc26',
  channelFilter: string = 'ALL'
) {
  try {
    const threads = await getChatThreadsService(userId, userRole, gameSlug, channelFilter);
    return { success: true, data: threads };
  } catch (error: any) {
    console.error('Error en getChatThreadsAction:', error);
    return { success: false, error: error?.message || 'Error al obtener conversaciones.', data: [] };
  }
}

export async function getThreadMessagesAction(threadId: string) {
  try {
    const messages = await getThreadMessagesService(threadId);
    return { success: true, data: messages };
  } catch (error: any) {
    console.error('Error en getThreadMessagesAction:', error);
    return { success: false, error: error?.message || 'Error al obtener mensajes.', data: [] };
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

    const res = await sendChatMessageService(threadId, senderId, senderName, senderRole, text);
    if (res.success) {
      revalidatePath('/mensajes');
    }
    return res;
  } catch (error: any) {
    console.error('Error en sendChatMessageAction:', error);
    return { success: false, error: error?.message || 'Error al enviar mensaje.' };
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
    const res = await createOrGetDirectThreadService(
      currentUserId,
      currentUserName,
      currentUserRole,
      targetUserId,
      targetUserName,
      targetUserRole,
      gameSlug,
      channelType,
      title
    );
    if (res.success) {
      revalidatePath('/mensajes');
    }
    return res;
  } catch (error: any) {
    console.error('Error en createOrGetDirectThreadAction:', error);
    return { success: false, error: error?.message || 'Error al iniciar chat.' };
  }
}

export async function getUsersByRoleAction(role: string) {
  try {
    const users = await getUsersByRoleService(role);
    return { success: true, data: users };
  } catch (error: any) {
    console.error('Error en getUsersByRoleAction:', error);
    return { success: false, error: error?.message || 'Error al consultar usuarios por rol.', data: [] };
  }
}

export async function banUserFromChatAction(targetUserId: string, reason?: string) {
  try {
    const res = await banUserFromChatService(targetUserId, reason);
    if (res.success) {
      revalidatePath('/mensajes');
    }
    return res;
  } catch (error: any) {
    console.error('Error en banUserFromChatAction:', error);
    return { success: false, error: error?.message || 'Error al banear usuario.' };
  }
}

export async function unbanUserFromChatAction(targetUserId: string) {
  try {
    const res = await unbanUserFromChatService(targetUserId);
    if (res.success) {
      revalidatePath('/mensajes');
    }
    return res;
  } catch (error: any) {
    console.error('Error en unbanUserFromChatAction:', error);
    return { success: false, error: error?.message || 'Error al desbanear usuario.' };
  }
}

export async function checkUserBanStatusAction(userId: string) {
  try {
    const res = await checkUserBanStatusService(userId);
    return { success: true, data: res };
  } catch (error: any) {
    console.error('Error en checkUserBanStatusAction:', error);
    return { success: false, data: { isBanned: false, reason: null } };
  }
}

export async function updateTypingStatusAction(threadId: string, userId: string, userName: string) {
  return await updateTypingStatusService(threadId, userId, userName);
}

export async function clearTypingStatusAction(threadId: string, userId: string) {
  return await clearTypingStatusService(threadId, userId);
}

export async function getTypingUsersAction(threadId: string, currentUserId: string) {
  const users = await getTypingUsersService(threadId, currentUserId);
  return { success: true, data: users };
}
