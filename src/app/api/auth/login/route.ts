import { NextResponse } from 'next/server';
import { verifyPassword, signToken } from '@/lib/auth';
import { UserRow, mapUserRowToProfile, apiError } from '@/lib/api-types';
import { authorizationErrorResponse, requireValidMutationOrigin } from '@/lib/auth-server';
import { consumeSecurityRateLimit, createAuthSession, getTrustedClientAddress } from '@/lib/security';
import { loginBodySchema } from '@/lib/api-schemas';

const INVALID_CREDENTIALS_MESSAGE = 'Credenciales inválidas. Verifica tu email/gamertag y contraseña.';

export async function POST(request: Request) {
  try {
    requireValidMutationOrigin(request);
    const clientAddress = getTrustedClientAddress(request);
    if (clientAddress) {
      const clientRateLimit = await consumeSecurityRateLimit('auth-login-client', clientAddress, 20, 15 * 60 * 1000);
      if (!clientRateLimit.allowed) {
        return apiError(`Demasiados intentos. Reintenta en ${clientRateLimit.retryAfter} segundos.`, 429, 'RATE_LIMITED');
      }
    }

    const parsedBody = loginBodySchema.safeParse(await request.json());
    if (!parsedBody.success) return apiError('Email/gamertag o contraseña inválidos', 400);
    const body = parsedBody.data;
    const { emailOrGamertag, password } = body;

    if (!emailOrGamertag || typeof emailOrGamertag !== 'string' || !emailOrGamertag.trim()) {
      return apiError('Email o Gamertag requerido', 400);
    }

    if (!password || typeof password !== 'string') {
      return apiError('Contraseña requerida', 400);
    }

    const term = emailOrGamertag.trim().toLowerCase();
    const accountRateLimit = await consumeSecurityRateLimit('auth-login-account', term, 10, 15 * 60 * 1000);
    if (!accountRateLimit.allowed) {
      return apiError(`Demasiados intentos. Reintenta en ${accountRateLimit.retryAfter} segundos.`, 429, 'RATE_LIMITED');
    }

    // Keep identifier resolution inside the active database adapter. Both MySQL
    // and Supabase implement a case-insensitive email/gamertag lookup.
    const user = await import('@/lib/db/provider')
      .then((module) => module.dbProvider.users.findByEmailOrGamertag(term));

    if (!user) {
      return apiError(INVALID_CREDENTIALS_MESSAGE, 401, 'INVALID_CREDENTIALS');
    }

    const row = {
      id: user.id, email: user.email, name: user.name, gamertag: user.gamertag, role: user.role,
      primary_game_slug: user.primaryGameSlug, platform: user.platform, position: user.position,
      secondary_position: user.secondaryPosition, rank_badge: user.rankBadge, rating: user.rating,
      status: user.status, avatar_url: user.avatarUrl, banner_url: user.bannerUrl || null, organization_id: user.organizationId,
      is_banned: user.isBanned ? 1 : 0, ban_reason: user.banReason, last_login_at: user.lastLoginAt,
      created_at: user.createdAt, updated_at: user.updatedAt, password_hash: user.passwordHash, google_id: user.googleId
    };

    // System ban / suspension check
    if (row.status === 'Baneado' || row.status === 'Suspendido') {
      return apiError(
        `Cuenta suspendida o baneada del sistema: ${row.ban_reason || 'Infracción a los términos de servicio'}`,
        403,
        'ACCOUNT_BANNED'
      );
    }

    // Password verification
    if (!row.password_hash) {
      return apiError('Esta cuenta no tiene contraseña configurada. Intenta con Google.', 401);
    }

    const passwordValid = row.password_hash.startsWith('$2')
      ? await verifyPassword(password, row.password_hash)
      : false;

    if (!passwordValid) {
      return apiError(INVALID_CREDENTIALS_MESSAGE, 401, 'INVALID_CREDENTIALS');
    }

    // Generate JWT token
    const session = await createAuthSession(row.id, request);
    const token = signToken({
      userId: row.id,
      role: row.role,
      gamertag: row.gamertag,
    }, 'access', session.sessionId);

    const userProfile = mapUserRowToProfile(row);

    // The JWT is only stored in an HttpOnly cookie; it is never exposed to client JavaScript.
    const response = NextResponse.json({
      success: true,
      data: { user: userProfile },
      message: 'Inicio de sesión exitoso',
    });

    response.cookies.set('tp_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Login error:', error);
    const message = error instanceof Error ? error.message : 'Error en inicio de sesión';
    return apiError(message, 500);
  }
}

