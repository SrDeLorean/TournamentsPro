import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  actorUser: {
    id: 'captain-1',
    name: 'Capitán',
    role: 'Capitán',
    organizationId: 'org-1',
    isBanned: false,
    status: 'Activo',
  },
  threadScope: vi.fn(),
  findUser: vi.fn(),
  findOrganizations: vi.fn(),
  findOrganization: vi.fn(),
  findMatch: vi.fn(),
  findTeam: vi.fn(),
  getManagers: vi.fn(),
  findCompetition: vi.fn(),
  validateMutationOrigin: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => ({ value: 'signed-token' }) }),
}));

vi.mock('@/lib/auth', () => ({
  verifyToken: () => ({ userId: mocks.actorUser.id, sessionId: 'session-1', type: 'access' }),
  authenticateRequest: () => ({ userId: mocks.actorUser.id, sessionId: 'session-1', type: 'access' }),
}));

vi.mock('@/lib/security', () => ({
  isAuthSessionActive: async () => true,
  validateMutationOrigin: mocks.validateMutationOrigin,
}));

vi.mock('@/lib/services/chat.service', () => ({
  getChatThreadAuthorizationScopeService: mocks.threadScope,
}));

vi.mock('@/lib/db/provider', () => ({
  dbProvider: {
    users: { findById: mocks.findUser },
    organizations: {
      findAll: mocks.findOrganizations,
      findById: mocks.findOrganization,
    },
    matches: { findById: mocks.findMatch },
    teams: {
      findById: mocks.findTeam,
      getManagers: mocks.getManagers,
    },
    competitions: { findById: mocks.findCompetition },
  },
}));

import {
  requireMatchReporter,
  requireRequestMatchReporter,
  requireThreadParticipant,
} from '@/lib/auth-server';

describe('server resource authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.actorUser.id = 'captain-1';
    mocks.actorUser.role = 'Capitán';
    mocks.findUser.mockImplementation(async () => ({ ...mocks.actorUser }));
    mocks.findOrganizations.mockResolvedValue([]);
    mocks.findOrganization.mockResolvedValue(null);
    mocks.validateMutationOrigin.mockReturnValue({ valid: true });
    mocks.findMatch.mockResolvedValue({
      id: 'match-1',
      competitionId: 'comp-1',
      homeTeamId: 'team-home',
      awayTeamId: 'team-away',
    });
    mocks.findTeam.mockImplementation(async (teamId: string) => ({
      id: teamId,
      captainId: teamId === 'team-home' ? 'captain-1' : 'captain-2',
    }));
    mocks.getManagers.mockResolvedValue([]);
    mocks.findCompetition.mockResolvedValue({
      id: 'comp-1',
      organizerId: 'organizer-1',
      organizationId: 'org-1',
    });
  });

  it('rejects reading a private thread belonging to other users', async () => {
    mocks.threadScope.mockResolvedValue({
      participantAId: 'user-a',
      participantBId: 'user-b',
    });

    await expect(requireThreadParticipant('thread-private')).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    });
  });

  it('allows a team captain to report only a match involving that team', async () => {
    await expect(requireMatchReporter('match-1')).resolves.toMatchObject({
      userId: 'captain-1',
    });

    mocks.actorUser.id = 'outsider-1';
    await expect(requireMatchReporter('match-1')).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    });
  });

  it('rejects a mutation with an invalid request origin before authorization', async () => {
    mocks.validateMutationOrigin.mockReturnValue({ valid: false, reason: 'ORIGIN_MISMATCH' });

    await expect(requireRequestMatchReporter(
      new Request('https://tournaments.test/api/matches/report', { method: 'POST' }),
      'match-1',
    )).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
    expect(mocks.findMatch).not.toHaveBeenCalled();
  });
});
