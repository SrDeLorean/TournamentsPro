import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { dbProvider } from '@/lib/db/provider';
import { GAMES_CATALOG } from '@/lib/games-data';
import {
  PublicCompetitionDetailView,
  type CompetitionDetail,
  type CompetitionMatch,
  type ConfirmedTeam,
} from '@/components/tournaments/public-competition-detail-view';

export const revalidate = 0;

export default async function GlobalCompetitionDetailPage({ params }: { params: Promise<{ orgId: string; compId: string }> }) {
  const { orgId, compId } = await params;
  
  const orgUsers = await dbProvider.users.findAll({ where: { organization_id: orgId } });
  const userIds = orgUsers.map(u => u.id);
  
  const compsByOrg = await dbProvider.competitions.findByOrganization(orgId);
  const compsByUsers = userIds.length > 0 ? await dbProvider.competitions.findAll({ where: { organizer_id: userIds } }) : [];
  const allComps = [...compsByOrg, ...compsByUsers];
  
  const compRaw = allComps.find(c => c.id === compId || c.id.startsWith(compId));
  if (!compRaw) return <main className="public-team-state"><Trophy className="size-10" /><h1>Competencia no encontrada</h1><Link href={`/organizaciones/${orgId}`}>Volver a la organización</Link></main>;

  const orgRaw = await dbProvider.organizations.findById(compRaw.organizationId || orgId);
  
  const competition: CompetitionDetail = {
    id: compRaw.id, name: compRaw.name, game_slug: compRaw.gameSlug,
    organizer_id: compRaw.organizerId, organizer_name: compRaw.organizerName,
    organization_id: compRaw.organizationId, season_id: compRaw.seasonId,
    prize_pool: compRaw.prizePool, transfer_market_mode: compRaw.transferMarketMode as any,
    mode_format: compRaw.modeFormat, status: compRaw.status as any,
    fecha_limite_inscripcion: compRaw.fechaLimiteInscripcion,
    fecha_inicio: compRaw.fechaInicio, fecha_termino: compRaw.fechaTermino,
    description: compRaw.description, created_at: compRaw.createdAt,
    org_name: orgRaw?.name || 'Organización Oficial',
    org_logo: orgRaw?.logoUrl || '/images/default/logo-default.png',
    org_banner: orgRaw?.bannerUrl || '/images/default/banner-default.jpg'
  };

  const [enrolledTeamsRaw, matchesRaw] = await Promise.all([
    dbProvider.competitions.getEnrolledTeams(competition.id),
    dbProvider.matches.findByCompetition(competition.id)
  ]);

  const allTeamIds = Array.from(new Set([
    ...enrolledTeamsRaw.map(t => t.team_id || t.teamId),
    ...matchesRaw.flatMap(m => [m.homeTeamId, m.teamHomeId, m.awayTeamId, m.teamAwayId])
  ].filter(Boolean))) as string[];
  
  const matchTeamsRaw = allTeamIds.length > 0 ? await dbProvider.teams.findAll({ where: { id: allTeamIds } }) : [];
  const teamMap = new Map(matchTeamsRaw.map(t => [t.id, t]));

  const teams: ConfirmedTeam[] = enrolledTeamsRaw.map(ct => {
    const t = teamMap.get(ct.team_id || ct.teamId || '');
    return {
      id: ct.id, competition_id: ct.competition_id || ct.competitionId,
      team_id: ct.team_id || ct.teamId, team_name: ct.team_name || ct.teamName,
      team_tag: ct.team_tag || ct.teamTag, status: ct.status,
      enrolled_at: ct.enrolled_at || ct.enrolledAt, updated_at: ct.updated_at || ct.updatedAt,
      team_logo: t?.logoUrl, captain_name: t?.captainName
    };
  });

  matchesRaw.sort((a, b) => {
    const aMatchday = a.matchday ?? 1;
    const bMatchday = b.matchday ?? 1;
    if (aMatchday !== bMatchday) return aMatchday - bMatchday;
    return new Date(a.createdAt || '2000').getTime() - new Date(b.createdAt || '2000').getTime();
  });

  const matches: CompetitionMatch[] = matchesRaw.map(m => {
    const homeTeam = teamMap.get(m.teamHomeId || m.homeTeamId || '');
    const awayTeam = teamMap.get(m.teamAwayId || m.awayTeamId || '');
    return {
      id: m.id, status: m.status,
      home_team_id: m.homeTeamId, team_home_id: m.teamHomeId,
      away_team_id: m.awayTeamId, team_away_id: m.teamAwayId,
      home_team_name: homeTeam?.name || m.homeTeamName,
      home_team_tag: homeTeam?.tag || m.homeTeamTag,
      home_logo: homeTeam?.logoUrl,
      away_team_name: awayTeam?.name || m.awayTeamName,
      away_team_tag: awayTeam?.tag || m.awayTeamTag,
      away_logo: awayTeam?.logoUrl,
      reported_score_home: m.reportedScoreHome, reported_score_away: m.reportedScoreAway,
      score_home: m.scoreHome, score_away: m.scoreAway,
      matchday_number: m.matchday, matchday: m.matchday,
    };
  });
  const gameConfig = GAMES_CATALOG[competition.game_slug] || GAMES_CATALOG.eafc26;

  return (
    <main className="public-team-page" style={{ '--game-brand': gameConfig.brandColor, '--game-accent': gameConfig.accentColor } as React.CSSProperties}>
      <PublicCompetitionDetailView gameSlug={competition.game_slug} orgId={orgId} gameConfig={gameConfig} competition={competition} teams={teams} matches={matches} context="global" />
    </main>
  );
}
