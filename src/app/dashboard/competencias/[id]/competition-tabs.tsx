'use client';

import React, { useState, useTransition } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { GAMES_CATALOG } from '@/lib/games-data';
import { CompetitionData, CompetitionTeamData } from '@/app/actions/competitions';
import {
  enrollTeamAction,
  enrollIndividualAthleteAction,
  removeEnrolledTeamAction,
  generateFixtureAction,
  updateCompetitionStatusAction,
  CompetitionStatus,
} from '@/app/actions/competitions';
import { FixtureGenerator } from './fixture-generator';
import { FixtureScheduleView } from '@/components/tournaments/fixture-schedule-view';
import { ClassificationView } from '@/components/tournaments/classification-view';
import { CrudAlertBanner, useCrudNotifier } from '@/components/ui/crud-alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Trophy, Calendar, Shield, Settings, Users, Plus, Trash2, Activity, Zap, Swords, AlertTriangle, Check, UserCheck
} from 'lucide-react';

interface CompetitionTabsProps {
  competition: CompetitionData;
  enrolledTeams: CompetitionTeamData[];
  availableTeams: any[];
  availableUsers?: any[];
  isIndividual?: boolean;
  matches: any[];
}

export type CompetitionTabType = 'dashboard' | 'fixture' | 'standings' | 'teams' | 'settings';

export function CompetitionTabs({
  competition,
  enrolledTeams,
  availableTeams,
  availableUsers = [],
  isIndividual = false,
  matches,
}: CompetitionTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Persistir la pestaña activa en la URL (?tab=...)
  const activeTab = (searchParams.get('tab') as CompetitionTabType) || 'dashboard';

  const setActiveTab = (tab: CompetitionTabType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const [selectedTeamToEnroll, setSelectedTeamToEnroll] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const { crudState, startOperation, endSuccess, endError, resetAlert } = useCrudNotifier();

  const gameConfig = GAMES_CATALOG[competition.game_slug] || GAMES_CATALOG['eafc26'];
  const brandColor = gameConfig?.brandColor || '#00F0FF';

  // Metrics calculation
  const totalMatches = matches.length;
  const playedMatches = matches.filter((m) => m.status === 'TERMINADO' || m.status === 'FINALIZADO').length;
  const pendingMatches = totalMatches - playedMatches;
  const progressPercent = totalMatches > 0 ? Math.round((playedMatches / totalMatches) * 100) : 0;

  // 1. Inscribir Equipo
  const handleEnrollTeam = () => {
    if (!selectedTeamToEnroll) return;
    const teamObj = availableTeams.find((t) => t.id === selectedTeamToEnroll);
    if (!teamObj) return;

    startOperation(`Inscripción de Equipo: ${teamObj.name}`);
    startTransition(async () => {
      const res = await enrollTeamAction(competition.id, teamObj.id, teamObj.name, teamObj.tag);
      if (res.success) {
        setSelectedTeamToEnroll('');
        endSuccess(res.message || 'Equipo inscrito correctamente.');
      } else {
        endError(res.error || 'Error al inscribir equipo.');
      }
    });
  };

  // 1.1 Inscribir Atleta Individual (1v1 / 2v2 / Solo / Duos)
  const handleEnrollAthlete = () => {
    if (!selectedTeamToEnroll) return;
    const userObj = availableUsers.find((u) => u.id === selectedTeamToEnroll);
    if (!userObj) return;

    startOperation(`Inscripción de Atleta: ${userObj.gamertag || userObj.name}`);
    startTransition(async () => {
      const res = await enrollIndividualAthleteAction(competition.id, userObj.id, userObj.name, userObj.gamertag);
      if (res.success) {
        setSelectedTeamToEnroll('');
        endSuccess(res.message || 'Atleta inscrito correctamente.');
      } else {
        endError(res.error || 'Error al inscribir atleta.');
      }
    });
  };

  // 2. Retirar Equipo
  const handleRemoveTeam = (teamId: string, teamName: string) => {
    startOperation(`Retiro de Equipo: ${teamName}`);
    startTransition(async () => {
      const res = await removeEnrolledTeamAction(competition.id, teamId);
      if (res.success) {
        endSuccess(res.message || 'Equipo retirado.');
      } else {
        endError(res.error || 'Error al retirar equipo.');
      }
    });
  };

  // 3. Cambiar Estado
  const handleStatusChange = (newStatus: CompetitionStatus) => {
    startOperation(`Cambio de Estado a: ${newStatus}`);
    startTransition(async () => {
      const res = await updateCompetitionStatusAction(competition.id, newStatus);
      if (res.success) {
        endSuccess(res.message || 'Estado actualizado.');
      } else {
        endError(res.error || 'Error al actualizar estado.');
      }
    });
  };

  // Standings calculation
  const standingsMap: Record<string, { name: string; tag: string; pj: number; pg: number; pe: number; pp: number; gf: number; gc: number; pts: number }> = {};
  enrolledTeams.forEach((t) => {
    standingsMap[t.team_id] = { name: t.team_name, tag: t.team_tag || 'TEAM', pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 };
  });

  matches.forEach((m) => {
    const isFinished = m.status === 'TERMINADO' || m.status === 'FINALIZADO';
    const hScore = m.reported_score_home ?? m.score_home;
    const aScore = m.reported_score_away ?? m.score_away;

    if (isFinished && hScore !== null && aScore !== null) {
      const h = standingsMap[m.home_team_id];
      const a = standingsMap[m.away_team_id];
      if (h && a) {
        h.pj += 1;
        a.pj += 1;
        h.gf += hScore;
        h.gc += aScore;
        a.gf += aScore;
        a.gc += hScore;

        if (hScore > aScore) {
          h.pg += 1;
          h.pts += 3;
          a.pp += 1;
        } else if (hScore < aScore) {
          a.pg += 1;
          a.pts += 3;
          h.pp += 1;
        } else {
          h.pe += 1;
          a.pe += 1;
          h.pts += 1;
          a.pts += 1;
        }
      }
    }
  });

  const standingsList = Object.values(standingsMap).sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc));
  const enrolledSet = new Set(enrolledTeams.map((t) => t.team_id));
  const availableToEnroll = availableTeams.filter(
    (t) => !enrolledSet.has(t.id) && (t.game_slug === competition.game_slug || !t.game_slug)
  );

  const tabButtons = [
    { id: 'dashboard', label: '1. Dashboard (Resumen)', icon: Activity, color: '#A855F7' },
    { id: 'fixture', label: '2. Fixture y Partidos', icon: Calendar, color: '#00F0FF' },
    { id: 'standings', label: '3. Tabla de Posiciones', icon: Trophy, color: '#F59E0B' },
    { id: 'teams', label: `4. Inscripción de Clubes (${enrolledTeams.length})`, icon: Users, color: '#10B981' },
    { id: 'settings', label: '5. Configuración y Estado', icon: Settings, color: '#EF4444' },
  ];

  return (
    <div className="space-y-6">
      <CrudAlertBanner state={crudState} onClose={resetAlert} />

      {/* SISTEMA DE 5 PESTAÑAS HORIZONTALES (ESTILO ESPORTS CON BORDES NEÓN) */}
      <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3 overflow-x-auto scrollbar-none font-mono">
        {tabButtons.map((tb) => {
          const isActive = activeTab === tb.id;
          const Icon = tb.icon;
          return (
            <button
              key={tb.id}
              onClick={() => setActiveTab(tb.id as CompetitionTabType)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 border ${
                isActive
                  ? 'bg-[var(--bg-main)] shadow-xl scale-[1.02]'
                  : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-card)] hover:border-[var(--border-card-hover)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
              }`}
              style={{
                borderColor: isActive ? tb.color : undefined,
                boxShadow: isActive ? `0 0 15px color-mix(in srgb, ${tb.color} 30%, transparent)` : undefined,
                color: isActive ? tb.color : undefined,
              }}
            >
              <Icon className="w-4 h-4" />
              <span>{tb.label}</span>
            </button>
          );
        })}
      </div>

      {/* 📌 PESTAÑA 1: DASHBOARD (RESUMEN) */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200">
          {/* Card 1: Reglas y Sistema */}
          <Card className="p-5 bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border-card)] space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-2.5">
              <h3 className="text-xs font-black uppercase text-purple-400 tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                Reglas y Sistema
              </h3>
              <span className="text-[10px] font-mono text-[var(--accent-cyan)] font-bold uppercase">eSports Spec</span>
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span className="text-[var(--text-muted)]">Modalidad:</span>
                <strong className="text-[var(--text-heading)] bg-[var(--bg-main)] px-2 py-0.5 rounded border border-[var(--border-card)]">{competition.mode_format}</strong>
              </div>
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span className="text-[var(--text-muted)]">Tipo de Torneo:</span>
                <strong className="text-[var(--text-heading)] bg-[var(--bg-main)] px-2 py-0.5 rounded border border-[var(--border-card)] uppercase">
                  {competition.mode_format?.toLowerCase().includes('playoff') ? 'PLAYOFF' : competition.mode_format?.toLowerCase().includes('hibrid') ? 'LIGA HÍBRIDA' : 'LIGA'}
                </strong>
              </div>
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span className="text-[var(--text-muted)]">Plataforma Oficial:</span>
                <strong className="text-[var(--accent-cyan)] font-bold">CROSSPLAY</strong>
              </div>
              
              {(competition.mode_format || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes('HIBRID') && (
                <div className="flex items-center justify-between text-[var(--text-secondary)]">
                  <span className="text-[var(--text-muted)]">Clasifican a Playoffs:</span>
                  <strong className="text-amber-400 font-bold">Top {(competition as any).qualifiers_per_group || 2} de cada grupo</strong>
                </div>
              )}

              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span className="text-[var(--text-muted)]">Formato de Partido:</span>
                <strong className="text-emerald-400 font-bold">
                  {competition.match_mode === 'IdaVuelta' ? 'Ida y Vuelta' : 'Partido Único'}
                </strong>
              </div>
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span className="text-[var(--text-muted)]">Auto-Avance:</span>
                <strong className="text-rose-400 font-bold">Manual</strong>
              </div>
            </div>
          </Card>

          {/* Card 2: Progreso de Competición */}
          <Card className="p-5 bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border-card)] space-y-3 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-2.5">
                <h3 className="text-xs font-black uppercase text-[var(--accent-cyan)] tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[var(--accent-cyan)]" />
                  Progreso de Competición
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">{progressPercent}%</span>
              </div>
              <div className="space-y-3 mt-3">
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span className="text-[var(--text-secondary)]">Progreso Total:</span>
                  <span className="text-[var(--accent-cyan)]">{playedMatches} / {totalMatches} Partidos Jugados</span>
                </div>
                <div className="w-full h-3 rounded-full bg-[var(--bg-main)] border border-[var(--border-card)] overflow-hidden relative">
                  <div className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 transition-all duration-500 rounded-full" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </div>
            <div className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-main)] p-2 rounded-lg border border-[var(--border-card)] mt-2">
              💡 Actualización automática tras el visto bueno de actas en Matchday.
            </div>
          </Card>

          {/* Card 3: Métricas Rápidas */}
          <Card className="p-5 bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border-card)] space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-2.5">
              <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                Métricas Rápidas
              </h3>
              <span className="text-[10px] font-mono text-purple-400 font-bold">{enrolledTeams.length} Clubes</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
              <div className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
                <span className="text-[10px] text-[var(--text-muted)] block uppercase">Jugados</span>
                <strong className="text-emerald-400 text-lg font-black">{playedMatches}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
                <span className="text-[10px] text-[var(--text-muted)] block uppercase">Pendientes</span>
                <strong className="text-amber-400 text-lg font-black">{pendingMatches}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
                <span className="text-[10px] text-[var(--text-muted)] block uppercase">Completado</span>
                <strong className="text-[var(--accent-cyan)] text-lg font-black">{progressPercent}%</strong>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ⚙️ PESTAÑA 2: FIXTURE Y PARTIDOS (MOMENTO FIXTURE OFICIAL & SCHEDULE VIEW SIN FILTROS REPETIDOS) */}
      {activeTab === 'fixture' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <FixtureGenerator competition={competition} enrolledTeams={enrolledTeams} matches={matches} />

          <div className="pt-4 border-t border-[var(--border-card)] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase text-[var(--accent-cyan)] tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--accent-cyan)]" />
                CALENDARIO & JORNADAS DE ESTA COMPETENCIA
              </h3>
            </div>
            <FixtureScheduleView
              game={gameConfig}
              initialTournName={competition.name}
              initialTournId={competition.id}
              hideOrgFilter={true}
              hideCompFilter={true}
              hideSearchFilter={true}
              hideHeader={true}
            />
          </div>
        </div>
      )}

      {/* 🏆 PESTAÑA 3: TABLA DE POSICIONES (STANDINGS VIEW OFICIAL DE CLASIFICACIÓN SIN FILTROS REPETIDOS) */}
      {activeTab === 'standings' && (
        <div className="animate-in fade-in duration-200 space-y-4">
          <ClassificationView
            game={gameConfig}
            initialTournName={competition.name}
            initialTournId={competition.id}
            hideOrgFilter={true}
            hideCompFilter={true}
            hideSearchFilter={true}
            hideHeader={true}
          />
        </div>
      )}

      {/* 🛡️ PESTAÑA 4: INSCRIPCIÓN DE CLUBES O ATLETAS INDIVIDUALES */}
      {activeTab === 'teams' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Formulario Selector */}
          <Card className="p-5 bg-[var(--bg-card)] backdrop-blur-md border border-emerald-500/40 space-y-3 shadow-2xl">
            <h3 className="text-xs font-black uppercase text-emerald-400 flex items-center gap-2">
              {isIndividual ? <UserCheck className="w-4 h-4 text-amber-400" /> : <Plus className="w-4 h-4 text-emerald-400" />}
              {isIndividual
                ? `Inscribir Atleta / Jugador Directo (Modalidad Individual ${competition.mode_format})`
                : `Inscribir Club Existente (Modalidad Equipos ${competition.mode_format})`}
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              {isIndividual ? (
                <select
                  value={selectedTeamToEnroll}
                  onChange={(e) => setSelectedTeamToEnroll(e.target.value)}
                  className="w-full sm:flex-1 p-2.5 rounded-xl input-theme font-mono text-xs outline-none focus:border-amber-500"
                >
                  <option value="" className="bg-[#0b101b] text-slate-100">
                    -- Seleccionar Jugador / Atleta Disponible ({availableUsers.length} disponibles) --
                  </option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id} className="bg-[#0b101b] text-slate-100">
                      👤 {u.name} ({u.gamertag || 'Sin Gamertag'}) — Pos: {u.position || 'General'}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={selectedTeamToEnroll}
                  onChange={(e) => setSelectedTeamToEnroll(e.target.value)}
                  className="w-full sm:flex-1 p-2.5 rounded-xl input-theme font-mono text-xs outline-none focus:border-emerald-500"
                >
                  <option value="" className="bg-[#0b101b] text-slate-100">-- Seleccionar Equipo de {gameConfig.name} ({availableToEnroll.length} disponibles) --</option>
                  {availableToEnroll.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#0b101b] text-slate-100">
                      🛡️ {t.name} [{t.tag}] — ({t.platform})
                    </option>
                  ))}
                </select>
              )}

              <Button
                onClick={isIndividual ? handleEnrollAthlete : handleEnrollTeam}
                disabled={isPending || !selectedTeamToEnroll}
                className={`w-full sm:w-auto font-black text-xs px-6 py-2.5 rounded-xl shadow-lg flex items-center gap-2 ${
                  isIndividual
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>{isIndividual ? 'Inscribir Atleta' : 'Inscribir Club'}</span>
              </Button>
            </div>
          </Card>

          {/* Grid de Clubes Confirmados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {enrolledTeams.map((t) => (
              <div key={t.id} className="p-3.5 rounded-xl bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border-card)] flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--bg-main)] border border-emerald-500/40 flex items-center justify-center font-black text-xs text-emerald-400 shadow-md">
                    {t.team_tag || 'TEAM'}
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-[var(--text-heading)]">{t.team_name}</h4>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" />
                      CONFIRMADO
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveTeam(t.team_id, t.team_name)}
                  className="text-xs text-rose-400 hover:bg-rose-950 p-2"
                  title="Retirar equipo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ⚙️ PESTAÑA 5: CONFIGURACIÓN Y ESTADO */}
      {activeTab === 'settings' && (
        <Card className="p-6 bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border-card)] space-y-4 shadow-2xl animate-in fade-in duration-200">
          <h3 className="text-sm font-black uppercase text-[var(--text-heading)] flex items-center gap-2 border-b border-[var(--border-card)] pb-3">
            <Settings className="w-4 h-4 text-amber-400" />
            Configuraciones Administrativas del Torneo
          </h3>

          <div className="space-y-4">
            <label className="text-xs font-mono text-[var(--text-muted)] block">
              Cambiar Estado General de la Competencia (Soft Delete & Transiciones):
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Button
                onClick={() => handleStatusChange('Borrador')}
                disabled={competition.status === 'Borrador'}
                className="bg-amber-950/80 text-amber-300 border border-amber-500/40 hover:bg-amber-900 text-xs font-black py-3 rounded-xl"
              >
                Set a BORRADOR
              </Button>

              <Button
                onClick={() => handleStatusChange('Activo')}
                disabled={competition.status === 'Activo'}
                className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900 text-xs font-black py-3 rounded-xl"
              >
                Set a ACTIVO
              </Button>

              <Button
                onClick={() => handleStatusChange('Finalizado')}
                disabled={competition.status === 'Finalizado'}
                className="bg-purple-950/80 text-purple-300 border border-purple-500/40 hover:bg-purple-900 text-xs font-black py-3 rounded-xl"
              >
                Set a FINALIZADO
              </Button>

              <Button
                onClick={() => handleStatusChange('Deshabilitado')}
                disabled={competition.status === 'Deshabilitado'}
                className="bg-rose-950/80 text-rose-300 border border-rose-500/40 hover:bg-rose-900 text-xs font-black py-3 rounded-xl"
              >
                DESHABILITAR (Soft Delete)
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
