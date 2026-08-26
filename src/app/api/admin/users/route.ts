import { NextResponse } from 'next/server';
import { queryDB } from '@/lib/db';
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

    let sql = `SELECT * FROM users WHERE 1=1`;
    const params: (string | number | null)[] = [];

    if (!isAdministrator(actor)) {
      sql += ` AND organization_id = ?`;
      params.push(actor.organizationId);
    }

    if (roleFilter) {
      sql += ` AND role = ?`;
      params.push(roleFilter);
    }
    if (statusFilter) {
      sql += ` AND status = ?`;
      params.push(statusFilter);
    }
    if (isBannedFilter !== null && isBannedFilter !== undefined) {
      sql += ` AND is_banned = ?`;
      params.push(isBannedFilter === 'true' || isBannedFilter === '1' ? 1 : 0);
    }

    sql += ` ORDER BY created_at DESC`;

    const users = await queryDB<Record<string, unknown>>(sql, params);
    const safeUsers = users.map((user) => {
      const safeUser = { ...user };
      delete safeUser.password_hash;
      return safeUser;
    });
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

    await queryDB(
      `INSERT INTO users (
        id, name, email, password_hash, gamertag, role, primary_game_slug, platform, position, secondary_position, 
        rating, status, avatar_url, foto, banner_url, biografia, twitter, instagram, twitch, discord, youtube, whatsapp, organization_id, is_banned
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        newId,
        name || gamertag,
        userEmail,
        await hashPassword(password),
        gamertag || name,
        finalRole,
        primaryGame || 'eafc26',
        platform || 'CROSSPLAY',
        position || 'DFC',
        secondaryPosition || null,
        rating || '9.0',
        status || 'Activo',
        userAvatar,
        userAvatar,
        bannerUrl || '/images/default/banner-default.jpg',
        biografia || null,
        twitter || null,
        instagram || null,
        twitch || null,
        discord || null,
        youtube || null,
        whatsapp || null,
        targetOrganizationId,
      ]
    );

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

    const existing = await queryDB('SELECT * FROM users WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const targetUser = existing[0];
    let invalidateTargetSessions = shouldRevokeUserSessions({ action, isBanned, status });

    if (!canManageUser(actor, {
      userId: targetUser.id,
      role: targetUser.role,
      organizationId: targetUser.organization_id,
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
      await queryDB('UPDATE users SET is_banned = 0, status = "Activo", ban_reason = NULL, banned_at = NULL WHERE id = ?', [id]);
      await writeSecurityAudit({ actor, request, action: 'ADMIN_USER_UNBANNED', resourceType: 'user', resourceId: id });
      return NextResponse.json({ success: true, message: 'Usuario desbaneado con éxito' });
    }

    if (action === 'BAN') {
      const reason = banReason || 'Infracción a las reglas eSports';
      await queryDB('UPDATE users SET is_banned = 1, status = "Baneado", ban_reason = ?, banned_at = NOW() WHERE id = ?', [reason, id]);
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
    const fieldsToUpdate: string[] = [];
    const updateParams: (string | number | null)[] = [];

    if (isBanned !== undefined && isBanned !== null) {
      const bVal = (isBanned === 1 || isBanned === true || isBanned === '1' || isBanned === 'true') ? 1 : 0;
      fieldsToUpdate.push('is_banned = ?');
      updateParams.push(bVal);
      if (bVal === 1) {
        invalidateTargetSessions = true;
        fieldsToUpdate.push('ban_reason = ?');
        updateParams.push(banReason || 'Sanción disciplinaria de chat eSports');
      } else {
        fieldsToUpdate.push('ban_reason = NULL');
      }
    }

    if (name !== undefined && name !== null && name !== '') {
      fieldsToUpdate.push('name = ?');
      updateParams.push(name);
    }
    if (gamertag !== undefined && gamertag !== null && gamertag !== '') {
      fieldsToUpdate.push('gamertag = ?');
      updateParams.push(gamertag);
    }
    if (email !== undefined && email !== null && email !== '') {
      fieldsToUpdate.push('email = ?');
      updateParams.push(email);
    }

    // Password change support for Admin and Organizer
    const passToSet = newPassword || password;
    if (passToSet && !isAdministrator(actor) && actor.userId !== id) {
      return NextResponse.json({ error: 'No puedes cambiar la contraseña de otro usuario' }, { status: 403 });
    }
    if (passToSet && passToSet.trim() !== '' && passToSet.trim().length >= 6) {
      invalidateTargetSessions = true;
      fieldsToUpdate.push('password_hash = ?');
      updateParams.push(await hashPassword(passToSet.trim()));
    }

    // Role change (Admin can change to any role; Organizer is restricted to Jugador)
    if (role !== undefined && role !== null && role !== '') {
      fieldsToUpdate.push('role = ?');
      updateParams.push(role);
    }

    if (status !== undefined && status !== null && status !== '') {
      fieldsToUpdate.push('status = ?');
      updateParams.push(status);
    }
    if (primaryGame !== undefined && primaryGame !== null && primaryGame !== '') {
      fieldsToUpdate.push('primary_game_slug = ?');
      updateParams.push(primaryGame);
    }
    if (platform !== undefined && platform !== null && platform !== '') {
      fieldsToUpdate.push('platform = ?');
      updateParams.push(platform);
    }
    if (position !== undefined && position !== null) {
      fieldsToUpdate.push('position = ?');
      updateParams.push(position);
    }
    if (secondaryPosition !== undefined && secondaryPosition !== null) {
      fieldsToUpdate.push('secondary_position = ?');
      updateParams.push(secondaryPosition);
    }
    if (rating !== undefined && rating !== null && rating !== '') {
      fieldsToUpdate.push('rating = ?');
      updateParams.push(rating);
    }

    const userAvatar = avatarUrl || foto;
    if (userAvatar && userAvatar.trim() !== '') {
      fieldsToUpdate.push('avatar_url = ?');
      fieldsToUpdate.push('foto = ?');
      updateParams.push(userAvatar);
      updateParams.push(userAvatar);
    }
    if (bannerUrl && bannerUrl.trim() !== '') {
      fieldsToUpdate.push('banner_url = ?');
      updateParams.push(bannerUrl);
    }
    if (biografia !== undefined && biografia !== null) {
      fieldsToUpdate.push('biografia = ?');
      updateParams.push(biografia);
    }
    if (twitter !== undefined && twitter !== null) {
      fieldsToUpdate.push('twitter = ?');
      updateParams.push(twitter);
    }
    if (instagram !== undefined && instagram !== null) {
      fieldsToUpdate.push('instagram = ?');
      updateParams.push(instagram);
    }
    if (twitch !== undefined && twitch !== null) {
      fieldsToUpdate.push('twitch = ?');
      updateParams.push(twitch);
    }
    if (discord !== undefined && discord !== null) {
      fieldsToUpdate.push('discord = ?');
      updateParams.push(discord);
    }
    if (youtube !== undefined && youtube !== null) {
      fieldsToUpdate.push('youtube = ?');
      updateParams.push(youtube);
    }
    if (whatsapp !== undefined && whatsapp !== null) {
      fieldsToUpdate.push('whatsapp = ?');
      updateParams.push(whatsapp);
    }
    if (organizationId !== undefined && organizationId !== null) {
      fieldsToUpdate.push('organization_id = ?');
      updateParams.push(organizationId);
    }

    if (fieldsToUpdate.length > 0) {
      fieldsToUpdate.push('updated_at = NOW()');
      updateParams.push(id);
      const sql = `UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
      await queryDB(sql, updateParams);
    }

    if (invalidateTargetSessions) await revokeUserSessions(id);
    await writeSecurityAudit({
      actor,
      request,
      action: 'ADMIN_USER_UPDATED',
      resourceType: 'user',
      resourceId: id,
      organizationId: targetUser.organization_id,
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
