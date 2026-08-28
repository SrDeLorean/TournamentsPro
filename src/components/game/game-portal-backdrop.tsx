import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { GameConfig } from '@/lib/games-data';

export function getGamePortalStyle(game: GameConfig): CSSProperties {
  return {
    '--game-brand': game.brandColor,
    '--game-accent': game.accentColor,
    '--game-secondary-accent': game.secondaryAccent,
    '--game-dark-bg': game.darkBg,
    '--game-backdrop-position': game.backdropPosition || 'center top',
    '--game-backdrop-position-mobile': game.backdropPositionMobile || game.backdropPosition || 'center top',
  } as CSSProperties;
}

export function GamePortalBackdrop({ game }: { game: GameConfig }) {
  return (
    <div className="game-portal-backdrop" aria-hidden="true">
      <Image
        src={game.bannerUrl}
        alt=""
        fill
        sizes="100vw"
        priority
        className="game-portal-backdrop-image"
        style={{ objectPosition: 'var(--game-backdrop-position)' }}
      />
      <div className="game-portal-backdrop-tint" />
      <div className="game-portal-backdrop-fade" />
    </div>
  );
}
