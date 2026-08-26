'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GAMES_CATALOG } from '@/lib/games-data';
import { GameSubNavbar } from '@/components/layout/game-sub-navbar';
import { TeamProfileView } from '@/components/teams/team-profile-view';
import { initialTeams, type TeamData } from '@/lib/data-store';
import { Button } from '@/components/ui/button';

interface TeamPageProps {
  params: Promise<{ gameSlug: string; teamId: string }>;
}

export default function DedicatedTeamProfilePage({ params }: TeamPageProps) {
  const { gameSlug, teamId } = use(params);
  const router = useRouter();

  const [fetchedTeam, setFetchedTeam] = React.useState<TeamData | null>(null);

  // Support game slugs including csgo / cs2 alias
  let game = GAMES_CATALOG[gameSlug];
  if (!game && (gameSlug === 'cs2' || gameSlug === 'csgo')) {
    game = GAMES_CATALOG['csgo'];
  }

  React.useEffect(() => {
    fetch(`/api/teams`)
      .then((res) => res.json())
      .then((data: { success?: boolean; teams?: TeamData[] }) => {
        if (data.success && Array.isArray(data.teams)) {
          const matched = data.teams.find(
            (t) =>
              t.id?.toLowerCase() === teamId.toLowerCase() ||
              t.tag?.toLowerCase() === teamId.toLowerCase() ||
              t.name?.toLowerCase()?.replace(/\s+/g, '-') === teamId.toLowerCase()
          );
          if (matched) setFetchedTeam(matched);
        }
      })
      .catch((err) => console.error('Error fetching team page data:', err));
  }, [teamId]);

  // Find team by ID, slugified name, or tag (Fallback matching)
  const normalizedTeamId = teamId.toLowerCase();
  const defaultTeam = initialTeams.find((t) =>
    t.id.toLowerCase() === normalizedTeamId ||
    t.tag.toLowerCase() === normalizedTeamId ||
    t.name.toLowerCase().replace(/\s+/g, '-') === normalizedTeamId
  ) || {
    id: teamId,
    name: 'Escuadra eSports',
    tag: 'TP',
    gameSlug: gameSlug as TeamData['gameSlug'],
    gameName: game?.name || 'EA SPORTS FC 26',
    captainId: 'usr-admin',
    captainName: 'Administrador',
    platform: 'CROSSPLAY',
    membersCount: 1,
    maxMembers: 45,
    color: game?.brandColor || '#00F0FF',
    logoText: 'TP',
    description: 'Escuadra oficial registrada en el circuito eSports.',
    logoUrl: '/images/default/logo-default.png',
    bannerUrl: '/images/default/banner-default.jpg',
    status: 'ACTIVO',
    disputando: 'Torneo Oficial',
    palmares: 'Club Registrado',
    vacantPositions: ['DFC', 'LI', 'MCD'],
    members: [],
  };

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

  return (
    <div
      className="min-h-screen pb-20 relative transition-all duration-500 bg-[var(--bg-main)] text-[var(--text-primary)]"
      style={{
        '--game-brand': game.brandColor,
        '--game-accent': game.accentColor,
      } as React.CSSProperties}
    >
      {/* Game Sub Navbar with 'equipos' active section */}
      <GameSubNavbar
        game={game}
        activeSection="equipos"
        onSelectSection={(section) => {
          if (section === 'home') {
            router.push(`/${game.slug}`);
          } else {
            router.push(`/${game.slug}`);
          }
        }}
      />

      {/* Main Full Bleed Team Profile Banner Attached Directly to Sub-Navbar with Margin 0 / Padding 0 */}
      <div className="w-full pt-0 pb-6 relative">
        <TeamProfileView
          team={team}
          brandColor={game.brandColor}
          onBack={() => router.push(`/${game.slug}`)}
        />
      </div>
    </div>
  );
}
