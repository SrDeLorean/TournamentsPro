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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="hidden lg:flex items-center gap-1">
      <Link
        href="/"
        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:bg-[var(--bg-card-hover)] transition-all duration-300 flex items-center gap-1.5 neon-fx-hover"
      >
        <Home className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
        Inicio
      </Link>

      {/* Juegos Dropdown */}
      <div className="relative" ref={gamesRef}>
        <button
          onClick={() => setIsGamesOpen(!isGamesOpen)}
          onMouseEnter={() => setIsGamesOpen(true)}
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:bg-[var(--bg-card-hover)] transition-all duration-300 flex items-center gap-1.5 neon-fx-hover"
        >
          <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
          {t('nav.games')}
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isGamesOpen ? 'rotate-180 text-[var(--accent-cyan)]' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isGamesOpen && (
          <div
            className="absolute top-full left-0 mt-1 w-64 rounded-xl glass-panel p-2 shadow-2xl border border-[var(--border-card)] animate-in fade-in zoom-in-95 duration-150 z-50"
            onMouseLeave={() => setIsGamesOpen(false)}
          >
            <div className="px-2 py-1 mb-1 border-b border-[var(--border-card)] flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Disciplinas eSports</span>
              <Sparkles className="w-3 h-3 text-[var(--accent-cyan)]" />
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
                      <span className="font-bold text-xs block text-[var(--text-heading)] group-hover:text-[var(--accent-cyan)] transition-colors">
                        {game.name}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] block line-clamp-1">{game.category}</span>
                    </div>
                  </div>
                  <span
                    className="w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: game.brandColor }}
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Link
        href="/equipos"
        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:bg-[var(--bg-card-hover)] transition-all duration-300 flex items-center gap-1.5 neon-fx-hover"
      >
        <Shield className="w-3.5 h-3.5 text-emerald-400" />
        Equipos
      </Link>

      <Link
        href="/organizaciones"
        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:bg-[var(--bg-card-hover)] transition-all duration-300 flex items-center gap-1.5 neon-fx-hover"
      >
        <Flag className="w-3.5 h-3.5 text-yellow-400" />
        {t('nav.organizations')}
      </Link>

      <Link
        href="/usuarios"
        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:bg-[var(--bg-card-hover)] transition-all duration-300 flex items-center gap-1.5 neon-fx-hover"
      >
        <Users className="w-3.5 h-3.5 text-cyan-400" />
        Usuarios
      </Link>

      <Link
        href="/informacion"
        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:bg-[var(--bg-card-hover)] transition-colors flex items-center gap-1.5"
      >
        <Info className="w-3.5 h-3.5 text-slate-400" />
        Información
      </Link>
    </nav>
  );
}
