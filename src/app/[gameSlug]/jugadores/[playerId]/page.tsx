'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { GAMES_CATALOG } from '@/lib/games-data';
import { GameSubNavbar } from '@/components/layout/game-sub-navbar';
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
    if (!playerId) return;
    fetch(`/api/users?id=${playerId}`)
      .then((res) => res.json())
      .then((data: { success?: boolean; user?: UserProfile }) => {
        if (data.success && data.user) {
          setDbUser(data.user);
        }
      })
      .catch((err) => console.error('Error fetching player by id:', err));
  }, [playerId]);

  const activeUser = isSelf ? currentUser : (dbUser || (currentUser?.id && currentUser.id.toLowerCase() === normalizedId ? currentUser : null));

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

  // Known player catalog mapping
  const knownPlayers: Record<string, Partial<PlayerData>> = {
    'usr-srdelorean': { id: 'usr-srdelorean', name: 'SrDeLorean', gamertag: 'SrDeLorean', position: 'DC', teamName: 'LeguaYork eSp', rating: 9.8, status: 'Atleta Titular', bio: 'Capitán y delantero estelar de LeguaYork eSp. Especialista en definición y liderazgo táctico.' },
    'srdelorean': { id: 'usr-srdelorean', name: 'SrDeLorean', gamertag: 'SrDeLorean', position: 'DC', teamName: 'LeguaYork eSp', rating: 9.8, status: 'Atleta Titular', bio: 'Capitán y delantero estelar de LeguaYork eSp. Especialista en definición y liderazgo táctico.' },
    'usr-sgjotta': { id: 'usr-sgjotta', name: 'SG Jotta', gamertag: 'SG_Jotta', position: 'DFC', teamName: 'San Lorenzo eSp', rating: 9.6, status: 'Atleta Titular', bio: 'Defensa central infranqueable de San Lorenzo eSp. Dominio del juego aéreo y cobertura limpia.' },
    'sg-jotta': { id: 'usr-sgjotta', name: 'SG Jotta', gamertag: 'SG_Jotta', position: 'DFC', teamName: 'San Lorenzo eSp', rating: 9.6, status: 'Atleta Titular', bio: 'Defensa central infranqueable de San Lorenzo eSp. Dominio del juego aéreo y cobertura limpia.' },
    'usr-aczinomeme': { id: 'usr-aczinomeme', name: 'AcZinoMeme', gamertag: 'AcZinoMeme', position: 'MC', teamName: 'Highfield XX', rating: 9.4, status: 'Atleta Titular', bio: 'Mediocampista organizador de Highfield XX. Visión de pase de gol y recuperación de balón.' },
    'aczinomeme': { id: 'usr-aczinomeme', name: 'AcZinoMeme', gamertag: 'AcZinoMeme', position: 'MC', teamName: 'Highfield XX', rating: 9.4, status: 'Atleta Titular', bio: 'Mediocampista organizador de Highfield XX. Visión de pase de gol y recuperación de balón.' },
    'usr-gabot': { id: 'usr-gabot', name: 'T_TGaboT_T', gamertag: 'T_TGaboT_T', position: 'POR', teamName: 'Sangre Nueva FC', rating: 9.5, status: 'Atleta Titular', bio: 'Guardameta titular de Sangre Nueva FC. Reflejos bajo palos y salida de balón con el pie.' },
    't_tgabot_t': { id: 'usr-gabot', name: 'T_TGaboT_T', gamertag: 'T_TGaboT_T', position: 'POR', teamName: 'Sangre Nueva FC', rating: 9.5, status: 'Atleta Titular', bio: 'Guardameta titular de Sangre Nueva FC. Reflejos bajo palos y salida de balón con el pie.' },
  };

  const matchedKnown = knownPlayers[normalizedId];

  // Construct player profile data dynamically
  const player: PlayerData = {
    id: playerId,
    name: activeUser?.name || matchedKnown?.name || playerId.replace(/[-_]/g, ' ').toUpperCase(),
    gamertag: activeUser?.gamertag || matchedKnown?.gamertag || playerId,
    position: resolvedPosition,
    secondaryPosition: resolvedSecPos,
    teamName: activeUser?.teamName || matchedKnown?.teamName || 'Escuadra Registrada',
    rating: Number(activeUser?.rating) || matchedKnown?.rating || 89,
    platform: activeUser?.platform || 'CROSSPLAY',
    gameSlug: gameSlug,
    status: activeUser?.status || matchedKnown?.status || 'Atleta Activo en Circuito',
    bio: activeUser?.biografia || matchedKnown?.bio || `Deportista eSports oficial compitiendo en el circuito profesional de ${game?.name || gameSlug.toUpperCase()}.`,
    gameId: activeUser?.gameProfiles?.[gameSlug]?.gameId || `${gameSlug.toUpperCase()}-ID #${playerId.substring(0, 6)}`,
    nacionalidad: activeUser?.nacionalidad || 'Chile',
    instagram: activeUser?.instagram,
    twitch: activeUser?.twitch,
    youtube: activeUser?.youtube,
    discord: activeUser?.discord,
    whatsapp: activeUser?.whatsapp,
    website: activeUser?.website,
    avatarUrl: activeUser?.avatarUrl || activeUser?.foto || matchedKnown?.avatarUrl || '/images/default/logo-default.png',
    bannerUrl: activeUser?.bannerUrl || matchedKnown?.bannerUrl || '/images/default/banner-default.jpg',
    stats: {
      matches: 42,
      goals: 24,
      assists: 15,
      mvps: 8,
      winrate: '79%',
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
    <div
      className="min-h-screen pb-20 relative transition-all duration-500 bg-[var(--bg-main)] text-[var(--text-primary)]"
      style={{
        '--game-brand': game.brandColor,
        '--game-accent': game.accentColor,
      } as React.CSSProperties}
    >
      {/* Game Sub Navbar with 'jugadores' active section */}
      <GameSubNavbar game={game} activeSection="jugadores" />

      {/* Main Full Bleed Player Profile Banner Attached Directly to Sub-Navbar with Margin 0 / Padding 0 */}
      <div className="w-full pt-0 pb-6 relative">
        <PlayerProfileView player={player} brandColor={game.brandColor} />
      </div>
    </div>
  );
}
