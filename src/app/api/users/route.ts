import { NextResponse } from 'next/server';
import { queryDB } from '@/lib/db';
import { authenticateRequest, hashPassword } from '@/lib/auth';
import {
  UserRow,
  mapUserRowToProfile,
  apiSuccess,
  apiError,
  parsePaginationParams,
  buildPaginationMeta,
} from '@/lib/api-types';

// GET /api/users — List users or get single user by ID
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    const gameSlug = searchParams.get('gameSlug');
    const { page, limit } = parsePaginationParams(searchParams);

    if (userId) {
      // Single user lookup
      const rows = await queryDB<UserRow>('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
      if (!rows || rows.length === 0) {
        return apiError('Usuario no encontrado', 404);
      }
      return apiSuccess({ user: mapUserRowToProfile(rows[0]) });
    }

    // List users with optional filters and pagination
    let countSql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    let sql = 'SELECT * FROM users WHERE 1=1';
    const params: (string | number)[] = [];
    const countParams: (string | number)[] = [];

    if (gameSlug && gameSlug !== 'ALL' && gameSlug !== 'all') {
      const filter = ' AND primary_game_slug = ?';
      sql += filter;
      countSql += filter;
      params.push(gameSlug);
      countParams.push(gameSlug);
    }

    // Get total count
    const countResult = await queryDB<{ total: number }>(countSql, countParams);
    const total = countResult[0]?.total || 0;

    // Paginated query
    const offset = (page - 1) * limit;
    sql += ' ORDER BY created_at ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = await queryDB<UserRow>(sql, params);
    const users = rows.map(mapUserRowToProfile);
    const meta = buildPaginationMeta(page, limit, total);

    return apiSuccess({ users }, undefined, meta);
  } catch (error: unknown) {
    console.error('Users GET error:', error);
    const message = error instanceof Error ? error.message : 'Error consultando usuarios';
    return apiError(message, 500);
  }
}

// POST /api/users — Create user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, email, gamertag, role, primaryGame, platform, position, rankBadge, status } = body;

    if (!gamertag || !name) {
      return apiError('Nombre y gamertag son requeridos', 400);
    }

    const newId = id || `usr-${Date.now()}`;
    const userRole = role || 'Jugador';
    const gameSlug = primaryGame || 'eafc26';
    const userPlatform = platform || 'CROSSPLAY';

    await queryDB(
      `INSERT INTO users (id, name, email, gamertag, role, primary_game_slug, platform, position, rank_badge, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), gamertag=VALUES(gamertag), role=VALUES(role)`,
      [newId, name, email || `${gamertag.toLowerCase().replace(/[^a-z0-9]/g, '')}@tournamentspro.com`, gamertag, userRole, gameSlug, userPlatform, position || 'DFC', rankBadge || 'División 1', status || 'Buscando Club']
    );

    return apiSuccess({ user: { id: newId, ...body } }, 'Usuario creado exitosamente');
  } catch (error: unknown) {
    console.error('Users POST error:', error);
    const message = error instanceof Error ? error.message : 'Error guardando usuario';
    return apiError(message, 500);
  }
}

// PUT /api/users — Update user profile
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      gamertag,
      platform,
      position,
      secondaryPosition,
      country,
      birthDate,
      phone,
      bio,
      avatarUrl,
      foto,
      bannerUrl,
      instagram,
      facebook,
      twitch,
      youtube,
      tiktok,
      discord,
      twitter,
      website,
      whatsapp,
      gameProfiles,
      newPassword,
      password,
    } = body;

    if (!id) {
      return apiError('Falta ID de usuario', 400);
    }

    // Optional: Auth check - user can only update their own profile
    const authPayload = authenticateRequest(request);
    if (authPayload && authPayload.userId !== id) {
      // Allow if admin
      if (authPayload.role !== 'Administrador' && authPayload.role !== 'Admin') {
        return apiError('Solo puedes editar tu propio perfil', 403);
      }
    }

    // Lookup existing user to merge missing fields
    const existingRows = await queryDB<UserRow>('SELECT * FROM users WHERE id = ?', [id]);
    const u = existingRows && existingRows.length > 0 ? existingRows[0] : {} as Partial<UserRow>;

    const finalName = name !== undefined ? name : (u.name || 'Atleta Pro');
    const finalGamertag = gamertag !== undefined ? gamertag : (u.gamertag || 'Gamertag');
    const userFoto = foto || avatarUrl || u.avatar_url || '/images/default/logo-default.png';
    const userBanner = bannerUrl || '/images/default/banner-default.jpg';
    const userGameProfiles = gameProfiles !== undefined
      ? (typeof gameProfiles === 'object' ? JSON.stringify(gameProfiles) : gameProfiles)
      : '{}';

    // Password update with hashing
    const pwdToUpdate = newPassword || password;
    if (pwdToUpdate && typeof pwdToUpdate === 'string' && pwdToUpdate.trim().length >= 6) {
      const hashed = await hashPassword(pwdToUpdate.trim());
      await queryDB('UPDATE users SET password_hash = ? WHERE id = ?', [hashed, id]);
    }

    await queryDB(
      `UPDATE users SET
        name = ?,
        gamertag = ?,
        platform = ?,
        position = ?,
        secondary_position = ?,
        country = ?,
        birth_date = ?,
        phone = ?,
        bio = ?,
        avatar_url = ?,
        foto = ?,
        banner_url = ?,
        instagram = ?,
        facebook = ?,
        twitch = ?,
        youtube = ?,
        tiktok = ?,
        discord = ?,
        twitter = ?,
        website = ?,
        whatsapp = ?,
        game_profiles = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [
        finalName,
        finalGamertag,
        platform !== undefined ? platform : (u.platform || 'CROSSPLAY'),
        position !== undefined ? position : (u.position || 'DFC'),
        secondaryPosition !== undefined ? secondaryPosition : u.secondary_position,
        country !== undefined ? country : u.country,
        birthDate !== undefined ? birthDate : u.birth_date,
        phone !== undefined ? phone : u.phone,
        bio !== undefined ? bio : u.bio,
        userFoto,
        userFoto,
        userBanner,
        instagram !== undefined ? instagram : u.instagram,
        facebook !== undefined ? facebook : u.facebook,
        twitch !== undefined ? twitch : u.twitch,
        youtube !== undefined ? youtube : u.youtube,
        tiktok !== undefined ? tiktok : u.tiktok,
        discord !== undefined ? discord : u.discord,
        twitter !== undefined ? twitter : u.twitter,
        website !== undefined ? website : u.website,
        whatsapp !== undefined ? whatsapp : u.whatsapp,
        userGameProfiles,
        id,
      ]
    );

    return apiSuccess(
      { user: { ...u, ...body, foto: userFoto, avatarUrl: userFoto, bannerUrl: userBanner } },
      'Perfil actualizado correctamente'
    );
  } catch (error: unknown) {
    console.error('Users PUT error:', error);
    const message = error instanceof Error ? error.message : 'Error guardando perfil';
    return apiError(message, 500);
  }
}
