'use client';

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { GAMES_CATALOG } from '@/lib/games-data';
import {
  CompetitionData,
  CompetitionTeamData,
  regenerateFixtureAction,
  advancePlayoffWinnerAction,
} from '@/app/actions/competitions';
import {
  distributeTeamsIntoGroups,
  generatePlayoffBracket,
  generateHybridCrossSeedings,
  getRoundNameByTeamCount,
  TeamItem,
  GroupDistributionResult,
  PlayoffMatchNode,
} from '@/lib/matchmaking-bracket';
import { RegenerateWarningModal } from './regenerate-warning-modal';
import { MatchmakingPreview } from './matchmaking-preview';
import { CrudAlertBanner, useCrudNotifier } from '@/components/ui/crud-alert';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar, Clock, CheckCircle2, Play, Sparkles, Trophy, Shield, Swords, Layers, Settings, Eye, Check, AlertTriangle, FileText, Edit3, RotateCcw, RefreshCw, ArrowRight, Award
} from 'lucide-react';

interface FixtureGeneratorProps {
  competition: CompetitionData;
  enrolledTeams: CompetitionTeamData[];
  matches?: any[];
}

export type TournamentFormat = 'Liga' | 'Playoff' | 'Hibrido';
export type MatchMode = 'IdaVuelta' | 'PartidoUnico';

export interface MatchPreviewItem {
  id: string;
  jornada: number;
  homeTeamName: string;
  awayTeamName: string;
  scheduledDate: string;
  scheduledTime: string;
  stage: string;
}

export interface TimeSlotConfig {
  dayLabel: string;
  time: string;
}

export interface MatchScheduled {
  id: string;
  matchdayNumber: number;
  homeTeamName: string;
  awayTeamName: string;
  scheduledDateLabel: string;
  stageLabel: string;
  scheduledTime: string;
  scheduledDateTimeISO: string;
}

import { getMatchdayDateTime } from '@/lib/fixture-date-scheduler';

/**
 * Algoritmo de Generación de Calendario Proyectado según Formato (Liga, Playoff, Híbrido).
 */
export function generateFixtureSchedule(
  teamsList: { id: string; name: string }[],
  startDateISO: string,
  timeSlots: TimeSlotConfig[],
  matchMode: MatchMode = 'PartidoUnico',
  format: 'Liga' | 'Playoff' | 'Hibrido' = 'Liga',
  groupCount = 3,
  qualifiersPerGroup = 2,
  selectedDays?: string[],
  selectedTimes?: string[]
): MatchScheduled[] {
  if (teamsList.length < 2 || timeSlots.length === 0) {
    return [];
  }

  const matches: MatchScheduled[] = [];

  const days = selectedDays && selectedDays.length > 0
    ? selectedDays
    : Array.from(new Set(timeSlots.map((s) => s.dayLabel)));
  const times = selectedTimes && selectedTimes.length > 0
    ? selectedTimes
    : Array.from(new Set(timeSlots.map((s) => s.time)));

  const getScheduledInfo = (matchdayNumber: number) => {
    const info = getMatchdayDateTime(matchdayNumber, startDateISO, days, times);
    return {
      slot: { dayLabel: info.dayNameCapitalized, time: info.timeStr },
      exactDateStr: info.exactDateStr,
      iso: info.iso,
    };
  };

  // 🏆 PREVISUALIZACIÓN DE PLAYOFF
  if (format === 'Playoff') {
    const playoffNodes = generatePlayoffBracket('preview', teamsList, matchMode);
    playoffNodes.forEach((node) => {
      let matchdayNumber = node.roundOrder;
      if (matchMode === 'IdaVuelta') {
        matchdayNumber = (node.roundOrder - 1) * 2 + (node.legType === 'VUELTA' ? 2 : 1);
      }
      const timing = getScheduledInfo(matchdayNumber);

      matches.push({
        id: node.id,
        matchdayNumber,
        homeTeamName: node.homeTeamName,
        awayTeamName: node.awayTeamName,
        scheduledDateLabel: timing.exactDateStr,
        stageLabel: node.roundName,
        scheduledTime: timing.slot.time,
        scheduledDateTimeISO: timing.iso,
      });
    });

    return matches;
  }

  // ⚔️ PREVISUALIZACIÓN HÍBRIDA
  if (format === 'Hibrido') {
    const groups = distributeTeamsIntoGroups(teamsList, groupCount);
    let maxGroupMatchday = 1;

    groups.forEach((group) => {
      const groupTeams = [...group.teams];
      if (groupTeams.length % 2 !== 0) groupTeams.push({ id: 'BYE', name: 'DESCANSO (BYE)' });

      const numTeams = groupTeams.length;
      const singleRoundMatchesCount = numTeams - 1;
      const matchesPerRound = numTeams / 2;
      const totalLegs = matchMode === 'IdaVuelta' ? 2 : 1;

      for (let leg = 0; leg < totalLegs; leg++) {
        for (let round = 0; round < singleRoundMatchesCount; round++) {
          const matchdayNumber = leg * singleRoundMatchesCount + round + 1;
          if (matchdayNumber > maxGroupMatchday) maxGroupMatchday = matchdayNumber;
          const timing = getScheduledInfo(matchdayNumber);

          for (let mIdx = 0; mIdx < matchesPerRound; mIdx++) {
            const rawHomeIndex = (round + mIdx) % (numTeams - 1);
            let rawAwayIndex = (numTeams - 1 - mIdx + round) % (numTeams - 1);
            if (mIdx === 0) rawAwayIndex = numTeams - 1;

            const homeIndex = leg === 0 ? rawHomeIndex : rawAwayIndex;
            const awayIndex = leg === 0 ? rawAwayIndex : rawHomeIndex;

            const home = groupTeams[homeIndex];
            const away = groupTeams[awayIndex];

            if (home.id !== 'BYE' && away.id !== 'BYE') {
              matches.push({
                id: `match-${group.groupName}-j${matchdayNumber}-${home.id}-vs-${away.id}`,
                matchdayNumber,
                homeTeamName: home.name,
                awayTeamName: away.name,
                scheduledDateLabel: timing.exactDateStr,
                stageLabel: `${group.groupName} (Jornada ${matchdayNumber})`,
                scheduledTime: timing.slot.time,
                scheduledDateTimeISO: timing.iso,
              });
            }
          }
        }
      }
    });

    const playoffTeamCount = groupCount * qualifiersPerGroup;
    const playoffNodes = generatePlayoffBracket(
      'preview',
      teamsList.slice(0, playoffTeamCount),
      matchMode,
      true,
      groupCount,
      qualifiersPerGroup
    );
    playoffNodes.forEach((node) => {
      let playoffRoundOffset = node.roundOrder;
      if (matchMode === 'IdaVuelta') {
        playoffRoundOffset = (node.roundOrder - 1) * 2 + (node.legType === 'VUELTA' ? 2 : 1);
      }
      const matchdayNumber = maxGroupMatchday + playoffRoundOffset;
      const timing = getScheduledInfo(matchdayNumber);

      matches.push({
        id: node.id,
        matchdayNumber,
        homeTeamName: node.homeTeamName,
        awayTeamName: node.awayTeamName,
        scheduledDateLabel: timing.exactDateStr,
        stageLabel: `Playoffs: ${node.roundName}`,
        scheduledTime: timing.slot.time,
        scheduledDateTimeISO: timing.iso,
      });
    });

    return matches;
  }

  // 📌 PREVISUALIZACIÓN DE LIGA
  const teams = [...teamsList];
  if (teams.length % 2 !== 0) teams.push({ id: 'BYE', name: 'DESCANSO (BYE)' });

  const numTeams = teams.length;
  const singleRoundMatchesCount = numTeams - 1;
  const matchesPerRound = numTeams / 2;
  const totalLegs = matchMode === 'IdaVuelta' ? 2 : 1;

  for (let leg = 0; leg < totalLegs; leg++) {
    for (let round = 0; round < singleRoundMatchesCount; round++) {
      const matchdayNumber = leg * singleRoundMatchesCount + round + 1;
      const timing = getScheduledInfo(matchdayNumber);

      for (let matchIndex = 0; matchIndex < matchesPerRound; matchIndex++) {
        const rawHomeIndex = (round + matchIndex) % (numTeams - 1);
        let rawAwayIndex = (numTeams - 1 - matchIndex + round) % (numTeams - 1);
        if (matchIndex === 0) rawAwayIndex = numTeams - 1;

        const homeIndex = leg === 0 ? rawHomeIndex : rawAwayIndex;
        const awayIndex = leg === 0 ? rawAwayIndex : rawHomeIndex;

        const home = teams[homeIndex];
        const away = teams[awayIndex];

        if (home.id !== 'BYE' && away.id !== 'BYE') {
          matches.push({
            id: `match-j${matchdayNumber}-${home.id}-vs-${away.id}`,
            matchdayNumber,
            homeTeamName: home.name,
            awayTeamName: away.name,
            scheduledDateLabel: timing.exactDateStr,
            stageLabel: `Fase Regular (Jornada ${matchdayNumber})`,
            scheduledTime: timing.slot.time,
            scheduledDateTimeISO: timing.iso,
          });
        }
      }
    }
  }

  return matches;
}

export function FixtureGenerator({ competition, enrolledTeams, matches = [] }: FixtureGeneratorProps) {
  const hasExistingMatches = matches && matches.length > 0;
  const [isFormMode, setIsFormMode] = useState<boolean>(!hasExistingMatches);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState<boolean>(false);

  // Form State
  const [format, setFormat] = useState<TournamentFormat>('Liga');
  const [groupCount, setGroupCount] = useState<number>(3); // Ej. 3 grupos para probar asimetría
  const [qualifiersPerGroup, setQualifiersPerGroup] = useState<number>(2);
  const [matchMode, setMatchMode] = useState<MatchMode>('PartidoUnico');

  const [startDate, setStartDate] = useState<string>(
    competition.fecha_inicio
      ? new Date(competition.fecha_inicio).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );

  const daysOfWeekOptions = [
    { id: 'Lunes', label: 'Lunes' },
    { id: 'Martes', label: 'Martes' },
    { id: 'Miercoles', label: 'Miércoles' },
    { id: 'Jueves', label: 'Jueves' },
    { id: 'Viernes', label: 'Viernes' },
    { id: 'Sabado', label: 'Sábado' },
    { id: 'Domingo', label: 'Domingo' },
  ];
  const [selectedDays, setSelectedDays] = useState<string[]>(['Martes', 'Jueves']);

  const availableTimes = ['19:00', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'];
  const [selectedTimes, setSelectedTimes] = useState<string[]>(['20:00', '21:30']);

  const [previewMatches, setPreviewMatches] = useState<MatchPreviewItem[] | null>(null);

  const [isPending, startTransition] = useTransition();
  const { crudState, startOperation, endSuccess, endError, resetAlert } = useCrudNotifier();

  const gameConfig = GAMES_CATALOG[competition.game_slug] || GAMES_CATALOG['eafc26'];
  const brandColor = gameConfig?.brandColor || '#00F0FF';

  // Mapear equipos inscritos para el algoritmo puro
  const teamsList: TeamItem[] = enrolledTeams.map((t) => ({
    id: t.team_id,
    name: t.team_name,
    tag: t.team_tag,
  }));

  // 📌 1. Cálculo en tiempo real de Distribución Asimétrica de Grupos
  const groupDistributionPreview: GroupDistributionResult[] = distributeTeamsIntoGroups(
    teamsList,
    groupCount
  );

  // 📌 2. Cálculo en tiempo real de Llaves de Playoff (Bracket Tree)
  const totalPlayoffTeamsCount = format === 'Hibrido' ? groupCount * qualifiersPerGroup : teamsList.length;
  const playoffBracketNodes: PlayoffMatchNode[] = generatePlayoffBracket(
    competition.id,
    teamsList.slice(0, totalPlayoffTeamsCount),
    matchMode,
    format === 'Hibrido',
    groupCount,
    qualifiersPerGroup
  );

  // Cruces de Sembrados Híbridos
  const hybridSeedings = generateHybridCrossSeedings(groupDistributionPreview, qualifiersPerGroup);

  // Verificar si hay resultados reportados en partidos guardados
  const hasReportedResults = matches.some(
    (m) =>
      ['POR_REVISAR', 'TERMINADO', 'DISPUTADO', 'FINALIZADO'].includes(m.status) ||
      (m.reported_score_home !== null && m.reported_score_home !== undefined) ||
      (m.reported_score_away !== null && m.reported_score_away !== undefined)
  );

  const handleToggleDay = (dayId: string) => {
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== dayId));
      }
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const handleToggleTime = (time: string) => {
    if (selectedTimes.includes(time)) {
      if (selectedTimes.length > 1) {
        setSelectedTimes(selectedTimes.filter((t) => t !== time));
      }
    } else {
      const updated = [...selectedTimes, time].sort();
      setSelectedTimes(updated);
    }
  };

  const sortedTimes = [...selectedTimes].sort();

  const handleStartRegeneration = () => {
    if (hasReportedResults) {
      setIsWarningModalOpen(true);
    } else {
      setIsFormMode(true);
    }
  };

  // Previsualización en memoria
  const handleGeneratePreview = () => {
    if (enrolledTeams.length < 2) {
      startOperation('Previsualización de Fixture');
      endError('Se requieren al menos 2 equipos inscritos confirmados para previsualizar el fixture.');
      return;
    }

    const timeSlotsConfig: TimeSlotConfig[] = [];
    selectedDays.forEach((day) => {
      sortedTimes.forEach((time) => {
        timeSlotsConfig.push({ dayLabel: day, time });
      });
    });

    if (timeSlotsConfig.length === 0) {
      timeSlotsConfig.push({ dayLabel: selectedDays[0] || 'Martes', time: '20:00' });
    }

    const scheduledMatches = generateFixtureSchedule(
      teamsList,
      startDate,
      timeSlotsConfig,
      matchMode,
      format,
      groupCount,
      qualifiersPerGroup
    );

    const matchesList: MatchPreviewItem[] = scheduledMatches.map((m) => ({
      id: m.id,
      jornada: m.matchdayNumber,
      homeTeamName: m.homeTeamName,
      awayTeamName: m.awayTeamName,
      scheduledDate: m.scheduledDateLabel,
      scheduledTime: `${m.scheduledTime} hrs (Simultáneo)`,
      stage: format === 'Hibrido' ? 'Fase de Grupos / Playoffs' : format === 'Playoff' ? 'Llave Eliminatoria' : 'Fase Regular',
    }));

    setPreviewMatches(matchesList);
    startOperation('Previsualización Generada');
    endSuccess(`Previsualización generada (${format}): ${scheduledMatches.length} enfrentamientos simultáneos (${matchMode === 'IdaVuelta' ? 'Ida y Vuelta' : 'Partido Único'}).`);
  };

  // ⚡ RECARGA AUTOMÁTICA EN TIEMPO REAL DESDE EL INICIO
  React.useEffect(() => {
    if (enrolledTeams.length >= 2) {
      const timeSlotsConfig: TimeSlotConfig[] = [];
      selectedDays.forEach((day) => {
        sortedTimes.forEach((time) => {
          timeSlotsConfig.push({ dayLabel: day, time });
        });
      });
      if (timeSlotsConfig.length === 0) {
        timeSlotsConfig.push({ dayLabel: selectedDays[0] || 'Martes', time: '20:00' });
      }

      const scheduledMatches = generateFixtureSchedule(
        teamsList,
        startDate,
        timeSlotsConfig,
        matchMode,
        format,
        groupCount,
        qualifiersPerGroup,
        selectedDays,
        selectedTimes
      );

      const matchesList: MatchPreviewItem[] = scheduledMatches.map((m) => ({
        id: m.id,
        jornada: m.matchdayNumber,
        homeTeamName: m.homeTeamName,
        awayTeamName: m.awayTeamName,
        scheduledDate: m.scheduledDateLabel,
        scheduledTime: `${m.scheduledTime} hrs (Simultáneo)`,
        stage: format === 'Hibrido' ? 'Fase de Grupos / Playoffs' : format === 'Playoff' ? 'Llave Eliminatoria' : 'Fase Regular',
      }));

      setPreviewMatches(matchesList);
    }
  }, [format, groupCount, qualifiersPerGroup, matchMode, startDate, selectedDays, selectedTimes, enrolledTeams.length]);

  // Guardar y Confirmar en MySQL
  const handleConfirmSaveFixture = (confirmedNameCheck?: string) => {
    startOperation(`Confirmar y Guardar Fixture: ${competition.name}`);
    startTransition(async () => {
      const res = await regenerateFixtureAction(competition.id, {
        startDate,
        selectedDays,
        selectedTimes,
        confirmedNameCheck,
        matchMode,
        format,
        groupCount,
        qualifiersPerGroup,
      });

      if (res.success) {
        setIsWarningModalOpen(false);
        setPreviewMatches(null);
        setIsFormMode(false);
        endSuccess((res as any).message || 'El fixture fue guardado exitosamente en la base de datos MySQL.');
      } else {
        endError(res.error || 'Error al guardar el fixture en MySQL.');
      }
    });
  };

  // 🚀 Acción para auto-avanzar ganador en llaves de Playoff
  const handleAdvanceWinner = (matchId: string, winnerId: string, winnerName: string) => {
    startOperation(`Auto-Avance de Ganador: ${winnerName}`);
    startTransition(async () => {
      const res = await advancePlayoffWinnerAction(matchId, winnerId, winnerName);
      if (res.success) {
        endSuccess(res.message || 'Ganador avanzado a la siguiente llave.');
      } else {
        endError(res.error || 'Error al avanzar ganador.');
      }
    });
  };

  // Agrupar partidos por Jornada para la Tabla
  const matchesByMatchday: Record<number, any[]> = {};
  matches.forEach((m) => {
    const num = m.matchday_number || m.matchday || 1;
    if (!matchesByMatchday[num]) matchesByMatchday[num] = [];
    matchesByMatchday[num].push(m);
  });

  return (
    <div className="space-y-6">
      <CrudAlertBanner state={crudState} onClose={resetAlert} />

      <RegenerateWarningModal
        isOpen={isWarningModalOpen}
        onClose={() => setIsWarningModalOpen(false)}
        onConfirm={(typedName) => handleConfirmSaveFixture(typedName)}
        competitionName={competition.name}
        isSubmitting={isPending}
      />

      {/* 📌 1. VISTA DE PARTIDOS (FORMATO TABLA CON AUTO-AVANCE) */}
      {hasExistingMatches && !isFormMode && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                  Fixture Oficial Publicado ({matches.length} Partidos)
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Enfrentamientos en simultáneo con soporte de Auto-Avance en llaves.
                </p>
              </div>
            </div>

            <Button
              onClick={handleStartRegeneration}
              className="bg-rose-950/80 text-rose-300 border border-rose-500/40 hover:bg-rose-900 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-rose-400" />
              <span>Modificar / Regenerar Fixture</span>
            </Button>
          </div>

          {/* Listado de Jornadas */}
          {Object.entries(matchesByMatchday).map(([jornadaNum, matchGroup]) => {
            const firstMatch = matchGroup[0];
            const dateStr = firstMatch?.scheduled_time || firstMatch?.scheduled_at;
            const formattedDate = dateStr
              ? new Date(dateStr).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
              : 'Fecha por definir';

            return (
              <div key={jornadaNum} className="glass-panel rounded-2xl p-4 space-y-3 shadow-xl overflow-x-auto">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-cyan-300 font-mono">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <span>Jornada {jornadaNum} ({matchGroup.length} Partidos Simultáneos)</span>
                  </div>
                  <Badge variant="cyan" className="text-[10px] font-mono uppercase">
                    {formattedDate}
                  </Badge>
                </div>

                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 text-[10px] uppercase">
                      <th className="p-2">ID</th>
                      <th className="p-2 text-right">Equipo Local</th>
                      <th className="p-2 text-center">Logo</th>
                      <th className="p-2 text-center">Resultado</th>
                      <th className="p-2 text-center">VS</th>
                      <th className="p-2 text-center">Resultado</th>
                      <th className="p-2 text-center">Logo</th>
                      <th className="p-2 text-left">Equipo Visitante</th>
                      <th className="p-2 text-center">Acciones & Auto-Avance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchGroup.map((m) => {
                      const homeName = m.home_team_name || m.home_team_id || m.team_home_id || 'Por Definir';
                      const awayName = m.away_team_name || m.away_team_id || m.team_away_id || 'Por Definir';
                      const homeId = m.home_team_id || m.team_home_id;
                      const awayId = m.away_team_id || m.team_away_id;
                      const homeScore = m.reported_score_home ?? m.score_home;
                      const awayScore = m.reported_score_away ?? m.score_away;
                      const isTerminado = m.status === 'TERMINADO' || m.status === 'FINALIZADO';

                      return (
                        <tr key={m.id} className="border-b border-white/5 hover:bg-slate-900/40 transition-colors">
                          <td className="p-2 text-slate-500 font-bold text-[10px]">{m.id.slice(-6)}</td>
                          <td className="p-2 text-right font-black text-white">{homeName}</td>
                          <td className="p-2 text-center">
                            <div className="w-7 h-7 mx-auto rounded-lg bg-slate-900 border border-purple-500/40 flex items-center justify-center font-black text-[10px] text-purple-300">
                              {homeName.slice(0, 3).toUpperCase()}
                            </div>
                          </td>
                          <td className="p-2 text-center font-black text-sm">
                            {isTerminado ? (
                              <span className="text-emerald-400">{homeScore}</span>
                            ) : (
                              <span className="input-theme px-2 py-0.5 rounded text-slate-400 font-mono text-xs opacity-70">-</span>
                            )}
                          </td>
                          <td className="p-2 text-center font-black text-slate-500 text-[10px]">VS</td>
                          <td className="p-2 text-center font-black text-sm">
                            {isTerminado ? (
                              <span className="text-emerald-400">{awayScore}</span>
                            ) : (
                              <span className="input-theme px-2 py-0.5 rounded text-slate-400 font-mono text-xs opacity-70">-</span>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            <div className="w-7 h-7 mx-auto rounded-lg bg-slate-900 border border-cyan-500/40 flex items-center justify-center font-black text-[10px] text-cyan-300">
                              {awayName.slice(0, 3).toUpperCase()}
                            </div>
                          </td>
                          <td className="p-2 text-left font-black text-white">{awayName}</td>

                          {/* Acciones & Auto-Avance */}
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Botones de Declarar Ganador / Auto-Avance */}
                              {homeId && homeId !== 'BYE' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleAdvanceWinner(m.id, homeId, homeName)}
                                  disabled={isPending}
                                  className="text-[10px] text-purple-300 hover:bg-purple-950 px-2 py-1 h-auto"
                                  title={`Avanzar a ${homeName}`}
                                >
                                  Gana {homeName.slice(0, 6)}
                                </Button>
                              )}

                              {awayId && awayId !== 'BYE' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleAdvanceWinner(m.id, awayId, awayName)}
                                  disabled={isPending}
                                  className="text-[10px] text-cyan-300 hover:bg-cyan-950 px-2 py-1 h-auto"
                                  title={`Avanzar a ${awayName}`}
                                >
                                  Gana {awayName.slice(0, 6)}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {/* ⚙️ 2. MOTOR DE CONFIGURACIÓN DEL FIXTURE (FORMULARIO, REPARTO ASIMÉTRICO Y PREVISUALIZACIÓN BRACKET) */}
      {(!hasExistingMatches || isFormMode) && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {hasExistingMatches && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                onClick={() => setIsFormMode(false)}
                className="text-xs font-bold text-slate-400 hover:text-white"
              >
                ← Cancelar y Volver a Tabla de Partidos
              </Button>
            </div>
          )}

          <Card className="glass-panel p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-950 border border-purple-500/40 text-purple-400">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black uppercase text-white tracking-wider">
                    ⚙️ Motor de Configuración del Fixture
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Define formato, reparto asimétrico de grupos y llaves de playoff eSports.
                  </p>
                </div>
              </div>

              <Badge className="bg-purple-950 text-purple-300 border-purple-500/40 font-mono text-[10px] uppercase">
                {enrolledTeams.length} Clubes Inscritos
              </Badge>
            </div>

            {/* Formato del Torneo */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase text-slate-300 tracking-wider block flex items-center gap-2">
                <Trophy className="w-4 h-4 text-purple-400" /> Formato del Torneo:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'Liga', label: 'Liga (Tabla de Posiciones)', desc: 'Todos contra todos por puntos acumulatorios' },
                  { id: 'Playoff', label: 'Playoff (Eliminación Directa)', desc: 'Llaves de eliminación directa hasta la final' },
                  { id: 'Hibrido', label: 'Híbrido (Grupos + Playoff)', desc: 'Fase de grupos inicial seguida de llaves' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormat(opt.id as TournamentFormat)}
                    className={`p-3.5 rounded-xl text-left border transition-all ${
                      format === opt.id ? 'bg-purple-950/80 border-purple-500 text-white shadow-lg scale-[1.02]' : 'glass-panel-hover text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between font-black text-xs">
                      <span>{opt.label}</span>
                      {format === opt.id && <Check className="w-4 h-4 text-purple-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 font-normal mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 📌 1. CONFIGURACIÓN DINÁMICA HÍBRIDA & PREVISUALIZACIÓN DE REPARTO ASIMÉTRICO */}
            {format === 'Hibrido' && (
              <div className="p-5 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                  <span className="text-xs font-black uppercase text-purple-300 tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    Configuración de Fase de Grupos Híbrida:
                  </span>
                  <Badge className="bg-purple-900/60 text-purple-300 text-[10px] font-mono">
                    Soporte de Asimetría Activo
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Input Cantidad de Grupos */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 uppercase block font-mono">
                      Cantidad de Grupos:
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={16}
                      value={groupCount}
                      onChange={(e) => setGroupCount(Math.max(2, Number(e.target.value)))}
                      className="input-theme w-full p-2.5 rounded-xl font-mono text-xs font-bold text-cyan-300"
                    />
                  </div>

                  {/* Input Clasificados por Grupo */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 uppercase block font-mono">
                      Clasificados por Grupo (a Playoffs):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={qualifiersPerGroup}
                      onChange={(e) => setQualifiersPerGroup(Math.max(1, Number(e.target.value)))}
                      className="input-theme w-full p-2.5 rounded-xl font-mono text-xs font-bold text-emerald-400"
                    />
                  </div>
                </div>

                {/* Previsualización del Reparto Asimétrico de Cupos por Grupo */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-3">
                  <span className="text-[11px] font-mono font-bold uppercase text-slate-300 block flex items-center gap-2">
                    📊 Previsualización de Distribución Asimétrica ({enrolledTeams.length} Equipos en {groupDistributionPreview.length} Grupos):
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {groupDistributionPreview.map((g) => (
                      <div key={g.groupName} className="p-3 rounded-lg bg-slate-900/90 border border-white/10 space-y-1">
                        <div className="flex items-center justify-between border-b border-white/10 pb-1">
                          <span className="text-xs font-black uppercase text-cyan-400">{g.groupName}</span>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">{g.count} Equipos</span>
                        </div>
                        <div className="space-y-1 pt-1">
                          {g.teams.map((t, idx) => (
                            <div key={t.id} className="text-[10px] font-mono text-slate-300 truncate">
                              #{idx + 1} {t.name} <span className="text-slate-500">[{t.tag || 'TEAM'}]</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Previsualización de Cruces Híbridos */}
                <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-purple-300 block">
                    ⚔️ Cruces Sembrados de Playoff ({hybridSeedings.length} Enfrentamientos Iniciales):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {hybridSeedings.map((s, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded bg-slate-900 border border-purple-500/40 text-[10px] font-mono text-white">
                        <strong className="text-cyan-300">{s.homeSeed}</strong> VS <strong className="text-emerald-300">{s.awaySeed}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Modalidad de Encuentro */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-300 tracking-wider block flex items-center gap-2">
                <Swords className="w-4 h-4 text-cyan-400" /> Modalidad de Encuentro:
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMatchMode('PartidoUnico')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase border ${matchMode === 'PartidoUnico' ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md' : 'glass-panel-hover text-slate-300'}`}
                >
                  Partido Único
                </button>
                <button
                  type="button"
                  onClick={() => setMatchMode('IdaVuelta')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase border ${matchMode === 'IdaVuelta' ? 'bg-purple-600 text-white border-purple-400 shadow-md' : 'glass-panel-hover text-slate-300'}`}
                >
                  Ida y Vuelta
                </button>
              </div>
            </div>

            {/* Calendario Oficial */}
            <div className="space-y-4 pt-2 border-t border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase block">Fecha Oficial de Inicio:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-theme w-full p-2.5 rounded-xl font-mono text-xs"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase block">Días de Enfrentamiento:</label>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {daysOfWeekOptions.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleToggleDay(d.label)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border ${selectedDays.includes(d.label) ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50' : 'glass-panel-hover text-slate-400'}`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> Horarios Simultáneos Disponibles:
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {availableTimes.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleToggleTime(time)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border ${selectedTimes.includes(time) ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60' : 'glass-panel-hover text-slate-400'}`}
                    >
                      {time} hrs
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <Button
                onClick={() => {
                  const elem = document.getElementById('matchmaking-preview-container');
                  if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs px-6 py-3 rounded-xl shadow-xl flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" /> <span>Previsualización en Vivo (Activa) ⚡</span>
              </Button>
            </div>
          </Card>

          {/* 📌 2. PREVISUALIZACIÓN DE MATCHMAKING DINÁMICA SEGÚN FORMATO */}
          {previewMatches && (
            <div id="matchmaking-preview-container">
              <MatchmakingPreview
                format={format}
                teams={teamsList}
                groupCount={groupCount}
                qualifiersPerGroup={qualifiersPerGroup}
                startDateISO={startDate}
                selectedDays={selectedDays}
                selectedTimes={selectedTimes}
                matchMode={matchMode}
                isSubmitting={isPending}
                onConfirmSave={() => {
                  if (hasReportedResults) {
                    setIsWarningModalOpen(true);
                  } else {
                    handleConfirmSaveFixture();
                  }
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
