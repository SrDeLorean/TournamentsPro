import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { queryDB } from '@/lib/db';
import { CompetitionData, CompetitionTeamData } from '@/app/actions/competitions';
import {
  CompetitionTabs,
  type AvailableTeam,
  type AvailableUser,
  type CompetitionMatch,
} from '@/app/dashboard/competencias/[id]/competition-tabs';
import { GAME_MODE_OPTIONS } from '@/lib/games-data';
import { requireCompetitionManager } from '@/lib/auth-server';

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

async function getCompetitionDetails(id: string) {
  try {
    const compRows = await queryDB<CompetitionData>(`SELECT * FROM competitions WHERE id = ?`, [id]);

    if (!compRows || compRows.length === 0) {
      return null;
    }

    const competition = compRows[0];
    const isIndividual = isIndividualFormat(competition.game_slug, competition.mode_format);

    // RSC Parallel Database Queries (Vercel Best Practice async-parallel)
    const [teamRows, availableRows, availableUsers, matchRows] = await Promise.all([
      queryDB<CompetitionTeamData>(`SELECT * FROM competition_teams WHERE competition_id = ? ORDER BY enrolled_at ASC`, [id]),
      queryDB<AvailableTeam>(
        `SELECT id, name, tag, platform, game_slug FROM teams WHERE is_banned = 0 AND game_slug = ? ORDER BY name ASC`,
        [competition.game_slug]
      ),
      isIndividual
        ? queryDB<AvailableUser>(
            `SELECT id, name, gamertag, position, rating, primary_game_slug FROM users WHERE (is_banned IS NULL OR is_banned = 0) ORDER BY gamertag ASC`
          )
        : Promise.resolve([]),
      queryDB<CompetitionMatch>(`SELECT * FROM matches WHERE competition_id = ? ORDER BY COALESCE(matchday_number, matchday, 1) ASC, created_at ASC`, [id]),
    ]);

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
  await requireCompetitionManager(id);
  const data = await getCompetitionDetails(id);

  if (!data) {
    notFound();
  }

  const { competition, enrolledTeams, availableTeams, availableUsers, isIndividual, matches } = data;
  return (
    <div className="management-page">
      <Suspense fallback={<div className="text-xs font-mono text-cyan-400 p-4">Cargando pestañas de competencia...</div>}>
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
