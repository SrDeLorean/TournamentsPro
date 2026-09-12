'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { LoaderCircle, SearchX } from 'lucide-react';
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
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState('');

  React.useEffect(() => {
    let active = true;
    const fetchId = (playerId === 'me' || playerId === 'ficha') ? currentUser?.id : playerId;
    if (!fetchId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetch(`/api/users?id=${encodeURIComponent(fetchId)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`No se pudo cargar el atleta (${res.status})`);
        return res.json();
      })
      .then((payload: { success?: boolean; user?: UserProfile; data?: { user?: UserProfile } }) => {
        const u = payload.data?.user ?? payload.user;
        if (active && payload.success && u) {
          setDbUser(u);
        } else if (active) {
          setLoadError('El atleta solicitado no existe o ya no está disponible.');
        }
      })
      .catch((err: unknown) => {
        if (active) {
          console.error('Error fetching player by id:', err);
          setLoadError(err instanceof Error ? err.message : 'Error al consultar el perfil.');
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentUser?.id, playerId]);

  const activeUser = dbUser || (isSelf ? currentUser : (currentUser?.id && currentUser.id.toLowerCase() === normalizedId ? currentUser : null));

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

  if (isLoading && !activeUser) {
    return (
      <main className="public-team-state" style={{ '--profile-accent': game.brandColor } as React.CSSProperties}>
        <LoaderCircle className="size-8 animate-spin" />
        <h1>Cargando perfil del atleta</h1>
        <p>Estamos reuniendo la información y estadísticas del jugador.</p>
      </main>
    );
  }

  if (!activeUser) {
    return (
      <main className="public-team-state" style={{ '--profile-accent': game.brandColor } as React.CSSProperties}>
        <SearchX className="size-9" />
        <h1>Atleta no encontrado</h1>
        <p>{loadError || 'La ficha solicitada no existe o ya no está disponible en este circuito.'}</p>
        <Link href={`/${gameSlug}/usuarios`}><Button variant="primary">Explorar atletas</Button></Link>
      </main>
    );
  }

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

  // Construct player profile data dynamically from real user
  const player: PlayerData = {
    id: activeUser.id,
    name: activeUser.name || activeUser.gamertag || 'Atleta eSports',
    gamertag: activeUser.gamertag || activeUser.name || 'Atleta',
    position: resolvedPosition,
    secondaryPosition: resolvedSecPos,
    teamName: activeUser.teamName || 'Agencia Libre',
    teamId: activeUser.teamId,
    rating: Number(activeUser.rating) || 85,
    platform: activeUser.platform || 'CROSSPLAY',
    gameSlug: gameSlug,
    status: activeUser.status || 'Atleta Activo en Circuito',
    bio: activeUser.biografia || (activeUser as any)?.bio || `Deportista eSports oficial compitiendo en el circuito profesional de ${game?.name || gameSlug.toUpperCase()}.`,
    gameId: activeUser.gameProfiles?.[gameSlug]?.gameId || `${gameSlug.toUpperCase()}-ID #${activeUser.id.replace(/^usr-/, '').substring(0, 6)}`,
    nacionalidad: activeUser.nacionalidad || 'Chile',
    instagram: activeUser.instagram,
    twitch: activeUser.twitch,
    youtube: activeUser.youtube,
    discord: activeUser.discord,
    whatsapp: activeUser.whatsapp,
    website: activeUser.website,
    avatarUrl: activeUser.avatarUrl || activeUser.foto || '/images/default/logo-default.png',
    bannerUrl: activeUser.bannerUrl || game?.bannerUrl || '/images/games-background/eafc.jpg',
    stats: (activeUser as (UserProfile & { aggregatedStats?: PlayerData['stats'] }) | null)?.aggregatedStats || {
      matches: 0,
      goals: 0,
      assists: 0,
      mvps: 0,
      winrate: '0%',
    },
  };

  return (
    <div className="w-full min-h-screen pt-0 pb-6 relative">
      <PlayerProfileView player={player} brandColor={game.brandColor} context="game" isOwner={Boolean(isSelf)} />
    </div>
  );
}
