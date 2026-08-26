'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Calendar,
  CheckCircle2,
  Sparkles,
  Layers,
  Award,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  distributeTeamsIntoGroups,
  generatePlayoffBracket,
  TeamItem,
  GroupDistributionResult,
  PlayoffMatchNode,
} from '@/lib/matchmaking-bracket';
import { generateFixtureSchedule, MatchScheduled, TimeSlotConfig } from './fixture-generator';
import { getMatchdayDateTime } from '@/lib/fixture-date-scheduler';

export type PreviewFormat = 'Liga' | 'Playoff' | 'Hibrido' | 'liga' | 'playoff' | 'hibrido';

export interface MatchmakingPreviewProps {
  format: PreviewFormat;
  teams: TeamItem[];
  groupCount?: number;
  qualifiersPerGroup?: number;
  startDateISO?: string;
  selectedDays?: string[];
  selectedTimes?: string[];
  matchMode?: 'PartidoUnico' | 'IdaVuelta';
  scheduledMatches?: MatchScheduled[];
  onConfirmSave?: () => void;
  isSubmitting?: boolean;
}


/**
 * 📅 CALCULADOR DE FECHAS PROYECTADAS EN EL TIEMPO
 */
function calculateProjectedSlots(
  totalRounds: number,
  startDateISO: string,
  days: string[],
  times: string[]
): { roundNumber: number; dateLabel: string; time: string; iso: string }[] {
  const slots: { roundNumber: number; dateLabel: string; time: string; iso: string }[] = [];

  for (let r = 0; r < totalRounds; r++) {
    const info = getMatchdayDateTime(r + 1, startDateISO, days, times);
    slots.push({
      roundNumber: r + 1,
      dateLabel: info.exactDateStr,
      time: `${info.timeStr} hrs`,
      iso: info.iso,
    });
  }

  return slots;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. COMPONENTE: ESQUELETO DE TABLA DE POSICIONES PARA LIGA
// ─────────────────────────────────────────────────────────────────────────────
function LeagueStandingsMock({ teams }: { teams: TeamItem[] }) {
  return (
    <Card className="glass-panel p-5 space-y-4 shadow-xl border-purple-500/30">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 font-black text-xs uppercase text-purple-300">
          <Trophy className="w-4 h-4 text-purple-400" />
          <span>Esqueleto de Tabla de Posiciones Oficial ({teams.length} Clubes)</span>
        </div>
        <Badge className="bg-purple-950 text-purple-300 font-mono text-[10px]">
          Fase Regular de Liga
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 text-[10px] uppercase">
              <th className="p-2">Pos</th>
              <th className="p-2">Club eSports</th>
              <th className="p-2 text-center">PJ</th>
              <th className="p-2 text-center">PG</th>
              <th className="p-2 text-center">PE</th>
              <th className="p-2 text-center">PP</th>
              <th className="p-2 text-center">GF</th>
              <th className="p-2 text-center">GC</th>
              <th className="p-2 text-center">DG</th>
              <th className="p-2 text-center text-cyan-300 font-bold">PTS</th>
            </tr>
          </thead>
          <tbody>
            {teams.slice(0, 16).map((t, idx) => (
              <tr
                key={t.id}
                className={`border-b border-white/5 hover:bg-slate-900/40 transition-colors ${
                  idx < 4 ? 'bg-emerald-950/20' : ''
                }`}
              >
                <td className="p-2 font-black text-slate-400">
                  <span
                    className={`w-5 h-5 inline-flex items-center justify-center rounded text-[10px] ${
                      idx === 0
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : idx < 4
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                </td>
                <td className="p-2 font-black text-white flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-slate-900 border border-purple-500/40 flex items-center justify-center text-[9px] text-purple-300 font-black">
                    {(t.tag || t.name.slice(0, 3)).toUpperCase()}
                  </div>
                  <span>{t.name}</span>
                </td>
                <td className="p-2 text-center text-slate-400">0</td>
                <td className="p-2 text-center text-slate-400">0</td>
                <td className="p-2 text-center text-slate-400">0</td>
                <td className="p-2 text-center text-slate-400">0</td>
                <td className="p-2 text-center text-slate-400">0</td>
                <td className="p-2 text-center text-slate-400">0</td>
                <td className="p-2 text-center text-slate-400">0</td>
                <td className="p-2 text-center font-black text-cyan-300">0</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. COMPONENTE: TABLA COMPLETA Y PAGINADA POR JORNADAS (REFACTORIZADO)
// ─────────────────────────────────────────────────────────────────────────────
function PaginatedMatchdayScheduleTable({
  scheduledMatches,
}: {
  scheduledMatches: MatchScheduled[];
}) {
  const [currentMatchday, setCurrentMatchday] = useState(1);

  // Agrupar TODOS los partidos por Jornada
  const matchesByMatchday: Record<number, MatchScheduled[]> = {};
  scheduledMatches.forEach((m) => {
    if (!matchesByMatchday[m.matchdayNumber]) {
      matchesByMatchday[m.matchdayNumber] = [];
    }
    matchesByMatchday[m.matchdayNumber].push(m);
  });

  const matchdayNumbers = Object.keys(matchesByMatchday).map(Number).sort((a, b) => a - b);
  const totalMatchdays = matchdayNumbers.length || 1;
  const currentMatches = matchesByMatchday[currentMatchday] || [];
  const firstMatch = currentMatches[0];

  return (
    <Card className="glass-panel p-5 space-y-4 shadow-xl border-white/10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-black uppercase text-white tracking-wider">
            Calendario Proyectado por Jornada (Tabla Oficial: {currentMatches.length} Partidos Simultáneos)
          </span>
        </div>

        <Badge className="bg-cyan-950 text-cyan-300 font-mono text-[10px] uppercase border-cyan-500/40">
          Jornada {currentMatchday} de {totalMatchdays} • ({firstMatch?.scheduledDateLabel || 'Simultáneo'})
        </Badge>
      </div>

      {/* Tabla de Partidos Completa de la Jornada Seleccionada */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 text-[10px] uppercase">
              <th className="p-2">Fecha & Hora (Simultáneo)</th>
              <th className="p-2 text-right">Equipo Local</th>
              <th className="p-2 text-center">VS</th>
              <th className="p-2 text-left">Equipo Visitante</th>
              <th className="p-2 text-center">Etapa / Rueda</th>
            </tr>
          </thead>
          <tbody>
            {currentMatches.map((m) => (
              <tr key={m.id} className="border-b border-white/5 hover:bg-slate-900/40 transition-colors">
                <td className="p-2">
                  <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono font-bold text-xs inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{m.scheduledDateLabel}</span>
                  </span>
                </td>
                <td className="p-2 text-right font-black text-white">{m.homeTeamName}</td>
                <td className="p-2 text-center font-black text-slate-500 text-[10px]">VS</td>
                <td className="p-2 text-left font-black text-white">{m.awayTeamName}</td>
                <td className="p-2 text-center">
                  <span className="px-2.5 py-1 rounded bg-slate-900 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold">
                    {m.stageLabel || 'Fase Regular'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginador Horizontal eSports */}
      <div className="flex items-center justify-between border-t border-white/10 pt-3 flex-wrap gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentMatchday <= 1}
          onClick={() => setCurrentMatchday((prev) => Math.max(1, prev - 1))}
          className="glass-panel-hover text-xs font-bold text-slate-300 hover:text-white disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Jornada Anterior
        </Button>

        <div className="flex items-center gap-1 overflow-x-auto max-w-[350px] px-2 py-1">
          {matchdayNumbers.map((jNum) => (
            <button
              key={jNum}
              onClick={() => setCurrentMatchday(jNum)}
              className={`w-7 h-7 flex-shrink-0 rounded-lg text-xs font-mono font-bold transition-all ${
                currentMatchday === jNum
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black scale-105'
                  : 'glass-panel-hover text-slate-400 hover:text-white'
              }`}
            >
              {jNum}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          disabled={currentMatchday >= totalMatchdays}
          onClick={() => setCurrentMatchday((prev) => Math.min(totalMatchdays, prev + 1))}
          className="glass-panel-hover text-xs font-bold text-slate-300 hover:text-white disabled:opacity-30"
        >
          Jornada Siguiente <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. COMPONENTE: MINI-TABLAS DE POSICIONES PARA GRUPOS HÍBRIDOS
// ─────────────────────────────────────────────────────────────────────────────
function GroupStandingsMock({ groups }: { groups: GroupDistributionResult[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase text-purple-300 tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          Tablas de Posiciones por Grupos ({groups.length} Grupos Configurados):
        </span>
        <Badge className="bg-emerald-950 text-emerald-300 border-emerald-500/40 text-[10px] font-mono">
          Verde = Clasificados Directos a Playoffs
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <Card key={group.groupName} className="glass-panel p-4 space-y-3 border-white/10 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-black uppercase text-cyan-300">{group.groupName}</span>
              <span className="text-[10px] font-mono text-slate-400">{group.count} Equipos</span>
            </div>

            <table className="w-full text-left text-[11px] font-mono">
              <thead>
                <tr className="border-b border-white/10 text-slate-500 uppercase text-[9px]">
                  <th className="p-1">Pos</th>
                  <th className="p-1">Club</th>
                  <th className="p-1 text-center">PJ</th>
                  <th className="p-1 text-center font-bold text-cyan-300">PTS</th>
                </tr>
              </thead>
              <tbody>
                {group.teams.map((t, idx) => (
                  <tr
                    key={t.id}
                    className={`border-b border-white/5 ${
                      idx < 2 ? 'bg-emerald-950/30 text-emerald-200' : 'text-slate-300'
                    }`}
                  >
                    <td className="p-1 font-bold">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] ${idx < 2 ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-500'}`}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="p-1 font-bold truncate max-w-[120px]">{t.name}</td>
                    <td className="p-1 text-center text-slate-400">0</td>
                    <td className="p-1 text-center font-black text-cyan-300">0</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. COMPONENTE: ÁRBOL VISUAL DE PLAYOFFS / BRACKETS (VISUAL BRACKET VIEWER)
// ─────────────────────────────────────────────────────────────────────────────
function BracketViewer({
  nodes,
  projectedSlots,
}: {
  nodes: PlayoffMatchNode[];
  projectedSlots: { roundNumber: number; dateLabel: string; time: string }[];
}) {
  const roundMap: Record<number, PlayoffMatchNode[]> = {};
  nodes.forEach((n) => {
    if (!roundMap[n.roundOrder]) roundMap[n.roundOrder] = [];
    roundMap[n.roundOrder].push(n);
  });

  return (
    <Card className="glass-panel p-6 space-y-5 border-cyan-500/30 shadow-2xl overflow-x-auto">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 font-black text-xs uppercase text-cyan-300">
          <Award className="w-5 h-5 text-cyan-400" />
          <span>Árbol de Llaves y Proyección de Fechas de Playoff ({nodes.length} Partidos)</span>
        </div>
        <Badge className="bg-cyan-950 text-cyan-300 font-mono text-[10px]">
          Proyección TBD con Fechas Exactas
        </Badge>
      </div>

      <div className="flex items-stretch justify-between gap-6 min-w-[700px] py-2">
        {Object.entries(roundMap).map(([roundOrderStr, roundNodes]) => {
          const rOrder = Number(roundOrderStr);
          const roundName = roundNodes[0]?.roundName || `Ronda ${rOrder}`;
          const projected = projectedSlots[rOrder - 1] || {
            dateLabel: 'Fecha por definir',
            time: '20:00 hrs',
          };

          return (
            <div key={rOrder} className="flex-1 flex flex-col justify-around space-y-4">
              <div className="text-center p-2 rounded-xl bg-slate-900/90 border border-purple-500/30">
                <span className="text-xs font-black uppercase text-purple-300 block">
                  {roundName}
                </span>
                <span className="text-[9px] font-mono text-cyan-400 font-bold block mt-0.5">
                  📅 {projected.dateLabel} • {projected.time}
                </span>
              </div>

              <div className="space-y-4 flex flex-col justify-around flex-1">
                {roundNodes.map((match) => (
                  <div
                    key={match.id}
                    className="p-3 rounded-xl bg-slate-950/90 border border-white/15 hover:border-cyan-500/50 transition-all shadow-md space-y-2 relative group"
                  >
                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 border-b border-white/10 pb-1">
                      <span>ID: {match.id.slice(-8)}</span>
                      <span className="text-emerald-400 font-bold">Simultáneo</span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span className={match.homeTeamName === 'Por Definir' ? 'text-slate-500 italic' : 'text-white'}>
                        {match.homeTeamName}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 border border-white/10 text-slate-400">
                        {match.status === 'TERMINADO' ? '3' : '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span className={match.awayTeamName === 'Por Definir' ? 'text-slate-500 italic' : 'text-white'}>
                        {match.awayTeamName}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 border border-white/10 text-slate-400">
                        {match.status === 'TERMINADO' ? '1' : '-'}
                      </span>
                    </div>

                    {match.nextMatchId && (
                      <div className="text-[9px] font-mono text-purple-400 pt-1 border-t border-white/5 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 text-cyan-400" /> Avance a siguiente ronda
                        </span>
                        <span className="text-[8px] font-black text-slate-400 uppercase">[{match.nextMatchSlot}]</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. COMPONENTE PRINCIPAL (MATCHMAKING PREVIEW WITH CONDITIONAL SWITCH)
// ─────────────────────────────────────────────────────────────────────────────
export function MatchmakingPreview({
  format,
  teams,
  groupCount = 3,
  qualifiersPerGroup = 2,
  startDateISO = new Date().toISOString().slice(0, 10),
  selectedDays = ['Martes', 'Jueves'],
  selectedTimes = ['20:00', '21:30'],
  matchMode = 'PartidoUnico',
  scheduledMatches: providedMatches,
  onConfirmSave,
  isSubmitting = false,
}: MatchmakingPreviewProps) {
  const normFormat = (format || 'Liga').toLowerCase();

  // Calcular slots de tiempo configurados
  const timeSlotsConfig: TimeSlotConfig[] = [];
  selectedDays.forEach((d) => {
    selectedTimes.forEach((t) => {
      timeSlotsConfig.push({ dayLabel: d, time: t });
    });
  });

  const scheduledMatches =
    providedMatches ||
    generateFixtureSchedule(
      teams,
      startDateISO,
      timeSlotsConfig,
      matchMode,
      normFormat === 'playoff' ? 'Playoff' : normFormat === 'hibrido' ? 'Hibrido' : 'Liga',
      groupCount,
      qualifiersPerGroup
    );

  const isHybrid = normFormat === 'hibrido';
  const groupsPreview = distributeTeamsIntoGroups(teams, groupCount);
  const playoffTeamCount = isHybrid ? groupCount * qualifiersPerGroup : teams.length;
  const playoffNodes = generatePlayoffBracket(
    'preview',
    teams.slice(0, playoffTeamCount),
    matchMode,
    isHybrid,
    groupCount,
    qualifiersPerGroup
  );

  const roundsTotal = Math.max(1, Math.ceil(Math.log2(playoffTeamCount)));
  const projectedSlots = calculateProjectedSlots(roundsTotal, startDateISO, selectedDays, selectedTimes);

  // Recalcular Fecha Final Estimada del Torneo dinámicamente en base al último encuentro real
  const lastScheduledMatch = scheduledMatches[scheduledMatches.length - 1];
  const finalProjectedDate = lastScheduledMatch
    ? `${lastScheduledMatch.stageLabel ? `${lastScheduledMatch.stageLabel} • ` : ''}${lastScheduledMatch.scheduledDateLabel}`
    : projectedSlots[projectedSlots.length - 1]?.dateLabel || 'Por Definir';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h3 className="text-base font-black uppercase text-white tracking-wider">
              Previsualización de Matchmaking eSports
            </h3>
            <Badge className="bg-cyan-950 text-cyan-300 font-mono text-[10px] uppercase border-cyan-500/40">
              Formato {format.toUpperCase()} ({matchMode === 'IdaVuelta' ? 'Ida y Vuelta' : 'Partido Único'})
            </Badge>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Fecha Final Estimada del Torneo: <strong className="text-emerald-400">{finalProjectedDate}</strong>
          </p>
        </div>

        {onConfirmSave && (
          <Button
            onClick={onConfirmSave}
            disabled={isSubmitting}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-6 py-3 rounded-xl shadow-xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Guardando...' : 'Confirmar y Guardar Fixture en MySQL'}</span>
          </Button>
        )}
      </div>

      {(() => {
        switch (normFormat) {
          case 'liga':
            return (
              <div className="space-y-6">
                <LeagueStandingsMock teams={teams} />
                <PaginatedMatchdayScheduleTable scheduledMatches={scheduledMatches} />
              </div>
            );

          case 'playoff':
            return (
              <div className="space-y-6">
                <BracketViewer nodes={playoffNodes} projectedSlots={projectedSlots} />
                <PaginatedMatchdayScheduleTable scheduledMatches={scheduledMatches} />
              </div>
            );

          case 'hibrido':
            return (
              <div className="space-y-6">
                <GroupStandingsMock groups={groupsPreview} />
                <BracketViewer nodes={playoffNodes} projectedSlots={projectedSlots} />
                <PaginatedMatchdayScheduleTable scheduledMatches={scheduledMatches} />
              </div>
            );

          default:
            return null;
        }
      })()}
    </div>
  );
}
