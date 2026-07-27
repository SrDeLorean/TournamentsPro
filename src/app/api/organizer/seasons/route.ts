import { NextResponse } from 'next/server';
import { queryDB } from '@/lib/db';

// GET /api/organizer/seasons - List seasons with tournaments
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organizationId');

    let sql = `SELECT * FROM seasons WHERE 1=1`;
    const params: any[] = [];

    if (orgId) {
      sql += ` AND organization_id = ?`;
      params.push(orgId);
    }

    sql += ` ORDER BY created_at DESC`;

    const seasons = await queryDB<any>(sql, params);
    const tournaments = await queryDB<any>(`SELECT * FROM tournaments ORDER BY created_at DESC`);

    // Attach tournaments to their season
    const seasonsWithTournaments = seasons.map((s) => ({
      ...s,
      tournaments: tournaments.filter((t) => t.season_id === s.id),
    }));

    return NextResponse.json({ success: true, seasons: seasonsWithTournaments, tournaments });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error consultando temporadas' }, { status: 500 });
  }
}

// POST /api/organizer/seasons - Create Season
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, organizationId, startDate, endDate, status } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nombre de la temporada requerido' }, { status: 400 });
    }

    const seasonId = `season-${Date.now()}`;

    await queryDB(
      `INSERT INTO seasons (id, name, organization_id, start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [seasonId, name, organizationId || null, startDate || null, endDate || null, status || 'Activa']
    );

    return NextResponse.json({ success: true, message: 'Temporada creada exitosamente', seasonId });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error creando temporada' }, { status: 500 });
  }
}
