import { NextResponse } from 'next/server';
import { queryDB } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameSlug = searchParams.get('gameSlug');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const organizationName = searchParams.get('organizationName');
    const organizationId = searchParams.get('organizationId');
    const tournamentName = searchParams.get('tournamentName');
    const tournamentId = searchParams.get('tournamentId');
    const date = searchParams.get('date');

    let query = `
      SELECT m.*,
             COALESCE(th.name, m.home_team_name, 'Equipo Local') as home_team_name,
             COALESCE(th.tag, UPPER(LEFT(COALESCE(th.name, m.home_team_name, 'LOC'), 3))) as home_team_tag,
             COALESCE(ta.name, m.away_team_name, 'Equipo Visitante') as away_team_name,
             COALESCE(ta.tag, UPPER(LEFT(COALESCE(ta.name, m.away_team_name, 'VIS'), 3))) as away_team_tag,
             COALESCE(c.name, m.tournament_id, 'Competencia BD') as tournament_name,
             COALESCE(c.game_slug, 'eafc26') as game_slug,
             COALESCE(o.name, u_org.name, o2.name, o3.name, 'Organización Oficial') as organization_name,
             COALESCE(o.tag, u_org.tag, o2.tag, o3.tag, 'ORG') as organization_tag
      FROM matches m
      LEFT JOIN competitions c ON (m.competition_id = c.id OR m.tournament_id = c.id)
      LEFT JOIN teams th ON (m.team_home_id = th.id OR m.home_team_id = th.id)
      LEFT JOIN teams ta ON (m.team_away_id = ta.id OR m.away_team_id = ta.id)
      LEFT JOIN users u ON (c.organizer_id = u.id)
      LEFT JOIN organizations o ON (c.organization_id = o.id)
      LEFT JOIN organizations u_org ON (u.organization_id = u_org.id)
      LEFT JOIN organizations o2 ON (th.organization_id = o2.id OR ta.organization_id = o2.id)
      LEFT JOIN organizations o3 ON (o3.owner_id = u.id)
      WHERE 1=1
    `;
    const params: any[] = [];

    if (gameSlug && gameSlug !== 'ALL' && gameSlug !== 'TODOS') {
      query += ` AND (c.game_slug = ? OR c.game_slug IS NULL)`;
      params.push(gameSlug);
    }

    if (status && status !== 'TODOS') {
      const dbStatus = status === 'PROXIMOS' ? 'PENDIENTE' : status === 'FINALIZADOS' ? 'FINALIZADO' : status;
      query += ` AND (m.status = ? OR m.status = ?)`;
      params.push(status, dbStatus);
    }

    if (organizationId && organizationId !== 'TODAS') {
      query += ` AND (o.id = ? OR o2.id = ? OR o3.id = ?)`;
      params.push(organizationId, organizationId, organizationId);
    }

    if (organizationName && organizationName !== 'TODAS') {
      query += ` AND (o.name LIKE ? OR o2.name LIKE ? OR o3.name LIKE ? OR o.tag LIKE ? OR o2.tag LIKE ? OR o3.tag LIKE ?)`;
      const orgLike = `%${organizationName}%`;
      params.push(orgLike, orgLike, orgLike, orgLike, orgLike, orgLike);
    }

    if (tournamentId && tournamentId !== 'TODAS') {
      query += ` AND (c.id = ? OR m.competition_id = ? OR m.tournament_id = ?)`;
      params.push(tournamentId, tournamentId, tournamentId);
    }

    if (tournamentName && tournamentName !== 'TODAS') {
      query += ` AND (c.name LIKE ? OR m.tournament_id LIKE ?)`;
      const tLike = `%${tournamentName}%`;
      params.push(tLike, tLike);
    }

    if (date) {
      query += ` AND DATE(m.scheduled_at) = DATE(?)`;
      params.push(date);
    }

    if (search) {
      query += ` AND (
        COALESCE(th.name, m.home_team_name) LIKE ? OR
        COALESCE(ta.name, m.away_team_name) LIKE ? OR
        c.name LIKE ? OR
        o.name LIKE ? OR
        m.id LIKE ?
      )`;
      const searchLike = `%${search}%`;
      params.push(searchLike, searchLike, searchLike, searchLike, searchLike);
    }

    query += ` ORDER BY m.scheduled_at DESC, m.matchday ASC`;

    const matches = await queryDB<any>(query, params);

    return NextResponse.json({ success: true, matches: matches || [] });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, matches: [], error: error instanceof Error ? error.message : 'Error consultando partidos de BD' }, { status: 500 });
  }
}
