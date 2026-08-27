import GamePortalClient from '@/features/game-portal/components/game-portal-client';

interface GamePageProps {
  params: Promise<{ gameSlug: string }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const { gameSlug } = await params;
  return <GamePortalClient gameSlug={gameSlug} />;
}
