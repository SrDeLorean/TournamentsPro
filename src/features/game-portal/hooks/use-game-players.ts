'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GameConfig } from '@/lib/games-data';
import { fetchJson } from '@/lib/fetch-utils';
import type { PlayerCardData } from '@/components/game/player-card-grid';

export function mapGamePlayer(user: Record<string, unknown>, game: GameConfig): PlayerCardData {
  const profiles = user.gameProfiles as Record<string, { position?: string; gameId?: string }> | undefined;
  const rawPosition = profiles?.[game.slug]?.position
    || (game.slug === user.primaryGame ? user.position as string : undefined)
    || (game.positions.includes(user.position as string) ? user.position as string : undefined);
  const position = rawPosition && game.positions.includes(rawPosition) ? rawPosition : game.positions[0] || 'DFC';
  const id = String(user.id);
  return {
    id, name: String(user.name), gamertag: String(user.gamertag || user.name), pos: position, secPos: undefined,
    gameId: profiles?.[game.slug]?.gameId || `${game.slug.toUpperCase()}-ID #${id.substring(0, 6)}`,
    team: String(user.teamName || 'Agencia Libre'), rating: String(user.rating || '9.2'), pss: '92%',
    nacionalidad: String(user.nacionalidad || 'Chile'),
    bannerUrl: String(user.bannerUrl || '/images/default/banner-default.jpg'),
    avatarUrl: String(user.avatarUrl || user.foto || '/images/default/logo-default.png'),
    status: String(user.status || 'Atleta Activo'), platform: String(user.platform || 'CROSSPLAY'),
  };
}

export function useGamePlayers(game: GameConfig | undefined, activeSection: string, searchTerm: string, selectedPosition: string) {
  const [players, setPlayers] = useState<PlayerCardData[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

  useEffect(() => {
    if (!game || (activeSection !== 'jugadores' && activeSection !== 'tops')) return;
    let cancelled = false;
    fetchJson<Record<string, unknown>>(`/api/users?gameSlug=${game.slug}&limit=200`)
      .then((data) => {
        const responseData = data.data as { users?: Record<string, unknown>[] } | Record<string, unknown>[] | undefined;
        const users = (!Array.isArray(responseData) && responseData?.users) || data.users || (data.success && Array.isArray(responseData) ? responseData : []);
        if (!cancelled && Array.isArray(users)) setPlayers(users.map((user) => mapGamePlayer(user, game)));
      })
      .catch((error) => console.error('Error fetching players:', error))
      .finally(() => { if (!cancelled) setIsLoadingPlayers(false); });
    return () => { cancelled = true; };
  }, [activeSection, game]);

  const filteredPlayers = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return players.filter((player) => {
      const matchesSearch = !query || [player.name, player.gamertag, player.team, player.gameId]
        .some((value) => value?.toLowerCase().includes(query));
      return matchesSearch && (selectedPosition === 'ALL' || player.pos === selectedPosition);
    });
  }, [players, searchTerm, selectedPosition]);

  return { filteredPlayers, isLoadingPlayers };
}
