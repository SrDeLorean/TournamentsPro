import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Gamepad2,
  Globe2,
  Radio,
  Shield,
  Sparkles,
  Trophy,
  UserRound,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GameLogo } from '@/components/ui/game-logo';
import type { GameConfig } from '@/lib/games-data';
import { GAMES_CATALOG } from '@/lib/games-data';
import type { PublicPortalMatch, PublicPortalSummary } from '@/lib/public-home-summary';

const GLOBAL_LINKS = [
  { href: '/equipos', label: 'Equipos', description: 'Clubes, plantillas y capitanes', icon: Shield },
  { href: '/organizaciones', label: 'Organizaciones', description: 'Comunidades y ligas verificadas', icon: Building2 },
  { href: '/usuarios', label: 'Atletas', description: 'Talento disponible para competir', icon: UserRound },
];

export function PublicLiveStrip({ matches }: { matches: PublicPortalMatch[] }) {
  return (
    <section className="public-live-strip" aria-label="Partidos en vivo">
      <div className="public-live-label">
        <Badge variant="rose" is3D className="animate-pulse"><Radio className="mr-1 size-3" /> En vivo</Badge>
      </div>
      <div className="public-live-matches">
        {matches.slice(0, 3).map((match) => <PublicLiveMatchChip key={match.id} match={match} />)}
        {!matches.length ? (
          <div className="public-live-match" data-reactive-card>
            <Radio className="size-4 text-[var(--app-accent)]" /><span>Calendario competitivo</span><strong>Próximamente</strong>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function PublicHomeHero({ summary, gamesCount }: { summary: PublicPortalSummary; gamesCount: number }) {
  const metrics = [
    { icon: Globe2, value: summary.counts.organizations, label: 'Organizaciones verificadas' },
    { icon: Gamepad2, value: gamesCount, label: 'Disciplinas conectadas' },
    { icon: Users, value: summary.counts.users, label: 'Atletas públicos' },
  ];

  return (
    <section className="public-home-hero">
      <div className="public-home-hero-glow" />
      <div className="public-home-hero-copy">
        <Badge variant="cyan" is3D className="self-start"><Sparkles className="mr-1 size-3.5" /> Ecosistema competitivo multidisciplina</Badge>
        <h1>Tu escena competitiva, <span>en un solo lugar.</span></h1>
        <p className="public-home-description">Descubre clubes, atletas, organizaciones y circuitos sin elegir una disciplina primero. Cuando quieras competir, entra al portal de tu juego.</p>
        <div className="public-home-actions">
          <Link href="/equipos"><Button variant="primary" size="lg">Explorar equipos <ArrowRight className="ml-2 size-4" /></Button></Link>
          <Link href="/organizaciones"><Button variant="outline" size="lg">Ver organizaciones</Button></Link>
        </div>
      </div>
      <div className="public-home-overview" aria-label="Resumen del ecosistema">
        {metrics.map((metric) => <PublicSummaryMetric key={metric.label} {...metric} />)}
      </div>
    </section>
  );
}

export function PublicDirectorySection() {
  return (
    <section className="public-home-section" aria-labelledby="global-directory-title">
      <PublicSectionHeading eyebrow="Exploración global" title="Encuentra tu próximo paso" id="global-directory-title">
        <span>No necesitas una disciplina activa</span>
      </PublicSectionHeading>
      <div className="public-home-directory-grid">
        {GLOBAL_LINKS.map((shortcut) => <PublicDirectoryShortcutCard key={shortcut.href} {...shortcut} />)}
      </div>
    </section>
  );
}

export function PublicDisciplineSection({ games }: { games: GameConfig[] }) {
  return (
    <section className="public-home-section" aria-labelledby="disciplines-title">
      <PublicSectionHeading eyebrow="Portales especializados" title="Elige una disciplina cuando estés listo" id="disciplines-title">
        <Badge variant="cyan" is3D><Trophy className="mr-1 size-3.5" />Competencias, fixtures y rankings</Badge>
      </PublicSectionHeading>
      <div className="public-home-games-grid">
        {games.map((game) => <PublicDisciplineCard key={game.id} game={game} />)}
      </div>
    </section>
  );
}

export function PublicDisciplineCard({ game }: { game: GameConfig }) {
  return (
    <Link
      href={`/${game.slug}`}
      className="public-home-game-card group"
      data-game={game.slug}
      data-reactive-card
    >
      <div className="public-home-game-visual">
        <Image
          src={game.bannerUrl}
          alt=""
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 48vw, 100vw"
          className="public-home-game-banner"
        />
        <div className="public-home-game-shade" />
        <div className="public-home-game-glow" />
        <GameLogo game={game} size="xl" />
      </div>
      <div className="public-home-game-copy">
        <span>{game.category}</span><h3>{game.name}</h3><p>{game.tagline}</p>
      </div>
      <div className="public-home-game-action">Abrir portal <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" /></div>
    </Link>
  );
}

export function PublicLiveMatchChip({ match }: { match: PublicPortalMatch }) {
  return <div className="public-live-match" data-reactive-card>
    <GameLogo game={GAMES_CATALOG[match.gameSlug]} size="sm" />
    <span>{match.home}</span><strong>{match.score}</strong><span>{match.away}</span><small>{match.status}</small>
  </div>;
}

export function PublicSummaryMetric({ icon: Icon, value, label }: { icon: typeof Globe2; value: number; label: string }) {
  return <div data-reactive-card><Icon className="size-5" /><strong>{value}</strong><span>{label}</span></div>;
}

export function PublicDirectoryShortcutCard({ href, label, description, icon: Icon }: (typeof GLOBAL_LINKS)[number]) {
  return <Link href={href} className="public-home-directory-card group" data-reactive-card>
    <div><Icon className="size-6" /></div>
    <span><strong>{label}</strong><small>{description}</small></span>
    <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
  </Link>;
}

export function PublicSectionHeading({ eyebrow, title, id, children }: { eyebrow: string; title: string; id: string; children?: React.ReactNode }) {
  return (
    <header className="public-home-section-heading">
      <div><p>{eyebrow}</p><h2 id={id}>{title}</h2></div>
      {children}
    </header>
  );
}
