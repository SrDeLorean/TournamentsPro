'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CountryFlag } from '@/components/ui/country-flag';
import { Globe, Tv, MessageCircle, MessageSquare } from 'lucide-react';
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
  progress?: {
    label: string;
    current: number;
    max: number;
  };
  footerLeft?: React.ReactNode;
  actionText?: string;
  brandColor?: string;
  animationDelay?: number;
  children?: React.ReactNode;
}

const COUNTRY_MAP: Record<string, string> = {
  chile: 'cl',
  venezuela: 've',
  colombia: 'co',
  argentina: 'ar',
  méxico: 'mx',
  mexico: 'mx',
  perú: 'pe',
  peru: 'pe',
  españa: 'es',
  espana: 'es',
  brasil: 'br',
  brazil: 'br',
  uruguay: 'uy',
  ecuador: 'ec',
  eeuu: 'us',
  usa: 'us',
  global: 'un',
};

const SocialIcon = ({ platform }: { platform: string }) => {
  switch (platform.toLowerCase()) {
    case 'whatsapp':
    case 'wsp':
      return <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />;
    case 'instagram':
      return (
        <svg className="w-3.5 h-3.5 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg className="w-3.5 h-3.5 text-cyan-300" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.525 2.015c.144 0 .28.006.417.017.3.267.575.556.822.865a7.99 7.99 0 0 0 5.617 3.327v3.313a11.31 11.31 0 0 1-5.187-1.39v7.195c0 3.8-3.084 6.883-6.885 6.883S.424 19.141.424 15.341c0-3.801 3.084-6.884 6.885-6.884.28 0 .556.017.828.051V11.9a3.54 3.54 0 0 0-.828-.097c-1.956 0-3.543 1.587-3.543 3.543 0 1.957 1.587 3.543 3.543 3.543 1.957 0 3.543-1.586 3.543-3.543V2.015h1.673z" />
        </svg>
      );
    case 'twitter':
    case 'x':
      return (
        <svg className="w-3 h-3 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'twitch':
      return <Tv className="w-3.5 h-3.5 text-purple-400" />;
    case 'youtube':
      return (
        <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case 'discord':
      return <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />;
    default:
      return <Globe className="w-3.5 h-3.5 text-cyan-400" />;
  }
};

export function EsportsCard({
  href,
  onClick,
  title,
  subtitle,
  description,
  bannerUrl,
  logoUrl,
  fallbackIcon,
  tag,
  country,
  countryCode,
  socials,
  badges = [],
  stats = [],
  progress,
  footerLeft,
  actionText = 'VER DETALLES',
  brandColor = 'var(--game-brand)',
  animationDelay = 0,
  children,
}: EsportsCardProps) {
  const bannerImg = bannerUrl || '/images/default/banner-default.jpg';
  const logoImg = logoUrl || '/images/default/logo-default.png';

  // Determine Country Code
  const derivedCode =
    countryCode ||
    (country ? COUNTRY_MAP[country.toLowerCase().trim()] || 'cl' : undefined);

  // Filter active social links
  const activeSocials = socials
    ? Object.entries(socials).filter(([, url]) => Boolean(url && url.trim() !== ''))
    : [];

  const cardContent = (
    <div
      className="ui-management-card rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] backdrop-blur-xl relative overflow-hidden flex flex-col h-full transition-all duration-500 hover:-translate-y-1.5 hover:border-[var(--card-brand)] shadow-xl hover:shadow-[0_12px_40px_color-mix(in_srgb,var(--card-brand)_25%,transparent)] group text-[var(--text-primary)]"
      style={{ '--card-brand': brandColor } as React.CSSProperties}
    >
      {/* ── Top Discipline Brand Accent Strip ──────────────────── */}
      <div
        className="h-1.5 w-full absolute top-0 left-0 z-30 transition-all duration-300"
        style={{
          backgroundColor: brandColor,
          boxShadow: `0 0 12px ${brandColor}`,
        }}
      />

      {/* ── 1. COVER BANNER HEADER WITH ZOOM FX ──────────────────── */}
      <div className="relative w-full h-36 sm:h-40 overflow-hidden bg-[var(--bg-main)] border-b border-[var(--border-card)] shrink-0">
        <Image
          src={bannerImg}
          alt={title}
          fill
          priority={animationDelay === 0}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          unoptimized={shouldBypassImageOptimization(bannerImg)}
          onError={(e) => {
            e.currentTarget.src = '/images/default/banner-default.jpg';
          }}
          className="object-cover group-hover:scale-110 transition-transform duration-700 filter brightness-90 group-hover:brightness-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-[var(--bg-card)]/45 to-transparent" />

        {/* Badges Floating Over Banner */}
        {badges.length > 0 && (
          <div className="absolute top-3 right-3 z-10 flex flex-wrap items-center gap-1.5 justify-end">
            {badges.map((b, idx) => {
              const variantClasses =
                b.variant === 'emerald'
                  ? 'bg-[var(--accent-emerald-bg)] text-[var(--accent-emerald)] border-[var(--accent-emerald)]/40'
                  : b.variant === 'cyan'
                  ? 'bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan)] border-[var(--accent-cyan)]/40'
                  : b.variant === 'amber'
                  ? 'bg-[var(--accent-gold-bg)] text-[var(--accent-gold)] border-[var(--accent-gold)]/40'
                  : b.variant === 'purple'
                  ? 'bg-[var(--accent-violet-bg)] text-[var(--accent-violet)] border-[var(--accent-violet)]/40'
                  : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-card)]';

              return (
                <span
                  key={idx}
                  className={`flex items-center gap-1.5 text-[9px] font-black font-mono uppercase px-2.5 py-0.5 rounded-full border backdrop-blur-md shadow-lg ${variantClasses}`}
                >
                  {b.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                  {b.text}
                </span>
              );
            })}
          </div>
        )}

        {/* Country Flag Badge Floating Top Left */}
        {country && derivedCode && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-[var(--bg-main)]/90 px-2.5 py-1 rounded-full border border-[var(--border-card)] backdrop-blur-md shadow-md">
            <CountryFlag code={derivedCode} name={country} size="sm" />
            <span className="text-[10px] font-mono font-bold text-[var(--text-primary)] uppercase">
              {country}
            </span>
          </div>
        )}

        {/* Tag Badge Floating Bottom Right */}
        {tag && (
          <div className="absolute bottom-3 right-3 z-10">
            <span className="text-[9px] font-mono font-black uppercase tracking-wider bg-[var(--bg-main)]/90 text-[var(--text-heading)] px-2.5 py-0.5 rounded-lg border border-[var(--border-card)] backdrop-blur-md shadow-md">
              {tag}
            </span>
          </div>
        )}
      </div>

      {/* ── 2. CREST SHIELD & BODY ──────────────────────────── */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4 relative">
        {/* Crest Shield Overlapping Banner Header */}
        <div className="flex items-start gap-3.5 -mt-10 relative z-20">
          <div
            className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[var(--bg-card)] border-2 flex items-center justify-center p-1.5 overflow-hidden shadow-2xl shrink-0 group-hover:scale-105 transition-transform duration-300"
            style={{
              borderColor: brandColor,
              boxShadow: `0 0 20px color-mix(in srgb, ${brandColor} 40%, transparent)`,
            }}
          >
            {logoUrl ? (
              <Image
                src={logoImg}
                alt={title}
                fill
                sizes="64px"
                unoptimized={shouldBypassImageOptimization(logoImg)}
                onError={(e) => {
                  e.currentTarget.src = '/images/default/logo-default.png';
                }}
                className="object-contain filter drop-shadow-md p-1.5"
              />
            ) : (
              fallbackIcon || <div className="w-full h-full bg-[var(--bg-main)] rounded-xl" />
            )}
          </div>

          <div className="pt-7 overflow-hidden flex-1 min-w-0">
            <h3
              className="text-base sm:text-lg font-black font-display text-[var(--text-heading)] transition-colors line-clamp-1 uppercase tracking-tight leading-tight"
            >
              <span className="group-hover:text-[var(--card-brand)] transition-colors">{title}</span>
            </h3>
            {subtitle && (
              <span className="text-[10px] text-[var(--text-muted)] font-mono block mt-0.5 truncate">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed font-sans min-h-[32px]">
            {description}
          </p>
        )}

        {/* Social Media & Presence Quick Icons Row */}
        {activeSocials.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-1 z-20">
            {activeSocials.map(([platform, url]) => {
              const formattedUrl = url.startsWith('http') ? url : `https://${url}`;

              return (
                <a
                  key={platform}
                  href={formattedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title={platform.toUpperCase()}
                  className="w-7 h-7 rounded-lg bg-[var(--bg-main)]/80 border border-[var(--border-card)] flex items-center justify-center hover:scale-110 hover:border-[var(--card-brand)] transition-all shadow-sm"
                >
                  <SocialIcon platform={platform} />
                </a>
              );
            })}
          </div>
        )}

        {/* Telemetry Stats Grid */}
        {stats.length > 0 && (
          <div
            className={`grid gap-2 text-[11px] font-mono pt-1 ${
              stats.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
            }`}
          >
            {stats.map((s, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border-card)] flex items-center justify-between ${
                  s.highlight ? 'bg-[var(--accent-gold-bg)] border-[var(--accent-gold)]/40' : ''
                }`}
              >
                <div className="flex items-center gap-1.5 text-[var(--text-muted)] truncate">
                  <span className="shrink-0">{s.icon}</span>
                  <span className="text-[9px] uppercase truncate">{s.label}</span>
                </div>
                <strong
                  className={`text-xs font-bold shrink-0 ml-1 ${
                    s.highlight ? 'text-[var(--accent-gold)]' : 'text-[var(--text-heading)]'
                  }`}
                >
                  {s.value}
                </strong>
              </div>
            ))}
          </div>
        )}

        {/* Custom Card Children (e.g. Authorized Disciplines logos) */}
        {children}

        {/* Optional Enrolled Progress Bar */}
        {progress && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-[var(--text-muted)] uppercase">{progress.label}</span>
              <span className="font-bold text-[var(--text-heading)]">
                {progress.current} / {progress.max} (
                {Math.min(100, Math.round((progress.current / progress.max) * 100))}%)
              </span>
            </div>
            <div className="w-full h-2 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border-card)] p-0.5">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.round((progress.current / progress.max) * 100))}%`,
                  backgroundColor: brandColor,
                  boxShadow: `0 0 10px ${brandColor}`,
                }}
              />
            </div>
          </div>
        )}

        {/* Card Footer */}
        <div className="pt-3 border-t border-[var(--border-card)] flex items-center justify-between text-xs font-mono">
          <div className="text-[var(--text-muted)] text-[11px] flex items-center gap-1">
            {footerLeft}
          </div>
          <span
            className="font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1 text-xs shrink-0"
            style={{ color: brandColor }}
          >
            {actionText} &rarr;
          </span>
        </div>
      </div>
    </div>
  );

  const wrapperProps = {
    className: 'animate-fade-up block h-full group cursor-pointer',
    style: { animationDelay: `${animationDelay}ms` },
  };

  if (href) {
    return (
      <Link href={href} {...wrapperProps}>
        {cardContent}
      </Link>
    );
  }

  return (
    <div onClick={onClick} {...wrapperProps}>
      {cardContent}
    </div>
  );
}
