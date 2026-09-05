'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Building2, CalendarDays, ChevronLeft, ChevronRight, Pause, Play, Radio, Shield, Trophy, Users } from 'lucide-react';

import { PublicSectionHeading } from '@/components/public/public-home-sections';
import {
  PublicCompetitionCard,
  PublicMatchCard,
  PublicOrganizationCard,
  PublicTeamCard,
} from '@/components/public/public-spotlight-cards';
import { GameLogo } from '@/components/ui/game-logo';
import { GAMES_CATALOG } from '@/lib/games-data';
import type { PublicPortalSummary } from '@/lib/public-home-summary';

interface PublicPortalProps { summary: PublicPortalSummary; gameSlug?: string }

const DISCIPLINE_ORDER = ['eafc26', 'csgo', 'valorant', 'lol', 'rocketleague', 'fortnite'];
const ROTATION_INTERVAL_MS = 5_000;

export function PublicPortalOverview({ summary, gameSlug }: PublicPortalProps) {
  const availableSlugs = useMemo(() => {
    if (gameSlug) return [gameSlug];
    const withContent = DISCIPLINE_ORDER.filter((slug) => hasDisciplineContent(summary, slug));
    return withContent.length ? withContent : DISCIPLINE_ORDER;
  }, [gameSlug, summary]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [manualPaused, setManualPaused] = useState(false);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const activeSlug = availableSlugs[activeIndex % availableSlugs.length] || gameSlug || 'eafc26';
  const scopedSummary = useMemo(() => scopeSummary(summary, activeSlug), [activeSlug, summary]);
  const canRotate = !gameSlug && availableSlugs.length > 1;
  const isPaused = manualPaused || interactionPaused || reducedMotion;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreference = () => setReducedMotion(media.matches);
    syncPreference();
    media.addEventListener('change', syncPreference);
    return () => media.removeEventListener('change', syncPreference);
  }, []);

  useEffect(() => {
    if (!canRotate || isPaused) return;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % availableSlugs.length), ROTATION_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [availableSlugs.length, canRotate, isPaused]);

  const selectDiscipline = (slug: string) => setActiveIndex(Math.max(0, availableSlugs.indexOf(slug)));
  const move = (direction: -1 | 1) => setActiveIndex((current) => (current + direction + availableSlugs.length) % availableSlugs.length);

  return <div className="public-portal-overview">
    <PublicPortalMetrics counts={summary.counts} />
    {canRotate ? <PublicDisciplineCarousel
      slugs={availableSlugs}
      activeSlug={activeSlug}
      paused={isPaused}
      manuallyPaused={manualPaused}
      onSelect={selectDiscipline}
      onMove={move}
      onTogglePause={() => setManualPaused((paused) => !paused)}
      onInteractionChange={setInteractionPaused}
    /> : null}
    <div className="public-portal-slide" key={activeSlug} data-game={activeSlug} aria-live="polite">
      <PublicMatchesSection summary={scopedSummary} gameSlug={gameSlug} activeGameSlug={activeSlug} />
      <PublicCircuitSection summary={scopedSummary} gameSlug={gameSlug} activeGameSlug={activeSlug} />
      <PublicTeamsSection summary={scopedSummary} gameSlug={gameSlug} activeGameSlug={activeSlug} />
    </div>
  </div>;
}

export function PublicDisciplineCarousel({ slugs, activeSlug, paused, manuallyPaused, onSelect, onMove, onTogglePause, onInteractionChange }: {
  slugs: string[];
  activeSlug: string;
  paused: boolean;
  manuallyPaused: boolean;
  onSelect: (slug: string) => void;
  onMove: (direction: -1 | 1) => void;
  onTogglePause: () => void;
  onInteractionChange: (paused: boolean) => void;
}) {
  const activeGame = GAMES_CATALOG[activeSlug];
  const carouselRef = useRef<HTMLElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(carousel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    onInteractionChange(hovered || focused || !visible);
  }, [focused, hovered, onInteractionChange, visible]);

  return <section
    ref={carouselRef}
    id="public-portal-carousel"
    className="public-discipline-carousel"
    aria-label="Filtrar resumen por disciplina"
    onMouseEnter={() => setHovered(true)}
    onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)}
    onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
  >
    <div className="public-discipline-carousel-heading">
      <div><GameLogo game={activeGame} size="md" /><span><small>Escena seleccionada</small><strong>{activeGame?.name}</strong></span></div>
      <div className="public-discipline-carousel-actions">
        <button type="button" onClick={() => onMove(-1)} aria-label="Disciplina anterior"><ChevronLeft /></button>
        <button type="button" onClick={onTogglePause} aria-label={manuallyPaused ? 'Reanudar carrusel' : 'Pausar carrusel'}>{manuallyPaused ? <Play /> : <Pause />}</button>
        <button type="button" onClick={() => onMove(1)} aria-label="Disciplina siguiente"><ChevronRight /></button>
      </div>
    </div>
    <div className="public-discipline-carousel-track" role="tablist" aria-label="Disciplinas disponibles">
      {slugs.map((slug) => {
        const game = GAMES_CATALOG[slug];
        const selected = slug === activeSlug;
        return <button key={slug} type="button" role="tab" aria-selected={selected} className={selected ? 'is-active' : ''} data-game={slug} onClick={() => onSelect(slug)}>
          <GameLogo game={game} size="sm" /><span>{game.name}</span>{selected ? <i className={paused ? 'is-paused' : ''} /> : null}
        </button>;
      })}
    </div>
  </section>;
}

export function PublicPortalMetrics({ counts }: { counts: PublicPortalSummary['counts'] }) {
  const metrics = [
    { label: 'Atletas', value: counts.users, icon: Users },
    { label: 'Organizaciones', value: counts.organizations, icon: Building2 },
    { label: 'Competencias', value: counts.competitions, icon: Trophy },
    { label: 'Clubes', value: counts.teams, icon: Shield },
  ];
  return <section className="public-portal-metrics" aria-label="Resumen competitivo">{metrics.map((metric) => <PublicPortalMetricCard key={metric.label} {...metric} />)}</section>;
}

export function PublicMatchesSection({ summary, gameSlug, activeGameSlug }: PublicPortalProps & { activeGameSlug: string }) {
  const sectionId = `${gameSlug || 'global'}-matches-title`;
  return <section className="public-home-section public-portal-section" aria-labelledby={sectionId}>
    <PublicSectionHeading eyebrow="Actividad competitiva" title="Resultados y próximos encuentros" id={sectionId}>
      <Link href={`/${activeGameSlug}/partidos`}>Ver calendario <ArrowRight /></Link>
    </PublicSectionHeading>
    {summary.matches.length ? <div className="public-portal-match-grid">{summary.matches.slice(0, 4).map((match) => <PublicMatchCard key={match.id} match={match} />)}</div> : <EmptyPublicBlock icon={CalendarDays} text={`Todavía no hay encuentros publicados de ${GAMES_CATALOG[activeGameSlug]?.name}.`} />}
  </section>;
}

export function PublicCircuitSection({ summary, gameSlug, activeGameSlug }: PublicPortalProps & { activeGameSlug: string }) {
  const sectionId = `${gameSlug || 'global'}-circuit-title`;
  return <section className="public-home-section public-portal-section" aria-labelledby={sectionId}>
    <PublicSectionHeading eyebrow="Circuito oficial" title="Ligas y organizaciones destacadas" id={sectionId}>
      <Link href={`/${activeGameSlug}/competencias`}>Todas las competencias <ArrowRight /></Link>
    </PublicSectionHeading>
    <div className="public-portal-split-grid">
      <div className="public-portal-spotlight-grid">{summary.competitions.length ? summary.competitions.slice(0, 4).map((competition) => <PublicCompetitionCard key={competition.id} competition={competition} gameSlug={gameSlug || activeGameSlug} />) : <EmptyPublicBlock icon={Trophy} text="No hay ligas publicadas todavía." />}</div>
      <div className="public-portal-spotlight-grid">{summary.organizations.length ? summary.organizations.slice(0, 4).map((organization) => <PublicOrganizationCard key={organization.id} organization={organization} activeGameSlug={activeGameSlug} />) : <EmptyPublicBlock icon={Building2} text="No hay organizaciones publicadas todavía." />}</div>
    </div>
  </section>;
}

export function PublicTeamsSection({ summary, gameSlug, activeGameSlug }: PublicPortalProps & { activeGameSlug: string }) {
  const sectionId = `${gameSlug || 'global'}-teams-title`;
  return <section className="public-home-section public-portal-section" aria-labelledby={sectionId}>
    <PublicSectionHeading eyebrow="Clubes activos" title="Equipos que forman la escena" id={sectionId}>
      <Link href={`/${activeGameSlug}/equipos`}>Explorar equipos <ArrowRight /></Link>
    </PublicSectionHeading>
    {summary.teams.length ? <div className="public-portal-team-grid">{summary.teams.slice(0, 8).map((team) => <PublicTeamCard key={team.id} team={team} />)}</div> : <EmptyPublicBlock icon={Shield} text={`No hay equipos públicos de ${GAMES_CATALOG[activeGameSlug]?.name} todavía.`} />}
  </section>;
}

export function PublicPortalMetricCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return <div data-reactive-card><Icon /><span>{label}</span><strong>{value}</strong></div>;
}

export function EmptyPublicBlock({ icon: Icon, text }: { icon: typeof Radio; text: string }) {
  return <div className="public-portal-empty"><Icon /><span>{text}</span></div>;
}

function hasDisciplineContent(summary: PublicPortalSummary, slug: string): boolean {
  return summary.matches.some((item) => item.gameSlug === slug)
    || summary.competitions.some((item) => item.gameSlug === slug)
    || summary.teams.some((item) => item.gameSlug === slug)
    || summary.organizations.some((item) => item.allowedGames.includes(slug));
}

function scopeSummary(summary: PublicPortalSummary, slug: string): PublicPortalSummary {
  return {
    counts: summary.counts,
    matches: summary.matches.filter((item) => item.gameSlug === slug),
    competitions: summary.competitions.filter((item) => item.gameSlug === slug),
    organizations: summary.organizations.filter((item) => item.allowedGames.includes(slug)),
    teams: summary.teams.filter((item) => item.gameSlug === slug),
  };
}
