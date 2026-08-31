import { NextResponse } from 'next/server';

import { hashPassword } from '@/lib/auth';
import { authorizationErrorResponse, requireRequestActor } from '@/lib/auth-server';
import { canAssignRole, canManageUser, isAdministrator } from '@/lib/authorization';
import { revokeUserSessions, shouldRevokeUserSessions, writeSecurityAudit } from '@/lib/security';

// GET /api/admin/users - List users with status & ban filters
export async function GET(request: Request) {
  try {
    const actor = await requireRequestActor(request, ['Administrador', 'Organizador']);
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');
    const statusFilter = searchParams.get('status');
    const isBannedFilter = searchParams.get('isBanned');
    const unassignedOrg = searchParams.get('unassignedOrg');

    const where: Record<string, unknown> = {};

    if (!isAdministrator(actor)) {
      where.organization_id = actor.organizationId;
    }

    if (roleFilter) {
      where.role = roleFilter;
    }
    if (statusFilter) {
      where.status = statusFilter;
    }
    if (unassignedOrg === 'true') {
      where.organization_id = null;
    }
    if (isBannedFilter !== null && isBannedFilter !== undefined) {
      where.is_banned = isBannedFilter === 'true' || isBannedFilter === '1';
    }

    const { dbProvider } = await import('@/lib/db/provider');
    const users = await dbProvider.users.findAll({ where, orderBy: 'created_at', orderDirection: 'DESC' });

    const safeUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      gamertag: user.gamertag,
      email: user.email,
      role: user.role,
      status: user.status,
      is_banned: user.isBanned ? 1 : 0,
      ban_reason: user.banReason,
      banned_at: user.bannedAt || user.updatedAt,
      created_at: user.createdAt,
    }));

    return NextResponse.json({ success: true, users: safeUsers });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) || 'Error consultando usuarios' }, { status: 500 });
  }
}

// POST /api/admin/users - Create user
export async function POST(request: Request) {
  try {
    const actor = await requireRequestActor(request, ['Administrador', 'Organizador']);
    const body = await request.json();
    const {
      name,
      email,
      gamertag,
      password,
      role,
      primaryGame,
      platform,
      position,
      secondaryPosition,
      status,
      rating,
      avatarUrl,
      foto,
      bannerUrl,
      biografia,
      twitter,
      instagram,
      twitch,
      discord,
      youtube,
      whatsapp,
      organizationId,
    } = body;

    const finalRole = role || 'Jugador';
    if (!canAssignRole(actor, finalRole)) {
      return NextResponse.json({ error: 'No tienes permisos para asignar ese rol' }, { status: 403 });
    }

    const targetOrganizationId = isAdministrator(actor) ? (organizationId || null) : actor.organizationId;

    if (typeof password !== 'string' || password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 10 caracteres, una letra y un número' },
        { status: 400 },
      );
    }

    const newId = `usr-${Date.now()}`;
    const userEmail = email || `${(gamertag || name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')}@tournamentspro.com`;
    const userAvatar = avatarUrl || foto || '/images/default/logo-default.png';

    const { dbProvider } = await import('@/lib/db/provider');
    await dbProvider.users.create({
      id: newId,
      name: name || gamertag,
      email: userEmail,
      passwordHash: await hashPassword(password),
      gamertag: gamertag || name,
      role: finalRole,
      primaryGameSlug: primaryGame || 'eafc26',
      platform: platform || 'CROSSPLAY',
      position: position || 'DFC',
      secondaryPosition: secondaryPosition || null,
      rating: parseFloat(rating || '9.0'),
      status: status || 'Activo',
      avatarUrl: userAvatar,
      foto: userAvatar,
      bannerUrl: bannerUrl || '/images/default/banner-default.jpg',
      biografia: biografia || null,
      twitter: twitter || null,
      instagram: instagram || null,
      twitch: twitch || null,
      discord: discord || null,
      youtube: youtube || null,
      whatsapp: whatsapp || null,
      organizationId: targetOrganizationId,
      isBanned: false,
    });

    await writeSecurityAudit({
      actor,
      request,
      action: 'ADMIN_USER_CREATED',
      resourceType: 'user',
      resourceId: newId,
      organizationId: targetOrganizationId,
      metadata: { assignedRole: finalRole },
    });

    return NextResponse.json({ success: true, message: 'Usuario creado exitosamente', userId: newId });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) || 'Error creando usuario' }, { status: 500 });
  }
}

// PUT /api/admin/users - Edit user & Ban/Unban with partial updates and Password change support
export async function PUT(request: Request) {
  try {
    const actor = await requireRequestActor(request, ['Administrador', 'Organizador']);
    const body = await request.json();
    const {
      id,
      name,
      gamertag,
      email,
      password,
      newPassword,
      role,
      status,
      primaryGame,
      platform,
      position,
      secondaryPosition,
      rating,
      avatarUrl,
      foto,
      bannerUrl,
      biografia,
      twitter,
      instagram,
      twitch,
      discord,
      youtube,
      whatsapp,
      isBanned,
      banReason,
      organizationId,
      action,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    const { dbProvider } = await import('@/lib/db/provider');
    const existing = await dbProvider.users.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const targetUser = existing;
    let invalidateTargetSessions = shouldRevokeUserSessions({ action, isBanned, status });

    if (!canManageUser(actor, {
      userId: targetUser.id,
      role: targetUser.role,
      organizationId: targetUser.organizationId,
    })) {
      return NextResponse.json({ error: 'No tienes permisos para modificar este usuario' }, { status: 403 });
    }
    if (role && !canAssignRole(actor, role)) {
      return NextResponse.json({ error: 'No tienes permisos para asignar ese rol' }, { status: 403 });
    }
    if (!isAdministrator(actor) && organizationId !== undefined && organizationId !== actor.organizationId) {
      return NextResponse.json({ error: 'No puedes mover usuarios fuera de tu organización' }, { status: 403 });
    }

    if (action === 'UNBAN') {
      await dbProvider.users.update(id, { isBanned: false, status: "Activo", banReason: null, bannedAt: null });
      await writeSecurityAudit({ actor, request, action: 'ADMIN_USER_UNBANNED', resourceType: 'user', resourceId: id });
      return NextResponse.json({ success: true, message: 'Usuario desbaneado con éxito' });
    }

    if (action === 'BAN') {
      const reason = banReason || 'Infracción a las reglas eSports';
      await dbProvider.users.update(id, { isBanned: true, status: "Baneado", banReason: reason, bannedAt: new Date().toISOString() });
      await revokeUserSessions(id);
      await writeSecurityAudit({
        actor,
        request,
        action: 'ADMIN_USER_BANNED',
        resourceType: 'user',
        resourceId: id,
        metadata: { reason },
      });
      return NextResponse.json({ success: true, message: 'Usuario baneado del sistema' });
    }

    // Dynamic partial UPDATE builder
    const updateData: Partial<typeof targetUser> = {};

    if (isBanned !== undefined && isBanned !== null) {
      const bVal = (isBanned === 1 || isBanned === true || isBanned === '1' || isBanned === 'true') ? 1 : 0;
      updateData.isBanned = bVal === 1;
      if (bVal === 1) {
        invalidateTargetSessions = true;
        updateData.banReason = banReason || 'Sanción disciplinaria de chat eSports';
        updateData.bannedAt = new Date().toISOString();
      } else {
        updateData.banReason = null;
        updateData.bannedAt = null;
      }
    }

    if (name !== undefined && name !== null && name !== '') updateData.name = name;
    if (gamertag !== undefined && gamertag !== null && gamertag !== '') updateData.gamertag = gamertag;
    if (email !== undefined && email !== null && email !== '') updateData.email = email;

    // Password change support for Admin and Organizer
    const passToSet = newPassword || password;
    if (passToSet && !isAdministrator(actor) && actor.userId !== id) {
      return NextResponse.json({ error: 'No puedes cambiar la contraseña de otro usuario' }, { status: 403 });
    }
    if (passToSet && passToSet.trim() !== '' && passToSet.trim().length >= 6) {
      invalidateTargetSessions = true;
      updateData.passwordHash = await hashPassword(passToSet.trim());
    }

    // Role change (Admin can change to any role; Organizer is restricted to Jugador)
    if (role !== undefined && role !== null && role !== '') updateData.role = role;
    if (status !== undefined && status !== null && status !== '') updateData.status = status;
    if (primaryGame !== undefined && primaryGame !== null && primaryGame !== '') updateData.primaryGameSlug = primaryGame;
    if (platform !== undefined && platform !== null && platform !== '') updateData.platform = platform;
    if (position !== undefined && position !== null) updateData.position = position;
    if (secondaryPosition !== undefined && secondaryPosition !== null) updateData.secondaryPosition = secondaryPosition;
    if (rating !== undefined && rating !== null && rating !== '') updateData.rating = parseFloat(rating);

    const userAvatar = avatarUrl || foto;
    if (userAvatar && userAvatar.trim() !== '') {
      updateData.avatarUrl = userAvatar;
      updateData.foto = userAvatar;
    }
    if (bannerUrl && bannerUrl.trim() !== '') updateData.bannerUrl = bannerUrl;
    if (biografia !== undefined && biografia !== null) updateData.biografia = biografia;
    if (twitter !== undefined && twitter !== null) updateData.twitter = twitter;
    if (instagram !== undefined && instagram !== null) updateData.instagram = instagram;
    if (twitch !== undefined && twitch !== null) updateData.twitch = twitch;
    if (discord !== undefined && discord !== null) updateData.discord = discord;
    if (youtube !== undefined && youtube !== null) updateData.youtube = youtube;
    if (whatsapp !== undefined && whatsapp !== null) updateData.whatsapp = whatsapp;
    if (organizationId !== undefined && organizationId !== null) updateData.organizationId = organizationId;

    if (Object.keys(updateData).length > 0) {
      await dbProvider.users.update(id, updateData);
    }

    if (invalidateTargetSessions) await revokeUserSessions(id);
    await writeSecurityAudit({
      actor,
      request,
      action: 'ADMIN_USER_UPDATED',
      resourceType: 'user',
      resourceId: id,
      organizationId: targetUser.organizationId,
      metadata: {
        roleChanged: role !== undefined,
        passwordChanged: Boolean(passToSet),
        banChanged: isBanned !== undefined,
      },
    });

    return NextResponse.json({ success: true, message: 'Usuario actualizado exitosamente' });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) || 'Error actualizando usuario' }, { status: 500 });
  }
}

