'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { CountryFlag } from '@/components/ui/country-flag';
import { useAuth } from '@/components/providers/auth-provider';
import { GAMES_CATALOG } from '@/lib/games-data';
import { MatchReportModal } from '@/components/matches/match-report-modal';
import {
  Trophy,
  Search,
  Gamepad2,
  RefreshCw,
  Building2,
  Shield,
  BarChart2,
  CheckCircle2,
  Info,
  Globe2,
  X,
  FileCheck,
} from 'lucide-react';
import {
  ManagementHero,
  ManagementMetrics,
  ManagementPage,
  MetricCard,
} from '@/components/dashboard/management-ui';

export interface MatchdayReportItem {
  id: string;
  gameSlug: string;
  gameName: string;
  tournamentId: string;
  tournamentName: string;
  organizationName: string;
  homeTeam: string;
  homeTag: string;
  awayTeam: string;
  awayTag: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'PROGRAMADO' | 'POR_REVISAR' | 'EN_VIVO' | 'FINALIZADO';
  matchDate: string;
  transmissionTime: string;
  groupJornada: string;
  proofUrl?: string | null;
}

interface TournamentApiItem {
  id: string;
  name: string;
  game_slug?: string;
}

interface MatchApiItem {
  id?: string;
  scheduled_at?: string;
  scheduled_time?: string;
  transmission_time?: string;
  game_slug?: string;
  tournament_id?: string;
  competition_id?: string;
  tournament_name?: string;
  organization_name?: string;
  home_team_name?: string;
  home_team_tag?: string;
  away_team_name?: string;
  away_team_tag?: string;
  score_home?: number | string | null;
  score_away?: number | string | null;
  status?: string;
  round_name?: string;
  matchday?: number;
  matchday_number?: number;
  proof_url?: string | null;
}

export function MatchdayReportView() {
  const { currentUser } = useAuth();
  const roleStr = (currentUser?.role || '').toLowerCase();
  const isAdminOrOrganizer = roleStr === 'administrador' || roleStr === 'admin' || roleStr === 'organizador';
  const isCaptainOrCoach = roleStr === 'entrenador' || roleStr === 'capitan' || roleStr === 'capitán' || roleStr === 'club';

  // Filters State
  const [selectedGameSlug, setSelectedGameSlug] = useState<string>('TODOS');
  const [selectedTournName, setSelectedTournName] = useState<string>('TODAS');
  const [clubSearch, setClubSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');

  // Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedMatchForReport, setSelectedMatchForReport] = useState<MatchdayReportItem | null>(null);
  const [isTimezoneModalOpen, setIsTimezoneModalOpen] = useState(false);
  const [selectedTimeForModal, setSelectedTimeForModal] = useState<string>('22:00');

  // Loaded Data
  const [matches, setMatches] = useState<MatchdayReportItem[]>([]);
  const [tournaments, setTournaments] = useState<{ id: string; name: string; gameSlug: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');

  // 1. Fetch Tournaments from DB
  const fetchTournaments = useCallback(async () => {
    try {
      const res = await fetch('/api/tournaments');
      const data = await res.json();
      const raw = data.tournaments || data.competitions || data.data || [];
      if (Array.isArray(raw)) {
        setTournaments((raw as TournamentApiItem[]).map((t) => ({ id: t.id, name: t.name, gameSlug: t.game_slug || 'eafc26' })));
      }
    } catch (e) {
      console.error('Error fetching tournaments:', e);
    }
  }, []);

  // 2. Fetch Matches from DB
  const fetchMatches = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = '/api/matches';
      const params = new URLSearchParams();
      if (selectedGameSlug !== 'TODOS') params.append('gameSlug', selectedGameSlug);
      if (selectedTournName !== 'TODAS') params.append('tournamentName', selectedTournName);
      if (statusFilter !== 'TODOS') params.append('status', statusFilter);
      if (clubSearch) params.append('search', clubSearch);

      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.success && Array.isArray(data.matches)) {
        const mapped: MatchdayReportItem[] = (data.matches as MatchApiItem[]).map((m, idx) => {
          const dateObj = m.scheduled_at ? new Date(m.scheduled_at) : new Date();
          const yyyy = dateObj.getFullYear();
          const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
          const dd = String(dateObj.getDate()).padStart(2, '0');
          const dateStr = `${yyyy}-${mm}-${dd}`;

          let timeStr = '22:00';
          if (m.scheduled_time && typeof m.scheduled_time === 'string' && m.scheduled_time.match(/^\d{1,2}:\d{2}/)) {
            timeStr = m.scheduled_time.slice(0, 5);
          } else if (m.transmission_time && typeof m.transmission_time === 'string' && m.transmission_time.match(/^\d{1,2}:\d{2}/)) {
            timeStr = m.transmission_time.slice(0, 5);
          }

          const resolvedGameSlug = m.game_slug || 'eafc26';
          const gameObj = GAMES_CATALOG[resolvedGameSlug] || GAMES_CATALOG['eafc26'];

          return {
            id: m.id || `M-${idx + 1}`,
            gameSlug: resolvedGameSlug,
            gameName: gameObj?.name || 'eSports',
            tournamentId: m.competition_id || 'tourn-1',
            tournamentName: m.tournament_name || 'Competencia BD',
            organizationName: m.organization_name || 'Organización Oficial BD',
            homeTeam: m.home_team_name || 'Equipo Local',
            homeTag: m.home_team_tag || (m.home_team_name ? m.home_team_name.slice(0, 3).toUpperCase() : 'LOC'),
            awayTeam: m.away_team_name || 'Equipo Visitante',
            awayTag: m.away_team_tag || (m.away_team_name ? m.away_team_name.slice(0, 3).toUpperCase() : 'VIS'),
            homeScore: m.score_home !== undefined && m.score_home !== null ? Number(m.score_home) : null,
            awayScore: m.score_away !== undefined && m.score_away !== null ? Number(m.score_away) : null,
            status: m.status === 'POR_REVISAR' ? 'POR_REVISAR' : m.status === 'FINALIZADO' ? 'FINALIZADO' : m.status === 'EN_VIVO' ? 'EN_VIVO' : 'PROGRAMADO',
            matchDate: dateStr,
            transmissionTime: timeStr,
            groupJornada: m.round_name || `JORNADA ${m.matchday || m.matchday_number || 1}`,
            proofUrl: m.proof_url || null,
          };
        });
        setMatches(mapped);
      } else {
        setMatches([]);
      }
    } catch (e) {
      console.error('Error fetching matches:', e);
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedGameSlug, selectedTournName, statusFilter, clubSearch]);

  useEffect(() => {
    // Synchronize filters with the tournament API when the management view mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTournaments();
  }, [fetchTournaments]);

  useEffect(() => {
    // Each filter change intentionally refreshes the server-backed match list.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMatches();
  }, [selectedGameSlug, selectedTournName, statusFilter, clubSearch, fetchMatches]);

  // Handle Game Selection
  const handleGameSelect = (gSlug: string) => {
    setSelectedGameSlug(gSlug);
    setSelectedTournName('TODAS');
  };

  // Filtered Tournaments based on active game
  const availableTournaments = useMemo(() => {
    const map = new Map<string, string>();
    tournaments.forEach((t) => {
      if (selectedGameSlug === 'TODOS' || t.gameSlug === selectedGameSlug) {
        map.set(t.name.toUpperCase(), t.name);
      }
    });
    matches.forEach((m) => {
      if (selectedGameSlug === 'TODOS' || m.gameSlug === selectedGameSlug) {
        if (m.tournamentName) map.set(m.tournamentName.toUpperCase(), m.tournamentName);
      }
    });
    return Array.from(map.values());
  }, [tournaments, matches, selectedGameSlug]);

  // Derived available games based on fetched tournaments and matches
  const availableGameSlugs = useMemo(() => {
    const slugs = new Set<string>();
    tournaments.forEach(t => {
      if (t.gameSlug) slugs.add(t.gameSlug);
    });
    matches.forEach(m => {
      if (m.gameSlug) slugs.add(m.gameSlug);
    });
    return Array.from(slugs);
  }, [tournaments, matches]);

  // Format Day / Date Label: e.g. "Martes 11/08"
  const formatDayDate = (dateStr: string) => {
    if (!dateStr || dateStr.length < 10) return 'Martes 11/08';
    const parts = dateStr.slice(0, 10).split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, month, day);
      const daysFull = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const dayName = daysFull[dateObj.getDay()] || 'Martes';
      const dayDD = String(day).padStart(2, '0');
      const monthMM = String(month + 1).padStart(2, '0');
      return `${dayName} ${dayDD}/${monthMM}`;
    }
    return 'Martes 11/08';
  };

  // Regional Times Calculator (Chile Base)
  const getRegionalTimes = (timeStr: string) => {
    const [h, m] = (timeStr || '22:00').split(':').map(Number);
    const baseMinutes = (isNaN(h) ? 22 : h) * 60 + (isNaN(m) ? 0 : m);

    const calc = (offsetMinutes: number) => {
      const total = (baseMinutes + offsetMinutes + 1440) % 1440;
      const hh = String(Math.floor(total / 60)).padStart(2, '0');
      const mm = String(total % 60).padStart(2, '0');
      return `${hh}:${mm}`;
    };

    return [
      { country: 'Chile', flag: '🇨🇱', code: 'CL', zone: 'CLT (UTC-4)', time: calc(0), note: 'Hora Oficial Sede' },
      { country: 'Argentina', flag: '🇦🇷', code: 'AR', zone: 'ART (UTC-3)', time: calc(60), note: '+1 hrs' },
      { country: 'Uruguay', flag: '🇺🇾', code: 'UY', zone: 'UYT (UTC-3)', time: calc(60), note: '+1 hrs' },
      { country: 'Bolivia', flag: '🇧🇴', code: 'BO', zone: 'BOT (UTC-4)', time: calc(0), note: 'Misma hora' },
      { country: 'Paraguay', flag: '🇵🇾', code: 'PY', zone: 'PYT (UTC-4)', time: calc(0), note: 'Misma hora' },
      { country: 'Perú', flag: '🇵🇪', code: 'PE', zone: 'PET (UTC-5)', time: calc(-60), note: '-1 hrs' },
      { country: 'Colombia', flag: '🇨🇴', code: 'CO', zone: 'COT (UTC-5)', time: calc(-60), note: '-1 hrs' },
      { country: 'Ecuador', flag: '🇪🇨', code: 'EC', zone: 'ECT (UTC-5)', time: calc(-60), note: '-1 hrs' },
      { country: 'México', flag: '🇲🇽', code: 'MX', zone: 'CST (UTC-6)', time: calc(-120), note: '-2 hrs' },
    ];
  };

  // Organizer approval handler (Visto Bueno)
  const handleApproveMatch = async (matchId: string, scoreHome: number, scoreAway: number) => {
    try {
      const res = await fetch('/api/matches/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          action: 'APPROVE',
          scoreHome,
          scoreAway,
        }),
      });

      if (res.ok) {
        setActionSuccessMsg('¡Visto Bueno otorgado! Resultado confirmado y cerrado.');
        fetchMatches();
        setTimeout(() => setActionSuccessMsg(''), 4000);
      }
    } catch (e) {
      console.error('Error otorgando visto bueno:', e);
    }
  };

  return (
    <ManagementPage className="font-sans">
      
      {/* ── 1. PAGE HEADER ────────────────────────────────────────────────── */}
      <ManagementHero
        eyebrow="Gestión global · Encuentros y fichas"
        title="Reportar encuentros y matchday"
        description="Módulo oficial de reporte de fichas de juego, envío de comprobantes y validación de visto bueno para organizadores y capitanes."
        icon={FileCheck}
        tone="crimson"
        badge={`${matches.length} encuentros`}
      />

      <ManagementMetrics>
        <MetricCard label="Encuentros" value={matches.length} hint="Resultados filtrados" icon={Trophy} tone="violet" />
        <MetricCard label="Programados" value={matches.filter((match) => match.status === 'PROGRAMADO').length} hint="Pendientes de disputa" icon={Gamepad2} tone="gold" />
        <MetricCard label="Por revisar" value={matches.filter((match) => match.status === 'POR_REVISAR').length} hint="Esperan visto bueno" icon={FileCheck} tone="crimson" />
        <MetricCard label="Finalizados" value={matches.filter((match) => match.status === 'FINALIZADO').length} hint="Resultados confirmados" icon={CheckCircle2} tone="emerald" />
      </ManagementMetrics>

      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 animate-in fade-in shadow-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* ── 2. CONTROLES Y FILTROS SOBRE LA TABLA (JUEGO, COMPETENCIA, BUSCADOR CLUB) ── */}
      <div className="management-toolbar !block space-y-4 font-mono">
        
        {/* Fila 1: Buscador por Nombre del Club & Restablecer */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--accent-cyan)]" />
            <Input
              type="text"
              placeholder="Buscar por nombre del club (ej: Quantum, Obsidian, SQUAD)..."
              value={clubSearch}
              onChange={(e) => setClubSearch(e.target.value)}
              className="pl-10 h-10 rounded-2xl input-theme text-xs font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedGameSlug('TODOS');
                setSelectedTournName('TODAS');
                setClubSearch('');
                setStatusFilter('TODOS');
              }}
              className="text-xs font-mono gap-1.5 border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Restablecer Filtros
            </Button>
          </div>
        </div>

        {/* Fila 2: Selector de Juego / Disciplina eSports */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
            <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
            <span>DISCIPLINA / JUEGO ESPORTS:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleGameSelect('TODOS')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                selectedGameSlug === 'TODOS'
                  ? 'bg-purple-950 border-purple-500 text-purple-300 shadow-md ring-1 ring-purple-500/50 font-black'
                  : 'bg-[var(--bg-card)] border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
              }`}
            >
              🎮 TODOS LOS JUEGOS
            </button>

            {Object.values(GAMES_CATALOG).filter(g => availableGameSlugs.includes(g.slug)).map((g) => {
              const isActive = selectedGameSlug === g.slug;
              return (
                <button
                  key={g.slug}
                  onClick={() => handleGameSelect(g.slug)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[var(--bg-main)] border-[var(--border-card-hover)] shadow-md ring-1 font-black'
                      : 'bg-[var(--bg-card)] border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: `color-mix(in srgb, ${g.brandColor} 20%, transparent)`,
                          borderColor: g.brandColor,
                          color: g.brandColor,
                        }
                      : undefined
                  }
                >
                  <span>{g.icon}</span>
                  <span>{g.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fila 3: Selector de Competencia / Torneo */}
        <div className="space-y-2 pt-1 border-t border-[var(--border-card)]">
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>COMPETENCIA / TORNEO:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedTournName('TODAS')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                selectedTournName === 'TODAS'
                  ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-md font-black'
                  : 'bg-[var(--bg-card)] border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
              }`}
            >
              🏆 TODAS LAS COMPETENCIAS
            </button>

            {availableTournaments.map((tName) => {
              const isActive = selectedTournName.toUpperCase() === tName.toUpperCase();
              return (
                <button
                  key={tName}
                  onClick={() => setSelectedTournName(tName)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    isActive
                      ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-md font-black'
                      : 'bg-[var(--bg-card)] border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  {tName}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 3. TABLA DE PARTIDOS A REPORTAR (FORMATO TABLE UI ADAPTATIVO A TEMAS) ────── */}
      <div className="table-container-theme font-mono">
        <table className="ui-table ui-data-table-responsive min-w-[840px]">
          <thead>
            <tr>
              <th className="p-4 w-44">
                <div className="flex items-center gap-1.5">
                  <span>Día / Hora</span>
                  <button
                    onClick={() => {
                      setSelectedTimeForModal('22:00');
                      setIsTimezoneModalOpen(true);
                    }}
                    className="text-[var(--accent-cyan)] hover:opacity-80 transition-colors"
                    title="Ver horarios LATAM (ℹ️)"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>
              </th>
              <th className="p-4 w-32">Disciplina</th>
              <th className="p-4 text-center">Enfrentamiento (Club Local vs Visitante)</th>
              <th className="p-4 text-center w-36">Competencia</th>
              <th className="p-4 text-center w-32">Estado</th>
              <th className="p-4 text-right w-48">Acción / Reporte</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-card)] text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-[var(--text-muted)]">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-cyan)] mb-2" />
                  <p className="font-mono text-xs">Cargando encuentros de la Base de Datos...</p>
                </td>
              </tr>
            ) : matches.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-[var(--text-muted)]">
                  <Building2 className="w-10 h-10 mx-auto text-[var(--text-muted)] opacity-60 mb-3" />
                  <h4 className="text-sm font-bold text-[var(--text-heading)] mb-1">Sin encuentros registrados</h4>
                  <p className="text-xs text-[var(--text-muted)]">
                    No existen partidos que coincidan con la disciplina, competencia o club buscado.
                  </p>
                </td>
              </tr>
            ) : (
              matches.map((m) => {
                const gameConfig = GAMES_CATALOG[m.gameSlug] || GAMES_CATALOG['eafc26'];
                const isUserTeamInMatch = !!currentUser?.teamName && (
                  m.homeTeam.toLowerCase() === currentUser.teamName.toLowerCase() ||
                  m.awayTeam.toLowerCase() === currentUser.teamName.toLowerCase()
                );
                const canReport = isAdminOrOrganizer || (isCaptainOrCoach && isUserTeamInMatch);

                return (
                  <tr key={m.id} className="hover:bg-[var(--bg-card-hover)] transition-colors group">
                    
                    {/* 1. DÍA / HORA LIMPIOS + BANDERA REAL Y INFO */}
                    <td data-label="Día / Hora" className="p-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs font-black tracking-tight" style={{ color: gameConfig.brandColor }}>
                          {formatDayDate(m.matchDate)}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-black text-amber-400">
                            {m.transmissionTime}
                          </span>
                          <CountryFlag code="cl" name="Chile" size="sm" />
                          <button
                            onClick={() => {
                              setSelectedTimeForModal(m.transmissionTime);
                              setIsTimezoneModalOpen(true);
                            }}
                            className="transition-colors ml-0.5"
                            style={{ color: gameConfig.brandColor }}
                            title="Ver horario por país LATAM (ℹ️)"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* 2. DISCIPLINA ESPORTS */}
                    <td data-label="Disciplina" className="p-4 whitespace-nowrap">
                      <Badge
                        variant="cyan"
                        className="text-[10px] font-bold py-1 px-2.5 flex items-center gap-1.5 shadow-sm"
                        style={{ backgroundColor: `${gameConfig.brandColor}25`, borderColor: gameConfig.brandColor, color: gameConfig.brandColor }}
                      >
                        <span>{gameConfig.icon}</span>
                        <span>{gameConfig.name}</span>
                      </Badge>
                    </td>

                    {/* 3. ENFRENTAMIENTO CENTRAL */}
                    <td data-label="Enfrentamiento" className="p-4">
                      <div className="flex items-center justify-center gap-3 w-full">
                        {/* Club Local */}
                        <div className="flex items-center gap-2 flex-1 justify-end text-right">
                          <span className="font-extrabold text-xs sm:text-sm text-[var(--text-heading)] transition-colors truncate max-w-[160px]">
                            {m.homeTeam}
                          </span>
                          <Avatar fallback={m.homeTag} size="sm" className="ring-1 ring-[var(--border-card)] shrink-0" />
                        </div>

                        {/* Marcador Central */}
                        <div className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] flex items-center justify-center min-w-[64px] shrink-0 shadow-inner">
                          <span className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                            {m.homeScore !== null ? m.homeScore : '-'}
                          </span>
                          <span className="px-1.5 font-black text-xs" style={{ color: gameConfig.brandColor }}>VS</span>
                          <span className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                            {m.awayScore !== null ? m.awayScore : '-'}
                          </span>
                        </div>

                        {/* Club Visitante */}
                        <div className="flex items-center gap-2 flex-1 justify-start text-left">
                          <Avatar fallback={m.awayTag} size="sm" className="ring-1 ring-[var(--border-card)] shrink-0" />
                          <span className="font-extrabold text-xs sm:text-sm text-[var(--text-heading)] transition-colors truncate max-w-[160px]">
                            {m.awayTeam}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 4. COMPETENCIA & JORNADA */}
                    <td data-label="Competencia" className="p-4 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-extrabold text-[var(--text-heading)] truncate max-w-[140px]">
                          {m.tournamentName}
                        </span>
                        <Badge variant="violet" className="text-[9px] font-bold border border-[var(--border-card)] text-[var(--text-secondary)] py-0.5 px-2">
                          {m.groupJornada}
                        </Badge>
                      </div>
                    </td>

                    {/* 5. ESTADO */}
                    <td data-label="Estado" className="p-4 text-center whitespace-nowrap">
                      {m.status === 'POR_REVISAR' ? (
                        <Badge variant="rose" className="animate-pulse text-[10px] font-bold py-1 px-2.5">
                          ⏳ POR REVISAR
                        </Badge>
                      ) : m.status === 'FINALIZADO' ? (
                        <Badge variant="emerald" className="text-[10px] font-bold py-1 px-2.5">
                          ✓ FINALIZADO
                        </Badge>
                      ) : m.status === 'EN_VIVO' ? (
                        <Badge variant="cyan" className="animate-pulse text-[10px] font-bold py-1 px-2.5">
                          ● EN VIVO
                        </Badge>
                      ) : (
                        <Badge variant="gold" className="text-[10px] font-bold py-1 px-2.5">
                          PROGRAMADO
                        </Badge>
                      )}
                    </td>

                    {/* 6. ACCIONES (Reportar Ficha vs Visto Bueno vs Analizar) */}
                    <td data-label="Acciones" className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {m.status === 'POR_REVISAR' && isAdminOrOrganizer ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApproveMatch(m.id, m.homeScore || 0, m.awayScore || 0)}
                            className="text-xs font-mono font-bold py-1 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow"
                          >
                            <FileCheck className="w-3.5 h-3.5 mr-1" />
                            <span>VISTO BUENO</span>
                          </Button>
                        ) : canReport ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setSelectedMatchForReport(m);
                              setIsReportModalOpen(true);
                            }}
                            className="text-xs font-mono font-bold py-1 px-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow"
                          >
                            <Shield className="w-3.5 h-3.5 mr-1" />
                            <span>REPORTAR FICHA</span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs font-mono font-bold py-1 px-3 border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40"
                          >
                            <BarChart2 className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                            <span>ANALIZAR</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Reporte de Partido */}
      {selectedMatchForReport && (
        <MatchReportModal
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false);
            setSelectedMatchForReport(null);
            fetchMatches();
          }}
          match={{
            id: selectedMatchForReport.id,
            homeTeam: selectedMatchForReport.homeTeam,
            awayTeam: selectedMatchForReport.awayTeam,
            gameSlug: selectedMatchForReport.gameSlug,
            tournamentName: selectedMatchForReport.tournamentName,
          }}
        />
      )}

      {/* Modal de Equivalencia de Horarios por Región con Banderas de Países LATAM */}
      {isTimezoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-950 border border-purple-500/40 rounded-3xl p-6 shadow-2xl space-y-5 font-mono">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Horarios por País LATAM ({selectedTimeForModal} Chile)
                </h3>
              </div>
              <button
                onClick={() => setIsTimezoneModalOpen(false)}
                className="p-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Equivalencias horarias del partido para competidores de Latinoamérica basadas en la hora oficial de Chile:
            </p>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {getRegionalTimes(selectedTimeForModal).map((item) => (
                <div
                  key={item.country}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/90 border border-white/10 text-xs hover:border-cyan-500/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CountryFlag code={item.code} name={item.country} size="md" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-white">{item.country}</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-300 font-mono font-bold">
                          {item.code}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{item.zone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-black text-amber-400 text-sm font-mono">{item.time} hrs</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-bold">
                      {item.note}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-1 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTimezoneModalOpen(false)}
                className="w-full text-xs font-mono font-bold"
              >
                Cerrar Ventana
              </Button>
            </div>
          </div>
        </div>
      )}
    </ManagementPage>
  );
}
