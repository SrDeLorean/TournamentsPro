import { NextResponse } from 'next/server';
import {
  authorizationErrorResponse,
  getServerUserSession,
  requireRequestActor,
} from '@/lib/auth-server';
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
  } catch (error: unknown) {
    console.error('Error en GET /api/notifications:', error);
    return NextResponse.json(
      { error: 'Error al obtener notificaciones' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireRequestActor(request);

    const body = await request.json().catch(() => ({}));
    const { id, markAll } = body;

    if (markAll) {
      const success = await markAllNotificationsAsReadService(actor.userId);
      return NextResponse.json({ success, message: 'Todas las notificaciones marcadas como leídas' });
    }

    if (id) {
      const success = await markNotificationAsReadService(id, actor.userId);
      return NextResponse.json({ success, message: 'Notificación marcada como leída' });
    }

    return NextResponse.json(
      { error: 'Debe especificar el id o markAll: true' },
      { status: 400 }
    );
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Error en PATCH /api/notifications:', error);
    return NextResponse.json(
      { error: 'Error al actualizar notificaciones' },
      { status: 500 }
    );
  }
}
