import { NextResponse } from 'next/server';


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

    const { dbProvider } = await import('@/lib/db/provider');
    const matchesData = await dbProvider.matches.findAll({ orderBy: 'scheduled_at', orderDirection: 'DESC' });
    
    // We need to fetch related data to mimic the JOINs
    const competitions = await dbProvider.competitions.findAll();
    const teams = await dbProvider.teams.findAll();
    const users = await dbProvider.users.findAll();
    const organizations = await dbProvider.organizations.findAll();
    
    let allMatches = matchesData.map((m: any) => {
      const comp = competitions.find(c => c.id === m.competitionId);
      const th = teams.find(t => t.id === m.teamHomeId || t.id === m.homeTeamId);
      const ta = teams.find(t => t.id === m.teamAwayId || t.id === m.awayTeamId);
      const u = comp ? users.find(user => user.id === comp.organizerId) : null;
      const o = comp ? organizations.find(org => org.id === comp.organizationId) : null;
      const u_org = u ? organizations.find(org => org.id === u.organizationId) : null;
      const o2 = th || ta ? organizations.find(org => org.id === th?.organizationId || org.id === ta?.organizationId) : null;
      const o3 = u ? organizations.find(org => org.ownerId === u.id) : null;

      const c_name = comp?.name || m.competitionId || 'Competencia BD';
      const c_game_slug = comp?.gameSlug || 'eafc26';
      
      const home_team_name = th?.name || m.homeTeamName || 'Equipo Local';
      const home_team_tag = th?.tag || (home_team_name.substring(0, 3).toUpperCase());
      const home_team_logo_url = th?.logoUrl || null;

      const away_team_name = ta?.name || m.awayTeamName || 'Equipo Visitante';
      const away_team_tag = ta?.tag || (away_team_name.substring(0, 3).toUpperCase());
      const away_team_logo_url = ta?.logoUrl || null;
      
      const org_name = o?.name || u_org?.name || o2?.name || o3?.name || 'Organización Oficial';
      const org_tag = o?.tag || u_org?.tag || o2?.tag || o3?.tag || 'ORG';

      return {
        ...m,
        id: m.id,
        status: m.status,
        scheduled_at: m.scheduledAt,
        home_team_name,
        home_team_tag,
        home_team_logo_url,
        away_team_name,
        away_team_tag,
        away_team_logo_url,
        tournament_name: c_name,
        game_slug: c_game_slug,
        organization_name: org_name,
        organization_tag: org_tag,
        // include refs for filtering
        _c_game_slug: c_game_slug,
        _o_id: o?.id || o2?.id || o3?.id,
        _o_name: o?.name,
        _o2_name: o2?.name,
        _o3_name: o3?.name,
        _o_tag: o?.tag,
        _o2_tag: o2?.tag,
        _o3_tag: o3?.tag,
        _c_name: comp?.name,
        _th_name: th?.name,
        _ta_name: ta?.name
      };
    });

    // Apply filters
    if (gameSlug && gameSlug !== 'ALL' && gameSlug !== 'TODOS') {
      allMatches = allMatches.filter(m => m._c_game_slug === gameSlug || !m._c_game_slug);
    }

    if (status && status !== 'TODOS') {
      const dbStatus = status === 'PROXIMOS' ? 'PENDIENTE' : status === 'FINALIZADOS' ? 'FINALIZADO' : status;
      allMatches = allMatches.filter(m => m.status === status || m.status === dbStatus);
    }

    if (organizationId && organizationId !== 'TODAS') {
      allMatches = allMatches.filter(m => m._o_id === organizationId);
    }

    if (organizationName && organizationName !== 'TODAS') {
      const orgLike = organizationName.toLowerCase();
      allMatches = allMatches.filter(m => 
        (m._o_name?.toLowerCase().includes(orgLike)) ||
        (m._o2_name?.toLowerCase().includes(orgLike)) ||
        (m._o3_name?.toLowerCase().includes(orgLike)) ||
        (m._o_tag?.toLowerCase().includes(orgLike)) ||
        (m._o2_tag?.toLowerCase().includes(orgLike)) ||
        (m._o3_tag?.toLowerCase().includes(orgLike))
      );
    }

    if (tournamentId && tournamentId !== 'TODAS') {
      allMatches = allMatches.filter(m => m.competitionId === tournamentId);
    }

    if (tournamentName && tournamentName !== 'TODAS') {
      const tLike = tournamentName.toLowerCase();
      allMatches = allMatches.filter(m => m._c_name?.toLowerCase().includes(tLike));
    }

    if (date) {
      allMatches = allMatches.filter(m => {
        if (!m.scheduled_at) return false;
        return m.scheduled_at.startsWith(date);
      });
    }

    if (search) {
      const searchLike = search.toLowerCase();
      allMatches = allMatches.filter(m => 
        (m.home_team_name?.toLowerCase().includes(searchLike)) ||
        (m.away_team_name?.toLowerCase().includes(searchLike)) ||
        (m._c_name?.toLowerCase().includes(searchLike)) ||
        (m._o_name?.toLowerCase().includes(searchLike)) ||
        (m.id.toLowerCase().includes(searchLike))
      );
    }

    // Clean up internal fields
    allMatches.forEach(m => {
      delete m._c_game_slug; delete m._o_id; delete m._o_name; delete m._o2_name; delete m._o3_name;
      delete m._o_tag; delete m._o2_tag; delete m._o3_tag; delete m._c_name; delete m._th_name; delete m._ta_name;
    });

    // In JS we need to sort it manually if we changed the structure
    allMatches.sort((a, b) => {
      const dateA = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
      const dateB = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
      if (dateB !== dateA) return dateB - dateA; // DESC
      return (a.matchday || 0) - (b.matchday || 0); // ASC
    });

    return NextResponse.json({ success: true, matches: allMatches });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, matches: [], error: error instanceof Error ? error.message : 'Error consultando partidos de BD' }, { status: 500 });
  }
}

