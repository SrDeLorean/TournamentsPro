'use client';

import React, { useState, useEffect, useMemo, useCallback, useDeferredValue } from 'react';
import { Button } from '@/components/ui/button';
import { FilterBar } from '@/components/ui/filter-bar';
import { CountryFlag } from '@/components/ui/country-flag';
import { useAuth } from '@/components/providers/auth-provider';
import { GAMES_CATALOG } from '@/lib/games-data';
import { MatchReportModal } from '@/components/matches/match-report-modal';
import { MatchdayMatchCard, type MatchdayReportItem } from '@/components/matches/matchday-match-card';
import { Modal } from '@/components/ui/modal';
import {
  Trophy,
  Gamepad2,
  RefreshCw,
  Building2,
  CheckCircle2,
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

export type { MatchdayReportItem } from '@/components/matches/matchday-match-card';

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
  const deferredClubSearch = useDeferredValue(clubSearch.trim());

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
      if (deferredClubSearch) params.append('search', deferredClubSearch);

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
  }, [selectedGameSlug, selectedTournName, statusFilter, deferredClubSearch]);

  useEffect(() => {
    // Synchronize filters with the tournament API when the management view mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTournaments();
  }, [fetchTournaments]);

  useEffect(() => {
    // Each filter change intentionally refreshes the server-backed match list.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMatches();
  }, [fetchMatches]);

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

  const gameFilterOptions = useMemo(() => [
    { id: 'TODOS', label: 'Todas las disciplinas' },
    ...Object.values(GAMES_CATALOG)
      .filter((game) => availableGameSlugs.includes(game.slug))
      .map((game) => ({ id: game.slug, label: game.name })),
  ], [availableGameSlugs]);

  const hasActiveFilters = selectedGameSlug !== 'TODOS' || selectedTournName !== 'TODAS' || statusFilter !== 'TODOS' || clubSearch.length > 0;

  const resetFilters = () => {
    setSelectedGameSlug('TODOS');
    setSelectedTournName('TODAS');
    setClubSearch('');
    setStatusFilter('TODOS');
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
    <ManagementPage className="font-[family-name:var(--font-active)]">
      
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
        <div className="p-4 rounded-2xl bg-[var(--app-positive-soft)]/90 border border-[var(--app-positive)]/50 text-[var(--app-positive)] text-xs font-[family-name:var(--font-active)] font-bold flex items-center gap-2 animate-in fade-in shadow-xl">
          <CheckCircle2 className="w-5 h-5 text-[var(--app-positive)] shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Unified search and filters */}
      <FilterBar
        searchPlaceholder="Buscar por club, tag o competencia..."
        searchValue={clubSearch}
        onSearchChange={setClubSearch}
        options={gameFilterOptions}
        activeFilter={selectedGameSlug}
        onFilterChange={handleGameSelect}
        renderAsSelect
        brandColor="var(--app-danger)"
        count={matches.length}
        countLabel="ENCUENTROS"
        searchHint="CLUB"
      >
        <div className="matchday-filter-extras">
          <label className="matchday-filter-select">
            <span>Competencia</span>
            <select value={selectedTournName} onChange={(event) => setSelectedTournName(event.target.value)} aria-label="Filtrar por competencia">
              <option value="TODAS">Todas las competencias</option>
              {availableTournaments.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <label className="matchday-filter-select">
            <span>Estado</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrar por estado">
              <option value="TODOS">Todos los estados</option>
              <option value="PROGRAMADO">Programados</option>
              <option value="EN_VIVO">En vivo</option>
              <option value="POR_REVISAR">Por revisar</option>
              <option value="FINALIZADO">Finalizados</option>
            </select>
          </label>
          <Button variant="outline" size="sm" onClick={resetFilters} disabled={!hasActiveFilters} className="matchday-filter-reset">
            <RefreshCw className="size-3.5" /> <span>Restablecer</span>
          </Button>
        </div>
      </FilterBar>

      {/* Reusable encounter cards */}
      <section className="matchday-results" aria-labelledby="matchday-results-title">
        <div className="matchday-results-heading">
          <div>
            <span>Operación de encuentros</span>
            <h2 id="matchday-results-title">Partidos encontrados</h2>
          </div>
          <button type="button" onClick={() => { setSelectedTimeForModal('22:00'); setIsTimezoneModalOpen(true); }}>
            <Globe2 className="size-4" /> Horarios LATAM
          </button>
        </div>

        {isLoading ? (
          <div className="matchday-match-grid" aria-label="Cargando encuentros">
            {[0, 1, 2, 3].map((item) => <div key={item} className="matchday-match-skeleton" />)}
          </div>
        ) : matches.length === 0 ? (
          <div className="matchday-empty-state">
            <Building2 className="size-10" />
            <h3>Sin encuentros registrados</h3>
            <p>No existen partidos que coincidan con la disciplina, competencia, estado o club buscado.</p>
            {hasActiveFilters ? <Button variant="outline" size="sm" onClick={resetFilters}><RefreshCw className="size-3.5" /> Limpiar filtros</Button> : null}
          </div>
        ) : (
          <div className="matchday-match-grid">
            {matches.map((match) => {
              const game = GAMES_CATALOG[match.gameSlug] || GAMES_CATALOG.eafc26;
              const belongsToUserTeam = Boolean(currentUser?.teamName) && (
                match.homeTeam.toLowerCase() === currentUser?.teamName?.toLowerCase() ||
                match.awayTeam.toLowerCase() === currentUser?.teamName?.toLowerCase()
              );
              const canReport = isAdminOrOrganizer || (isCaptainOrCoach && belongsToUserTeam);

              return (
                <MatchdayMatchCard
                  key={match.id}
                  match={match}
                  game={game}
                  canReport={canReport}
                  canApprove={isAdminOrOrganizer}
                  onOpenTimezone={(time) => { setSelectedTimeForModal(time); setIsTimezoneModalOpen(true); }}
                  onReport={(selectedMatch) => { setSelectedMatchForReport(selectedMatch); setIsReportModalOpen(true); }}
                  onApprove={(selectedMatch) => handleApproveMatch(selectedMatch.id, selectedMatch.homeScore || 0, selectedMatch.awayScore || 0)}
                />
              );
            })}
          </div>
        )}
      </section>

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
        <Modal isOpen onClose={() => setIsTimezoneModalOpen(false)} ariaLabel="Horarios por país" size="sm" showCloseButton={false} className="bg-[var(--app-canvas)] border-[var(--app-accent-2)]/40 p-6 space-y-5 font-[family-name:var(--font-active)]">
            
            <div className="flex items-center justify-between border-b border-[var(--text-heading)]/10 pb-3">
              <div className="flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-[var(--app-accent)]" />
                <h3 className="text-sm font-black text-[var(--text-heading)] uppercase tracking-wider">
                  Horarios por País LATAM ({selectedTimeForModal} Chile)
                </h3>
              </div>
              <button
                onClick={() => setIsTimezoneModalOpen(false)}
                className="p-1 rounded-lg bg-[var(--app-surface-2)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-heading)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Equivalencias horarias del partido para competidores de Latinoamérica basadas en la hora oficial de Chile:
            </p>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {getRegionalTimes(selectedTimeForModal).map((item) => (
                <div
                  key={item.country}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-[var(--app-surface-2)]/90 border border-[var(--text-heading)]/10 text-xs hover:border-[var(--app-accent)]/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CountryFlag code={item.code} name={item.country} size="md" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-[var(--text-heading)]">{item.country}</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-[var(--app-surface-2)] text-[var(--text-secondary)] font-[family-name:var(--font-active)] font-bold">
                          {item.code}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)]">{item.zone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-black text-[var(--app-warning)] text-sm font-[family-name:var(--font-active)]">{item.time} hrs</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--app-accent-soft)]/80 text-[var(--app-accent)] border border-[var(--app-accent)]/30 font-bold">
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
                className="w-full text-xs font-[family-name:var(--font-active)] font-bold"
              >
                Cerrar Ventana
              </Button>
            </div>
        </Modal>
      )}
    </ManagementPage>
  );
}
