'use client';

import Image from 'next/image';
import type { CSSProperties } from 'react';
import { Aperture, Layers3, Sparkles } from 'lucide-react';
import { Card3D, Card3DItem } from '@/components/3d/card-3d';
import { ParachuteDownloadButton } from '@/components/ui/parachute-download-button';
import { GameLogo } from '@/components/ui/game-logo';
import type { GameConfig } from '@/lib/games-data';
import { cn } from '@/lib/utils';

interface GameIdentityCardProps {
  game: GameConfig;
  compact?: boolean;
  showDownload?: boolean;
  className?: string;
}

export function GameIdentityCard({ game, compact = false, showDownload = true, className }: GameIdentityCardProps) {
  const identityData = JSON.stringify({
    game: game.name,
    slug: game.slug,
    palette: {
      primary: game.brandColor,
      accent: game.accentColor,
      secondary: game.secondaryAccent,
      glow: game.visualTheme.glow,
      highlight: game.visualTheme.highlight,
    },
    direction: game.visualTheme,
  }, null, 2);

  return (
    <Card3D
      variant="game"
      accentColor={game.visualTheme.glow}
      maxTilt={compact ? 5 : 8}
      className={cn('game-identity-card', compact && 'is-compact', className)}
    >
      <div
        className="game-identity-card-inner"
        style={{
          '--identity-primary': game.brandColor,
          '--identity-accent': game.accentColor,
          '--identity-glow': game.visualTheme.glow,
          '--identity-highlight': game.visualTheme.highlight,
        } as CSSProperties}
      >
        <Image
          src={game.bannerUrl}
          alt=""
          fill
          sizes={compact ? '(max-width: 768px) 100vw, 33vw' : '(max-width: 768px) 100vw, 50vw'}
          className="game-identity-card-image"
        />
        <span className="game-identity-card-wash" aria-hidden="true" />
        <span className="game-identity-card-grid" aria-hidden="true" />

        <Card3DItem depth={36} className="game-identity-card-content">
          <div className="game-identity-card-heading">
            <span className="game-identity-card-logo"><GameLogo game={game} size="lg" /></span>
            <span>
              <small>{game.visualTheme.scene}</small>
              <strong>{game.name}</strong>
              <em>{game.category}</em>
            </span>
          </div>

          <div className="game-identity-card-signals">
            <span><Aperture /> {game.visualTheme.motif}</span>
            <span><Layers3 /> Profundidad adaptativa</span>
            <span><Sparkles /> Arena v2</span>
          </div>

          <div className="game-identity-card-swatches" aria-label={`Paleta de ${game.name}`}>
            {[game.brandColor, game.accentColor, game.visualTheme.glow, game.visualTheme.highlight].map((color) => (
              <span key={color} style={{ backgroundColor: color }} title={color} />
            ))}
          </div>

          {showDownload && (
            <ParachuteDownloadButton
              data={identityData}
              fileName={`${game.slug}-visual-identity.json`}
              label="Descargar identidad"
            />
          )}
        </Card3DItem>
      </div>
    </Card3D>
  );
}
