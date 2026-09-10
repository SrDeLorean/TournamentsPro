import { dbProvider } from '@/lib/db/provider';
import type { Notification } from '@/lib/db/interfaces';

export interface CreateNotificationInput {
  userId: string;
  type: 'TRANSFER' | 'MATCH' | 'TOURNAMENT' | 'SYSTEM';
  title: string;
  description: string;
  actionUrl?: string | null;
}

/**
 * Servicio para emitir una nueva notificación a un usuario
 */
export async function createNotificationService(input: CreateNotificationInput): Promise<Notification | null> {
  try {
    if (!input.userId || !input.title || !input.description) {
      console.warn('Faltan campos requeridos para crear notificación:', input);
      return null;
    }

    return await dbProvider.notifications.create({
      userId: input.userId,
      type: input.type || 'SYSTEM',
      title: input.title.trim(),
      description: input.description.trim(),
      actionUrl: input.actionUrl || null,
      isRead: false,
    });
  } catch (err) {
    console.error('Error en createNotificationService:', err);
    return null;
  }
}

/**
 * Obtener las notificaciones del usuario con conteo de no leídas
 */
export async function getUserNotificationsService(
  userId: string,
  limit = 25
): Promise<{ notifications: Notification[]; unreadCount: number }> {
  try {
    if (!userId) return { notifications: [], unreadCount: 0 };

    const notifications = await dbProvider.notifications.findByUser(userId, { limit });
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return {
      notifications,
      unreadCount,
    };
  } catch (err) {
    console.error('Error en getUserNotificationsService:', err);
    return { notifications: [], unreadCount: 0 };
  }
}

/**
 * Marcar una notificación individual como leída
 */
export async function markNotificationAsReadService(id: string, userId: string): Promise<boolean> {
  try {
    return await dbProvider.notifications.markAsRead(id, userId);
  } catch (err) {
    console.error('Error en markNotificationAsReadService:', err);
    return false;
  }
}

/**
 * Marcar todas las notificaciones del usuario como leídas
 */
export async function markAllNotificationsAsReadService(userId: string): Promise<boolean> {
  try {
    return await dbProvider.notifications.markAllAsRead(userId);
  } catch (err) {
    console.error('Error en markAllNotificationsAsReadService:', err);
    return false;
  }
}

/**
 * Eliminar una notificación
 */
export async function deleteNotificationService(id: string, userId: string): Promise<boolean> {
  try {
    return await dbProvider.notifications.deleteByUser(id, userId);
  } catch (err) {
    console.error('Error en deleteNotificationService:', err);
    return false;
  }
}
