import type { Metadata } from 'next';
import GameUIShowcaseClient from '@/features/design-system/components/game-ui-showcase-client';

export const metadata: Metadata = {
  title: 'Sistema visual | TorneosPro',
  description: 'Editor y catálogo interactivo del sistema de diseño global.',
};

export default async function GameUIPage({ params }: { params: Promise<{ gameSlug: string }> }) {
  const { gameSlug } = await params;
  return <GameUIShowcaseClient gameSlug={gameSlug} />;
}
