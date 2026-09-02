import { describe, expect, it } from 'vitest';
import {
  canApproveMatch,
  canAssignRole,
  canCreateOrganization,
  canManageCompetition,
  canManageOrganization,
  canManageTeam,
  canManageUser,
  canReportMatch,
  normalizeRole,
  type AuthorizationActor,
} from '../src/lib/authorization';

const admin: AuthorizationActor = {
  userId: 'admin-1',
  role: 'Administrador',
  organizationId: null,
};

const organizer: AuthorizationActor = {
  userId: 'org-user-1',
  role: 'Organizador',
  organizationId: 'org-1',
};

const captain: AuthorizationActor = {
  userId: 'captain-1',
  role: 'Capitán',
  organizationId: 'org-1',
};

describe('role normalization', () => {
  it('normalizes legacy role aliases and rejects unknown roles', () => {
    expect(normalizeRole('Admin')).toBe('Administrador');
    expect(normalizeRole('Capitan')).toBe('Capitán');
    expect(normalizeRole('superuser')).toBeNull();
  });
});

describe('organization policy', () => {
  it('only lets administrators create organizations', () => {
    expect(canCreateOrganization(admin)).toBe(true);
    expect(canCreateOrganization(organizer)).toBe(false);
  });

  it('lets organizers manage only their own organization', () => {
    expect(canManageOrganization(organizer, 'org-1')).toBe(true);
    expect(canManageOrganization(organizer, 'org-2')).toBe(false);
  });
});

describe('user policy', () => {
  it('prevents organizers from assigning or managing administrators', () => {
    expect(canAssignRole(organizer, 'Administrador')).toBe(false);
    expect(canManageUser(organizer, {
      userId: 'admin-2',
      role: 'Administrador',
      organizationId: 'org-1',
    })).toBe(false);
  });

  it('limits organizer user management to the same organization', () => {
    expect(canManageUser(organizer, {
      userId: 'player-1',
      role: 'Jugador',
      organizationId: 'org-1',
    })).toBe(true);
    expect(canManageUser(organizer, {
      userId: 'player-2',
      role: 'Jugador',
      organizationId: 'org-2',
    })).toBe(false);
  });
});

describe('team and competition policy', () => {
  it('lets captains manage only teams they captain or manage', () => {
    expect(canManageTeam(captain, { captainId: 'captain-1' })).toBe(true);
    expect(canManageTeam(captain, { captainId: 'captain-2', managerIds: ['captain-1'] })).toBe(true);
    expect(canManageTeam(captain, { captainId: 'captain-2' })).toBe(false);
  });

  it('allows organizers to manage their organization teams, independent teams, and participating teams', () => {
    expect(canManageTeam(organizer, { organizationId: 'org-1' })).toBe(true);
    expect(canManageTeam(organizer, { organizationId: null })).toBe(true);
    expect(canManageTeam(organizer, { organizationId: 'org-2', participatingOrgIds: ['org-1'] })).toBe(true);
    expect(canManageTeam(organizer, { organizationId: 'org-2', participatingOrgIds: ['org-3'] })).toBe(false);
  });

  it('scopes organizers to owned competitions', () => {
    expect(canManageCompetition(organizer, { organizationId: 'org-1' })).toBe(true);
    expect(canApproveMatch(organizer, { organizerId: 'org-user-1' })).toBe(true);
    expect(canManageCompetition(organizer, { organizationId: 'org-2' })).toBe(false);
  });

  it('allows match reports only from participants or administrators', () => {
    expect(canReportMatch(captain, ['captain-1', 'player-2'])).toBe(true);
    expect(canReportMatch(captain, ['player-2'])).toBe(false);
    expect(canReportMatch(admin, [])).toBe(true);
  });
});
