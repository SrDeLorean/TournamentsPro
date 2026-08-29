'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GAMES_CATALOG } from '@/lib/games-data';
import { getSectionMetadata } from '@/lib/section-config';
import type { GameSection } from '@/components/layout/game-sub-navbar';
import { PageHeader } from '@/components/ui/page-header';
import { FilterBar } from '@/components/ui/filter-bar';
import { GameExplorerPanel } from '@/components/ui/game-explorer-panel';
import { TacticalLoadingSkeleton } from '@/components/tournaments/tactical-loading-skeleton';
import { PlayerData } from '@/components/players/player-profile-view';
import { Button } from '@/components/ui/button';
import { Flame, LoaderCircle, Trophy, Users } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useGamePlayers } from '@/features/game-portal/hooks/use-game-players';
import { NewUserMyTeamsView as UserMyTeamsView } from '@/components/user/new-user-my-teams';

// ── Extracted Components ────────────────────────────────────────────────────
import { GameHomeHero } from '@/components/game/game-home-hero';
import { PlayerCardGrid } from '@/components/game/player-card-grid';
import {
  PlayerStatsSection,
  PlayerOffersSection,
  ClubDashboardSection,
  RosterSection,
  MatchdaySection,
  GameDataSection,
  PlayerFichaCrudSection,
} from '@/components/game/game-sections';

function PortalChunkLoading() {
  return (
    <div className="portal-chunk-loading" role="status" aria-live="polite">
      <div className="portal-chunk-loading-heading">
        <LoaderCircle className="size-4 animate-spin" />
        <span>Cargando módulo competitivo</span>
      </div>
      <div className="portal-chunk-loading-toolbar skeleton" />
      <div className="portal-chunk-loading-grid" aria-hidden="true">
        {[0, 1, 2].map((item) => <div key={item} className="portal-chunk-loading-card skeleton" />)}
      </div>
    </div>
  );
}

const UserProfileSettingsView = dynamic(() => import('@/components/user/user-profile-settings-view').then(m => ({ default: m.UserProfileSettingsView })), { loading: () => <PortalChunkLoading /> });
const ClubSettingsView = dynamic(() => import('@/components/club/club-settings-view').then(m => ({ default: m.ClubSettingsView })), { loading: () => <PortalChunkLoading /> });
const TransferMarket = dynamic(() => import('@/components/transfers/transfer-market').then(m => ({ default: m.TransferMarket })), { loading: () => <PortalChunkLoading /> });
const FixtureScheduleView = dynamic(() => import('@/components/tournaments/fixture-schedule-view').then(m => ({ default: m.FixtureScheduleView })), { loading: () => <PortalChunkLoading /> });
const ClassificationView = dynamic(() => import('@/components/tournaments/classification-view').then(m => ({ default: m.ClassificationView })), { loading: () => <PortalChunkLoading /> });
const EsportsAnalyticsView = dynamic(() => import('@/components/stats/esports-analytics-view').then(m => ({ default: m.EsportsAnalyticsView })), { loading: () => <PortalChunkLoading /> });
const TeamProfileView = dynamic(() => import('@/components/teams/team-profile-view').then(m => ({ default: m.TeamProfileView })), { loading: () => <PortalChunkLoading /> });
const GameUIShowcasePage = dynamic(() => import('@/features/design-system/components/game-ui-showcase-client').then(m => ({ default: m.default })), { loading: () => <PortalChunkLoading /> });
const OrganizationDirectory = dynamic(() => import('@/components/tournaments/organization-directory').then(m => ({ default: m.OrganizationDirectory })), { loading: () => <PortalChunkLoading /> });
const TeamDirectory = dynamic(() => import('@/components/teams/team-directory').then(m => ({ default: m.TeamDirectory })), { loading: () => <PortalChunkLoading /> });
const PlayerProfileView = dynamic(() => import('@/components/players/player-profile-view').then(m => ({ default: m.PlayerProfileView })), { loading: () => <PortalChunkLoading /> });



// ── Types ───────────────────────────────────────────────────────────────────

interface GamePortalClientProps {
  gameSlug: string;
  initialSection?: string;
}

// ── Main Page Component ─────────────────────────────────────────────────────

export default function GamePortalClient({ gameSlug, initialSection }: GamePortalClientProps) {
  const router = useRouter();
  const { currentUser, userTeams, refetchTeams } = useAuth();
  const game = GAMES_CATALOG[gameSlug];

  const myTeamInActiveDiscipline =
    (userTeams || []).find(
      (t) =>
        t.gameSlug === gameSlug &&
        (t.id === currentUser?.teamId ||
          t.captainId === currentUser?.id ||
          (currentUser?.teamName && t.name.toLowerCase() === currentUser.teamName.toLowerCase()))
    ) || (userTeams || []).find((t) => t.gameSlug === gameSlug);

  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null);
  const defaultSection: GameSection = (initialSection as GameSection) || 'home';
  const activeSection = defaultSection;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const { filteredPlayers, isLoadingPlayers } = useGamePlayers(game, activeSection, searchTerm, selectedPosition);

  if (!game) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold mb-4 text-[var(--text-heading)]">Juego no encontrado</h1>
        <p className="text-[var(--text-muted)] mb-6">El juego solicitado no existe en nuestro catálogo eSports.</p>
        <Link href="/">
          <Button variant="primary">Volver al Inicio</Button>
        </Link>
      </div>
    );
  }

  const meta = getSectionMetadata(game, activeSection);
  const brandColor = game.brandColor;

  // Mock data (to be replaced by API data)
  const mockMatches = [
    { id: 1, home: 'LeguaYork eSp', homeTag: 'LYK', away: 'Sangre Nueva FC', awayTag: 'SNF', date: 'Hoy - 21:00 hrs', jornada: 'Jornada 11', status: 'EN VIVO', score: '2 - 1' },
    { id: 2, home: 'Highfield XX', homeTag: 'HFX', away: 'Torneos Pro Gaming', awayTag: 'TPG', date: 'Hoy - 22:30 hrs', jornada: 'Jornada 11', status: 'ESTELAR', score: 'VS' },
  ];

  // ── Section Change Handler ────────────────────────────────────────────────

  const handleSectionChange = (sec: GameSection) => {
    setSearchTerm('');
    setSelectedPlayer(null);
    router.push(sec === 'home' ? `/${gameSlug}` : `/${gameSlug}/${sec}`);
  };

  return (
    <div className="min-h-screen pb-20 relative text-[var(--text-primary)]">
        <div className="standard-page-wrapper pt-0">
          {/* Section Header (excluded for sections that have their own PageHeader) */}
          {activeSection !== 'home' &&
            !['dashboard', 'club-dashboard', 'ficha', 'atleta-ajustes', 'partidos', 'clasificacion', 'organizaciones', 'competencias', 'datos', 'infografia', 'traspasos'].includes(activeSection as string) &&
            !selectedPlayer && (
              <div key={`header-${activeSection}`} className="pt-4 sm:pt-6">
                <PageHeader
                  badgeText={meta.badgeText}
                  badgeIcon={<Flame className="w-3.5 h-3.5" style={{ color: brandColor, fill: brandColor }} />}
                  title={meta.title}
                  highlightTitle={meta.highlightTitle}
                  description={meta.description}
                  brandColor={brandColor}
                />
              </div>
          )}

          {/* ── HOME ──────────────────────────────────────────────────── */}
          {activeSection === 'home' && (
            <GameHomeHero game={game} brandColor={brandColor} mockMatches={mockMatches} onNavigate={(s) => handleSectionChange(s as GameSection)} />
          )}

          {/* ── PARTIDOS (Fixture & Calendario) ────────────────────────── */}
          {activeSection === 'partidos' && (
            <div className="pt-3 sm:pt-4">
              <FixtureScheduleView game={game} />
            </div>
          )}

          {/* ── COMPETENCIAS ──────────────────────────────────────────── */}
          {activeSection === 'competencias' && (
            <div className="pt-3 sm:pt-4">
              <OrganizationDirectory gameSlug={game.slug} gameConfig={game} mode="competitions" />
            </div>
          )}

          {/* ── CLASIFICACION (Posiciones, Tablas & Brackets) ───────────── */}
          {activeSection === 'clasificacion' && (
            <div className="pt-3 sm:pt-4">
              <ClassificationView game={game} />
            </div>
          )}

          {/* ── UI SHOWCASE ────────────────────────────────────────────── */}
          {((activeSection as string) === 'UI' || (activeSection as string) === 'ui') && (
            <div className="pt-3 sm:pt-4">
              <GameUIShowcasePage gameSlug={gameSlug} />
            </div>
          )}

          {/* ── DATOS / INFOGRAFIA / TOPS (Analytics) ─────────────────── */}
          {activeSection === 'infografia' && (
            <div className="pt-3 sm:pt-4">
              <EsportsAnalyticsView game={game} />
            </div>
          )}

          {/* ── TRASPASOS ─────────────────────────────────────────────── */}
          {activeSection === 'traspasos' && (
            <div className="pt-3 sm:pt-4">
              <TransferMarket game={game} />
            </div>
          )}

          {/* ── EQUIPOS ───────────────────────────────────────────────── */}
          {activeSection === 'equipos' && (
            <TeamDirectory gameName={game.name} gameSlug={game.slug} brandColor={game.brandColor} hideHeader={true} />
          )}

          {/* ── MIS EQUIPOS (ATLETA) ─────────────────────────────────── */}
          {['mis-equipos', 'mis-clubes'].includes(activeSection as string) && (
            <UserMyTeamsView />
          )}

          {/* ── ORGANIZACIONES (TORNEOS) ──────────────────────────────── */}
          {activeSection === 'organizaciones' && (
            <OrganizationDirectory gameSlug={game.slug} gameConfig={game} />
          )}

          {/* ── JUGADORES ─────────────────────────────────────────────── */}
          {activeSection === 'jugadores' && (
            selectedPlayer ? (
              <PlayerProfileView player={selectedPlayer} brandColor={game.brandColor} onBack={() => setSelectedPlayer(null)} />
            ) : (
              <div className="space-y-6 pt-3 sm:pt-4">
                {isLoadingPlayers ? (
                  <TacticalLoadingSkeleton game={game} message={`SINCRONIZANDO ATLETAS DE ${game.name.toUpperCase()}...`} />
                ) : (
                  <>
                    <GameExplorerPanel
                      title="Explorar jugadores"
                      description="Busca atletas registrados por nombre, gamertag, club o posición."
                      brandColor={brandColor}
                      icon={<Users className="size-4" />}
                      onReset={() => setSearchTerm('')}
                      resetDisabled={!searchTerm}
                    >
                      <FilterBar
                        searchPlaceholder={meta.searchPlaceholder}
                        searchValue={searchTerm}
                        onSearchChange={setSearchTerm}
                        count={filteredPlayers.length}
                        countLabel="JUGADORES"
                        brandColor={brandColor}
                      />
                    </GameExplorerPanel>
                    <PlayerCardGrid players={filteredPlayers} gameSlug={game.slug} brandColor={brandColor} />
                  </>
                )}
              </div>
            )
          )}

          {/* ── TOPS ──────────────────────────────────────────────────── */}
          {activeSection === 'tops' && (
            <div className="space-y-6 pt-3 sm:pt-4">
              {isLoadingPlayers ? (
                <TacticalLoadingSkeleton game={game} message={`ANALIZANDO RENDIMIENTOS DE ${game.name.toUpperCase()}...`} />
              ) : (
                <>
                  <GameExplorerPanel
                    title="Explorar ranking"
                    description="Compara el rendimiento de los atletas y filtra el top por posición."
                    brandColor={brandColor}
                    icon={<Trophy className="size-4" />}
                    onReset={() => {
                      setSearchTerm('');
                      setSelectedPosition('ALL');
                    }}
                    resetDisabled={!searchTerm && selectedPosition === 'ALL'}
                  >
                    <FilterBar
                      searchPlaceholder={meta.searchPlaceholder}
                      searchValue={searchTerm}
                      onSearchChange={setSearchTerm}
                      options={[{ id: 'ALL', label: 'Todas las Posiciones' }, ...game.positions.map(p => ({ id: p, label: p }))]}
                      activeFilter={selectedPosition}
                      onFilterChange={setSelectedPosition}
                      renderAsSelect
                      count={filteredPlayers.length}
                      countLabel="CLASIFICADOS"
                      brandColor={brandColor}
                    />
                  </GameExplorerPanel>
                  <PlayerCardGrid players={filteredPlayers} gameSlug={game.slug} brandColor={brandColor} />
                </>
              )}
            </div>
          )}

          {/* ── FICHA (Player Profile View) ────────────────────────────── */}
          {(activeSection as string) === 'ficha' && (
            <>
              <div className="pt-2 animate-in fade-in duration-300">
                <PlayerProfileView
                  player={{
                    id: currentUser?.id || 'me',
                    name: currentUser?.name || 'Mi Ficha Atleta',
                    gamertag: currentUser?.gamertag || currentUser?.name || 'Atleta_Pro',
                    position: 'MCO',
                    teamName: myTeamInActiveDiscipline?.name || currentUser?.teamName || 'Agencia Libre',
                    rating: 89,
                    platform: 'CROSSPLAY',
                    gameSlug: game.slug,
                    status: 'Atleta Activo en Circuito',
                    bio: `Atleta eSports oficial registrado en el circuito profesional de ${game.name}.`,
                    stats: { matches: 48, goals: 29, assists: 17, mvps: 10, winrate: '81%' },
                  }}
                  brandColor={game.brandColor}
                />
              </div>
              <PlayerFichaCrudSection currentUser={currentUser} />
            </>
          )}

          {/* ── ATLETA-AJUSTES ────────────────────────────────────────── */}
          {['atleta-ajustes', 'perfil-ajustes'].includes(activeSection as string) && (
            <div className="pt-0 animate-in fade-in duration-300">
              <UserProfileSettingsView brandColor={game.brandColor} />
            </div>
          )}

          {/* ── STATS ─────────────────────────────────────────────────── */}
          {(activeSection as string) === 'stats' && <PlayerStatsSection game={game} />}

          {/* ── OFERTAS ────────────────────────────────────────────────── */}
          {(activeSection as string) === 'ofertas' && <PlayerOffersSection game={game} />}

          {/* ── CLUB DASHBOARD ─────────────────────────────────────────── */}
          {['dashboard', 'club-dashboard'].includes(activeSection as string) && (
            <div className="pt-2 animate-in fade-in duration-300">
              <ClubDashboardSection game={game} team={myTeamInActiveDiscipline} TeamProfileViewComponent={TeamProfileView} />
            </div>
          )}

          {/* ── PLANTILLA & RECLUTAMIENTO (Roster, Dorsales & Fichajes) ─────────────── */}
          {['plantilla', 'reclutamiento'].includes(activeSection as string) && (
            <RosterSection game={game} />
          )}

          {/* ── MATCHDAY ──────────────────────────────────────────────── */}
          {(activeSection as string) === 'matchday' && <MatchdaySection game={game} currentUser={currentUser} />}

          {/* ── DATOS ─────────────────────────────────────────────────── */}
          {(activeSection as string) === 'datos' && <GameDataSection game={game} />}

          {/* ── AJUSTES DEL CLUB ──────────────────────────────────────── */}
          {(activeSection as string) === 'ajustes' && (
            <div className="space-y-6 pt-3 sm:pt-4 animate-in fade-in duration-300">
              <ClubSettingsView team={myTeamInActiveDiscipline} activeGameSlug={game.slug} refetchTeams={refetchTeams} />
            </div>
          )}
      </div>
    </div>
  );
}
