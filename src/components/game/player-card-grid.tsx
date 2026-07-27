'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Monitor } from 'lucide-react';

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
  if (players.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--text-muted)] text-sm">No se encontraron atletas con este filtro.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {players.map((player, idx) => (
        <PlayerCard key={player.id || idx} player={player} gameSlug={gameSlug} brandColor={brandColor} />
      ))}
    </div>
  );
}

function PlayerCard({ player, gameSlug, brandColor }: { player: PlayerCardData; gameSlug: string; brandColor: string }) {
  return (
    <div className="rounded-xl sm:rounded-2xl glass-panel overflow-hidden border border-[var(--border-card)] transition-all duration-300 group hover:-translate-y-1 shadow-xl flex flex-col justify-between">
      {/* Top Banner & Avatar Overlap Header */}
      <div>
        <div className="relative h-28 sm:h-36 w-full overflow-hidden bg-slate-900">
          <img
            src={player.bannerUrl || '/images/default/banner-default.jpg'}
            alt={player.name}
            onError={(e) => {
              e.currentTarget.src = '/images/default/banner-default.jpg';
            }}
            className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-black/40" />

          {/* Status Badges */}
          <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 right-2.5 sm:right-3 flex items-center justify-between text-[9px] sm:text-[10px] font-bold">
            <span className="px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-700/80 text-emerald-400 uppercase tracking-wider">
              ● {player.status || 'Atleta Activo'}
            </span>
            <span
              className="px-2 py-0.5 rounded-md border uppercase tracking-wider flex items-center gap-1"
              style={{
                backgroundColor: `color-mix(in srgb, ${brandColor} 20%, transparent)`,
                borderColor: `color-mix(in srgb, ${brandColor} 50%, transparent)`,
                color: brandColor,
              }}
            >
              <Monitor className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {player.platform || 'CROSSPLAY'}
            </span>
          </div>
        </div>

        {/* Player Avatar & Details Section */}
        <div className="px-4 sm:px-5 pt-0 pb-3 sm:pb-4 relative -mt-7 sm:-mt-8 space-y-2 sm:space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-950 border-2 flex items-center justify-center font-black text-lg sm:text-xl shadow-2xl flex-shrink-0 overflow-hidden"
              style={{ borderColor: brandColor, color: brandColor }}
            >
              {player.avatarUrl ? (
                <img
                  src={player.avatarUrl}
                  alt={player.name}
                  onError={(e) => {
                    e.currentTarget.src = '/images/default/logo-default.png';
                  }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Avatar fallback={player.name} size="md" status="online" />
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <Badge variant="cyan">{player.pos}{player.secPos ? ` / ${player.secPos}` : ''}</Badge>
              <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-mono font-black text-amber-400 bg-slate-950 border border-amber-500/30">
                ★ {player.rating}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base sm:text-lg text-[var(--text-heading)] tracking-tight line-clamp-1 group-hover:text-cyan-300 transition-colors">
                {player.name}
              </h3>
              <span className="text-[10px] font-mono text-purple-300 font-bold bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30">
                ID: {player.gameId}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[var(--text-muted)] line-clamp-1 flex items-center justify-between">
              <span>Club: <strong className="text-slate-200">{player.team}</strong></span>
              <span className="text-emerald-400 font-bold">{player.nacionalidad}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer Action Link */}
      <div className="px-4 sm:px-5 py-3 border-t border-[var(--border-card)] flex items-center justify-between text-xs font-bold bg-slate-950/40">
        <Link
          href={`/${gameSlug}/jugadores/${player.id}`}
          className="text-cyan-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-bold"
        >
          <span>Ver Ficha →</span>
        </Link>
        <span className="font-mono text-emerald-400 text-[11px]">Efectividad: {player.pss}</span>
      </div>
    </div>
  );
}
