'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import {
  Trophy,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Shield,
  Check,
  FileCheck,
  ImageIcon,
  Gamepad2,
  Building2,
  MapPin,
  Swords,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { GAMES_CATALOG } from '@/lib/games-data';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { shouldBypassImageOptimization } from '@/lib/image-utils';
import {
  ManagementPage,
  ManagementMetrics,
  ManagementTabs,
  MetricCard,
  type ManagementTab,
} from '@/components/dashboard/management-ui';

// Catalog of Game Modes (Modalidades de Juego) per eSports Game
export const GAME_MODES: Record<string, { id: string; name: string; format: string; description: string }[]> = {
  eafc26: [
    { id: '11v11', name: 'Clubes Pro 11v11', format: '11 VS 11', description: 'Formato plantilla completa con posiciones fijas eSports' },
    { id: '1v1', name: 'Ultimate Team 1v1', format: '1 VS 1', description: 'Formato individual competitivo de cara a cara' },
    { id: '2v2', name: 'Parejas Co-Op 2v2', format: '2 VS 2', description: 'Formato de duos en línea' },
  ],
  valorant: [
    { id: '5v5_comp', name: 'Competitivo 5v5', format: '5 VS 5', description: 'Modo de torneo estándar al mejor de 24 rondas con prórroga' },
    { id: '5v5_swift', name: 'Swiftplay 5v5', format: '5 VS 5', description: 'Modo rápido al mejor de 9 rondas' },
    { id: 'spikerush', name: 'Spike Rush 5v5', format: '5 VS 5', description: 'Modo dinámico de ritmo acelerado' },
  ],
  csgo: [
    { id: '5v5_match', name: 'Competitivo 5v5', format: '5 VS 5', description: 'Matchmaking MR12 estándar competitivo oficial CS2' },
    { id: '2v2_wingman', name: 'Wingman 2v2', format: '2 VS 2', description: 'Modo compañero en bombsite único' },
  ],
  lol: [
    { id: '5v5_rift', name: 'Grieta del Invocador 5v5', format: '5 VS 5', description: 'Modo competitivo en el mapa principal 5v5' },
    { id: '5v5_aram', name: 'ARAM 5v5', format: '5 VS 5', description: 'Abismo de los Lamentables selección aleatoria' },
  ],
  rocketleague: [
    { id: '3v3_std', name: 'Estándar 3v3', format: '3 VS 3', description: 'Modo de torneo oficial principal Rocket League' },
    { id: '2v2_duo', name: 'Duos 2v2', format: '2 VS 2', description: 'Parejas competitivas en arena' },
    { id: '1v1_solo', name: 'Individual 1v1', format: '1 VS 1', description: 'Duelo individual técnico de control de balón' },
  ],
};

interface OrganizationUser {
  id: string;
  name: string;
  gamertag?: string;
  avatar_url?: string;
  foto?: string;
}

interface OrganizerOrganization {
  id: string;
  name: string;
  tag: string;
  banner_url?: string;
  logo_url?: string;
  country?: string;
  founded_year?: string | number;
  rating?: string | number;
  organizers?: OrganizationUser[];
}

interface OrganizerTournament {
  id: string;
  name: string;
  game_slug?: string;
  primary_game_slug?: string;
  status?: string;
}

interface OrganizerMatch {
  id: string;
  matchday?: number;
  home_team_name: string;
  away_team_name: string;
  reported_score_home?: number | null;
  reported_score_away?: number | null;
  proof_url?: string | null;
  match_date?: string;
  score_home?: number | null;
  score_away?: number | null;
  status: string;
}

interface EnrolledTeam {
  id: string;
  name: string;
  tag: string;
  game_slug?: string;
  captain_name?: string;
  status?: string;
}

type OrganizerTab = 'approvals' | 'fixture' | 'enrolled' | 'seasons';

export function OrganizerDashboardView() {
  const { currentUser, activeGameSlug, setActiveGameSlug } = useAuth();
  const [activeTab, setActiveTab] = useState<OrganizerTab>('approvals');

  // Selected Game State for Organizer (Synced with global activeGameSlug)
  const selectedGameSlug = activeGameSlug || 'eafc26';
  const setSelectedGameSlug = (slug: string) => {
    setActiveGameSlug(slug);
    setSelectedGameModeId((GAME_MODES[slug] || GAME_MODES.eafc26)[0].id);
  };
  const activeGame = GAMES_CATALOG[selectedGameSlug] || GAMES_CATALOG['eafc26'];

  // Selected Game Mode State (Modalidad de Juego)
  const availableGameModes = GAME_MODES[selectedGameSlug] || GAME_MODES['eafc26'];
  const [selectedGameModeId, setSelectedGameModeId] = useState<string>(availableGameModes[0].id);

  const activeGameMode = availableGameModes.find((m) => m.id === selectedGameModeId) || availableGameModes[0];

  // Organization & Seasons State
  const [userOrg, setUserOrg] = useState<OrganizerOrganization | null>(null);
  const [, setSeasons] = useState<unknown[]>([]);
  const [tournaments, setTournaments] = useState<OrganizerTournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('tourn-eafc-liga');

  // Fixture & Matches State
  const [matches, setMatches] = useState<OrganizerMatch[]>([]);
  const [enrolledTeams, setEnrolledTeams] = useState<EnrolledTeam[]>([]);
  const [isGeneratingFixture, setIsGeneratingFixture] = useState<boolean>(false);

  // Approval Modal State
  const [selectedMatchForApproval, setSelectedMatchForApproval] = useState<OrganizerMatch | null>(null);
  const [actionMsg, setActionMsg] = useState<string>('');

  const fetchSeasonsAndTournaments = useCallback(async () => {
    try {
      const res = await fetch('/api/organizer/seasons');
      const data = await res.json();
      if (data.success) {
        setSeasons(data.seasons);
        setTournaments(data.tournaments);
        if (data.tournaments?.length > 0 && !selectedTournamentId) {
          setSelectedTournamentId(data.tournaments[0].id);
        }
      }
    } catch (e) {
      console.error('Error cargando temporadas:', e);
    }
  }, [selectedTournamentId]);

  const fetchUserOrganization = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/organizations');
      const data = await res.json();
      if (data.success && Array.isArray(data.organizations)) {
        const found = (data.organizations as OrganizerOrganization[]).find(
          (o) => o.id === currentUser?.organizationId || o.organizers?.some((orgUser) => orgUser.id === currentUser?.id)
        ) || data.organizations[0];
        setUserOrg(found);
      }
    } catch (e) {
      console.error('Error cargando organización del usuario:', e);
    }
  }, [currentUser?.id, currentUser?.organizationId]);

  const fetchFixtureData = useCallback(async () => {
    if (!selectedTournamentId) return;
    try {
      const res = await fetch(`/api/organizer/fixture?tournamentId=${selectedTournamentId}`);
      const data = await res.json();
      if (data.success) {
        setMatches(data.matches);
        setEnrolledTeams(data.enrolledTeams);
      }
    } catch (e) {
      console.error('Error cargando fixture:', e);
    }
  }, [selectedTournamentId]);

  useEffect(() => {
    void Promise.resolve().then(() => Promise.all([
      fetchSeasonsAndTournaments(),
      fetchUserOrganization(),
    ]));
  }, [fetchSeasonsAndTournaments, fetchUserOrganization]);

  useEffect(() => {
    void Promise.resolve().then(fetchFixtureData);
  }, [fetchFixtureData]);

  // Filtered Tournaments and Teams by Selected Game & Mode
  const filteredTournaments = tournaments.filter(
    (t) => t.game_slug === selectedGameSlug || t.primary_game_slug === selectedGameSlug || !t.game_slug
  );
  const filteredEnrolledTeams = enrolledTeams.filter(
    (t) => t.game_slug === selectedGameSlug || !t.game_slug
  );

  // Generate Fixture with Simultaneous Matchday Hours
  const handleGenerateFixture = async () => {
    if (!selectedTournamentId) return;
    setIsGeneratingFixture(true);
    try {
      const res = await fetch('/api/organizer/fixture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: selectedTournamentId,
          format: 'LIGA_ROUND_ROBIN',
          simultaneousHours: '20:00:00',
          modeId: selectedGameModeId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionMsg(`¡Fixture de ${activeGame.name} (${activeGameMode.name}) generado exitosamente!`);
        fetchFixtureData();
        setTimeout(() => setActionMsg(''), 4000);
      }
    } catch (e) {
      console.error('Error generando fixture:', e);
    } finally {
      setIsGeneratingFixture(false);
    }
  };

  // Grant Approval (Visto Bueno)
  const handleConfirmApproval = async () => {
    if (!selectedMatchForApproval) return;
    try {
      const res = await fetch('/api/matches/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: selectedMatchForApproval.id,
          action: 'APPROVE',
          scoreHome: selectedMatchForApproval.reported_score_home || 0,
          scoreAway: selectedMatchForApproval.reported_score_away || 0,
        }),
      });

      if (res.ok) {
        setActionMsg('¡Visto bueno otorgado! El resultado fue homologado a TERMINADO y la tabla actualizada.');
        setSelectedMatchForApproval(null);
        fetchFixtureData();
        setTimeout(() => setActionMsg(''), 4000);
      }
    } catch (e) {
      console.error('Error aprobando partido:', e);
    }
  };

  const pendingApprovals = matches.filter((m) => m.status === 'POR_REVISAR');

  const tabs: ManagementTab<OrganizerTab>[] = [
    { id: 'approvals', label: 'Visto bueno', shortLabel: 'Revisión', count: pendingApprovals.length, icon: FileCheck, tone: 'gold' },
    { id: 'fixture', label: `Fixtures ${activeGameMode.format}`, shortLabel: 'Fixtures', count: matches.length, icon: Clock, tone: 'cyan' },
    { id: 'enrolled', label: 'Escuadras inscritas', shortLabel: 'Escuadras', count: filteredEnrolledTeams.length, icon: Shield, tone: 'emerald' },
    { id: 'seasons', label: 'Competencias', count: filteredTournaments.length, icon: Calendar, tone: 'violet' },
  ];

  return (
    <ManagementPage>
      {/* Header Banner with Organization Identity & Game / Mode Selectors */}
      <section className="overflow-hidden rounded-[var(--ui-radius-panel)] border border-[var(--border-card)] bg-[var(--bg-card)] shadow-[var(--shadow-card)]">
        {/* Banner Image */}
        {userOrg?.banner_url && (
          <div className="relative h-28 w-full overflow-hidden bg-[var(--bg-subtle)] sm:h-36">
            <Image
              src={userOrg.banner_url}
              alt={userOrg.name}
              fill
              sizes="100vw"
              unoptimized={shouldBypassImageOptimization(userOrg.banner_url)}
              className="object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-[var(--bg-card)]/40 to-transparent" />
          </div>
        )}

        <div className="space-y-5 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--accent-violet)]/40 bg-[var(--bg-subtle)] shadow-lg sm:size-16">
                {userOrg?.logo_url ? (
                  <Image
                    src={userOrg.logo_url}
                    alt={userOrg.name}
                    fill
                    sizes="64px"
                    unoptimized={shouldBypassImageOptimization(userOrg.logo_url)}
                    className="object-cover"
                  />
                ) : (
                    <Building2 className="w-8 h-8 text-[var(--accent-violet)]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black uppercase text-[var(--text-heading)] tracking-wider">
                    {userOrg ? userOrg.name : 'Panel del Organizador eSports'}
                  </h1>
                  <Badge variant="violet" className="font-mono text-[10px] uppercase">
                    {userOrg ? `[${userOrg.tag}]` : 'Organizador'}
                  </Badge>
                </div>
                {userOrg && (
                  <p className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs font-bold text-[var(--accent-violet)]">
                    <span><MapPin className="w-3 h-3 inline mr-0.5" />{userOrg.country || 'Venezuela'}</span>
                    <span>• Est. {userOrg.founded_year || '2019'}</span>
                    <span>• ★ {userOrg.rating || '4.98'} Rating</span>
                  </p>
                )}
              </div>
            </div>

            {/* Assigned Organizers List */}
            {userOrg?.organizers && userOrg.organizers.length > 0 && (
              <div className="max-w-full space-y-1 rounded-xl border border-[var(--border-card)] bg-[var(--bg-subtle)] p-3">
                <span className="block font-mono text-[10px] font-black uppercase text-[var(--text-muted)]">Equipo organizador</span>
                <div className="flex max-w-full flex-wrap items-center gap-2">
                  {userOrg.organizers.map((oUser) => (
                    <div key={oUser.id} className="flex items-center gap-1 text-[11px] font-bold text-[var(--accent-cyan)]">
                      <Avatar fallback={oUser.name} src={oUser.avatar_url || oUser.foto} size="sm" />
                      <span>@{oUser.gamertag || oUser.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* GAME SELECTOR IN ORGANIZER PANEL */}
          <div className="space-y-4 border-t border-[var(--border-card)] pt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase font-black tracking-widest text-cyan-400 block">
                ● 1. SELECCIONAR DISCIPLINA ESPORTS:
              </label>
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
                {Object.values(GAMES_CATALOG).map((g) => {
                  const isSelected = g.slug === selectedGameSlug;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGameSlug(g.slug)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border flex-shrink-0 ${
                        isSelected
                          ? 'shadow-lg text-slate-950 scale-105 font-black'
                          : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-card)] hover:border-[var(--border-card-hover)]'
                      }`}
                      style={
                        isSelected
                          ? {
                              backgroundColor: g.brandColor,
                              borderColor: g.brandColor,
                              boxShadow: `0 4px 20px color-mix(in srgb, ${g.brandColor} 50%, transparent)`,
                            }
                          : {}
                      }
                    >
                      <Gamepad2 className="w-4 h-4" />
                      <span>{g.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MODALIDAD DE JUEGO SELECTOR IN ORGANIZER PANEL */}
            <div className="space-y-2 border-t border-[var(--border-card)] pt-3">
              <label className="text-[10px] font-mono uppercase font-black tracking-widest text-purple-400 block flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5 text-purple-400" />
                ● 2. SELECCIONAR MODALIDAD DE JUEGO A GESTIONAR ({activeGame.name}):
              </label>
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
                {availableGameModes.map((mode) => {
                  const isSelected = mode.id === selectedGameModeId;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setSelectedGameModeId(mode.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border flex-shrink-0 ${
                        isSelected
                          ? 'bg-[var(--accent-violet-bg)] text-[var(--accent-violet)] border-[var(--accent-violet)]/40 shadow-sm'
                          : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-card)] hover:border-[var(--border-card-hover)]'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-[var(--accent-violet)]" />
                      <span>{mode.name}</span>
                      <span className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-[9px] text-inherit dark:bg-white/10">
                        {mode.format}
                      </span>
                    </button>
                  );
                })}
              </div>
              {activeGameMode && (
                <div className="flex flex-col gap-2 rounded-xl border border-[var(--accent-violet)]/20 bg-[var(--accent-violet-bg)] p-3 font-mono text-[11px] text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between">
                  <span>Modo Activo: <strong>{activeGameMode.name}</strong> ({activeGameMode.format}) — {activeGameMode.description}</span>
                  <Badge variant="cyan" className="font-mono text-[9px]">COMPETENCIA VIGENTE</Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <ManagementMetrics>
        <MetricCard label="Por revisar" value={pendingApprovals.length} hint="Partidos reportados" icon={FileCheck} tone="gold" />
        <MetricCard label={`Torneos ${activeGameMode.format}`} value={filteredTournaments.length} hint="Competencias activas" icon={Trophy} tone="cyan" />
        <MetricCard label={`Equipos ${activeGame.name}`} value={filteredEnrolledTeams.length} hint="Escuadras inscritas" icon={Shield} tone="emerald" />
        <MetricCard label="Modalidad activa" value={activeGameMode.name} hint={activeGameMode.format} icon={Calendar} tone="violet" />
      </ManagementMetrics>

      {actionMsg && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-[var(--accent-emerald)]/30 bg-[var(--accent-emerald-bg)] p-4 text-xs font-bold text-[var(--accent-emerald)]">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionMsg}</span>
        </div>
      )}

      <ManagementTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} label="Módulos de operación del organizador" />

      {/* TAB 1: VISTO BUENO */}
      {activeTab === 'approvals' && (
        <Card className="space-y-4 border border-[var(--border-card)] bg-[var(--bg-card)] p-3 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[var(--text-heading)]">
              <FileCheck className="w-4 h-4 text-[var(--accent-gold)]" />
              Módulo de Visto Bueno: Partidos Reportados por Capitanes
            </h3>
            <Badge variant="gold" className="w-fit font-mono text-[10px]">
              {pendingApprovals.length} En Espera de Homologación
            </Badge>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="space-y-2 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-subtle)] p-8 text-center">
              <CheckCircle2 className="mx-auto w-8 h-8 text-[var(--accent-emerald)]" />
              <p className="text-xs font-bold uppercase text-[var(--text-secondary)]">No hay partidos pendientes de visto bueno</p>
            </div>
          ) : (
            <DataTable
              columns={[
                {
                  header: 'Encuentro Reportado',
                  cell: (r) => (
                    <div>
                      <div className="text-xs font-bold text-[var(--text-heading)]">{r.home_team_name} VS {r.away_team_name}</div>
                      <div className="font-mono text-[10px] text-[var(--accent-cyan)]">Jornada #{r.matchday}</div>
                    </div>
                  ),
                },
                {
                  header: 'Marcador Enviado',
                  cell: (r) => (
                    <span className="rounded-lg border border-[var(--accent-gold)]/30 bg-[var(--accent-gold-bg)] px-3 py-1 font-mono text-sm font-black text-[var(--accent-gold)]">
                      {r.reported_score_home} - {r.reported_score_away}
                    </span>
                  ),
                },
                {
                  header: 'Comprobante',
                  cell: (r) =>
                    r.proof_url ? (
                      <a href={r.proof_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-bold text-[var(--accent-cyan)] hover:underline">
                        <ImageIcon className="w-3.5 h-3.5" /> Captura WebP
                      </a>
                    ) : (
                      <span className="text-[10px] text-[var(--text-muted)]">Sin imagen</span>
                    ),
                },
                {
                  header: 'Estado',
                  cell: () => <Badge variant="gold">Por revisar</Badge>,
                },
              ]}
              data={pendingApprovals}
              searchPlaceholder="Buscar por equipo..."
              brandColor="#F59E0B"
              actions={(row) => (
                <Button
                  size="sm"
                  onClick={() => setSelectedMatchForApproval(row)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Dar Visto Bueno
                </Button>
              )}
            />
          )}
        </Card>
      )}

      {/* TAB 2: FIXTURES */}
      {activeTab === 'fixture' && (
        <Card className="space-y-4 border border-[var(--border-card)] bg-[var(--bg-card)] p-3 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[var(--text-heading)]">
                <Clock className="w-4 h-4 text-[var(--accent-cyan)]" />
                Generación de Fixtures simultáneos ({activeGame.name} • {activeGameMode.name})
              </h3>
            </div>

            <Button
              onClick={handleGenerateFixture}
              disabled={isGeneratingFixture}
              className="font-black text-xs px-4 py-2 rounded-xl shadow-lg flex items-center gap-1.5"
              style={{ backgroundColor: activeGame.brandColor, color: '#020617' }}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGeneratingFixture ? 'Generando...' : `Generar Fixture (${activeGameMode.format})`}</span>
            </Button>
          </div>

          <DataTable
            columns={[
              { header: 'Jornada', cell: (r) => <span className="font-mono font-bold text-[var(--accent-cyan)]">Jornada #{r.matchday}</span> },
              { header: 'Local VS Visitante', cell: (r) => <span className="font-bold text-[var(--text-heading)]">{r.home_team_name} VS {r.away_team_name}</span> },
              { header: 'Horario Simultáneo', accessorKey: 'match_date', className: 'font-mono text-[var(--text-secondary)]' },
              {
                header: 'Resultado Final',
                cell: (r) => (
                  <span className="font-mono font-bold text-[var(--text-primary)]">
                    {r.score_home !== null ? `${r.score_home} - ${r.score_away}` : 'Pendiente'}
                  </span>
                ),
              },
              {
                header: 'Estado',
                cell: (r) => (
                  <Badge
                    className={`text-[10px] uppercase ${
                      r.status === 'TERMINADO'
                        ? 'bg-emerald-950 text-emerald-300'
                        : r.status === 'POR_REVISAR'
                        ? 'bg-amber-950 text-amber-300'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {r.status}
                  </Badge>
                ),
              },
            ]}
            data={matches}
            searchPlaceholder="Buscar por equipo en fixture..."
            brandColor={activeGame.brandColor}
          />
        </Card>
      )}

      {/* TAB 3: EQUIPOS INSCRITOS POR JUEGO */}
      {activeTab === 'enrolled' && (
        <Card className="space-y-4 border border-[var(--border-card)] bg-[var(--bg-card)] p-3 sm:p-5">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[var(--text-heading)]">
            <Shield className="w-4 h-4 text-[var(--accent-emerald)]" />
            Nómina de Escuadras Inscritas en {activeGame.name} ({activeGameMode.name})
          </h3>

          <DataTable
            columns={[
              { header: 'Nombre del Club', cell: (r) => <span className="font-black text-[var(--text-heading)]">{r.name} [{r.tag}]</span> },
              { header: 'Disciplina', accessorKey: 'game_slug', className: 'font-mono text-[var(--accent-cyan)] uppercase font-bold' },
              { header: 'Capitán', accessorKey: 'captain_name', className: 'font-bold text-[var(--text-secondary)]' },
              { header: 'Estado', cell: (r) => <Badge variant="emerald">{r.status || 'Inscrito'}</Badge> },
            ]}
            data={filteredEnrolledTeams}
            searchPlaceholder="Buscar club inscrito..."
            brandColor="#00FF87"
          />
        </Card>
      )}

      {/* TAB 4: TEMPORADAS & COMPETENCIAS */}
      {activeTab === 'seasons' && (
        <Card className="space-y-4 border border-[var(--border-card)] bg-[var(--bg-card)] p-3 sm:p-5">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[var(--text-heading)]">
            <Calendar className="w-4 h-4 text-[var(--accent-violet)]" />
            Torneos y Competencias en Modalidad {activeGameMode.name} ({activeGameMode.format})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTournaments.map((t) => (
              <div key={t.id} className="space-y-2 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-subtle)] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black uppercase text-[var(--text-heading)]">{t.name}</span>
                  <Badge variant="cyan" className="font-mono text-[10px]">{t.status || 'ACTIVO'}</Badge>
                </div>
                <p className="font-mono text-xs text-[var(--text-secondary)]">
                  Disciplina: <strong className="uppercase text-[var(--accent-violet)]">{t.game_slug || selectedGameSlug}</strong> • Modalidad: <strong className="text-[var(--accent-cyan)]">{activeGameMode.format}</strong>
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* CONFIRMATION MODAL FOR VISTO BUENO */}
      {selectedMatchForApproval && (
        <ConfirmModal
          isOpen={Boolean(selectedMatchForApproval)}
          onClose={() => setSelectedMatchForApproval(null)}
          onConfirm={handleConfirmApproval}
          title="Otorgar Visto Bueno al Partido"
          description={`¿Confirmas homologar el marcador de ${selectedMatchForApproval.home_team_name} (${selectedMatchForApproval.reported_score_home}) VS (${selectedMatchForApproval.reported_score_away}) ${selectedMatchForApproval.away_team_name}?`}
          confirmText="Otorgar Visto Bueno"
          variant="success"
        />
      )}
    </ManagementPage>
  );
}
