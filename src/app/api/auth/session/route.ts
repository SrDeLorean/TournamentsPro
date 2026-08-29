import { apiError, apiSuccess, mapUserRowToProfile, type UserRow } from '@/lib/api-types';
import { getRequestUserSession } from '@/lib/auth-server';
import { dbProvider } from '@/lib/db/provider';

export async function GET(request: Request) {
  try {
    const session = await getRequestUserSession(request);
    if (!session) return apiSuccess({ authenticated: false, user: null });

    const user = await dbProvider.users.findById(session.userId);
    if (!user) return apiError('Usuario de sesión no encontrado', 401, 'UNAUTHORIZED');

    // dbProvider returns mapped User object, need to map to UserRow for mapUserRowToProfile?
    // Wait, mapUserRowToProfile expects UserRow. Let's just use it or map the User object back.
    // Actually, `user` is already a structured object.
    const userRow: UserRow = {
      id: user.id,
      email: user.email,
      name: user.name,
      gamertag: user.gamertag,
      role: user.role,
      primary_game_slug: user.primaryGameSlug,
      platform: user.platform,
      position: user.position,
      secondary_position: user.secondaryPosition,
      rank_badge: user.rankBadge,
      rating: user.rating,
      status: user.status,
      avatar_url: user.avatarUrl,
      organization_id: user.organizationId,
      is_banned: user.isBanned ? 1 : 0,
      ban_reason: user.banReason,
      last_login_at: user.lastLoginAt,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      password_hash: user.passwordHash,
      google_id: user.googleId,
    };
    return apiSuccess({ authenticated: true, user: mapUserRowToProfile(userRow) });
  } catch (error) {
    console.error('Session lookup error:', error);
    return apiError('No se pudo verificar la sesión', 500);
  }
}

