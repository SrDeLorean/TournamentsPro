'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { GAMES_CATALOG } from '@/lib/games-data';
import { TeamProfileView } from '@/components/teams/team-profile-view';
import { initialTeams, type TeamData } from '@/lib/data-store';
import { Button } from '@/components/ui/button';
import { LoaderCircle, SearchX } from 'lucide-react';
import { GamePortalBackdrop, getGamePortalStyle } from '@/components/game/game-portal-backdrop';

interface TeamPageProps {
  params: Promise<{ gameSlug: string; teamId: string }>;
}

export default function DedicatedTeamProfilePage({ params }: TeamPageProps) {
  const { gameSlug, teamId } = use(params);
  const [fetchedTeam, setFetchedTeam] = React.useState<TeamData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState('');

  // Support game slugs including csgo / cs2 alias
  let game = GAMES_CATALOG[gameSlug];
  if (!game && (gameSlug === 'cs2' || gameSlug === 'csgo')) {
    game = GAMES_CATALOG['csgo'];
  }

  React.useEffect(() => {
    let active = true;
    fetch('/api/teams?limit=200')
      .then((res) => {
        if (!res.ok) throw new Error(`No se pudo cargar el equipo (${res.status})`);
        return res.json();
      })
      .then((data: { teams?: TeamData[]; data?: { teams?: TeamData[] } }) => {
        const teams = data.data?.teams ?? data.teams ?? [];
        if (active && Array.isArray(teams)) {
          const matched = teams.find(
            (t) =>
              t.id?.toLowerCase() === teamId.toLowerCase() ||
              t.tag?.toLowerCase() === teamId.toLowerCase() ||
              t.name?.toLowerCase()?.replace(/\s+/g, '-') === teamId.toLowerCase()
          );
          if (matched) setFetchedTeam(matched);
        }
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'No se pudo cargar el equipo.');
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [teamId]);

  // Find team by ID, slugified name, or tag (Fallback matching)
  const normalizedTeamId = teamId.toLowerCase();
  const defaultTeam = initialTeams.find((t) =>
    t.id.toLowerCase() === normalizedTeamId ||
    t.tag.toLowerCase() === normalizedTeamId ||
    t.name.toLowerCase().replace(/\s+/g, '-') === normalizedTeamId
  );

  const team = fetchedTeam || defaultTeam;

  if (!game) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold mb-4 text-[var(--text-heading)]">Juego no encontrado</h1>
        <p className="text-[var(--text-muted)] mb-6">El juego solicitado no existe en nuestro catálogo eSports.</p>
        <Link href="/">
          <Button variant="primary">Volver al Inicio</Button>
        </Link>
      </div>
    );
  }

  if (isLoading && !team) {
    return (
      <main className="public-team-state" style={{ '--profile-accent': game.brandColor } as React.CSSProperties}>
        <LoaderCircle className="size-8 animate-spin" />
        <h1>Cargando ficha del equipo</h1>
        <p>Estamos reuniendo la plantilla y su información competitiva.</p>
      </main>
    );
  }

  if (!team) {
    return (
      <main className="public-team-state" style={{ '--profile-accent': game.brandColor } as React.CSSProperties}>
        <SearchX className="size-9" />
        <h1>Equipo no encontrado</h1>
        <p>{loadError || 'La ficha solicitada no existe o ya no está disponible.'}</p>
        <Link href="/equipos"><Button variant="primary">Explorar equipos</Button></Link>
      </main>
    );
  }

  return (
    <main
      className="game-portal game-portal-stage public-team-page"
      data-game={game.slug}
      style={{
        ...getGamePortalStyle(game),
        '--profile-accent': game.brandColor,
        '--profile-accent-secondary': game.accentColor,
      } as React.CSSProperties}
    >
      <GamePortalBackdrop game={game} />
      <div className="relative z-10">
        <TeamProfileView team={team} brandColor={game.brandColor} />
      </div>
    </main>
  );
}
