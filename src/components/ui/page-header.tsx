import type { CSSProperties, ReactNode } from 'react';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PageHeaderMetric {
  label: string;
  value: ReactNode;
  detail?: string;
  icon?: ReactNode;
}

interface PageHeaderProps {
  badgeText?: string;
  badgeIcon?: ReactNode;
  heroIcon?: ReactNode;
  title: string;
  highlightTitle?: string;
  description: string;
  brandColor?: string;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  density?: 'compact' | 'comfortable' | 'cinematic';
  headingLevel?: 1 | 2 | 3;
}

export function PageHeaderMetrics({ items }: { items: PageHeaderMetric[] }) {
  return (
    <div className="ui-page-header-metrics" aria-label="Resumen de la sección">
      {items.map((item) => (
        <div className="ui-page-header-metric" key={item.label}>
          {item.icon ? <span className="ui-page-header-metric-icon">{item.icon}</span> : null}
          <span className="ui-page-header-metric-copy">
            <strong>{item.value}</strong>
            <small>{item.label}</small>
            {item.detail ? <em>{item.detail}</em> : null}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PageHeader({
  badgeText,
  badgeIcon,
  heroIcon,
  title,
  highlightTitle,
  description,
  brandColor = 'var(--app-accent)',
  footer,
  children,
  className,
  density = 'comfortable',
  headingLevel = 1,
}: PageHeaderProps) {
  const defaultIcon = <Flame className="size-3.5" aria-hidden="true" />;
  const Heading = `h${headingLevel}` as 'h1' | 'h2' | 'h3';

  return (
    <header
      className={cn('ui-page-header game-section-hero font-[family-name:var(--font-active)]', `is-${density}`, className)}
      style={{ '--page-brand': brandColor } as CSSProperties}
    >
      <div className="ui-page-header-scene" aria-hidden="true">
        <span className="ui-page-header-orbit" />
        <span className="ui-page-header-beam" />
        <span className="ui-page-header-grid" />
      </div>

      <div className="ui-page-header-layout">
        <div className="ui-page-header-intro">
          {heroIcon ? <div className="ui-page-header-icon">{heroIcon}</div> : null}

          <div className="ui-page-header-copy">
            {badgeText ? (
              <div className="ui-page-header-badge">
                {badgeIcon || defaultIcon}
                <span>{badgeText}</span>
              </div>
            ) : null}

            <Heading>
              <span>{title}</span>
              {highlightTitle ? <strong>{highlightTitle}</strong> : null}
            </Heading>

            <p>{description}</p>
            {footer ? <div className="ui-page-header-footer">{footer}</div> : null}
          </div>
        </div>

        {children ? <aside className="ui-page-header-aside">{children}</aside> : null}
      </div>

      <div className="ui-page-header-edge" aria-hidden="true" />
    </header>
  );
}
