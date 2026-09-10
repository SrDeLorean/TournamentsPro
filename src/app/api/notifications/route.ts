import { NextResponse } from 'next/server';
import { getServerUserSession } from '@/lib/auth-server';
import {
  getUserNotificationsService,
  markNotificationAsReadService,
  markAllNotificationsAsReadService,
} from '@/lib/services';

export async function GET() {
  try {
    const session = await getServerUserSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const result = await getUserNotificationsService(session.userId);
    return NextResponse.json({
      success: true,
      notifications: result.notifications,
      unreadCount: result.unreadCount,
    });
  } catch (error: any) {
    console.error('Error en GET /api/notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener notificaciones' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerUserSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { id, markAll } = body;

    if (markAll) {
      const success = await markAllNotificationsAsReadService(session.userId);
      return NextResponse.json({ success, message: 'Todas las notificaciones marcadas como leídas' });
    }

    if (id) {
      const success = await markNotificationAsReadService(id, session.userId);
      return NextResponse.json({ success, message: 'Notificación marcada como leída' });
    }

    return NextResponse.json(
      { error: 'Debe especificar el id o markAll: true' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error en PATCH /api/notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar notificaciones' },
      { status: 500 }
    );
  }
}
