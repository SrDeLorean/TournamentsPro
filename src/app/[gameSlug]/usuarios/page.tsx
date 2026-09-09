import { notFound } from 'next/navigation';
import GamePortalClient from '@/features/game-portal/components/game-portal-client';
import { GAMES_CATALOG } from '@/lib/games-data';
import { getPublicPortalSummary } from '@/lib/public-home-data';

export default async function GameUsersPage({ params }: { params: Promise<{ gameSlug: string }> }) {
  const { gameSlug } = await params;
  if (!GAMES_CATALOG[gameSlug]) notFound();

  const summary = await getPublicPortalSummary(gameSlug);

  return (
    <GamePortalClient
      gameSlug={gameSlug}
      initialSection="jugadores"
      initialOverview={summary}
    />
  );
}
