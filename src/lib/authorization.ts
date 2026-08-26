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

  return Boolean(
    isOrganizer(actor) &&
      normalizeRole(target.role) !== 'Administrador' &&
      actor.organizationId &&
      actor.organizationId === target.organizationId,
  );
}

export function canAssignRole(
  actor: AuthorizationActor,
  requestedRole: string,
): boolean {
  const role = normalizeRole(requestedRole);
  if (!role) return false;
  if (isAdministrator(actor)) return true;
  return isOrganizer(actor) && role !== 'Administrador';
}

export function canManageTeam(
  actor: AuthorizationActor,
  team: TeamResource,
): boolean {
  if (isAdministrator(actor)) return true;
  if (isOrganizer(actor) && belongsToActorOrganization(actor, team)) return true;
  if (team.captainId === actor.userId) return true;
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
