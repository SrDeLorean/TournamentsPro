import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { authenticateRequest } from '@/lib/auth';
import { queryDB } from '@/lib/db';
import { isAuthSessionActive, validateMutationOrigin } from '@/lib/security';
import {
  canManageCompetition,
  canManageTeam,
  canManageUser,
  normalizeRole,
  type AuthorizationActor,
  type SystemRole,
} from '@/lib/authorization';

export interface ServerUserSession {
  userId: string;
  name: string;
  role: string;
  organizationId: string | null;
  allowedGames: string[];
}

interface SessionUserRow {
  id: string;
  name: string;
  role: string;
  organization_id: string | null;
  owned_org_id: string | null;
  status: string | null;
  is_banned: number | null;
}

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403 = 401,
    public readonly code: 'UNAUTHORIZED' | 'FORBIDDEN' = 'UNAUTHORIZED',
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

async function loadServerUser(userId: string): Promise<ServerUserSession | null> {
  const users = await queryDB<SessionUserRow>(
    `SELECT u.id, u.name, u.role, u.organization_id, u.status, u.is_banned,
            (SELECT o.id FROM organizations o WHERE o.owner_id = u.id LIMIT 1) AS owned_org_id
       FROM users u
      WHERE u.id = ?
      LIMIT 1`,
    [userId],
  );

  const user = users[0];
  if (!user || user.is_banned === 1 || user.status === 'Baneado' || user.status === 'Suspendido') {
    return null;
  }

  const organizationId = user.organization_id || user.owned_org_id || null;
  let allowedGames: string[] = [];

  if (organizationId) {
    const organizations = await queryDB<{ allowed_games: string | null }>(
      'SELECT allowed_games FROM organizations WHERE id = ? LIMIT 1',
      [organizationId],
    );
    const rawAllowedGames = organizations[0]?.allowed_games;
    if (rawAllowedGames) {
      try {
        const parsed: unknown = JSON.parse(rawAllowedGames);
        allowedGames = Array.isArray(parsed)
          ? parsed.filter((game): game is string => typeof game === 'string')
          : [];
      } catch {
        allowedGames = rawAllowedGames.split(',').map((game) => game.trim()).filter(Boolean);
      }
    }
  }

  return {
    userId: user.id,
    name: user.name,
    role: user.role,
    organizationId,
    allowedGames,
  };
}

function toAuthorizationActor(session: ServerUserSession): AuthorizationActor {
  const role = normalizeRole(session.role);
  if (!role) {
    throw new AuthorizationError('El rol de la sesión no es válido', 403, 'FORBIDDEN');
  }

  return {
    userId: session.userId,
    role,
    organizationId: session.organizationId,
  };
}

function assertAllowedRole(actor: AuthorizationActor, roles?: readonly SystemRole[]): void {
  if (roles && !roles.includes(actor.role)) {
    throw new AuthorizationError('No tienes permisos para realizar esta operación', 403, 'FORBIDDEN');
  }
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
    if (!payload?.userId || payload.type !== 'access') return null;
    if (!await isAuthSessionActive(payload.sessionId, payload.userId)) return null;

    return await loadServerUser(payload.userId);
  } catch (error) {
    console.error('Error en getServerUserSession:', error);
    return null;
  }
}

export async function getRequestUserSession(request: Request): Promise<ServerUserSession | null> {
  const payload = authenticateRequest(request);
  if (!payload?.userId || payload.type !== 'access') return null;
  if (!await isAuthSessionActive(payload.sessionId, payload.userId)) return null;
  return loadServerUser(payload.userId);
}

export function requireValidMutationOrigin(request: Request): void {
  const validation = validateMutationOrigin(request);
  if (!validation.valid) {
    throw new AuthorizationError('Origen de solicitud no permitido', 403, 'FORBIDDEN');
  }
}

export async function requireRequestActor(
  request: Request,
  roles?: readonly SystemRole[],
): Promise<AuthorizationActor> {
  requireValidMutationOrigin(request);
  const session = await getRequestUserSession(request);
  if (!session) {
    throw new AuthorizationError('Autenticación requerida');
  }

  const actor = toAuthorizationActor(session);
  assertAllowedRole(actor, roles);
  return actor;
}

export async function requireServerActor(
  roles?: readonly SystemRole[],
): Promise<AuthorizationActor> {
  const session = await getServerUserSession();
  if (!session) {
    throw new AuthorizationError('Autenticación requerida');
  }

  const actor = toAuthorizationActor(session);
  assertAllowedRole(actor, roles);
  return actor;
}

export function authorizationErrorResponse(error: unknown): NextResponse | null {
  if (!(error instanceof AuthorizationError)) return null;
  return NextResponse.json(
    { success: false, error: error.message, code: error.code },
    { status: error.status },
  );
}

export async function requireUserManager(targetUserId: string): Promise<AuthorizationActor> {
  const actor = await requireServerActor();
  const users = await queryDB<{ id: string; role: string; organization_id: string | null }>(
    'SELECT id, role, organization_id FROM users WHERE id = ? LIMIT 1',
    [targetUserId],
  );
  const target = users[0];
  if (!target || !canManageUser(actor, {
    userId: target.id,
    role: target.role,
    organizationId: target.organization_id,
  })) {
    throw new AuthorizationError('No puedes administrar este usuario', 403, 'FORBIDDEN');
  }
  return actor;
}

export async function requireTeamManager(teamId: string): Promise<AuthorizationActor> {
  const actor = await requireServerActor();
  const teams = await queryDB<{
    id: string;
    captain_id: string | null;
    organization_id: string | null;
  }>('SELECT id, captain_id, organization_id FROM teams WHERE id = ? LIMIT 1', [teamId]);
  const team = teams[0];
  if (!team) throw new AuthorizationError('Equipo no encontrado', 403, 'FORBIDDEN');

  const managers = await queryDB<{ user_id: string }>(
    `SELECT user_id FROM team_members
      WHERE team_id = ? AND role_in_team IN ('Capitan', 'Capitán', 'Encargado', 'DT / Analyst')`,
    [teamId],
  );

  if (!canManageTeam(actor, {
    captainId: team.captain_id,
    organizationId: team.organization_id,
    managerIds: managers.map((manager) => manager.user_id),
  })) {
    throw new AuthorizationError('No puedes administrar este equipo', 403, 'FORBIDDEN');
  }
  return actor;
}

export async function requireCompetitionManager(competitionId: string): Promise<AuthorizationActor> {
  const actor = await requireServerActor();
  const competitions = await queryDB<{
    id: string;
    organization_id: string | null;
    organizer_id: string | null;
  }>(
    `SELECT id, organization_id, organizer_id FROM competitions WHERE id = ?
     UNION ALL
     SELECT id, organization_id, organizer_id FROM tournaments WHERE id = ?
     LIMIT 1`,
    [competitionId, competitionId],
  );
  const competition = competitions[0];
  if (!competition || !canManageCompetition(actor, {
    organizationId: competition.organization_id,
    organizerId: competition.organizer_id,
  })) {
    throw new AuthorizationError('No puedes administrar esta competencia', 403, 'FORBIDDEN');
  }
  return actor;
}

export async function requireThreadParticipant(threadId: string): Promise<AuthorizationActor> {
  const actor = await requireServerActor();
  if (actor.role === 'Administrador') return actor;

  const rows = await queryDB<{ allowed: number }>(
    `SELECT EXISTS(
       SELECT 1 FROM chat_threads
        WHERE id = ? AND (participant_a_id = ? OR participant_b_id = ?)
     ) AS allowed`,
    [threadId, actor.userId, actor.userId],
  );
  if (!rows[0]?.allowed) {
    throw new AuthorizationError('No perteneces a esta conversación', 403, 'FORBIDDEN');
  }
  return actor;
}

export async function requireMatchReporter(matchId: string): Promise<AuthorizationActor> {
  const actor = await requireServerActor();
  if (actor.role === 'Administrador') return actor;

  const matches = await queryDB<{
    competition_id: string | null;
    home_team_id: string | null;
    away_team_id: string | null;
    team_home_id: string | null;
    team_away_id: string | null;
  }>(
    `SELECT competition_id, home_team_id, away_team_id, team_home_id, team_away_id
       FROM matches WHERE id = ? LIMIT 1`,
    [matchId],
  );
  const match = matches[0];
  if (!match) throw new AuthorizationError('Partido no encontrado', 403, 'FORBIDDEN');

  const competitionId = match.competition_id;
  if (actor.role === 'Organizador' && competitionId) {
    try {
      await requireCompetitionManager(competitionId);
      return actor;
    } catch (error) {
      if (!(error instanceof AuthorizationError)) throw error;
    }
  }

  const teamIds = [
    match.home_team_id || match.team_home_id,
    match.away_team_id || match.team_away_id,
  ].filter((teamId): teamId is string => Boolean(teamId));
  if (teamIds.length === 0) throw new AuthorizationError('El partido no tiene equipos asignados', 403, 'FORBIDDEN');

  const placeholders = teamIds.map(() => '?').join(', ');
  const participants = await queryDB<{ user_id: string }>(
    `SELECT captain_id AS user_id FROM teams WHERE id IN (${placeholders})
     UNION
     SELECT user_id FROM team_members
      WHERE team_id IN (${placeholders})
        AND role_in_team IN ('Capitan', 'Capitán', 'Encargado', 'DT / Analyst')`,
    [...teamIds, ...teamIds],
  );
  if (!participants.some((participant) => participant.user_id === actor.userId)) {
    throw new AuthorizationError('No puedes reportar este partido', 403, 'FORBIDDEN');
  }
  return actor;
}
