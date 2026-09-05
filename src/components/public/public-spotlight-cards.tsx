'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Building2, CalendarDays, CheckCircle2, Clock3, Radio, Shield, Trophy, Users } from 'lucide-react';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { GameLogo } from '@/components/ui/game-logo';
import { GAMES_CATALOG } from '@/lib/games-data';
import { shouldBypassImageOptimization } from '@/lib/image-utils';
import type { PublicPortalMatch, PublicPortalSummary } from '@/lib/public-home-summary';

type Competition = PublicPortalSummary['competitions'][number];
type Organization = PublicPortalSummary['organizations'][number];
type Team = PublicPortalSummary['teams'][number];

interface CompactEntityCardProps {
  href: string;
  gameSlug: string;
  kind: string;
  title: string;
  subtitle: string;
  detail: string;
  bannerUrl: string;
  logoUrl?: string | null;
  fallback: string;
  icon: React.ReactNode;
  badge: React.ReactNode;
}

export function PublicCompetitionCard({ competition, gameSlug }: { competition: Competition; gameSlug?: string }) {
  const scope = gameSlug || competition.gameSlug;
  const game = GAMES_CATALOG[competition.gameSlug] || GAMES_CATALOG.eafc26;
  return <PublicCompactEntityCard
    href={gameSlug ? `/${scope}/competencias` : `/${scope}/competencias`}
    gameSlug={scope}
    kind="Competencia"
    title={competition.name}
    subtitle={competition.organizationName}
    detail={`${competition.format} · ${competition.startDate ? new Date(competition.startDate).toLocaleDateString('es-CL') : 'Fecha por confirmar'}`}
    bannerUrl={game.bannerUrl}
    fallback={competition.name}
    icon={<Trophy className="size-6" />}
    badge={<Badge variant="cyan">{competition.status}</Badge>}
  />;
}

export function PublicOrganizationCard({ organization, activeGameSlug }: { organization: Organization; activeGameSlug: string }) {
  const game = GAMES_CATALOG[activeGameSlug] || GAMES_CATALOG.eafc26;
  return <PublicCompactEntityCard
    href={`/${activeGameSlug}/organizacion/${organization.id}`}
    gameSlug={activeGameSlug}
    kind="Organización"
    title={organization.name}
    subtitle={`${organization.country} · ${organization.tag}`}
    detail={`${organization.teamsCount} clubes vinculados`}
    bannerUrl={organization.bannerUrl || game.bannerUrl}
    logoUrl={organization.logoUrl}
    fallback={organization.tag || organization.name}
    icon={<Building2 className="size-6" />}
    badge={<Badge variant="cyan">Verificada</Badge>}
  />;
}

export function PublicTeamCard({ team }: { team: Team }) {
  const game = GAMES_CATALOG[team.gameSlug] || GAMES_CATALOG.eafc26;
  return <PublicCompactEntityCard
    href={`/${team.gameSlug}/equipos/${team.id}`}
    gameSlug={team.gameSlug}
    kind="Equipo"
    title={team.name}
    subtitle={`${team.tag} · ${game.name}`}
    detail={`${team.membersCount} atletas en plantilla`}
    bannerUrl={team.bannerUrl || game.bannerUrl}
    logoUrl={team.logoUrl}
    fallback={team.tag || team.name}
    icon={<Shield className="size-6" />}
    badge={<span className="public-spotlight-card-count"><Users className="size-3.5" />{team.membersCount}</span>}
  />;
}

export function PublicMatchCard({ match }: { match: PublicPortalMatch }) {
  const status = normalizeMatchStatus(match.status);
  const isLive = status === 'EN_VIVO';
  const isFinished = status === 'FINALIZADO';
  const homeWon = isFinished && match.homeScore != null && match.awayScore != null && match.homeScore > match.awayScore;
  const awayWon = isFinished && match.homeScore != null && match.awayScore != null && match.awayScore > match.homeScore;

  return <Link href={`/${match.gameSlug}/partidos`} className="fixture-match-card public-portal-match-card" data-game={match.gameSlug} data-status={status} data-reactive-card>
    <header className="fixture-match-card-header">
      <div className="fixture-match-card-competition"><Trophy className="size-4" /><span>{match.competitionName}</span></div>
      <span className={`fixture-match-status is-${status.toLowerCase()}`}>
        {isLive ? <Radio className="size-3" /> : isFinished ? <CheckCircle2 className="size-3" /> : <Clock3 className="size-3" />}
        {isLive ? 'En vivo' : isFinished ? 'Finalizado' : 'Programado'}
      </span>
    </header>
    <div className="fixture-match-schedule"><span><CalendarDays className="size-3.5" />{match.displayDate}</span></div>
    <div className="fixture-match-versus">
      <MatchTeam name={match.home} tag={match.homeTag} logoUrl={match.homeLogoUrl} winner={homeWon} />
      <div className="fixture-match-score"><strong className={homeWon ? 'is-winner' : ''}>{match.homeScore ?? '-'}</strong><span>{isLive || isFinished ? ':' : 'VS'}</span><strong className={awayWon ? 'is-winner' : ''}>{match.awayScore ?? '-'}</strong></div>
      <MatchTeam name={match.away} tag={match.awayTag} logoUrl={match.awayLogoUrl} winner={awayWon} />
    </div>
    <footer className="fixture-match-card-footer"><span className="fixture-match-round">{match.organizationName}</span><span className="public-spotlight-card-action">Ver jornada <ArrowUpRight className="size-3.5" /></span></footer>
  </Link>;
}

function MatchTeam({ name, tag, logoUrl, winner }: { name: string; tag: string; logoUrl?: string | null; winner: boolean }) {
  return <div className={`fixture-match-team ${winner ? 'is-winner' : ''}`}>
    <Avatar src={logoUrl || undefined} alt={`Logo de ${name}`} fallback={tag || name} size="lg" />
    <span><strong>{name}</strong><small>{tag}</small></span>
  </div>;
}

function PublicCompactEntityCard({ href, gameSlug, kind, title, subtitle, detail, bannerUrl, logoUrl, fallback, icon, badge }: CompactEntityCardProps) {
  const game = GAMES_CATALOG[gameSlug] || GAMES_CATALOG.eafc26;
  return <Link href={href} className="public-spotlight-card" data-game={gameSlug} data-reactive-card>
    <div className="public-spotlight-card-visual">
      <Image src={bannerUrl} alt="" fill sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw" unoptimized={shouldBypassImageOptimization(bannerUrl)} />
      <div className="public-spotlight-card-shade" />
      <span className="public-spotlight-card-kind">{kind}</span>
      <GameLogo game={game} size="sm" />
    </div>
    <div className="public-spotlight-card-body">
      <div className="public-spotlight-card-logo">{logoUrl ? <Avatar src={logoUrl} alt={`Identidad de ${title}`} fallback={fallback} size="lg" /> : icon}</div>
      <div className="public-spotlight-card-copy"><strong>{title}</strong><span>{subtitle}</span></div>
      {badge}
      <p>{detail}</p>
      <span className="public-spotlight-card-action">Explorar <ArrowUpRight className="size-3.5" /></span>
    </div>
  </Link>;
}

function normalizeMatchStatus(status: string): 'EN_VIVO' | 'FINALIZADO' | 'PROGRAMADO' {
  const normalized = status.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  if (normalized.includes('VIVO') || normalized.includes('CURSO')) return 'EN_VIVO';
  if (normalized.includes('FINAL')) return 'FINALIZADO';
  return 'PROGRAMADO';
}
