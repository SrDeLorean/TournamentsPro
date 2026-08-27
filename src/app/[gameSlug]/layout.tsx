import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GAMES_CATALOG } from '@/lib/games-data';

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
  if (!GAMES_CATALOG[gameSlug]) notFound();

  return <div className="contents" data-game={gameSlug}>{children}</div>;
}
