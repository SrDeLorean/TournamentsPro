'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input, Textarea } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Alert } from '@/components/ui/alert';
import { Modal } from '@/components/ui/modal';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Card3D, Card3DItem } from '@/components/3d/card-3d';
import { GAMES_CATALOG } from '@/lib/games-data';
import {
  Trophy,
  Shield,
  Search,
  Sparkles,
  Send,
  Mail,
  User,
  Bell,
  Palette,
  Box,
  Layers,
  Flame,
  Zap,
  Swords,
  Crown,
  Activity,
  CheckCircle2,
  Gamepad2,
  Calendar,
  Clock,
  TrendingUp,
  Eye,
  Sliders,
  Crosshair,
  Award,
  ArrowRight,
  Filter,
} from 'lucide-react';

export default function ComponentsShowcasePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('eafc26');
  const [selectedGlobalTheme, setSelectedGlobalTheme] = useState<string>('cyan-void');

  // Discipline specific mock showcase data
  const disciplineDataMap: Record<string, {
    match: { title: string; subtitle: string; teamA: string; teamB: string; score: string; status: string; format: string; modeLabel: string };
    player: { name: string; number: string; role: string; team: string; stats: { label: string; value: string; color: string }[]; rating: string; value: string };
    tournament: { name: string; prize: string; stage: string; teamsCount: string; description: string };
  }> = {
    eafc26: {
      match: {
        title: 'Gran Final Copa de Oro 11v11',
        subtitle: 'Estadio Nacional eSports • Árbitro Oficial VVP',
        teamA: 'San Lorenzo eSports',
        teamB: 'LeguaYork eSp',
        score: '3 - 1',
        status: 'MIN 78\' EN VIVO',
        format: '11v11 Clubes Pro',
        modeLabel: 'Fútbol 11v11',
      },
      player: {
        name: 'SrDeLorean',
        number: '#10',
        role: 'Mediapunta Creativo (MCO)',
        team: 'San Lorenzo eSports',
        stats: [
          { label: 'GOLES', value: '28', color: '#72f7c1' },
          { label: 'ASISTENCIAS', value: '19', color: '#38bdf8' },
          { label: 'PASES CLAVE', value: '88%', color: '#fbbf24' },
        ],
        rating: '9.8',
        value: '1,850 PTS ELO',
      },
      tournament: {
        name: 'Superliga Sudamericana 11v11',
        prize: '$15,000 USD',
        stage: 'PLAYOFFS ELITE',
        teamsCount: '32 Clubes',
        description: 'Torneo oficial de Clubes Pro 11v11 con fixture regular y doble eliminación.',
      },
    },
    valorant: {
      match: {
        title: 'Masters Santiago • Upper Finals',
        subtitle: 'Mapa: Ascent • Transmisión Oficial VCT',
        teamA: 'KRÜ Tactical',
        teamB: 'Leviatán Valorant',
        score: '11 - 9',
        status: 'RONDA 21 EN VIVO',
        format: '5v5 Táctico MR24',
        modeLabel: 'FPS 5v5',
      },
      player: {
        name: 'KeznitPro',
        number: '#01',
        role: 'Duelista Principal (Jett / Raze)',
        team: 'KRÜ Tactical',
        stats: [
          { label: 'K / D', value: '1.48', color: '#ff4655' },
          { label: 'ACS', value: '284', color: '#fbbf24' },
          { label: 'HS %', value: '42%', color: '#38bdf8' },
        ],
        rating: '1.52 VLR',
        value: '2,400 PTS RADIANT',
      },
      tournament: {
        name: 'VALORANT Masters Chile',
        prize: '$25,000 USD',
        stage: 'GRAN FINAL',
        teamsCount: '16 Escuadras',
        description: 'El torneo insignia de shooter táctico 5v5 con actas automáticas anti-cheat.',
      },
    },
    csgo: {
      match: {
        title: 'Major Invitational • Gran Final',
        subtitle: 'Mapa: Mirage • Servidores Tickrate 128',
        teamA: 'Imperial CS2',
        teamB: '9z Team Global',
        score: '13 - 10',
        status: 'MAPA 2 EN VIVO',
        format: '5v5 Competitivo MR12',
        modeLabel: 'Shooter 5v5',
      },
      player: {
        name: 'FalleN_N1',
        number: '#05',
        role: 'AWPer Capitán (IGL)',
        team: 'Imperial CS2',
        stats: [
          { label: 'RATING 2.0', value: '1.34', color: '#f8ae3c' },
          { label: 'ADR', value: '92.4', color: '#ff4655' },
          { label: 'CLUTCHES', value: '14 V1', color: '#72f7c1' },
        ],
        rating: '1.34 HLTV',
        value: '2,650 ELO FACEIT',
      },
      tournament: {
        name: 'CS2 Americas Major Cup',
        prize: '$20,000 USD',
        stage: 'DECIDER MATCH',
        teamsCount: '24 Equipos',
        description: 'Competición oficial de Counter-Strike 2 con cuadro suizo y llaves eliminatorias.',
      },
    },
    lol: {
      match: {
        title: 'Copa de la Grieta • Semifinal',
        subtitle: 'Grieta del Invocador • Parche Oficial Riot',
        teamA: 'Isurus Gaming',
        teamB: 'Estral Esports',
        score: '2 - 1',
        status: 'JUEGO 4 (BO5)',
        format: '5v5 MOBA',
        modeLabel: 'MOBA 5v5',
      },
      player: {
        name: 'Seiya_Mid',
        number: '#07',
        role: 'Carril Central (Mid Laner)',
        team: 'Isurus Gaming',
        stats: [
          { label: 'KDA', value: '6.8', color: '#0ac8b9' },
          { label: 'CS / MIN', value: '9.8', color: '#c8aa6e' },
          { label: 'DPM', value: '640', color: '#f8ae3c' },
        ],
        rating: 'CHALLENGER',
        value: '1,120 LP MASTER',
      },
      tournament: {
        name: 'Copa de Campeones LoL LATAM',
        prize: '$18,000 USD',
        stage: 'SEMIFINALES',
        teamsCount: '16 Escuadras',
        description: 'Torneo 5v5 en la Grieta del Invocador con draft de campeones en vivo.',
      },
    },
    rocketleague: {
      match: {
        title: 'Championship Series • Grand Final',
        subtitle: 'DFH Stadium • Modalidad Aérea 3v3',
        teamA: 'Complexity RL',
        teamB: 'Furia Esports',
        score: '4 - 3',
        status: 'OT OVERTIME',
        format: '3v3 Soccar Vehicular',
        modeLabel: 'Soccar 3v3',
      },
      player: {
        name: 'Yanxnz_RL',
        number: '#09',
        role: 'Striker Aéreo / Rotador Global',
        team: 'Furia Esports',
        stats: [
          { label: 'GOLES / P', value: '2.4', color: '#0084ff' },
          { label: 'SALVADAS', value: '3.1', color: '#ff6c00' },
          { label: 'TIROS', value: '4.8', color: '#72f7c1' },
        ],
        rating: 'SUPERSONIC',
        value: '2,150 MMR SSL',
      },
      tournament: {
        name: 'Rocket League Open Series',
        prize: '$12,000 USD',
        stage: 'FINAL DE LLAVES',
        teamsCount: '32 Equipos',
        description: 'Torneo de alta velocidad vehicular 3v3 con repeticiones y goles destacados.',
      },
    },
  };

  const activeGame = GAMES_CATALOG[selectedDiscipline] || GAMES_CATALOG.eafc26;
  const activeDisciplineData = disciplineDataMap[selectedDiscipline] || disciplineDataMap.eafc26;

  // Global Themes List
  const globalThemes = [
    { id: 'cyan-void', name: 'Cyber Void (Recomendada)', primary: '#00f0ff', secondary: '#c084fc', gold: '#fbbf24', bg: '#05070d', tag: 'Top Recomendación' },
    { id: 'gold-apex', name: 'Apex Gold & Titanium', primary: '#fbbf24', secondary: '#38bdf8', gold: '#f59e0b', bg: '#0b0f19', tag: 'Champions / Lujo' },
    { id: 'mint-cyber', name: 'Cyber Mint & Emerald', primary: '#34d399', secondary: '#a855f7', gold: '#fde047', bg: '#030712', tag: 'Moderna / Web3' },
    { id: 'crimson-val', name: 'Crimson Radiant Pulse', primary: '#ff4655', secondary: '#f8ae3c', gold: '#fbbf24', bg: '#060810', tag: 'FPS Táctico' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      
      {/* Page Header */}
      <div className="border-b border-[var(--border-card)] pb-8 relative">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] text-xs font-mono font-bold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>eSports Design System • Multi-Discipline 3D Engine v3.0</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--text-heading)] uppercase font-display">
          Catálogo UI Kit & Visualizador por Disciplina
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-2 max-w-3xl">
          Interactúa con los componentes seleccionando entre las diferentes disciplinas oficiales de eSports y paletas globales. Observa cómo mutan las tarjetas 3D, botones, badges e inputs con cada identidad visual.
        </p>
      </div>

      {/* 🎮 SECCIÓN 1: SELECTOR INTERACTIVO DISCIPLINA POR DISCIPLINA */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4">
          <div>
            <span className="text-[10px] font-mono font-black text-[var(--accent-cyan)] uppercase tracking-widest block">
              [ NAVEGACIÓN ENTRE DISCIPLINAS ]
            </span>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight font-display">
              1. Selecciona una Disciplina eSports
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Haz clic en cualquier juego para ver cómo reaccionan y se adaptan los componentes 3D:
            </p>
          </div>

          <Badge variant="cyan" is3D>
            🎮 {activeGame.name} Seleccionado
          </Badge>
        </div>

        {/* Discipline Tabs Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(GAMES_CATALOG).filter(([slug]) => slug !== 'fortnite').map(([slug, game]) => {
            const isSelected = selectedDiscipline === slug;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => setSelectedDiscipline(slug)}
                className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center gap-3 text-left relative overflow-hidden group ${
                  isSelected
                    ? 'bg-slate-900 border-2 shadow-[0_0_30px_rgba(0,0,0,0.9)] scale-[1.03]'
                    : 'bg-slate-950/60 border-[var(--border-card)] hover:border-white/30 hover:bg-slate-900/60'
                }`}
                style={{
                  borderColor: isSelected ? game.brandColor : undefined,
                  boxShadow: isSelected ? `0 0 25px ${game.brandColor}35` : undefined,
                }}
              >
                <div
                  className="size-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-md"
                  style={{
                    backgroundColor: `${game.brandColor}20`,
                    border: `1px solid ${game.brandColor}50`,
                  }}
                >
                  {game.icon}
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-black text-white uppercase truncate">{game.name}</div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">{game.category}</div>
                </div>

                {isSelected && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1"
                    style={{ backgroundColor: game.brandColor }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* 🌟 VISTA EN VIVO: CÓMO QUEDA LA SUITE 3D PARA ESTA DISCIPLINA */}
        <div
          className="p-6 sm:p-8 rounded-3xl bg-slate-950/80 border backdrop-blur-xl shadow-2xl space-y-8 relative overflow-hidden transition-colors duration-500"
          style={{
            borderColor: `${activeGame.brandColor}40`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.9), 0 0 40px ${activeGame.brandColor}15`,
          }}
        >
          {/* Ambient Lighting matching discipline */}
          <div
            className="absolute top-0 right-0 size-96 blur-3xl pointer-events-none rounded-full opacity-20"
            style={{ backgroundColor: activeGame.brandColor }}
          />

          {/* Discipline Banner Header */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div
                className="size-12 rounded-2xl flex items-center justify-center text-2xl shadow-xl"
                style={{
                  backgroundColor: `${activeGame.brandColor}25`,
                  border: `1px solid ${activeGame.brandColor}60`,
                }}
              >
                {activeGame.icon}
              </div>
              <div>
                <span
                  className="text-[10px] font-mono font-black uppercase tracking-widest block"
                  style={{ color: activeGame.brandColor }}
                >
                  [ SUITE 3D OFICIAL • {activeGame.name} ]
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight font-display">
                  {activeGame.tagline}
                </h3>
              </div>
            </div>

            {/* Quick Actions themed */}
            <div className="flex items-center gap-2">
              <Badge
                is3D
                style={{
                  backgroundColor: `${activeGame.brandColor}25`,
                  color: activeGame.brandColor,
                  borderColor: `${activeGame.brandColor}50`,
                }}
              >
                Modo Oficial: {activeDisciplineData.match.modeLabel}
              </Badge>
            </div>
          </div>

          {/* 3D CARDS GRID ADAPTADA A LA DISCIPLINA */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
            
            {/* 1. TARJETA 3D DE MATCHDAY ADAPTADA */}
            <Card3D maxTilt={12} accentColor={activeGame.brandColor} className="h-full">
              <div className="p-6 space-y-5 h-full flex flex-col justify-between">
                <Card3DItem depth={35} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      is3D
                      style={{
                        backgroundColor: `${activeGame.brandColor}25`,
                        color: activeGame.brandColor,
                        borderColor: `${activeGame.brandColor}50`,
                      }}
                    >
                      {activeDisciplineData.match.format}
                    </Badge>
                    <span
                      className="text-[10px] font-mono font-extrabold flex items-center gap-1"
                      style={{ color: activeGame.brandColor }}
                    >
                      <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {activeDisciplineData.match.status}
                    </span>
                  </div>

                  <h4 className="text-lg font-black text-white uppercase tracking-tight font-display">
                    {activeDisciplineData.match.title}
                  </h4>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    {activeDisciplineData.match.subtitle}
                  </p>
                </Card3DItem>

                {/* Scoreboard */}
                <Card3DItem depth={25}>
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center justify-between font-mono">
                    <div className="flex items-center gap-2">
                      <div
                        className="size-8 rounded-lg flex items-center justify-center font-black text-xs text-white"
                        style={{
                          backgroundColor: `${activeGame.brandColor}30`,
                          border: `1px solid ${activeGame.brandColor}60`,
                        }}
                      >
                        {activeDisciplineData.match.teamA.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-xs text-white truncate max-w-[80px] sm:max-w-[95px]">
                        {activeDisciplineData.match.teamA}
                      </span>
                    </div>

                    <div className="text-center px-2">
                      <span
                        className="text-base font-black"
                        style={{ color: activeGame.brandColor }}
                      >
                        {activeDisciplineData.match.score}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white truncate max-w-[80px] sm:max-w-[95px]">
                        {activeDisciplineData.match.teamB}
                      </span>
                      <div className="size-8 rounded-lg bg-slate-800 border border-white/20 flex items-center justify-center font-black text-xs text-white">
                        {activeDisciplineData.match.teamB.slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </Card3DItem>

                <Card3DItem depth={35} className="pt-2">
                  <Button
                    size="sm"
                    className="w-full font-black text-xs uppercase"
                    style={{
                      backgroundColor: activeGame.brandColor,
                      color: '#FFFFFF',
                      boxShadow: `0 4px 20px ${activeGame.brandColor}40`,
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1.5" />
                    Ver Transmisión 3D
                  </Button>
                </Card3DItem>
              </div>
            </Card3D>

            {/* 2. TARJETA 3D DE ATLETA / JUGADOR PRO ADAPTADA */}
            <Card3D maxTilt={12} accentColor={activeGame.accentColor} className="h-full">
              <div className="p-6 space-y-5 h-full flex flex-col justify-between">
                <Card3DItem depth={35} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="gold" is3D>Ficha de Atleta</Badge>
                    <span
                      className="text-[10px] font-mono font-extrabold"
                      style={{ color: activeGame.accentColor }}
                    >
                      {activeDisciplineData.player.value}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <Avatar
                      size="lg"
                      fallback={activeDisciplineData.player.name.slice(0, 2)}
                      status="online"
                      className="border-2"
                      style={{ borderColor: activeGame.accentColor }}
                    />
                    <div>
                      <h4 className="text-lg font-black text-white uppercase tracking-tight">
                        {activeDisciplineData.player.name}{' '}
                        <span className="font-mono text-sm" style={{ color: activeGame.accentColor }}>
                          {activeDisciplineData.player.number}
                        </span>
                      </h4>
                      <span className="text-xs text-slate-300 font-semibold block">
                        {activeDisciplineData.player.role}
                      </span>
                    </div>
                  </div>
                </Card3DItem>

                {/* Stats Grid */}
                <Card3DItem depth={20}>
                  <div className="grid grid-cols-3 gap-2 text-center font-mono text-[10px]">
                    {activeDisciplineData.player.stats.map((st) => (
                      <div key={st.label} className="p-2 rounded-xl bg-slate-900/90 border border-white/10">
                        <span className="text-slate-400 block font-bold truncate">{st.label}</span>
                        <span className="font-black text-xs" style={{ color: st.color }}>
                          {st.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card3DItem>

                <Card3DItem depth={35} className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full font-black text-xs uppercase hover:border-white"
                  >
                    <Send className="w-4 h-4 mr-1.5" />
                    Enviar Oferta de Fichaje
                  </Button>
                </Card3DItem>
              </div>
            </Card3D>

            {/* 3. TARJETA 3D DE COPA & TORNEO ADAPTADA */}
            <Card3D maxTilt={12} accentColor={activeGame.brandColor} className="h-full">
              <div className="p-6 space-y-5 h-full flex flex-col justify-between">
                <Card3DItem depth={35} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="violet" is3D>Circuito Oficial</Badge>
                    <span className="text-[10px] font-mono text-slate-300 font-extrabold">
                      {activeDisciplineData.tournament.teamsCount}
                    </span>
                  </div>

                  <h4 className="text-lg font-black text-white uppercase tracking-tight font-display">
                    {activeDisciplineData.tournament.name}
                  </h4>
                  <p className="text-xs text-slate-300 font-medium">
                    {activeDisciplineData.tournament.description}
                  </p>
                </Card3DItem>

                {/* Prize Pool Spotlight */}
                <Card3DItem depth={25}>
                  <div
                    className="p-3.5 rounded-2xl border flex items-center justify-between"
                    style={{
                      backgroundColor: `${activeGame.secondaryAccent}80`,
                      borderColor: `${activeGame.brandColor}40`,
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <Trophy
                        className="w-5 h-5"
                        style={{ color: activeGame.accentColor || '#fbbf24' }}
                      />
                      <div>
                        <span className="text-[9px] font-mono uppercase text-slate-400 font-bold block">
                          Premio a Repartir
                        </span>
                        <span className="text-sm font-black text-white font-mono">
                          {activeDisciplineData.tournament.prize}
                        </span>
                      </div>
                    </div>

                    <span
                      className="text-[9px] font-mono font-bold px-2 py-1 rounded-md border"
                      style={{
                        backgroundColor: `${activeGame.brandColor}20`,
                        color: activeGame.brandColor,
                        borderColor: `${activeGame.brandColor}40`,
                      }}
                    >
                      {activeDisciplineData.tournament.stage}
                    </span>
                  </div>
                </Card3DItem>

                <Card3DItem depth={35} className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full font-black text-xs uppercase"
                  >
                    <Trophy className="w-4 h-4 mr-1.5" />
                    Inscribir Escuadra
                  </Button>
                </Card3DItem>
              </div>
            </Card3D>
          </div>

          {/* PALETA DE COLOR ACTIVA & CONTROLES THEMED */}
          <div className="relative z-10 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Brand Primario</span>
              <div className="flex items-center gap-2">
                <div className="size-5 rounded-md shadow" style={{ backgroundColor: activeGame.brandColor }} />
                <span className="font-mono font-bold text-white">{activeGame.brandColor}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Acento Secundario</span>
              <div className="flex items-center gap-2">
                <div className="size-5 rounded-md shadow" style={{ backgroundColor: activeGame.accentColor }} />
                <span className="font-mono font-bold text-white">{activeGame.accentColor}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Fondo Oscuro Disciplina</span>
              <div className="flex items-center gap-2">
                <div className="size-5 rounded-md border border-white/20 shadow" style={{ backgroundColor: activeGame.darkBg }} />
                <span className="font-mono font-bold text-white">{activeGame.darkBg}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🎨 SECCIÓN 2: SIMULADOR DE PALETAS PARA LA PORTADA PRINCIPAL */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-[var(--accent-gold)]" />
            <h2 className="text-xl font-bold text-[var(--text-heading)]">2. Estilos Recomendados para la Página Principal</h2>
          </div>
          <Badge variant="gold" is3D>Global Theme Switcher</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {globalThemes.map((theme) => {
            const isSelected = selectedGlobalTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setSelectedGlobalTheme(theme.id)}
                className={`text-left p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-3 relative group ${
                  isSelected
                    ? 'bg-slate-900 border-2 shadow-[0_0_25px_rgba(0,240,255,0.25)] scale-[1.02]'
                    : 'bg-slate-950/60 border-[var(--border-card)] hover:border-white/30 hover:bg-slate-900/60'
                }`}
                style={{
                  borderColor: isSelected ? theme.primary : undefined,
                }}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white">
                      {theme.tag}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4" style={{ color: theme.primary }} />
                    )}
                  </div>
                  <h4 className="text-sm font-black text-white uppercase pt-1">{theme.name}</h4>
                </div>

                {/* Swatches */}
                <div className="flex items-center gap-1.5 pt-2">
                  <div className="h-6 flex-1 rounded-md shadow-sm" style={{ backgroundColor: theme.primary }} />
                  <div className="h-6 flex-1 rounded-md shadow-sm" style={{ backgroundColor: theme.secondary }} />
                  <div className="h-6 flex-1 rounded-md shadow-sm" style={{ backgroundColor: theme.gold }} />
                  <div className="h-6 flex-1 rounded-md border border-white/20 shadow-sm" style={{ backgroundColor: theme.bg }} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 🧩 SECCIÓN 3: CONTROLES DE FORMULARIO & INPUTS */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3">
          <Mail className="w-5 h-5 text-[var(--accent-cyan)]" />
          <h2 className="text-xl font-bold text-[var(--text-heading)]">3. Controles de Formulario & Inputs eSports</h2>
        </div>

        <div className="p-6 rounded-2xl glass-panel grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Gamertag Oficial"
            placeholder="ej. SrDeLorean"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            helperText="Ingresa tu ID oficial dentro del juego"
            icon={<User className="w-4 h-4 text-[var(--text-muted)]" />}
          />

          <Input
            label="Búsqueda de Torneos"
            placeholder="Buscar ligas, copas o clubes..."
            icon={<Search className="w-4 h-4 text-[var(--text-muted)]" />}
          />

          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="usuario@ejemplo.com"
            error="El formato del correo electrónico no es válido"
            icon={<Mail className="w-4 h-4 text-[var(--text-muted)]" />}
          />

          <Textarea
            label="Observaciones del Partido / Acta"
            placeholder="Detalla incidentes, MVP o acuerdos entre capitanes..."
          />
        </div>
      </section>

      {/* 📊 SECCIÓN 4: TABLA DE POSICIONES ESPORTS */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3">
          <Trophy className="w-5 h-5 text-[var(--accent-gold)]" />
          <h2 className="text-xl font-bold text-[var(--text-heading)]">4. Tablas de Posiciones eSports Adaptables</h2>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">Pos</TableHead>
              <TableHead>Equipo</TableHead>
              <TableHead className="text-center">PJ</TableHead>
              <TableHead className="text-center">PG</TableHead>
              <TableHead className="text-center">PE</TableHead>
              <TableHead className="text-center">PP</TableHead>
              <TableHead className="text-center">GF</TableHead>
              <TableHead className="text-center">GC</TableHead>
              <TableHead className="text-center">DIF</TableHead>
              <TableHead className="text-center">PTS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-[var(--accent-cyan-bg)]">
              <TableCell className="text-center font-bold text-[var(--accent-cyan)]">1</TableCell>
              <TableCell className="font-bold flex items-center gap-2 text-[var(--text-heading)]">
                <div className="w-6 h-6 rounded bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)]/30 flex items-center justify-center text-xs font-black text-[var(--accent-cyan)]">LY</div>
                LeguaYork eSp
              </TableCell>
              <TableCell className="text-center font-mono">10</TableCell>
              <TableCell className="text-center font-mono">8</TableCell>
              <TableCell className="text-center font-mono">1</TableCell>
              <TableCell className="text-center font-mono">1</TableCell>
              <TableCell className="text-center font-mono text-[var(--accent-emerald)] font-bold">24</TableCell>
              <TableCell className="text-center font-mono text-[var(--accent-crimson)] font-bold">8</TableCell>
              <TableCell className="text-center font-mono font-semibold">+16</TableCell>
              <TableCell className="text-center font-bold text-[var(--accent-cyan)] text-base">25</TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="text-center font-bold text-[var(--accent-violet)]">2</TableCell>
              <TableCell className="font-semibold flex items-center gap-2 text-[var(--text-heading)]">
                <div className="w-6 h-6 rounded bg-[var(--accent-violet-bg)] border border-[var(--accent-violet)]/30 flex items-center justify-center text-xs font-black text-[var(--accent-violet)]">SN</div>
                Sangre Nueva FC
              </TableCell>
              <TableCell className="text-center font-mono">10</TableCell>
              <TableCell className="text-center font-mono">7</TableCell>
              <TableCell className="text-center font-mono">2</TableCell>
              <TableCell className="text-center font-mono">1</TableCell>
              <TableCell className="text-center font-mono text-[var(--accent-emerald)] font-bold">19</TableCell>
              <TableCell className="text-center font-mono text-[var(--accent-crimson)] font-bold">9</TableCell>
              <TableCell className="text-center font-mono font-semibold">+10</TableCell>
              <TableCell className="text-center font-bold text-[var(--accent-violet)] text-base">23</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      {/* 🚀 SECCIÓN 5: MODALES & DIÁLOGOS */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3">
          <Sparkles className="w-5 h-5 text-[var(--accent-cyan)]" />
          <h2 className="text-xl font-bold text-[var(--text-heading)]">5. Modales & Diálogos</h2>
        </div>

        <div className="p-6 rounded-2xl glass-panel">
          <Button onClick={() => setIsModalOpen(true)}>
            Abrir Modal de Ejemplo
          </Button>

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Confirmar Reporte de Partido"
            description="Revisa los datos del encuentro antes de guardar la información en Supabase."
          >
            <div className="space-y-4 text-xs text-[var(--text-secondary)]">
              <div className="p-3 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-card)] flex justify-between items-center">
                <span className="font-bold text-[var(--text-heading)]">LeguaYork eSp</span>
                <span className="text-base font-bold text-[var(--accent-cyan)]">3 - 1</span>
                <span className="font-bold text-[var(--text-heading)]">Sangre Nueva FC</span>
              </div>
              <p>Al confirmar el resultado, las estadísticas se procesarán automáticamente en la tabla de posiciones.</p>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>Confirmar y Guardar</Button>
              </div>
            </div>
          </Modal>
        </div>
      </section>
    </div>
  );
}
