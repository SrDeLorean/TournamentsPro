import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { queryDB } from '@/lib/db';
import { CompetitionData, CompetitionTeamData } from '@/app/actions/competitions';
import { CompetitionTabs } from './competition-tabs';
import { GAMES_CATALOG, GAME_MODE_OPTIONS } from '@/lib/games-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

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
      queryDB<any>(
        `SELECT id, name, tag, platform, game_slug FROM teams WHERE is_banned = 0 AND game_slug = ? ORDER BY name ASC`,
        [competition.game_slug]
      ),
      isIndividual
        ? queryDB<any>(
            `SELECT id, name, gamertag, position, rating, primary_game_slug FROM users WHERE (is_banned IS NULL OR is_banned = 0) ORDER BY gamertag ASC`
          )
        : Promise.resolve([]),
      queryDB<any>(`SELECT * FROM matches WHERE competition_id = ? OR tournament_id = ? ORDER BY COALESCE(matchday_number, matchday, 1) ASC, created_at ASC`, [id, id]),
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
  const data = await getCompetitionDetails(id);

  if (!data) {
    notFound();
  }

  const { competition, enrolledTeams, availableTeams, availableUsers, isIndividual, matches } = data;
  const gameConfig = GAMES_CATALOG[competition.game_slug] || GAMES_CATALOG['eafc26'];
  const brandColor = gameConfig?.brandColor || '#00F0FF';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/competencias"
          className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--accent-cyan)] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Listado de Competencias</span>
        </Link>

        <Badge
          variant={
            competition.status === 'En Curso' || competition.status === 'Activo'
              ? 'violet'
              : competition.status === 'Finalizada' || competition.status === 'Finalizado'
              ? 'emerald'
              : competition.status === 'Inscripcion'
              ? 'cyan'
              : competition.status === 'Borrador'
              ? 'gold'
              : 'rose'
          }
          className="text-xs uppercase font-mono font-black"
        >
          {competition.status === 'Borrador'
            ? '📝 Borrador'
            : competition.status === 'Inscripcion'
            ? '📝 Inscripción'
            : competition.status === 'En Curso' || competition.status === 'Activo'
            ? '⚡ En Curso'
            : competition.status === 'Finalizada' || competition.status === 'Finalizado'
            ? '🏆 Finalizada'
            : '🔴 Eliminada'}
        </Badge>
      </div>

      {/* Identity Header Banner */}
      <Card className="p-6 bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border-card)] space-y-4 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl bg-[var(--bg-main)] border-2 flex items-center justify-center font-black text-2xl shadow-xl flex-shrink-0"
              style={{ borderColor: brandColor, color: brandColor }}
            >
              {gameConfig?.icon || '🏆'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-[var(--text-heading)] uppercase tracking-wider">{competition.name}</h1>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${brandColor} 18%, transparent)`,
                    borderColor: brandColor,
                    color: brandColor,
                  }}
                >
                  {gameConfig?.name}
                </span>
                {isIndividual && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-950/80 text-amber-300 border border-amber-500/40">
                    Individual (Atletas Directos)
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] font-mono mt-1 flex items-center gap-3 flex-wrap">
                <span>Formato: <strong className="text-[var(--accent-cyan)]">{competition.mode_format}</strong></span>
                <span>• Inicio: <strong className="text-emerald-400">{new Date(competition.fecha_inicio).toLocaleDateString('es-ES')}</strong></span>
                <span>• Término: <strong className="text-[var(--text-secondary)]">{competition.fecha_termino ? new Date(competition.fecha_termino).toLocaleDateString('es-ES') : 'TBD (Nullable)'}</strong></span>
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 🗂️ SISTEMA DE 5 PESTAÑAS (CompetitionTabs Client Component) */}
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
