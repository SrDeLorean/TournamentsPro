'use client';

import React from 'react';
import { GameConfig } from '@/lib/games-data';
import { Search, Building2, Trophy, X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const isFiltered = Boolean(searchQuery || statusFilter !== 'TODOS' || selectedOrgName !== 'TODAS' || selectedTournName !== 'TODAS');

  const handleReset = () => {
    setSearchQuery('');
    setStatusFilter('TODOS');
    setSelectedOrgName('TODAS');
    setSelectedTournName('TODAS');
  };

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-xl space-y-4 transition-all font-[family-name:var(--font-active)]">
      {/* 1. Header Bar: Search & Status Pills */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 font-[family-name:var(--font-active)]">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0 group font-[family-name:var(--font-active)]">
          <Search className="w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--app-accent)] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
          <input
            type="search"
            aria-label="Buscar partidos"
            placeholder="Buscar por club, equipo o torneo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-9 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--app-accent)] focus:ring-1 focus:ring-[var(--app-accent)]/20 transition-all font-[family-name:var(--font-active)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg transition-colors font-[family-name:var(--font-active)]"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Segmented Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-card)] overflow-x-auto font-[family-name:var(--font-active)]">
          {/* TODOS */}
          <button
            type="button"
            onClick={() => setStatusFilter('TODOS')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer font-[family-name:var(--font-active)]',
              statusFilter === 'TODOS'
                ? 'bg-[color-mix(in_srgb,var(--app-accent)_16%,transparent)] text-[var(--app-accent)] border border-[var(--app-accent)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
            )}
          >
            TODOS ({totalMatchesCount})
          </button>

          {/* EN VIVO */}
          <button
            type="button"
            onClick={() => setStatusFilter('EN_VIVO')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer font-[family-name:var(--font-active)]',
              statusFilter === 'EN_VIVO'
                ? 'bg-[color-mix(in_srgb,var(--app-danger)_16%,transparent)] text-[var(--app-danger)] border border-[var(--app-danger)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--app-danger)] border border-transparent'
            )}
          >
            <span className="size-2 rounded-full bg-[var(--app-danger)] animate-pulse" />
            EN VIVO
          </button>

          {/* PROXIMOS */}
          <button
            type="button"
            onClick={() => setStatusFilter('PROXIMOS')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer font-[family-name:var(--font-active)]',
              statusFilter === 'PROXIMOS'
                ? 'bg-[color-mix(in_srgb,var(--app-warning)_16%,transparent)] text-[var(--app-warning)] border border-[var(--app-warning)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--app-warning)] border border-transparent'
            )}
          >
            PRÓXIMOS
          </button>

          {/* FINALIZADOS */}
          <button
            type="button"
            onClick={() => setStatusFilter('FINALIZADOS')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer font-[family-name:var(--font-active)]',
              statusFilter === 'FINALIZADOS'
                ? 'bg-[color-mix(in_srgb,var(--app-positive)_16%,transparent)] text-[var(--app-positive)] border border-[var(--app-positive)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--app-positive)] border border-transparent'
            )}
          >
            FINALIZADOS
          </button>

          {/* Reset Button */}
          {isFiltered && (
            <button
              type="button"
              onClick={handleReset}
              title="Restablecer filtros"
              className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-all ml-1 cursor-pointer font-[family-name:var(--font-active)]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Sub-Filters: Organizations & Tournaments Chips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-[var(--border-card)] font-[family-name:var(--font-active)]">
        {/* Organizations */}
        <div className="space-y-1.5 font-[family-name:var(--font-active)]">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] font-bold font-[family-name:var(--font-active)]">
            <span className="flex items-center gap-1.5 uppercase tracking-wider font-[family-name:var(--font-active)]">
              <Building2 className="w-3.5 h-3.5 text-[var(--app-accent)]" />
              Organizaciones ({availableOrgs.length})
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar font-[family-name:var(--font-active)]">
            <button
              type="button"
              onClick={() => {
                setSelectedOrgName('TODAS');
                setSelectedTournName('TODAS');
              }}
              className={cn(
                'px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border cursor-pointer font-[family-name:var(--font-active)]',
                selectedOrgName === 'TODAS'
                  ? 'bg-[color-mix(in_srgb,var(--app-accent)_16%,transparent)] border-[var(--app-accent)] text-[var(--app-accent)] shadow-sm'
                  : 'bg-[var(--bg-subtle)] border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-card-hover)]'
              )}
            >
              TODAS
            </button>
            {availableOrgs.map((org) => {
              const isActive = selectedOrgName.toUpperCase() === org.name.toUpperCase();
              return (
                <button
                  type="button"
                  key={org.id}
                  onClick={() => {
                    setSelectedOrgName(org.name);
                    setSelectedTournName('TODAS');
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border cursor-pointer font-[family-name:var(--font-active)]',
                    isActive
                      ? 'bg-[color-mix(in_srgb,var(--app-accent)_16%,transparent)] border-[var(--app-accent)] text-[var(--app-accent)] shadow-sm'
                      : 'bg-[var(--bg-subtle)] border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-card-hover)]'
                  )}
                >
                  {org.name} <span className="opacity-70 font-[family-name:var(--font-active)] text-[10px] font-bold">({org.tag})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Competitions */}
        <div className="space-y-1.5 font-[family-name:var(--font-active)]">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] font-bold font-[family-name:var(--font-active)]">
            <span className="flex items-center gap-1.5 uppercase tracking-wider font-[family-name:var(--font-active)]">
              <Trophy className="w-3.5 h-3.5 text-[var(--app-warning)]" />
              Competencias ({availableTournaments.length})
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar font-[family-name:var(--font-active)]">
            <button
              type="button"
              onClick={() => setSelectedTournName('TODAS')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border cursor-pointer font-[family-name:var(--font-active)]',
                selectedTournName === 'TODAS'
                  ? 'bg-[color-mix(in_srgb,var(--app-warning)_16%,transparent)] border-[var(--app-warning)] text-[var(--app-warning)] shadow-sm'
                  : 'bg-[var(--bg-subtle)] border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-card-hover)]'
              )}
            >
              TODAS
            </button>
            {availableTournaments.map((t) => {
              const isActive = selectedTournName.toUpperCase() === t.name.toUpperCase();
              return (
                <button
                  type="button"
                  key={t.id || t.name}
                  onClick={() => setSelectedTournName(t.name)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border cursor-pointer font-[family-name:var(--font-active)]',
                    isActive
                      ? 'bg-[color-mix(in_srgb,var(--app-warning)_16%,transparent)] border-[var(--app-warning)] text-[var(--app-warning)] shadow-sm'
                      : 'bg-[var(--bg-subtle)] border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-card-hover)]'
                  )}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
