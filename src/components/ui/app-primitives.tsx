import type { HTMLAttributes, ReactNode } from 'react';
import { ArrowUpRight, Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AppMetricTone = 'cyan' | 'violet' | 'emerald' | 'gold' | 'crimson';

interface AppMetricCardProps extends HTMLAttributes<HTMLElement> {
  label: string;
  value: string;
  detail?: string;
  trend?: string;
  icon: ReactNode;
  tone?: AppMetricTone;
}

export function AppMetricCard({ label, value, detail, trend, icon, tone = 'cyan', className, ...props }: AppMetricCardProps) {
  return (
    <article className={cn('app-metric-card', `is-${tone}`, className)} {...props}>
      <span className="app-metric-icon">{icon}</span>
      <span className="app-metric-copy">
        <small>{label}</small>
        <strong>{value}</strong>
        {detail ? <span>{detail}</span> : null}
      </span>
      {trend ? <em><ArrowUpRight aria-hidden="true" />{trend}</em> : null}
    </article>
  );
}

interface AppEntityRowProps extends HTMLAttributes<HTMLElement> {
  avatar: ReactNode;
  title: string;
  subtitle: string;
  meta?: ReactNode;
  status?: string;
  actions?: ReactNode;
}

export function AppEntityRow({ avatar, title, subtitle, meta, status, actions, className, ...props }: AppEntityRowProps) {
  return (
    <article className={cn('app-entity-row', className)} {...props}>
      <span className="app-entity-avatar">{avatar}</span>
      <span className="app-entity-copy">
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </span>
      {meta ? <span className="app-entity-meta">{meta}</span> : null}
      {status ? <span className="app-entity-status"><i />{status}</span> : null}
      {actions ? <span className="app-entity-actions">{actions}</span> : null}
    </article>
  );
}

interface AppCommandBarProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  resultLabel?: string;
  filters?: ReactNode;
  actions?: ReactNode;
}

export function AppCommandBar({ value, onValueChange, placeholder = 'Buscar registros...', resultLabel, filters, actions, className, ...props }: AppCommandBarProps) {
  return (
    <div className={cn('app-command-bar', className)} {...props}>
      <label className="app-command-search">
        <Search aria-hidden="true" />
        <span className="sr-only">Buscar</span>
        <input value={value} onChange={(event) => onValueChange(event.target.value)} placeholder={placeholder} />
        <kbd>⌘ K</kbd>
      </label>
      {filters ? <div className="app-command-filters"><SlidersHorizontal aria-hidden="true" />{filters}</div> : null}
      {resultLabel ? <span className="app-command-results">{resultLabel}</span> : null}
      {actions ? <div className="app-command-actions">{actions}</div> : null}
    </div>
  );
}
