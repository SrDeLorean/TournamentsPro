import { NextResponse } from 'next/server';
import { queryDB } from '@/lib/db';

interface TournamentListRow {
  id: string;
  name: string;
  game_slug: string;
  organizer_id: string | null;
  format: string | null;
  format_type: string | null;
  status: string;
  created_at: string;
  max_teams: number | null;
  registered_teams_count: number | null;
  organization_id: string | null;
  organization_name: string | null;
  organization_tag: string | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameSlug = searchParams.get('gameSlug');
  const organizationId = searchParams.get('organizationId');
  const organizationName = searchParams.get('organizationName');

  try {
    // Single query directly from unified 'competitions' table
    const comps = await queryDB<TournamentListRow>(`
      SELECT c.id, c.name, c.game_slug, c.organizer_id, c.mode_format as format, 
             c.format as format_type, c.status, c.created_at, c.max_teams, c.registered_teams_count,
             COALESCE(c.organization_id, u.organization_id, o.id) as organization_id,
             COALESCE(o.name, u_org.name, 'Organización Oficial') as organization_name,
             COALESCE(o.tag, u_org.tag, 'ORG') as organization_tag
      FROM competitions c
      LEFT JOIN users u ON c.organizer_id = u.id
      LEFT JOIN organizations o ON c.organization_id = o.id
      LEFT JOIN organizations u_org ON u.organization_id = u_org.id
      ORDER BY c.created_at DESC
    `);

    let allTournaments = comps;

    // Filter by game_slug
    if (gameSlug && gameSlug !== 'ALL' && gameSlug !== 'TODOS') {
      allTournaments = allTournaments.filter((t) => t.game_slug === gameSlug);
    }

    // Filter by organizationId or organizationName
    if (organizationId && organizationId !== 'TODAS') {
      allTournaments = allTournaments.filter((t) => t.organization_id === organizationId);
    }

    if (organizationName && organizationName !== 'TODAS') {
      const orgLower = organizationName.toLowerCase();
      allTournaments = allTournaments.filter(
        (t) =>
          (t.organization_name && t.organization_name.toLowerCase().includes(orgLower)) ||
          (t.organization_tag && t.organization_tag.toLowerCase().includes(orgLower))
      );
    }

    return NextResponse.json({ success: true, tournaments: allTournaments });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, tournaments: [], error: error instanceof Error ? error.message : 'Error consultando competencias de BD' },
      { status: 500 }
    );
  }
}
