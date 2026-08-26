import { NextResponse } from 'next/server';
import { queryDB } from '@/lib/db';
import { authorizationErrorResponse, requireRequestActor } from '@/lib/auth-server';
import { canCreateOrganization, canManageOrganization, isAdministrator } from '@/lib/authorization';
import { writeSecurityAudit } from '@/lib/security';
import { createManagedOrganizationService, updateManagedOrganizationService } from '@/lib/services';

interface OrganizationRow extends Record<string, unknown> {
  id: string;
  allowed_games: string | null;
  redes_sociales: string | Record<string, unknown> | null;
}

// GET /api/admin/organizations - List organizations with full details, logo, banner, prestige data & organizers
export async function GET(request: Request) {
  try {
    const actor = await requireRequestActor(request, ['Administrador', 'Organizador']);
    const orgs = await queryDB<OrganizationRow>(`
      SELECT o.*, 
             (SELECT COUNT(*) FROM users u WHERE u.organization_id = o.id AND u.role = 'Organizador') as organizers_count,
             (SELECT COUNT(*) FROM teams t WHERE t.organization_id = o.id) as teams_count
      FROM organizations o
      ${isAdministrator(actor) ? '' : 'WHERE o.id = ?'}
      ORDER BY o.name ASC
    `, isAdministrator(actor) ? [] : [actor.organizationId]);

    // Fetch organizers assigned to each organization
    const parsedOrgs = await Promise.all(
      orgs.map(async (o) => {
        let organizers: Record<string, unknown>[] = [];
        try {
          organizers = await queryDB(
            `SELECT id, name, gamertag, email, role, avatar_url, foto FROM users WHERE organization_id = ? AND role = 'Organizador'`,
            [o.id]
          );
        } catch {}

        return {
          ...o,
          allowedGames: o.allowed_games ? JSON.parse(o.allowed_games) : ['eafc26', 'valorant'],
          socialMedia: o.redes_sociales ? (typeof o.redes_sociales === 'string' ? JSON.parse(o.redes_sociales) : o.redes_sociales) : {},
          organizers,
        };
      })
    );

    return NextResponse.json({ success: true, organizations: parsedOrgs });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) || 'Error consultando organizaciones' }, { status: 500 });
  }
}

// POST /api/admin/organizations - Create organization (Admin only)
export async function POST(request: Request) {
  try {
    const actor = await requireRequestActor(request, ['Administrador']);
    const body = await request.json();
    const {
      name,
      tag,
      ownerId,
      allowedGames,
      logoUrl,
      bannerUrl,
      country,
      foundedYear,
      rating,
      website,
      socialMedia,
      organizerIds,
    } = body;

    if (!canCreateOrganization(actor)) {
      return NextResponse.json({ error: 'Solo los Administradores pueden crear Organizaciones' }, { status: 403 });
    }

    if (!name || !tag) {
      return NextResponse.json({ error: 'Nombre y Tag de la Organización requeridos' }, { status: 400 });
    }

    const result = await createManagedOrganizationService({
      name,
      tag,
      ownerId: ownerId || actor.userId,
      allowedGames,
      logoUrl,
      bannerUrl,
      country,
      foundedYear,
      rating,
      website,
      socialMedia,
      organizerIds: Array.isArray(organizerIds) ? organizerIds : [],
    });
    if (!result.success || !result.organizationId) {
      return NextResponse.json({ error: result.error || 'No se pudo crear la organización' }, { status: 409 });
    }
    const orgId = result.organizationId;

    await writeSecurityAudit({
      actor,
      request,
      action: 'ADMIN_ORGANIZATION_CREATED',
      resourceType: 'organization',
      resourceId: orgId,
      organizationId: orgId,
      metadata: { ownerId: ownerId || null, organizerCount: Array.isArray(organizerIds) ? organizerIds.length : 0 },
    });

    return NextResponse.json({ success: true, message: 'Organización creada con éxito', organizationId: orgId });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) || 'Error creando organización' }, { status: 500 });
  }
}

// PUT /api/admin/organizations - Edit organization, prestige data & assign organizers
export async function PUT(request: Request) {
  try {
    const actor = await requireRequestActor(request, ['Administrador', 'Organizador']);
    const body = await request.json();
    const {
      id,
      name,
      tag,
      ownerId,
      allowedGames,
      logoUrl,
      bannerUrl,
      country,
      foundedYear,
      rating,
      website,
      socialMedia,
      organizerIds,
      status,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de la Organización requerido' }, { status: 400 });
    }

    if (!canManageOrganization(actor, id)) {
      return NextResponse.json({ error: 'No tienes permisos para editar esta Organización' }, { status: 403 });
    }

    if (!isAdministrator(actor) && Array.isArray(organizerIds) && organizerIds.length > 0) {
      const placeholders = organizerIds.map(() => '?').join(', ');
      const organizers = await queryDB<{ id: string; role: string; organization_id: string | null }>(
        `SELECT id, role, organization_id FROM users WHERE id IN (${placeholders})`,
        organizerIds,
      );
      const invalidAssignment = organizers.length !== organizerIds.length || organizers.some(
        (organizer) => organizer.role !== 'Organizador' || (
          organizer.organization_id !== null && organizer.organization_id !== id
        ),
      );
      if (invalidAssignment) {
        return NextResponse.json({ error: 'No puedes reasignar organizadores externos' }, { status: 403 });
      }
    }

    const result = await updateManagedOrganizationService(id, {
      name,
      tag,
      ownerId: isAdministrator(actor) ? ownerId : undefined,
      allowedGames,
      logoUrl,
      bannerUrl,
      country,
      foundedYear,
      rating,
      website,
      socialMedia,
      organizerIds: Array.isArray(organizerIds) ? organizerIds : undefined,
      status,
    });
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'No se pudo actualizar la organización' }, { status: 409 });
    }

    await writeSecurityAudit({
      actor,
      request,
      action: 'ADMIN_ORGANIZATION_UPDATED',
      resourceType: 'organization',
      resourceId: id,
      organizationId: id,
      metadata: { organizerAssignmentsChanged: Array.isArray(organizerIds), status: status || undefined },
    });

    return NextResponse.json({ success: true, message: 'Organización actualizada con éxito' });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) || 'Error actualizando organización' }, { status: 500 });
  }
}
