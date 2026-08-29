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
  searchHint?: string;
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
  searchHint = 'ENTER',
  children,
}: FilterBarProps) {
  const activeGame = GAMES_CATALOG[activeFilter];

  return (
    <div
      className="ui-filter-bar game-filter-panel flex min-w-0 flex-col gap-3 p-3 text-[var(--text-primary)] sm:gap-4 sm:p-4 xl:flex-row xl:flex-wrap xl:items-center"
      style={{ '--filter-brand': brandColor } as React.CSSProperties}
    >
      {/* 1. SEARCH INPUT WITH CLEAR BUTTON */}
      <div className="game-search-control group relative w-full min-w-0 flex-1 xl:min-w-[16rem] xl:basis-[20rem]">
        <Search
          className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-300"
          style={{ color: brandColor }}
        />
        <input
          type="search"
          aria-label={searchPlaceholder}
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="ui-control w-full h-11 pl-11 pr-16 text-xs sm:text-sm font-mono placeholder:text-[var(--text-muted)]"
        />
        {searchValue ? (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Limpiar búsqueda"
            className="game-search-clear absolute right-3.5 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <kbd className="game-search-hint absolute right-3.5 top-1/2 -translate-y-1/2">{searchHint}</kbd>
        )}
      </div>

      {/* 2. FILTER OPTIONS (PILLS OR DROPDOWN SELECT) */}
      {options.length > 0 && onFilterChange && (
        renderAsSelect ? (
          <div className="group/sel relative flex w-full min-w-0 shrink-0 items-center sm:max-w-full xl:w-auto xl:min-w-[13rem]">
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
              aria-label="Seleccionar filtro"
              value={activeFilter}
              onChange={(e) => onFilterChange(e.target.value)}
              className="ui-control w-full h-11 pl-11 pr-9 text-xs font-mono font-bold uppercase cursor-pointer appearance-none"
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
          <div className="game-filter-options mobile-scroll-row flex w-full flex-shrink-0 touch-pan-x items-center gap-2 overflow-x-auto pb-1 xl:w-auto xl:pb-0">
            {options.map((opt) => {
              const isActive = activeFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onFilterChange(opt.id)}
                  aria-pressed={isActive}
                  className={`game-filter-option px-3.5 py-2 rounded-[var(--ui-radius-control)] text-xs font-mono font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap border select-none active:scale-95 ${
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
        <output aria-live="polite" className="flex min-h-10 w-full shrink-0 items-center justify-between gap-1.5 self-start rounded-[var(--ui-radius-control)] border border-[var(--border-card)] bg-[var(--bg-subtle)] px-3.5 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] shadow-sm sm:w-auto xl:self-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--filter-brand)] animate-pulse" />
          <span>
            {count} {countLabel}
          </span>
        </output>
      )}

      {/* 4. ADDITIONAL CHILDREN SLOT */}
      {children && <div className="flex w-full min-w-0 flex-1 flex-wrap items-center gap-2 xl:w-auto">{children}</div>}
    </div>
  );
}
