'use client';

import React, { useState } from 'react';
import { GameConfig } from '@/lib/games-data';

interface GameLogoProps {
  game: GameConfig;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function GameLogo({ game, className = '', size = 'md' }: GameLogoProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-5 h-5 text-sm',
    md: 'w-8 h-8 text-xl',
    lg: 'w-12 h-12 text-3xl',
    xl: 'w-16 h-16 text-4xl',
  }[size];

  if (!imageError && game.logoUrl) {
    return (
      <img
        src={game.logoUrl}
        alt={game.name}
        onError={() => setImageError(true)}
        className={`object-contain transition-transform duration-300 ${sizeClasses} ${className}`}
      />
    );
  }

  // Fallback to Icon / Emoji if image is missing
  return (
    <span className={`inline-flex items-center justify-center ${sizeClasses} ${className}`}>
      {game.icon}
    </span>
  );
}
