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

export function OrganizerDashboardView() {
  const { currentUser, activeGameSlug, setActiveGameSlug } = useAuth();
  const [activeTab, setActiveTab] = useState<'approvals' | 'fixture' | 'enrolled' | 'seasons'>('approvals');

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner with Organization Identity & Game / Mode Selectors */}
      <div className="rounded-2xl bg-slate-950 border border-purple-500/30 shadow-2xl overflow-hidden">
        {/* Banner Image */}
        {userOrg?.banner_url && (
          <div className="h-32 w-full relative overflow-hidden bg-slate-900">
            <Image
              src={userOrg.banner_url}
              alt={userOrg.name}
              fill
              sizes="100vw"
              unoptimized={shouldBypassImageOptimization(userOrg.banner_url)}
              className="object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          </div>
        )}

        <div className="p-6 pt-4 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-2xl bg-slate-900 border-2 border-purple-400 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-xl">
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
                  <Building2 className="w-8 h-8 text-purple-300" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black uppercase text-white tracking-wider">
                    {userOrg ? userOrg.name : 'Panel del Organizador eSports'}
                  </h1>
                  <Badge className="bg-purple-900 text-purple-300 border-purple-400 font-mono text-[10px] uppercase">
                    {userOrg ? `[${userOrg.tag}]` : 'Organizador'}
                  </Badge>
                </div>
                {userOrg && (
                  <p className="text-xs font-mono text-purple-300 font-bold flex items-center gap-2 mt-1">
                    <span><MapPin className="w-3 h-3 inline mr-0.5" />{userOrg.country || 'Venezuela'}</span>
                    <span>• Est. {userOrg.founded_year || '2019'}</span>
                    <span>• ★ {userOrg.rating || '4.98'} Rating</span>
                  </p>
                )}
              </div>
            </div>

            {/* Assigned Organizers List */}
            {userOrg?.organizers && userOrg.organizers.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-black block">Co-Organizadores Asignados:</span>
                <div className="flex items-center gap-2">
                  {userOrg.organizers.map((oUser) => (
                    <div key={oUser.id} className="flex items-center gap-1 text-[11px] font-bold text-cyan-300">
                      <Avatar fallback={oUser.name} src={oUser.avatar_url || oUser.foto} size="sm" />
                      <span>@{oUser.gamertag || oUser.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* GAME SELECTOR IN ORGANIZER PANEL */}
          <div className="pt-4 border-t border-white/10 space-y-4">
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
                          : 'bg-slate-900/90 text-slate-300 border-white/10 hover:border-white/30'
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
            <div className="space-y-2 pt-2 border-t border-white/5">
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
                          ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-950/60 scale-105'
                          : 'bg-slate-900/80 text-slate-300 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-purple-300" />
                      <span>{mode.name}</span>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-purple-200">
                        {mode.format}
                      </span>
                    </button>
                  );
                })}
              </div>
              {activeGameMode && (
                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/20 text-[11px] font-mono text-purple-200 flex items-center justify-between">
                  <span>Modo Activo: <strong>{activeGameMode.name}</strong> ({activeGameMode.format}) — {activeGameMode.description}</span>
                  <Badge variant="cyan" className="font-mono text-[9px]">COMPETENCIA VIGENTE</Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-950 border border-amber-500/40 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-950 border border-amber-500/30 text-amber-400">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-mono uppercase font-bold">Por Revisar (Visto Bueno)</div>
            <div className="text-xl font-black text-amber-300">{pendingApprovals.length} Partidos</div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-950 border border-cyan-500/30 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-950 border border-cyan-500/30 text-cyan-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-mono uppercase font-bold">Torneos ({activeGameMode.format})</div>
            <div className="text-xl font-black text-cyan-300">{filteredTournaments.length} Competencias</div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-950 border border-emerald-500/30 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-500/30 text-emerald-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-mono uppercase font-bold">Equipos {activeGame.name}</div>
            <div className="text-xl font-black text-emerald-300">{filteredEnrolledTeams.length} Escuadras</div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-950 border border-purple-500/30 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-950 border border-purple-500/30 text-purple-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-mono uppercase font-bold">Modalidad Activa</div>
            <div className="text-sm font-black text-purple-300">{activeGameMode.name}</div>
          </div>
        </Card>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'approvals' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'bg-slate-900 border border-white/10 text-slate-300'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          1. Visto Bueno & Revisión ({pendingApprovals.length})
        </button>

        <button
          onClick={() => setActiveTab('fixture')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'fixture' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'bg-slate-900 border border-white/10 text-slate-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          2. Fixtures [{activeGameMode.format}] ({matches.length})
        </button>

        <button
          onClick={() => setActiveTab('enrolled')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'enrolled' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'bg-slate-900 border border-white/10 text-slate-300'
          }`}
        >
          <Shield className="w-4 h-4" />
          3. Escuadras {activeGame.name} ({filteredEnrolledTeams.length})
        </button>

        <button
          onClick={() => setActiveTab('seasons')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'seasons' ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-900 border border-white/10 text-slate-300'
          }`}
        >
          <Calendar className="w-4 h-4" />
          4. Competencias [{activeGameMode.format}] ({filteredTournaments.length})
        </button>
      </div>

      {/* TAB 1: VISTO BUENO */}
      {activeTab === 'approvals' && (
        <Card className="p-6 bg-slate-950 border border-amber-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-amber-300 tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-amber-400" />
              Módulo de Visto Bueno: Partidos Reportados por Capitanes
            </h3>
            <Badge className="bg-amber-950 text-amber-300 border-amber-500/30 font-mono text-[10px]">
              {pendingApprovals.length} En Espera de Homologación
            </Badge>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-xs font-bold text-slate-300 uppercase">¡No hay partidos pendientes de Visto Bueno!</p>
            </div>
          ) : (
            <DataTable
              columns={[
                {
                  header: 'Encuentro Reportado',
                  cell: (r) => (
                    <div>
                      <div className="font-bold text-white text-xs">{r.home_team_name} VS {r.away_team_name}</div>
                      <div className="text-[10px] font-mono text-cyan-400">Jornada #{r.matchday}</div>
                    </div>
                  ),
                },
                {
                  header: 'Marcador Enviado',
                  cell: (r) => (
                    <span className="font-mono font-black text-amber-300 text-sm bg-slate-900 px-3 py-1 rounded-lg border border-amber-500/30">
                      {r.reported_score_home} - {r.reported_score_away}
                    </span>
                  ),
                },
                {
                  header: 'Comprobante',
                  cell: (r) =>
                    r.proof_url ? (
                      <a href={r.proof_url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 font-bold hover:underline flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5" /> Captura WebP
                      </a>
                    ) : (
                      <span className="text-slate-500 text-[10px]">Sin imagen</span>
                    ),
                },
                {
                  header: 'Estado',
                  cell: () => <Badge className="bg-amber-950 text-amber-300 border-amber-500/40">⏳ POR_REVISAR</Badge>,
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
        <Card className="p-6 bg-slate-950 border border-cyan-500/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black uppercase text-cyan-300 tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
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
              { header: 'Jornada', cell: (r) => <span className="font-mono font-bold text-cyan-400">Jornada #{r.matchday}</span> },
              { header: 'Local VS Visitante', cell: (r) => <span className="font-bold text-white">{r.home_team_name} VS {r.away_team_name}</span> },
              { header: 'Horario Simultáneo', accessorKey: 'match_date', className: 'font-mono text-slate-300' },
              {
                header: 'Resultado Final',
                cell: (r) => (
                  <span className="font-mono font-bold text-slate-200">
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
        <Card className="p-6 bg-slate-950 border border-emerald-500/30 space-y-4">
          <h3 className="text-sm font-black uppercase text-emerald-300 tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Nómina de Escuadras Inscritas en {activeGame.name} ({activeGameMode.name})
          </h3>

          <DataTable
            columns={[
              { header: 'Nombre del Club', cell: (r) => <span className="font-black text-white">{r.name} [{r.tag}]</span> },
              { header: 'Disciplina', accessorKey: 'game_slug', className: 'font-mono text-cyan-400 uppercase font-bold' },
              { header: 'Capitán', accessorKey: 'captain_name', className: 'font-bold text-slate-300' },
              { header: 'Estado', cell: (r) => <Badge className="bg-emerald-950 text-emerald-300">{r.status || 'Inscrito'}</Badge> },
            ]}
            data={filteredEnrolledTeams}
            searchPlaceholder="Buscar club inscrito..."
            brandColor="#00FF87"
          />
        </Card>
      )}

      {/* TAB 4: TEMPORADAS & COMPETENCIAS */}
      {activeTab === 'seasons' && (
        <Card className="p-6 bg-slate-950 border border-purple-500/30 space-y-4">
          <h3 className="text-sm font-black uppercase text-purple-300 tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            Torneos y Competencias en Modalidad {activeGameMode.name} ({activeGameMode.format})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTournaments.map((t) => (
              <div key={t.id} className="p-4 rounded-2xl bg-slate-900 border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-sm uppercase">{t.name}</span>
                  <Badge variant="cyan" className="font-mono text-[10px]">{t.status || 'ACTIVO'}</Badge>
                </div>
                <p className="text-xs text-slate-300 font-mono">
                  Disciplina: <strong className="text-purple-300 uppercase">{t.game_slug || selectedGameSlug}</strong> • Modalidad: <strong className="text-cyan-300">{activeGameMode.format}</strong>
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
    </div>
  );
}
