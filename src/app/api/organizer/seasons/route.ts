import { NextResponse } from 'next/server';
import { dbProvider } from '@/lib/db/provider';
import { authorizationErrorResponse, requireRequestActor } from '@/lib/auth-server';
import { canManageOrganization, isAdministrator } from '@/lib/authorization';
import { writeSecurityAudit } from '@/lib/security';
import { organizerSeasonBodySchema } from '@/lib/api-schemas';

interface SeasonRow extends Record<string, unknown> {
  id: string;
}

interface TournamentRow extends Record<string, unknown> {
  season_id: string | null;
}

// GET /api/organizer/seasons - List seasons with tournaments
export async function GET(request: Request) {
  try {
    const actor = await requireRequestActor(request, ['Administrador', 'Organizador']);
    const { searchParams } = new URL(request.url);
    const requestedOrgId = searchParams.get('organizationId');
    const orgId = isAdministrator(actor) ? requestedOrgId : actor.organizationId;

    const seasonsOptions: any = {};
    if (orgId) {
      seasonsOptions.where = { organizationId: orgId };
    }
    
    const seasonsRaw = await dbProvider.seasons.findAll(seasonsOptions);
    // Para mantener compatibilidad con las propiedades snake_case si el cliente las esperaba
    const seasons = seasonsRaw.map(s => ({ ...s, organization_id: s.organizationId, start_date: s.startDate, end_date: s.endDate, created_at: s.createdAt }));

    const tournamentsRaw = isAdministrator(actor)
      ? await dbProvider.competitions.findAll()
      : await dbProvider.competitions.findByOrganization(actor.organizationId!);
    
    const tournaments = tournamentsRaw.map(t => ({ ...t, season_id: t.seasonId, organization_id: t.organizationId, created_at: t.createdAt }));

    // Attach tournaments to their season
    const seasonsWithTournaments = seasons.map((s) => ({
      ...s,
      tournaments: tournaments.filter((t) => t.season_id === s.id),
    }));

    return NextResponse.json({ success: true, seasons: seasonsWithTournaments, tournaments });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) || 'Error consultando temporadas' }, { status: 500 });
  }
}

// POST /api/organizer/seasons - Create Season
export async function POST(request: Request) {
  try {
    const actor = await requireRequestActor(request, ['Administrador', 'Organizador']);
    const parsedBody = organizerSeasonBodySchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Nombre de la temporada requerido' }, { status: 400 });
    }
    const body = parsedBody.data;
    const { name, organizationId, startDate, endDate, status } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nombre de la temporada requerido' }, { status: 400 });
      return NextResponse.json({ error: 'Nombre de la temporada requerido' }, { status: 400 });
    }

    const targetOrganizationId = isAdministrator(actor) ? (organizationId || null) : actor.organizationId;
    if (!isAdministrator(actor) && (!targetOrganizationId || !canManageOrganization(actor, targetOrganizationId))) {
      return NextResponse.json({ error: 'No tienes permisos para crear temporadas en esta Organización' }, { status: 403 });
    }

    const season = await dbProvider.seasons.create({
      name,
      organizationId: targetOrganizationId,
      startDate: startDate || null,
      endDate: endDate || null,
      status: status || 'Activa'
    });
    
    const seasonId = season.id;

    await writeSecurityAudit({
      actor,
      request,
      action: 'SEASON_CREATED',
      resourceType: 'season',
      resourceId: seasonId,
      organizationId: targetOrganizationId,
      metadata: { status: status || 'Activa' },
    });

    return NextResponse.json({ success: true, message: 'Temporada creada exitosamente', seasonId });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) || 'Error creando temporada' }, { status: 500 });
  }
}

