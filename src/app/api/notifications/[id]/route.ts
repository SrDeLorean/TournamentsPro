import { NextResponse } from 'next/server';
import { authorizationErrorResponse, requireRequestActor } from '@/lib/auth-server';
import { deleteNotificationService } from '@/lib/services';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireRequestActor(request);

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID de notificación requerido' }, { status: 400 });
    }

    const success = await deleteNotificationService(id, actor.userId);
    return NextResponse.json({ success, message: 'Notificación eliminada' });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Error en DELETE /api/notifications/[id]:', error);
    return NextResponse.json(
      { error: 'Error al eliminar notificación' },
      { status: 500 }
    );
  }
}
