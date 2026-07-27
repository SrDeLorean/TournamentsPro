'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GAMES_CATALOG } from '@/lib/games-data';
import { mockTeamsList } from '@/lib/teams-data';
import { GameLogo } from '@/components/ui/game-logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import {
  Trophy, Shield, Users, Radio, Sparkles, ChevronRight, Award, Flame, Zap, ArrowRight, Activity, Globe, Monitor, Gamepad2, Play
} from 'lucide-react';

export default function HomePage() {
  const gamesList = Object.values(GAMES_CATALOG);

  // Global Mock Live Broadcast Matches
  const mockGlobalMatches = [
    { id: 1, game: 'eafc26', home: 'LeguaYork eSp', away: 'Sangre Nueva FC', score: '2 - 1', minute: '82\'', status: 'EN VIVO' },
    { id: 2, game: 'csgo', home: 'Highfield XX', away: 'Torneos Pro Gaming', score: '14 - 11', minute: 'Ronda 26', status: 'EN VIVO' },
    { id: 3, game: 'valorant', home: 'KRÜ Esports', away: 'Leviatán', score: '1 - 0', minute: 'Mapa 2', status: 'EN VIVO' },
    { id: 4, game: 'rocketleague', home: 'Furia eSports', away: 'Complexity', score: '3 - 2', minute: 'OT', status: 'EN VIVO' },
  ];

  // Top Global Clubs Palmarés
  const topClubs = mockTeamsList.slice(0, 4);

  return (
    <div className="min-h-screen pb-20 space-y-12 sm:space-y-16 bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-300">
      
      {/* 🔴 LIVE MATCHES & BROADCAST TICKER STRIPE (ESTÁTICA EN EL DOM FLUJO REGULAR) */}
      <div className="relative w-full bg-slate-950 border-b border-[var(--border-card)] backdrop-blur-md z-20 py-2.5 overflow-hidden shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-rose-500" />
              TRANSMISIONES EN VIVO
            </span>
          </div>

          {/* Matches Horizontal Static Display */}
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-none touch-pan-x py-0.5">
            {mockGlobalMatches.map((m) => {
              const gameObj = GAMES_CATALOG[m.game];
              return (
                <div
                  key={m.id}
                  className="inline-flex items-center gap-2.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs flex-shrink-0 shadow-sm"
                >
                  <GameLogo game={gameObj} size="sm" />
                  <span className="font-extrabold text-white">{m.home}</span>
                  <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                    {m.score}
                  </span>
                  <span className="font-extrabold text-white">{m.away}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({m.minute})</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🚀 1. HERO SPOTLIGHT - PORTAL GLOBAL DE LA COMUNIDAD */}
      <section className="relative pt-6 sm:pt-10 pb-10 sm:pb-14 overflow-hidden border-b border-[var(--border-card)] bg-gradient-to-b from-[var(--bg-card)] via-[var(--bg-main)] to-[var(--bg-main)]">
        {/* Glow ambient background effects */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-r from-cyan-500/15 via-purple-500/15 to-amber-500/15 blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] text-xs font-black shadow-lg uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            ECOSISTEMA ESPORTS MULTIDISCIPLINA
          </div>

          <h1 className="text-3xl sm:text-6xl lg:text-7xl font-black text-[var(--text-heading)] tracking-tight uppercase max-w-5xl mx-auto leading-none">
            Plataforma Global de{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400 bg-clip-text text-transparent drop-shadow-sm">
              Torneos eSports
            </span>
          </h1>

          <p className="text-xs sm:text-base text-[var(--text-secondary)] max-w-2xl mx-auto font-medium leading-relaxed px-2">
            Compite en las mejores ligas de EA FC 26, VALORANT, CS2, League of Legends y Rocket League. Selecciona tu disciplina e ingresa al portal especializado.
          </p>

          {/* 🎮 GRID DE SELECCIÓN DE DISCIPLINAS / JUEGOS CON LOGOS OFICIALES */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5 max-w-6xl mx-auto">
            {gamesList.map((game) => (
              <Link
                key={game.id}
                href={`/${game.slug}`}
                className="group relative p-4 sm:p-5 rounded-2xl glass-panel border border-[var(--border-card)] hover:border-[var(--text-heading)] transition-all duration-300 flex flex-col items-center justify-between gap-3 text-center hover:-translate-y-1.5 shadow-xl"
              >
                {/* Brand color ambient circle */}
                <div
                  className="absolute top-0 right-0 w-20 h-20 opacity-20 rounded-full blur-xl pointer-events-none group-hover:opacity-40 transition-opacity"
                  style={{ backgroundColor: game.brandColor }}
                />

                {/* Game Logo Container */}
                <div
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-2xl border flex-shrink-0"
                  style={{
                    backgroundColor: `${game.brandColor}20`,
                    borderColor: `${game.brandColor}60`,
                    boxShadow: `0 8px 25px color-mix(in srgb, ${game.brandColor} 30%, transparent)`,
                  }}
                >
                  <GameLogo game={game} size="md" className="sm:hidden" />
                  <GameLogo game={game} size="xl" className="hidden sm:inline-flex" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-extrabold text-xs sm:text-sm text-[var(--text-heading)] group-hover:text-[var(--text-heading)] transition-colors line-clamp-1 uppercase">
                    {game.name}
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)] line-clamp-1 font-medium">{game.category}</p>
                </div>

                {/* Solid High-Contrast Button (Perfect Visibility in Light Mode & Dark Mode) */}
                <span
                  className="text-[10px] font-black px-3 py-1.5 rounded-xl uppercase transition-all shadow-md w-full border flex items-center justify-center gap-1 group-hover:scale-105"
                  style={{
                    backgroundColor: game.brandColor,
                    borderColor: game.brandColor,
                    color: '#FFFFFF',
                    boxShadow: `0 4px 14px color-mix(in srgb, ${game.brandColor} 40%, transparent)`,
                  }}
                >
                  <span>Entrar al Portal</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 2. CIRCUITO DE COMPETENCIAS DESTACADAS DEL MES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[var(--border-card)] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[var(--accent-gold)]" />
              <h2 className="text-xl sm:text-3xl font-black uppercase text-[var(--text-heading)]">
                Circuitos & Torneos Oficiales 2026
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-medium">
              Explora los campeonatos activos con inscripciones abiertas y prize pools acumulados.
            </p>
          </div>

          <Link href="/eafc26/competencias">
            <Button variant="outline" size="sm" className="font-bold text-xs">
              Ver Todos los Torneos
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: FC 26 Pro Clubs */}
          <div className="p-6 rounded-2xl glass-panel border border-[var(--border-card)] space-y-4 shadow-xl flex flex-col justify-between group hover:-translate-y-1 transition-transform">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-950 text-emerald-400 font-mono font-bold border border-emerald-500/30">
                  EN CURSO
                </span>
                <span className="text-[var(--text-muted)] font-mono">11 v 11 Pro Clubs</span>
              </div>
              <h3 className="text-lg font-black text-[var(--text-heading)] uppercase group-hover:text-[var(--accent-cyan)] transition-colors">
                Liga de Élite EA FC 26 - División 1
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Campeonato regular de 16 clubes con fase de grupos ida y vuelta, clasificatorio a playoffs presenciales.
              </p>
            </div>

            <div className="pt-3 border-t border-[var(--border-card)] flex items-center justify-between text-xs font-bold">
              <span className="text-[var(--accent-emerald)] font-mono">$1,500 USD Prize</span>
              <Link href="/eafc26">
                <Button size="sm" className="text-[11px] font-extrabold bg-[#077D7E] text-white hover:opacity-90">
                  Ir al Portal FC 26
                </Button>
              </Link>
            </div>
          </div>

          {/* Card 2: Valorant Tactical */}
          <div className="p-6 rounded-2xl glass-panel border border-[var(--border-card)] space-y-4 shadow-xl flex flex-col justify-between group hover:-translate-y-1 transition-transform">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="px-2.5 py-0.5 rounded-md bg-cyan-950 text-cyan-400 font-mono font-bold border border-cyan-500/30">
                  INSCRIPCIONES
                </span>
                <span className="text-[var(--text-muted)] font-mono">5 v 5 Táctico</span>
              </div>
              <h3 className="text-lg font-black text-[var(--text-heading)] uppercase group-hover:text-[#FF4654] transition-colors">
                Valorant Champions Cup Sur
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Torneo abierto para escuadras de rango Radiante e Inmortal. Formato de eliminación doble BO3.
              </p>
            </div>

            <div className="pt-3 border-t border-[var(--border-card)] flex items-center justify-between text-xs font-bold">
              <span className="text-rose-400 font-mono">$800 USD Prize</span>
              <Link href="/valorant">
                <Button size="sm" className="text-[11px] font-extrabold bg-[#FF4654] text-white hover:opacity-90">
                  Ir al Portal Valorant
                </Button>
              </Link>
            </div>
          </div>

          {/* Card 3: Counter-Strike 2 */}
          <div className="p-6 rounded-2xl glass-panel border border-[var(--border-card)] space-y-4 shadow-xl flex flex-col justify-between group hover:-translate-y-1 transition-transform">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-950 text-amber-400 font-mono font-bold border border-amber-500/30">
                  PRÓXIMAMENTE
                </span>
                <span className="text-[var(--text-muted)] font-mono">5 v 5 CS2</span>
              </div>
              <h3 className="text-lg font-black text-[var(--text-heading)] uppercase group-hover:text-[#DE9B35] transition-colors">
                CS2 Masters Major
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Circuito oficial con servidores dedicados de 128 tickrate, sistema anti-cheat avanzado y transmisión en directo.
              </p>
            </div>

            <div className="pt-3 border-t border-[var(--border-card)] flex items-center justify-between text-xs font-bold">
              <span className="text-amber-400 font-mono">$1,000 USD Prize</span>
              <Link href="/csgo">
                <Button size="sm" className="text-[11px] font-extrabold bg-[#DE9B35] text-slate-950 hover:opacity-90">
                  Ir al Portal CS2
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CUADRO DE HONOR - TOP ORGANIZACIONES Y CLUBES DESTACADOS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[var(--border-card)] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[var(--accent-cyan)]" />
              <h2 className="text-xl sm:text-3xl font-black uppercase text-[var(--text-heading)]">
                Organizaciones & Clubes Destacados
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-medium">
              Conoce las escuadras líderes con mayor trayectoria y trofeos en el circuito.
            </p>
          </div>

          <Link href="/equipos">
            <Button variant="outline" size="sm" className="font-bold text-xs">
              Ver Directorio de Equipos
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {topClubs.map((team) => (
            <div
              key={team.id}
              className="p-5 rounded-2xl glass-panel border border-[var(--border-card)] space-y-3 shadow-xl hover:-translate-y-1 transition-transform flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border-2 border-slate-700 flex items-center justify-center font-black text-base text-[var(--accent-cyan)] shadow-md">
                    {team.logoText}
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 border border-slate-700 text-slate-300">
                    {team.tag}
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-base text-[var(--text-heading)] truncate">{team.name}</h4>
                  <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-0.5">{team.description}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-card)] flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">Capitán: <strong className="text-[var(--text-heading)]">{team.captain}</strong></span>
                <Link href={`/eafc26/equipos/${team.id}`}>
                  <Button variant="ghost" size="sm" className="text-[11px] font-bold text-[var(--accent-cyan)] p-0 hover:bg-transparent">
                    Ver Ficha
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
