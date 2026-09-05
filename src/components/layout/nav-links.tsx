'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/components/providers/language-provider';
import { GAMES_CATALOG } from '@/lib/games-data';
import { GameLogo } from '@/components/ui/game-logo';
import { Home, Gamepad2, ChevronDown, Sparkles, Shield, Flag, Users, Info } from 'lucide-react';

export function NavLinks() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [isGamesOpen, setIsGamesOpen] = useState(false);
  const gamesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (gamesRef.current && !gamesRef.current.contains(event.target as Node)) {
        setIsGamesOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsGamesOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const isCurrent = (href: string) => href === '/' ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="ui-navigation-list hidden lg:flex" aria-label="Navegación principal">
      <Link
        href="/"
        aria-current={isCurrent('/') ? 'page' : undefined}
        className="ui-navigation-link"
      >
        <Home className="size-3.5" />
        Inicio
      </Link>

      {/* Juegos Dropdown */}
      <div className="relative font-[family-name:var(--font-active)]" ref={gamesRef}>
        <button
          type="button"
          onClick={() => setIsGamesOpen(!isGamesOpen)}
          onMouseEnter={() => setIsGamesOpen(true)}
          aria-expanded={isGamesOpen}
          aria-controls="public-games-menu"
          className="ui-navigation-link"
        >
          <Gamepad2 className="size-3.5" />
          {t('nav.games')}
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isGamesOpen ? 'rotate-180 text-[var(--app-accent)]' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isGamesOpen && (
          <div
            id="public-games-menu"
            className="ui-navigation-popover absolute left-0 top-full z-50 mt-2 w-64 p-2 animate-in fade-in zoom-in-95 duration-150"
            onMouseLeave={() => setIsGamesOpen(false)}
          >
            <div className="px-2 py-1 mb-1 border-b border-[var(--border-card)] flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-[family-name:var(--font-active)]">Disciplinas eSports</span>
              <Sparkles className="w-3 h-3 text-[var(--app-accent)]" />
            </div>
            <div className="space-y-1">
              {Object.values(GAMES_CATALOG).map((game) => (
                <Link
                  key={game.id}
                  href={`/${game.slug}`}
                  onClick={() => setIsGamesOpen(false)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <GameLogo game={game} size="sm" className="group-hover:scale-110" />
                    <div>
                      <span className="font-bold text-xs block text-[var(--text-heading)] group-hover:text-[var(--app-accent)] transition-colors font-[family-name:var(--font-active)]">
                        {game.name}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] block line-clamp-1 font-[family-name:var(--font-active)]">{game.category}</span>
                    </div>
                  </div>
                  <span
                    className="w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: game.semanticPalette?.brandPrimary || game.brandColor }}
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Link
        href="/equipos"
        aria-current={isCurrent('/equipos') ? 'page' : undefined}
        className="ui-navigation-link"
      >
        <Shield className="size-3.5" />
        Equipos
      </Link>

      <Link
        href="/organizaciones"
        aria-current={isCurrent('/organizaciones') ? 'page' : undefined}
        className="ui-navigation-link"
      >
        <Flag className="size-3.5" />
        {t('nav.organizations')}
      </Link>

      <Link
        href="/usuarios"
        aria-current={isCurrent('/usuarios') ? 'page' : undefined}
        className="ui-navigation-link"
      >
        <Users className="size-3.5" />
        Usuarios
      </Link>

      <Link
        href="/informacion"
        aria-current={isCurrent('/informacion') ? 'page' : undefined}
        className="ui-navigation-link"
      >
        <Info className="size-3.5" />
        Información
      </Link>
    </nav>
  );
}
