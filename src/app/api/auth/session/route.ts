import { apiError, apiSuccess, mapUserRowToProfile, type UserRow } from '@/lib/api-types';
import { getRequestUserSession } from '@/lib/auth-server';
import { queryDB } from '@/lib/db/provider';

export async function GET(request: Request) {
  try {
    const session = await getRequestUserSession(request);
    if (!session) return apiSuccess({ authenticated: false, user: null });

    const users = await queryDB<UserRow>('SELECT * FROM users WHERE id = ? LIMIT 1', [session.userId]);
    if (!users[0]) return apiError('Usuario de sesión no encontrado', 401, 'UNAUTHORIZED');

    return apiSuccess({ authenticated: true, user: mapUserRowToProfile(users[0]) });
  } catch (error) {
    console.error('Session lookup error:', error);
    return apiError('No se pudo verificar la sesión', 500);
  }
}

