'use client';

import React, { use } from 'react';
import GameDedicatedPortalPage from '../page';

interface GameSectionPageProps {
  params: Promise<{ gameSlug: string; section: string }>;
}

export default function GameSectionDynamicPage({ params }: GameSectionPageProps) {
  const { section } = use(params);

  // Delegate rendering to the game portal page with initial section set
  return <GameDedicatedPortalPage params={params} initialSection={section} />;
}
