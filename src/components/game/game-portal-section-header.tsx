import type { ReactNode } from 'react';
import {
  Activity,
  BarChart3,
  Building2,
  Database,
  Medal,
  Shield,
  Sparkles,
  Trophy,
  UserRound,
  Users,
} from 'lucide-react';
import type { GameConfig } from '@/lib/games-data';
import { getSectionMetadata, type PublicGameSection } from '@/lib/section-config';
import type { PublicPortalSummary } from '@/lib/public-home-summary';
import { GameLogo } from '@/components/ui/game-logo';
import { PageHeader, PageHeaderMetrics, type PageHeaderMetric } from '@/components/ui/page-header';

export type GamePortalHeaderSection = PublicGameSection | 'home';

interface GamePortalSectionHeaderProps {
  game: GameConfig;
  section: GamePortalHeaderSection;
  summary?: PublicPortalSummary;
}

const EMPTY_COUNTS: PublicPortalSummary['counts'] = {
  users: 0,
  organizations: 0,
  teams: 0,
  competitions: 0,
  liveMatches: 0,
};

function metric(icon: ReactNode, label: string, value: number): PageHeaderMetric {
  return { icon, label, value };
}

function getSectionMetrics(
  section: GamePortalHeaderSection,
  summary?: PublicPortalSummary,
): PageHeaderMetric[] {
  const counts = summary?.counts || EMPTY_COUNTS;
  const scheduledMatches = summary?.matches.length || 0;

  switch (section) {
    case 'organizaciones':
      return [
        metric(<Building2 />, 'Organizaciones', counts.organizations),
        metric(<Trophy />, 'Competencias', counts.competitions),
        metric(<Shield />, 'Equipos', counts.teams),
      ];
    case 'competencias':
      return [
        metric(<Trophy />, 'Competencias', counts.competitions),
        metric(<Activity />, 'En vivo', counts.liveMatches),
        metric(<Shield />, 'Equipos', counts.teams),
      ];
    case 'clasificacion':
      return [
        metric(<BarChart3 />, 'Equipos', counts.teams),
        metric(<Trophy />, 'Torneos', counts.competitions),
        metric(<Activity />, 'Encuentros', scheduledMatches),
      ];
    case 'partidos':
      return [
        metric(<Activity />, 'Encuentros', scheduledMatches),
        metric(<Sparkles />, 'En vivo', counts.liveMatches),
        metric(<Trophy />, 'Competencias', counts.competitions),
      ];
    case 'traspasos':
      return [
        metric(<UserRound />, 'Atletas', counts.users),
        metric(<Shield />, 'Equipos', counts.teams),
        metric(<Building2 />, 'Organizaciones', counts.organizations),
      ];
    case 'equipos':
      return [
        metric(<Shield />, 'Equipos', counts.teams),
        metric(<Users />, 'Atletas', counts.users),
        metric(<Building2 />, 'Organizaciones', counts.organizations),
      ];
    case 'jugadores':
      return [
        metric(<UserRound />, 'Jugadores', counts.users),
        metric(<Shield />, 'Equipos', counts.teams),
        metric(<Trophy />, 'Competencias', counts.competitions),
      ];
    case 'tops':
      return [
        metric(<Medal />, 'Clasificados', counts.users),
        metric(<Shield />, 'Equipos', counts.teams),
        metric(<Trophy />, 'Torneos', counts.competitions),
      ];
    case 'infografia':
      return [
        metric(<BarChart3 />, 'Encuentros', scheduledMatches),
        metric(<Users />, 'Atletas', counts.users),
        metric(<Shield />, 'Equipos', counts.teams),
      ];
    case 'datos':
      return [
        metric(<Database />, 'Competencias', counts.competitions),
        metric(<Building2 />, 'Organizaciones', counts.organizations),
        metric(<Shield />, 'Equipos', counts.teams),
      ];
    default:
      return [
        metric(<Trophy />, 'Competencias', counts.competitions),
        metric(<Shield />, 'Equipos', counts.teams),
        metric(<Users />, 'Atletas', counts.users),
      ];
  }
}

export function GamePortalSectionHeader({ game, section, summary }: GamePortalSectionHeaderProps) {
  const metadata = getSectionMetadata(game, section);
  const isHome = section === 'home';

  return (
    <PageHeader
      className="game-dashboard-header game-portal-section-header"
      badgeText={isHome ? `Portal oficial · ${game.category}` : metadata.badgeText}
      badgeIcon={<Sparkles className="size-3.5" />}
      heroIcon={<GameLogo game={game} size="xl" />}
      title={isHome ? game.name : metadata.title}
      highlightTitle={isHome ? game.tagline : metadata.highlightTitle}
      description={isHome ? game.description : metadata.description}
      brandColor={game.brandColor}
      density="cinematic"
    >
      <PageHeaderMetrics items={getSectionMetrics(section, summary)} />
    </PageHeader>
  );
}
