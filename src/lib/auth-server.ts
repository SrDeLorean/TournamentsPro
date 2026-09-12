import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { authenticateRequest, verifyToken } from '@/lib/auth';
import { dbProvider } from '@/lib/db/provider';
import { getChatThreadAuthorizationScopeService } from '@/lib/services/chat.service';
import { isAuthSessionActive, validateMutationOrigin } from '@/lib/security';
import {
  canAccessThread,
  canManageCompetition,
  canManageTeam,
  canManageUser,
  canReportMatch,
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

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403 | 404 = 401,
    public readonly code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' = 'UNAUTHORIZED',
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

async function loadServerUser(userId: string): Promise<ServerUserSession | null> {
  const user = await dbProvider.users.findById(userId);
  
  if (!user || user.isBanned || user.status === 'Baneado' || user.status === 'Suspendido') {
    return null;
  }

  // Find owned org if any
  const ownedOrgs = await dbProvider.organizations.findAll({ where: { owner_id: userId }, limit: 1 });
  const owned_org_id = ownedOrgs[0]?.id || null;

  const organizationId = user.organizationId || owned_org_id || null;
  let allowedGames: string[] = [];

  if (organizationId) {
    const org = await dbProvider.organizations.findById(organizationId);
    if (org && org.allowedGames) {
      if (Array.isArray(org.allowedGames)) {
        allowedGames = org.allowedGames as string[];
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
  const target = await dbProvider.users.findById(targetUserId);
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

  const team = await dbProvider.teams.findById(teamId);
  if (!team) throw new AuthorizationError('Equipo no encontrado', 404, 'NOT_FOUND');

  // Fetch managers and participating orgs for full security evaluation
  const [managerIdsFromRepository, participatingOrganizations] = await Promise.all([
    dbProvider.teams.getManagers(teamId),
    dbProvider.teams.getTeamCompetitionOrganizations(teamId),
  ]);

  const managerIds = Array.from(
    new Set([
      team.captainId,
      ...managerIdsFromRepository,
    ].filter(Boolean) as string[]),
  );

  const participatingOrgIds = participatingOrganizations
    .map((organization) => organization.org_id)
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
  const competition = await dbProvider.competitions.findById(competitionId);
  if (!competition || !canManageCompetition(actor, {
    organizationId: competition.organizationId,
    organizerId: competition.organizerId,
  })) {
    throw new AuthorizationError('No puedes administrar esta competencia', 403, 'FORBIDDEN');
  }
  return actor;
}

export async function requireThreadParticipant(threadId: string): Promise<AuthorizationActor> {
  const actor = await requireServerActor();
  const thread = await getChatThreadAuthorizationScopeService(threadId);
  if (!thread) {
    throw new AuthorizationError('Conversación no encontrada', 404, 'NOT_FOUND');
  }
  if (!canAccessThread(actor, thread)) {
    throw new AuthorizationError('No tienes acceso a esta conversación', 403, 'FORBIDDEN');
  }
  return actor;
}

async function assertMatchReporter(
  actor: AuthorizationActor,
  matchId: string,
): Promise<AuthorizationActor> {
  const match = await dbProvider.matches.findById(matchId);
  if (!match) {
    throw new AuthorizationError('Partido no encontrado', 404, 'NOT_FOUND');
  }

  if (actor.role === 'Administrador') return actor;

  const competitionId = match.competitionId || match.tournamentId;
  if (actor.role === 'Organizador' && competitionId) {
    const competition = await dbProvider.competitions.findById(competitionId);
    if (competition && canManageCompetition(actor, {
      organizationId: competition.organizationId,
      organizerId: competition.organizerId,
    })) {
      return actor;
    }
  }

  const teamIds = Array.from(new Set([
    match.homeTeamId || match.teamHomeId,
    match.awayTeamId || match.teamAwayId,
  ].filter((teamId): teamId is string => Boolean(teamId))));

  const participantIds = new Set<string>();
  await Promise.all(teamIds.map(async (teamId) => {
    const [team, managerIds] = await Promise.all([
      dbProvider.teams.findById(teamId),
      dbProvider.teams.getManagers(teamId),
    ]);
    if (team?.captainId) participantIds.add(team.captainId);
    for (const managerId of managerIds) participantIds.add(managerId);
  }));

  if (!canReportMatch(actor, [...participantIds])) {
    throw new AuthorizationError('No puedes reportar este partido', 403, 'FORBIDDEN');
  }
  return actor;
}

export async function requireMatchReporter(matchId: string): Promise<AuthorizationActor> {
  return assertMatchReporter(await requireServerActor(), matchId);
}

export async function requireRequestMatchReporter(
  request: Request,
  matchId: string,
): Promise<AuthorizationActor> {
  return assertMatchReporter(await requireRequestActor(request), matchId);
}
