'use client';

import React from 'react';
import { GameConfig } from '@/lib/games-data';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CountryFlag } from '@/components/ui/country-flag';
import { Shield, Globe2, Edit3 } from 'lucide-react';
import { FixtureMatchItem } from './fixture-schedule-view';

interface MatchCardProps {
  match: FixtureMatchItem;
  game: GameConfig;
  isAdminOrOrganizer: boolean;
  isCaptainOrCoach: boolean;
  onOpenReportModal: (match: FixtureMatchItem) => void;
  onOpenTimezoneModal: (timeStr: string) => void;
}

export function MatchCard({
  match,
  game,
  isAdminOrOrganizer,
  isCaptainOrCoach,
  onOpenReportModal,
  onOpenTimezoneModal,
}: MatchCardProps) {
  const brandColor = game?.brandColor || '#FF4654';
  const isLive = match.status === 'EN_VIVO';
  const isFinished = match.status === 'FINALIZADO';

  return (
    <div
      className={`p-5 rounded-3xl backdrop-blur-md border transition-all duration-300 relative overflow-hidden group shadow-xl flex flex-col justify-between ${
        isLive
          ? 'bg-gradient-to-b from-rose-950/40 via-[var(--bg-card)] to-[var(--bg-card)] border-rose-500/60 shadow-rose-500/20 ring-1 ring-rose-500/40'
          : 'bg-[var(--bg-card)] border-[var(--border-card)] hover:border-cyan-500/40 hover:bg-[var(--bg-card-hover)]'
      }`}
    >
      {/* Top Ambient Glow */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity"
        style={{ backgroundColor: brandColor }}
      />

      <div className="space-y-4 font-mono relative z-10">
        {/* 1. Header: Circuit / Group + Status Badge */}
        <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-2 text-[10px] uppercase font-bold text-[var(--text-muted)]">
          <div className="flex items-center gap-1.5 truncate max-w-[180px]">
            <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">{match.circuitName || match.groupJornada || 'FASE REGULAR'}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isLive && (
              <Badge variant="rose" className="text-[9px] py-0.5 px-2 font-black animate-pulse flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                EN VIVO
              </Badge>
            )}
            {isFinished && (
              <Badge variant="emerald" className="text-[9px] py-0.5 px-2 font-bold">
                FINALIZADO
              </Badge>
            )}
            {!isLive && !isFinished && (
              <Badge variant="cyan" className="text-[9px] py-0.5 px-2 font-bold">
                {match.transmissionTime || '22:00'} HRS
              </Badge>
            )}
          </div>
        </div>

        {/* 2. Teams & Score Display */}
        <div className="space-y-2.5 my-2">
          {/* HOME TEAM */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] group-hover:border-cyan-500/30 transition-colors">
            <div className="flex items-center gap-3 truncate">
              <Avatar fallback={match.homeTag} size="sm" className="ring-1 ring-[var(--border-card)] shrink-0" />
              <div className="flex items-center gap-2 truncate">
                <span className="font-extrabold text-sm text-[var(--text-heading)] group-hover:text-cyan-400 transition-colors truncate">
                  {match.homeTeam}
                </span>
                <CountryFlag code="cl" name="Chile" size="sm" />
              </div>
            </div>
            <span
              className={`text-lg font-black shrink-0 ml-3 ${
                match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore
                  ? 'text-amber-400 font-extrabold'
                  : 'text-[var(--text-primary)]'
              }`}
            >
              {match.homeScore !== null ? match.homeScore : '-'}
            </span>
          </div>

          {/* VS SEPARATOR */}
          <div className="text-center text-[10px] font-black text-[var(--text-muted)] tracking-widest my-0.5">VS</div>

          {/* AWAY TEAM */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] group-hover:border-cyan-500/30 transition-colors">
            <div className="flex items-center gap-3 truncate">
              <Avatar fallback={match.awayTag} size="sm" className="ring-1 ring-[var(--border-card)] shrink-0" />
              <div className="flex items-center gap-2 truncate">
                <span className="font-extrabold text-sm text-[var(--text-heading)] group-hover:text-cyan-400 transition-colors truncate">
                  {match.awayTeam}
                </span>
                <CountryFlag code="cl" name="Chile" size="sm" />
              </div>
            </div>
            <span
              className={`text-lg font-black shrink-0 ml-3 ${
                match.homeScore !== null && match.awayScore !== null && match.awayScore > match.homeScore
                  ? 'text-amber-400 font-extrabold'
                  : 'text-[var(--text-primary)]'
              }`}
            >
              {match.awayScore !== null ? match.awayScore : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Footer Actions */}
      <div className="pt-3 mt-3 border-t border-[var(--border-card)] flex items-center justify-between gap-2 font-mono relative z-10">
        <button
          onClick={() => onOpenTimezoneModal(match.transmissionTime)}
          className="text-[10px] font-bold text-[var(--text-muted)] hover:text-cyan-400 transition-colors flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--bg-main)] border border-[var(--border-card)]"
          title="Ver conversión en zonas horarias de Latinoamérica"
        >
          <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>{match.transmissionTime || '22:00'} CLT</span>
        </button>

        {(isAdminOrOrganizer || isCaptainOrCoach) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenReportModal(match)}
            className="text-[10px] font-bold py-1 px-3 rounded-xl border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/80 hover:border-cyan-400 flex items-center gap-1.5 shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
            <span>REPORTAR</span>
          </Button>
        )}
      </div>
    </div>
  );
}
