'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games-data';
import { GameLogo } from '@/components/ui/game-logo';

export interface FilterOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  options?: FilterOption[];
  activeFilter?: string;
  onFilterChange?: (filterId: string) => void;
  renderAsSelect?: boolean;
  brandColor?: string;
  count?: number;
  countLabel?: string;
  children?: React.ReactNode;
}

export function FilterBar({
  searchPlaceholder = 'Buscar por nombre, tag o palabras clave...',
  searchValue,
  onSearchChange,
  options = [],
  activeFilter = 'TODOS',
  onFilterChange,
  renderAsSelect = false,
  brandColor = 'var(--game-brand)',
  count,
  countLabel = 'REGISTROS',
  children,
}: FilterBarProps) {
  const activeGame = GAMES_CATALOG[activeFilter];

  return (
    <div
      className="p-3 sm:p-4 rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)]/80 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 shadow-xl transition-all duration-300 text-[var(--text-primary)]"
      style={{ '--filter-brand': brandColor } as React.CSSProperties}
    >
      {/* 1. SEARCH INPUT WITH CLEAR BUTTON */}
      <div className="relative flex-1 min-w-[220px] group">
        <Search
          className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-300"
          style={{ color: brandColor }}
        />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-11 pl-11 pr-10 text-xs sm:text-sm font-mono bg-[var(--bg-main)]/60 border border-[var(--border-card)] focus:border-[var(--filter-brand)] focus:ring-1 focus:ring-[var(--filter-brand)] focus:outline-none rounded-2xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all duration-300 shadow-inner group-hover:border-[var(--text-muted)]"
        />
        {searchValue && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. FILTER OPTIONS (PILLS OR DROPDOWN SELECT) */}
      {options.length > 0 && onFilterChange && (
        renderAsSelect ? (
          <div className="relative flex items-center shrink-0 min-w-[210px] group/sel">
            {/* Selected Game PNG Logo or Icon */}
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center">
              {activeGame?.logoUrl ? (
                <GameLogo game={activeGame} size="sm" className="filter drop-shadow" />
              ) : (
                <span className="text-xs font-mono">
                  {activeGame?.icon || (['ALL', 'TODOS'].includes(activeFilter) ? '🌐' : '🎮')}
                </span>
              )}
            </div>

            <select
              value={activeFilter}
              onChange={(e) => onFilterChange(e.target.value)}
              className="w-full h-11 pl-11 pr-9 text-xs font-mono font-bold uppercase bg-[var(--bg-main)] border border-[var(--border-card)] hover:border-[var(--filter-brand)] focus:border-[var(--filter-brand)] focus:ring-1 focus:ring-[var(--filter-brand)] focus:outline-none rounded-2xl text-[var(--text-heading)] transition-all cursor-pointer shadow-md appearance-none"
              style={
                activeFilter !== 'ALL' && activeFilter !== 'TODOS' && activeGame
                  ? {
                      borderColor: activeGame.brandColor || brandColor,
                      color: activeGame.brandColor || brandColor,
                      backgroundColor: `color-mix(in srgb, ${activeGame.brandColor || brandColor} 12%, transparent)`,
                    }
                  : undefined
              }
            >
              {options.map((opt) => {
                const gConfig = GAMES_CATALOG[opt.id];
                const iconPrefix = gConfig?.icon || (['ALL', 'TODOS'].includes(opt.id) ? '🌐' : '🎮');
                return (
                  <option key={opt.id} value={opt.id} className="bg-[var(--bg-card)] text-[var(--text-primary)] font-bold py-1.5">
                    {iconPrefix} {opt.label}
                  </option>
                );
              })}
            </select>
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)] z-10">
              ▼
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none touch-pan-x flex-shrink-0">
            {options.map((opt) => {
              const isActive = activeFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onFilterChange(opt.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap border select-none active:scale-95 ${
                    isActive
                      ? 'shadow-md'
                      : 'bg-[var(--bg-main)]/40 border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: `color-mix(in srgb, ${brandColor} 20%, transparent)`,
                          borderColor: brandColor,
                          color: brandColor,
                          boxShadow: `0 0 15px color-mix(in srgb, ${brandColor} 30%, transparent)`,
                        }
                      : undefined
                  }
                >
                  {opt.icon}
                  {opt.label}
                </button>
              );
            })}
          </div>
        )
      )}

      {/* 3. OPTIONAL RESULTS COUNT BADGE */}
      {typeof count === 'number' && (
        <div className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest px-3.5 py-2 bg-[var(--bg-main)]/60 rounded-xl border border-[var(--border-card)] shrink-0 flex items-center gap-1.5 self-start md:self-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--filter-brand)] animate-pulse" />
          <span>
            {count} {countLabel}
          </span>
        </div>
      )}

      {/* 4. ADDITIONAL CHILDREN SLOT */}
      {children && <div className="flex-shrink-0 flex items-center gap-2">{children}</div>}
    </div>
  );
}
