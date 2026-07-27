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
  brandColor = '#00F0FF',
  className = '',
}: PositionBadgeProps) {
  // Clean positions logic: omit NA, Sin Posición, or duplicates
  const cleanPrimary = primaryPosition && primaryPosition !== 'NA' && primaryPosition !== 'Sin Posición' ? primaryPosition.trim() : '';
  const cleanSecondary = secondaryPosition && secondaryPosition !== 'NA' && secondaryPosition !== 'Sin Posición' && secondaryPosition.trim() !== cleanPrimary ? secondaryPosition.trim() : '';

  if (!cleanPrimary && !cleanSecondary) {
    return (
      <Badge
        className={`font-mono uppercase text-[10px] bg-slate-900 border border-slate-700 text-slate-400 ${className}`}
      >
        Sin Posición
      </Badge>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {cleanPrimary && (
        <Badge
          className="font-mono uppercase text-[10px] font-black tracking-wider transition-all"
          style={{
            backgroundColor: `color-mix(in srgb, ${brandColor} 20%, transparent)`,
            color: brandColor,
            borderColor: `color-mix(in srgb, ${brandColor} 50%, transparent)`,
            boxShadow: `0 0 10px ${brandColor}1A`,
          }}
        >
          {cleanPrimary}
        </Badge>
      )}

      {cleanSecondary && (
        <Badge
          className="font-mono uppercase text-[10px] font-bold bg-slate-900/80 border border-slate-700 text-slate-300"
        >
          {cleanSecondary}
        </Badge>
      )}
    </div>
  );
}
