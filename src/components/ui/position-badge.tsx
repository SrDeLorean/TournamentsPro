'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';

interface PositionBadgeProps {
  primaryPosition?: string | null;
  secondaryPosition?: string | null;
  brandColor?: string;
  className?: string;
}

export function PositionBadge({
  primaryPosition = '',
  secondaryPosition = '',
  brandColor = 'var(--app-accent)',
  className = '',
}: PositionBadgeProps) {
  // Clean positions logic: omit NA, Sin Posición, or duplicates
  const cleanPrimary = primaryPosition && primaryPosition !== 'NA' && primaryPosition !== 'Sin Posición' ? primaryPosition.trim() : '';
  const cleanSecondary = secondaryPosition && secondaryPosition !== 'NA' && secondaryPosition !== 'Sin Posición' && secondaryPosition.trim() !== cleanPrimary ? secondaryPosition.trim() : '';

  if (!cleanPrimary && !cleanSecondary) {
    return (
      <Badge
        className={`font-[family-name:var(--font-active)] uppercase text-[10px] font-bold bg-[var(--bg-card)]/80 border border-[var(--border-card)] text-[var(--text-muted)] ${className}`}
      >
        Sin Posición
      </Badge>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 font-[family-name:var(--font-active)] ${className}`}>
      {cleanPrimary && (
        <Badge
          className="font-[family-name:var(--font-active)] uppercase text-[10px] font-black tracking-wider transition-all"
          style={{
            backgroundColor: `color-mix(in srgb, ${brandColor} 15%, transparent)`,
            color: brandColor,
            borderColor: `color-mix(in srgb, ${brandColor} 40%, transparent)`,
            boxShadow: `0 0 12px ${brandColor}1A`,
          }}
        >
          {cleanPrimary}
        </Badge>
      )}

      {cleanSecondary && (
        <Badge
          className="font-[family-name:var(--font-active)] uppercase text-[10px] font-bold bg-[var(--bg-card)]/60 border border-[var(--border-card)] text-[var(--text-secondary)]"
        >
          {cleanSecondary}
        </Badge>
      )}
    </div>
  );
}
