import { OAuth2Client } from 'google-auth-library';
import { NextResponse } from 'next/server';
import { queryDB } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { apiError, mapUserRowToProfile, type UserRow } from '@/lib/api-types';
import { authorizationErrorResponse, requireValidMutationOrigin } from '@/lib/auth-server';
import { consumeSecurityRateLimit, createAuthSession, getTrustedClientAddress } from '@/lib/security';

const googleClient = new OAuth2Client();

export async function POST(request: Request) {
  try {
    requireValidMutationOrigin(request);
    const clientAddress = getTrustedClientAddress(request);
    if (clientAddress) {
      const clientRateLimit = await consumeSecurityRateLimit('auth-google-client', clientAddress, 10, 15 * 60 * 1000);
      if (!clientRateLimit.allowed) {
        return apiError(`Demasiados intentos. Reintenta en ${clientRateLimit.retryAfter} segundos.`, 429, 'RATE_LIMITED');
      }
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      return apiError('Google OAuth no está configurado', 503, 'GOOGLE_AUTH_NOT_CONFIGURED');
    }

    const body: unknown = await request.json();
    const credential = typeof body === 'object' && body !== null && 'credential' in body
      ? (body as { credential?: unknown }).credential
      : null;

    if (typeof credential !== 'string' || !credential) {
      return apiError('Credential de Google requerida', 400, 'INVALID_GOOGLE_CREDENTIAL');
    }

    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      return apiError('La identidad de Google no pudo verificarse', 401, 'INVALID_GOOGLE_IDENTITY');
    }
    const accountRateLimit = await consumeSecurityRateLimit('auth-google-account', payload.sub, 10, 15 * 60 * 1000);
    if (!accountRateLimit.allowed) {
      return apiError(`Demasiados intentos. Reintenta en ${accountRateLimit.retryAfter} segundos.`, 429, 'RATE_LIMITED');
    }

    const finalName = payload.name?.trim() || payload.email.split('@')[0];
    const cleanedName = finalName.replace(/[^a-zA-Z0-9]/g, '');
    const gamertag = cleanedName ? `${cleanedName.slice(0, 12)}_G` : `Google_${payload.sub.slice(-6)}`;
    const newUserId = `usr-google-${payload.sub}`.slice(0, 100);

    await queryDB(
      `INSERT INTO users
        (id, email, google_id, name, gamertag, role, primary_game_slug, platform, position, rank_badge, status, avatar_url)
       VALUES (?, ?, ?, ?, ?, 'Jugador', 'eafc26', 'CROSSPLAY', 'DFC', 'División 1', 'Activo', ?)
       ON DUPLICATE KEY UPDATE
         google_id = VALUES(google_id),
         name = VALUES(name),
         avatar_url = VALUES(avatar_url)`,
      [newUserId, payload.email, payload.sub, finalName, gamertag, payload.picture || null],
    );

    const users = await queryDB<UserRow>(
      'SELECT * FROM users WHERE google_id = ? OR LOWER(email) = LOWER(?) LIMIT 1',
      [payload.sub, payload.email],
    );
    const row = users[0];
    if (!row) return apiError('No se pudo crear la sesión de Google', 500);

    const session = await createAuthSession(row.id, request);
    const token = signToken({ userId: row.id, role: row.role, gamertag: row.gamertag }, 'access', session.sessionId);
    const response = NextResponse.json({
      success: true,
      data: { user: mapUserRowToProfile(row) },
      message: 'Autenticación con Google completada',
    });

    response.cookies.set('tp_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Google OAuth verification error:', error);
    return apiError('Credential de Google inválida o expirada', 401, 'INVALID_GOOGLE_CREDENTIAL');
  }
}
