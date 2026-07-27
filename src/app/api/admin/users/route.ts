import { NextResponse } from 'next/server';
import { queryDB } from '@/lib/db';
import { hashPassword, authenticateRequest, isAdminOrOrganizer } from '@/lib/auth';

// GET /api/admin/users - List users with status & ban filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');
    const statusFilter = searchParams.get('status');
    const isBannedFilter = searchParams.get('isBanned');

    let sql = `SELECT * FROM users WHERE 1=1`;
    const params: any[] = [];

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

    const users = await queryDB(sql, params);
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error consultando usuarios' }, { status: 500 });
  }
}

// POST /api/admin/users - Create user
export async function POST(request: Request) {
  try {
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
      requesterRole,
    } = body;

    let finalRole = role || 'Jugador';
    if (requesterRole === 'Organizador' && finalRole !== 'Jugador') {
      return NextResponse.json({ error: 'Un Organizador solo puede crear usuarios con rol Jugador' }, { status: 403 });
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
        await hashPassword(password || '123456'),
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
        organizationId || null,
      ]
    );

    return NextResponse.json({ success: true, message: 'Usuario creado exitosamente', userId: newId });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error creando usuario' }, { status: 500 });
  }
}

// PUT /api/admin/users - Edit user & Ban/Unban with partial updates and Password change support
export async function PUT(request: Request) {
  try {
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
      requesterRole,
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

    // Requirement 2: Organizer cannot modify Admin or Organizer roles
    if (requesterRole === 'Organizador' && targetUser.role !== 'Jugador') {
      return NextResponse.json({ error: 'Un Organizador solo puede gestionar Jugadores' }, { status: 403 });
    }

    if (action === 'UNBAN') {
      await queryDB('UPDATE users SET is_banned = 0, status = "Activo", ban_reason = NULL, banned_at = NULL WHERE id = ?', [id]);
      return NextResponse.json({ success: true, message: 'Usuario desbaneado con éxito' });
    }

    if (action === 'BAN' || isBanned === 1) {
      const reason = banReason || 'Infracción a las reglas eSports';
      await queryDB('UPDATE users SET is_banned = 1, status = "Baneado", ban_reason = ?, banned_at = NOW() WHERE id = ?', [reason, id]);
      return NextResponse.json({ success: true, message: 'Usuario baneado del sistema' });
    }

    // Dynamic partial UPDATE builder
    const fieldsToUpdate: string[] = [];
    const updateParams: any[] = [];

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
    if (passToSet && passToSet.trim() !== '' && passToSet.trim().length >= 6) {
      fieldsToUpdate.push('password_hash = ?');
      updateParams.push(await hashPassword(passToSet.trim()));
    }

    // Role change (Admin can change to any role; Organizer is restricted to Jugador)
    if (role !== undefined && role !== null && role !== '') {
      let finalRole = role;
      if (requesterRole === 'Organizador') {
        finalRole = targetUser.role; // Organizer cannot alter roles
      }
      fieldsToUpdate.push('role = ?');
      updateParams.push(finalRole);
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

    return NextResponse.json({ success: true, message: 'Usuario actualizado exitosamente' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error actualizando usuario' }, { status: 500 });
  }
}
