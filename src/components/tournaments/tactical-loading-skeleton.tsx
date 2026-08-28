'use client';

import { Activity } from 'lucide-react';
import type { GameConfig } from '@/lib/games-data';
import { GameLogo } from '@/components/ui/game-logo';

interface TacticalLoadingSkeletonProps {
  game: GameConfig;
  message?: string;
}

export function TacticalLoadingSkeleton({ game, message }: TacticalLoadingSkeletonProps) {
  const brandColor = game?.brandColor || 'var(--game-brand)';

  return (
    <section
      className="portal-data-loading"
      style={{ '--loading-brand': brandColor } as React.CSSProperties}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="portal-data-loading-status">
        <div className="portal-data-loading-logo">
          <GameLogo game={game} size="lg" />
        </div>
        <div>
          <p><Activity className="size-3.5 animate-pulse" />Actualizando directorio</p>
          <h2>{message || `Cargando información de ${game?.name || 'la disciplina'}...`}</h2>
          <span>La información aparecerá automáticamente cuando esté disponible.</span>
        </div>
      </div>

      <div className="portal-data-loading-toolbar skeleton" aria-hidden="true" />
      <div className="game-directory-grid" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="portal-data-loading-card">
            <div className="portal-data-loading-banner skeleton" />
            <div className="portal-data-loading-card-body">
              <div className="portal-data-loading-avatar skeleton" />
              <div className="portal-data-loading-lines">
                <span className="skeleton" />
                <span className="skeleton" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
