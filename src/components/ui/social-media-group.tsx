'use client';

import React from 'react';
import { Globe } from 'lucide-react';

interface SocialMediaGroupProps {
  twitter?: string;
  instagram?: string;
  twitch?: string;
  youtube?: string;
  discord?: string;
  prefixName?: string;
}

export function SocialMediaGroup({
  twitter = '',
  instagram = '',
  twitch = '',
  youtube = '',
  discord = '',
  prefixName = '',
}: SocialMediaGroupProps) {
  const getFieldName = (key: string) => (prefixName ? `${prefixName}_${key}` : key);

  return (
    <div className="space-y-4 pt-4 border-t border-[var(--border-card)] font-mono">
      <h4 className="text-xs font-black uppercase text-[var(--accent-violet)] tracking-wider flex items-center gap-2">
        <Globe className="w-4 h-4 text-[var(--accent-violet)]" />
        Redes Sociales & Presencia Digital
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <label className="text-[var(--text-muted)] block text-[11px] font-bold uppercase">Twitter / X:</label>
          <input
            type="text"
            name={getFieldName('twitter')}
            placeholder="@NombreOficial"
            defaultValue={twitter}
            className="w-full p-2.5 rounded-xl input-theme text-[var(--accent-cyan)] font-mono text-xs font-bold"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[var(--text-muted)] block text-[11px] font-bold uppercase">Instagram:</label>
          <input
            type="text"
            name={getFieldName('instagram')}
            placeholder="@nombre_esports"
            defaultValue={instagram}
            className="w-full p-2.5 rounded-xl input-theme text-[var(--accent-violet)] font-mono text-xs font-bold"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[var(--text-muted)] block text-[11px] font-bold uppercase">Canal de Twitch:</label>
          <input
            type="text"
            name={getFieldName('twitch')}
            placeholder="twitch.tv/canal"
            defaultValue={twitch}
            className="w-full p-2.5 rounded-xl input-theme text-[var(--accent-violet)] font-mono text-xs font-bold"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[var(--text-muted)] block text-[11px] font-bold uppercase">Servidor / Tag Discord:</label>
          <input
            type="text"
            name={getFieldName('discord')}
            placeholder="discord.gg/comunidad"
            defaultValue={discord}
            className="w-full p-2.5 rounded-xl input-theme text-[var(--accent-violet)] font-mono text-xs font-bold"
          />
        </div>
      </div>
    </div>
  );
}
