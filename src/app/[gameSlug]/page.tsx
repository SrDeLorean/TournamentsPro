import GamePortalClient from '@/features/game-portal/components/game-portal-client';
import { getPublicPortalSummary } from '@/lib/public-home-data';

export const revalidate = 60;

interface GamePageProps {
  params: Promise<{ gameSlug: string }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const { gameSlug } = await params;
  const summary = await getPublicPortalSummary(gameSlug);
  return <GamePortalClient gameSlug={gameSlug} initialOverview={summary} />;
}
