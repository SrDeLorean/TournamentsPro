'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { LoaderCircle, SearchX } from 'lucide-react';
import { TeamProfileView } from '@/components/teams/team-profile-view';
import { Button } from '@/components/ui/button';
import { GAMES_CATALOG } from '@/lib/games-data';
import type { TeamData } from '@/lib/data-store';

export default function GlobalTeamProfilePage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params);
  const [team, setTeam] = React.useState<TeamData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    fetch('/api/teams?limit=200').then((response) => response.json()).then((payload: { teams?: TeamData[]; data?: { teams?: TeamData[] } }) => {
      const teams = payload.data?.teams ?? payload.teams ?? [];
      const found = teams.find((item) => item.id.toLowerCase() === teamId.toLowerCase());
      if (active) setTeam(found || null);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [teamId]);

  if (loading) return <main className="public-team-state"><LoaderCircle className="size-8 animate-spin" /><h1>Cargando equipo</h1></main>;
  if (!team) return <main className="public-team-state"><SearchX className="size-9" /><h1>Equipo no encontrado</h1><Link href="/equipos"><Button>Volver al directorio</Button></Link></main>;

  const game = GAMES_CATALOG[team.gameSlug] || GAMES_CATALOG.eafc26;
  return (
    <main className="public-team-page" style={{ '--profile-accent': game.brandColor, '--profile-accent-secondary': game.accentColor } as React.CSSProperties}>
      <TeamProfileView team={team} brandColor={game.brandColor} context="global" />
    </main>
  );
}
