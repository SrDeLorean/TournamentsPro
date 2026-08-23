'use client';

import React from 'react';
import { GameConfig } from '@/lib/games-data';
import { Activity } from 'lucide-react';

interface TacticalLoadingSkeletonProps {
  game: GameConfig;
  message?: string;
}

export function TacticalLoadingSkeleton({ game, message }: TacticalLoadingSkeletonProps) {
  const brandColor = game?.brandColor || '#FF4654';
  const [progress, setProgress] = React.useState(12);

  React.useEffect(() => {
    const t1 = setTimeout(() => setProgress(35), 100);
    const t2 = setTimeout(() => setProgress(68), 300);
    const t3 = setTimeout(() => setProgress(88), 550);
    const t4 = setTimeout(() => setProgress(100), 750);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  return (
    <div className="w-full space-y-8 font-mono animate-in fade-in duration-500">
      {/* 1. TACTICAL RADAR PULSE HEADER LOADER */}
      <div className="p-8 sm:p-12 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-2xl text-center relative overflow-hidden flex flex-col items-center justify-center space-y-5 backdrop-blur-md">
        {/* Glowing Background Radial */}
        <div
          className="absolute w-72 h-72 rounded-full blur-3xl opacity-20 animate-pulse pointer-events-none"
          style={{ backgroundColor: brandColor }}
        />

        {/* Animated Game Logo / Icon Container */}
        <div className="relative flex items-center justify-center">
          {/* Radar Ring 1 */}
          <div
            className="absolute w-24 h-24 rounded-full border-2 border-dashed opacity-40 animate-spin"
            style={{ borderColor: brandColor, animationDuration: '12s' }}
          />
          {/* Radar Ring 2 */}
          <div
            className="absolute w-32 h-32 rounded-full border opacity-20 animate-ping"
            style={{ borderColor: brandColor }}
          />

          {/* Logo image or icon fallback */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl border-2 z-10 bg-[var(--bg-main)] p-2.5 transform hover:scale-110 transition-transform"
            style={{ borderColor: brandColor, boxShadow: `0 0 30px ${brandColor}40` }}
          >
            {game?.logoUrl ? (
              <img src={game.logoUrl} alt={game.name || 'Juego'} className="w-full h-full object-contain filter drop-shadow-md" />
            ) : (
              <span className="text-3xl">{game?.icon || '🎯'}</span>
            )}
          </div>
        </div>

        {/* Status Text & Spinner */}
        <div className="space-y-1 z-10">
          <div className="flex items-center justify-center gap-2 text-sm font-black uppercase text-[var(--text-heading)] tracking-widest">
            <Activity className="w-4 h-4 animate-spin" style={{ color: brandColor }} />
            <span>{message || `SINCRONIZANDO DATOS TÁCTICOS DE ${game?.name || 'LA LIGA'}...`}</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] font-sans">
            Consultando encuentros reales y clasificaciones en la Base de Datos...
          </p>
        </div>

        {/* Dynamic Tactical Live Progress Bar */}
        <div className="space-y-2 z-10 w-72 sm:w-80">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold">
            <span className="text-[var(--text-muted)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: brandColor }} />
              <span>CARGANDO RECURSOS BD...</span>
            </span>
            <span className="font-mono text-xs font-black tracking-wider" style={{ color: brandColor }}>
              {progress}%
            </span>
          </div>

          <div className="w-full h-2.5 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border-card)] relative p-0.5 shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden"
              style={{
                width: `${progress}%`,
                backgroundColor: brandColor,
                boxShadow: `0 0 18px ${brandColor}`,
              }}
            >
              {/* Laser Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. SKELETON DATE CAROUSEL PLACEHOLDER */}
      <div className="p-4 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-3">
        <div className="h-4 w-48 bg-[var(--bg-main)] rounded-lg animate-pulse mx-auto" />
        <div className="flex items-center justify-center gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-32 h-20 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] animate-pulse shrink-0 flex flex-col items-center justify-center p-3 space-y-2"
            >
              <div className="h-3 w-16 bg-[var(--border-card)] rounded" />
              <div className="h-5 w-12 bg-[var(--border-card)] rounded font-bold" />
              <div className="h-3 w-14 bg-[var(--border-card)] rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* 3. SKELETON MATCH CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-4 shadow-xl animate-pulse"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-2">
              <div className="h-3 w-24 bg-[var(--border-card)] rounded" />
              <div className="h-4 w-16 bg-[var(--border-card)] rounded-full" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[var(--border-card)]" />
                  <div className="h-4 w-28 bg-[var(--border-card)] rounded" />
                </div>
                <div className="h-5 w-8 bg-[var(--border-card)] rounded font-bold text-center" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[var(--border-card)]" />
                  <div className="h-4 w-28 bg-[var(--border-card)] rounded" />
                </div>
                <div className="h-5 w-8 bg-[var(--border-card)] rounded font-bold text-center" />
              </div>
            </div>
            <div className="pt-2 border-t border-[var(--border-card)] flex items-center justify-between">
              <div className="h-3 w-20 bg-[var(--border-card)] rounded" />
              <div className="h-8 w-28 bg-[var(--border-card)] rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
