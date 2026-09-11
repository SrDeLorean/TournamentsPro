'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { GAMES_CATALOG } from '@/lib/games-data';
import { PlayerProfileView, PlayerData } from '@/components/players/player-profile-view';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import type { UserProfile } from '@/lib/data-store';

interface PlayerPageProps {
  params: Promise<{ gameSlug: string; playerId: string }>;
}

export default function DedicatedPlayerProfilePage({ params }: PlayerPageProps) {
  const { gameSlug, playerId } = use(params);
  const { currentUser } = useAuth();

  let game = GAMES_CATALOG[gameSlug];
  if (!game && (gameSlug === 'cs2' || gameSlug === 'csgo')) {
    game = GAMES_CATALOG['csgo'];
  }

  const normalizedId = playerId?.toLowerCase();
  const isSelf = normalizedId === 'me' || normalizedId === 'ficha' || (currentUser?.id && normalizedId === currentUser.id.toLowerCase());

  const [dbUser, setDbUser] = React.useState<UserProfile | null>(null);

  React.useEffect(() => {
    const fetchId = (playerId === 'me' || playerId === 'ficha') ? currentUser?.id : playerId;
    if (!fetchId) return;
    fetch(`/api/users?id=${fetchId}`)
      .then((res) => res.json())
      .then((data: { success?: boolean; user?: UserProfile }) => {
        if (data.success && data.user) {
          setDbUser(data.user);
        }
      })
      .catch((err) => console.error('Error fetching player by id:', err));
  }, [currentUser?.id, playerId]);

  const activeUser = dbUser || (isSelf ? currentUser : (currentUser?.id && currentUser.id.toLowerCase() === normalizedId ? currentUser : null));

  const validPositions = game?.positions || [];
  const rawPos = activeUser?.gameProfiles?.[gameSlug]?.position || (gameSlug === activeUser?.primaryGame ? activeUser?.position : undefined) || (validPositions.includes(activeUser?.position ?? '') ? activeUser?.position : undefined);
  const resolvedPosition = (rawPos && validPositions.includes(rawPos)) ? rawPos : validPositions[0] || 'DFC';

  const rawSecPos = activeUser?.gameProfiles?.[gameSlug]?.secondaryPosition || (gameSlug === activeUser?.primaryGame ? activeUser?.secondaryPosition : undefined);
  let resolvedSecPos: string | undefined = undefined;
  if (
    rawSecPos &&
    typeof rawSecPos === 'string' &&
    rawSecPos.trim() !== '' &&
    !['n/a', 'na', 'sin posición', 'sin posicion', 'ninguna', 'none', '-'].includes(rawSecPos.trim().toLowerCase()) &&
    rawSecPos.trim() !== resolvedPosition &&
    validPositions.includes(rawSecPos.trim())
  ) {
    resolvedSecPos = rawSecPos.trim();
  }

  // Construct player profile data dynamically
  const player: PlayerData = {
    id: activeUser?.id || playerId,
    name: activeUser?.name || playerId.replace(/[-_]/g, ' ').toUpperCase(),
    gamertag: activeUser?.gamertag || playerId,
    position: resolvedPosition,
    secondaryPosition: resolvedSecPos,
    teamName: activeUser?.teamName || 'Agencia Libre',
    rating: Number(activeUser?.rating) || 85,
    platform: activeUser?.platform || 'CROSSPLAY',
    gameSlug: gameSlug,
    status: activeUser?.status || 'Atleta Activo en Circuito',
    bio: activeUser?.biografia || (activeUser as any)?.bio || `Deportista eSports oficial compitiendo en el circuito profesional de ${game?.name || gameSlug.toUpperCase()}.`,
    gameId: activeUser?.gameProfiles?.[gameSlug]?.gameId || `${gameSlug.toUpperCase()}-ID #${playerId.substring(0, 6)}`,
    nacionalidad: activeUser?.nacionalidad || 'Chile',
    instagram: activeUser?.instagram,
    twitch: activeUser?.twitch,
    youtube: activeUser?.youtube,
    discord: activeUser?.discord,
    whatsapp: activeUser?.whatsapp,
    website: activeUser?.website,
    avatarUrl: activeUser?.avatarUrl || activeUser?.foto || '/images/default/logo-default.png',
    bannerUrl: activeUser?.bannerUrl || game?.bannerUrl || '/images/games-background/eafc.jpg',
    stats: (activeUser as (UserProfile & { aggregatedStats?: PlayerData['stats'] }) | null)?.aggregatedStats || {
      matches: 0,
      goals: 0,
      assists: 0,
      mvps: 0,
      winrate: '0%',
    },
  };

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
    <div className="w-full min-h-screen pt-0 pb-6 relative">
      <PlayerProfileView player={player} brandColor={game.brandColor} context="game" isOwner={Boolean(isSelf)} />
    </div>
  );
}
