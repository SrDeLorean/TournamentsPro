'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Tone = 'cyan' | 'violet' | 'emerald' | 'gold' | 'crimson';

const toneStyles: Record<Tone, { accent: string; soft: string }> = {
  cyan: { accent: 'var(--app-accent)', soft: 'color-mix(in srgb, var(--app-accent) 12%, transparent)' },
  violet: { accent: 'var(--app-accent-2)', soft: 'color-mix(in srgb, var(--app-accent-2) 12%, transparent)' },
  emerald: { accent: 'var(--app-positive)', soft: 'color-mix(in srgb, var(--app-positive) 12%, transparent)' },
  gold: { accent: 'var(--app-warning)', soft: 'color-mix(in srgb, var(--app-warning) 12%, transparent)' },
  crimson: { accent: 'var(--app-danger)', soft: 'color-mix(in srgb, var(--app-danger) 12%, transparent)' },
};

export function ManagementPage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('management-page', className)}>{children}</div>;
}

export function ManagementHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  tone = 'cyan',
  badge,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone?: Tone;
  badge?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const colors = toneStyles[tone];

  return (
    <section
      className="management-hero"
      style={{ '--management-accent': colors.accent, '--management-soft': colors.soft } as React.CSSProperties}
    >
      <div className="management-hero-grid" aria-hidden="true" />
      <div className="management-hero-glow" aria-hidden="true" />
      <div className="management-hero-main">
        <div className="management-hero-copy">
          <div className="management-hero-icon">
            <Icon className="size-5 sm:size-7" />
          </div>
          <div className="management-hero-text">
            <div className="management-hero-kicker">
              <span className="management-eyebrow">{eyebrow}</span>
              {badge ? <Badge variant={tone === 'crimson' ? 'rose' : tone}>{badge}</Badge> : null}
            </div>
            <h1 className="management-title">{title}</h1>
            <p className="management-description">{description}</p>
          </div>
        </div>
        {actions ? <div className="management-actions">{actions}</div> : null}
      </div>
      {children ? <div className="management-hero-content">{children}</div> : null}
    </section>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'cyan',
  onClick,
  ariaLabel,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: LucideIcon;
  tone?: Tone;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const colors = toneStyles[tone];
  const card = (
    <Card
      className="management-metric"
      style={{ '--management-accent': colors.accent, '--management-soft': colors.soft } as React.CSSProperties}
    >
      <div className="management-metric-layout">
        <div className="management-metric-icon">
          <Icon className="size-5" />
        </div>
        <div className="management-metric-copy">
          <p className="management-metric-label">{label}</p>
          <div className="management-metric-value">{value}</div>
          {hint ? <p className="management-metric-hint">{hint}</p> : null}
        </div>
      </div>
    </Card>
  );
  if (!onClick) return card;
  return <button type="button" className="management-metric-trigger" onClick={onClick} aria-label={ariaLabel || `Ver detalle de ${label}`}>{card}</button>;
}

export function ManagementMetrics({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('management-metrics', className)}>{children}</div>;
}

export interface ManagementTab<T extends string> {
  id: T;
  label: string;
  shortLabel?: string;
  count?: number;
  icon: LucideIcon;
  tone?: Tone;
}

export function ManagementTabs<T extends string>({ tabs, activeTab, onChange, label }: { tabs: ManagementTab<T>[]; activeTab: T; onChange: (tab: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="management-tabs">
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        const colors = toneStyles[tab.tone ?? 'cyan'];
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn('management-tab', active && 'management-tab-active')}
            style={{ '--management-accent': colors.accent, '--management-soft': colors.soft } as React.CSSProperties}
          >
            <Icon className="management-tab-icon" />
            <span className="management-tab-label"><span className="sm:hidden">{tab.shortLabel ?? tab.label}</span><span className="hidden sm:inline">{tab.label}</span></span>
            {typeof tab.count === 'number' ? <span className="management-tab-count">{tab.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function ManagementSection({ title, description, icon: Icon, tone = 'cyan', action, children, className }: { title: string; description?: string; icon: LucideIcon; tone?: Tone; action?: ReactNode; children: ReactNode; className?: string }) {
  const colors = toneStyles[tone];
  return (
    <Card
      className={cn('management-section', className)}
      style={{ '--management-accent': colors.accent, '--management-soft': colors.soft } as React.CSSProperties}
    >
      <div className="management-section-header">
        <div className="management-section-heading">
          <div className="management-section-icon"><Icon className="size-4" /></div>
          <div className="management-section-copy">
            <h2 className="management-section-title">{title}</h2>
            {description ? <p className="management-section-description">{description}</p> : null}
          </div>
        </div>
        {action ? <div className="management-section-action">{action}</div> : null}
      </div>
      <div className="management-section-content">{children}</div>
    </Card>
  );
}

export function ManagementToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('management-toolbar', className)}>{children}</div>;
}

export function ManagementGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('management-grid', className)}>{children}</div>;
}
