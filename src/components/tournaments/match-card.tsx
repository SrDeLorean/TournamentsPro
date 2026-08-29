'use client';

import React from 'react';
import { CalendarDays, CheckCircle2, Clock3, Edit3, Globe2, Radio, Trophy } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { GameConfig } from '@/lib/games-data';
import type { FixtureMatchItem } from '@/features/competitions/fixture/fixture-model';

interface MatchCardProps {
  match: FixtureMatchItem;
  game: GameConfig;
  isAdminOrOrganizer: boolean;
  isCaptainOrCoach: boolean;
  onOpenReportModal: (match: FixtureMatchItem) => void;
  onOpenTimezoneModal: (timeStr: string) => void;
}

function isPlaceholder(name: string): boolean {
  const normalized = name.toLowerCase();
  return normalized.includes('definir') || normalized === 'tbd';
}

export function MatchCard({
  match,
  game,
  isAdminOrOrganizer,
  isCaptainOrCoach,
  onOpenReportModal,
  onOpenTimezoneModal,
}: MatchCardProps) {
  const brandColor = game?.brandColor || 'var(--game-brand)';
  const isLive = match.status === 'EN_VIVO';
  const isFinished = match.status === 'FINALIZADO';
  const canReport = isAdminOrOrganizer || isCaptainOrCoach;
  const homeWon = isFinished && match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore;
  const awayWon = isFinished && match.homeScore !== null && match.awayScore !== null && match.awayScore > match.homeScore;

  return (
    <article
      data-status={match.status}
      className="fixture-match-card"
      style={{ '--match-brand': brandColor } as React.CSSProperties}
    >
      <header className="fixture-match-card-header">
        <div className="fixture-match-card-competition">
          <Trophy className="size-4" />
          <span>{match.competitionName}</span>
        </div>
        <span className={`fixture-match-status is-${match.status.toLowerCase()}`}>
          {isLive ? <Radio className="size-3" /> : isFinished ? <CheckCircle2 className="size-3" /> : <Clock3 className="size-3" />}
          {isLive ? 'En vivo' : isFinished ? 'Finalizado' : 'Programado'}
        </span>
      </header>

      <div className="fixture-match-schedule">
        <span><CalendarDays className="size-3.5" /> {match.dayLabel}</span>
        <button type="button" onClick={() => onOpenTimezoneModal(match.transmissionTime)} aria-label={`Ver zonas horarias para las ${match.transmissionTime}`}>
          <Globe2 className="size-3.5" /> {match.transmissionTime} CLT
        </button>
      </div>

      <div className="fixture-match-versus">
        <div className={`fixture-match-team is-home ${homeWon ? 'is-winner' : ''} ${isPlaceholder(match.homeTeam) ? 'is-placeholder' : ''}`}>
          <Avatar src={match.homeLogoUrl} alt={`Logo de ${match.homeTeam}`} fallback={isPlaceholder(match.homeTeam) ? '?' : match.homeTag} size="lg" />
          <span><strong>{match.homeTeam}</strong><small>{isPlaceholder(match.homeTeam) ? 'Clasificación pendiente' : match.homeTag}</small></span>
        </div>

        <div className="fixture-match-score" aria-label={`Marcador ${match.homeScore ?? 0} a ${match.awayScore ?? 0}`}>
          <strong className={homeWon ? 'is-winner' : ''}>{match.homeScore ?? '-'}</strong>
          <span>{isLive || isFinished ? ':' : 'VS'}</span>
          <strong className={awayWon ? 'is-winner' : ''}>{match.awayScore ?? '-'}</strong>
        </div>

        <div className={`fixture-match-team is-away ${awayWon ? 'is-winner' : ''} ${isPlaceholder(match.awayTeam) ? 'is-placeholder' : ''}`}>
          <Avatar src={match.awayLogoUrl} alt={`Logo de ${match.awayTeam}`} fallback={isPlaceholder(match.awayTeam) ? '?' : match.awayTag} size="lg" />
          <span><strong>{match.awayTeam}</strong><small>{isPlaceholder(match.awayTeam) ? 'Clasificación pendiente' : match.awayTag}</small></span>
        </div>
      </div>

      <footer className="fixture-match-card-footer">
        <span className="fixture-match-round">{match.groupJornada}</span>
        {canReport && (
          <Button variant="outline" size="sm" onClick={() => onOpenReportModal(match)} className="fixture-match-report">
            <Edit3 className="size-3.5" /> <span>Reportar resultado</span>
          </Button>
        )}
      </footer>
    </article>
  );
}
