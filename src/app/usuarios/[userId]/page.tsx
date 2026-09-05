'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { LoaderCircle, SearchX } from 'lucide-react';
import { PlayerProfileView, type PlayerData } from '@/components/players/player-profile-view';
import { Button } from '@/components/ui/button';
import { GAMES_CATALOG } from '@/lib/games-data';
import type { UserProfile } from '@/lib/data-store';

type PublicUser = UserProfile & { aggregatedStats?: PlayerData['stats'] };

export default function GlobalUserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [user, setUser] = React.useState<PublicUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    fetch(`/api/users?id=${encodeURIComponent(userId)}`).then((response) => response.json()).then((payload: { success?: boolean; user?: PublicUser; data?: { user?: PublicUser } }) => {
      const u = payload.data?.user ?? payload.user;
      if (active && payload.success && u) setUser(u);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId]);

  if (loading) return <main className="public-team-state"><LoaderCircle className="size-8 animate-spin" /><h1>Cargando perfil</h1></main>;
  if (!user) return <main className="public-team-state"><SearchX className="size-9" /><h1>Usuario no encontrado</h1><Link href="/usuarios"><Button>Volver al directorio</Button></Link></main>;

  const gameSlug = user.primaryGame || Object.keys(user.gameProfiles || {})[0] || 'eafc26';
  const game = GAMES_CATALOG[gameSlug] || GAMES_CATALOG.eafc26;
  const profile = user.gameProfiles?.[gameSlug];
  const player: PlayerData = {
    id: user.id,
    name: user.name,
    gamertag: user.gamertag || user.name,
    position: profile?.position || user.position || game.positions?.[0] || 'FLEX',
    secondaryPosition: profile?.secondaryPosition || user.secondaryPosition,
    gameId: profile?.gameId || user.gamertag || user.id,
    nacionalidad: user.nacionalidad || 'Chile',
    teamName: user.teamName || 'Agencia libre',
    teamId: user.teamId,
    rating: Number(user.rating) || 0,
    platform: user.platform || 'Crossplay',
    avatarUrl: user.avatarUrl || user.foto,
    bannerUrl: user.bannerUrl || '/images/default/banner-default.jpg',
    gameSlug,
    status: user.status || 'Atleta activo',
    bio: user.biografia,
    instagram: user.instagram,
    twitch: user.twitch,
    youtube: user.youtube,
    discord: user.discord,
    whatsapp: user.whatsapp,
    website: user.website,
    stats: user.aggregatedStats,
  };

  return (
    <main className="public-team-page" style={{ '--profile-accent': 'var(--app-accent)' } as React.CSSProperties}>
      <PlayerProfileView player={player} brandColor="var(--app-accent)" context="global" />
    </main>
  );
}
