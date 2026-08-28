import { NextResponse } from 'next/server';
import { queryDB, executeCommand } from '@/lib/db/provider';
import { getServerUserSession } from '@/lib/auth-server';

export async function GET() {
  try {
    const session = await getServerUserSession();
    if (!session || (session.role !== 'Administrador' && session.role !== 'Admin' && session.role !== 'Organizador')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const games = await queryDB('SELECT * FROM games ORDER BY created_at DESC');
    return NextResponse.json({ games });
  } catch (error) {
    console.error('GET /api/admin/games error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerUserSession();
    if (!session || (session.role !== 'Administrador' && session.role !== 'Admin')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { slug, name, category, team_size, positions_json, brand_color, stats_schema } = data;

    if (!slug || !name) {
      return NextResponse.json({ error: 'Slug y nombre son obligatorios' }, { status: 400 });
    }

    await executeCommand(`
      INSERT INTO games (slug, name, category, team_size, positions_json, brand_color, stats_schema)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        name = VALUES(name),
        category = VALUES(category),
        brand_color = VALUES(brand_color),
        stats_schema = VALUES(stats_schema)
    `, [
      slug, 
      name, 
      category || 'eSports', 
      team_size || 5, 
      positions_json ? JSON.stringify(positions_json) : null, 
      brand_color || '#FFFFFF',
      stats_schema ? JSON.stringify(stats_schema) : null
    ]);

    return NextResponse.json({ success: true, message: 'Juego guardado exitosamente' });
  } catch (error: any) {
    console.error('POST /api/admin/games error:', error);
    return NextResponse.json({ error: 'Error interno del servidor al guardar.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerUserSession();
    if (!session || (session.role !== 'Administrador' && session.role !== 'Admin')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Slug es requerido' }, { status: 400 });
    }

    await executeCommand('DELETE FROM games WHERE slug = ?', [slug]);
    return NextResponse.json({ success: true, message: 'Juego eliminado' });
  } catch (error: any) {
    console.error('DELETE /api/admin/games error:', error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
       return NextResponse.json({ error: 'No se puede eliminar la disciplina porque tiene equipos, jugadores o torneos asociados.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al eliminar. Asegúrese de que no tenga datos dependientes.' }, { status: 500 });
  }
}

