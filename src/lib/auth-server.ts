import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { queryDB } from '@/lib/db';

export interface ServerUserSession {
  userId: string;
  name: string;
  role: string;
  organizationId: string | null;
  allowedGames: string[];
}

/**
 * 🔒 Obtiene el usuario autenticado y su Organización en Server Components / Server Actions
 */
export async function getServerUserSession(): Promise<ServerUserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('tp_session')?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload?.userId) return null;

    // Consultar usuario y su organización (como usuario o como propietario en organizations)
    const users = await queryDB<{
      id: string;
      name: string;
      role: string;
      organization_id: string | null;
      owned_org_id: string | null;
      allowed_games: string | null;
    }>(
      `SELECT u.id, u.name, u.role, u.organization_id, o.id as owned_org_id, o.allowed_games
       FROM users u
       LEFT JOIN organizations o ON (o.owner_id = u.id OR o.id = u.organization_id)
       WHERE u.id = ? LIMIT 1`,
      [payload.userId]
    );

    if (!users || users.length === 0) return null;

    const user = users[0];
    const effectiveOrgId = user.organization_id || user.owned_org_id || null;

    let allowedGames: string[] = [];
    if (user.allowed_games) {
      try {
        allowedGames = JSON.parse(user.allowed_games);
      } catch {
        allowedGames = user.allowed_games.split(',').map((s) => s.trim());
      }
    }

    return {
      userId: user.id,
      name: user.name,
      role: user.role,
      organizationId: effectiveOrgId,
      allowedGames,
    };
  } catch (error) {
    console.error('Error en getServerUserSession:', error);
    return null;
  }
}
