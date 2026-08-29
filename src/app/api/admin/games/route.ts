import { NextResponse } from 'next/server';
import { dbProvider } from '@/lib/db/provider';
import { getServerUserSession } from '@/lib/auth-server';

export async function GET() {
  try {
    const session = await getServerUserSession();
    if (!session || (session.role !== 'Administrador' && session.role !== 'Admin' && session.role !== 'Organizador')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const games = await dbProvider.games.findAll({ orderBy: 'createdAt', orderDirection: 'DESC' });
    const formattedGames = games.map(g => ({
      slug: g.slug,
      name: g.name,
      category: g.category,
      team_size: g.teamSize,
      positions_json: g.positionsJson,
      brand_color: g.brandColor,
      stats_schema: g.statsSchema,
      created_at: g.createdAt,
    }));
    return NextResponse.json({ games: formattedGames });
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

    const existing = await dbProvider.games.findById(slug);
    const params = {
      name, 
      category: category || 'eSports', 
      teamSize: team_size || 5, 
      positionsJson: positions_json ? (typeof positions_json === 'string' ? positions_json : JSON.stringify(positions_json)) : null, 
      brandColor: brand_color || '#FFFFFF',
      statsSchema: stats_schema ? (typeof stats_schema === 'string' ? stats_schema : JSON.stringify(stats_schema)) : null
    };

    if (existing) {
      await dbProvider.games.update(slug, params);
    } else {
      await dbProvider.games.create({ slug, ...params });
    }

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

    await dbProvider.games.delete(slug);
    return NextResponse.json({ success: true, message: 'Juego eliminado' });
  } catch (error: any) {
    console.error('DELETE /api/admin/games error:', error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
       return NextResponse.json({ error: 'No se puede eliminar la disciplina porque tiene equipos, jugadores o torneos asociados.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al eliminar. Asegúrese de que no tenga datos dependientes.' }, { status: 500 });
  }
}
