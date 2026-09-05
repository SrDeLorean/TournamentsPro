'use client';

import React from 'react';
import { Globe, MessageSquare, Radio, Tv, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialMediaGroupProps {
  twitter?: string;
  instagram?: string;
  twitch?: string;
  youtube?: string;
  discord?: string;
  prefixName?: string;
  className?: string;
}

export function SocialMediaGroup({
  twitter = '',
  instagram = '',
  twitch = '',
  youtube = '',
  discord = '',
  prefixName = '',
  className = '',
}: SocialMediaGroupProps) {
  const groupId = React.useId();
  const getFieldName = (key: string) => (prefixName ? `${prefixName}_${key}` : key);
  const getFieldId = (key: string) => `${groupId}-${getFieldName(key)}`;

  return (
    <div className={cn('space-y-4 pt-4 border-t border-[var(--border-card)] font-[family-name:var(--font-active)]', className)}>
      <div className="flex items-center justify-between font-[family-name:var(--font-active)]">
        <h4 className="text-xs font-black uppercase text-[var(--text-heading)] tracking-wider flex items-center gap-2 font-[family-name:var(--font-active)]">
          <Globe className="w-4 h-4 text-[var(--app-accent)]" />
          Redes Sociales & Canales Oficiales
        </h4>
        <span className="text-[10px] text-[var(--text-muted)] font-[family-name:var(--font-active)] font-bold uppercase">Presencia Digital</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-[family-name:var(--font-active)]">
        {/* Twitter / X */}
        <div className="space-y-1 font-[family-name:var(--font-active)]">
          <label htmlFor={getFieldId('twitter')} className="text-[var(--text-secondary)] block text-[11px] font-bold uppercase font-[family-name:var(--font-active)]">Twitter / X:</label>
          <div className="relative flex items-center group font-[family-name:var(--font-active)]">
            <span className="absolute left-3 font-bold text-xs text-[var(--text-muted)] group-focus-within:text-[var(--app-accent)] transition-colors pointer-events-none">
              𝕏
            </span>
            <input
              id={getFieldId('twitter')}
              type="text"
              name={getFieldName('twitter')}
              placeholder="@NombreOficial"
              defaultValue={twitter}
              className="min-h-10 w-full pl-8 pr-3 py-2 rounded-[var(--radius-control)] bg-[var(--bg-subtle)] border border-[var(--border-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-[family-name:var(--font-active)] text-xs font-medium focus:outline-none focus:border-[var(--app-accent)] focus:ring-1 focus:ring-[var(--app-accent)]/20 transition-all"
            />
          </div>
        </div>

        {/* Instagram */}
        <div className="space-y-1 font-[family-name:var(--font-active)]">
          <label htmlFor={getFieldId('instagram')} className="text-[var(--text-secondary)] block text-[11px] font-bold uppercase font-[family-name:var(--font-active)]">Instagram:</label>
          <div className="relative flex items-center group font-[family-name:var(--font-active)]">
            <Share2 className="w-3.5 h-3.5 absolute left-3 text-[var(--text-muted)] group-focus-within:text-[var(--app-accent-2)] transition-colors pointer-events-none" />
            <input
              id={getFieldId('instagram')}
              type="text"
              name={getFieldName('instagram')}
              placeholder="@nombre_esports"
              defaultValue={instagram}
              className="min-h-10 w-full pl-8 pr-3 py-2 rounded-[var(--radius-control)] bg-[var(--bg-subtle)] border border-[var(--border-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-[family-name:var(--font-active)] text-xs font-medium focus:outline-none focus:border-[var(--app-accent-2)] focus:ring-1 focus:ring-[var(--app-accent-2)]/20 transition-all"
            />
          </div>
        </div>

        {/* Twitch */}
        <div className="space-y-1 font-[family-name:var(--font-active)]">
          <label htmlFor={getFieldId('twitch')} className="text-[var(--text-secondary)] block text-[11px] font-bold uppercase font-[family-name:var(--font-active)]">Canal de Twitch:</label>
          <div className="relative flex items-center group font-[family-name:var(--font-active)]">
            <Radio className="w-3.5 h-3.5 absolute left-3 text-[var(--text-muted)] group-focus-within:text-[var(--app-accent-2)] transition-colors pointer-events-none" />
            <input
              id={getFieldId('twitch')}
              type="text"
              name={getFieldName('twitch')}
              placeholder="twitch.tv/canal"
              defaultValue={twitch}
              className="min-h-10 w-full pl-8 pr-3 py-2 rounded-[var(--radius-control)] bg-[var(--bg-subtle)] border border-[var(--border-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-[family-name:var(--font-active)] text-xs font-medium focus:outline-none focus:border-[var(--app-accent-2)] focus:ring-1 focus:ring-[var(--app-accent-2)]/20 transition-all"
            />
          </div>
        </div>

        {/* Discord */}
        <div className="space-y-1 font-[family-name:var(--font-active)]">
          <label htmlFor={getFieldId('discord')} className="text-[var(--text-secondary)] block text-[11px] font-bold uppercase font-[family-name:var(--font-active)]">Servidor / Tag Discord:</label>
          <div className="relative flex items-center group font-[family-name:var(--font-active)]">
            <MessageSquare className="w-3.5 h-3.5 absolute left-3 text-[var(--text-muted)] group-focus-within:text-[var(--app-accent)] transition-colors pointer-events-none" />
            <input
              id={getFieldId('discord')}
              type="text"
              name={getFieldName('discord')}
              placeholder="discord.gg/comunidad"
              defaultValue={discord}
              className="min-h-10 w-full pl-8 pr-3 py-2 rounded-[var(--radius-control)] bg-[var(--bg-subtle)] border border-[var(--border-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-[family-name:var(--font-active)] text-xs font-medium focus:outline-none focus:border-[var(--app-accent)] focus:ring-1 focus:ring-[var(--app-accent)]/20 transition-all"
            />
          </div>
        </div>

        {/* YouTube */}
        <div className="space-y-1 sm:col-span-2 font-[family-name:var(--font-active)]">
          <label htmlFor={getFieldId('youtube')} className="text-[var(--text-secondary)] block text-[11px] font-bold uppercase font-[family-name:var(--font-active)]">Canal de YouTube:</label>
          <div className="relative flex items-center group font-[family-name:var(--font-active)]">
            <Tv className="w-3.5 h-3.5 absolute left-3 text-[var(--text-muted)] group-focus-within:text-[var(--app-danger)] transition-colors pointer-events-none" />
            <input
              id={getFieldId('youtube')}
              type="text"
              name={getFieldName('youtube')}
              placeholder="youtube.com/@canal"
              defaultValue={youtube}
              className="min-h-10 w-full pl-8 pr-3 py-2 rounded-[var(--radius-control)] bg-[var(--bg-subtle)] border border-[var(--border-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-[family-name:var(--font-active)] text-xs font-medium focus:outline-none focus:border-[var(--app-danger)] focus:ring-1 focus:ring-[var(--app-danger)]/20 transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
