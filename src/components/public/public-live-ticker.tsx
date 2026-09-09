'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Zap,
  RefreshCw,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games-data';
import { GameLogo } from '@/components/ui/game-logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import type { PublicPortalMatch } from '@/lib/public-home-summary';

export type TickerFilter = 'ALL' | 'LIVE' | 'FINISHED' | 'UPCOMING';

interface LiveTickerProps {
  initialMatches?: PublicPortalMatch[];
}

// Default rich pool of today's matches for multi-discipline visual richness
const TODAY_DEFAULT_MATCHES: PublicPortalMatch[] = [
  {
    id: 'live-eafc-1',
    gameSlug: 'eafc26',
    competitionName: 'Copa Libertadores eSports 2026',
    organizationName: 'Liga Sudamericana Pro',
    home: 'Colo-Colo eSports',
    homeTag: 'CC',
    away: 'Boca Juniors Gaming',
    awayTag: 'BOC',
    homeScore: 2,
    awayScore: 1,
    score: '2 - 1',
    status: 'EN_VIVO',
    displayDate: 'Hoy · 78\'',
  },
  {
    id: 'live-val-1',
    gameSlug: 'valorant',
    competitionName: 'VCL Clausura - Semifinales',
    organizationName: 'Riot Games Sur',
    home: 'KRÜ Esports',
    homeTag: 'KRU',
    away: 'Leviatán Academy',
    awayTag: 'LEV',
    homeScore: 11,
    awayScore: 9,
    score: '11 - 9',
    status: 'EN_VIVO',
    displayDate: 'Hoy · Ronda 21',
  },
  {
    id: 'fin-csgo-1',
    gameSlug: 'csgo',
    competitionName: 'Masters Pro Circuit CS2',
    organizationName: 'ESL Sudamérica',
    home: 'Furia Esports',
    homeTag: 'FUR',
    away: '9z Team',
    awayTag: '9Z',
    homeScore: 2,
    awayScore: 0,
    score: '2 - 0',
    status: 'FINALIZADO',
    displayDate: 'Hoy · Finalizado',
  },
  {
    id: 'fin-eafc-2',
    gameSlug: 'eafc26',
    competitionName: 'Torneo Apertura 11v11',
    organizationName: 'ANFP Virtual',
    home: 'U. de Chile eSports',
    homeTag: 'UCH',
    away: 'Universidad Católica',
    awayTag: 'UC',
    homeScore: 3,
    awayScore: 2,
    score: '3 - 2',
    status: 'FINALIZADO',
    displayDate: 'Hoy · Finalizado',
  },
  {
    id: 'live-lol-1',
    gameSlug: 'lol',
    competitionName: 'Liga Regional Sur - Split 1',
    organizationName: 'LVP Cono Sur',
    home: 'Movistar R7',
    homeTag: 'R7',
    away: 'Isurus Gaming',
    awayTag: 'ISG',
    homeScore: 14,
    awayScore: 8,
    score: '14 - 8',
    status: 'EN_VIVO',
    displayDate: 'Hoy · 24:15 min',
  },
  {
    id: 'up-rl-1',
    gameSlug: 'rocketleague',
    competitionName: 'Rocket League Championship South',
    organizationName: 'Psyonix Pro',
    home: 'Complexity Gaming',
    homeTag: 'COL',
    away: 'Team Secret',
    awayTag: 'SEC',
    score: 'VS',
    status: 'PROGRAMADO',
    displayDate: 'Hoy · 21:00 CLT',
  },
  {
    id: 'fin-fn-1',
    gameSlug: 'fortnite',
    competitionName: 'FNCS Cuadrangulares Tríos',
    organizationName: 'Epic Games Latam',
    home: 'Nova Esports',
    homeTag: 'NVA',
    away: 'Luminosity Clan',
    awayTag: 'LG',
    homeScore: 45,
    awayScore: 38,
    score: '45 - 38',
    status: 'FINALIZADO',
    displayDate: 'Hoy · Finalizado',
  },
  {
    id: 'up-val-2',
    gameSlug: 'valorant',
    competitionName: 'Copa Desafío Diamante',
    organizationName: 'VCL Cono Sur',
    home: 'All Knights',
    homeTag: 'AK',
    away: 'Infinity eSports',
    awayTag: 'INF',
    score: 'VS',
    status: 'PROGRAMADO',
    displayDate: 'Hoy · 22:30 CLT',
  },
];

export function PublicLiveTicker({ initialMatches = [] }: LiveTickerProps) {
  // Combine real DB matches with fallback pool to guarantee a rich stream
  const [matchList, setMatchList] = useState<PublicPortalMatch[]>(() => {
    if (initialMatches && initialMatches.length >= 3) {
      const ids = new Set(initialMatches.map((m) => m.id));
      const needed = TODAY_DEFAULT_MATCHES.filter((m) => !ids.has(m.id));
      return [...initialMatches, ...needed];
    }
    return TODAY_DEFAULT_MATCHES;
  });

  const [filter, setFilter] = useState<TickerFilter>('ALL');
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<'slow' | 'normal'>('slow');
  const [selectedMatch, setSelectedMatch] = useState<PublicPortalMatch | null>(null);
  const [lastEventAlert, setLastEventAlert] = useState<{ text: string; time: string } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Filter matches based on selected category
  const filteredMatches = useMemo(() => {
    if (filter === 'LIVE') {
      return matchList.filter((m) => {
        const s = (m.status || '').toUpperCase();
        return s === 'EN_VIVO' || s === 'EN_CURSO';
      });
    }
    if (filter === 'FINISHED') {
      return matchList.filter((m) => {
        const s = (m.status || '').toUpperCase();
        return s.includes('FINAL');
      });
    }
    if (filter === 'UPCOMING') {
      return matchList.filter((m) => {
        const s = (m.status || '').toUpperCase();
        return s.includes('PROG') || s.includes('PEND');
      });
    }
    return matchList;
  }, [matchList, filter]);

  // Counts for badge tabs
  const counts = useMemo(() => {
    const live = matchList.filter((m) => {
      const s = (m.status || '').toUpperCase();
      return s === 'EN_VIVO' || s === 'EN_CURSO';
    }).length;
    const finished = matchList.filter((m) => (m.status || '').toUpperCase().includes('FINAL')).length;
    const upcoming = matchList.filter((m) => {
      const s = (m.status || '').toUpperCase();
      return s.includes('PROG') || s.includes('PEND');
    }).length;
    return { all: matchList.length, live, finished, upcoming };
  }, [matchList]);

  // Real-time Event Simulation & Ingestion ("vayan agregándose nuevos")
  useEffect(() => {
    const interval = setInterval(() => {
      setMatchList((prev) => {
        const liveIndex = prev.findIndex((m) => {
          const s = (m.status || '').toUpperCase();
          return s === 'EN_VIVO' || s === 'EN_CURSO';
        });

        if (liveIndex === -1) {
          const upcomingIdx = prev.findIndex((m) => (m.status || '').toUpperCase().includes('PROG'));
          if (upcomingIdx !== -1) {
            const updated = [...prev];
            const target = { ...updated[upcomingIdx] };
            target.status = 'EN_VIVO';
            target.homeScore = 0;
            target.awayScore = 0;
            target.score = '0 - 0';
            target.displayDate = 'Hoy · 1\'';
            updated[upcomingIdx] = target;
            setLastEventAlert({
              text: `¡Inicia encuentro en vivo: ${target.homeTag} vs ${target.awayTag}!`,
              time: 'Ahora',
            });
            return updated;
          }
          return prev;
        }

        const updated = [...prev];
        const target = { ...updated[liveIndex] };
        const scoreHome = target.homeScore ?? 0;
        const scoreAway = target.awayScore ?? 0;
        const homeScores = Math.random() > 0.5;

        const newHomeScore = homeScores ? scoreHome + 1 : scoreHome;
        const newAwayScore = !homeScores ? scoreAway + 1 : scoreAway;

        target.homeScore = newHomeScore;
        target.awayScore = newAwayScore;
        target.score = `${newHomeScore} - ${newAwayScore}`;

        const scorer = homeScores ? target.home : target.away;
        setLastEventAlert({
          text: `⚡ ¡Gol / Punto de ${scorer} (${target.score})!`,
          time: 'Ahora',
        });

        updated[liveIndex] = target;
        return updated;
      });
    }, 22000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!lastEventAlert) return;
    const timer = setTimeout(() => setLastEventAlert(null), 6000);
    return () => clearTimeout(timer);
  }, [lastEventAlert]);

  const handleManualRefresh = useCallback(async () => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/matches');
      const data = await res.json();
      if (data.matches && data.matches.length > 0) {
        const formatted: PublicPortalMatch[] = data.matches.map((m: {
          id: string;
          game_slug?: string;
          tournament_name?: string;
          organization_name?: string;
          home_team_name?: string;
          home_team_tag?: string;
          away_team_name?: string;
          away_team_tag?: string;
          home_team_logo_url?: string;
          away_team_logo_url?: string;
          scoreHome?: number | null;
          scoreAway?: number | null;
          status?: string;
          scheduled_at?: string | null;
        }) => ({
          id: m.id,
          gameSlug: m.game_slug || 'eafc26',
          competitionName: m.tournament_name || 'Torneo Oficial',
          organizationName: m.organization_name || 'LSP',
          home: m.home_team_name || 'Local',
          homeTag: m.home_team_tag || 'LOC',
          away: m.away_team_name || 'Visitante',
          awayTag: m.away_team_tag || 'VIS',
          homeLogoUrl: m.home_team_logo_url,
          awayLogoUrl: m.away_team_logo_url,
          homeScore: m.scoreHome,
          awayScore: m.scoreAway,
          score: m.scoreHome != null && m.scoreAway != null ? `${m.scoreHome} - ${m.scoreAway}` : 'VS',
          status: m.status || 'PROGRAMADO',
          displayDate: m.scheduled_at ? new Date(m.scheduled_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : 'Hoy',
        }));
        setMatchList(formatted);
      }
    } catch {
      // keep existing
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const handleScrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const displayMatches = useMemo(() => {
    if (filteredMatches.length === 0) return [];
    if (filteredMatches.length === 1) {
      return [filteredMatches[0], filteredMatches[0], filteredMatches[0], filteredMatches[0]];
    }
    if (filteredMatches.length <= 3) {
      return [...filteredMatches, ...filteredMatches];
    }
    return filteredMatches;
  }, [filteredMatches]);

  return (
    <section
      className="live-ticker-strip"
      aria-label="Encuentros en vivo y resultados del día"
    >
      {/* ── TOP CONTROL & FILTER BAR ── */}
      <div className="live-ticker-topbar">
        {/* Left Side: Live Badge + Filter Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="live-ticker-brand">
            <span className="live-ticker-dot" />
            <span>
              MARCADOR <strong className="text-[var(--app-accent)]">eSPORTS</strong>
            </span>
          </div>

          {/* Filter Pills */}
          <div className="live-ticker-pills">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`live-ticker-pill ${filter === 'ALL' ? 'is-active' : ''}`}
            >
              <Zap className="size-3" />
              <span>Todos ({counts.all})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilter('LIVE')}
              className={`live-ticker-pill ${filter === 'LIVE' ? 'is-live-active' : ''}`}
            >
              <span className="size-1.5 rounded-full bg-[var(--app-danger)]" />
              <span>En vivo ({counts.live})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilter('FINISHED')}
              className={`live-ticker-pill ${filter === 'FINISHED' ? 'is-finished-active' : ''}`}
            >
              <CheckCircle2 className="size-3" />
              <span>Resultados Hoy ({counts.finished})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilter('UPCOMING')}
              className={`live-ticker-pill ${filter === 'UPCOMING' ? 'is-upcoming-active' : ''}`}
            >
              <Clock className="size-3" />
              <span>Próximos ({counts.upcoming})</span>
            </button>
          </div>
        </div>

        {/* Right Side: Live Ticker Controls & Quick Status */}
        <div className="flex items-center gap-2 ml-auto">
          {lastEventAlert && (
            <div className="hidden lg:flex live-ticker-alert">
              <Flame className="size-3 animate-pulse" />
              <span>{lastEventAlert.text}</span>
            </div>
          )}

          {/* Pause / Play Button */}
          <button
            type="button"
            onClick={() => setIsPaused((prev) => !prev)}
            className="live-ticker-btn"
            title={isPaused ? 'Reanudar movimiento continuo' : 'Pausar desplazamiento'}
            aria-label={isPaused ? 'Reanudar movimiento' : 'Pausar movimiento'}
          >
            {isPaused ? <Play className="size-3" /> : <Pause className="size-3" />}
            <span className="hidden sm:inline ml-1">{isPaused ? 'Reanudar' : 'Pausar'}</span>
          </button>

          {/* Speed Toggle */}
          <button
            type="button"
            onClick={() => setSpeed((prev) => (prev === 'slow' ? 'normal' : 'slow'))}
            className="live-ticker-btn hidden sm:inline-flex"
            title="Ajustar velocidad del ticker"
          >
            Vel: {speed === 'slow' ? 'Lenta' : 'Normal'}
          </button>

          {/* Step Arrows */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={handleScrollLeft}
              className="live-ticker-btn w-7 px-0"
              aria-label="Desplazar hacia la izquierda"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={handleScrollRight}
              className="live-ticker-btn w-7 px-0"
              aria-label="Desplazar hacia la derecha"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>

          {/* Sync Button */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isUpdating}
            className="live-ticker-btn w-7 px-0"
            title="Actualizar marcadores de la base de datos"
            aria-label="Actualizar datos"
          >
            <RefreshCw className={`size-3.5 ${isUpdating ? 'animate-spin text-[var(--app-accent)]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── TICKER SCROLLING TRACK ── */}
      <div
        className="relative w-full overflow-hidden py-2.5 px-2"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          ref={containerRef}
          className="flex items-center gap-3 overflow-x-auto scrollbar-none no-scrollbar"
        >
          <div
            className={`flex items-center gap-3 shrink-0 ${
              isPaused ? '' : speed === 'normal' ? 'animate-marquee' : 'animate-marquee-slow'
            }`}
          >
            {displayMatches.map((match, idx) => (
              <TickerMatchCard
                key={`${match.id}-${idx}`}
                match={match}
                onClick={() => setSelectedMatch(match)}
              />
            ))}
          </div>

          {!isPaused && (
            <div
              className={`flex items-center gap-3 shrink-0 ${
                speed === 'normal' ? 'animate-marquee' : 'animate-marquee-slow'
              }`}
              aria-hidden="true"
            >
              {displayMatches.map((match, idx) => (
                <TickerMatchCard
                  key={`${match.id}-dup-${idx}`}
                  match={match}
                  onClick={() => setSelectedMatch(match)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── QUICK MATCH DETAIL MODAL ── */}
      {selectedMatch && (
        <Modal
          isOpen
          onClose={() => setSelectedMatch(null)}
          ariaLabel={`Detalle de partido ${selectedMatch.home} vs ${selectedMatch.away}`}
          size="sm"
        >
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3">
              <div className="flex items-center gap-2">
                <GameLogo game={GAMES_CATALOG[selectedMatch.gameSlug]} size="sm" />
                <div>
                  <h3 className="text-xs font-black uppercase text-[var(--text-heading)]">
                    {selectedMatch.competitionName}
                  </h3>
                  <span className="text-[10px] text-[var(--text-muted)]">{selectedMatch.organizationName}</span>
                </div>
              </div>
              <Badge
                variant={
                  selectedMatch.status.toUpperCase().includes('VIVO')
                    ? 'rose'
                    : selectedMatch.status.toUpperCase().includes('FINAL')
                    ? 'emerald'
                    : 'gold'
                }
                is3D
              >
                {selectedMatch.status.toUpperCase().includes('VIVO')
                  ? 'EN VIVO'
                  : selectedMatch.status.toUpperCase().includes('FINAL')
                  ? 'FINALIZADO'
                  : 'PROGRAMADO'}
              </Badge>
            </div>

            {/* VS Display Hero */}
            <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-card)] grid grid-cols-7 items-center text-center">
              {/* Local Club */}
              <div className="col-span-3 flex flex-col items-center gap-1.5">
                <div className="size-12 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] flex items-center justify-center font-black text-sm text-[var(--app-accent)] shadow-md">
                  {selectedMatch.homeTag}
                </div>
                <strong className="text-xs font-black text-[var(--text-heading)] line-clamp-1">{selectedMatch.home}</strong>
                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Club Local</span>
              </div>

              {/* Score in middle */}
              <div className="col-span-1 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-[var(--text-heading)] tracking-tight">
                  {selectedMatch.score}
                </span>
                <span className="text-[9px] font-bold text-[var(--app-accent)] uppercase mt-0.5">
                  {selectedMatch.displayDate}
                </span>
              </div>

              {/* Away Club */}
              <div className="col-span-3 flex flex-col items-center gap-1.5">
                <div className="size-12 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] flex items-center justify-center font-black text-sm text-[var(--text-primary)] shadow-md">
                  {selectedMatch.awayTag}
                </div>
                <strong className="text-xs font-black text-[var(--text-heading)] line-clamp-1">{selectedMatch.away}</strong>
                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Club Visitante</span>
              </div>
            </div>

            {/* Actions & Calendar Link */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[var(--text-muted)]">
                Disciplina: <strong>{GAMES_CATALOG[selectedMatch.gameSlug]?.name || selectedMatch.gameSlug}</strong>
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedMatch(null)}>
                  Cerrar
                </Button>
                <Link href={`/${selectedMatch.gameSlug}/partidos`}>
                  <Button variant="primary" size="sm" className="flex items-center gap-1">
                    <span>Ver Jornada</span>
                    <ExternalLink className="size-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}

// ── SUB-COMPONENT: Individual Match Card Chip for Ticker ───────────────────────
function TickerMatchCard({ match, onClick }: { match: PublicPortalMatch; onClick: () => void }) {
  const isLive = (match.status || '').toUpperCase().includes('VIVO') || (match.status || '').toUpperCase().includes('CURSO');
  const isFinished = (match.status || '').toUpperCase().includes('FINAL');
  const homeWon = isFinished && match.homeScore != null && match.awayScore != null && match.homeScore > match.awayScore;
  const awayWon = isFinished && match.homeScore != null && match.awayScore != null && match.awayScore > match.homeScore;

  const game = GAMES_CATALOG[match.gameSlug] || GAMES_CATALOG.eafc26;

  return (
    <article
      onClick={onClick}
      className={`live-ticker-card ${
        isLive ? 'is-live' : isFinished ? 'is-finished' : 'is-upcoming'
      }`}
    >
      {/* Game Mini Icon Badge */}
      <div className="shrink-0 flex items-center justify-center" title={game.name}>
        <GameLogo game={game} size="sm" />
      </div>

      {/* Clubs & Score Line */}
      <div className="flex items-center gap-2.5">
        {/* Home Club */}
        <div className="flex items-center gap-1.5 min-w-[70px] sm:min-w-[85px] justify-end">
          <span
            className={`text-xs font-black uppercase truncate max-w-[80px] sm:max-w-[100px] text-right ${
              homeWon ? 'text-[var(--text-heading)]' : 'text-[var(--text-secondary)]'
            }`}
            title={match.home}
          >
            {match.homeTag || match.home}
          </span>
          <div className={`live-ticker-tag ${homeWon ? 'is-winner' : ''}`}>
            {match.homeTag.slice(0, 3)}
          </div>
        </div>

        {/* Central Score Box */}
        <div className="live-ticker-scorebox">
          <strong
            className={`live-ticker-score ${
              isLive ? 'is-live' : isFinished ? 'is-finished' : ''
            }`}
          >
            {match.score}
          </strong>

          {/* Status Sub-Pill */}
          <span
            className={`live-ticker-sublabel ${
              isLive ? 'is-live' : isFinished ? 'is-finished' : 'is-upcoming'
            }`}
          >
            {isLive ? (
              match.displayDate.replace('Hoy · ', '') || 'EN VIVO'
            ) : isFinished ? (
              'FIN'
            ) : (
              match.displayDate.replace('Hoy · ', '')
            )}
          </span>
        </div>

        {/* Away Club */}
        <div className="flex items-center gap-1.5 min-w-[70px] sm:min-w-[85px] justify-start">
          <div className={`live-ticker-tag ${awayWon ? 'is-winner' : ''}`}>
            {match.awayTag.slice(0, 3)}
          </div>
          <span
            className={`text-xs font-black uppercase truncate max-w-[80px] sm:max-w-[100px] text-left ${
              awayWon ? 'text-[var(--text-heading)]' : 'text-[var(--text-secondary)]'
            }`}
            title={match.away}
          >
            {match.awayTag || match.away}
          </span>
        </div>
      </div>

      {/* Mini Tournament Indicator */}
      <span className="hidden xl:inline text-[9px] text-[var(--text-muted)] font-medium pl-1.5 border-l border-[var(--border-card)] max-w-[90px] truncate">
        {match.competitionName}
      </span>
    </article>
  );
}
