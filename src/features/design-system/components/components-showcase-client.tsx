'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Textarea } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/alert';
import { PositionBadge } from '@/components/ui/position-badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Card3D, Card3DItem } from '@/components/3d/card-3d';
import { HologramStage3D } from '@/components/3d/hologram-stage-3d';
import { GameIdentityCard } from '@/components/game/game-identity-card';
import { AppUiEvolutionStudio } from '@/features/design-system/components/app-ui-evolution-studio';
import { GAMES_CATALOG } from '@/lib/games-data';
import {
  Trophy,
  Search,
  Sparkles,
  Send,
  Mail,
  User,
  Palette,
  CheckCircle2,
  Eye,
  SunMoon,
  Sliders,
  Copy,
  Check,
  Zap,
  Flame,
  Shield,
  Layers,
  Activity,
  Code2,
  RefreshCw,
  Crown,
  Swords,
  Crosshair,
  AlertTriangle,
  Info,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sparkle,
} from 'lucide-react';

export default function ComponentsShowcasePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('eafc26');
  const [selectedGlobalTheme, setSelectedGlobalTheme] = useState<string>('cyan-void');

  // Interactive 3D Lab Playground State
  const [labTilt, setLabTilt] = useState<number>(12);
  const [labGlare, setLabGlare] = useState<boolean>(true);
  const [labNeon, setLabNeon] = useState<boolean>(true);
  const [labAccent, setLabAccent] = useState<string>('#00F0FF');
  const [labVariant, setLabVariant] = useState<'default' | 'cyan' | 'violet' | 'gold' | 'emerald' | 'crimson'>('cyan');

  // Interactive Primitives Sandbox State
  const [btnLoading, setBtnLoading] = useState<boolean>(false);
  const [btnDisabled, setBtnDisabled] = useState<boolean>(false);
  const [clickCount, setClickCount] = useState<number>(0);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedToken(text);
      setTimeout(() => setCopiedToken(null), 2000);
    }
  };

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
          { label: 'GOLES', value: '28', color: 'var(--accent-emerald)' },
          { label: 'ASISTENCIAS', value: '19', color: 'var(--accent-cyan)' },
          { label: 'PASES CLAVE', value: '88%', color: 'var(--accent-gold)' },
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
          { label: 'K / D', value: '1.48', color: 'var(--accent-crimson)' },
          { label: 'ACS', value: '284', color: 'var(--accent-gold)' },
          { label: 'HS %', value: '42%', color: 'var(--accent-cyan)' },
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
          { label: 'RATING 2.0', value: '1.34', color: 'var(--accent-gold)' },
          { label: 'ADR', value: '92.4', color: 'var(--accent-crimson)' },
          { label: 'CLUTCHES', value: '14 V1', color: 'var(--accent-emerald)' },
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
          { label: 'KDA', value: '6.8', color: 'var(--accent-cyan)' },
          { label: 'CS / MIN', value: '9.8', color: 'var(--accent-gold)' },
          { label: 'DPM', value: '640', color: 'var(--accent-violet)' },
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
          { label: 'GOLES / P', value: '2.4', color: 'var(--accent-cyan)' },
          { label: 'SALVADAS', value: '3.1', color: 'var(--accent-gold)' },
          { label: 'TIROS', value: '4.8', color: 'var(--accent-emerald)' },
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
    { id: 'cyan-void', name: 'Cyber Void (Recomendada)', primary: 'var(--accent-cyan)', secondary: 'var(--accent-violet)', gold: 'var(--accent-gold)', bg: 'var(--bg-main)', tag: 'Top Recomendación', token: '--accent-cyan' },
    { id: 'gold-apex', name: 'Apex Gold & Titanium', primary: 'var(--accent-gold)', secondary: 'var(--accent-cyan)', gold: '#f59e0b', bg: 'var(--bg-elevated)', tag: 'Champions / Lujo', token: '--accent-gold' },
    { id: 'mint-cyber', name: 'Cyber Mint & Emerald', primary: 'var(--accent-emerald)', secondary: 'var(--accent-violet)', gold: 'var(--accent-gold)', bg: 'var(--bg-subtle)', tag: 'Moderna / Web3', token: '--accent-emerald' },
    { id: 'crimson-val', name: 'Crimson Radiant Pulse', primary: 'var(--accent-crimson)', secondary: 'var(--accent-gold)', gold: 'var(--accent-cyan)', bg: 'var(--bg-main)', tag: 'FPS Táctico', token: '--accent-crimson' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16">
      
      {/* Toast Notification when token is copied */}
      {copiedToken && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--accent-cyan)] text-[var(--text-primary)] text-xs font-mono font-bold flex items-center gap-2.5 shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
          <Check className="w-4 h-4 text-[var(--accent-cyan)]" />
          <span>¡Token <code>{copiedToken}</code> copiado al portapapeles!</span>
        </div>
      )}

      {/* Page Header with Responsive Theme Controls */}
      <div className="border-b border-[var(--border-card)] pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>TournamentsPro · App Design System Studio</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--text-heading)] uppercase font-display">
            Sistema visual de la aplicación
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            Compara la evolución de los componentes globales, prueba las paletas candidatas, experimenta con las tarjetas 3D en tiempo real y revisa la respuesta táctil en dispositivos móviles.
          </p>
        </div>

        {/* Live Theme & Language Switcher Bar */}
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-2 pr-2 border-r border-[var(--border-card)]">
            <SunMoon className="w-4 h-4 text-[var(--accent-cyan)]" />
            <span className="text-[11px] font-mono font-bold text-[var(--text-muted)] uppercase">Tema:</span>
          </div>
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </div>

      {/* 🚀 QUICK HUD SECTION NAVIGATOR */}
      <div className="sticky top-16 z-30 -mx-3.5 px-3.5 py-2 bg-[var(--bg-main)]/85 backdrop-blur-xl border-y border-[var(--border-card)] flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-mono font-extrabold text-[var(--accent-cyan)] uppercase tracking-wider pl-1 shrink-0">
          HUD NAV:
        </span>
        <a href="#ui-studio" className="px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-card)] text-[11px] font-bold text-[var(--text-secondary)] whitespace-nowrap transition-colors">
          ⚡ Studio UI
        </a>
        <a href="#lab-3d" className="px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-card)] text-[11px] font-bold text-[var(--text-secondary)] whitespace-nowrap transition-colors">
          🎛️ Laboratorio 3D
        </a>
        <a href="#disciplines" className="px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-card)] text-[11px] font-bold text-[var(--text-secondary)] whitespace-nowrap transition-colors">
          🎮 Disciplinas
        </a>
        <a href="#primitives" className="px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-card)] text-[11px] font-bold text-[var(--text-secondary)] whitespace-nowrap transition-colors">
          🧩 Primitivas & Botones
        </a>
        <a href="#palettes" className="px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-card)] text-[11px] font-bold text-[var(--text-secondary)] whitespace-nowrap transition-colors">
          🎨 Paletas
        </a>
        <a href="#tables" className="px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-card)] text-[11px] font-bold text-[var(--text-secondary)] whitespace-nowrap transition-colors">
          📊 Tablas
        </a>
      </div>

      {/* UI Studio Evolution Component */}
      <div id="ui-studio">
        <AppUiEvolutionStudio />
      </div>

      {/* 🎛️ NUEVO: LABORATORIO INTERACTIVO 3D (TESTBENCH DE TARJETAS 3D) */}
      <section id="lab-3d" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4">
          <div>
            <span className="text-[10px] font-mono font-black text-[var(--accent-cyan)] uppercase tracking-widest block">
              [ TESTBENCH & PLAYGROUND ]
            </span>
            <h2 className="text-2xl font-black text-[var(--text-heading)] uppercase tracking-tight font-display flex items-center gap-2">
              <Sliders className="w-6 h-6 text-[var(--accent-cyan)]" />
              Laboratorio Interactivo de Tarjetas 3D
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Ajusta la física de inclinación, reflejos holográficos y luces neón en tiempo real:
            </p>
          </div>

          <Badge variant="cyan" is3D>
            ⚡ Live Controller
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-5 shadow-xl">
            <h3 className="text-sm font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-cyan)]" />
              Parámetros de Física & Shader
            </h3>

            {/* Slider maxTilt */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--text-secondary)]">Inclinación Máxima (maxTilt):</span>
                <span className="font-bold text-[var(--accent-cyan)]">{labTilt}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={labTilt}
                onChange={(e) => setLabTilt(Number(e.target.value))}
                className="w-full accent-[var(--accent-cyan)] bg-[var(--bg-subtle)] h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Glare & Neon Toggles */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setLabGlare(!labGlare)}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  labGlare
                    ? 'bg-[var(--accent-cyan-bg)] border-[var(--accent-cyan)] text-[var(--accent-cyan)] shadow-md'
                    : 'bg-[var(--bg-subtle)] border-[var(--border-card)] text-[var(--text-muted)]'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Reflejo Glare: {labGlare ? 'ON' : 'OFF'}</span>
              </button>

              <button
                type="button"
                onClick={() => setLabNeon(!labNeon)}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  labNeon
                    ? 'bg-[var(--accent-violet-bg)] border-[var(--accent-violet)] text-[var(--accent-violet)] shadow-md'
                    : 'bg-[var(--bg-subtle)] border-[var(--border-card)] text-[var(--text-muted)]'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Borde Neón: {labNeon ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* Color Accent Picker */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-mono text-[var(--text-secondary)] block">Color Neón Activo:</span>
              <div className="grid grid-cols-6 gap-2">
                {[
                  { color: '#00F0FF', name: 'Cyan' },
                  { color: '#7C8CFF', name: 'Violet' },
                  { color: '#34D399', name: 'Emerald' },
                  { color: '#FF4655', name: 'Crimson' },
                  { color: '#F59E0B', name: 'Gold' },
                  { color: '#C084FC', name: 'Purple' },
                ].map((item) => (
                  <button
                    key={item.color}
                    type="button"
                    onClick={() => setLabAccent(item.color)}
                    className="size-10 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer shadow-md hover:scale-110 active:scale-95"
                    style={{
                      backgroundColor: item.color,
                      borderColor: labAccent === item.color ? '#FFFFFF' : 'transparent',
                    }}
                    title={item.name}
                  >
                    {labAccent === item.color && <Check className="w-4 h-4 text-black drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Snippet */}
            <div className="p-3 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-card)] font-mono text-[11px] text-[var(--text-muted)] space-y-1 relative">
              <div className="flex justify-between items-center pb-1">
                <span className="text-[10px] uppercase font-bold text-[var(--accent-cyan)]">Código JSX resultante</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`<Card3D maxTilt={${labTilt}} glareEffect={${labGlare}} neonBorder={${labNeon}} accentColor="${labAccent}">`)}
                  className="hover:text-[var(--text-primary)] transition-colors p-1"
                  title="Copiar código"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <code className="text-[var(--text-secondary)] block overflow-x-auto whitespace-pre">
                {`<Card3D maxTilt={${labTilt}} glareEffect={${labGlare}} neonBorder={${labNeon}} accentColor="${labAccent}">`}
              </code>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 sm:p-10 rounded-3xl bg-[var(--bg-main)] border border-[var(--border-card)] relative overflow-hidden min-h-[380px]">
            {/* Ambient Back Glow */}
            <div
              className="absolute inset-0 blur-3xl opacity-20 pointer-events-none transition-all duration-500"
              style={{ backgroundColor: labAccent }}
            />

            <Card3D
              maxTilt={labTilt}
              glareEffect={labGlare}
              neonBorder={labNeon}
              accentColor={labAccent}
              className="w-full max-w-md shadow-2xl"
            >
              <div className="p-6 sm:p-8 space-y-5">
                <Card3DItem depth={35}>
                  <div className="flex items-center justify-between">
                    <Badge
                      is3D
                      style={{
                        backgroundColor: `${labAccent}20`,
                        color: labAccent,
                        borderColor: `${labAccent}50`,
                      }}
                    >
                      ★ 3D LIVE TELEMETRY
                    </Badge>
                    <span className="text-[10px] font-mono font-extrabold" style={{ color: labAccent }}>
                      PING 14MS
                    </span>
                  </div>

                  <h4 className="text-xl font-black text-[var(--text-heading)] uppercase tracking-tight font-display mt-2">
                    Tarjeta Reactiva eSports
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Mueve el cursor o toca la pantalla para experimentar el efecto giroscópico y brillo especular.
                  </p>
                </Card3DItem>

                <Card3DItem depth={20}>
                  <div className="grid grid-cols-3 gap-2 text-center font-mono text-[10px]">
                    <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)]">
                      <span className="text-[var(--text-muted)] block font-bold">TILT</span>
                      <span className="font-black text-xs" style={{ color: labAccent }}>{labTilt}°</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)]">
                      <span className="text-[var(--text-muted)] block font-bold">GLARE</span>
                      <span className="font-black text-xs text-[var(--accent-emerald)]">{labGlare ? 'ACTIVO' : 'OFF'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)]">
                      <span className="text-[var(--text-muted)] block font-bold">NEON</span>
                      <span className="font-black text-xs text-[var(--accent-violet)]">{labNeon ? 'ACTIVO' : 'OFF'}</span>
                    </div>
                  </div>
                </Card3DItem>

                <Card3DItem depth={30} className="pt-2">
                  <Button
                    size="sm"
                    className="w-full font-black text-xs uppercase"
                    style={{
                      backgroundColor: labAccent,
                      color: '#031018',
                      boxShadow: `0 0 25px ${labAccent}40`,
                    }}
                  >
                    <Zap className="w-4 h-4 mr-1.5" />
                    Probar Interacción 3D
                  </Button>
                </Card3DItem>
              </div>
            </Card3D>
          </div>
        </div>
      </section>

      {/* 🎮 SECCIÓN 1: SELECTOR INTERACTIVO DISCIPLINA POR DISCIPLINA */}
      <section id="disciplines" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4">
          <div>
            <span className="text-[10px] font-mono font-black text-[var(--accent-cyan)] uppercase tracking-widest block">
              [ NAVEGACIÓN ENTRE DISCIPLINAS ]
            </span>
            <h2 className="text-2xl font-black text-[var(--text-heading)] uppercase tracking-tight font-display">
              1. Selecciona una Disciplina eSports
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Haz clic en cualquier juego para ver cómo reaccionan las tarjetas 3D con la paleta de la disciplina y el tema actual:
            </p>
          </div>

          <Badge variant="cyan" is3D>
            🎮 {activeGame.name} Activo
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
                className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center gap-3 text-left relative overflow-hidden group cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--bg-card-hover)] border-2 shadow-xl scale-[1.03]'
                    : 'bg-[var(--bg-card)] border-[var(--border-card)] hover:border-[var(--border-card-hover)] hover:bg-[var(--bg-card-hover)]'
                }`}
                style={{
                  borderColor: isSelected ? game.brandColor : undefined,
                  boxShadow: isSelected ? `0 10px 25px -5px ${game.brandColor}35` : undefined,
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
                  <div className="text-xs font-black text-[var(--text-heading)] uppercase truncate">{game.name}</div>
                  <div className="text-[10px] font-mono text-[var(--text-muted)] truncate">{game.category}</div>
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

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
          <GameIdentityCard game={activeGame} />
          <div className="glass-panel flex flex-col justify-between gap-5 rounded-3xl p-5 sm:p-6">
            <div>
              <Badge variant="cyan" is3D>Visual System V2</Badge>
              <h3 className="mt-4 text-2xl font-black uppercase tracking-tight">Una identidad, todas las vistas</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                Fondo original, profundidad, retícula, brillo y contraste se heredan desde el gameSlug sin duplicar estilos por página.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <span className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-subtle)] p-3"><b className="block text-[var(--game-brand)]">ESCENA</b>{activeGame.visualTheme.scene}</span>
              <span className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-subtle)] p-3"><b className="block text-[var(--game-accent)]">MOTIVO</b>{activeGame.visualTheme.motif}</span>
            </div>
          </div>
        </div>

        {/* 🌟 VISTA EN VIVO: CÓMO QUEDA LA SUITE 3D PARA ESTA DISCIPLINA */}
        <div
          className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] backdrop-blur-xl shadow-2xl space-y-8 relative overflow-hidden transition-all duration-300"
          style={{
            borderColor: `${activeGame.brandColor}40`,
            boxShadow: `0 20px 60px -20px var(--shadow-card), 0 0 40px ${activeGame.brandColor}15`,
          }}
        >
          {/* Ambient Lighting matching discipline */}
          <div
            className="absolute top-0 right-0 size-96 blur-3xl pointer-events-none rounded-full opacity-20"
            style={{ backgroundColor: activeGame.brandColor }}
          />

          {/* Discipline Banner Header */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4">
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
                <h3 className="text-xl sm:text-2xl font-black text-[var(--text-heading)] uppercase tracking-tight font-display">
                  {activeGame.tagline}
                </h3>
              </div>
            </div>

            {/* Quick Actions themed */}
            <div className="flex items-center gap-2">
              <Badge
                is3D
                style={{
                  backgroundColor: `${activeGame.brandColor}20`,
                  color: activeGame.brandColor,
                  borderColor: `${activeGame.brandColor}50`,
                }}
              >
                Modo: {activeDisciplineData.match.modeLabel}
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
                        backgroundColor: `${activeGame.brandColor}20`,
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
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {activeDisciplineData.match.status}
                    </span>
                  </div>

                  <h4 className="text-lg font-black text-[var(--text-heading)] uppercase tracking-tight font-display">
                    {activeDisciplineData.match.title}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                    {activeDisciplineData.match.subtitle}
                  </p>
                </Card3DItem>

                {/* Scoreboard */}
                <Card3DItem depth={25}>
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-card)] flex items-center justify-between font-mono">
                    <div className="flex items-center gap-2">
                      <div
                        className="size-8 rounded-lg flex items-center justify-center font-black text-xs text-white"
                        style={{
                          backgroundColor: `${activeGame.brandColor}40`,
                          border: `1px solid ${activeGame.brandColor}70`,
                        }}
                      >
                        {activeDisciplineData.match.teamA.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-xs text-[var(--text-primary)] truncate max-w-[80px] sm:max-w-[95px]">
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
                      <span className="font-bold text-xs text-[var(--text-primary)] truncate max-w-[80px] sm:max-w-[95px]">
                        {activeDisciplineData.match.teamB}
                      </span>
                      <div className="size-8 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-card)] flex items-center justify-center font-black text-xs text-[var(--text-primary)]">
                        {activeDisciplineData.match.teamB.slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </Card3DItem>

                <Card3DItem depth={35} className="pt-2">
                  <Button
                    size="sm"
                    className="w-full font-black text-xs uppercase cursor-pointer"
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
                    <PositionBadge primaryPosition={activeDisciplineData.player.role.slice(0, 3)} brandColor={activeGame.accentColor} />
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
                      <h4 className="text-lg font-black text-[var(--text-heading)] uppercase tracking-tight">
                        {activeDisciplineData.player.name}{' '}
                        <span className="font-mono text-sm" style={{ color: activeGame.accentColor }}>
                          {activeDisciplineData.player.number}
                        </span>
                      </h4>
                      <span className="text-xs text-[var(--text-secondary)] font-semibold block">
                        {activeDisciplineData.player.role}
                      </span>
                    </div>
                  </div>
                </Card3DItem>

                {/* Stats Grid */}
                <Card3DItem depth={20}>
                  <div className="grid grid-cols-3 gap-2 text-center font-mono text-[10px]">
                    {activeDisciplineData.player.stats.map((st) => (
                      <div key={st.label} className="p-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)]">
                        <span className="text-[var(--text-muted)] block font-bold truncate">{st.label}</span>
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
                    className="w-full font-black text-xs uppercase cursor-pointer"
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
                    <span className="text-[10px] font-mono text-[var(--text-muted)] font-extrabold">
                      {activeDisciplineData.tournament.teamsCount}
                    </span>
                  </div>

                  <h4 className="text-lg font-black text-[var(--text-heading)] uppercase tracking-tight font-display">
                    {activeDisciplineData.tournament.name}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] font-medium">
                    {activeDisciplineData.tournament.description}
                  </p>
                </Card3DItem>

                {/* Prize Pool Spotlight */}
                <Card3DItem depth={25}>
                  <div className="p-3.5 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-subtle)] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Trophy
                        className="w-5 h-5"
                        style={{ color: activeGame.accentColor || 'var(--accent-gold)' }}
                      />
                      <div>
                        <span className="text-[9px] font-mono uppercase text-[var(--text-muted)] font-bold block">
                          Premio a Repartir
                        </span>
                        <span className="text-sm font-black text-[var(--text-heading)] font-mono">
                          {activeDisciplineData.tournament.prize}
                        </span>
                      </div>
                    </div>

                    <span
                      className="text-[9px] font-mono font-bold px-2 py-1 rounded-md border"
                      style={{
                        backgroundColor: `${activeGame.brandColor}15`,
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
                    className="w-full font-black text-xs uppercase cursor-pointer"
                  >
                    <Trophy className="w-4 h-4 mr-1.5" />
                    Inscribir Escuadra
                  </Button>
                </Card3DItem>
              </div>
            </Card3D>
          </div>

          {/* PALETA DE COLOR ACTIVA & CONTROLES THEMED */}
          <div className="relative z-10 pt-4 border-t border-[var(--border-card)] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase block">Brand Primario</span>
              <div className="flex items-center gap-2">
                <div className="size-5 rounded-md shadow" style={{ backgroundColor: activeGame.brandColor }} />
                <span className="font-mono font-bold text-[var(--text-heading)]">{activeGame.brandColor}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase block">Acento Secundario</span>
              <div className="flex items-center gap-2">
                <div className="size-5 rounded-md shadow" style={{ backgroundColor: activeGame.accentColor }} />
                <span className="font-mono font-bold text-[var(--text-heading)]">{activeGame.accentColor}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase block">Color Dark Oficial</span>
              <div className="flex items-center gap-2">
                <div className="size-5 rounded-md border border-[var(--border-card)] shadow" style={{ backgroundColor: activeGame.darkBg }} />
                <span className="font-mono font-bold text-[var(--text-heading)]">{activeGame.darkBg}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🧩 SECCIÓN 2: BANCO DE PRUEBAS DE PRIMITIVAS UI */}
      <section id="primitives" className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4">
          <div>
            <span className="text-[10px] font-mono font-black text-[var(--accent-cyan)] uppercase tracking-widest block">
              [ BOTONES, BADGES & AVATARES ]
            </span>
            <h2 className="text-2xl font-black text-[var(--text-heading)] uppercase tracking-tight font-display">
              2. Banco de Pruebas de Primitivas UI
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Interactúa con los botones, badges de posición y estados de jugador para verificar su respuesta táctil y visual:
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBtnLoading(!btnLoading)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                btnLoading
                  ? 'bg-[var(--accent-cyan-bg)] border-[var(--accent-cyan)] text-[var(--accent-cyan)]'
                  : 'bg-[var(--bg-subtle)] border-[var(--border-card)] text-[var(--text-muted)]'
              }`}
            >
              Loading: {btnLoading ? 'ON' : 'OFF'}
            </button>
            <button
              type="button"
              onClick={() => setBtnDisabled(!btnDisabled)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                btnDisabled
                  ? 'bg-[var(--accent-crimson-bg)] border-[var(--accent-crimson)] text-[var(--accent-crimson)]'
                  : 'bg-[var(--bg-subtle)] border-[var(--border-card)] text-[var(--text-muted)]'
              }`}
            >
              Disabled: {btnDisabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Buttons Suite */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-6">
          <h3 className="text-sm font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
            <Zap className="w-4 h-4 text-[var(--accent-gold)]" />
            Variantes de Botones eSports
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              isLoading={btnLoading}
              disabled={btnDisabled}
              onClick={() => setClickCount((c) => c + 1)}
            >
              <Flame className="w-4 h-4 mr-1.5 text-[var(--accent-gold)]" />
              Botón Primario ({clickCount})
            </Button>

            <Button
              variant="secondary"
              isLoading={btnLoading}
              disabled={btnDisabled}
              onClick={() => setClickCount((c) => c + 1)}
            >
              <Activity className="w-4 h-4 mr-1.5" />
              Botón Secundario
            </Button>

            <Button
              variant="outline"
              isLoading={btnLoading}
              disabled={btnDisabled}
            >
              <Trophy className="w-4 h-4 mr-1.5" />
              Botón Outline
            </Button>

            <Button
              variant="ghost"
              isLoading={btnLoading}
              disabled={btnDisabled}
            >
              Botón Fantasma
            </Button>

            <Button
              variant="danger"
              isLoading={btnLoading}
              disabled={btnDisabled}
            >
              <AlertCircle className="w-4 h-4 mr-1.5" />
              Acción Crítica
            </Button>
          </div>

          <div className="pt-4 border-t border-[var(--border-card)] space-y-3">
            <h4 className="text-xs font-black uppercase text-[var(--text-secondary)]">Tamaños de Botón</h4>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small (sm · 36px)</Button>
              <Button size="md">Medium (md · 44px)</Button>
              <Button size="lg">Large Pro (lg · 50px)</Button>
            </div>
          </div>
        </div>

        {/* Badges & Position Badges Suite */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-4">
            <h3 className="text-sm font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-cyan)]" />
              Insignias & Badges 3D
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="cyan" is3D>Cyan 3D</Badge>
              <Badge variant="violet" is3D>Violet 3D</Badge>
              <Badge variant="emerald" is3D>Emerald 3D</Badge>
              <Badge variant="gold" is3D>Gold 3D</Badge>
              <Badge variant="rose" is3D>Rose 3D</Badge>
              <Badge variant="slate">Slate Flat</Badge>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                EN VIVO
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                MATCHDAY
              </span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-4">
            <h3 className="text-sm font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
              <Crown className="w-4 h-4 text-[var(--accent-gold)]" />
              Badges de Posición eSports
            </h3>

            <div className="flex flex-wrap items-center gap-2.5">
              <PositionBadge primaryPosition="MCO" secondaryPosition="MC" brandColor="#00F0FF" />
              <PositionBadge primaryPosition="DC" secondaryPosition="EI" brandColor="#34D399" />
              <PositionBadge primaryPosition="AWP" secondaryPosition="IGL" brandColor="#F59E0B" />
              <PositionBadge primaryPosition="DUEL" secondaryPosition="INIT" brandColor="#FF4655" />
              <PositionBadge primaryPosition="MID" secondaryPosition="ADC" brandColor="#C084FC" />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Avatar fallback="SL" size="sm" status="online" />
              <Avatar fallback="LY" size="md" status="online" />
              <Avatar fallback="SN" size="lg" status="away" />
              <Avatar fallback="KR" size="xl" status="offline" />
            </div>
          </div>
        </div>

        {/* Alerts & System Notifications */}
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
            <Info className="w-4 h-4 text-[var(--accent-cyan)]" />
            Alertas del Sistema
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Alert variant="info" title="Circuito Verificado">
              Los servidores oficiales aplican comprobación anti-trampas en cada encuentro.
            </Alert>
            <Alert variant="success" title="Acta de Partido Aprobada">
              El resultado 3 - 1 fue confirmado por ambos capitanes.
            </Alert>
            <Alert variant="warning" title="Período de Transferencias">
              El mercado de agentes libres cierra en 48 horas.
            </Alert>
            <Alert variant="danger" title="Sanción Disciplinaria">
              Jugador no habilitado para la fecha 12 por acumulación de tarjetas.
            </Alert>
          </div>
        </div>
      </section>

      {/* 🎨 SECCIÓN 3: SIMULADOR DE PALETAS PARA LA PORTADA PRINCIPAL */}
      <section id="palettes" className="space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-[var(--accent-gold)]" />
            <h2 className="text-xl font-bold text-[var(--text-heading)]">3. Estilos Recomendados para la Página Principal</h2>
          </div>
          <Badge variant="gold" is3D>Global Themes</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {globalThemes.map((theme) => {
            const isSelected = selectedGlobalTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setSelectedGlobalTheme(theme.id)}
                className={`text-left p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-3 relative group cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--bg-card-hover)] border-2 shadow-xl scale-[1.02]'
                    : 'bg-[var(--bg-card)] border-[var(--border-card)] hover:border-[var(--border-card-hover)] hover:bg-[var(--bg-card-hover)]'
                }`}
                style={{
                  borderColor: isSelected ? theme.primary : undefined,
                }}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-card)]">
                      {theme.tag}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4" style={{ color: theme.primary }} />
                    )}
                  </div>
                  <h4 className="text-sm font-black text-[var(--text-heading)] uppercase pt-1">{theme.name}</h4>
                </div>

                {/* Swatches with click to copy */}
                <div className="flex items-center gap-1.5 pt-2">
                  <div
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(theme.token); }}
                    className="h-6 flex-1 rounded-md shadow-sm hover:scale-105 transition-transform"
                    style={{ backgroundColor: theme.primary }}
                    title={`Copiar ${theme.token}`}
                  />
                  <div className="h-6 flex-1 rounded-md shadow-sm" style={{ backgroundColor: theme.secondary }} />
                  <div className="h-6 flex-1 rounded-md shadow-sm" style={{ backgroundColor: theme.gold }} />
                  <div className="h-6 flex-1 rounded-md border border-[var(--border-card)] shadow-sm" style={{ backgroundColor: theme.bg }} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 🧩 SECCIÓN 4: CONTROLES DE FORMULARIO & INPUTS */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3">
          <Mail className="w-5 h-5 text-[var(--accent-cyan)]" />
          <h2 className="text-xl font-bold text-[var(--text-heading)]">4. Controles de Formulario & Inputs eSports</h2>
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

      {/* 📊 SECCIÓN 5: TABLA DE POSICIONES ESPORTS */}
      <section id="tables" className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3">
          <Trophy className="w-5 h-5 text-[var(--accent-gold)]" />
          <h2 className="text-xl font-bold text-[var(--text-heading)]">5. Tablas de Posiciones eSports Adaptables</h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[var(--border-card)]">
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
        </div>
      </section>

      {/* 🚀 SECCIÓN 6: MODALES & DIÁLOGOS */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3">
          <Sparkles className="w-5 h-5 text-[var(--accent-cyan)]" />
          <h2 className="text-xl font-bold text-[var(--text-heading)]">6. Modales & Diálogos Interactivos</h2>
        </div>

        <div className="p-6 rounded-2xl glass-panel">
          <Button onClick={() => setIsModalOpen(true)}>
            Abrir Modal de Confirmación
          </Button>

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Confirmar Reporte de Partido"
            description="Revisa los datos del encuentro antes de guardar la información en la base de datos."
          >
            <div className="space-y-4 text-xs text-[var(--text-secondary)]">
              <div className="p-3.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-card)] flex justify-between items-center">
                <span className="font-bold text-[var(--text-heading)]">LeguaYork eSp</span>
                <span className="text-base font-black text-[var(--accent-cyan)] font-mono">3 - 1</span>
                <span className="font-bold text-[var(--text-heading)]">Sangre Nueva FC</span>
              </div>
              <p className="leading-relaxed">Al confirmar el resultado, las estadísticas se procesarán automáticamente en la tabla de posiciones y ranking ELO de los clubes.</p>
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
