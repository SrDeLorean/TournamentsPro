import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameSlug = searchParams.get('gameSlug');
  const organizationId = searchParams.get('organizationId');
  const organizationName = searchParams.get('organizationName');

  try {
    const { dbProvider } = await import('@/lib/db/provider');
    const comps = await dbProvider.competitions.findAll({ orderBy: 'created_at', orderDirection: 'DESC' });
    
    // We need to fetch users and organizations to replicate the JOIN behavior
    // Doing it sequentially here for simplicity, although it could be optimized
    const allTournaments = await Promise.all(comps.map(async (c) => {
      let orgId = c.organizationId;
      let orgName = 'Organización Oficial';
      let orgTag = 'ORG';

      if (c.organizerId) {
        const user = await dbProvider.users.findById(c.organizerId);
        if (user && user.organizationId && !orgId) {
          orgId = user.organizationId;
        }
      }

      if (orgId) {
        const org = await dbProvider.organizations.findById(orgId);
        if (org) {
          orgName = org.name;
          orgTag = org.tag;
        }
      }

      return {
        id: c.id,
        name: c.name,
        game_slug: c.gameSlug,
        organizer_id: c.organizerId,
        format: c.modeFormat,
        format_type: c.format || null,
        match_mode: c.matchMode || 'PartidoUnico',
        group_count: c.groupCount || 1,
        qualifiers_per_group: c.qualifiersPerGroup || 2,
        status: c.status,
        created_at: c.createdAt,
        max_teams: null,
        registered_teams_count: null,
        organization_id: orgId || null,
        organization_name: orgName,
        organization_tag: orgTag
      };
    }));

    let filteredTournaments = allTournaments;

    // Filter by game_slug
    if (gameSlug && gameSlug !== 'ALL' && gameSlug !== 'TODOS') {
      filteredTournaments = filteredTournaments.filter((t) => t.game_slug === gameSlug);
    }

    // Filter by organizationId or organizationName
    if (organizationId && organizationId !== 'TODAS') {
      filteredTournaments = filteredTournaments.filter((t) => t.organization_id === organizationId);
    }

    if (organizationName && organizationName !== 'TODAS') {
      const orgLower = organizationName.toLowerCase();
      filteredTournaments = filteredTournaments.filter(
        (t) =>
          (t.organization_name && t.organization_name.toLowerCase().includes(orgLower)) ||
          (t.organization_tag && t.organization_tag.toLowerCase().includes(orgLower))
      );
    }

    return NextResponse.json({ success: true, tournaments: filteredTournaments });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, tournaments: [], error: error instanceof Error ? error.message : 'Error consultando competencias de BD' },
      { status: 500 }
    );
  }
}

