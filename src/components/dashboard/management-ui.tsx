'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Tone = 'cyan' | 'violet' | 'emerald' | 'gold' | 'crimson';

const toneStyles: Record<Tone, { accent: string; soft: string }> = {
  cyan: { accent: 'var(--accent-cyan)', soft: 'var(--accent-cyan-bg)' },
  violet: { accent: 'var(--accent-violet)', soft: 'var(--accent-violet-bg)' },
  emerald: { accent: 'var(--accent-emerald)', soft: 'var(--accent-emerald-bg)' },
  gold: { accent: 'var(--accent-gold)', soft: 'var(--accent-gold-bg)' },
  crimson: { accent: 'var(--accent-crimson)', soft: 'var(--accent-crimson-bg)' },
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
      <div className="management-hero-glow" />
      <div className="management-hero-main">
        <div className="management-hero-copy">
          <div className="management-hero-icon" style={{ borderColor: `color-mix(in srgb, ${colors.accent} 38%, var(--border-card))`, color: colors.accent }}>
            <Icon className="size-5 sm:size-7" />
          </div>
          <div className="management-hero-text">
            <div className="management-hero-kicker">
              <span className="management-eyebrow" style={{ color: colors.accent }}>{eyebrow}</span>
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
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  const colors = toneStyles[tone];
  return (
    <Card className="management-metric">
      <div className="management-metric-layout">
        <div className="management-metric-icon" style={{ color: colors.accent, background: colors.soft, borderColor: `color-mix(in srgb, ${colors.accent} 30%, var(--border-card))` }}>
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
            style={active ? { color: colors.accent, background: colors.soft, borderColor: `color-mix(in srgb, ${colors.accent} 34%, var(--border-card))` } : undefined}
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
    <Card className={cn('management-section', className)}>
      <div className="management-section-header">
        <div className="management-section-heading">
          <div className="management-section-icon" style={{ color: colors.accent, background: colors.soft }}><Icon className="size-4" /></div>
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
