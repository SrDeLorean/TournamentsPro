import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ATHLETE_WORKSPACE_SECTIONS, CLUB_WORKSPACE_SECTIONS } from '@/lib/workspace-sections';

const testUser = {
  id: 'captain-test', email: 'captain@test.invalid', name: 'Captain Test', gamertag: 'CaptainTest',
  role: 'Capitan', status: 'Activo', primaryGame: 'eafc26', platform: 'CROSSPLAY', position: 'DFC',
  teamId: 'team-test', teamName: 'Test Club',
};

const testTeam = {
  id: 'team-test', name: 'Test Club', tag: 'TST', gameSlug: 'eafc26', captainId: 'captain-test',
  captainName: 'Captain Test', platform: 'CROSSPLAY', status: 'ACTIVO', membersCount: 1, maxMembers: 16,
};

vi.mock('@/components/providers/auth-provider', () => ({
  useAuth: () => ({
    currentUser: testUser, userTeams: [testTeam], refetchTeams: vi.fn(), refetchUser: vi.fn(), updateCurrentUser: vi.fn(),
  }),
}));

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => '/eafc26/atleta/ajustes',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() }),
}));

describe('authenticated workspaces server rendering', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders every athlete section without a Server Components exception', async () => {
    const { AthleteWorkspaceView } = await import('@/components/workspaces/athlete-workspace-view');

    for (const section of ATHLETE_WORKSPACE_SECTIONS) {
      expect(() => renderToStaticMarkup(createElement(AthleteWorkspaceView, { gameSlug: 'eafc26', section })), section).not.toThrow();
    }
  }, 15_000);

  it('renders every club section without a Server Components exception', async () => {
    const { ClubWorkspaceView } = await import('@/components/workspaces/club-workspace-view');

    for (const section of CLUB_WORKSPACE_SECTIONS) {
      expect(() => renderToStaticMarkup(createElement(ClubWorkspaceView, { gameSlug: 'eafc26', section })), section).not.toThrow();
    }
  }, 15_000);
});
