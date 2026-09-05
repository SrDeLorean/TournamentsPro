'use client';

import { useId, useState, useRef, useEffect, type CSSProperties, type ReactNode } from 'react';
import { Check, ChevronDown, Layers, LoaderCircle, Search, SlidersHorizontal, X } from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games-data';
import { GameLogo } from '@/components/ui/game-logo';
import { cn } from '@/lib/utils';

export interface FilterOption {
  id: string;
  label: string;
  icon?: ReactNode;
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
  searchLabel?: string;
  filterLabel?: string;
  isLoading?: boolean;
  className?: string;
  children?: ReactNode;
}

export function FilterBar({
  searchPlaceholder = 'Buscar por nombre, tag o palabras clave...',
  searchValue,
  onSearchChange,
  options = [],
  activeFilter = 'TODOS',
  onFilterChange,
  renderAsSelect = false,
  brandColor = 'var(--game-brand, var(--app-accent))',
  count,
  countLabel = 'REGISTROS',
  searchHint = 'ENTER',
  searchLabel = 'Buscar',
  filterLabel = 'Filtrar por',
  isLoading = false,
  className,
  children,
}: FilterBarProps) {
  const searchId = useId();
  const selectId = useId();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeGame = GAMES_CATALOG[activeFilter];
  const activeOption = options.find((option) => option.id === activeFilter);
  const activeColor = activeGame?.brandColor || brandColor;

  // Cierra el dropdown al hacer click fuera o presionar Escape
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  // Renderiza el logo oficial real de la disciplina o un icono limpio para "Todas"
  const renderOptionLogo = (optionId: string, size: 'sm' | 'md' = 'sm') => {
    const game = GAMES_CATALOG[optionId];
    if (game?.logoUrl) {
      return (
        <span className="ui-filter-logo-box" style={{ '--opt-brand': game.brandColor } as CSSProperties}>
          <GameLogo game={game} size={size} className="ui-filter-game-logo" />
        </span>
      );
    }
    if (['ALL', 'TODOS'].includes(optionId)) {
      return (
        <span className="ui-filter-logo-box is-all">
          <Layers className="size-3.5" aria-hidden="true" />
        </span>
      );
    }
    const opt = options.find((o) => o.id === optionId);
    if (opt?.icon) {
      return (
        <span className="ui-filter-logo-box">
          {opt.icon}
        </span>
      );
    }
    return (
      <span className="ui-filter-logo-box is-all">
        <Layers className="size-3.5" aria-hidden="true" />
      </span>
    );
  };

  return (
    <div
      className={cn(
        'ui-filter-bar game-filter-panel font-[family-name:var(--font-active)]',
        isLoading && 'is-loading',
        isDropdownOpen && 'is-dropdown-open',
        className
      )}
      style={{ '--filter-brand': brandColor } as CSSProperties}
    >
      {/* 1. CONTROL DE BÚSQUEDA */}
      <div className="ui-filter-search game-search-control">
        <label className="ui-filter-field-label" htmlFor={searchId}>
          <Search className="size-3.5" aria-hidden="true" />
          <span>{searchLabel}</span>
        </label>
        <div className="ui-filter-control-shell">
          <Search className="ui-filter-leading-icon" aria-hidden="true" />
          <input
            id={searchId}
            type="search"
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            className="ui-filter-input"
          />
          {isLoading ? (
            <LoaderCircle className="ui-filter-loading-icon" aria-label="Actualizando resultados" />
          ) : searchValue ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Limpiar búsqueda"
              className="game-search-clear ui-filter-clear"
            >
              <X className="size-4" />
            </button>
          ) : (
            <kbd className="game-search-hint ui-filter-hint">{searchHint}</kbd>
          )}
        </div>
      </div>

      {/* 2. SELECTOR DE OPCIONES / DISCIPLINAS */}
      {options.length > 0 && onFilterChange ? (
        renderAsSelect ? (
          <div
            className={cn('ui-filter-select-group', isDropdownOpen && 'is-dropdown-open')}
            style={{ '--filter-option-brand': activeColor } as CSSProperties}
          >
            <span className="ui-filter-field-label">
              <SlidersHorizontal className="size-3.5" aria-hidden="true" />
              {filterLabel}
            </span>
            <div ref={dropdownRef} className="ui-filter-control-shell is-select-custom">
              <button
                id={selectId}
                type="button"
                role="combobox"
                aria-expanded={isDropdownOpen}
                aria-haspopup="listbox"
                aria-label={`${filterLabel}: ${activeOption?.label || activeFilter}`}
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className={cn('ui-filter-select-trigger', isDropdownOpen && 'is-open')}
              >
                <div className="ui-filter-trigger-content">
                  {renderOptionLogo(activeFilter, 'sm')}
                  <span className="ui-filter-trigger-label">
                    {activeOption?.label || activeGame?.name || activeFilter}
                  </span>
                </div>
                <ChevronDown
                  className={cn('ui-filter-chevron', isDropdownOpen && 'is-open')}
                  aria-hidden="true"
                />
              </button>

              {/* MENÚ DESPLEGABLE CON LOGOS OFICIALES REALES */}
              {isDropdownOpen && (
                <div
                  role="listbox"
                  aria-label={filterLabel}
                  className="ui-filter-dropdown-menu"
                >
                  <div className="ui-filter-dropdown-header">
                    <span>Disciplinas oficiales</span>
                    <span className="ui-filter-dropdown-badge">{options.length}</span>
                  </div>
                  <div className="ui-filter-dropdown-list">
                    {options.map((option) => {
                      const isSelected = activeFilter === option.id;
                      const game = GAMES_CATALOG[option.id];
                      const optColor = game?.brandColor || brandColor;
                      const isAll = ['ALL', 'TODOS'].includes(option.id);

                      return (
                        <button
                          key={option.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            onFilterChange(option.id);
                            setIsDropdownOpen(false);
                          }}
                          className={cn('ui-filter-dropdown-item', isSelected && 'is-selected')}
                          style={{ '--item-brand': optColor } as CSSProperties}
                        >
                          {renderOptionLogo(option.id, 'sm')}
                          <div className="ui-filter-dropdown-item-info">
                            <span className="ui-filter-dropdown-item-title">
                              {option.label}
                            </span>
                            {game?.category ? (
                              <span className="ui-filter-dropdown-item-category">
                                {game.category}
                              </span>
                            ) : isAll ? (
                              <span className="ui-filter-dropdown-item-category">
                                Catálogo general
                              </span>
                            ) : null}
                          </div>
                          {isSelected ? (
                            <Check className="ui-filter-dropdown-check" aria-hidden="true" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="ui-filter-options-group">
            <span className="ui-filter-field-label">
              <SlidersHorizontal className="size-3.5" aria-hidden="true" />
              {filterLabel}
            </span>
            <div className="game-filter-options mobile-scroll-row" role="group" aria-label={filterLabel}>
              {options.map((option) => {
                const isActive = activeFilter === option.id;
                const game = GAMES_CATALOG[option.id];
                const optionColor = game?.brandColor || brandColor;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onFilterChange(option.id)}
                    aria-pressed={isActive}
                    className="game-filter-option"
                    style={{ '--filter-option-brand': optionColor } as CSSProperties}
                  >
                    {renderOptionLogo(option.id, 'sm')}
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )
      ) : null}

      {/* 3. CONTADOR DE RESULTADOS */}
      {typeof count === 'number' ? (
        <output aria-live="polite" aria-busy={isLoading} className="ui-filter-result-count">
          <span className="ui-filter-result-pulse" />
          <span className="ui-filter-result-copy">
            <strong>{isLoading ? '—' : count}</strong>
            <small>{countLabel}</small>
          </span>
        </output>
      ) : null}

      {/* 4. ACCIONES O BOTONES ADICIONALES */}
      {children ? <div className="ui-filter-actions">{children}</div> : null}
    </div>
  );
}
