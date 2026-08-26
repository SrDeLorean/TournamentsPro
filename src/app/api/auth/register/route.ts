import { NextResponse } from 'next/server';
import { queryDB } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';
import { UserRow, apiError } from '@/lib/api-types';
import { authorizationErrorResponse, requireValidMutationOrigin } from '@/lib/auth-server';
import { consumeSecurityRateLimit, createAuthSession, getTrustedClientAddress } from '@/lib/security';
import { registerBodySchema } from '@/lib/api-schemas';

export async function POST(request: Request) {
  try {
    requireValidMutationOrigin(request);
    const clientAddress = getTrustedClientAddress(request);
    if (clientAddress) {
      const clientRateLimit = await consumeSecurityRateLimit('auth-register-client', clientAddress, 5, 60 * 60 * 1000);
      if (!clientRateLimit.allowed) {
        return apiError(`Demasiados registros. Reintenta en ${clientRateLimit.retryAfter} segundos.`, 429, 'RATE_LIMITED');
      }
    }

    const parsedBody = registerBodySchema.safeParse(await request.json());
    if (!parsedBody.success) return apiError('Datos de registro inválidos', 400);
    const body = parsedBody.data;
    const { gamertag, name, email, password, primaryGame, platform } = body;

    // ── Validate required fields ────────────────────────────────────────
    if (!gamertag || typeof gamertag !== 'string' || gamertag.trim().length < 3) {
      return apiError('Gamertag requerido (mínimo 3 caracteres)', 400);
    }

    if (
      !password ||
      typeof password !== 'string' ||
      password.length < 10 ||
      !/[A-Za-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      return apiError('La contraseña debe tener al menos 10 caracteres, una letra y un número', 400);
    }

    const userGamertag = gamertag.trim();
    const userName = (name || userGamertag).trim();
    const userEmail = email?.trim() || `${userGamertag.toLowerCase().replace(/[^a-z0-9]/g, '')}@tournamentspro.com`;
    const accountRateLimit = await consumeSecurityRateLimit(
      'auth-register-account',
      `${userEmail}:${userGamertag}`,
      5,
      60 * 60 * 1000,
    );
    if (!accountRateLimit.allowed) {
      return apiError(`Demasiados registros. Reintenta en ${accountRateLimit.retryAfter} segundos.`, 429, 'RATE_LIMITED');
    }

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
    const session = await createAuthSession(newId, request);
    const token = signToken({
      userId: newId,
      role: userRole,
      gamertag: userGamertag,
    }, 'access', session.sessionId);

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
      data: { user: userProfile },
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
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Register error:', error);
    const message = error instanceof Error ? error.message : 'Error en registro';
    return apiError(message, 500);
  }
}
