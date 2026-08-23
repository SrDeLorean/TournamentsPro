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
      {/* 1. IMMERSIVE EDGE-TO-EDGE HERO OVERLAY */}
      <div className="relative min-h-[380px] sm:min-h-[460px] flex flex-col justify-end pb-8 sm:pb-12 pt-8">
        
        {/* Top Status & Category Badges */}
        <div className="absolute top-0 left-0 w-full flex flex-wrap items-center justify-between gap-3 px-2 sm:px-0 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1.5 backdrop-blur-md border"
              style={{
                backgroundColor: `${brandColor}20`,
                borderColor: `${brandColor}50`,
                color: 'var(--text-heading)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: brandColor }} />
              PORTAL OFICIAL
            </span>
            <span className="px-3.5 py-1 rounded-full bg-[var(--bg-card)]/80 backdrop-blur-md text-[var(--text-muted)] border border-[var(--border-card)] text-xs font-mono font-bold uppercase tracking-wider shadow-md">
              {game.category}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/60 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/30 shadow-md animate-pulse">
            <Zap className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 fill-emerald-500 dark:fill-emerald-400" />
            CIRCUITO ACTIVO 2026
          </div>
        </div>

        {/* Title & Tagline Showcase (Massive Typography) */}
        <div className="relative z-10 max-w-5xl mt-auto px-2 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 mb-5">
            <div
              className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center shadow-xl border-2 flex-shrink-0 backdrop-blur-xl transform hover:scale-105 transition-transform duration-500"
              style={{
                backgroundColor: `${brandColor}15`,
                borderColor: `${brandColor}60`,
              }}
            >
              <GameLogo game={game} size="xl" />
            </div>
            <div className="pb-1 sm:pb-2">
              <h1
                className="text-4xl sm:text-6xl lg:text-[5.5rem] font-black tracking-tight uppercase leading-[0.9] drop-shadow-xl"
                style={{ 
                  color: 'var(--text-heading)',
                  textShadow: `0 4px 30px ${brandColor}80` 
                }}
              >
                {game.name}
              </h1>
              <p className="text-base sm:text-xl text-[var(--text-primary)] font-extrabold mt-2 tracking-widest uppercase drop-shadow-md border-l-4 pl-3 sm:pl-4" style={{ borderColor: brandColor }}>
                {game.tagline}
              </p>
            </div>
          </div>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-3xl font-medium pt-2 drop-shadow-md backdrop-blur-sm bg-[var(--bg-main)]/40 p-4 rounded-xl border border-[var(--border-card)]/50">
            {game.description}
          </p>
        </div>

        {/* Quick Navigation Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-3 pt-6 sm:pt-8 px-2 sm:px-0">
          <Button
            onClick={() => onNavigate('partidos')}
            className="font-black text-xs sm:text-sm h-11 sm:h-12 px-6 uppercase tracking-widest rounded-xl transition-all hover:scale-105 shadow-lg"
            style={{
              backgroundColor: brandColor,
              color: '#FFFFFF',
            }}
          >
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Fixture de Partidos
          </Button>
          <Button
            onClick={() => onNavigate('clasificacion')}
            variant="outline"
            className="font-bold text-xs sm:text-sm h-11 sm:h-12 px-6 uppercase tracking-widest rounded-xl border-2 bg-[var(--bg-main)]/60 backdrop-blur-md transition-all hover:bg-[var(--bg-card)] text-[var(--text-heading)] shadow-md"
            style={{ borderColor: `${brandColor}80` }}
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
    { label: 'Escuadras de Élite', value: '16', sub: 'Clubes Certificados', color: 'rgb(52, 211, 153)', subColor: 'text-emerald-500' },
    { label: 'Atletas Inscritos', value: '248', sub: 'Jugadores Verificados', color: 'rgb(192, 132, 252)', subColor: 'text-purple-400' },
    { label: 'Prize Pool Acumulado', value: '$2.5K', sub: '★ Premios de la Liga', color: 'rgb(251, 191, 36)', subColor: 'text-amber-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
      {metrics.map((m, i) => (
        <div
          key={i}
          className="relative group p-6 rounded-2xl bg-[var(--bg-card)]/40 backdrop-blur-md border shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden"
          style={{ borderColor: `${brandColor}30` }}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${m.color}, transparent 70%)` }} />
          <div className="absolute top-0 left-0 w-1 h-full opacity-50 group-hover:opacity-100 transition-opacity duration-300" style={{ backgroundColor: m.color }} />
          
          <div className="space-y-1 relative z-10 pl-2">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[var(--text-muted)] block font-mono">{m.label}</span>
            <span className="text-4xl sm:text-5xl font-black block tracking-tighter drop-shadow-md" style={{ color: m.color }}>{m.value}</span>
            <span className={`text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider ${m.subColor}`}>{m.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Matchday Spotlight Sub-component ────────────────────────────────────────
function MatchdaySpotlight({ brandColor, matches }: { brandColor: string; matches: MockMatch[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
            <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
          </div>
          <h3 className="font-black text-2xl sm:text-3xl uppercase tracking-tighter text-[var(--text-heading)] drop-shadow-md">
            Encuentro Estelar
          </h3>
        </div>
        <span className="text-[10px] sm:text-xs font-mono font-black tracking-widest text-rose-400 uppercase bg-rose-950/40 px-3 py-1.5 rounded-full border border-rose-500/30">
          Transmisión Oficial
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {matches.map((m) => (
          <div key={m.id} className="group p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)]/40 backdrop-blur-xl border border-[var(--border-card)] relative overflow-hidden shadow-2xl transition-all hover:border-white/20">
            
            {/* Background Glow */}
            <div className="absolute inset-0 opacity-5 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" style={{ background: `radial-gradient(circle at center, ${brandColor}, transparent 60%)` }} />

            <div className="relative z-10 flex items-center justify-between text-xs font-mono mb-6">
              <span className="px-3 py-1 rounded-full bg-[var(--bg-main)]/80 border border-[var(--border-card)] text-[var(--text-muted)] font-black tracking-widest uppercase shadow-md">{m.jornada}</span>
              <span className="px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-[0_0_15px_rgba(0,0,0,0.5)] animate-pulse" style={{ backgroundColor: `${brandColor}20`, color: brandColor, borderColor: `${brandColor}50`, borderWidth: '1px' }}>{m.status}</span>
            </div>

            <div className="relative z-10 grid grid-cols-[1fr,auto,1fr] items-center gap-4 py-4">
              {/* Home Team */}
              <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-[var(--bg-main)]/80 backdrop-blur-md border-2 flex items-center justify-center font-black text-2xl sm:text-4xl text-[var(--text-heading)] shadow-xl transform transition-transform group-hover:scale-110" style={{ borderColor: `${brandColor}40` }}>
                  {m.homeTag}
                </div>
                <span className="font-black text-xs sm:text-sm text-[var(--text-heading)] uppercase tracking-wider text-center">{m.home}</span>
              </div>
              
              {/* Score / VS */}
              <div className="flex flex-col items-center space-y-1 sm:space-y-2 px-1 sm:px-2">
                <span className="text-3xl sm:text-5xl font-black tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]" style={{ color: brandColor }}>{m.score}</span>
                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest bg-[var(--bg-main)]/50 px-2 sm:px-3 py-1 rounded-full">{m.date}</span>
              </div>
              
              {/* Away Team */}
              <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-[var(--bg-main)]/80 backdrop-blur-md border-2 flex items-center justify-center font-black text-2xl sm:text-4xl text-[var(--text-heading)] shadow-xl transform transition-transform group-hover:scale-110" style={{ borderColor: `${brandColor}40` }}>
                  {m.awayTag}
                </div>
                <span className="font-black text-xs sm:text-sm text-[var(--text-heading)] uppercase tracking-wider text-center">{m.away}</span>
              </div>
            </div>

            <div className="relative z-10 mt-8 pt-4 border-t border-[var(--border-card)]/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs font-mono text-[var(--text-muted)] font-bold tracking-widest uppercase flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                Twitch TV
              </span>
              <Button className="w-full sm:w-auto font-black text-xs h-10 px-6 uppercase tracking-widest rounded-xl hover:scale-105 transition-transform shadow-lg" style={{ backgroundColor: brandColor, color: '#FFFFFF' }}>
                <Play className="w-4 h-4 mr-2 fill-white" />
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
          className="relative p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)]/60 backdrop-blur-xl border border-[var(--border-card)] hover:border-[var(--text-muted)] transition-all duration-500 cursor-pointer group shadow-xl flex flex-col justify-between overflow-hidden hover:-translate-y-2 hover:shadow-2xl"
        >
          {/* Animated Hover Background */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle at bottom left, ${brandColor}, transparent 80%)` }} />
          
          {/* Top Border Beam */}
          <div className="absolute top-0 left-0 w-0 h-1 transition-all duration-700 group-hover:w-full" style={{ backgroundColor: brandColor }} />

          <div className="space-y-4 relative z-10">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border-2 transition-transform duration-500 group-hover:scale-110 shadow-md" style={{ backgroundColor: `${brandColor}15`, borderColor: `${brandColor}40` }}>
              <mod.icon className="w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-500" style={{ color: brandColor }} />
            </div>
            <h3 className="font-black text-xl sm:text-2xl uppercase tracking-tighter text-[var(--text-heading)] transition-colors">
              {mod.title}
            </h3>
            <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] transition-colors leading-relaxed">
              {mod.desc}
            </p>
          </div>

          <div className="pt-6 sm:pt-8 mt-auto flex items-center justify-between text-xs font-black uppercase tracking-widest relative z-10 text-[var(--text-primary)]">
            <span className="transition-colors" style={{ color: brandColor }}>{mod.cta}</span>
            <ChevronRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-2" style={{ color: brandColor }} />
          </div>
        </div>
      ))}
    </div>
  );
}
