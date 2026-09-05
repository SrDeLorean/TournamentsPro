'use client';

import { useId, type CSSProperties, type ReactNode } from 'react';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameExplorerPanelProps {
  title: string;
  description: string;
  brandColor?: string;
  icon?: ReactNode;
  onReset?: () => void;
  resetDisabled?: boolean;
  resetLabel?: string;
  className?: string;
  children: ReactNode;
}

/** Shared query surface for every public game directory and competition view. */
export function GameExplorerPanel({
  title,
  description,
  brandColor = 'var(--game-brand)',
  icon,
  onReset,
  resetDisabled = false,
  resetLabel = 'Restablecer',
  className = '',
  children,
}: GameExplorerPanelProps) {
  const headingId = useId();
  const panelStyle = brandColor === 'var(--game-brand)'
    ? undefined
    : ({ '--game-brand': brandColor, '--filter-brand': brandColor } as CSSProperties);

  return (
    <section
      aria-labelledby={headingId}
      className={cn('game-explorer-panel game-directory-explorer game-filter-card game-query-panel font-[family-name:var(--font-active)]', className)}
      style={panelStyle}
    >
      <div className="game-explorer-panel-glow" aria-hidden="true" />
      <div className="game-filter-heading font-[family-name:var(--font-active)]">
        <div className="game-filter-heading-copy">
          <span className="game-filter-heading-icon" aria-hidden="true">
            {icon ?? <SlidersHorizontal className="size-4" />}
          </span>
          <div>
            <h2 id={headingId}>{title}</h2>
            <p>{description}</p>
          </div>
        </div>

        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            disabled={resetDisabled}
            className="game-filter-reset"
          >
            <RotateCcw className="size-3.5" />
            <span>{resetLabel}</span>
          </button>
        ) : null}
      </div>

      <div className="game-explorer-content">{children}</div>
    </section>
  );
}
