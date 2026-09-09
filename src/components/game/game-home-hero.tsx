'use client';

import React from 'react';
import { GameConfig } from '@/lib/games-data';
import { GameHighlightsSection } from '@/components/game/game-highlights-section';
import { GamePortalSectionHeader } from '@/components/game/game-portal-section-header';
import { PublicPortalOverview } from '@/components/public/public-portal-overview';
import type { PublicPortalSummary } from '@/lib/public-home-summary';
import {
  Trophy, Shield, Award, ChevronRight,
} from 'lucide-react';

interface GameHomeHeroProps {
  game: GameConfig;
  summary?: PublicPortalSummary;
  onNavigate: (section: string) => void;
}

const EMPTY_SUMMARY: PublicPortalSummary = { counts: { users: 0, organizations: 0, teams: 0, competitions: 0, liveMatches: 0 }, matches: [], competitions: [], organizations: [], teams: [] };

export function GameHomeHero({ game, summary = EMPTY_SUMMARY, onNavigate }: GameHomeHeroProps) {
  return (
    <div className="game-home space-y-10 sm:space-y-14 pt-3 sm:pt-4">
      <GamePortalSectionHeader game={game} section="home" summary={summary} />

      <PublicPortalOverview summary={summary} gameSlug={game.slug} showMetrics={false} />

      {/* 4. INTERACTIVE DISCIPLINE MODULE CARDS GRID */}
      <GameModuleCards game={game} onNavigate={onNavigate} />

      {/* 5. DISCIPLINE NEWS & PATCH NOTES FEED */}
      <div className="space-y-6">
        <GameHighlightsSection game={game} />
      </div>
    </div>
  );
}

// ── Module Cards Sub-component ──────────────────────────────────────────────
function GameModuleCards({ game, onNavigate }: { game: GameConfig; onNavigate: (s: string) => void }) {
  const modules = [
    { key: 'competencias', icon: Trophy, title: 'Competencias Oficiales', desc: `Consulta todas las ligas activas, fixture de partidos, formatos de fase de grupos y playoffs de ${game.name}.`, cta: 'Explorar Torneos' },
    { key: 'clasificacion', icon: Award, title: 'Tabla de Posiciones', desc: 'Revisa las posiciones en tiempo real, puntos acumulados y estadísticas de rendimiento de cada equipo.', cta: 'Ver Clasificación' },
    { key: 'equipos', icon: Shield, title: 'Directorio de Escuadras', desc: `Conoce las organizaciones verificadas, fichas de clubes y plantillas completas que compiten en ${game.name}.`, cta: 'Ver Fichas de Clubes' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {modules.map((mod) => (
        <div
          key={mod.key}
          onClick={() => onNavigate(mod.key)}
          className="game-home-module relative p-6 sm:p-8 rounded-3xl border border-[var(--border-card)] transition-all duration-300 cursor-pointer group flex flex-col justify-between overflow-hidden hover:-translate-y-1"
        >
          {/* Animated Hover Background */}
          <div className="game-home-module-glow absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none" />
          
          {/* Top Border Beam */}
          <div className="game-home-module-beam absolute top-0 left-0 w-0 h-1 transition-all duration-700 group-hover:w-full" />

          <div className="space-y-4 relative z-10">
            <div className="game-home-module-icon w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border-2 transition-transform duration-500 group-hover:scale-110 shadow-md">
              <mod.icon className="w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-500" />
            </div>
            <h3 className="font-black text-xl sm:text-2xl uppercase tracking-tighter text-[var(--text-heading)] transition-colors">
              {mod.title}
            </h3>
            <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] transition-colors leading-relaxed">
              {mod.desc}
            </p>
          </div>

          <div className="pt-6 sm:pt-8 mt-auto flex items-center justify-between text-xs font-black uppercase tracking-widest relative z-10 text-[var(--text-primary)]">
            <span className="game-home-module-cta transition-colors">{mod.cta}</span>
            <ChevronRight className="game-home-module-cta w-5 h-5 transition-transform duration-300 group-hover:translate-x-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
