'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GAMES_CATALOG } from '@/lib/games-data';
import { Sparkles, Tag } from 'lucide-react';
import type { GameProfileEntry } from './profile-game-tab';

interface ProfileGamertagsTabProps {
  gamertag: string;
  setGamertag: (gt: string) => void;
  gameProfiles: Record<string, GameProfileEntry>;
  setGameProfiles: React.Dispatch<React.SetStateAction<Record<string, GameProfileEntry>>>;
}

export function ProfileGamertagsTab({
  gamertag,
  setGamertag,
  gameProfiles,
  setGameProfiles,
}: ProfileGamertagsTabProps) {
  return (
    <Card className="account-settings-card p-4 sm:p-6 space-y-6 border-[var(--app-accent-2)] bg-[var(--bg-card)]">
      <div>
        <h3 className="text-sm font-black uppercase text-[var(--text-heading)] tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--app-accent-2)]" />
          2. Gamertags e IDs de los Juegos:
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Configura tu <strong>Gamertag universal</strong> y los identificadores (<strong>ID Juego</strong>) con los cuales las APIs oficiales de cada título consultan tus estadísticas eSports.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--app-accent)] text-xs space-y-1">
        <label className="font-bold text-[var(--app-accent)] uppercase block">Gamertag Principal del Usuario *</label>
        <input
          type="text"
          value={gamertag}
          onChange={(e) => setGamertag(e.target.value)}
          required
          className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--app-accent)] text-[var(--app-accent)] focus:outline-none focus:border-[var(--app-accent)]  font-bold"
        />
      </div>

      <div className="space-y-4">
        <span className="text-xs font-bold text-[var(--text-secondary)] uppercase block">Configuración por Disciplina eSports:</span>

        {Object.entries(GAMES_CATALOG).map(([slug, g]) => {
          const p = gameProfiles[slug] || { gamertag: '', gameId: '', position: '', secondaryPosition: '' };
          return (
            <div
              key={slug}
              className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-card)] space-y-3"
              style={{ '--ui-dynamic-brand': g.brandColor } as React.CSSProperties}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="game-brand-dot" />
                  <h4 className="font-black text-sm uppercase text-[var(--text-heading)]">{g.name}</h4>
                  <Badge variant="cyan" className="text-[10px] ">{g.category}</Badge>
                </div>
                {p.position && (
                  <Badge variant="violet" className="text-[10px]  font-bold">
                    Posición: {p.position}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-secondary)] uppercase block">Gamertag ({g.name}):</label>
                  <input
                    type="text"
                    value={p.gamertag}
                    onChange={(e) =>
                      setGameProfiles((prev) => ({
                        ...prev,
                        [slug]: { ...p, gamertag: e.target.value },
                      }))
                    }
                    placeholder={`Ej. ${gamertag || 'Gamertag'}`}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-heading)] focus:outline-none focus:border-[var(--app-accent)]  font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--app-accent)] uppercase block flex items-center gap-1">
                    <Tag className="w-3 h-3 text-[var(--app-accent)]" />
                    ID Juego para API ({g.name}):
                  </label>
                  <input
                    type="text"
                    value={p.gameId}
                    onChange={(e) =>
                      setGameProfiles((prev) => ({
                        ...prev,
                        [slug]: { ...p, gameId: e.target.value },
                      }))
                    }
                    placeholder="Ej. EA-ID 1234, SteamID64, Riot Tag"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--app-accent)] text-[var(--app-accent)] focus:outline-none focus:border-[var(--app-accent)]  font-bold"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
