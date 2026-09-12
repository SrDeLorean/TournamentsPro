import type { TeamData } from '@/lib/data-store';

type TeamApiRecord = TeamData & {
  game_slug?: string;
  captain_id?: string;
  captain_name?: string;
  logo_url?: string;
  banner_url?: string;
  logo?: string;
  banner?: string;
};

export function normalizeTeamApiRecords(records: TeamApiRecord[]): TeamData[] {
  return records.map((team): TeamData => ({
    ...team,
    gameSlug: (team.game_slug || team.gameSlug || 'eafc26') as TeamData['gameSlug'],
    captainId: team.captain_id || team.captainId,
    captainName: team.captain_name || team.captainName,
    logoUrl: team.logo_url || team.logoUrl || team.logo,
    bannerUrl: team.banner_url || team.bannerUrl || team.banner || '',
  }));
}
