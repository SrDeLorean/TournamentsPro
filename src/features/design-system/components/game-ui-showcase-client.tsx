'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { GAMES_CATALOG, GameConfig } from '@/lib/games-data';
import { shouldBypassImageOptimization } from '@/lib/image-utils';
import { GameSubNavbar } from '@/components/layout/game-sub-navbar';
import { TacticalLoadingSkeleton } from '@/components/tournaments/tactical-loading-skeleton';
import { DateCarousel, CalendarDayItem } from '@/components/tournaments/date-carousel';
import { MatchFilterToolbar, OrgOption, TournOption } from '@/components/tournaments/match-filter-toolbar';
import { MatchCard } from '@/components/tournaments/match-card';
import { FixtureMatchItem } from '@/components/tournaments/fixture-schedule-view';
import { MatchReportModal } from '@/components/matches/match-report-modal';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { DesignControls } from '@/components/ui/design-controls';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import {
  Flame,
  Shield,
  Zap,
  Layers,
  Lock,
  RefreshCw,
  Sliders,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';

interface GameUIShowcaseClientProps {
  gameSlug: string;
}

export default function GameUIShowcaseClient({ gameSlug }: GameUIShowcaseClientProps) {
  const game: GameConfig = GAMES_CATALOG[gameSlug] || GAMES_CATALOG['valorant'];
  const brandColor = game?.brandColor || '#FF4654';

  // Demo Controls State
  const [activeTab, setActiveTab] = useState<'LIVE' | 'PLAN' | 'DESIGN_SYSTEM'>('LIVE');
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [simulatedRole, setSimulatedRole] = useState<'ADMIN' | 'CAPTAIN' | 'GUEST'>('ADMIN');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'EN_VIVO' | 'PROXIMOS' | 'FINALIZADOS'>('TODOS');
  const [selectedOrgName, setSelectedOrgName] = useState('TODAS');
  const [selectedTournName, setSelectedTournName] = useState('TODAS');
  const [selectedDate, setSelectedDate] = useState('2026-08-02');
  const [reportModalMatch, setReportModalMatch] = useState<FixtureMatchItem | null>(null);
  const [timezoneReference, setTimezoneReference] = useState<string | null>(null);

  // Mock Calendar Days
  const mockCalendarDays: CalendarDayItem[] = useMemo(
    () => [
      { dateStr: '2026-07-30', label: 'Jueves 30/07', dayName: 'JUEVES', dayDDMM: '30/07', dayNumber: 30, count: 4 },
      { dateStr: '2026-07-31', label: 'Viernes 31/07', dayName: 'VIERNES', dayDDMM: '31/07', dayNumber: 31, count: 6 },
      { dateStr: '2026-08-01', label: 'Sábado 01/08', dayName: 'SÁBADO', dayDDMM: '01/08', dayNumber: 1, count: 2 },
      { dateStr: '2026-08-02', label: 'Domingo 02/08', dayName: 'DOMINGO', dayDDMM: '02/08', dayNumber: 2, count: 8 },
      { dateStr: '2026-08-03', label: 'Lunes 03/08', dayName: 'LUNES', dayDDMM: '03/08', dayNumber: 3, count: 5 },
      { dateStr: '2026-08-04', label: 'Martes 04/08', dayName: 'MARTES', dayDDMM: '04/08', dayNumber: 4, count: 3 },
      { dateStr: '2026-08-05', label: 'Miércoles 05/08', dayName: 'MIÉRCOLES', dayDDMM: '05/08', dayNumber: 5, count: 7 },
    ],
    []
  );

  // Mock Organizations and Tournaments
  const mockOrgs: OrgOption[] = [
    { id: 'org-1', name: 'KRÜ Esports', tag: 'KRU' },
    { id: 'org-2', name: 'Leviatán Esports', tag: 'LEV' },
    { id: 'org-3', name: 'Sentinels LATAM', tag: 'SEN' },
  ];

  const mockTournaments: TournOption[] = [
    { id: 't-1', name: 'VALORANT Challengers LATAM 2026' },
    { id: 't-2', name: 'VALORANT Masters Santiago 5v5' },
  ];

  // Mock Tactical Matches
  const mockMatches: FixtureMatchItem[] = useMemo(
    () => [
      {
        id: 'val-m-1',
        homeTeam: 'KRÜ Esports',
        homeTag: 'KRU',
        awayTeam: 'Leviatán Esports',
        awayTag: 'LEV',
        homeScore: 13,
        awayScore: 11,
        status: 'EN_VIVO',
        transmissionTime: '21:00',
        exactDateDisplay: 'Domingo 02 de Agosto',
        matchDate: '2026-08-02',
        dayLabel: 'Domingo 02/08',
        dayNumber: 2,
        circuitName: 'GRAN FINAL TÁCTICA',
        competitionName: 'VALORANT Challengers LATAM 2026',
        groupJornada: 'PLAYOFFS',
      },
      {
        id: 'val-m-2',
        homeTeam: 'Sentinels LATAM',
        homeTag: 'SEN',
        awayTeam: 'Apex Predators',
        awayTag: 'AP',
        homeScore: 2,
        awayScore: 0,
        status: 'FINALIZADO',
        transmissionTime: '19:00',
        exactDateDisplay: 'Domingo 02 de Agosto',
        matchDate: '2026-08-02',
        dayLabel: 'Domingo 02/08',
        dayNumber: 2,
        circuitName: 'SEMIFINAL B',
        competitionName: 'VALORANT Masters Santiago 5v5',
        groupJornada: 'SEMIFINALES',
      },
      {
        id: 'val-m-3',
        homeTeam: 'Cyber Titans FC',
        homeTag: 'CY',
        awayTeam: 'Kuroshiro Gaming',
        awayTag: 'KS',
        homeScore: null,
        awayScore: null,
        status: 'PROGRAMADO',
        transmissionTime: '22:30',
        exactDateDisplay: 'Domingo 02 de Agosto',
        matchDate: '2026-08-02',
        dayLabel: 'Domingo 02/08',
        dayNumber: 2,
        circuitName: 'FASE DE GRUPOS - GRUPO A',
        competitionName: 'VALORANT Challengers LATAM 2026',
        groupJornada: 'FECHA 4',
      },
    ],
    []
  );

  // Filtered matches
  const filteredMatches = useMemo(() => {
    return mockMatches.filter((m) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchText = `${m.homeTeam} ${m.awayTeam} ${m.competitionName} ${m.circuitName}`.toLowerCase();
        if (!matchText.includes(q)) return false;
      }
      if (statusFilter !== 'TODOS' && m.status !== statusFilter) {
        if (statusFilter === 'PROXIMOS' && m.status !== 'PROGRAMADO') return false;
        if (statusFilter === 'FINALIZADOS' && m.status !== 'FINALIZADO') return false;
        if (statusFilter === 'EN_VIVO' && m.status !== 'EN_VIVO') return false;
      }
      return true;
    });
  }, [mockMatches, searchQuery, statusFilter]);

  const toggleLoadingDemo = () => {
    setIsLoadingDemo(true);
    setTimeout(() => setIsLoadingDemo(false), 2000);
  };

  return (
    <div
      className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-sans"
      style={{
        '--game-brand': brandColor,
        '--game-accent': '#BA3A46',
      } as React.CSSProperties}
    >
      <GameSubNavbar game={game} activeSection="UI" />

      {/* BACKGROUND BANNER WITH TACTICAL ATMOSPHERE */}
      <div className="relative w-full min-h-screen">
        <div className="absolute top-0 left-0 right-0 h-[650px] w-full overflow-hidden pointer-events-none z-0">
          <Image
            src={game.bannerUrl}
            alt={game.name}
            fill
            sizes="100vw"
            loading="eager"
            unoptimized={shouldBypassImageOptimization(game.bannerUrl)}
            className="object-cover object-top opacity-20 dark:opacity-45 filter contrast-105 saturate-110 brightness-100 transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-main)]/50 to-[var(--bg-main)]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-16 relative z-10 space-y-8">
          
          {/* ── SHOWCASE DEMO HEADER ────────────────────────────────────────── */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-2xl space-y-4 relative overflow-hidden font-mono backdrop-blur-md">
            <div
              className="absolute -right-16 -top-16 w-72 h-72 rounded-full blur-3xl opacity-25 pointer-events-none"
              style={{ backgroundColor: brandColor }}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant="rose"
                  className="text-[10px] font-mono font-black uppercase py-1 px-3 flex items-center gap-1.5"
                  style={{ backgroundColor: `${brandColor}30`, borderColor: brandColor, color: '#fff' }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>SISTEMA DE DISEÑO TÁCTICO & MULTI-TEMA (CLARO / OSCURO / OLED)</span>
                </Badge>
                <span className="text-xs text-red-400 font-bold hidden sm:inline">
                  • HTTP://LOCALHOST:3000/VALORANT/UI
                </span>
              </div>

              {/* TAB SELECTOR & THEME SWITCHER */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 bg-[var(--bg-main)] p-1 rounded-2xl border border-[var(--border-card)] text-xs">
                  <button
                    onClick={() => setActiveTab('LIVE')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'LIVE' ? 'bg-red-500 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>VISTA EN VIVO</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('PLAN')}
                    className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'PLAN' ? 'bg-red-500 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>PLAN COMPLETO</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('DESIGN_SYSTEM')}
                    className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'DESIGN_SYSTEM' ? 'bg-red-500 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>SISTEMA DE COMPONENTES</span>
                  </button>
                </div>

                {/* DYNAMIC THEME SWITCHER FOR LIGHT / DARK / OLED */}
                <ThemeSwitcher />
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[var(--text-heading)] flex items-center gap-3">
                <span className="text-red-500">{game.name}</span>
                <span>MATCHDAY & ENCUENTROS TÁCTICOS 5v5</span>
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-sans max-w-3xl leading-relaxed">
                Demostración interactiva en tiempo real adaptada a los temas <strong>Claro</strong>, <strong>Oscuro</strong> y <strong>OLED (Pitch Black)</strong>, animaciones de carga con el logo oficial de VALORANT y carrusel con navegación lateral.
              </p>
            </div>

            {/* CONTROLES INTERACTIVOS DE PRUEBA */}
            <div className="pt-3 border-t border-[var(--border-card)] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-muted)] font-bold uppercase text-[10px]">SIMULAR ROL DEL USUARIO:</span>
                <button
                  onClick={() => setSimulatedRole('ADMIN')}
                  className={`px-2.5 py-1 rounded-lg font-bold border transition-all ${
                    simulatedRole === 'ADMIN'
                      ? 'bg-purple-950 text-purple-300 border-purple-500'
                      : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-card)]'
                  }`}
                >
                  ADMINISTRADOR
                </button>
                <button
                  onClick={() => setSimulatedRole('CAPTAIN')}
                  className={`px-2.5 py-1 rounded-lg font-bold border transition-all ${
                    simulatedRole === 'CAPTAIN'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-400'
                      : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-card)]'
                  }`}
                >
                  CAPITÁN / ENTRENADOR
                </button>
                <button
                  onClick={() => setSimulatedRole('GUEST')}
                  className={`px-2.5 py-1 rounded-lg font-bold border transition-all ${
                    simulatedRole === 'GUEST'
                      ? 'bg-amber-950 text-amber-300 border-amber-500'
                      : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-card)]'
                  }`}
                >
                  ESPECTADOR / GUEST
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={toggleLoadingDemo}
                className="text-xs font-bold py-1 px-3 rounded-xl border-red-500/40 text-red-400 hover:bg-red-950/50 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDemo ? 'animate-spin' : ''}`} />
                <span>PROBAR SKELETON LOADER CON LOGO</span>
              </Button>
            </div>
          </div>

          {/* ── TAB 1: VISTA EN VIVO CON COMPONENTES TÁCTICOS ────────────────── */}
          {activeTab === 'LIVE' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {isLoadingDemo ? (
                <TacticalLoadingSkeleton game={game} message="CARGANDO ENCUENTROS TÁCTICOS DE VALORANT..." />
              ) : (
                <>
                  {/* 1. Carrusel Táctico de Fechas con Flechas a los Costados */}
                  <DateCarousel
                    game={game}
                    calendarDays={mockCalendarDays}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                  />

                  {/* 2. Toolbar de Buscador y Filtros */}
                  <MatchFilterToolbar
                    game={game}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    selectedOrgName={selectedOrgName}
                    setSelectedOrgName={setSelectedOrgName}
                    selectedTournName={selectedTournName}
                    setSelectedTournName={setSelectedTournName}
                    availableOrgs={mockOrgs}
                    availableTournaments={mockTournaments}
                    totalMatchesCount={mockMatches.length}
                  />

                  {/* 3. Cuadrícula de Partidos Tácticos */}
                  <div className="space-y-3 font-mono">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] uppercase">
                        <Flame className="w-4 h-4 text-red-500" />
                        <span>ENCUENTROS DE LA FECHA SELECCIONADA ({selectedDate}):</span>
                      </div>
                      <Badge variant="rose" className="text-[10px] font-bold">
                        {filteredMatches.length} PARTIDOS
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredMatches.map((m) => (
                        <MatchCard
                          key={m.id}
                          match={m}
                          game={game}
                          isAdminOrOrganizer={simulatedRole === 'ADMIN'}
                          isCaptainOrCoach={simulatedRole === 'CAPTAIN'}
                          onOpenReportModal={(match) => setReportModalMatch(match)}
                          onOpenTimezoneModal={setTimezoneReference}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── TAB 2: EXPLICACIÓN DEL PLAN MAESTRO COMPLETO ────────────────── */}
          {activeTab === 'PLAN' && (
            <div className="space-y-6 font-mono animate-in fade-in duration-300">
              <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-6 backdrop-blur-md">
                <div className="flex items-center gap-3 border-b border-[var(--border-card)] pb-4">
                  <Layers className="w-7 h-7 text-red-500" />
                  <div>
                    <h2 className="text-xl font-extrabold text-[var(--text-heading)]">ARQUITECTURA Y PROMPT MAESTRO DE RESTRUCTURACIÓN</h2>
                    <p className="text-xs text-[var(--text-muted)] font-sans">
                      Especificación técnica detallada de componentes, diseño UI/UX en modos Claro, Oscuro y OLED.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SECCIÓN 1: LAYOUT & COMPONENTES */}
                  <div className="p-5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-3">
                    <h3 className="text-sm font-bold text-red-500 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span>1. ESTRUCTURA DE COMPONENTES MULTI-TEMA</span>
                    </h3>
                    <ul className="text-xs text-[var(--text-secondary)] space-y-2 list-disc list-inside font-sans">
                      <li><strong>Soporte Claro / Oscuro / OLED</strong>: Todos los fondos, bordes y textos utilizan variables CSS dinámicas.</li>
                      <li><strong>TacticalLoadingSkeleton</strong>: Loader con el logo animado de VALORANT y tarjetas shimmer adaptativas.</li>
                      <li><strong>DateCarousel</strong>: Carrusel con flechas laterales <code>&lt; [Fechas] &gt;</code>, scrollbar visible y resaltado vibrante.</li>
                      <li><strong>MatchFilterToolbar</strong>: Buscador instantáneo con sanitización y selector de organización/competencia.</li>
                    </ul>
                  </div>

                  {/* SECCIÓN 2: SEGURIDAD RBAC */}
                  <div className="p-5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-3">
                    <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      <span>2. GOBERNANZA Y SEGURIDAD (RBAC)</span>
                    </h3>
                    <ul className="text-xs text-[var(--text-secondary)] space-y-2 list-disc list-inside font-sans">
                      <li><strong>Validación de Roles en Cliente & Backend</strong>: Restricción del botón &quot;REPORTAR&quot; a Capitanes, Entrenadores u Organizadores.</li>
                      <li><strong>Protección contra Manipulación</strong>: Verificación de tokens de sesión y firmas en `POST /api/matches/approval`.</li>
                      <li><strong>Sanitización de Consultas SQL</strong>: Parametrización estricta en `/api/matches`.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: DICCIONARIO DEL SISTEMA DE DISEÑO TÁCTICO ─────────────── */}
          {activeTab === 'DESIGN_SYSTEM' && (
            <div className="space-y-6 font-mono animate-in fade-in duration-300">
              <DesignControls />
              <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-6 backdrop-blur-md">
                <h3 className="text-lg font-bold text-[var(--text-heading)] flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-red-500" />
                  <span>SISTEMA DE DISEÑO ADAPTATIVO (CLARO / OSCURO / OLED)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-amber-500/40 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500 mx-auto flex items-center justify-center">
                      <Sun className="w-5 h-5 text-amber-500" />
                    </div>
                    <h4 className="text-xs font-bold text-[var(--text-heading)]">MODO CLARO (LIGHT)</h4>
                    <p className="text-[11px] font-mono text-[var(--text-muted)]">Fondo suave #edf2f7 y contraste óptimo</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-cyan-500/40 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500 mx-auto flex items-center justify-center">
                      <Moon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h4 className="text-xs font-bold text-[var(--text-heading)]">MODO OSCURO (DARK)</h4>
                    <p className="text-[11px] font-mono text-[var(--text-muted)]">Ambiente espacial eSports #05070d</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-purple-500/40 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500 mx-auto flex items-center justify-center">
                      <Zap className="w-5 h-5 text-purple-400" />
                    </div>
                    <h4 className="text-xs font-bold text-[var(--text-heading)]">MODO OLED (PITCH BLACK)</h4>
                    <p className="text-[11px] font-mono text-[var(--text-muted)]">Negro puro #000000 con acentos neón</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* MATCH REPORT MODAL FOR LIVE DEMO */}
      {reportModalMatch && (
        <MatchReportModal
          match={{
            id: reportModalMatch.id,
            homeTeam: reportModalMatch.homeTeam,
            awayTeam: reportModalMatch.awayTeam,
            gameSlug: game.slug,
            tournamentName: reportModalMatch.competitionName,
          }}
          isOpen={!!reportModalMatch}
          onClose={() => setReportModalMatch(null)}
        />
      )}
      <Modal
        isOpen={Boolean(timezoneReference)}
        onClose={() => setTimezoneReference(null)}
        title="Referencia horaria"
        description="Hora oficial mostrada en el calendario competitivo."
        size="sm"
      >
        <p className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-subtle)] p-4 font-mono text-sm text-[var(--text-primary)]">
          {timezoneReference} CLT · America/Santiago
        </p>
      </Modal>
    </div>
  );
}
