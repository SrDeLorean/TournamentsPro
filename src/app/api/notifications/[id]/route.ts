import { NextResponse } from 'next/server';
import { getServerUserSession } from '@/lib/auth-server';
import { deleteNotificationService } from '@/lib/services';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerUserSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID de notificación requerido' }, { status: 400 });
    }

    const success = await deleteNotificationService(id, session.userId);
    return NextResponse.json({ success, message: 'Notificación eliminada' });
  } catch (error: any) {
    console.error('Error en DELETE /api/notifications/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar notificación' },
      { status: 500 }
    );
  }
}
