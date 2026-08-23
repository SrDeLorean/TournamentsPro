'use client';

import React from 'react';
import { GameConfig } from '@/lib/games-data';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Building2, Trophy, Flame, Filter, X } from 'lucide-react';

export interface OrgOption {
  id: string;
  name: string;
  tag: string;
}

export interface TournOption {
  id: string;
  name: string;
  gameSlug?: string;
}

interface MatchFilterToolbarProps {
  game: GameConfig;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: 'TODOS' | 'EN_VIVO' | 'PROXIMOS' | 'FINALIZADOS';
  setStatusFilter: (status: 'TODOS' | 'EN_VIVO' | 'PROXIMOS' | 'FINALIZADOS') => void;
  selectedOrgName: string;
  setSelectedOrgName: (org: string) => void;
  selectedTournName: string;
  setSelectedTournName: (tourn: string) => void;
  availableOrgs: OrgOption[];
  availableTournaments: TournOption[];
  totalMatchesCount: number;
}

export function MatchFilterToolbar({
  game,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  selectedOrgName,
  setSelectedOrgName,
  selectedTournName,
  setSelectedTournName,
  availableOrgs,
  availableTournaments,
  totalMatchesCount,
}: MatchFilterToolbarProps) {
  const brandColor = game?.brandColor || '#FF4654';

  return (
    <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-xl space-y-4 font-mono backdrop-blur-md">
      {/* 1. Search Bar + Status Filter Pills */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Buscar por club, equipo o torneo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-9 py-2 bg-[var(--bg-main)] border-[var(--border-card)] text-xs rounded-2xl focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-mono w-full"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs w-full md:w-auto justify-start md:justify-end">
          <button
            onClick={() => setStatusFilter('TODOS')}
            className={`px-3 py-1.5 rounded-full font-bold transition-all border ${
              statusFilter === 'TODOS'
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-md ring-1 ring-cyan-400/40'
                : 'bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            TODOS ({totalMatchesCount})
          </button>
          <button
            onClick={() => setStatusFilter('EN_VIVO')}
            className={`px-3 py-1.5 rounded-full font-bold transition-all border flex items-center gap-1.5 ${
              statusFilter === 'EN_VIVO'
                ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-md ring-1 ring-rose-500/40'
                : 'bg-[var(--bg-main)] border-[var(--border-card)] text-rose-400 hover:bg-rose-950/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            EN VIVO
          </button>
          <button
            onClick={() => setStatusFilter('PROXIMOS')}
            className={`px-3 py-1.5 rounded-full font-bold transition-all border ${
              statusFilter === 'PROXIMOS'
                ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-md'
                : 'bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            PRÓXIMOS
          </button>
          <button
            onClick={() => setStatusFilter('FINALIZADOS')}
            className={`px-3 py-1.5 rounded-full font-bold transition-all border ${
              statusFilter === 'FINALIZADOS'
                ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-md'
                : 'bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            FINALIZADOS
          </button>
        </div>
      </div>

      {/* 2. Organizations Selector */}
      <div className="space-y-2 pt-2 border-t border-[var(--border-card)]">
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
          <Building2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>ORGANIZACIONES REGISTRADAS EN BD:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setSelectedOrgName('TODAS');
              setSelectedTournName('TODAS');
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
              selectedOrgName === 'TODAS'
                ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-md'
                : 'bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            TODAS LAS ORGANIZACIONES
          </button>

          {availableOrgs.map((org) => {
            const isActive = selectedOrgName.toUpperCase() === org.name.toUpperCase();
            return (
              <button
                key={org.id}
                onClick={() => {
                  setSelectedOrgName(org.name);
                  setSelectedTournName('TODAS');
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  isActive
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-md ring-1 ring-cyan-400/40'
                    : 'bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-cyan-500/40'
                }`}
              >
                {org.name} <span className="opacity-70">({org.tag})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Competitions Selector */}
      <div className="space-y-2 pt-2 border-t border-[var(--border-card)]">
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>COMPETENCIAS Y TORNEOS:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedTournName('TODAS')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
              selectedTournName === 'TODAS'
                ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-md'
                : 'bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            TODAS LAS COMPETENCIAS
          </button>

          {availableTournaments.map((t) => {
            const isActive = selectedTournName.toUpperCase() === t.name.toUpperCase();
            return (
              <button
                key={t.id || t.name}
                onClick={() => setSelectedTournName(t.name)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  isActive
                    ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-amber-500/40'
                }`}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
