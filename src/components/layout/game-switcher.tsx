'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check, ChevronDown, Gamepad2 } from 'lucide-react';
import { GAMES_CATALOG, type GameConfig } from '@/lib/games-data';
import { PUBLIC_GAME_SECTIONS } from '@/lib/section-config';
import { GameLogo } from '@/components/ui/game-logo';

interface GameSwitcherProps {
  game: GameConfig;
  compact?: boolean;
  className?: string;
}

function targetForGame(pathname: string, nextSlug: string) {
  const segments = pathname.split('/').filter(Boolean);
  const currentSection = segments[1];
  const aliases: Record<string, string> = { usuarios: 'jugadores' };
  const normalizedSection = aliases[currentSection] || currentSection;
  const canPreserveSection = segments.length === 2 && PUBLIC_GAME_SECTIONS.includes(normalizedSection as (typeof PUBLIC_GAME_SECTIONS)[number]);
  return canPreserveSection ? `/${nextSlug}/${normalizedSection}` : `/${nextSlug}`;
}

export function GameSwitcher({ game, compact = false, className = '' }: GameSwitcherProps) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const closeOnOutside = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className={`game-switcher relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="game-switcher-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Cambiar juego. Juego actual: ${game.name}`}
      >
        <GameLogo game={game} size="sm" />
        <span className="game-switcher-copy">
          {!compact ? <small>Disciplina activa</small> : null}
          <strong>{game.name}</strong>
        </span>
        <ChevronDown className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="game-switcher-menu" role="menu" aria-label="Seleccionar disciplina">
          <div className="game-switcher-heading">
            <span><Gamepad2 className="size-4" />Cambiar disciplina</span>
            <small>{Object.keys(GAMES_CATALOG).length} juegos</small>
          </div>
          <div className="game-switcher-grid">
            {Object.values(GAMES_CATALOG).map((item) => {
              const active = item.slug === game.slug;
              return (
                <Link
                  key={item.id}
                  href={targetForGame(pathname, item.slug)}
                  onClick={() => setOpen(false)}
                  role="menuitem"
                  className={active ? 'is-active' : ''}
                  style={{ '--switcher-color': item.brandColor } as React.CSSProperties}
                >
                  <GameLogo game={item} size="sm" />
                  <span><strong>{item.name}</strong><small>{item.category}</small></span>
                  {active ? <Check className="size-4" /> : null}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
