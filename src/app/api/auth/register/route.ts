import { NextResponse } from 'next/server';
import { queryDB } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';
import { UserRow, mapUserRowToProfile, apiError } from '@/lib/api-types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gamertag, name, email, password, primaryGame, platform } = body;

    // ── Validate required fields ────────────────────────────────────────
    if (!gamertag || typeof gamertag !== 'string' || gamertag.trim().length < 3) {
      return apiError('Gamertag requerido (mínimo 3 caracteres)', 400);
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return apiError('Contraseña requerida (mínimo 6 caracteres)', 400);
    }

    const userGamertag = gamertag.trim();
    const userName = (name || userGamertag).trim();
    const userEmail = email?.trim() || `${userGamertag.toLowerCase().replace(/[^a-z0-9]/g, '')}@tournamentspro.com`;

    // ── Check if gamertag or email already exists ────────────────────────
    const existing = await queryDB<UserRow>(
      'SELECT id FROM users WHERE LOWER(gamertag) = LOWER(?) OR LOWER(email) = LOWER(?) LIMIT 1',
      [userGamertag, userEmail]
    );

    if (existing && existing.length > 0) {
      return apiError('El gamertag o email ya está registrado. Intenta iniciar sesión.', 409, 'DUPLICATE_USER');
    }

    // ── Hash password ───────────────────────────────────────────────────
    const hashedPassword = await hashPassword(password);

    // Self-registered users are ALWAYS 'Jugador'
    const userRole = 'Jugador';
    const gameSlug = primaryGame || 'eafc26';
    const userPlatform = platform || 'CROSSPLAY';
    const defaultPosition = gameSlug === 'valorant' ? 'Duelista'
      : gameSlug === 'csgo' ? 'AWPer'
      : gameSlug === 'lol' ? 'Mid'
      : gameSlug === 'rocketleague' ? 'Rotador'
      : 'DFC';

    const newId = `usr-${Date.now()}`;

    // ── Insert user ─────────────────────────────────────────────────────
    await queryDB(
      `INSERT INTO users (id, email, password_hash, name, gamertag, role, primary_game_slug, platform, position, rank_badge, status, is_banned)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [newId, userEmail, hashedPassword, userName, userGamertag, userRole, gameSlug, userPlatform, defaultPosition, 'División 1', 'Activo']
    );

    // ── Generate JWT ────────────────────────────────────────────────────
    const token = signToken({
      userId: newId,
      role: userRole,
      gamertag: userGamertag,
    });

    const userProfile = {
      id: newId,
      name: userName,
      email: userEmail,
      gamertag: userGamertag,
      role: userRole,
      primaryGame: gameSlug,
      platform: userPlatform,
      position: defaultPosition,
      status: 'Buscando Club',
      rating: '9.0',
      avatarUrl: '/images/default/logo-default.png',
      bannerUrl: '/images/default/banner-default.jpg',
    };

    const response = NextResponse.json({
      success: true,
      data: { user: userProfile, token },
      message: 'Usuario registrado exitosamente',
    });

    response.cookies.set('tp_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: unknown) {
    console.error('Register error:', error);
    const message = error instanceof Error ? error.message : 'Error en registro';
    return apiError(message, 500);
  }
}
