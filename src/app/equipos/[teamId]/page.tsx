'use client';

import React, { use, ViewTransition } from 'react';
import Link from 'next/link';
import { LoaderCircle, SearchX } from 'lucide-react';
import { TeamProfileView } from '@/components/teams/team-profile-view';
import { Button } from '@/components/ui/button';
import { initialTeams, type TeamData } from '@/lib/data-store';

export default function GlobalTeamProfilePage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params);
  const [team, setTeam] = React.useState<TeamData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [teamId]);

  React.useEffect(() => {
    let active = true;
    const norm = teamId.toLowerCase();
    
    // Find instant fallback from local stores
    const localMatch = initialTeams.find((item) =>
      item.id?.toLowerCase() === norm ||
      item.tag?.toLowerCase() === norm ||
      item.name?.toLowerCase()?.replace(/\s+/g, '-') === norm
    );

    fetch('/api/teams?limit=200')
      .then((response) => response.json())
      .then((payload: { teams?: TeamData[]; data?: { teams?: TeamData[] } }) => {
        const teams = payload.data?.teams ?? payload.teams ?? [];
        const found = teams.find((item) =>
          item.id?.toLowerCase() === norm ||
          item.tag?.toLowerCase() === norm ||
          item.name?.toLowerCase()?.replace(/\s+/g, '-') === norm
        );
        if (active) {
          setTeam(found ? {
            ...localMatch,
            ...found,
            members: found.members?.length ? found.members : localMatch?.members || [],
            vacantPositions: found.vacantPositions?.length ? found.vacantPositions : localMatch?.vacantPositions || [],
            palmares: found.palmares || localMatch?.palmares || '—',
          } : localMatch || null);
        }
      })
      .catch(() => {
        if (active) setTeam(localMatch || null);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [teamId]);

  if (loading) return <main className="public-team-state"><LoaderCircle className="size-8 animate-spin" /><h1>Cargando equipo</h1></main>;
  if (!team) return <main className="public-team-state"><SearchX className="size-9" /><h1>Equipo no encontrado</h1><Link href="/equipos"><Button>Volver al directorio</Button></Link></main>;

  return (
    <ViewTransition
      enter={{ 'nav-forward': 'team-nav-forward', 'nav-back': 'team-nav-back', default: 'none' }}
      exit={{ 'nav-forward': 'team-nav-forward', 'nav-back': 'team-nav-back', default: 'none' }}
      default="none"
    >
      <main className="public-team-page" style={{ '--profile-accent': 'var(--app-accent)', '--profile-accent-secondary': 'var(--app-accent-2)' } as React.CSSProperties}>
        <TeamProfileView team={team} brandColor="var(--app-accent)" />
      </main>
    </ViewTransition>
  );
}
