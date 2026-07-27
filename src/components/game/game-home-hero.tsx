'use client';

import React from 'react';
import { GameConfig } from '@/lib/games-data';
import { GameHighlightsSection } from '@/components/game/game-highlights-section';
import { GameLogo } from '@/components/ui/game-logo';
import { Button } from '@/components/ui/button';
import {
  Trophy, Shield, Award, Calendar, Sparkles, ChevronRight, Radio, Zap, Play,
} from 'lucide-react';

interface MockMatch {
  id: number;
  home: string;
  homeTag: string;
  away: string;
  awayTag: string;
  date: string;
  jornada: string;
  status: string;
  score: string;
}

interface GameHomeHeroProps {
  game: GameConfig;
  brandColor: string;
  mockMatches: MockMatch[];
  onNavigate: (section: string) => void;
}

export function GameHomeHero({ game, brandColor, mockMatches, onNavigate }: GameHomeHeroProps) {
  return (
    <div className="space-y-10 sm:space-y-14 pt-3 sm:pt-4">
      {/* 1. GIANT FULL-BLEED HIGH-IMPACT HERO BANNER */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-[var(--border-card)] shadow-2xl p-6 sm:p-12 min-h-[380px] sm:min-h-[460px] flex flex-col justify-between">
        {/* Vibrant Ambient Glow Sphere */}
        <div
          className="absolute -top-24 -right-24 w-[450px] h-[450px] opacity-30 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: brandColor }}
        />

        {/* Top Status & Category Badges */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-md flex items-center gap-1.5"
              style={{
                backgroundColor: `${brandColor}25`,
                borderColor: `${brandColor}60`,
                color: '#FFFFFF',
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              PORTAL OFICIAL
            </span>
            <span className="px-3.5 py-1 rounded-full bg-slate-900/90 text-slate-300 border border-slate-700 text-xs font-mono font-bold uppercase tracking-wider">
              {game.category}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40">
            <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            CIRCUITO ACTIVO 2026
          </div>
        </div>

        {/* Title & Tagline Showcase */}
        <div className="relative z-10 space-y-3 sm:space-y-4 my-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div
              className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center shadow-2xl border flex-shrink-0"
              style={{
                backgroundColor: `${brandColor}25`,
                borderColor: `${brandColor}70`,
                boxShadow: `0 12px 35px color-mix(in srgb, ${brandColor} 50%, transparent)`,
              }}
            >
              <GameLogo game={game} size="xl" className="hidden sm:inline-flex" />
              <GameLogo game={game} size="lg" className="sm:hidden" />
            </div>
            <div>
              <h1
                className="text-3xl sm:text-6xl lg:text-7xl font-black tracking-tight uppercase leading-none drop-shadow-xl"
                style={{ color: brandColor }}
              >
                {game.name}
              </h1>
              <p className="text-sm sm:text-xl text-[var(--text-heading)] font-extrabold mt-1 tracking-wide">
                {game.tagline}
              </p>
            </div>
          </div>
          <p className="text-xs sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-3xl font-medium pt-2">
            {game.description}
          </p>
        </div>

        {/* Quick Navigation Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-3 pt-2">
          <Button
            onClick={() => onNavigate('partidos')}
            style={{
              backgroundColor: brandColor,
              color: '#FFFFFF',
              boxShadow: `0 6px 25px color-mix(in srgb, ${brandColor} 45%, transparent)`,
            }}
            className="font-black text-xs sm:text-sm h-11 px-6 uppercase tracking-wider"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Ver Fixture de Partidos
          </Button>
          <Button
            onClick={() => onNavigate('clasificacion')}
            variant="outline"
            className="font-bold text-xs sm:text-sm h-11 px-6 uppercase tracking-wider border-2"
            style={{ borderColor: `${brandColor}60` }}
          >
            <Award className="w-4 h-4 mr-2" />
            Tabla de Clasificación
          </Button>
          <Button
            onClick={() => onNavigate('equipos')}
            variant="outline"
            className="font-bold text-xs sm:text-sm h-11 px-6 uppercase tracking-wider"
          >
            <Shield className="w-4 h-4 mr-2" />
            Directorio de Escuadras
          </Button>
        </div>
      </div>

      {/* 2. CYBERNETIC HUD METRICS STRIPE */}
      <GameMetricsStripe brandColor={brandColor} />

      {/* 3. FEATURED MATCHDAY VS CLASH SPOTLIGHT */}
      <MatchdaySpotlight brandColor={brandColor} matches={mockMatches} />

      {/* 4. INTERACTIVE DISCIPLINE MODULE CARDS GRID */}
      <GameModuleCards game={game} brandColor={brandColor} onNavigate={onNavigate} />

      {/* 5. DISCIPLINE NEWS & PATCH NOTES FEED */}
      <div className="space-y-6">
        <GameHighlightsSection game={game} />
      </div>
    </div>
  );
}

// ── Metrics Stripe Sub-component ────────────────────────────────────────────
function GameMetricsStripe({ brandColor }: { brandColor: string }) {
  const metrics = [
    { label: 'Torneos Disputándose', value: '8', sub: '● Circuitos En Curso', color: brandColor, subColor: 'text-emerald-400' },
    { label: 'Escuadras de Élite', value: '16', sub: 'Clubes Certificados', color: 'rgb(52, 211, 153)', subColor: 'text-[var(--text-muted)]' },
    { label: 'Atletas Inscritos', value: '248', sub: 'Jugadores Verificados', color: 'rgb(192, 132, 252)', subColor: 'text-[var(--text-muted)]' },
    { label: 'Prize Pool Acumulado', value: '$2,500 USD', sub: '★ Premios de la Liga', color: 'rgb(251, 191, 36)', subColor: 'text-amber-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
      {metrics.map((m, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl glass-panel border shadow-xl space-y-1 transition-transform hover:-translate-y-1"
          style={{ borderColor: `${brandColor}40` }}
        >
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[var(--text-muted)] block">{m.label}</span>
          <span className="text-2xl sm:text-4xl font-black block" style={{ color: m.color }}>{m.value}</span>
          <span className={`text-[10px] font-mono font-bold ${m.subColor}`}>{m.sub}</span>
        </div>
      ))}
    </div>
  );
}

// ── Matchday Spotlight Sub-component ────────────────────────────────────────
function MatchdaySpotlight({ brandColor, matches }: { brandColor: string; matches: MockMatch[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
          <h3 className="font-extrabold text-lg sm:text-2xl uppercase text-[var(--text-heading)]">
            Encuentro Estelar del Día
          </h3>
        </div>
        <span className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase">Transmisión Oficial</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {matches.map((m) => (
          <div key={m.id} className="p-6 rounded-2xl glass-panel border border-[var(--border-card)] relative overflow-hidden shadow-2xl space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[var(--text-muted)] font-bold">{m.jornada}</span>
              <span className="px-2.5 py-0.5 rounded font-bold uppercase" style={{ backgroundColor: `${brandColor}20`, color: brandColor }}>{m.status}</span>
            </div>

            <div className="grid grid-cols-3 items-center text-center py-4">
              <div className="space-y-2">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-slate-950 border-2 border-slate-700 flex items-center justify-center font-black text-xl text-slate-200 shadow-xl">
                  {m.homeTag}
                </div>
                <span className="font-black text-sm block text-[var(--text-heading)] uppercase truncate">{m.home}</span>
              </div>
              <div className="space-y-1">
                <span className="text-2xl sm:text-4xl font-black block tracking-tight" style={{ color: brandColor }}>{m.score}</span>
                <span className="text-[10px] font-mono text-[var(--text-muted)] block">{m.date}</span>
              </div>
              <div className="space-y-2">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-slate-950 border-2 border-slate-700 flex items-center justify-center font-black text-xl text-slate-200 shadow-xl">
                  {m.awayTag}
                </div>
                <span className="font-black text-sm block text-[var(--text-heading)] uppercase truncate">{m.away}</span>
              </div>
            </div>

            <div className="border-t border-[var(--border-card)] pt-3 flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)] font-medium">Canal de Streaming: Twitch TV</span>
              <Button variant="outline" size="sm" className="font-bold text-[11px]">
                <Play className="w-3.5 h-3.5 mr-1 fill-white" />
                Ver Transmisión
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Module Cards Sub-component ──────────────────────────────────────────────
function GameModuleCards({ game, brandColor, onNavigate }: { game: GameConfig; brandColor: string; onNavigate: (s: string) => void }) {
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
          className="p-6 rounded-2xl glass-panel border border-[var(--border-card)] hover:border-[var(--text-heading)] transition-all cursor-pointer group shadow-xl space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border" style={{ backgroundColor: `${brandColor}20`, borderColor: `${brandColor}50` }}>
              <mod.icon className="w-6 h-6" style={{ color: brandColor }} />
            </div>
            <h3 className="font-black text-xl uppercase text-[var(--text-heading)] group-hover:text-[var(--text-heading)] transition-colors">
              {mod.title}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{mod.desc}</p>
          </div>
          <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-[var(--border-card)]" style={{ color: brandColor }}>
            <span>{mod.cta}</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      ))}
    </div>
  );
}
