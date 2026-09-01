export const SYSTEM_ROLES = ['Administrador', 'Organizador', 'Capitán', 'Jugador'] as const;

export type SystemRole = (typeof SYSTEM_ROLES)[number];

export interface AuthorizationActor {
  userId: string;
  role: SystemRole;
  organizationId: string | null;
}

export interface OwnedResource {
  organizationId?: string | null;
  ownerId?: string | null;
  organizerId?: string | null;
}

export interface TeamResource extends OwnedResource {
  captainId?: string | null;
  managerIds?: string[];
  participatingOrgIds?: string[];
}

export function normalizeRole(role: string): SystemRole | null {
  if (role === 'Admin') return 'Administrador';
  if (role === 'Capitan') return 'Capitán';
  return SYSTEM_ROLES.includes(role as SystemRole) ? (role as SystemRole) : null;
}

export function isAdministrator(actor: AuthorizationActor): boolean {
  return actor.role === 'Administrador';
}

export function isOrganizer(actor: AuthorizationActor): boolean {
  return actor.role === 'Organizador';
}

export function belongsToActorOrganization(
  actor: AuthorizationActor,
  resource: OwnedResource,
): boolean {
  return Boolean(
    actor.organizationId &&
      resource.organizationId &&
      actor.organizationId === resource.organizationId,
  );
}

export function canCreateOrganization(actor: AuthorizationActor): boolean {
  return isAdministrator(actor);
}

export function canManageOrganization(
  actor: AuthorizationActor,
  organizationId: string,
): boolean {
  return isAdministrator(actor) || (
    isOrganizer(actor) && actor.organizationId === organizationId
  );
}

export function canManageUser(
  actor: AuthorizationActor,
  target: { userId: string; role: string; organizationId?: string | null },
): boolean {
  if (isAdministrator(actor)) return true;
  if (actor.userId === target.userId) return true;

  const targetRole = normalizeRole(target.role);
  return Boolean(
    isOrganizer(actor) &&
      targetRole !== 'Administrador' &&
      targetRole !== 'Organizador'
  );
}

export function canAssignRole(
  actor: AuthorizationActor,
  requestedRole: string,
): boolean {
  const role = normalizeRole(requestedRole);
  if (!role) return false;
  if (isAdministrator(actor)) return true;
  return isOrganizer(actor) && role !== 'Administrador' && role !== 'Organizador';
}

export function canManageTeam(
  actor: AuthorizationActor,
  team: TeamResource,
): boolean {
  // 1. Administrador global: Acceso total a cualquier equipo
  if (isAdministrator(actor)) return true;

  // 2. Organizador: Solo si el equipo pertenece a su organización o compite en ella
  if (isOrganizer(actor)) {
    if (!actor.organizationId) return false;
    if (team.organizationId && team.organizationId === actor.organizationId) return true;
    if (team.participatingOrgIds && team.participatingOrgIds.includes(actor.organizationId)) return true;
    return false;
  }

  // 3. Capitán / Encargado: Acceso a su propio equipo
  if (team.captainId && team.captainId === actor.userId) return true;
  return team.managerIds?.includes(actor.userId) ?? false;
}

export function canManageCompetition(
  actor: AuthorizationActor,
  competition: OwnedResource,
): boolean {
  if (isAdministrator(actor)) return true;
  if (!isOrganizer(actor)) return false;
  return competition.organizerId === actor.userId || belongsToActorOrganization(actor, competition);
}

export function canApproveMatch(
  actor: AuthorizationActor,
  competition: OwnedResource,
): boolean {
  return canManageCompetition(actor, competition);
}

export function canReportMatch(
  actor: AuthorizationActor,
  participantUserIds: readonly string[],
): boolean {
  return isAdministrator(actor) || participantUserIds.includes(actor.userId);
}
