'use client';

import React from 'react';
import { Flame } from 'lucide-react';

interface PageHeaderProps {
  badgeText?: string;
  badgeIcon?: React.ReactNode;
  title: string;
  highlightTitle?: string;
  description: string;
  brandColor?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  badgeText,
  badgeIcon,
  title,
  highlightTitle,
  description,
  brandColor = 'var(--accent-cyan)',
  children,
}: PageHeaderProps) {
  const defaultIcon = <Flame className="w-3.5 h-3.5" style={{ color: brandColor, fill: brandColor }} />;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-2 pb-4">
      {/* Left Title & Description */}
      <div className="space-y-4 max-w-2xl">
        {badgeText && (
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border"
            style={{
              backgroundColor: `color-mix(in srgb, ${brandColor} 15%, transparent)`,
              borderColor: `color-mix(in srgb, ${brandColor} 40%, transparent)`,
              color: brandColor,
            }}
          >
            {badgeIcon || defaultIcon}
            {badgeText}
          </div>
        )}

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[var(--text-heading)] uppercase leading-none">
          {title}{' '}
          {highlightTitle && (
            <span
              className="block"
              style={{
                color: brandColor,
                filter: `drop-shadow(0 0 20px color-mix(in srgb, ${brandColor} 50%, transparent))`,
              }}
            >
              {highlightTitle}
            </span>
          )}
        </h1>

        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
          {description}
        </p>
      </div>

      {/* Right Side Slot (Telemetry / Stats / Quick Action) */}
      {children && (
        <div className="flex-shrink-0 w-full lg:w-auto">
          {children}
        </div>
      )}
    </div>
  );
}
