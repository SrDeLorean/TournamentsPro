import { NextResponse } from 'next/server';
import { queryDB } from '@/lib/db';
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

    let sql = `SELECT * FROM seasons WHERE 1=1`;
    const params: (string | number | null)[] = [];

    if (orgId) {
      sql += ` AND organization_id = ?`;
      params.push(orgId);
    }

    sql += ` ORDER BY created_at DESC`;

    const seasons = await queryDB<SeasonRow>(sql, params);
    const tournaments = isAdministrator(actor)
      ? await queryDB<TournamentRow>(`SELECT * FROM tournaments ORDER BY created_at DESC`)
      : await queryDB<TournamentRow>(
          `SELECT t.* FROM tournaments t
             JOIN seasons s ON s.id = t.season_id
            WHERE s.organization_id = ?
            ORDER BY t.created_at DESC`,
          [actor.organizationId],
        );

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
    }

    const targetOrganizationId = isAdministrator(actor) ? (organizationId || null) : actor.organizationId;
    if (!isAdministrator(actor) && (!targetOrganizationId || !canManageOrganization(actor, targetOrganizationId))) {
      return NextResponse.json({ error: 'No tienes permisos para crear temporadas en esta Organización' }, { status: 403 });
    }

    const seasonId = `season-${Date.now()}`;

    await queryDB(
      `INSERT INTO seasons (id, name, organization_id, start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [seasonId, name, targetOrganizationId, startDate || null, endDate || null, status || 'Activa']
    );

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
