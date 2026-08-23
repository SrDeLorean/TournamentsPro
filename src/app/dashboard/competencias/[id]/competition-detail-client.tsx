'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { GAMES_CATALOG } from '@/lib/games-data';
import { CompetitionData, CompetitionTeamData } from '@/app/actions/competitions';
import {
  enrollTeamAction,
  removeEnrolledTeamAction,
  generateFixtureAction,
  updateCompetitionStatusAction,
  CompetitionStatus,
} from '@/app/actions/competitions';
import { CrudAlertBanner, useCrudNotifier } from '@/components/ui/crud-alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Trophy, Calendar, Shield, Settings, Users, Plus, Trash2, ArrowLeft, Play, CheckCircle2, Clock, Swords, AlertCircle
} from 'lucide-react';

interface CompetitionDetailClientProps {
  competition: CompetitionData;
  enrolledTeams: CompetitionTeamData[];
  availableTeams: any[];
  matches: any[];
}

export function CompetitionDetailClient({
  competition,
  enrolledTeams,
  availableTeams,
  matches,
}: CompetitionDetailClientProps) {
  const [activeTab, setActiveTab] = useState<'fixture' | 'standings' | 'teams' | 'settings'>('fixture');
  const [selectedTeamToEnroll, setSelectedTeamToEnroll] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const { crudState, startOperation, endSuccess, endError, resetAlert } = useCrudNotifier();

  const gameConfig = GAMES_CATALOG[competition.game_slug] || GAMES_CATALOG['eafc26'];
  const brandColor = gameConfig?.brandColor || '#00F0FF';

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

  // 3. Generar Fixture
  const handleGenerateFixture = () => {
    startOperation(`Generación de Fixture: ${competition.name}`);
    startTransition(async () => {
      const res = await generateFixtureAction(competition.id);
      if (res.success) {
        endSuccess((res as any).message || 'Fixture generado exitosamente.');
      } else {
        endError(res.error || 'Error al generar fixture.');
      }
    });
  };

  // 4. Cambiar Estado
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

  // Standings calculation mock based on matches
  const standingsMap: Record<string, { name: string; tag: string; pj: number; pg: number; pe: number; pp: number; gf: number; gc: number; pts: number }> = {};
  enrolledTeams.forEach((t) => {
    standingsMap[t.team_id] = { name: t.team_name, tag: t.team_tag || 'TEAM', pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 };
  });

  matches.forEach((m) => {
    if (m.status === 'TERMINADO' && m.reported_score_home !== null && m.reported_score_away !== null) {
      const h = standingsMap[m.home_team_id];
      const a = standingsMap[m.away_team_id];
      if (h && a) {
        h.pj += 1;
        a.pj += 1;
        h.gf += m.reported_score_home;
        h.gc += m.reported_score_away;
        a.gf += m.reported_score_away;
        a.gc += m.reported_score_home;

        if (m.reported_score_home > m.reported_score_away) {
          h.pg += 1;
          h.pts += 3;
          a.pp += 1;
        } else if (m.reported_score_home < m.reported_score_away) {
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

  // Filter available teams that are not yet enrolled
  const enrolledSet = new Set(enrolledTeams.map((t) => t.team_id));
  const availableToEnroll = availableTeams.filter((t) => !enrolledSet.has(t.id));

  // Group matches by matchday
  const matchesByMatchday: Record<number, any[]> = {};
  matches.forEach((m) => {
    const num = m.matchday_number || m.matchday || 1;
    if (!matchesByMatchday[num]) matchesByMatchday[num] = [];
    matchesByMatchday[num].push(m);
  });

  return (
    <div className="space-y-6">
      <CrudAlertBanner state={crudState} onClose={resetAlert} />

      {/* Header Banner & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/competencias"
          className="text-xs font-bold text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Listado de Competencias</span>
        </Link>

        <Badge variant={competition.status === 'Activo' ? 'emerald' : competition.status === 'Borrador' ? 'gold' : 'rose'} className="text-xs uppercase font-mono font-black">
          {competition.status}
        </Badge>
      </div>

      {/* Competition Identity Card */}
      <Card className="p-6 bg-slate-950 border border-purple-500/30 space-y-4 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl bg-slate-900 border-2 flex items-center justify-center font-black text-2xl shadow-xl flex-shrink-0"
              style={{ borderColor: brandColor, color: brandColor }}
            >
              {gameConfig?.icon || '🏆'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">{competition.name}</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-950 text-purple-300 border border-purple-500/40">
                  {gameConfig?.name}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-3 flex-wrap">
                <span>Formato: <strong className="text-cyan-300">{competition.mode_format}</strong></span>
                <span>• Inicio: <strong className="text-emerald-400">{new Date(competition.fecha_inicio).toLocaleDateString('es-ES')}</strong></span>
                <span>• Término: <strong className="text-slate-300">{competition.fecha_termino ? new Date(competition.fecha_termino).toLocaleDateString('es-ES') : 'TBD (Nullable)'}</strong></span>
              </p>
            </div>
          </div>

          {/* Quick Action Button: Generar Fixture */}
          <Button
            onClick={handleGenerateFixture}
            disabled={isPending || enrolledTeams.length < 2}
            className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Generar / Regenerar Fixture</span>
          </Button>
        </div>
      </Card>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('fixture')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'fixture' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'bg-slate-900 border border-white/10 text-slate-300'
          }`}
        >
          <Calendar className="w-4 h-4" />
          1. Fixture & Partidos ({matches.length})
        </button>

        <button
          onClick={() => setActiveTab('standings')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'standings' ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-900 border border-white/10 text-slate-300'
          }`}
        >
          <Trophy className="w-4 h-4" />
          2. Tabla de Posiciones
        </button>

        <button
          onClick={() => setActiveTab('teams')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'teams' ? 'bg-emerald-600 text-slate-950 shadow-lg' : 'bg-slate-900 border border-white/10 text-slate-300'
          }`}
        >
          <Shield className="w-4 h-4" />
          3. Inscripción de Equipos ({enrolledTeams.length})
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'settings' ? 'bg-amber-600 text-white shadow-lg' : 'bg-slate-900 border border-white/10 text-slate-300'
          }`}
        >
          <Settings className="w-4 h-4" />
          4. Configuración & Estado
        </button>
      </div>

      {/* TAB 1: FIXTURE & CALENDARIO */}
      {activeTab === 'fixture' && (
        <div className="space-y-6">
          {Object.keys(matchesByMatchday).length === 0 ? (
            <Card className="p-8 text-center bg-slate-950 border border-white/10 space-y-3">
              <Swords className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-sm font-black uppercase text-white">No se ha generado el fixture todavía</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Inscribe al menos 2 equipos en la pestaña de inscripción y presiona "Generar Fixture" para construir el calendario automático.
              </p>
            </Card>
          ) : (
            Object.entries(matchesByMatchday).map(([jornada, matchGroup]) => (
              <div key={jornada} className="space-y-3">
                <h3 className="text-xs font-black uppercase text-cyan-400 tracking-wider flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Jornada {jornada} ({matchGroup.length} Partidos)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {matchGroup.map((m) => {
                    const homeName = m.home_team_name || m.home_team_id || m.team_home_id || 'Equipo Local';
                    const awayName = m.away_team_name || m.away_team_id || m.team_away_id || 'Equipo Visitante';
                    const homeScore = m.reported_score_home ?? m.score_home;
                    const awayScore = m.reported_score_away ?? m.score_away;
                    const isTerminado = m.status === 'TERMINADO' && homeScore !== null && awayScore !== null;

                    return (
                      <div key={m.id} className="p-3.5 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-between gap-3 shadow-md">
                        <div className="flex-1 text-right font-black text-xs text-white truncate">
                          {homeName}
                        </div>

                        <div className="px-3 py-1 rounded-lg bg-slate-900 border border-purple-500/40 font-mono text-xs font-bold text-center flex-shrink-0">
                          {isTerminado ? (
                            <span className="text-emerald-400 font-black">{homeScore} - {awayScore}</span>
                          ) : (
                            <span className="text-slate-400">VS</span>
                          )}
                        </div>

                        <div className="flex-1 text-left font-black text-xs text-white truncate">
                          {awayName}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: TABLA DE POSICIONES */}
      {activeTab === 'standings' && (
        <Card className="p-4 bg-slate-950 border border-white/10 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[10px] uppercase">
                <th className="p-2"># Pos</th>
                <th className="p-2">Escuadra</th>
                <th className="p-2 text-center">PJ</th>
                <th className="p-2 text-center">PG</th>
                <th className="p-2 text-center">PE</th>
                <th className="p-2 text-center">PP</th>
                <th className="p-2 text-center">GF</th>
                <th className="p-2 text-center">GC</th>
                <th className="p-2 text-center">DIF</th>
                <th className="p-2 text-center text-cyan-400 font-black">PTS</th>
              </tr>
            </thead>
            <tbody>
              {standingsList.map((st, idx) => (
                <tr key={st.name} className="border-b border-white/5 hover:bg-slate-900/50">
                  <td className="p-2 font-bold text-slate-400">{idx + 1}</td>
                  <td className="p-2 font-black text-white">{st.name} <span className="text-[10px] text-cyan-400">[{st.tag}]</span></td>
                  <td className="p-2 text-center text-slate-300">{st.pj}</td>
                  <td className="p-2 text-center text-emerald-400 font-bold">{st.pg}</td>
                  <td className="p-2 text-center text-amber-400">{st.pe}</td>
                  <td className="p-2 text-center text-rose-400">{st.pp}</td>
                  <td className="p-2 text-center text-slate-300">{st.gf}</td>
                  <td className="p-2 text-center text-slate-300">{st.gc}</td>
                  <td className="p-2 text-center text-slate-300">{st.gf - st.gc}</td>
                  <td className="p-2 text-center font-black text-cyan-300 text-sm">{st.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* TAB 3: INSCRIPCIÓN DE EQUIPOS */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          {/* Formulario de Agregar Equipo Existente */}
          <Card className="p-4 bg-slate-950 border border-purple-500/30 space-y-3">
            <h3 className="text-xs font-black uppercase text-purple-300 flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-400" />
              Inscribir Club Existente en esta Competencia
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <select
                value={selectedTeamToEnroll}
                onChange={(e) => setSelectedTeamToEnroll(e.target.value)}
                className="w-full sm:flex-1 p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono text-xs outline-none"
              >
                <option value="">-- Seleccionar Equipo Disponible --</option>
                {availableToEnroll.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} [{t.tag}] — ({t.platform})
                  </option>
                ))}
              </select>

              <Button
                onClick={handleEnrollTeam}
                disabled={isPending || !selectedTeamToEnroll}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-lg"
              >
                Inscribir Club
              </Button>
            </div>
          </Card>

          {/* Lista de Equipos Inscritos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {enrolledTeams.map((t) => (
              <div key={t.id} className="p-3.5 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-emerald-500/40 flex items-center justify-center font-black text-xs text-emerald-400">
                    {t.team_tag || 'TEAM'}
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-white">{t.team_name}</h4>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">✓ {t.status}</span>
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

      {/* TAB 4: CONFIGURACIÓN & ESTADOS (SOFT DELETE) */}
      {activeTab === 'settings' && (
        <Card className="p-6 bg-slate-950 border border-white/10 space-y-4">
          <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-amber-400" />
            Control de Estado de la Competencia (Soft Delete)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <Button
              onClick={() => handleStatusChange('Borrador')}
              disabled={competition.status === 'Borrador'}
              className="bg-amber-950 text-amber-300 border border-amber-500/40 hover:bg-amber-900 text-xs font-black py-3 rounded-xl"
            >
              Set a BORRADOR
            </Button>

            <Button
              onClick={() => handleStatusChange('Activo')}
              disabled={competition.status === 'Activo'}
              className="bg-emerald-950 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900 text-xs font-black py-3 rounded-xl"
            >
              Set a ACTIVO
            </Button>

            <Button
              onClick={() => handleStatusChange('Finalizado')}
              disabled={competition.status === 'Finalizado'}
              className="bg-purple-950 text-purple-300 border border-purple-500/40 hover:bg-purple-900 text-xs font-black py-3 rounded-xl"
            >
              Set a FINALIZADO
            </Button>

            <Button
              onClick={() => handleStatusChange('Deshabilitado')}
              disabled={competition.status === 'Deshabilitado'}
              className="bg-rose-950 text-rose-300 border border-rose-500/40 hover:bg-rose-900 text-xs font-black py-3 rounded-xl"
            >
              DESHABILITAR (Soft Delete)
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
