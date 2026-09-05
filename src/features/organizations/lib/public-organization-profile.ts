import {
  type AffiliatedTeam,
  type CompetitionData,
  type OrganizerUser,
  type OrgMatch,
  type OrgProfileData,
} from '@/components/tournaments/organization-profile-view';
import { dbProvider } from '@/lib/db/provider';
import { GAMES_CATALOG } from '@/lib/games-data';

interface OrganizationRow extends OrgProfileData {
  logo_url?: string;
  banner_url?: string;
  founded_year?: string | number;
  allowed_games?: string | string[];
  redes_sociales?: string | Record<string, string>;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  whatsapp?: string;
}

function parseJsonField<T>(value: string | T | null | undefined, fallback: T): T {
  if (typeof value !== 'string') return value ?? fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function getPublicOrganizationProfile(gameSlug: string, orgId: string) {
  const gameConfig = GAMES_CATALOG[gameSlug] || GAMES_CATALOG.eafc26;
  const organizationRecord = await dbProvider.organizations.findById(orgId);
  if (!organizationRecord) return { gameConfig, profile: null };

  const orgRaw = {
    ...organizationRecord,
    logo_url: organizationRecord.logoUrl || undefined,
    banner_url: organizationRecord.bannerUrl || undefined,
    allowed_games: organizationRecord.allowedGames,
  } as unknown as OrganizationRow;
  const parsedSocials = parseJsonField<Record<string, string>>(orgRaw.redes_sociales, {});
  const org = {
    ...orgRaw,
    logoUrl: orgRaw.logo_url || orgRaw.logoUrl || '/images/default/logo-default.png',
    bannerUrl: orgRaw.banner_url || orgRaw.bannerUrl || gameConfig.bannerUrl || '/images/default/banner-default.jpg',
    foundedYear: String(orgRaw.founded_year || orgRaw.foundedYear || '2022'),
    allowedGames: parseJsonField<string[]>(orgRaw.allowed_games, [gameSlug]),
    socialMedia: {
      ...parsedSocials,
      ...(orgRaw.instagram ? { instagram: orgRaw.instagram } : {}),
      ...(orgRaw.twitter ? { twitter: orgRaw.twitter } : {}),
      ...(orgRaw.tiktok ? { tiktok: orgRaw.tiktok } : {}),
      ...(orgRaw.whatsapp ? { whatsapp: orgRaw.whatsapp } : {}),
    },
  };

  const orgUsers = await dbProvider.users.findAll({ where: { organization_id: orgId } });
  const userIds = orgUsers.map((user) => user.id);
  const organizers: OrganizerUser[] = orgUsers.filter((user) => user.role === 'Organizador').map((user) => ({
    id: user.id, name: user.name, gamertag: user.gamertag, email: user.email, role: user.role, avatar_url: user.avatarUrl || '',
  }));
  const byOrganization = await dbProvider.competitions.findByOrganization(orgId);
  const byOrganizer = userIds.length ? await dbProvider.competitions.findAll({ where: { organizer_id: userIds } }) : [];
  const competitionsRaw = Array.from(new Map(
    [...byOrganization, ...byOrganizer]
      .filter((competition) => competition.status !== 'Borrador' && competition.gameSlug === gameSlug)
      .map((competition) => [competition.id, competition]),
  ).values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const competitionIds = competitionsRaw.map((competition) => competition.id);
  const allMatches = competitionIds.length ? await dbProvider.matches.findAll({ where: { competition_id: competitionIds } }) : [];
  const matchCounts = new Map<string, number>();
  const finishedCounts = new Map<string, number>();
  for (const match of allMatches) {
    if (!match.competitionId) continue;
    matchCounts.set(match.competitionId, (matchCounts.get(match.competitionId) || 0) + 1);
    if (match.status === 'FINALIZADO') finishedCounts.set(match.competitionId, (finishedCounts.get(match.competitionId) || 0) + 1);
  }
  const competitions: CompetitionData[] = competitionsRaw.map((competition) => ({
    id: competition.id, name: competition.name, game_slug: competition.gameSlug,
    organizer_id: competition.organizerId, organizer_name: competition.organizerName,
    organization_id: competition.organizationId, season_id: competition.seasonId,
    prize_pool: competition.prizePool,
    transfer_market_mode: competition.transferMarketMode as CompetitionData['transfer_market_mode'],
    mode_format: competition.modeFormat, status: competition.status as CompetitionData['status'],
    fecha_limite_inscripcion: competition.fechaLimiteInscripcion,
    fecha_inicio: competition.fechaInicio, fecha_termino: competition.fechaTermino,
    description: competition.description, created_at: competition.createdAt,
    total_matches: matchCounts.get(competition.id) || 0,
    finished_matches: finishedCounts.get(competition.id) || 0,
  }));

  const teamsByOrganization = await dbProvider.teams.findByOrganization(orgId);
  const teamsByGame = await dbProvider.teams.findByGameSlug(gameSlug);
  const teamsRaw = Array.from(new Map([...teamsByOrganization, ...teamsByGame].map((team) => [team.id, team])).values())
    .sort((a, b) => a.name.localeCompare(b.name));
  const teams: AffiliatedTeam[] = teamsRaw.slice(0, 12).map((team) => ({
    id: team.id, name: team.name, tag: team.tag, game_slug: team.gameSlug,
    organization_id: team.organizationId, captain_id: team.captainId, captain_name: team.captainName,
    platform: team.platform, members_count: team.membersCount, max_members: team.maxMembers,
    color: team.color, logo_text: team.logoText, description: team.description,
    vacant_positions: JSON.stringify(team.vacantPositions), logo_url: team.logoUrl, banner_url: team.bannerUrl,
    status: team.status, club_id_ea: team.clubIdEa, created_at: team.createdAt, updated_at: team.updatedAt,
    player_count: team.membersCount || 1,
  }));

  allMatches.sort((a, b) => new Date(b.scheduledAt || '2000').getTime() - new Date(a.scheduledAt || '2000').getTime());
  const recentMatches = allMatches.slice(0, 8);
  const teamIds = Array.from(new Set(recentMatches.flatMap((match) => [match.homeTeamId, match.teamHomeId, match.awayTeamId, match.teamAwayId]).filter(Boolean))) as string[];
  const matchTeams = teamIds.length ? await dbProvider.teams.findAll({ where: { id: teamIds } }) : [];
  const teamMap = new Map(matchTeams.map((team) => [team.id, team]));
  const competitionMap = new Map(competitionsRaw.map((competition) => [competition.id, competition]));
  const matches: OrgMatch[] = recentMatches.map((match) => {
    const homeTeam = teamMap.get(match.teamHomeId || match.homeTeamId || '');
    const awayTeam = teamMap.get(match.teamAwayId || match.awayTeamId || '');
    const competition = competitionMap.get(match.competitionId || '');
    return {
      id: match.id, tournament_id: match.tournamentId, competition_id: match.competitionId,
      round: match.round, matchday: match.matchday, round_name: match.roundName, group_name: match.groupName,
      team_home_id: match.teamHomeId, home_team_id: match.homeTeamId,
      team_away_id: match.teamAwayId, away_team_id: match.awayTeamId,
      home_team_name: homeTeam?.name || match.homeTeamName,
      home_team_tag: homeTeam?.tag || match.homeTeamTag || (homeTeam?.name ? homeTeam.name.slice(0, 3).toUpperCase() : 'LOC'),
      away_team_name: awayTeam?.name || match.awayTeamName,
      away_team_tag: awayTeam?.tag || match.awayTeamTag || (awayTeam?.name ? awayTeam.name.slice(0, 3).toUpperCase() : 'VIS'),
      score_home: match.scoreHome, score_away: match.scoreAway,
      reported_score_home: match.reportedScoreHome, reported_score_away: match.reportedScoreAway,
      winner_team_id: match.winnerTeamId, proof_url: match.proofUrl, reported_by_user_id: match.reportedByUserId,
      next_match_id: match.nextMatchId, next_match_slot: match.nextMatchSlot,
      scheduled_at: match.scheduledAt, scheduled_time: match.scheduledTime, status: match.status,
      competition_name: competition?.name, home_logo: homeTeam?.logoUrl, away_logo: awayTeam?.logoUrl,
    };
  });

  return { gameConfig, profile: { org, competitions, organizers, teams, matches } };
}
