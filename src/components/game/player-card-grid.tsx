'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Monitor } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';

export interface PlayerCardData {
  id: string;
  name: string;
  gamertag: string;
  pos: string;
  secPos?: string;
  gameId: string;
  team: string;
  rating: string;
  pss: string;
  nacionalidad: string;
  bannerUrl: string;
  avatarUrl: string;
  status: string;
  platform: string;
}

interface PlayerCardGridProps {
  players: PlayerCardData[];
  gameSlug: string;
  brandColor: string;
}

export function PlayerCardGrid({ players, gameSlug, brandColor }: PlayerCardGridProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 12;

  // Reset page when filter/players change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [players]);

  if (players.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--text-muted)] text-sm">No se encontraron atletas con este filtro.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(players.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPlayers = players.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {currentPlayers.map((player, idx) => (
          <PlayerCard key={player.id || idx} player={player} gameSlug={gameSlug} brandColor={brandColor} />
        ))}
      </div>

      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={setCurrentPage} 
        brandColor={brandColor}
        className="pt-8 pb-4"
      />
    </div>
  );
}

import { EsportsCard } from '@/components/ui/esports-card';
import { UserCheck, Star, Award, Shield } from 'lucide-react';

function PlayerCard({ player, gameSlug, brandColor }: { player: PlayerCardData; gameSlug: string; brandColor: string }) {
  return (
    <EsportsCard
      href={`/${gameSlug}/jugadores/${player.id}`}
      title={player.name}
      subtitle={`🎮 ID: ${player.gameId}`}
      description={`Atleta eSports compitiendo para ${player.team}.`}
      bannerUrl={player.bannerUrl || '/images/default/banner-default.jpg'}
      logoUrl={player.avatarUrl}
      fallbackIcon={<UserCheck className="w-8 h-8 text-cyan-400" />}
      tag={player.pos}
      country={player.nacionalidad}
      socials={
        (player as any).socialMedia || {
          instagram: (player as any).instagram,
          twitch: (player as any).twitch,
          twitter: (player as any).twitter,
          whatsapp: (player as any).whatsapp,
          tiktok: (player as any).tiktok,
          youtube: (player as any).youtube,
          discord: (player as any).discord,
        }
      }
      badges={[
        { text: player.status || 'Atleta Activo', variant: 'emerald', pulse: true },
      ]}
      stats={[
        { icon: <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />, label: 'Rating', value: player.rating, highlight: true },
        { icon: <Award className="w-3.5 h-3.5 text-cyan-400" />, label: 'Efectividad', value: player.pss },
      ]}
      footerLeft={
        <span className="flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>{player.team}</span>
        </span>
      }
      actionText="VER FICHA"
      brandColor={brandColor}
    />
  );
}
