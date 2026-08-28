import Link from 'next/link';
import { ArrowRight, Building2, Gamepad2, Globe2, Radio, Shield, Sparkles, Trophy, UserRound, Users } from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games-data';
import { GameLogo } from '@/components/ui/game-logo';

const LIVE_MATCHES = [
  { id: 1, game: 'eafc26', home: 'LeguaYork eSp', away: 'Sangre Nueva FC', score: '2 – 1', detail: '82′' },
  { id: 2, game: 'csgo', home: 'Highfield XX', away: 'Torneos Pro Gaming', score: '14 – 11', detail: 'Ronda 26' },
  { id: 3, game: 'valorant', home: 'KRÜ Esports', away: 'Leviatán', score: '1 – 0', detail: 'Mapa 2' },
];

const GLOBAL_LINKS = [
  { href: '/equipos', label: 'Equipos', description: 'Clubes, plantillas y capitanes', icon: Shield, accent: 'var(--accent-emerald)' },
  { href: '/organizaciones', label: 'Organizaciones', description: 'Comunidades y ligas verificadas', icon: Building2, accent: 'var(--accent-violet)' },
  { href: '/usuarios', label: 'Atletas', description: 'Talento disponible para competir', icon: UserRound, accent: 'var(--accent-cyan)' },
];

export default function HomePage() {
  const games = Object.values(GAMES_CATALOG);

  return (
    <main className="public-home-page">
      <section className="public-live-strip" aria-label="Partidos en vivo">
        <div className="public-live-label"><span /><Radio className="size-3.5" />En vivo</div>
        <div className="public-live-matches">
          {LIVE_MATCHES.map((match) => {
            const game = GAMES_CATALOG[match.game];
            return (
              <div key={match.id} className="public-live-match">
                <GameLogo game={game} size="sm" />
                <span>{match.home}</span><strong>{match.score}</strong><span>{match.away}</span><small>{match.detail}</small>
              </div>
            );
          })}
        </div>
      </section>

      <section className="public-home-hero">
        <div className="public-home-hero-glow" />
        <div className="public-home-hero-copy">
          <p className="public-home-eyebrow"><Sparkles className="size-3.5" />Ecosistema competitivo multidisciplina</p>
          <h1>Tu escena competitiva, <span>en un solo lugar.</span></h1>
          <p className="public-home-description">
            Descubre clubes, atletas, organizaciones y circuitos sin elegir una disciplina primero. Cuando quieras competir, entra al portal de tu juego.
          </p>
          <div className="public-home-actions">
            <Link href="/equipos" className="public-home-primary">Explorar equipos<ArrowRight className="size-4" /></Link>
            <Link href="/organizaciones" className="public-home-secondary">Ver organizaciones</Link>
          </div>
        </div>

        <div className="public-home-overview" aria-label="Resumen del ecosistema">
          <div><Globe2 className="size-5" /><strong>Global</strong><span>Exploración sin filtros previos</span></div>
          <div><Gamepad2 className="size-5" /><strong>{games.length}</strong><span>Disciplinas conectadas</span></div>
          <div><Users className="size-5" /><strong>Abierto</strong><span>Para toda la comunidad</span></div>
        </div>
      </section>

      <section className="public-home-section" aria-labelledby="global-directory-title">
        <div className="public-home-section-heading">
          <div><p>Exploración global</p><h2 id="global-directory-title">Encuentra tu próximo paso</h2></div>
          <span>No necesitas una disciplina activa</span>
        </div>
        <div className="public-home-directory-grid">
          {GLOBAL_LINKS.map(({ href, label, description, icon: Icon, accent }) => (
            <Link key={href} href={href} className="public-home-directory-card" style={{ '--card-accent': accent } as React.CSSProperties}>
              <div><Icon className="size-6" /></div>
              <span><strong>{label}</strong><small>{description}</small></span>
              <ArrowRight className="size-5" />
            </Link>
          ))}
        </div>
      </section>

      <section className="public-home-section" aria-labelledby="disciplines-title">
        <div className="public-home-section-heading">
          <div><p>Portales especializados</p><h2 id="disciplines-title">Elige una disciplina cuando estés listo</h2></div>
          <span><Trophy className="size-3.5" />Competencias, fixtures y rankings</span>
        </div>
        <div className="public-home-games-grid">
          {games.map((game) => (
            <Link key={game.id} href={`/${game.slug}`} className="public-home-game-card" style={{ '--game-color': game.brandColor } as React.CSSProperties}>
              <div className="public-home-game-visual">
                <div className="public-home-game-glow" />
                <GameLogo game={game} size="xl" />
              </div>
              <div className="public-home-game-copy">
                <span>{game.category}</span>
                <h3>{game.name}</h3>
                <p>{game.tagline}</p>
              </div>
              <div className="public-home-game-action">Abrir portal<ArrowRight className="size-4" /></div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
