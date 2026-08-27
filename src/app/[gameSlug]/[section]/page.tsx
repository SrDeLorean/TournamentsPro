import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import GamePortalClient from '@/features/game-portal/components/game-portal-client';
import { GAMES_CATALOG } from '@/lib/games-data';
import { getSectionMetadata, isPublicGameSection, PUBLIC_GAME_SECTIONS } from '@/lib/section-config';

interface GameSectionPageProps {
  params: Promise<{ gameSlug: string; section: string }>;
}

export function generateStaticParams() {
  return Object.keys(GAMES_CATALOG).flatMap((gameSlug) =>
    PUBLIC_GAME_SECTIONS.map((section) => ({ gameSlug, section })),
  );
}

export async function generateMetadata({ params }: GameSectionPageProps): Promise<Metadata> {
  const { gameSlug, section } = await params;
  const game = GAMES_CATALOG[gameSlug];
  if (!game || !isPublicGameSection(section)) return {};
  const metadata = getSectionMetadata(game, section);

  return {
    title: `${metadata.title} ${metadata.highlightTitle} | ${game.name}`,
    description: metadata.description,
  };
}

export default async function GameSectionDynamicPage({ params }: GameSectionPageProps) {
  const resolvedParams = await params;
  if (!GAMES_CATALOG[resolvedParams.gameSlug] || !isPublicGameSection(resolvedParams.section)) notFound();

  return (
    <GamePortalClient
      gameSlug={resolvedParams.gameSlug}
      initialSection={resolvedParams.section}
    />
  );
}
