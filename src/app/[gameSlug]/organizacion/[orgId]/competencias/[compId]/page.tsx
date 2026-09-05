import React from 'react';
import Link from 'next/link';
import { dbProvider } from '@/lib/db/provider';
import { GAMES_CATALOG } from '@/lib/games-data';
import { Trophy } from 'lucide-react';

import {
  PublicCompetitionDetailView,
  type CompetitionDetail,
  type CompetitionMatch,
  type ConfirmedTeam,
} from '@/components/tournaments/public-competition-detail-view';

export const revalidate = 0;

export default async function PublicCompetitionDetailPage({
  params,
}: {
  params: Promise<{ gameSlug: string; orgId: string; compId: string }>;
}) {
  const { gameSlug, orgId, compId } = await params;
  const gameConfig = GAMES_CATALOG[gameSlug] || GAMES_CATALOG['eafc26'];

  const orgUsers = await dbProvider.users.findAll({ where: { organization_id: orgId } });
  const userIds = orgUsers.map(u => u.id);
  
  let allComps = [];
  if (orgId === 'all') {
    allComps = await dbProvider.competitions.findByGameSlug(gameSlug);
  } else {
    const compsByOrg = await dbProvider.competitions.findByOrganization(orgId);
    const compsByUsers = userIds.length > 0 ? await dbProvider.competitions.findAll({ where: { organizer_id: userIds } }) : [];
    allComps = [...compsByOrg, ...compsByUsers].filter(c => c.gameSlug === gameSlug);
  }
  
  const compRaw = allComps.find(c => c.id === compId || c.id.startsWith(compId));

  if (!compRaw) {
    return (
      <div
        className="min-h-screen pb-20 relative transition-all duration-500 text-[var(--text-primary)] bg-[var(--bg-main)]"
        style={{
          '--game-brand': gameConfig.brandColor,
          '--game-accent': gameConfig.accentColor,
        } as React.CSSProperties}
      >
        <div className="p-8 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Trophy className="w-16 h-16 mx-auto text-[var(--text-muted)] opacity-50" />
            <h1 className="text-2xl font-black text-[var(--text-heading)] uppercase">Competencia no encontrada</h1>
            <Link href={`/${gameSlug}/organizacion/${orgId}`} className="text-[var(--app-accent)] hover:underline text-sm font-bold block">
              Volver a la Organización
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

  const actualCompId = competition.id;

  const [enrolledTeamsRaw, matchesRaw] = await Promise.all([
    dbProvider.competitions.getEnrolledTeams(actualCompId),
    dbProvider.matches.findByCompetition(actualCompId)
  ]);

  const allTeamIds = Array.from(new Set([
    ...enrolledTeamsRaw.map(t => t.team_id || t.teamId),
    ...matchesRaw.flatMap(m => [m.homeTeamId, m.teamHomeId, m.awayTeamId, m.teamAwayId])
  ].filter(Boolean))) as string[];
  
  const matchTeamsRaw = allTeamIds.length > 0 ? await dbProvider.teams.findAll({ where: { id: allTeamIds } }) : [];
  const teamMap = new Map(matchTeamsRaw.map(t => [t.id, t]));

  const teamRows: ConfirmedTeam[] = enrolledTeamsRaw.map(ct => {
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

  const matchRows: CompetitionMatch[] = matchesRaw.map(m => {
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

  return (
    <div className="min-h-screen pb-20 relative text-[var(--text-primary)]">
      <div className="standard-page-wrapper pt-0">
        <PublicCompetitionDetailView
          gameSlug={gameSlug}
          orgId={orgId}
          gameConfig={gameConfig}
          competition={competition}
          teams={teamRows}
          matches={matchRows}
        />
      </div>
    </div>
  );
}
