import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { GameConfig } from '@/lib/games-data';

export function getGamePortalStyle(game: GameConfig): CSSProperties {
  const palette = game.palette || [game.brandColor, game.accentColor, game.secondaryAccent, game.visualTheme.glow, game.visualTheme.highlight];
  const sem = game.semanticPalette;
  return {
    // 9 Balanced Semantic Tokens
    '--app-accent': sem.brandPrimary,
    '--app-accent-2': sem.brandSecondary,
    '--brand-900': sem.brandDeep,
    '--accent-success': sem.success,
    '--accent-warning': sem.warning,
    '--accent-crimson': sem.danger,
    '--game-canvas': sem.canvas,
    '--game-surface': sem.surface,
    '--game-border': sem.border,
    '--border-card-hover': sem.brandPrimary,
    // System & Visual Theme Compatibilities
    '--game-brand': sem.brandPrimary,
    '--game-accent': sem.brandSecondary,
    '--game-secondary-accent': game.secondaryAccent,
    '--game-dark-bg': sem.canvas,
    '--game-glow': game.visualTheme.glow,
    '--game-highlight': game.visualTheme.highlight,
    '--game-palette-1': palette[0] || sem.brandPrimary,
    '--game-palette-2': palette[1] || sem.brandSecondary,
    '--game-palette-3': palette[2] || game.secondaryAccent,
    '--game-palette-4': palette[3] || game.visualTheme.glow,
    '--game-palette-5': palette[4] || game.visualTheme.highlight,
    '--game-backdrop-position': game.backdropPosition || 'center top',
    '--game-backdrop-position-mobile': game.backdropPositionMobile || game.backdropPosition || 'center top',
    '--ui-accent': sem.brandPrimary,
    '--accent-cyan': sem.brandPrimary,
    '--accent-cyan-hover': sem.brandSecondary,
    '--accent-violet': sem.brandSecondary,
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
      />
      <div className="game-portal-backdrop-tint" />
      <div className="game-scene-grid" />
      <div className="game-scene-orb game-scene-orb-primary" />
      <div className="game-scene-orb game-scene-orb-secondary" />
      <div className="game-portal-backdrop-fade" />
    </div>
  );
}
