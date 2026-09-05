'use client';

import React from 'react';
import { GameConfig } from '@/lib/games-data';
import { GameHighlightsSection } from '@/components/game/game-highlights-section';
import { GameLogo } from '@/components/ui/game-logo';
import { Button } from '@/components/ui/button';
import { ParachuteDownloadButton } from '@/components/ui/parachute-download-button';
import { PublicPortalOverview } from '@/components/public/public-portal-overview';
import type { PublicPortalSummary } from '@/lib/public-home-summary';
import {
  Trophy, Shield, Award, Calendar, Sparkles, ChevronRight, Zap,
} from 'lucide-react';

interface GameHomeHeroProps {
  game: GameConfig;
  summary?: PublicPortalSummary;
  onNavigate: (section: string) => void;
}

const EMPTY_SUMMARY: PublicPortalSummary = { counts: { users: 0, organizations: 0, teams: 0, competitions: 0, liveMatches: 0 }, matches: [], competitions: [], organizations: [], teams: [] };

export function GameHomeHero({ game, summary = EMPTY_SUMMARY, onNavigate }: GameHomeHeroProps) {
  const identityData = JSON.stringify({
    discipline: game.name,
    slug: game.slug,
    scene: game.visualTheme.scene,
    motif: game.visualTheme.motif,
    palette: [game.brandColor, game.accentColor, game.visualTheme.glow, game.visualTheme.highlight],
  }, null, 2);

  return (
    <div className="game-home space-y-10 sm:space-y-14 pt-3 sm:pt-4">
      {/* 1. IMMERSIVE EDGE-TO-EDGE HERO OVERLAY */}
      <div className="game-home-hero relative min-h-[380px] sm:min-h-[460px] flex flex-col justify-end pb-8 sm:pb-12 pt-8">
        
        {/* Top Status & Category Badges */}
        <div className="game-home-statusbar absolute top-0 left-0 w-full flex flex-wrap items-center justify-between gap-3 px-2 sm:px-0 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="game-home-brand-pill px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1.5 backdrop-blur-md border">
              <Sparkles className="w-3.5 h-3.5" />
              PORTAL OFICIAL
            </span>
            <span className="px-3.5 py-1 rounded-full bg-[var(--bg-card)]/80 backdrop-blur-md text-[var(--text-muted)] border border-[var(--border-card)] text-xs font-bold uppercase tracking-wider shadow-md">
              {game.category}
            </span>
            <span className="game-home-scene-label">
              <span /> {game.visualTheme.scene} · {game.visualTheme.motif}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--app-positive)] bg-[var(--app-positive-soft)] backdrop-blur-md px-3 py-1 rounded-full border border-[var(--app-positive)]/30 shadow-md animate-pulse">
            <Zap className="w-3.5 h-3.5 text-[var(--app-positive)] fill-[var(--app-positive)] dark:fill-[var(--app-positive)]" />
            CIRCUITO ACTIVO 2026
          </div>
        </div>

        {/* Title & Tagline Showcase (Massive Typography) */}
        <div className="game-home-copy relative z-10 max-w-5xl mt-auto px-2 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 mb-5">
            <div className="game-home-logo w-16 h-16 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center shadow-xl border-2 flex-shrink-0 backdrop-blur-xl transform hover:scale-105 transition-transform duration-500">
              <GameLogo game={game} size="xl" />
            </div>
            <div className="pb-1 sm:pb-2">
              <h1 className="game-home-title text-4xl sm:text-6xl lg:text-[5.5rem] font-black tracking-tight uppercase leading-[0.9]">
                {game.name}
              </h1>
              <p className="game-home-tagline text-base sm:text-xl text-[var(--text-primary)] font-extrabold mt-2 tracking-widest uppercase drop-shadow-md border-l-4 pl-3 sm:pl-4">
                {game.tagline}
              </p>
            </div>
          </div>
          <p className="game-home-description text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-3xl font-medium p-4 rounded-xl border border-[var(--border-card)]/50">
            {game.description}
          </p>
        </div>

        {/* Quick Navigation Action Buttons */}
        <div className="game-home-actions relative z-10 flex flex-wrap items-center gap-3 pt-6 sm:pt-8 px-2 sm:px-0">
          <Button
            onClick={() => onNavigate('partidos')}
            className="game-home-primary-action font-black text-xs sm:text-sm h-11 sm:h-12 px-6 uppercase tracking-widest rounded-xl transition-all hover:scale-105 shadow-lg"
          >
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Fixture de Partidos
          </Button>
          <Button
            onClick={() => onNavigate('clasificacion')}
            variant="outline"
            className="game-home-secondary-action font-bold text-xs sm:text-sm h-11 sm:h-12 px-6 uppercase tracking-widest rounded-xl border-2 bg-[var(--bg-main)]/60 backdrop-blur-md transition-all hover:bg-[var(--bg-card)] text-[var(--text-heading)] shadow-md"
          >
            <Award className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Clasificación
          </Button>
          <Button
            onClick={() => onNavigate('equipos')}
            variant="outline"
            className="font-bold text-xs sm:text-sm h-11 sm:h-12 px-6 uppercase tracking-widest rounded-xl bg-[var(--bg-main)]/60 backdrop-blur-md border border-[var(--border-card)] transition-all hover:bg-[var(--bg-card)] text-[var(--text-heading)] shadow-md hover:border-[var(--text-muted)]"
          >
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Directorio Escuadras
          </Button>
          <ParachuteDownloadButton
            data={identityData}
            fileName={`${game.slug}-visual-identity.json`}
            label="Descargar identidad"
          />
        </div>
      </div>

      {/* 2. CYBERNETIC HUD METRICS STRIPE */}
      <GameMetricsStripe summary={summary} />

      <PublicPortalOverview summary={summary} gameSlug={game.slug} />

      {/* 4. INTERACTIVE DISCIPLINE MODULE CARDS GRID */}
      <GameModuleCards game={game} onNavigate={onNavigate} />

      {/* 5. DISCIPLINE NEWS & PATCH NOTES FEED */}
      <div className="space-y-6">
        <GameHighlightsSection game={game} />
      </div>
    </div>
  );
}

// ── Metrics Stripe Sub-component ────────────────────────────────────────────
function GameMetricsStripe({ summary }: { summary: PublicPortalSummary }) {
  const metrics = [
    { label: 'Competencias', value: summary.counts.competitions, sub: `${summary.counts.liveMatches} encuentros activos`, tone: 'positive' },
    { label: 'Escuadras', value: summary.counts.teams, sub: 'Clubes registrados', tone: 'positive' },
    { label: 'Atletas', value: summary.counts.users, sub: 'Jugadores públicos', tone: 'secondary' },
    { label: 'Organizaciones', value: summary.counts.organizations, sub: 'Circuitos de la disciplina', tone: 'warning' },
  ] as const;

  return (
    <div className="game-home-metrics grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
      {metrics.map((m, i) => (
        <div
          key={i}
          data-tone={m.tone}
          className="game-home-metric relative group p-4 sm:p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 overflow-hidden"
        >
          <div className="game-home-metric-glow absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none" />
          <div className="game-home-metric-bar absolute top-0 left-0 w-1 h-full opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="space-y-1 relative z-10 pl-2">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[var(--text-muted)] block">{m.label}</span>
            <span className="game-home-metric-value text-4xl sm:text-5xl font-black block tracking-tighter drop-shadow-md">{m.value}</span>
            <span className="game-home-metric-sub text-[10px] sm:text-xs font-bold uppercase tracking-wider">{m.sub}</span>
          </div>
        </div>
      ))}
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
