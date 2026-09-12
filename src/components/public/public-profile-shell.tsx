'use client';

import React, { type CSSProperties, type ReactNode } from 'react';
import Image from 'next/image';
import { shouldBypassImageOptimization } from '@/lib/image-utils';

const SafeViewTransition = ((React as unknown as { ViewTransition?: React.ComponentType<{ children?: ReactNode; name?: string; share?: string; default?: string }> }).ViewTransition) || (({ children }: { children?: ReactNode }) => <>{children}</>);

export interface PublicProfileMetric {
  value: ReactNode;
  label: ReactNode;
}

export interface PublicProfileShellProps {
  entityId: string;
  transitionPrefix: 'team' | 'player' | 'organization' | 'competition';
  accentColor: string;
  bannerUrl: string;
  bannerAlt: string;
  logoUrl?: string | null;
  logoAlt: string;
  logoFallback: ReactNode;
  logoFit?: 'cover' | 'contain';
  eyebrow: ReactNode;
  title: ReactNode;
  badge?: ReactNode;
  description?: ReactNode;
  facts?: ReactNode;
  actions?: ReactNode;
  metrics: PublicProfileMetric[];
  tabs: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * Estructura única para fichas públicas. Los módulos solo aportan datos;
 * el fondo, degradado, retícula, métricas y navegación viven aquí.
 */
export function PublicProfileShell({
  entityId,
  transitionPrefix,
  accentColor,
  bannerUrl,
  bannerAlt,
  logoUrl,
  logoAlt,
  logoFallback,
  logoFit = 'cover',
  eyebrow,
  title,
  badge,
  description,
  facts,
  actions,
  metrics,
  tabs,
  children,
  className = '',
  contentClassName = '',
}: PublicProfileShellProps) {
  const profileStyle = {
    '--profile-accent': accentColor,
    '--game-brand': accentColor,
    '--ui-dynamic-brand': accentColor,
  } as CSSProperties;

  return (
    <div className={`public-team-profile public-profile-shell animate-in fade-in duration-300 ${className}`} style={profileStyle}>
      <SafeViewTransition name={`${transitionPrefix}-identity-${entityId}`} share="public-profile-morph" default="none">
        <section className="public-team-hero public-profile-hero">
          <div className="public-team-banner">
            <Image
              key={bannerUrl}
              src={bannerUrl}
              alt={bannerAlt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1920px"
              loading="eager"
              priority
              unoptimized={shouldBypassImageOptimization(bannerUrl)}
              onError={(event) => { event.currentTarget.src = '/images/default/banner-default.jpg'; }}
              className="object-cover object-center sm:object-[center_30%]"
            />
            <div className="public-team-banner-overlay" />
          </div>

          <div className="public-team-hero-content">
            <div className="public-team-identity">
              <div className="public-team-logo">
                {logoUrl ? (
                  <Image
                    key={logoUrl}
                    src={logoUrl}
                    alt={logoAlt}
                    fill
                    sizes="(max-width: 640px) 96px, (max-width: 1024px) 120px, 144px"
                    unoptimized={shouldBypassImageOptimization(logoUrl)}
                    onError={(event) => { event.currentTarget.src = '/images/default/logo-default.png'; }}
                    className={logoFit === 'contain' ? 'object-contain p-2' : 'object-cover'}
                  />
                ) : logoFallback}
              </div>

              <div className="public-team-copy">
                <p className="public-team-eyebrow">{eyebrow}</p>
                <div className="public-team-title-row">
                  <h1>{title}</h1>
                  {badge ? <span>{badge}</span> : null}
                </div>
                {description ? <p className="public-team-description">{description}</p> : null}
                {facts ? <div className="public-team-facts">{facts}</div> : null}
              </div>
            </div>

            {actions ? <div className="public-team-actions">{actions}</div> : null}
          </div>

          <div className="public-team-metrics">
            <div
              className="public-team-metrics-inner"
              data-count={metrics.length}
              style={{ '--metrics-count': metrics.length } as CSSProperties}
            >
              {metrics.map((metric, index) => (
                <div key={index}><strong>{metric.value}</strong><span>{metric.label}</span></div>
              ))}
            </div>
          </div>
        </section>
      </SafeViewTransition>

      <div className="public-profile-tabs-slot">{tabs}</div>
      <div className={`public-team-content public-profile-content ${contentClassName}`}>{children}</div>
    </div>
  );
}
