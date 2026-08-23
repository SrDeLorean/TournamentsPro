'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GAMES_CATALOG, GameConfig } from '@/lib/games-data';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TeamProfileView } from './team-profile-view';
import { TeamData } from '@/lib/data-store';
import { TacticalLoadingSkeleton } from '@/components/tournaments/tactical-loading-skeleton';
import { CountryFlag } from '@/components/ui/country-flag';
import { Pagination } from '@/components/ui/pagination';
import { EsportsCard } from '@/components/ui/esports-card';
import { FilterBar } from '@/components/ui/filter-bar';
import {
  Flame,
  Shield,
  Users,
  Trophy,
  ChevronRight,
  Monitor,
  Search,
  Building2,
  X,
  Sparkles,
  Award,
  Crown,
} from 'lucide-react';

import { useAuth } from '@/components/providers/auth-provider';

interface TeamDirectoryProps {
  gameName?: string;
  gameSlug?: string;
  brandColor?: string;
  hideHeader?: boolean;
  myTeamsOnly?: boolean;
}

export function TeamDirectory({
  gameName = 'Todas las Disciplinas',
  gameSlug = 'ALL',
  brandColor = '#077D7E',
  hideHeader = false,
  myTeamsOnly = false,
}: TeamDirectoryProps) {
  const { currentUser } = useAuth();
  const [teamsList, setTeamsList] = useState<TeamData[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('TODOS');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Active game metadata
  const gameConfig: GameConfig = GAMES_CATALOG[gameSlug || 'eafc26'] || GAMES_CATALOG['eafc26'];
  const activeBrandColor = gameConfig?.brandColor || brandColor || '#077D7E';

  useEffect(() => {
    let isMounted = true;
    const fetchAllTeams = async () => {
      try {
        const res = await fetch(`/api/teams?gameSlug=${gameSlug}&limit=200`);
        const data = await res.json();
        let teams = data.data?.teams || data.teams || (data.success && Array.isArray(data.data) ? data.data : []);
        if (!Array.isArray(teams)) {
          teams = [];
        }

        if (isMounted) {
          setTeamsList(teams);
        }
      } catch (err) {
        console.error('Error fetching teams from DB:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAllTeams();
    return () => {
      isMounted = false;
    };
  }, [gameSlug]);

  // Tailored header metadata
  const badgeText = myTeamsOnly
    ? '🏆 MIS ESCUADRAS & CLUBES INSCRITOS'
    : gameConfig?.teamBadgeText || `DIRECTORIO OFICIAL DE ESCUADRAS ${gameConfig?.name?.toUpperCase() || 'ESPORTS'}`;
  const title = myTeamsOnly ? 'MIS EQUIPOS' : gameConfig?.teamTitle || 'ESCUADRAS &';
  const highlightTitle = myTeamsOnly ? '& CLUBES PRO.' : gameConfig?.teamHighlightTitle || 'CLUBES PRO.';
  const description = myTeamsOnly
    ? `Todas las escuadras eSports en las que estás registrado como capitán, encargado o jugador de plantilla.`
    : gameConfig?.teamDescription || `Conoce todas las organizaciones, clubes de élite y plantillas registradas en ${gameConfig?.name || 'la plataforma'}.`;

  // If a team is selected in-page, show the Team Profile View
  if (selectedTeam) {
    const tGameConfig = GAMES_CATALOG[selectedTeam.gameSlug || (selectedTeam as any).game_slug || 'eafc26'];
    const tBrandColor = tGameConfig?.brandColor || activeBrandColor;
    return (
      <TeamProfileView
        team={selectedTeam}
        brandColor={tBrandColor}
        onBack={() => setSelectedTeam(null)}
      />
    );
  }

  const filteredTeams = teamsList.filter((team) => {
    if (myTeamsOnly && currentUser) {
      const uId = currentUser.id;
      const uName = currentUser.name?.toLowerCase();
      const uGamer = currentUser.gamertag?.toLowerCase();

      const cId = team.captainId || (team as any).captain_id;
      const cName = ((team as any).captainName || (team as any).captain_name || (team as any).captain || '').toLowerCase();
      const isCaptain = (cId && cId === uId) || (cName && (cName === uName || cName === uGamer));

      const members = (team as any).members || (team as any).membersList || [];
      const isMember = Array.isArray(members) && members.some((m: any) => m.id === uId || m.user_id === uId || m.userId === uId);

      const encs = (team as any).encargados || (team as any).encargados_json;
      let isEncargado = false;
      if (encs) {
        try {
          const arr = typeof encs === 'string' ? JSON.parse(encs) : encs;
          if (Array.isArray(arr) && arr.some((e: any) => (typeof e === 'string' ? e === uId : e.id === uId))) {
            isEncargado = true;
          }
        } catch (e) {}
      }

      if (!isCaptain && !isMember && !isEncargado && currentUser.teamId !== team.id) {
        return false;
      }
    }

    const matchesSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.captainName || (team as any).captain || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = selectedPlatform === 'TODOS' || team.platform === selectedPlatform;
    const tSlug = team.gameSlug || (team as any).game_slug || 'eafc26';
    const matchesDiscipline = selectedDiscipline === 'ALL' || tSlug === selectedDiscipline;
    return matchesSearch && matchesPlatform && matchesDiscipline;
  });

  // --- Pagination Logic ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTeams = filteredTeams.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when search or platform/discipline changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedPlatform, selectedDiscipline, teamsList]);

  const DISCIPLINE_OPTIONS = [
    { id: 'ALL', label: 'TODAS LAS DISCIPLINAS' },
    { id: 'eafc26', label: 'EA FC 26' },
    { id: 'valorant', label: 'VALORANT' },
    { id: 'csgo', label: 'CS2' },
    { id: 'lol', label: 'LOL' },
    { id: 'rocketleague', label: 'ROCKET LEAGUE' },
    { id: 'fortnite', label: 'FORTNITE' },
  ];

  const isSpecificGame = !!gameSlug && gameSlug !== 'ALL';

  return (
    <div className="space-y-6 sm:space-y-8 font-mono">
      {!hideHeader && (
        <PageHeader
          badgeText={badgeText}
          badgeIcon={<Flame className="w-3.5 h-3.5" style={{ color: activeBrandColor, fill: activeBrandColor }} />}
          title={title}
          highlightTitle={highlightTitle}
          description={description}
          brandColor={activeBrandColor}
        />
      )}

      {/* ── LOADER TÁCTICO O CONTENIDO CARGADO ───────────────────────────── */}
      {isLoading ? (
        <TacticalLoadingSkeleton game={gameConfig} message={`SINCRONIZANDO ESCUADRAS Y CLUBES DE ${gameConfig?.name}...`} />
      ) : (
        <>
          {/* ── TACTICAL FILTER & SEARCH TOOLBAR ────────────────────────────── */}
          <div className="mb-8 mt-6">
            <FilterBar
              searchPlaceholder="Buscar por club, tag de escuadra o capitán..."
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              options={isSpecificGame ? [] : DISCIPLINE_OPTIONS}
              activeFilter={selectedDiscipline}
              onFilterChange={setSelectedDiscipline}
              renderAsSelect={!isSpecificGame}
              count={filteredTeams.length}
              countLabel="EQUIPOS"
              brandColor={activeBrandColor}
            />
          </div>

          {/* ── TEAMS GRID ─────────────────────────────────────────────────── */}
          {filteredTeams.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-4 shadow-xl">
              <Shield className="w-12 h-12 text-[var(--text-muted)] opacity-60 mx-auto" />
              <h3 className="text-xl font-bold font-display text-[var(--text-heading)]">
                No se encontraron escuadras registradas
              </h3>
              <p className="text-xs font-mono text-[var(--text-muted)] max-w-sm mx-auto">
                No existen clubes que coincidan con la búsqueda o disciplina seleccionada.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedPlatform('TODOS');
                  setSelectedDiscipline('ALL');
                }}
                className="text-xs font-mono gap-1.5"
              >
                Restablecer Filtros
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentTeams.map((team, index) => {
                  const tGameSlug = team.gameSlug || (team as any).game_slug || 'eafc26';
                  const tGameConfig = GAMES_CATALOG[tGameSlug] || gameConfig;
                  const tBrandColor = tGameConfig?.brandColor || activeBrandColor;

                  return (
                    <EsportsCard
                      key={team.id}
                      onClick={() => setSelectedTeam(team)}
                      title={team.name}
                      subtitle={`🎮 ${tGameConfig?.name || 'FC 26'} | 🖥️ ${team.platform || 'CROSSPLAY'}`}
                      description={team.description || 'Escuadra oficial compitiendo en el circuito eSports profesional.'}
                      bannerUrl={team.bannerUrl || '/images/default/banner-default.jpg'}
                      logoUrl={team.logoUrl || (team as any).logo}
                      tag={team.tag}
                      country={(team as any).country || 'Chile'}
                      countryCode={(team as any).countryCode}
                      socials={
                        (team as any).socialMedia || {
                          whatsapp: (team as any).whatsapp,
                          instagram: (team as any).instagram,
                          twitter: (team as any).twitter,
                          twitch: (team as any).twitch,
                          discord: (team as any).discord,
                        }
                      }
                      badges={[
                        { text: tGameConfig?.name || 'eSports', variant: 'purple' },
                        { text: team.status || 'Escuadra Activa', variant: 'emerald', pulse: true }
                      ]}
                      stats={[
                        { icon: <Users className="w-3.5 h-3.5 text-cyan-400" />, label: 'Plantilla', value: `${team.membersCount || (team as any).members_count || 11} Atletas` },
                        { icon: <Crown className="w-3.5 h-3.5 text-amber-400" />, label: 'Capitán', value: team.captainName || 'Asignado' },
                      ]}
                      footerLeft={
                        <span className="flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5" style={{ color: tBrandColor }} />
                          <span style={{ color: tBrandColor }} className="font-bold">{tGameConfig?.name || 'Club Oficial'}</span>
                        </span>
                      }
                      actionText="VER CLUB"
                      brandColor={tBrandColor}
                      animationDelay={index * 50}
                    />
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  brandColor={activeBrandColor}
                  className="pt-8 pb-4"
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
