'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { GameConfig } from '@/lib/games-data';
import { cn } from '@/lib/utils';

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
  const pixels = { sm: 20, md: 32, lg: 48, xl: 64 }[size];

  if (!imageError && game.logoUrl) {
    return (
      <Image
        src={game.logoUrl}
        alt={game.name}
        width={pixels}
        height={pixels}
        sizes={`${pixels}px`}
        onError={() => setImageError(true)}
        className={cn("object-contain transition-all duration-300", sizeClasses, className)}
      />
    );
  }

  // Fallback to Icon / Emoji if image is missing
  return (
    <span className={cn("inline-flex items-center justify-center transition-all duration-300", sizeClasses, className)}>
      {game.icon}
    </span>
  );
}
