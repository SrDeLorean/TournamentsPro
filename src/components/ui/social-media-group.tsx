'use client';

import React from 'react';
import { Globe, Tv, Video, MessageSquare } from 'lucide-react';

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
    <div className="space-y-3 pt-3 border-t border-white/10">
      <h4 className="text-xs font-black uppercase text-purple-300 tracking-wider flex items-center gap-2">
        <Globe className="w-4 h-4 text-purple-400" />
        Redes Sociales & Presencia Digital:
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold">
        <div className="space-y-1">
          <label className="text-slate-400 block text-[11px]">Twitter / X:</label>
          <input
            type="text"
            name={getFieldName('twitter')}
            placeholder="@NombreOficial"
            defaultValue={twitter}
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-cyan-400 font-mono focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-slate-400 block text-[11px]">Instagram:</label>
          <input
            type="text"
            name={getFieldName('instagram')}
            placeholder="@nombre_esports"
            defaultValue={instagram}
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-purple-400 font-mono focus:border-purple-400 focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-slate-400 block text-[11px]">Canal de Twitch:</label>
          <input
            type="text"
            name={getFieldName('twitch')}
            placeholder="twitch.tv/canal"
            defaultValue={twitch}
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-violet-400 font-mono focus:border-violet-400 focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-slate-400 block text-[11px]">Servidor / Tag Discord:</label>
          <input
            type="text"
            name={getFieldName('discord')}
            placeholder="discord.gg/comunidad"
            defaultValue={discord}
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-indigo-400 font-mono focus:border-indigo-400 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
