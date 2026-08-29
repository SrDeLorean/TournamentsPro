import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GAMES_CATALOG } from '@/lib/games-data';
import { GameSubNavbar } from '@/components/layout/game-sub-navbar';
import { GamePortalBackdrop, getGamePortalStyle } from '@/components/game/game-portal-backdrop';

interface GameLayoutProps {
  children: React.ReactNode;
  params: Promise<{ gameSlug: string }>;
}

export function generateStaticParams() {
  return Object.keys(GAMES_CATALOG).map((gameSlug) => ({ gameSlug }));
}

export async function generateMetadata({ params }: Omit<GameLayoutProps, 'children'>): Promise<Metadata> {
  const { gameSlug } = await params;
  const game = GAMES_CATALOG[gameSlug];
  if (!game) return {};

  return {
    title: `${game.name} | TorneosPro`,
    description: game.description,
  };
}

export default async function GameLayout({ children, params }: GameLayoutProps) {
  const { gameSlug } = await params;
  const game = GAMES_CATALOG[gameSlug];
  if (!game) notFound();

  return (
    <div
      className="game-portal game-slug-shell min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)]"
      data-game={gameSlug}
      style={getGamePortalStyle(game)}
    >
      <GameSubNavbar game={game} />
      <div className="game-portal-stage game-slug-content relative min-h-screen">
        <GamePortalBackdrop game={game} />
        <div className="relative z-10 min-h-screen">{children}</div>
      </div>
    </div>
  );
}
