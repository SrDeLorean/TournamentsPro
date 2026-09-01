// @ts-nocheck
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
  const user = await import('./db/provider').then(m => m.dbProvider.users.findById(userId));
  
  if (!user || user.isBanned || user.status === 'Baneado' || user.status === 'Suspendido') {
    return null;
  }

  // Find owned org if any
  const ownedOrgs = await import('./db/provider').then(m => m.dbProvider.organizations.findAll({ where: { owner_id: userId }, limit: 1 }));
  const owned_org_id = ownedOrgs[0]?.id || null;

  const organizationId = user.organizationId || owned_org_id || null;
  let allowedGames: string[] = [];

  if (organizationId) {
    const org = await import('./db/provider').then(m => m.dbProvider.organizations.findById(organizationId));
    if (org && org.allowedGames) {
      if (Array.isArray(org.allowedGames)) {
        allowedGames = org.allowedGames as string[];
      } else if (typeof org.allowedGames === 'string') {
        try {
          const parsed = JSON.parse(org.allowedGames);
          allowedGames = Array.isArray(parsed) ? parsed : [];
        } catch {
          allowedGames = org.allowedGames.split(',').map((g: string) => g.trim()).filter(Boolean);
        }
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
  const target = await import('./db/provider').then(m => m.dbProvider.users.findById(targetUserId));
  if (!target || !canManageUser(actor, {
    userId: target.id,
    role: target.role,
    organizationId: target.organizationId,
  })) {
    throw new AuthorizationError('No puedes administrar este usuario', 403, 'FORBIDDEN');
  }
  return actor;
}

export async function requireTeamManager(teamId: string): Promise<AuthorizationActor> {
  const actor = await requireServerActor();
  if (actor.role === 'Administrador') return actor;

  const db = (await import('./db/provider')).dbProvider;
  const team = await db.teams.findById(teamId);
  if (!team) throw new AuthorizationError('Equipo no encontrado', 404, 'NOT_FOUND');

  // Fetch managers and participating orgs for full security evaluation
  const [managerMembers, participatingComps] = await Promise.all([
    db.query<{ user_id: string }>(
      `SELECT user_id FROM team_members 
       WHERE team_id = ? AND role_in_team IN ('Capitán', 'Capitan', 'Encargado', 'DT / Analyst', 'Manager', 'Co-Capitán')`,
      [teamId],
    ).catch(() => []),
    db.query<{ organization_id: string }>(
      `SELECT DISTINCT c.organization_id 
       FROM competition_teams ct 
       JOIN competitions c ON ct.competition_id = c.id 
       WHERE ct.team_id = ? AND c.organization_id IS NOT NULL`,
      [teamId],
    ).catch(() => []),
  ]);

  const managerIds = Array.from(
    new Set([
      team.captainId,
      ...managerMembers.map((m) => m.user_id),
    ].filter(Boolean) as string[]),
  );

  const participatingOrgIds = participatingComps
    .map((c) => c.organization_id)
    .filter(Boolean);

  if (!canManageTeam(actor, {
    captainId: team.captainId,
    organizationId: team.organizationId,
    managerIds,
    participatingOrgIds,
  })) {
    throw new AuthorizationError('No tienes autorización para administrar este equipo o su organización', 403, 'FORBIDDEN');
  }

  return actor;
}

export async function requireCompetitionManager(competitionId: string): Promise<AuthorizationActor> {
  const actor = await requireServerActor();
  const competition = await import('./db/provider').then(m => m.dbProvider.competitions.findById(competitionId));
  if (!competition || !canManageCompetition(actor, {
    organizationId: competition.organizationId,
    organizerId: competition.organizerId,
  })) {
    throw new AuthorizationError('No puedes administrar esta competencia', 403, 'FORBIDDEN');
  }
  return actor;
}

export async function requireThreadParticipant(threadId: string) { return await requireServerActor(); }

export async function requireMatchReporter(matchId: string) { return await requireServerActor(); }
