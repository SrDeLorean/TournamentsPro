import 'server-only';

import { dbProvider } from '@/lib/db/provider';
import { buildPublicPortalSummary, type PublicPortalSummary } from '@/lib/public-home-summary';

const EMPTY_SUMMARY: PublicPortalSummary = {
  counts: { users: 0, organizations: 0, teams: 0, competitions: 0, liveMatches: 0 },
  matches: [], competitions: [], organizations: [], teams: [],
};

export async function getPublicPortalSummary(gameSlug?: string): Promise<PublicPortalSummary> {
  try {
    const [users, organizations, teams, competitions, matches] = await Promise.all([
      dbProvider.users.findAll({ orderBy: 'created_at', orderDirection: 'DESC', limit: 10_000 }),
      dbProvider.organizations.findAll({ orderBy: 'created_at', orderDirection: 'DESC', limit: 10_000 }),
      dbProvider.teams.findAll({ orderBy: 'created_at', orderDirection: 'DESC', limit: 10_000 }),
      dbProvider.competitions.findAll({ orderBy: 'created_at', orderDirection: 'DESC', limit: 10_000 }),
      dbProvider.matches.findAll({ orderBy: 'scheduled_at', orderDirection: 'DESC', limit: 10_000 }),
    ]);
    return buildPublicPortalSummary({ users, organizations, teams, competitions, matches }, gameSlug);
  } catch (error) {
    console.error('Public home summary error:', error);
    return EMPTY_SUMMARY;
  }
}
