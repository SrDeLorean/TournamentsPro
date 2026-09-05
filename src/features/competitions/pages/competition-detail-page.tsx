import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { dbProvider } from '@/lib/db/provider';
import { CompetitionData, CompetitionTeamData } from '@/app/actions/competitions';
import {
  CompetitionTabs,
  type AvailableTeam,
  type AvailableUser,
  type CompetitionMatch,
} from '@/app/dashboard/competencias/[id]/competition-tabs';
import { GAME_MODE_OPTIONS } from '@/lib/games-data';
import { requireCompetitionManager } from '@/lib/auth-server';
import type { Competition } from '@/lib/db/interfaces';

export const revalidate = 0; // Dynamic RSC rendering

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

function isIndividualFormat(gameSlug: string, modeFormat: string): boolean {
  const modes = GAME_MODE_OPTIONS[gameSlug] || [];
  const found = modes.find((m) => m.value.toLowerCase() === modeFormat.toLowerCase());
  if (found) return found.isIndividual;
  const lowerMode = modeFormat.toLowerCase();
  return lowerMode.includes('1v1') || lowerMode.includes('2v2') || lowerMode.includes('solo') || lowerMode.includes('duos');
}

function mapCompToData(c: Competition): CompetitionData {
  return {
    id: c.id,
    name: c.name,
    game_slug: c.gameSlug,
    organizer_id: c.organizerId,
    organizer_name: c.organizerName,
    organization_id: c.organizationId,
    season_id: c.seasonId,
    prize_pool: c.prizePool,
    transfer_market_mode: c.transferMarketMode as any,
    mode_format: c.modeFormat,
    status: c.status as any,
    fecha_limite_inscripcion: c.fechaLimiteInscripcion,
    fecha_inicio: c.fechaInicio,
    fecha_termino: c.fechaTermino,
    description: c.description,
    created_at: c.createdAt,
  };
}

async function getCompetitionDetails(id: string) {
  try {
    const compRecord = await dbProvider.competitions.findById(id);

    if (!compRecord) {
      return null;
    }

    const competition = mapCompToData(compRecord);
    const isIndividual = isIndividualFormat(competition.game_slug, competition.mode_format);

    // RSC Parallel Database Queries (Vercel Best Practice async-parallel)
    const [teamRowsRaw, availableRowsRaw, availableUsersRaw, matchRowsRaw] = await Promise.all([
      dbProvider.competitions.getEnrolledTeams(id),
      dbProvider.teams.findByGameSlug(competition.game_slug),
      isIndividual
        ? dbProvider.users.findAll({ where: { is_banned: 0 }, orderBy: 'gamertag', orderDirection: 'ASC' })
        : Promise.resolve([]),
      dbProvider.matches.findByCompetition(id),
    ]);

    const teamRows = teamRowsRaw as CompetitionTeamData[];
    
    const availableRows: AvailableTeam[] = availableRowsRaw.map(t => ({
      id: t.id,
      name: t.name,
      tag: t.tag,
      platform: t.platform,
      game_slug: t.gameSlug
    }));
    
    const availableUsers: AvailableUser[] = availableUsersRaw.map(u => ({
      id: u.id,
      name: u.name,
      gamertag: u.gamertag,
      position: u.position,
      rating: u.rating,
      primary_game_slug: u.primaryGameSlug
    }));

    const matchRows: CompetitionMatch[] = matchRowsRaw.map(m => ({
      id: m.id,
      status: m.status,
      home_team_id: m.homeTeamId,
      team_home_id: m.teamHomeId,
      away_team_id: m.awayTeamId,
      team_away_id: m.teamAwayId,
      home_team_name: m.homeTeamName,
      away_team_name: m.awayTeamName,
      reported_score_home: m.reportedScoreHome,
      reported_score_away: m.reportedScoreAway,
      score_home: m.scoreHome,
      score_away: m.scoreAway,
      matchday_number: m.matchday,
      matchday: m.matchday,
    }));

    return {
      competition,
      enrolledTeams: teamRows,
      availableTeams: availableRows,
      availableUsers,
      isIndividual,
      matches: matchRows,
    };
  } catch (error) {
    console.error('Error fetching competition details in RSC:', error);
    return null;
  }
}

export default async function CompetitionDetailPage({ params }: DetailPageProps) {
  const { id } = await params;
  
  try {
    await requireCompetitionManager(id);
  } catch (error: any) {
    const { getServerUserSession } = await import('@/lib/auth-server');
    const session = await getServerUserSession();
    if (!session) {
      const { redirect } = await import('next/navigation');
      redirect(`/auth/login?redirectTo=/dashboard/competencias/${id}`);
    }
    notFound();
  }

  const data = await getCompetitionDetails(id);

  if (!data) {
    notFound();
  }

  const { competition, enrolledTeams, availableTeams, availableUsers, isIndividual, matches } = data;
  return (
    <div className="management-page">
      <Suspense fallback={<div className="text-xs font-[family-name:var(--font-active)] text-[var(--app-accent)] p-4">Cargando pestañas de competencia...</div>}>
        <CompetitionTabs
          competition={competition}
          enrolledTeams={enrolledTeams}
          availableTeams={availableTeams}
          availableUsers={availableUsers}
          isIndividual={isIndividual}
          matches={matches}
        />
      </Suspense>
    </div>
  );
}
