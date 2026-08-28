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
    <header
      className="ui-page-header game-section-hero flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8 p-5 sm:p-7 lg:p-9"
      style={{ '--page-brand': brandColor } as React.CSSProperties}
    >
      {/* Left Title & Description */}
      <div className="relative z-10 space-y-4 max-w-2xl">
        {badgeText && (
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md shadow-sm"
              style={{
                backgroundColor: `color-mix(in srgb, ${brandColor} 15%, transparent)`,
                borderColor: `color-mix(in srgb, ${brandColor} 40%, transparent)`,
                color: brandColor,
              }}
            >
              {badgeIcon || defaultIcon}
              {badgeText}
            </div>
          </div>
        )}

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-[-0.035em] text-[var(--text-heading)] uppercase leading-[0.94] text-balance">
          {title}{' '}
          {highlightTitle && (
            <span
              className="block"
              style={{
                color: brandColor,
                filter: `drop-shadow(0 0 24px color-mix(in srgb, ${brandColor} 38%, transparent))`,
              }}
            >
              {highlightTitle}
            </span>
          )}
        </h1>

        <p className="max-w-xl text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed font-medium text-pretty">
          {description}
        </p>
      </div>

      {/* Right Side Slot (Telemetry / Stats / Quick Action) */}
      {children && (
        <div className="relative z-10 flex-shrink-0 w-full lg:w-auto">
          {children}
        </div>
      )}
    </header>
  );
}
