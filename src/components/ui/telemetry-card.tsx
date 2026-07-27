'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
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
  categoryTitle = "Telemetría",
  metrics,
  onReset,
  resetButtonText = "Reiniciar",
  brandColor = 'var(--accent-cyan)',
}: TelemetryCardProps) {
  return (
    <div className="inline-flex items-center gap-3 p-2 px-3.5 rounded-xl glass-panel border border-[var(--border-card)] shadow-md text-xs font-medium flex-wrap">
      {/* Metrics Badges */}
      <div className="flex items-center gap-3">
        {metrics.map((m, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
              {m.label}:
            </span>
            <span
              className="font-black text-xs uppercase"
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
          className="p-1 px-2 rounded-lg text-[10px] font-bold text-white transition-all flex items-center gap-1 border hover:scale-105"
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
