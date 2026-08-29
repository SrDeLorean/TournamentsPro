'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GAMES_CATALOG } from '@/lib/games-data';
import { UserProfileSettingsView } from '@/components/user/user-profile-settings-view';
import { Button } from '@/components/ui/button';

interface AtletaAjustesPageProps {
  params: Promise<{ gameSlug: string }>;
}

export default function DedicatedAtletaAjustesPage({ params }: AtletaAjustesPageProps) {
  const { gameSlug } = use(params);
  const router = useRouter();

  let game = GAMES_CATALOG[gameSlug];
  if (!game && (gameSlug === 'cs2' || gameSlug === 'csgo')) {
    game = GAMES_CATALOG['csgo'];
  }

  if (!game) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold mb-4 text-[var(--text-heading)]">Juego no encontrado</h1>
        <p className="text-[var(--text-muted)] mb-6">El juego solicitado no existe en nuestro catálogo eSports.</p>
        <Link href="/">
          <Button variant="primary">Volver al Inicio</Button>
        </Link>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-20 relative transition-all duration-500 bg-[var(--bg-main)] text-[var(--text-primary)]"
      style={{
        '--game-brand': game.brandColor,
        '--game-accent': game.accentColor,
      } as React.CSSProperties}
    >
      <div className="w-full pt-0 pb-6 relative">
        <UserProfileSettingsView
          brandColor={game.brandColor}
          onBack={() => router.push(`/${game.slug}`)}
        />
      </div>
    </div>
  );
}
