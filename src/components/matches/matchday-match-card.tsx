'use client';

import React from 'react';
import { Award, CalendarDays, CheckCircle2, Clock3, FileCheck, Globe2, Radio, Shield, Trophy } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { GameConfig } from '@/lib/games-data';

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

interface MatchdayMatchCardProps {
  match: MatchdayReportItem;
  game: GameConfig;
  canReport: boolean;
  canApprove: boolean;
  onOpenTimezone: (time: string) => void;
  onReport: (match: MatchdayReportItem) => void;
  onApprove: (match: MatchdayReportItem) => void;
}

const statusCopy: Record<MatchdayReportItem['status'], string> = {
  PROGRAMADO: 'Programado',
  POR_REVISAR: 'Por revisar',
  EN_VIVO: 'En vivo',
  FINALIZADO: 'Finalizado',
};

function formatMatchDate(dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat('es-CL', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(date);
}

export function MatchdayMatchCard({
  match,
  game,
  canReport,
  canApprove,
  onOpenTimezone,
  onReport,
  onApprove,
}: MatchdayMatchCardProps) {
  const isFinished = match.status === 'FINALIZADO';
  const homeWon = isFinished && match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore;
  const awayWon = isFinished && match.homeScore !== null && match.awayScore !== null && match.awayScore > match.homeScore;

  return (
    <article
      className="matchday-match-card"
      data-status={match.status}
      style={{ '--match-brand': game.brandColor } as React.CSSProperties}
    >
      <header className="matchday-match-card-header">
        <div className="matchday-match-competition">
          <Trophy className="size-4" />
          <span><strong>{match.tournamentName}</strong><small>{match.organizationName}</small></span>
        </div>
        <span className={`matchday-match-status is-${match.status.toLowerCase()}`}>
          {match.status === 'EN_VIVO' ? <Radio className="size-3" /> : match.status === 'FINALIZADO' ? <CheckCircle2 className="size-3" /> : <Clock3 className="size-3" />}
          {statusCopy[match.status]}
        </span>
      </header>

      <div className="matchday-match-meta">
        <span><CalendarDays className="size-3.5" /> {formatMatchDate(match.matchDate)}</span>
        <button type="button" onClick={() => onOpenTimezone(match.transmissionTime)} aria-label={`Ver equivalencias horarias para las ${match.transmissionTime}`}>
          <Globe2 className="size-3.5" /> {match.transmissionTime} CLT
        </button>
        <span className="matchday-match-game">{game.icon} {game.name}</span>
      </div>

      <div className="matchday-match-versus">
        <div className={`matchday-match-team ${homeWon ? 'is-winner' : ''}`}>
          <Avatar fallback={match.homeTag} size="lg" />
          <span><strong>{match.homeTeam}</strong><small>{match.homeTag} · Local</small></span>
        </div>

        <div className="matchday-match-score" aria-label={`Marcador ${match.homeScore ?? 0} a ${match.awayScore ?? 0}`}>
          <strong className={homeWon ? 'is-winner' : ''}>{match.homeScore ?? '-'}</strong>
          <span>{match.status === 'PROGRAMADO' ? 'VS' : ':'}</span>
          <strong className={awayWon ? 'is-winner' : ''}>{match.awayScore ?? '-'}</strong>
        </div>

        <div className={`matchday-match-team ${awayWon ? 'is-winner' : ''}`}>
          <Avatar fallback={match.awayTag} size="lg" />
          <span><strong>{match.awayTeam}</strong><small>{match.awayTag} · Visita</small></span>
        </div>
      </div>

      <footer className="matchday-match-card-footer">
        <span className="matchday-match-round"><Award className="size-3.5" /> {match.groupJornada}</span>
        {canApprove && match.status === 'POR_REVISAR' ? (
          <Button variant="primary" size="sm" onClick={() => onApprove(match)} className="matchday-match-action is-approve">
            <FileCheck className="size-3.5" /> Aprobar resultado
          </Button>
        ) : canReport ? (
          <Button variant="outline" size="sm" onClick={() => onReport(match)} className="matchday-match-action">
            <Shield className="size-3.5" /> Reportar ficha
          </Button>
        ) : null}
      </footer>
    </article>
  );
}
