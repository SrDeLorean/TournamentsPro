'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Globe, MessageCircle, MessageSquare, Tv } from 'lucide-react';
import { CountryFlag } from '@/components/ui/country-flag';
import { shouldBypassImageOptimization } from '@/lib/image-utils';

export interface EsportsCardStat {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  highlight?: boolean;
}

export interface EsportsCardBadge {
  text: string;
  variant?: 'emerald' | 'cyan' | 'amber' | 'purple' | 'slate';
  pulse?: boolean;
}

export interface EsportsSocialLinks {
  whatsapp?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  twitch?: string;
  youtube?: string;
  discord?: string;
  website?: string;
}

export interface EsportsCardProps {
  href?: string;
  onClick?: () => void;
  entityType?: 'team' | 'organization' | 'user' | 'generic';
  title: string;
  subtitle?: string;
  description?: string;
  bannerUrl?: string;
  logoUrl?: string;
  fallbackIcon?: React.ReactNode;
  tag?: string;
  country?: string;
  countryCode?: string;
  socials?: EsportsSocialLinks;
  badges?: EsportsCardBadge[];
  stats?: EsportsCardStat[];
  progress?: { label: string; current: number; max: number };
  footerLeft?: React.ReactNode;
  actionText?: string;
  brandColor?: string;
  animationDelay?: number;
  children?: React.ReactNode;
}

const COUNTRY_MAP: Record<string, string> = {
  chile: 'cl', venezuela: 've', colombia: 'co', argentina: 'ar', méxico: 'mx', mexico: 'mx',
  perú: 'pe', peru: 'pe', españa: 'es', espana: 'es', brasil: 'br', brazil: 'br', uruguay: 'uy',
  ecuador: 'ec', eeuu: 'us', usa: 'us', global: 'un',
};

const ENTITY_LABEL = {
  team: 'Equipo competitivo',
  organization: 'Organización',
  user: 'Atleta',
  generic: 'Perfil competitivo',
} as const;

const BADGE_CLASS = {
  emerald: 'is-emerald',
  cyan: 'is-cyan',
  amber: 'is-amber',
  purple: 'is-purple',
  slate: 'is-slate',
} as const;

function SocialIcon({ platform }: { platform: string }) {
  switch (platform.toLowerCase()) {
    case 'whatsapp':
    case 'wsp':
      return <MessageCircle className="size-3.5" />;
    case 'instagram':
      return <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></svg>;
    case 'tiktok':
      return <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 2h3a5 5 0 0 0 4.5 4.5v3a8 8 0 0 1-4.5-1.4v7.15a6.25 6.25 0 1 1-6.25-6.25c.42 0 .84.04 1.25.12v3.15a3.25 3.25 0 1 0 2 2.98V2Z" /></svg>;
    case 'twitter':
    case 'x':
      return <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.22-6.82-5.96 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" /></svg>;
    case 'twitch': return <Tv className="size-3.5" />;
    case 'youtube':
      return <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3 3 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3 3 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3 3 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3 3 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z" /></svg>;
    case 'discord': return <MessageSquare className="size-3.5" />;
    default: return <Globe className="size-3.5" />;
  }
}

function normalizeSocialUrl(platform: string, value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  const cleanValue = value.trim().replace(/^@/, '');
  if (platform === 'whatsapp' && /^\+?[\d\s-]+$/.test(cleanValue)) return `https://wa.me/${cleanValue.replace(/\D/g, '')}`;
  if (platform === 'instagram') return `https://instagram.com/${cleanValue}`;
  if (platform === 'tiktok') return `https://tiktok.com/@${cleanValue}`;
  if (platform === 'twitter' || platform === 'x') return `https://x.com/${cleanValue}`;
  return `https://${cleanValue}`;
}

export function EsportsCard({
  href, onClick, entityType = 'generic', title, subtitle, description, bannerUrl, logoUrl, fallbackIcon,
  tag, country, countryCode, socials, badges = [], stats = [], progress, footerLeft,
  actionText = 'Ver perfil', brandColor = 'var(--accent-cyan)', animationDelay = 0, children,
}: EsportsCardProps) {
  const bannerImg = bannerUrl || '/images/default/banner-default.jpg';
  const logoImg = logoUrl || '/images/default/logo-default.png';
  const derivedCode = countryCode || (country ? COUNTRY_MAP[country.toLowerCase().trim()] || 'cl' : undefined);
  const activeSocials = socials ? Object.entries(socials).filter((entry): entry is [string, string] => Boolean(entry[1]?.trim())) : [];
  const progressPercent = progress ? Math.min(100, Math.round((progress.current / Math.max(progress.max, 1)) * 100)) : 0;
  const isInteractive = Boolean(href || onClick);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!href && onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <article
      className={`esports-entity-card is-${entityType}${isInteractive ? ' is-interactive' : ''}`}
      style={{ '--card-brand': brandColor, animationDelay: `${animationDelay}ms` } as React.CSSProperties}
      onClick={!href ? onClick : undefined}
      onKeyDown={handleKeyDown}
      role={!href && onClick ? 'button' : undefined}
      tabIndex={!href && onClick ? 0 : undefined}
    >
      {href ? <Link href={href} className="esports-entity-card-link" aria-label={`${actionText}: ${title}`} /> : null}

      <div className="esports-entity-card-banner">
        <Image
          src={bannerImg}
          alt=""
          fill
          priority={animationDelay === 0}
          sizes="(min-width: 1440px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          unoptimized={shouldBypassImageOptimization(bannerImg)}
          onError={(event) => { event.currentTarget.src = '/images/default/banner-default.jpg'; }}
          className="object-cover"
        />
        <div className="esports-entity-card-banner-shade" />
        <p className="esports-entity-card-kind">{ENTITY_LABEL[entityType]}</p>
        {country && derivedCode ? (
          <div className="esports-entity-card-country"><CountryFlag code={derivedCode} name={country} size="sm" /><span>{country}</span></div>
        ) : null}
      </div>

      <div className="esports-entity-card-body">
        <div className="esports-entity-card-identity">
          <div className="esports-entity-card-logo">
            {logoUrl ? (
              <Image src={logoImg} alt={`Identidad de ${title}`} fill sizes="72px" unoptimized={shouldBypassImageOptimization(logoImg)} onError={(event) => { event.currentTarget.src = '/images/default/logo-default.png'; }} className="object-contain" />
            ) : fallbackIcon || <span>{title.slice(0, 2).toUpperCase()}</span>}
          </div>
          <div className="esports-entity-card-heading">
            <div><h3>{title}</h3>{tag ? <span>{tag}</span> : null}</div>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        </div>

        {badges.length ? (
          <div className="esports-entity-card-badges">
            {badges.slice(0, 3).map((badge, index) => (
              <span key={`${badge.text}-${index}`} className={BADGE_CLASS[badge.variant || 'slate']}>
                {badge.pulse ? <i /> : null}{badge.text}
              </span>
            ))}
          </div>
        ) : null}

        {description ? <p className="esports-entity-card-description">{description}</p> : null}

        {stats.length ? (
          <dl className={`esports-entity-card-stats has-${Math.min(stats.length, 3)}`}>
            {stats.slice(0, 3).map((stat, index) => (
              <div key={`${stat.label}-${index}`} className={stat.highlight ? 'is-highlighted' : ''}>
                <dt>{stat.icon}<span>{stat.label}</span></dt><dd>{stat.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {children ? <div className="esports-entity-card-custom">{children}</div> : null}

        {progress ? (
          <div className="esports-entity-card-progress">
            <div><span>{progress.label}</span><strong>{progress.current}/{progress.max}</strong></div>
            <div><span style={{ width: `${progressPercent}%` }} /></div>
          </div>
        ) : null}

        <footer className="esports-entity-card-footer">
          <div className="esports-entity-card-meta">{footerLeft}</div>
          {activeSocials.length ? (
            <div className="esports-entity-card-socials" aria-label="Redes sociales">
              {activeSocials.slice(0, 5).map(([platform, url]) => (
                <a key={platform} href={normalizeSocialUrl(platform, url)} target="_blank" rel="noopener noreferrer" title={platform} onClick={(event) => event.stopPropagation()}><SocialIcon platform={platform} /></a>
              ))}
            </div>
          ) : null}
          <span className="esports-entity-card-action">{actionText}<ArrowUpRight className="size-4" /></span>
        </footer>
      </div>
    </article>
  );
}
