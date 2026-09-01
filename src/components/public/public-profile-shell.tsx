'use client';

import React, { ViewTransition, type CSSProperties, type ReactNode } from 'react';
import Image from 'next/image';
import { shouldBypassImageOptimization } from '@/lib/image-utils';

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
  } as CSSProperties;

  return (
    <div className={`public-team-profile public-profile-shell animate-in fade-in duration-300 ${className}`} style={profileStyle}>
      <ViewTransition name={`${transitionPrefix}-identity-${entityId}`} share="public-profile-morph" default="none">
        <section className="public-team-hero public-profile-hero">
          <div className="public-team-banner">
            <Image
              src={bannerUrl}
              alt={bannerAlt}
              fill
              sizes="100vw"
              loading="eager"
              unoptimized={shouldBypassImageOptimization(bannerUrl)}
              onError={(event) => { event.currentTarget.src = '/images/default/banner-default.jpg'; }}
              className="object-cover"
            />
            <div className="public-team-banner-overlay" />
          </div>

          <div className="public-team-hero-content">
            <div className="public-team-identity">
              <div className="public-team-logo" style={{ borderColor: accentColor, color: accentColor }}>
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={logoAlt}
                    fill
                    sizes="112px"
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
                  {badge ? <span style={{ borderColor: accentColor }}>{badge}</span> : null}
                </div>
                {description ? <p className="public-team-description">{description}</p> : null}
                {facts ? <div className="public-team-facts">{facts}</div> : null}
              </div>
            </div>

            {actions ? <div className="public-team-actions">{actions}</div> : null}
          </div>

          <div className="public-team-metrics">
            <div className="public-team-metrics-inner">
              {metrics.map((metric, index) => (
                <div key={index}><strong>{metric.value}</strong><span>{metric.label}</span></div>
              ))}
            </div>
          </div>
        </section>
      </ViewTransition>

      <div className="public-profile-tabs-slot">{tabs}</div>
      <div className={`public-team-content public-profile-content ${contentClassName}`}>{children}</div>
    </div>
  );
}
