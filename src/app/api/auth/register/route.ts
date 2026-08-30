import { NextResponse } from 'next/server';

import { hashPassword, signToken } from '@/lib/auth';
import { apiError } from '@/lib/api-types';
import { authorizationErrorResponse, requireValidMutationOrigin } from '@/lib/auth-server';
import { consumeSecurityRateLimit, createAuthSession, getTrustedClientAddress } from '@/lib/security';
import { registerBodySchema } from '@/lib/api-schemas';

function getRegistrationValidationMessage(issues: ReadonlyArray<{ path: PropertyKey[]; code?: string }>): string {
  const issue = issues[0];
  const field = String(issue?.path[0] || '');
  if (field === 'gamertag') return 'El gamertag debe tener entre 3 y 50 caracteres.';
  if (field === 'email') return 'Ingresa un correo electrónico válido.';
  if (field === 'password') {
    if (issue?.code === 'too_small') return 'La contraseña debe tener al menos 10 caracteres.';
    if (issue?.code === 'too_big') return 'La contraseña no puede superar los 128 caracteres.';
    return 'La contraseña debe incluir al menos una letra y un número.';
  }
  if (field === 'name') return 'El nombre no puede superar los 100 caracteres.';
  return 'Revisa los datos ingresados e inténtalo nuevamente.';
}

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
    if (!parsedBody.success) {
      return apiError(
        getRegistrationValidationMessage(parsedBody.error.issues),
        400,
        'VALIDATION_ERROR',
        parsedBody.error.issues,
      );
    }
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
    const userEmail = email?.trim().toLowerCase() || `${userGamertag.toLowerCase().replace(/[^a-z0-9]/g, '')}@tournamentspro.com`;
    const accountRateLimit = await consumeSecurityRateLimit(
      'auth-register-account',
      `${userEmail}:${userGamertag.toLowerCase()}`,
      5,
      60 * 60 * 1000,
    );
    if (!accountRateLimit.allowed) {
      return apiError(`Demasiados registros. Reintenta en ${accountRateLimit.retryAfter} segundos.`, 429, 'RATE_LIMITED');
    }

    // ── Check if gamertag or email already exists ────────────────────────
    const { dbProvider } = await import('@/lib/db/provider');
    const [existing, existingGt] = await Promise.all([
      dbProvider.users.findByEmailOrGamertag(userEmail),
      dbProvider.users.findByEmailOrGamertag(userGamertag),
    ]);

    if (existing || existingGt) {
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

    const newId = `usr-${crypto.randomUUID()}`;

    // ── Insert user ─────────────────────────────────────────────────────
    const newUser = {
      id: newId,
      email: userEmail,
      passwordHash: hashedPassword,
      name: userName,
      gamertag: userGamertag,
      role: userRole,
      primaryGameSlug: gameSlug,
      platform: userPlatform,
      position: defaultPosition,
      rating: 9.0,
      status: 'Buscando Club',
      avatarUrl: '/images/default/logo-default.png',
      bannerUrl: '/images/default/banner-default.jpg',
      isBanned: false,
    };
    await dbProvider.users.create(newUser);

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
    return apiError('No pudimos completar el registro. Inténtalo nuevamente.', 500, 'INTERNAL_ERROR');
  }
}

