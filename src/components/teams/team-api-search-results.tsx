'use client';

import React from 'react';
import { ExtractedTeam } from '@/lib/services/game-apis/types';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sparkles, Trophy, Users, CheckCircle2 } from 'lucide-react';

interface TeamApiSearchResultsProps {
  teams: ExtractedTeam[];
  sourceApi: string;
  onSelectTeam: (team: ExtractedTeam) => void;
  brandColor?: string;
}

export function TeamApiSearchResults({
  teams,
  sourceApi,
  onSelectTeam,
  brandColor = '#00F0FF',
}: TeamApiSearchResultsProps) {
  if (!teams || teams.length === 0) return null;

  return (
    <div className="space-y-2.5 p-3.5 rounded-2xl bg-[var(--app-surface-2)] border border-[var(--app-accent-2)]/40 shadow-xl font-mono text-xs animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border-card)] pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="font-extrabold uppercase text-[var(--text-heading)] tracking-wider">
            Coincidencias encontradas en {sourceApi}:
          </span>
        </div>
        <Badge variant="cyan" className="text-[9px] uppercase font-bold">
          {teams.length} {teams.length === 1 ? 'Club' : 'Clubes'}
        </Badge>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {teams.map((t, idx) => (
          <div
            key={t.externalId || idx}
            className="p-3 rounded-xl bg-[var(--app-canvas)] border border-[var(--border-card)] hover:border-[var(--app-accent-2)] flex items-center justify-between gap-3 transition-all group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                src={t.logoUrl}
                fallback={t.tag || t.teamName.substring(0, 3)}
                alt={t.teamName}
                size="md"
                className="border border-[var(--border-card)] group-hover:scale-105 transition-transform"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h5 className="font-black text-[var(--text-heading)] uppercase truncate text-sm">
                    {t.teamName}
                  </h5>
                  <Badge variant="violet" className="text-[9px] font-bold uppercase">
                    [{t.tag}]
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] mt-0.5">
                  {t.division && (
                    <span className="flex items-center gap-1 text-cyan-400">
                      <Trophy className="w-3 h-3" /> {t.division}
                    </span>
                  )}
                  {t.roster && t.roster.length > 0 && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Users className="w-3 h-3" /> {t.roster.length} Jugadores
                    </span>
                  )}
                  {t.record && (
                    <span className="text-amber-400 font-bold">
                      {t.record.wins}V - {t.record.losses}D {t.record.draws ? `- ${t.record.draws}E` : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => onSelectTeam(t)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 shadow-md"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Importar</span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
