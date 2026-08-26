'use client';

import React from 'react';
import { RotateCcw } from 'lucide-react';

interface TelemetryMetric {
  label: string;
  value: string | number;
  highlight?: boolean;
}

interface TelemetryCardProps {
  categoryTitle?: string;
  tagline?: string;
  metrics: TelemetryMetric[];
  description?: string;
  onReset?: () => void;
  resetButtonText?: string;
  brandColor?: string;
}

export function TelemetryCard({
  metrics,
  onReset,
  resetButtonText = "Reiniciar",
  brandColor = 'var(--accent-cyan)',
}: TelemetryCardProps) {
  return (
    <div className="inline-flex items-center gap-3 p-2 px-3.5 rounded-xl bg-[var(--bg-card)]/40 backdrop-blur-xl border border-[var(--border-card)] shadow-sm text-xs font-medium flex-wrap transition-all">
      {/* Metrics Badges */}
      <div className="flex items-center gap-3">
        {metrics.map((m, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {m.label}:
            </span>
            <span
              className="font-bold text-[12px] uppercase"
              style={{
                color: m.highlight ? brandColor : 'var(--text-heading)',
              }}
            >
              {m.value}
            </span>
            {idx < metrics.length - 1 && <span className="text-[var(--text-muted)] opacity-40 ml-1.5">•</span>}
          </div>
        ))}
      </div>

      {/* Compact Reset Button */}
      {onReset && (
        <button
          onClick={onReset}
          title={resetButtonText}
          className="p-1.5 px-2.5 rounded-lg text-[11px] font-semibold text-white transition-all duration-200 flex items-center gap-1.5 border active:scale-95 shadow-sm"
          style={{
            backgroundColor: brandColor,
            borderColor: brandColor,
            boxShadow: `0 2px 10px color-mix(in srgb, ${brandColor} 30%, transparent)`,
          }}
        >
          <RotateCcw className="w-3 h-3" />
          <span>{resetButtonText}</span>
        </button>
      )}
    </div>
  );
}
