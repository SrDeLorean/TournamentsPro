import { NextResponse } from 'next/server';
import { queryDB } from '@/lib/db';
import { authorizationErrorResponse, requireRequestActor } from '@/lib/auth-server';
import {
  canManageOrganization,
  canManageTeam,
  isAdministrator,
  type AuthorizationActor,
} from '@/lib/authorization';
import { writeSecurityAudit } from '@/lib/security';
import { archiveManagedTeamService, createTeamService, updateManagedTeamService } from '@/lib/services';

interface AdminTeamRow extends Record<string, unknown> {
  redes_sociales: string | Record<string, unknown> | null;
  encargados_json: string | unknown[] | null;
}

async function loadTeamScope(teamId: string) {
  const teams = await queryDB<{
    id: string;
    organization_id: string | null;
    captain_id: string | null;
    encargados_json: string | null;
  }>('SELECT id, organization_id, captain_id, encargados_json FROM teams WHERE id = ? LIMIT 1', [teamId]);
  const team = teams[0];
  if (!team) return null;

  const members = await queryDB<{ user_id: string }>(
    `SELECT user_id FROM team_members
      WHERE team_id = ? AND role_in_team IN ('Capitan', 'Capitán', 'Encargado', 'DT / Analyst', 'Manager', 'Co-Capitán')`,
    [teamId],
  );
  let configuredManagers: string[] = [];
  try {
    const parsed: unknown = team.encargados_json ? JSON.parse(team.encargados_json) : [];
    if (Array.isArray(parsed)) {
      configuredManagers = parsed.flatMap((entry) => {
        if (typeof entry === 'string') return [entry];
        if (entry && typeof entry === 'object' && 'id' in entry && typeof entry.id === 'string') return [entry.id];
        return [];
      });
    }
  } catch {
    configuredManagers = [];
  }

  return {
    organizationId: team.organization_id,
    captainId: team.captain_id,
    managerIds: [...members.map((member) => member.user_id), ...configuredManagers],
  };
}

async function canAssignTeamStaff(
  actor: AuthorizationActor,
  organizationId: string | null,
  userIds: string[],
): Promise<boolean> {
  if (isAdministrator(actor) || userIds.length === 0) return true;
  if (!organizationId || organizationId !== actor.organizationId) return false;
  const uniqueIds = [...new Set(userIds)];
  const placeholders = uniqueIds.map(() => '?').join(', ');
  const users = await queryDB<{ id: string; organization_id: string | null }>(
    `SELECT id, organization_id FROM users WHERE id IN (${placeholders})`,
    uniqueIds,
  );
  return users.length === uniqueIds.length && users.every(
    (user) => user.organization_id === null || user.organization_id === organizationId,
  );
}

// GET /api/admin/teams - List teams with status & ban filters
export async function GET(request: Request) {
  try {
    const actor = await requireRequestActor(request, ['Administrador', 'Organizador']);
    const { searchParams } = new URL(request.url);
    const gameSlug = searchParams.get('gameSlug');
    const isBanned = searchParams.get('isBanned');

    let sql = `SELECT * FROM teams WHERE 1=1`;
    const params: (string | number | null)[] = [];

    if (!isAdministrator(actor)) {
      sql += ` AND organization_id = ?`;
      params.push(actor.organizationId);
    }

    if (gameSlug) {
      sql += ` AND game_slug = ?`;
      params.push(gameSlug);
    }
    if (isBanned !== null && isBanned !== undefined) {
      sql += ` AND is_banned = ?`;
      params.push(isBanned === 'true' || isBanned === '1' ? 1 : 0);
    }

    sql += ` ORDER BY created_at DESC`;
    const teams = await queryDB<AdminTeamRow>(sql, params);

    // Parse socialMedia and encargados JSON for each team
    const parsedTeams = teams.map((t) => ({
      ...t,
      socialMedia: t.redes_sociales ? (typeof t.redes_sociales === 'string' ? JSON.parse(t.redes_sociales) : t.redes_sociales) : {},
      encargados: t.encargados_json ? (typeof t.encargados_json === 'string' ? JSON.parse(t.encargados_json) : t.encargados_json) : [],
    }));

    return NextResponse.json({ success: true, teams: parsedTeams });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) || 'Error consultando equipos' }, { status: 500 });
  }
}

// POST /api/admin/teams - Create team
export async function POST(request: Request) {
  try {
    const actor = await requireRequestActor(request, ['Administrador', 'Organizador']);
    const body = await request.json();
    const {
      name,
      tag,
      gameSlug,
      organizationId,
      captainId,
      captainName,
      encargados,
      platform,
      color,
      logoText,
      description,
      status,
      clubIdEa,
      logoUrl,
      bannerUrl,
      socialMedia,
    } = body;

    if (!name || !tag) {
      return NextResponse.json({ error: 'Nombre y Tag del club requeridos' }, { status: 400 });
    }

    const targetOrganizationId = isAdministrator(actor) ? (organizationId || null) : actor.organizationId;
    if (!isAdministrator(actor) && (!targetOrganizationId || !canManageOrganization(actor, targetOrganizationId))) {
      return NextResponse.json({ error: 'No tienes permisos para crear equipos en esta Organización' }, { status: 403 });
    }

    const encargadosArray = Array.isArray(encargados) ? encargados : [];
    const staffIds = [
      captainId,
      ...encargadosArray.map((entry) => typeof entry === 'string' ? entry : entry?.id),
    ].filter((userId): userId is string => Boolean(userId));
    if (!await canAssignTeamStaff(actor, targetOrganizationId, staffIds)) {
      return NextResponse.json({ error: 'No puedes asignar responsables externos a tu Organización' }, { status: 403 });
    }
    const safeCaptainId = (captainId || actor.userId).slice(0, 36);
    const result = await createTeamService({
      name,
      tag,
      gameSlug: gameSlug || 'eafc26',
      organizationId: targetOrganizationId,
      managerIds: encargadosArray.map((entry) => typeof entry === 'string' ? entry : entry.id).filter(Boolean),
      platform: platform || 'CROSSPLAY',
      color: color || '#00FF87',
      logoText: logoText || tag,
      description: description || 'Escuadra oficial del circuito eSports.',
      status: status || 'Activo',
      clubIdEa: clubIdEa || null,
      logoUrl: logoUrl || null,
      bannerUrl: bannerUrl || null,
    }, safeCaptainId, captainName || 'Capitán Oficial');
    if (!result.success || !result.team) {
      return NextResponse.json({ error: result.error || 'No se pudo crear el equipo' }, { status: 409 });
    }
    const teamId = result.team.id;

    await writeSecurityAudit({
      actor,
      request,
      action: 'ADMIN_TEAM_CREATED',
      resourceType: 'team',
      resourceId: teamId,
      organizationId: targetOrganizationId,
      metadata: { captainId: safeCaptainId || null, managerCount: encargadosArray.length, socialMediaProvided: Boolean(socialMedia) },
    });

    return NextResponse.json({ success: true, message: 'Equipo creado exitosamente', teamId });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) || 'Error creando equipo' }, { status: 500 });
  }
}

// PUT /api/admin/teams - Ban, Unban or Update Team
export async function PUT(request: Request) {
  try {
    const actor = await requireRequestActor(request);
    const body = await request.json();
    const {
      id,
      name,
      tag,
      gameSlug,
      organizationId,
      captainId,
      captainName,
      encargados,
      platform,
      color,
      logoText,
      description,
      status,
      clubIdEa,
      logoUrl,
      bannerUrl,
      socialMedia,
      isBanned,
      banReason,
      action,
    } = body;

    const teamId = (id || '').trim().slice(0, 36);

    if (!teamId) {
      return NextResponse.json({ error: 'ID del club requerido' }, { status: 400 });
    }

    const teamScope = await loadTeamScope(teamId);
    if (!teamScope) {
      return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });
    }
    if (!canManageTeam(actor, teamScope)) {
      return NextResponse.json({ error: 'No tienes permisos para gestionar este equipo' }, { status: 403 });
    }
    if ((action === 'BAN' || action === 'UNBAN' || isBanned !== undefined || status === 'Baneado') && actor.role === 'Capitán') {
      return NextResponse.json({ error: 'Solo Administradores u Organizadores pueden aplicar sanciones' }, { status: 403 });
    }
    if (organizationId !== undefined && !isAdministrator(actor) && organizationId !== actor.organizationId) {
      return NextResponse.json({ error: 'No puedes mover el equipo fuera de tu Organización' }, { status: 403 });
    }
    const requestedStaffIds = [
      captainId,
      ...(Array.isArray(encargados) ? encargados.map((entry) => typeof entry === 'string' ? entry : entry?.id) : []),
    ].filter((userId): userId is string => Boolean(userId));
    if (!await canAssignTeamStaff(actor, teamScope.organizationId || null, requestedStaffIds)) {
      return NextResponse.json({ error: 'No puedes asignar responsables externos a tu Organización' }, { status: 403 });
    }

    if (action === 'UNBAN') {
      await queryDB('UPDATE teams SET is_banned = 0, status = "Activo", ban_reason = NULL, banned_at = NULL WHERE id = ?', [teamId]);
      await writeSecurityAudit({ actor, request, action: 'ADMIN_TEAM_UNBANNED', resourceType: 'team', resourceId: teamId, organizationId: teamScope.organizationId });
      return NextResponse.json({ success: true, message: 'Equipo desbaneado con éxito' });
    }

    if (action === 'BAN' || isBanned === 1) {
      const reason = banReason || 'Violación de normas disciplinarias';
      await queryDB('UPDATE teams SET is_banned = 1, status = "Baneado", ban_reason = ?, banned_at = NOW() WHERE id = ?', [reason, teamId]);
      await writeSecurityAudit({
        actor,
        request,
        action: 'ADMIN_TEAM_BANNED',
        resourceType: 'team',
        resourceId: teamId,
        organizationId: teamScope.organizationId,
        metadata: { reason },
      });
      return NextResponse.json({ success: true, message: 'Equipo baneado del sistema' });
    }

    const canReassignCaptain = actor.role === 'Administrador' || actor.role === 'Organizador';
    const effectiveCaptainId = canReassignCaptain ? captainId : undefined;
    const encargadosArray = Array.isArray(encargados) ? encargados : undefined;
    const result = await updateManagedTeamService(teamId, {
      name,
      tag,
      gameSlug,
      organizationId,
      captainId: effectiveCaptainId,
      captainName: canReassignCaptain ? captainName : undefined,
      managerIds: encargadosArray?.map((entry) => typeof entry === 'string' ? entry : entry.id).filter(Boolean),
      platform,
      color,
      logoText,
      description,
      status,
      clubIdEa,
      logoUrl,
      bannerUrl,
    });
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'No se pudo actualizar el equipo' }, { status: 409 });
    }

    await writeSecurityAudit({
      actor,
      request,
      action: 'ADMIN_TEAM_UPDATED',
      resourceType: 'team',
      resourceId: teamId,
      organizationId: teamScope.organizationId,
      metadata: { captainChanged: Boolean(effectiveCaptainId), managersChanged: Boolean(encargadosArray), socialMediaProvided: socialMedia !== undefined },
    });

    return NextResponse.json({ success: true, message: 'Equipo actualizado exitosamente' });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) || 'Error gestionando equipo' }, { status: 500 });
  }
}

// DELETE archives a team and preserves its history. Physical deletion is intentionally unsupported.
export async function DELETE(request: Request) {
  try {
    const actor = await requireRequestActor(request);
    const body: unknown = await request.json();
    const teamId = body && typeof body === 'object' && 'id' in body && typeof body.id === 'string'
      ? body.id.trim().slice(0, 36)
      : '';
    if (!teamId) return NextResponse.json({ error: 'ID del club requerido' }, { status: 400 });

    const teamScope = await loadTeamScope(teamId);
    if (!teamScope) return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });
    if (!canManageTeam(actor, teamScope)) {
      return NextResponse.json({ error: 'No tienes permisos para archivar este equipo' }, { status: 403 });
    }

    const result = await archiveManagedTeamService(teamId);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 409 });
    await writeSecurityAudit({
      actor,
      request,
      action: 'ADMIN_TEAM_ARCHIVED',
      resourceType: 'team',
      resourceId: teamId,
      organizationId: teamScope.organizationId,
    });
    return NextResponse.json({ success: true, message: 'Equipo archivado; su historial fue conservado.' });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error archivando equipo' }, { status: 500 });
  }
}
