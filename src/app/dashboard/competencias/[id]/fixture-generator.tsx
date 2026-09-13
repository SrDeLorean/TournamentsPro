'use client';

import React, { useState, useTransition } from 'react';
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
  calculateHybridPlayoffStructure,
  TeamItem,
  GroupDistributionResult,
} from '@/lib/matchmaking-bracket';
import { RegenerateWarningModal } from './regenerate-warning-modal';
import { MatchmakingPreview } from './matchmaking-preview';
import { CrudAlertBanner, useCrudNotifier } from '@/components/ui/crud-alert';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar, Clock, Sparkles, Trophy, Swords, Layers, Settings, Check, RefreshCw, Plus, X, GitBranch, Edit3
} from 'lucide-react';
import { PlayoffBracket, type PlayoffMatch } from '@/components/tournaments/playoff-bracket';

const MatchReportModal = dynamic(
  () => import('@/components/matches/match-report-modal').then((m) => m.MatchReportModal),
  { ssr: false }
);

interface FixtureGeneratorProps {
  competition: CompetitionData;
  enrolledTeams: CompetitionTeamData[];
  matches?: StoredMatch[];
}

interface StoredMatch {
  id: string;
  status?: string | null;
  reported_score_home?: number | null;
  reported_score_away?: number | null;
  matchday_number?: number | null;
  matchday?: number | null;
  scheduled_time?: string | null;
  scheduled_at?: string | null;
  home_team_name?: string | null;
  home_team_id?: string | null;
  team_home_id?: string | null;
  away_team_name?: string | null;
  away_team_id?: string | null;
  team_away_id?: string | null;
  score_home?: number | null;
  score_away?: number | null;
  stage?: string | null;
  round_name?: string | null;
  group_name?: string | null;
  next_match_id?: string | null;
  next_match_slot?: string | null;
}

export type TournamentFormat = 'Liga' | 'Playoff' | 'Hibrido';
export type MatchMode = 'IdaVuelta' | 'PartidoUnico' | 'MejorDe3';

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
  selectedTimes?: string[],
  playoffMatchMode?: MatchMode
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
    const playoffMode = playoffMatchMode || matchMode;
    const playoffNodes = generatePlayoffBracket('preview', teamsList, playoffMode);
    playoffNodes.forEach((node) => {
      let matchdayNumber = node.roundOrder;
      if (playoffMode === 'IdaVuelta') {
        matchdayNumber = (node.roundOrder - 1) * 2 + (node.legType === 'VUELTA' ? 2 : 1);
      } else if (playoffMode === 'MejorDe3') {
        const jNum = /-j([123])$/i.exec(node.id)?.[1] || '1';
        matchdayNumber = (node.roundOrder - 1) * 3 + Number(jNum);
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
    // Grupos: SOLO IDA o IDA Y VUELTA (nunca Bo3)
    const groupMatchMode = matchMode === 'IdaVuelta' ? 'IdaVuelta' : 'PartidoUnico';
    const totalLegs = groupMatchMode === 'IdaVuelta' ? 2 : 1;

    groups.forEach((group) => {
      const groupTeams = [...group.teams];
      if (groupTeams.length % 2 !== 0) groupTeams.push({ id: 'BYE', name: 'DESCANSO (BYE)' });

      const numTeams = groupTeams.length;
      const singleRoundMatchesCount = numTeams - 1;
      const matchesPerRound = numTeams / 2;

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

    const hybridStructure = calculateHybridPlayoffStructure(groupCount, qualifiersPerGroup);
    const playoffTeamCount = hybridStructure.bracketSize;
    // Playoff de Híbrido: soporta PartidoUnico, IdaVuelta o MejorDe3
    const effectivePlayoffMatchMode = playoffMatchMode || matchMode;
    const playoffNodes = generatePlayoffBracket(
      'preview',
      teamsList.slice(0, playoffTeamCount),
      effectivePlayoffMatchMode,
      true,
      groupCount,
      qualifiersPerGroup
    );
    playoffNodes.forEach((node) => {
      let playoffRoundOffset = node.roundOrder;
      if (effectivePlayoffMatchMode === 'IdaVuelta') {
        playoffRoundOffset = (node.roundOrder - 1) * 2 + (node.legType === 'VUELTA' ? 2 : 1);
      } else if (effectivePlayoffMatchMode === 'MejorDe3') {
        const jNum = /-j([123])$/i.exec(node.id)?.[1] || '1';
        playoffRoundOffset = (node.roundOrder - 1) * 3 + Number(jNum);
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

  // 📌 PREVISUALIZACIÓN DE LIGA (solo PartidoUnico o IdaVuelta, nunca Bo3)
  const teams = [...teamsList];
  if (teams.length % 2 !== 0) teams.push({ id: 'BYE', name: 'DESCANSO (BYE)' });

  const numTeams = teams.length;
  const singleRoundMatchesCount = numTeams - 1;
  const matchesPerRound = numTeams / 2;
  const leagueMatchMode = matchMode === 'IdaVuelta' ? 'IdaVuelta' : 'PartidoUnico';
  const totalLegs = leagueMatchMode === 'IdaVuelta' ? 2 : 1;

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
  const initialFormat = ((competition.format || competition.mode_format) as TournamentFormat) || 'Liga';
  const initialMatchMode = ((competition.match_mode || (competition as any).matchMode) as MatchMode) || 'PartidoUnico';
  const initialPlayoffMatchMode = (((competition as any).playoff_match_mode || (competition as any).playoffMatchMode) as MatchMode) || 'PartidoUnico';

  const [format, setFormat] = useState<TournamentFormat>(
    initialFormat === 'Playoff' || initialFormat === 'Hibrido' ? initialFormat : 'Liga'
  );
  const [groupCount, setGroupCount] = useState<number>(3); // Ej. 3 grupos para probar asimetría
  const [qualifiersPerGroup, setQualifiersPerGroup] = useState<number>(2);
  const [matchMode, setMatchMode] = useState<MatchMode>(() => {
    if (initialFormat === 'Liga' && initialMatchMode === 'MejorDe3') return 'PartidoUnico';
    return initialMatchMode === 'IdaVuelta' || initialMatchMode === 'MejorDe3' ? initialMatchMode : 'PartidoUnico';
  });
  const [playoffMatchMode, setPlayoffMatchMode] = useState<MatchMode>(
    initialPlayoffMatchMode === 'IdaVuelta' || initialPlayoffMatchMode === 'MejorDe3' ? initialPlayoffMatchMode : 'PartidoUnico'
  );

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

  // Horarios de Partidos interactivos
  const [selectedTimes, setSelectedTimes] = useState<string[]>(['20:00', '21:30']);
  const [newTimeInput, setNewTimeInput] = useState<string>('');
  const [timeError, setTimeError] = useState<string | null>(null);
  const [reportModalMatch, setReportModalMatch] = useState<any | null>(null);

  const handleAddTime = () => {
    const raw = newTimeInput.trim();
    if (!raw) return;
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(raw)) {
      setTimeError('Formato inválido. Ingresa hora 24h ej. 22:40');
      return;
    }
    const [h, m] = raw.split(':');
    const formatted = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    if (selectedTimes.includes(formatted)) {
      setTimeError('El horario ya está en la lista');
      return;
    }
    setTimeError(null);
    setSelectedTimes((prev) => [...prev, formatted].sort());
    setNewTimeInput('');
  };

  const handleRemoveTime = (timeToRemove: string) => {
    setSelectedTimes((prev) => prev.filter((t) => t !== timeToRemove));
  };

  const [isPending, startTransition] = useTransition();
  const { crudState, startOperation, endSuccess, endError, resetAlert } = useCrudNotifier();

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

  // Cierre Matemático de Playoff y Cruces de Sembrados Híbridos
  const hybridPlayoffStructure = calculateHybridPlayoffStructure(groupCount, qualifiersPerGroup);
  const hybridSeedings = generateHybridCrossSeedings(groupDistributionPreview, qualifiersPerGroup);

  // Verificar si hay resultados reportados reales por usuarios en partidos guardados
  const hasReportedResults = matches.some((m) => {
    const homeName = (m.home_team_name || '').toLowerCase();
    const awayName = (m.away_team_name || '').toLowerCase();
    const isBye =
      homeName.includes('bye') ||
      homeName.includes('descanso') ||
      awayName.includes('bye') ||
      awayName.includes('descanso');

    if (isBye && m.reported_score_home === null && m.reported_score_away === null) {
      return false;
    }

    return (
      ['POR_REVISAR', 'DISPUTADO', 'FINALIZADO'].includes(m.status ?? '') ||
      (m.status === 'TERMINADO' && !isBye) ||
      (m.reported_score_home !== null && m.reported_score_home !== undefined) ||
      (m.reported_score_away !== null && m.reported_score_away !== undefined)
    );
  });

  const handleToggleDay = (dayId: string) => {
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== dayId));
      }
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const handleStartRegeneration = () => {
    // Al pulsar Modificar, abrimos directamente el panel de ajustes para que el usuario pueda editar parámetros
    setIsFormMode(true);
  };

  const hasPreview = enrolledTeams.length >= 2;

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
        playoffMatchMode: format === 'Hibrido' ? playoffMatchMode : undefined,
        format,
        groupCount,
        qualifiersPerGroup,
      });

      if (res.success) {
        setIsWarningModalOpen(false);
        setIsFormMode(false);
        endSuccess(res.message || 'El fixture fue guardado exitosamente en la base de datos MySQL.');
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
  const matchesByMatchday: Record<number, StoredMatch[]> = {};
  matches.forEach((m) => {
    const num = m.matchday_number || m.matchday || 1;
    if (!matchesByMatchday[num]) matchesByMatchday[num] = [];
    matchesByMatchday[num].push(m);
  });

  const matchdayKeys = Object.keys(matchesByMatchday).map(Number).sort((a, b) => a - b);
  const [currentMatchdayIndex, setCurrentMatchdayIndex] = useState<number>(0);
  const currentMatchdayNum = matchdayKeys[currentMatchdayIndex] || 1;
  const currentMatchGroup = matchesByMatchday[currentMatchdayNum] || [];

  const isPlayoffOrHybrid =
    format === 'Playoff' ||
    format === 'Hibrido' ||
    competition.format === 'Playoff' ||
    competition.format === 'Hibrido' ||
    (competition as any).mode_format === 'Playoff' ||
    (competition as any).mode_format === 'Hibrido';

  const [activeViewTab, setActiveViewTab] = useState<'BRACKET' | 'TABLE'>(
    isPlayoffOrHybrid ? 'BRACKET' : 'TABLE'
  );

  const playoffMatches: PlayoffMatch[] = matches.map((m) => ({
    id: m.id,
    home_team_id: m.home_team_id || m.team_home_id,
    away_team_id: m.away_team_id || m.team_away_id,
    home_team_name: m.home_team_name || 'Por Definir',
    home_team_tag: (m.home_team_name || 'LOC').substring(0, 3).toUpperCase(),
    away_team_name: m.away_team_name || 'Por Definir',
    away_team_tag: (m.away_team_name || 'VIS').substring(0, 3).toUpperCase(),
    score_home: m.reported_score_home ?? m.score_home ?? null,
    score_away: m.reported_score_away ?? m.score_away ?? null,
    status: m.status || 'PENDIENTE',
    round_name: m.round_name || (m.stage === 'PLAYOFF' ? 'Playoff' : `Jornada ${m.matchday_number || m.matchday || 1}`),
    matchday: m.matchday_number || m.matchday || 1,
    scheduled_time: m.scheduled_time || m.scheduled_at,
  }));

  return (
    <div className="competition-fixture-generator space-y-6">
      <CrudAlertBanner state={crudState} onClose={resetAlert} />

      <RegenerateWarningModal
        isOpen={isWarningModalOpen}
        onClose={() => setIsWarningModalOpen(false)}
        onConfirm={(typedName) => handleConfirmSaveFixture(typedName)}
        competitionName={competition.name}
        isSubmitting={isPending}
      />

      {/* 📌 1. VISTA DE PARTIDOS (FORMATO BRACKET O TABLA CON AUTO-AVANCE) */}
      {hasExistingMatches && !isFormMode && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[var(--app-accent-2-soft)]/80 border border-[var(--app-accent-2)]/40 text-[var(--app-accent-2)]">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-[var(--text-heading)] tracking-wider flex items-center gap-2">
                  Fixture Oficial Publicado ({matches.length} Partidos)
                </h3>
                <p className="text-xs text-[var(--text-muted)] font-[family-name:var(--font-active)]">
                  {isPlayoffOrHybrid
                    ? 'Cuadro de eliminación con soporte de Auto-Avance de llaves en vivo.'
                    : 'Enfrentamientos en simultáneo oficiales de la competencia.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isPlayoffOrHybrid && (
                <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--app-surface-2)]/60 border border-[var(--text-heading)]/10">
                  <button
                    type="button"
                    onClick={() => setActiveViewTab('BRACKET')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                      activeViewTab === 'BRACKET'
                        ? 'bg-[var(--app-accent)] text-[var(--text-heading)] shadow-md'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                    }`}
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>Árbol de Llaves</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveViewTab('TABLE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                      activeViewTab === 'TABLE'
                        ? 'bg-[var(--app-accent)] text-[var(--text-heading)] shadow-md'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Tabla de Jornadas</span>
                  </button>
                </div>
              )}

              <Button
                onClick={handleStartRegeneration}
                className="bg-[var(--app-danger-soft)]/80 text-[var(--app-danger)] border border-[var(--app-danger)]/40 hover:bg-[var(--app-danger-soft-strong)] font-black text-xs px-4 py-2 rounded-xl shadow-lg flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4 text-[var(--app-danger)]" />
                <span>Modificar / Regenerar</span>
              </Button>
            </div>
          </div>

          {/* Renderizado condicional: Árbol de Llaves o Tabla de Jornadas */}
          {activeViewTab === 'BRACKET' && isPlayoffOrHybrid ? (
            <div className="space-y-4">
              <PlayoffBracket
                matches={playoffMatches}
                matchMode={matchMode}
                onAdvanceWinner={handleAdvanceWinner}
                isPending={isPending}
              />
            </div>
          ) : (
            matchdayKeys.length > 0 && (
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMatchdayIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentMatchdayIndex === 0}
                  className="px-3 border-[var(--text-heading)]/10 bg-[var(--app-surface-2)]/50 hover:bg-[var(--app-surface-2)] text-[var(--text-secondary)]"
                >
                  {'<'}
                </Button>
                
                <div className="flex gap-1">
                  {matchdayKeys.map((jornadaNum, idx) => (
                    <Button
                      key={jornadaNum}
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMatchdayIndex(idx)}
                      className={`w-10 h-10 p-0 border-[var(--text-heading)]/10 ${
                        idx === currentMatchdayIndex
                          ? 'bg-[var(--app-accent)] text-[var(--text-heading)] font-black border-[var(--app-accent)]'
                          : 'bg-[var(--app-surface-2)]/50 hover:bg-[var(--app-surface-2)] text-[var(--text-muted)]'
                      }`}
                    >
                      {jornadaNum}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMatchdayIndex((prev) => Math.min(matchdayKeys.length - 1, prev + 1))}
                  disabled={currentMatchdayIndex === matchdayKeys.length - 1}
                  className="px-3 border-[var(--text-heading)]/10 bg-[var(--app-surface-2)]/50 hover:bg-[var(--app-surface-2)] text-[var(--text-secondary)]"
                >
                  {'>'}
                </Button>
              </div>

              {/* Contenido de la Jornada Actual */}
              {(() => {
                const firstMatch = currentMatchGroup[0];
                const dateStr = firstMatch?.scheduled_time || firstMatch?.scheduled_at;
                const formattedDate = dateStr
                  ? new Date(dateStr).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                  : 'Fecha por definir';

                const stageOrGroupLabel = currentMatchGroup.some(m => m.stage === 'PLAYOFF' || m.round_name)
                  ? (currentMatchGroup[0]?.round_name || 'Playoffs')
                  : currentMatchGroup[0]?.group_name ? currentMatchGroup[0]?.group_name : 'Fase Regular';

                return (
                  <div className="glass-panel rounded-2xl p-4 space-y-3 shadow-xl overflow-x-auto">
                    <div className="flex items-center justify-between border-b border-[var(--text-heading)]/10 pb-2.5">
                      <div className="flex items-center gap-2 text-xs font-black uppercase text-[var(--app-accent)] font-[family-name:var(--font-active)]">
                        <Calendar className="w-4 h-4 text-[var(--app-accent)]" />
                        <span>Jornada {currentMatchdayNum} · {stageOrGroupLabel} ({currentMatchGroup.length} Partidos)</span>
                      </div>
                      <Badge variant="cyan" className="text-[10px] font-[family-name:var(--font-active)] uppercase">
                        {formattedDate}
                      </Badge>
                    </div>

                    <table className="w-full text-left text-xs font-[family-name:var(--font-active)]">
                      <thead>
                        <tr className="border-b border-[var(--text-heading)]/10 text-[var(--text-muted)] text-[10px] uppercase">
                          <th className="p-2">ID</th>
                          <th className="p-2 text-center">Fase / Grupo</th>
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
                        {currentMatchGroup.map((m) => {
                          const homeName = m.home_team_name || m.home_team_id || m.team_home_id || 'Por Definir';
                          const awayName = m.away_team_name || m.away_team_id || m.team_away_id || 'Por Definir';
                          const homeId = m.home_team_id || m.team_home_id;
                          const awayId = m.away_team_id || m.team_away_id;
                          const homeScore = m.reported_score_home ?? m.score_home;
                          const awayScore = m.reported_score_away ?? m.score_away;
                          const isTerminado = m.status === 'TERMINADO' || m.status === 'FINALIZADO';

                          return (
                            <tr key={m.id} className="border-b border-[var(--text-heading)]/5 hover:bg-[var(--app-surface-2)]/40 transition-colors">
                              <td className="p-2 text-[var(--text-muted)] font-bold text-[10px]">{m.id.slice(-6)}</td>
                              <td className="p-2 text-center">
                                {m.stage === 'PLAYOFF' || m.round_name ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[var(--app-accent-2-soft)] text-[var(--app-accent-2)] border border-[var(--app-accent-2)]/30 whitespace-nowrap">
                                    {m.round_name || 'Playoff'}
                                  </span>
                                ) : m.group_name ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[var(--app-accent-soft)] text-[var(--app-accent)] border border-[var(--app-accent)]/30 whitespace-nowrap">
                                    {m.group_name}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-[var(--text-muted)] uppercase">Regular</span>
                                )}
                              </td>
                              <td className="p-2 text-right font-black text-[var(--text-heading)]">{homeName}</td>
                              <td className="p-2 text-center">
                                <div className="w-7 h-7 mx-auto rounded-lg bg-[var(--app-surface-2)] border border-[var(--app-accent-2)]/40 flex items-center justify-center font-black text-[10px] text-[var(--app-accent-2)]">
                                  {homeName.slice(0, 3).toUpperCase()}
                                </div>
                              </td>
                              <td className="p-2 text-center font-black text-sm">
                                {isTerminado ? (
                                  <span className="text-[var(--app-positive)]">{homeScore}</span>
                                ) : (
                                  <span className="input-theme px-2 py-0.5 rounded text-[var(--text-muted)] font-[family-name:var(--font-active)] text-xs opacity-70">-</span>
                                )}
                              </td>
                              <td className="p-2 text-center font-black text-[var(--text-muted)] text-[10px]">VS</td>
                              <td className="p-2 text-center font-black text-sm">
                                {isTerminado ? (
                                  <span className="text-[var(--app-positive)]">{awayScore}</span>
                                ) : (
                                  <span className="input-theme px-2 py-0.5 rounded text-[var(--text-muted)] font-[family-name:var(--font-active)] text-xs opacity-70">-</span>
                                )}
                              </td>
                              <td className="p-2 text-center">
                                <div className="w-7 h-7 mx-auto rounded-lg bg-[var(--app-surface-2)] border border-[var(--app-accent)]/40 flex items-center justify-center font-black text-[10px] text-[var(--app-accent)]">
                                  {awayName.slice(0, 3).toUpperCase()}
                                </div>
                              </td>
                              <td className="p-2 text-left font-black text-[var(--text-heading)]">{awayName}</td>
                              <td className="p-2 text-center">
                                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                  {!homeName.toLowerCase().includes('bye') && !awayName.toLowerCase().includes('bye') && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setReportModalMatch({
                                        id: m.id,
                                        homeTeam: homeName,
                                        awayTeam: awayName,
                                        homeScore: m.reported_score_home ?? m.score_home,
                                        awayScore: m.reported_score_away ?? m.score_away,
                                        gameSlug: competition.game_slug,
                                        tournamentName: competition.name,
                                        competitionId: competition.id,
                                      })}
                                      className="text-[10px] font-bold px-2 py-1 h-auto gap-1 border-[var(--app-accent)]/50 text-[var(--app-accent)] hover:bg-[var(--app-accent-soft)]"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      <span>{isTerminado ? 'Modificar' : 'Reportar'}</span>
                                    </Button>
                                  )}

                                  {homeId && homeId !== 'BYE' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleAdvanceWinner(m.id, homeId, homeName)}
                                      disabled={isPending}
                                      className="text-[10px] text-[var(--app-accent-2)] hover:bg-[var(--app-accent-2-soft)] px-2 py-1 h-auto"
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
                                      className="text-[10px] text-[var(--app-accent)] hover:bg-[var(--app-accent-soft)] px-2 py-1 h-auto"
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
              })()}
            </div>
          ))}
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
                className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-heading)]"
              >
                ← Cancelar y Volver a Tabla de Partidos
              </Button>
            </div>
          )}

          <Card className="glass-panel p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--text-heading)]/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[var(--app-accent-2-soft)] border border-[var(--app-accent-2)]/40 text-[var(--app-accent-2)]">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black uppercase text-[var(--text-heading)] tracking-wider">
                    ⚙️ Motor de Configuración del Fixture
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] font-[family-name:var(--font-active)]">
                    Define formato, reparto asimétrico de grupos y llaves de playoff eSports.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge className="bg-[var(--app-accent-2-soft)] text-[var(--app-accent-2)] border-[var(--app-accent-2)]/40 font-[family-name:var(--font-active)] text-[10px] uppercase">
                  {enrolledTeams.length} Clubes Inscritos
                </Badge>
                <Button
                  onClick={() => {
                    if (hasReportedResults) {
                      setIsWarningModalOpen(true);
                    } else {
                      handleConfirmSaveFixture();
                    }
                  }}
                  disabled={isPending || enrolledTeams.length < 2}
                  className="bg-[var(--app-positive)] hover:bg-[var(--app-positive)] text-[var(--accent-contrast)] font-black text-xs px-4 py-2 rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isPending ? 'Guardando...' : 'Guardar Fixture'}</span>
                </Button>
              </div>
            </div>

            {/* Formato del Torneo */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase text-[var(--text-secondary)] tracking-wider block flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[var(--app-accent-2)]" /> Formato del Torneo:
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
                    onClick={() => {
                      const nextFormat = opt.id as TournamentFormat;
                      setFormat(nextFormat);
                      if (nextFormat === 'Liga' && matchMode === 'MejorDe3') {
                        setMatchMode('PartidoUnico');
                      }
                    }}
                    className={`p-3.5 rounded-xl text-left border transition-all ${
                      format === opt.id ? 'bg-[var(--app-accent-2-soft)]/80 border-[var(--app-accent-2)] text-[var(--text-heading)] shadow-lg scale-[1.02]' : 'glass-panel-hover text-[var(--text-muted)]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-black text-xs">
                      <span>{opt.label}</span>
                      {format === opt.id && <Check className="w-4 h-4 text-[var(--app-accent-2)]" />}
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] font-normal mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 📌 1. CONFIGURACIÓN DINÁMICA HÍBRIDA & PREVISUALIZACIÓN DE REPARTO ASIMÉTRICO */}
            {format === 'Hibrido' && (
              <div className="p-5 rounded-2xl bg-[var(--app-accent-2-soft)]/30 border border-[var(--app-accent-2)]/30 space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-[var(--app-accent-2)]/20 pb-3">
                  <span className="text-xs font-black uppercase text-[var(--app-accent-2)] tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[var(--app-accent-2)]" />
                    Configuración de Fase de Grupos Híbrida:
                  </span>
                  <Badge className="bg-[var(--app-accent-2-soft-strong)] text-[var(--app-accent-2)] text-[10px] font-[family-name:var(--font-active)]">
                    Soporte de Asimetría Activo
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Input Cantidad de Grupos */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase block font-[family-name:var(--font-active)]">
                      Cantidad de Grupos:
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={16}
                      value={groupCount}
                      onChange={(e) => setGroupCount(Math.max(2, Number(e.target.value)))}
                      className="input-theme w-full p-2.5 rounded-xl font-[family-name:var(--font-active)] text-xs font-bold text-[var(--app-accent)]"
                    />
                  </div>

                  {/* Input Clasificados por Grupo */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase block font-[family-name:var(--font-active)]">
                      Clasificados por Grupo (a Playoffs):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={qualifiersPerGroup}
                      onChange={(e) => setQualifiersPerGroup(Math.max(1, Number(e.target.value)))}
                      className="input-theme w-full p-2.5 rounded-xl font-[family-name:var(--font-active)] text-xs font-bold text-[var(--app-positive)]"
                    />
                  </div>
                </div>

                {/* 🏆 Cierre Matemático de Playoff eSports (Potencias de 2 & Wildcards) */}
                <div className={`p-4 rounded-xl border transition-all ${
                  hybridPlayoffStructure.wildcardCount > 0
                    ? 'bg-[var(--app-accent-2-soft)]/40 border-[var(--app-accent-2)]/60 shadow-lg'
                    : 'bg-[var(--app-surface-2)]/80 border-[var(--text-heading)]/10'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--text-heading)]/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[var(--app-accent-2)]" />
                      <span className="text-xs font-black uppercase text-[var(--text-heading)] tracking-wider">
                        Cierre Matemático de Playoff: {hybridPlayoffStructure.bracketSize} Clubes ({hybridPlayoffStructure.initialRoundName})
                      </span>
                    </div>
                    <Badge className={
                      hybridPlayoffStructure.wildcardCount > 0
                        ? 'bg-[var(--app-accent-2)] text-[var(--accent-contrast)] text-[10px] font-bold uppercase'
                        : 'bg-[var(--app-positive)]/20 text-[var(--app-positive)] border-[var(--app-positive)]/40 text-[10px] font-bold uppercase'
                    }>
                      {hybridPlayoffStructure.wildcardCount > 0
                        ? `+${hybridPlayoffStructure.wildcardCount} ${hybridPlayoffStructure.wildcardLabel}`
                        : 'Cuadro Par Perfecto'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-[11px] font-[family-name:var(--font-active)]">
                    <div className="p-2.5 rounded-lg bg-[var(--app-canvas)]/60 border border-[var(--text-heading)]/5 space-y-0.5">
                      <span className="text-[10px] uppercase text-[var(--text-muted)] font-bold block">Pase Directo:</span>
                      <span className="text-xs font-black text-[var(--app-accent)]">
                        {hybridPlayoffStructure.directQualifiers} Equipos ({groupCount} grupos × {qualifiersPerGroup})
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[var(--app-canvas)]/60 border border-[var(--text-heading)]/5 space-y-0.5">
                      <span className="text-[10px] uppercase text-[var(--text-muted)] font-bold block">Llave Objetivo:</span>
                      <span className="text-xs font-black text-[var(--text-heading)]">
                        {hybridPlayoffStructure.bracketSize} Equipos ({hybridPlayoffStructure.initialRoundName})
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[var(--app-canvas)]/60 border border-[var(--text-heading)]/5 space-y-0.5">
                      <span className="text-[10px] uppercase text-[var(--text-muted)] font-bold block">Repesca / Wildcard:</span>
                      <span className={`text-xs font-black ${
                        hybridPlayoffStructure.wildcardCount > 0 ? 'text-[var(--app-accent-2)]' : 'text-[var(--app-positive)]'
                      }`}>
                        {hybridPlayoffStructure.wildcardCount > 0
                          ? `${hybridPlayoffStructure.wildcardCount} Cupo(s) (${hybridPlayoffStructure.wildcardLabel})`
                          : '0 (No se requiere repesca)'}
                      </span>
                    </div>
                  </div>

                  {hybridPlayoffStructure.wildcardCount > 0 && (
                    <div className="mt-3 p-2.5 rounded-lg bg-[var(--app-accent-2-soft)]/30 border border-[var(--app-accent-2)]/30 text-[10px] text-[var(--text-secondary)] font-[family-name:var(--font-active)] flex items-start gap-2">
                      <span className="text-xs">ℹ️</span>
                      <p>
                        Al haber <strong>{hybridPlayoffStructure.directQualifiers} clasificados directos</strong> (cifra impar o no divisible en potencias de 2: 2, 4, 8, 16...), el motor agrega automáticamente <strong>{hybridPlayoffStructure.wildcardCount} cupo(s) por repesca ({hybridPlayoffStructure.wildcardLabel})</strong> según la tabla global de posiciones (PTS &gt; DG &gt; GF &gt; PG) para cerrar las llaves de {hybridPlayoffStructure.initialRoundName} sin dejar equipos sin match.
                      </p>
                    </div>
                  )}
                </div>

                {/* Previsualización del Reparto Asimétrico de Cupos por Grupo */}
                <div className="p-4 rounded-xl bg-[var(--app-canvas)]/80 border border-[var(--text-heading)]/10 space-y-3">
                  <span className="text-[11px] font-[family-name:var(--font-active)] font-bold uppercase text-[var(--text-secondary)] block flex items-center gap-2">
                    📊 Previsualización de Distribución Asimétrica ({enrolledTeams.length} Equipos en {groupDistributionPreview.length} Grupos):
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {groupDistributionPreview.map((g) => (
                      <div key={g.groupName} className="p-3 rounded-lg bg-[var(--app-surface-2)]/90 border border-[var(--text-heading)]/10 space-y-1">
                        <div className="flex items-center justify-between border-b border-[var(--text-heading)]/10 pb-1">
                          <span className="text-xs font-black uppercase text-[var(--app-accent)]">{g.groupName}</span>
                          <span className="text-[10px] font-[family-name:var(--font-active)] text-[var(--text-muted)] font-bold">{g.count} Equipos</span>
                        </div>
                        <div className="space-y-1 pt-1">
                          {g.teams.map((t, idx) => (
                            <div key={t.id} className="text-[10px] font-[family-name:var(--font-active)] text-[var(--text-secondary)] truncate">
                              #{idx + 1} {t.name} <span className="text-[var(--text-muted)]">[{t.tag || 'TEAM'}]</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Previsualización de Cruces Híbridos */}
                <div className="p-3.5 rounded-xl bg-[var(--app-accent-2-soft)]/40 border border-[var(--app-accent-2)]/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-[family-name:var(--font-active)] font-bold uppercase text-[var(--app-accent-2)] block">
                      ⚔️ Cruces Sembrados de Playoff ({hybridSeedings.length} Enfrentamientos en {hybridPlayoffStructure.initialRoundName}):
                    </span>
                    {hybridPlayoffStructure.wildcardCount > 0 && (
                      <span className="text-[10px] font-bold text-[var(--app-accent-2)] flex items-center gap-1">
                        ✦ Incluye {hybridPlayoffStructure.wildcardLabel}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {hybridSeedings.map((s, idx) => {
                      const isHomeWildcard = s.homeSeed.toLowerCase().includes('mejor');
                      const isAwayWildcard = s.awaySeed.toLowerCase().includes('mejor');
                      return (
                        <span key={idx} className="px-2.5 py-1.5 rounded-lg bg-[var(--app-surface-2)] border border-[var(--app-accent-2)]/40 text-[10px] font-[family-name:var(--font-active)] text-[var(--text-heading)] flex items-center gap-1.5 shadow-sm">
                          <span className="text-[var(--text-muted)] font-[family-name:var(--font-active)] text-[9px]">L{idx + 1}:</span>
                          <strong className={isHomeWildcard ? 'text-[var(--app-accent-2)] underline decoration-dotted' : 'text-[var(--app-accent)]'}>
                            {s.homeSeed}
                          </strong>
                          <span className="text-[var(--text-muted)] text-[9px] font-black">VS</span>
                          <strong className={isAwayWildcard ? 'text-[var(--app-accent-2)] underline decoration-dotted' : 'text-[var(--app-positive)]'}>
                            {s.awaySeed}
                          </strong>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Modalidad de Encuentro (Adaptada por Formato) */}
            {format === 'Hibrido' ? (
              <div className="p-4 rounded-xl bg-[var(--app-accent-2-soft)]/20 border border-[var(--app-accent-2)]/30 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-[var(--app-accent)] tracking-wider block flex items-center gap-2">
                    <Swords className="w-4 h-4 text-[var(--app-accent)]" /> 1. Modalidad de Fase de Grupos:
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setMatchMode('PartidoUnico')}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase border transition-all ${matchMode === 'PartidoUnico' ? 'bg-[var(--app-accent)] text-[var(--accent-contrast)] border-[var(--app-accent)] shadow-md' : 'glass-panel-hover text-[var(--text-secondary)]'}`}
                    >
                      Solo Ida
                    </button>
                    <button
                      type="button"
                      onClick={() => setMatchMode('IdaVuelta')}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase border transition-all ${matchMode === 'IdaVuelta' ? 'bg-[var(--app-accent-2)] text-[var(--text-heading)] border-[var(--app-accent-2)] shadow-md' : 'glass-panel-hover text-[var(--text-secondary)]'}`}
                    >
                      Ida y Vuelta
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-[var(--app-accent-2)]/20">
                  <label className="text-xs font-black uppercase text-[var(--app-warning)] tracking-wider block flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[var(--app-warning)]" /> 2. Modalidad de Fase Playoff:
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPlayoffMatchMode('PartidoUnico')}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase border transition-all ${playoffMatchMode === 'PartidoUnico' ? 'bg-[var(--app-accent)] text-[var(--accent-contrast)] border-[var(--app-accent)] shadow-md' : 'glass-panel-hover text-[var(--text-secondary)]'}`}
                    >
                      Partido Único
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlayoffMatchMode('IdaVuelta')}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase border transition-all ${playoffMatchMode === 'IdaVuelta' ? 'bg-[var(--app-accent-2)] text-[var(--text-heading)] border-[var(--app-accent-2)] shadow-md' : 'glass-panel-hover text-[var(--text-secondary)]'}`}
                    >
                      Ida y Vuelta
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlayoffMatchMode('MejorDe3')}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase border transition-all ${playoffMatchMode === 'MejorDe3' ? 'bg-[var(--app-warning)] text-[var(--app-canvas)] border-[var(--app-warning)] shadow-md font-extrabold' : 'glass-panel-hover text-[var(--text-secondary)]'}`}
                    >
                      🎮 Mejor de 3 (Bo3)
                    </button>
                  </div>
                </div>
              </div>
            ) : format === 'Liga' ? (
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-[var(--text-secondary)] tracking-wider block flex items-center gap-2">
                  <Swords className="w-4 h-4 text-[var(--app-accent)]" /> Modalidad de Encuentro (Liga Regular):
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMatchMode('PartidoUnico')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase border transition-all ${matchMode === 'PartidoUnico' ? 'bg-[var(--app-accent)] text-[var(--accent-contrast)] border-[var(--app-accent)] shadow-md' : 'glass-panel-hover text-[var(--text-secondary)]'}`}
                  >
                    Solo Ida
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchMode('IdaVuelta')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase border transition-all ${matchMode === 'IdaVuelta' ? 'bg-[var(--app-accent-2)] text-[var(--text-heading)] border-[var(--app-accent-2)] shadow-md' : 'glass-panel-hover text-[var(--text-secondary)]'}`}
                  >
                    Ida y Vuelta
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-[var(--text-secondary)] tracking-wider block flex items-center gap-2">
                  <Swords className="w-4 h-4 text-[var(--app-accent)]" /> Modalidad de Llaves (Playoff):
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMatchMode('PartidoUnico')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase border transition-all ${matchMode === 'PartidoUnico' ? 'bg-[var(--app-accent)] text-[var(--accent-contrast)] border-[var(--app-accent)] shadow-md' : 'glass-panel-hover text-[var(--text-secondary)]'}`}
                  >
                    Partido Único
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchMode('IdaVuelta')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase border transition-all ${matchMode === 'IdaVuelta' ? 'bg-[var(--app-accent-2)] text-[var(--text-heading)] border-[var(--app-accent-2)] shadow-md' : 'glass-panel-hover text-[var(--text-secondary)]'}`}
                  >
                    Ida y Vuelta
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchMode('MejorDe3')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase border transition-all ${matchMode === 'MejorDe3' ? 'bg-[var(--app-warning)] text-[var(--app-canvas)] border-[var(--app-warning)] shadow-md font-extrabold' : 'glass-panel-hover text-[var(--text-secondary)]'}`}
                  >
                    🎮 Mejor de 3 (Bo3)
                  </button>
                </div>
              </div>
            )}

            {/* Calendario Oficial */}
            <div className="space-y-4 pt-2 border-t border-[var(--text-heading)]/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase block">Fecha Oficial de Inicio:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-theme w-full p-2.5 rounded-xl font-[family-name:var(--font-active)] text-xs"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase block">Días de Enfrentamiento:</label>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {daysOfWeekOptions.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleToggleDay(d.label)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-[family-name:var(--font-active)] font-bold border ${selectedDays.includes(d.label) ? 'bg-[var(--app-positive-soft)] text-[var(--app-positive)] border-[var(--app-positive)]/50' : 'glass-panel-hover text-[var(--text-muted)]'}`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Horarios Dinámicos con Input y Lista Eliminable */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[var(--app-accent)]" /> Horarios de Partidos (Personalizados):
                </label>

                {/* Input para escribir horario y agregar a la lista */}
                <div className="flex items-center gap-2 max-w-sm">
                  <input
                    type="time"
                    value={newTimeInput}
                    onChange={(e) => {
                      setNewTimeInput(e.target.value);
                      if (timeError) setTimeError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTime();
                      }
                    }}
                    placeholder="22:40"
                    className="input-theme flex-1 p-2 rounded-xl font-[family-name:var(--font-active)] text-xs text-[var(--text-heading)]"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddTime}
                    className="bg-[var(--app-accent)] hover:bg-[var(--app-accent)]/80 text-[var(--accent-contrast)] font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar
                  </Button>
                </div>
                {timeError && (
                  <p className="text-[10px] text-[var(--app-danger)] font-bold">{timeError}</p>
                )}

                {/* Lista de horarios configurados con botón Eliminar (X) */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">
                    Horarios configurados para rotación ({selectedTimes.length}):
                  </span>
                  {selectedTimes.length === 0 ? (
                    <p className="text-xs text-[var(--app-warning)] italic">
                      Escribe un horario (ej. 22:40) y agrégalo para generar los partidos.
                    </p>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedTimes.map((time) => (
                        <div
                          key={time}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-[family-name:var(--font-active)] font-black bg-[var(--app-accent-soft)] text-[var(--app-accent)] border border-[var(--app-accent)]/60 shadow-sm"
                        >
                          <Clock className="w-3 h-3 text-[var(--app-accent)]" />
                          <span>{time} hrs</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTime(time)}
                            className="p-0.5 rounded-full hover:bg-[var(--app-accent)]/20 text-[var(--app-accent)] hover:text-[var(--app-danger)] transition-colors"
                            title={`Eliminar ${time}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sugerencias Rápidas */}
                <div className="pt-1">
                  <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase block mb-1">
                    Sugerencias rápidas:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['19:00', '20:00', '20:30', '21:00', '21:30', '22:00', '22:40', '23:10'].map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => {
                          if (!selectedTimes.includes(time)) {
                            setSelectedTimes((prev) => [...prev, time].sort());
                          }
                        }}
                        disabled={selectedTimes.includes(time)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                          selectedTimes.includes(time)
                            ? 'opacity-30 cursor-not-allowed border-[var(--text-heading)]/10 text-[var(--text-muted)]'
                            : 'border-[var(--text-heading)]/20 hover:border-[var(--app-accent)] text-[var(--text-secondary)] hover:text-[var(--app-accent)]'
                        }`}
                      >
                        + {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--text-heading)]/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsFormMode(false)}
                className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-heading)] w-full sm:w-auto"
              >
                ← Cancelar y Volver a los Partidos
              </Button>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  onClick={() => {
                    const elem = document.getElementById('matchmaking-preview-container');
                    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                  }}
                  variant="outline"
                  className="text-xs font-bold flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-[var(--app-accent)]" /> <span>Previsualización ⚡</span>
                </Button>
                <Button
                  onClick={() => {
                    if (hasReportedResults) {
                      setIsWarningModalOpen(true);
                    } else {
                      handleConfirmSaveFixture();
                    }
                  }}
                  disabled={isPending || enrolledTeams.length < 2}
                  className="bg-[var(--app-positive)] hover:bg-[var(--app-positive)] text-[var(--accent-contrast)] font-black text-xs px-5 py-2.5 rounded-xl shadow-xl flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{isPending ? 'Guardando...' : 'Guardar Fixture'}</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* 📌 2. PREVISUALIZACIÓN DE MATCHMAKING DINÁMICA SEGÚN FORMATO */}
          {hasPreview && (
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
                playoffMatchMode={format === 'Hibrido' ? playoffMatchMode : undefined}
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

      {/* Modal de Reporte / Modificación de Partido */}
      {reportModalMatch && (
        <MatchReportModal
          isOpen={Boolean(reportModalMatch)}
          onClose={() => setReportModalMatch(null)}
          match={reportModalMatch}
        />
      )}
    </div>
  );
}
