// @ts-nocheck
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { dbProvider } from '@/lib/db/provider';
import { GAMES_CATALOG } from '@/lib/games-data';
import {
  OrganizationProfileView,
  type AffiliatedTeam,
  type CompetitionData,
  type OrganizerUser,
  type OrgMatch,
  type OrgProfileData,
} from '@/components/tournaments/organization-profile-view';

interface OrganizationRow extends OrgProfileData {
  logo_url?: string;
  banner_url?: string;
  founded_year?: string | number;
  allowed_games?: string | string[];
  redes_sociales?: string | Record<string, string>;
}

function parseField<T>(value: string | T | null | undefined, fallback: T): T {
  if (typeof value !== 'string') return value ?? fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

export default async function GlobalOrganizationPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const orgRawCamel = await dbProvider.organizations.findById(orgId);
  const orgRaw = orgRawCamel ? {
    ...orgRawCamel,
    logo_url: orgRawCamel.logoUrl || undefined,
    banner_url: orgRawCamel.bannerUrl || undefined,
    allowed_games: orgRawCamel.allowedGames,
  } as unknown as OrganizationRow : undefined;

  if (!orgRaw) return <main className="public-team-state"><Building2 className="size-10" /><h1>Organización no encontrada</h1><Link href="/organizaciones">Volver al directorio</Link></main>;

  const allowedGames = parseField<string[]>(orgRaw.allowed_games, orgRaw.allowedGames || ['eafc26']);
  const gameSlug = allowedGames[0] || 'eafc26';
  const gameConfig = GAMES_CATALOG[gameSlug] || GAMES_CATALOG.eafc26;
  const org = {
    ...orgRaw,
    logoUrl: orgRaw.logo_url || orgRaw.logoUrl || '/images/default/logo-default.png',
    bannerUrl: orgRaw.banner_url || orgRaw.bannerUrl || gameConfig.bannerUrl || '/images/default/banner-default.jpg',
    foundedYear: String(orgRaw.founded_year || orgRaw.foundedYear || '2022'),
    allowedGames,
    socialMedia: parseField<Record<string, string>>(orgRaw.redes_sociales, orgRaw.socialMedia || {}),
  };

  const orgUsers = await dbProvider.users.findAll({ where: { organization_id: orgId } });
  const userIds = orgUsers.map(u => u.id);
  
  const organizers: OrganizerUser[] = orgUsers
    .filter(u => u.role === 'Organizador')
    .map(u => ({ id: u.id, name: u.name, gamertag: u.gamertag, email: u.email, role: u.role, avatar_url: u.avatarUrl || '' }));

  const compsByOrg = await dbProvider.competitions.findByOrganization(orgId);
  const compsByUsers = userIds.length > 0 ? await dbProvider.competitions.findAll({ where: { organizer_id: userIds } }) : [];
  const combinedComps = [...compsByOrg, ...compsByUsers].filter(c => c.status !== 'Borrador');
  const uniqueComps = Array.from(new Map(combinedComps.map(c => [c.id, c])).values());
  uniqueComps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const compIds = uniqueComps.map(c => c.id);
  const allMatchesRaw = compIds.length > 0 ? await dbProvider.matches.findAll({ where: { competition_id: compIds } }) : [];
  
  const matchCounts = new Map<string, number>();
  for (const m of allMatchesRaw) {
    if (m.competitionId) matchCounts.set(m.competitionId, (matchCounts.get(m.competitionId) || 0) + 1);
  }

  const competitions: CompetitionData[] = uniqueComps.map(c => ({
    id: c.id, name: c.name, game_slug: c.gameSlug,
    organizer_id: c.organizerId, organizer_name: c.organizerName,
    organization_id: c.organizationId, season_id: c.seasonId,
    prize_pool: c.prizePool, transfer_market_mode: c.transferMarketMode as any,
    mode_format: c.modeFormat, status: c.status as any,
    fecha_limite_inscripcion: c.fechaLimiteInscripcion,
    fecha_inicio: c.fechaInicio, fecha_termino: c.fechaTermino,
    description: c.description, created_at: c.createdAt,
    total_matches: matchCounts.get(c.id) || 0,
  }));

  const teamsRaw = await dbProvider.teams.findByOrganization(orgId);
  const teams: AffiliatedTeam[] = teamsRaw.slice(0, 24).map(t => ({
    id: t.id, name: t.name, tag: t.tag, game_slug: t.gameSlug,
    organization_id: t.organizationId, captain_id: t.captainId,
    captain_name: t.captainName, platform: t.platform,
    members_count: t.membersCount, max_members: t.maxMembers,
    color: t.color, logo_text: t.logoText, description: t.description,
    vacant_positions: JSON.stringify(t.vacantPositions),
    logo_url: t.logoUrl, banner_url: t.bannerUrl, status: t.status,
    club_id_ea: t.clubIdEa, created_at: t.createdAt, updated_at: t.updatedAt,
    player_count: t.membersCount || 1,
  }));

  allMatchesRaw.sort((a, b) => new Date(b.scheduledAt || '2000').getTime() - new Date(a.scheduledAt || '2000').getTime());
  const recentMatchesRaw = allMatchesRaw.slice(0, 12);
  
  const allTeamIds = Array.from(new Set(recentMatchesRaw.flatMap(m => [m.homeTeamId, m.teamHomeId, m.awayTeamId, m.teamAwayId]).filter(Boolean))) as string[];
  const matchTeamsRaw = allTeamIds.length > 0 ? await dbProvider.teams.findAll({ where: { id: allTeamIds } }) : [];
  const teamMap = new Map(matchTeamsRaw.map(t => [t.id, t]));
  const compMap = new Map(uniqueComps.map(c => [c.id, c]));

  const matches: OrgMatch[] = recentMatchesRaw.map(m => {
    const homeTeam = teamMap.get(m.teamHomeId || m.homeTeamId || '');
    const awayTeam = teamMap.get(m.teamAwayId || m.awayTeamId || '');
    const comp = compMap.get(m.competitionId || '');
    
    return {
      id: m.id, tournament_id: m.tournamentId, competition_id: m.competitionId || undefined,
      round: m.round, matchday: m.matchday, round_name: m.roundName, group_name: m.groupName,
      team_home_id: m.teamHomeId, home_team_id: m.homeTeamId,
      team_away_id: m.teamAwayId, away_team_id: m.awayTeamId,
      home_team_name: homeTeam?.name || m.homeTeamName,
      home_team_tag: homeTeam?.tag || m.homeTeamTag,
      away_team_name: awayTeam?.name || m.awayTeamName,
      away_team_tag: awayTeam?.tag || m.awayTeamTag,
      score_home: m.scoreHome, score_away: m.scoreAway,
      reported_score_home: m.reportedScoreHome, reported_score_away: m.reportedScoreAway,
      winner_team_id: m.winnerTeamId, proof_url: m.proofUrl,
      reported_by_user_id: m.reportedByUserId, next_match_id: m.nextMatchId,
      next_match_slot: m.nextMatchSlot, scheduled_at: m.scheduledAt,
      scheduled_time: m.scheduledTime, status: m.status,
      competition_name: comp?.name,
      home_logo: homeTeam?.logoUrl,
      away_logo: awayTeam?.logoUrl,
    };
  });

  return (
    <main className="public-team-page" style={{ '--game-brand': gameConfig.brandColor, '--game-accent': gameConfig.accentColor } as React.CSSProperties}>
      <OrganizationProfileView gameSlug={gameSlug} gameConfig={gameConfig} org={org} competitions={competitions} organizers={organizers} teams={teams} matches={matches} context="global" />
    </main>
  );
}
