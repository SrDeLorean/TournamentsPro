'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GAMES_CATALOG } from '@/lib/games-data';
import { PageHeader } from '@/components/ui/page-header';
import { FilterBar } from '@/components/ui/filter-bar';
import { TeamProfileView } from './team-profile-view';
import { initialTeams, TeamData } from '@/lib/data-store';
import { Button } from '@/components/ui/button';
import { Flame, Shield, Users, Trophy, ChevronRight, Monitor, Gamepad2, Globe } from 'lucide-react';

interface TeamDirectoryProps {
  gameName?: string;
  gameSlug?: string;
  brandColor?: string;
  hideHeader?: boolean;
}

export function TeamDirectory({
  gameName = 'Todas las Disciplinas',
  gameSlug = 'ALL',
  brandColor = '#00F0FF',
  hideHeader = false,
}: TeamDirectoryProps) {
  const [teamsList, setTeamsList] = useState<TeamData[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('TODOS');

  React.useEffect(() => {
    fetch(`/api/teams?gameSlug=${gameSlug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.teams)) {
          setTeamsList(data.teams);
        }
      })
      .catch((err) => console.error('Error fetching teams from DB:', err));
  }, [gameSlug]);

  // Load game-specific tailored header metadata if available
  const gameConfig = GAMES_CATALOG[gameSlug];
  const badgeText = gameConfig?.teamBadgeText || 'Directorio Oficial de Escuadras eSports';
  const title = gameConfig?.teamTitle || 'ESCUADRAS &';
  const highlightTitle = gameConfig?.teamHighlightTitle || 'CLUBES.';
  const description = gameConfig?.teamDescription || `Conoce todas las organizaciones, clubes de élite y plantillas oficiales de eSports.`;

  // If a team is selected in-page, show the Ficha del Club view
  if (selectedTeam) {
    const tGameConfig = GAMES_CATALOG[selectedTeam.gameSlug || 'eafc26'];
    const tBrandColor = tGameConfig?.brandColor || brandColor;
    return (
      <TeamProfileView
        team={selectedTeam}
        brandColor={tBrandColor}
        onBack={() => setSelectedTeam(null)}
      />
    );
  }

  const filteredTeams = teamsList.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.captainName || (team as any).captain || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = selectedPlatform === 'TODOS' || team.platform === selectedPlatform;
    return matchesSearch && matchesPlatform;
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {!hideHeader && (
        <PageHeader
          badgeText={badgeText}
          badgeIcon={<Flame className="w-3.5 h-3.5" style={{ color: brandColor, fill: brandColor }} />}
          title={title}
          highlightTitle={highlightTitle}
          description={description}
          brandColor={brandColor}
        />
      )}

      {/* Standardized Filter Bar */}
      <FilterBar
        searchPlaceholder="Escribe el nombre, abreviación o tag del club..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        brandColor={brandColor}
      />

      {/* Teams Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredTeams.map((team) => {
          const tGameConfig = GAMES_CATALOG[team.gameSlug || 'eafc26'];
          const tBrandColor = tGameConfig?.brandColor || '#00F0FF';
          const tGameName = tGameConfig?.name || team.gameSlug || 'FC 26';

          return (
            <div
              key={team.id}
              className="rounded-xl sm:rounded-2xl glass-panel overflow-hidden border border-[var(--border-card)] transition-all duration-300 group hover:-translate-y-1 shadow-xl flex flex-col justify-between"
            >
              {/* Top Banner & Crest Overlap Header */}
              <div>
                <div className="relative h-28 sm:h-36 w-full overflow-hidden bg-slate-900">
                  <img
                    src={team.bannerUrl || '/images/default/banner-default.jpg'}
                    alt={team.name}
                    onError={(e) => {
                      e.currentTarget.src = '/images/default/banner-default.jpg';
                    }}
                    className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-black/40" />

                  {/* Status & Game Discipline Badges */}
                  <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 right-2.5 sm:right-3 flex items-center justify-between text-[9px] sm:text-[10px] font-bold">
                    <span
                      className="px-2.5 py-0.5 rounded-md font-mono font-black uppercase border shadow-md flex items-center gap-1"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${tBrandColor} 35%, rgba(15, 23, 42, 0.9))`,
                        borderColor: tBrandColor,
                        color: '#FFFFFF',
                      }}
                    >
                      {tGameConfig?.icon || '🎮'} {tGameName}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-md border uppercase tracking-wider flex items-center gap-1"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${tBrandColor} 20%, transparent)`,
                        borderColor: `color-mix(in srgb, ${tBrandColor} 50%, transparent)`,
                        color: tBrandColor,
                      }}
                    >
                      <Monitor className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      {team.platform}
                    </span>
                  </div>
                </div>

                {/* Club Crest & Title Section */}
                <div className="px-4 sm:px-5 pt-0 pb-3 sm:pb-4 relative -mt-7 sm:-mt-8 space-y-2 sm:space-y-3">
                  <div className="flex items-end justify-between gap-3">
                    {/* Crest Logo */}
                    <div
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-950 border-2 flex items-center justify-center font-black text-lg sm:text-xl shadow-2xl flex-shrink-0 overflow-hidden"
                      style={{ borderColor: tBrandColor, color: tBrandColor }}
                    >
                      {team.logoUrl || (team as any).logo ? (
                        <img
                          src={team.logoUrl || (team as any).logo}
                          alt={team.name}
                          onError={(e) => {
                            e.currentTarget.src = '/images/default/logo-default.png';
                          }}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        team.logoText
                      )}
                    </div>

                    {/* Tag Pill */}
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-mono font-bold border"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${tBrandColor} 15%, transparent)`,
                        borderColor: `color-mix(in srgb, ${tBrandColor} 30%, transparent)`,
                        color: tBrandColor,
                      }}
                    >
                      [{team.tag}]
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-base sm:text-lg text-[var(--text-heading)] tracking-tight line-clamp-1">
                      {team.name}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[var(--text-muted)] line-clamp-2 mt-1">
                      {team.description || 'Escuadra oficial compitiendo en torneos de la plataforma.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="px-4 sm:px-5 py-3 border-t border-[var(--border-card)] bg-[var(--bg-main)]/50 flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-mono text-[var(--text-muted)]">
                  Capitán: <strong className="text-[var(--text-primary)]">@{team.captainName || (team as any).captain || 'Capitán'}</strong>
                </span>
                <Button
                  size="sm"
                  onClick={() => setSelectedTeam(team)}
                  className="font-black text-[10px] sm:text-xs px-3 py-1 rounded-lg flex items-center gap-1 transition-all"
                  style={{
                    backgroundColor: tBrandColor,
                    color: '#020617',
                  }}
                >
                  <span>Ver Ficha</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTeams.length === 0 && (
        <div className="p-8 text-center rounded-2xl bg-slate-950 border border-white/10 space-y-2">
          <Shield className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-xs font-bold text-slate-300 uppercase">No se encontraron escuadras registradas.</p>
        </div>
      )}
    </div>
  );
}
