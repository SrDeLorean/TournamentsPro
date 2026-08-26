'use client';

import React, { use, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { GAMES_CATALOG } from '@/lib/games-data';
import { getSectionMetadata } from '@/lib/section-config';
import { GameSubNavbar, GameSection } from '@/components/layout/game-sub-navbar';
import { PageHeader } from '@/components/ui/page-header';
import { FilterBar } from '@/components/ui/filter-bar';
import { TacticalLoadingSkeleton } from '@/components/tournaments/tactical-loading-skeleton';
import { TeamDirectory } from '@/components/teams/team-directory';
import { PlayerProfileView, PlayerData } from '@/components/players/player-profile-view';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Flame } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { fetchJson } from '@/lib/fetch-utils';
import { OrganizationDirectory } from '@/components/tournaments/organization-directory';
import { NewUserMyTeamsView as UserMyTeamsView } from '@/components/user/new-user-my-teams';

// ── Extracted Components ────────────────────────────────────────────────────
import { GameHomeHero } from '@/components/game/game-home-hero';
import { PlayerCardGrid, PlayerCardData } from '@/components/game/player-card-grid';
import {
  PlayerStatsSection,
  PlayerOffersSection,
  ClubDashboardSection,
  RosterSection,
  MatchdaySection,
  GameDataSection,
  PlayerFichaCrudSection,
} from '@/components/game/game-sections';

// ── Lazy-loaded Heavy Components (P3: dynamic imports) ──────────────────────
const UserProfileSettingsView = dynamic(
  () => import('@/components/user/user-profile-settings-view').then(m => ({ default: m.UserProfileSettingsView })),
  { loading: () => <div className="skeleton h-96 rounded-xl" /> }
);

const ClubSettingsView = dynamic(
  () => import('@/components/club/club-settings-view').then(m => ({ default: m.ClubSettingsView })),
  { loading: () => <div className="skeleton h-64 rounded-xl" /> }
);

const TransferMarket = dynamic(
  () => import('@/components/transfers/transfer-market').then(m => ({ default: m.TransferMarket })),
  { loading: () => <div className="skeleton h-64 rounded-xl" /> }
);

const TournamentHubView = dynamic(
  () => import('@/components/tournaments/tournament-hub-view').then(m => ({ default: m.TournamentHubView })),
  { loading: () => <div className="skeleton h-64 rounded-xl" /> }
);

const FixtureScheduleView = dynamic(
  () => import('@/components/tournaments/fixture-schedule-view').then(m => ({ default: m.FixtureScheduleView })),
  { loading: () => <div className="skeleton h-96 rounded-xl" /> }
);

const ClassificationView = dynamic(
  () => import('@/components/tournaments/classification-view').then(m => ({ default: m.ClassificationView })),
  { loading: () => <div className="skeleton h-96 rounded-xl" /> }
);

const EsportsAnalyticsView = dynamic(
  () => import('@/components/stats/esports-analytics-view').then(m => ({ default: m.EsportsAnalyticsView })),
  { loading: () => <div className="skeleton h-64 rounded-xl" /> }
);

const TeamProfileView = dynamic(
  () => import('@/components/teams/team-profile-view').then(m => ({ default: m.TeamProfileView })),
  { loading: () => <div className="skeleton h-64 rounded-xl" /> }
);

const GameUIShowcasePage = dynamic(
  () => import('@/app/[gameSlug]/UI/page').then(m => ({ default: m.default })),
  { loading: () => <div className="skeleton h-96 rounded-xl" /> }
);

// ── Types ───────────────────────────────────────────────────────────────────

interface GamePageProps {
  params: Promise<{ gameSlug: string }>;
  initialSection?: string;
}

// ── Main Page Component ─────────────────────────────────────────────────────

export default function GameDedicatedPortalPage({ params, initialSection }: GamePageProps) {
  const { currentUser, userTeams, refetchTeams } = useAuth();
  const { gameSlug } = use(params);
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
  const [activeSection, setActiveSection] = useState<GameSection>(defaultSection);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [dbUsersList, setDbUsersList] = React.useState<PlayerCardData[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = React.useState(true);

  React.useEffect(() => {
    if (!game || (activeSection !== 'jugadores' && activeSection !== 'tops')) return;

    let cancelled = false;
    const minDelay = new Promise(resolve => setTimeout(resolve, 50));
    const fetchPromise = fetchJson<Record<string, unknown>>(`/api/users?gameSlug=${gameSlug}&limit=200`)
      .then((data) => {
        const responseData = data.data as { users?: Record<string, unknown>[] } | Record<string, unknown>[] | undefined;
        const users = (!Array.isArray(responseData) && responseData?.users)
          || data.users
          || (data.success && Array.isArray(responseData) ? responseData : []);
        return Array.isArray(users) ? users : [];
      })
      .then((users) => {
        if (cancelled || users.length === 0) return;

        const validPositions = game.positions || [];
        const mapped: PlayerCardData[] = users.map((u: Record<string, unknown>) => {
          const rawPos = (u.gameProfiles as Record<string, { position?: string }>)?.[game.slug]?.position
            || (game.slug === u.primaryGame ? u.position as string : undefined)
            || (validPositions.includes(u.position as string) ? u.position as string : undefined);
          const pos = (rawPos && validPositions.includes(rawPos)) ? rawPos : validPositions[0] || 'DFC';

          return {
            id: u.id as string,
            name: u.name as string,
            gamertag: (u.gamertag || u.name) as string,
            pos,
            secPos: undefined,
            gameId: (u.gameProfiles as Record<string, { gameId?: string }>)?.[game.slug]?.gameId || `${game.slug.toUpperCase()}-ID #${(u.id as string).substring(0, 6)}`,
            team: (u.teamName || 'Agencia Libre') as string,
            rating: (u.rating || '9.2') as string,
            pss: '92%',
            nacionalidad: (u.nacionalidad || 'Chile') as string,
            bannerUrl: (u.bannerUrl || '/images/default/banner-default.jpg') as string,
            avatarUrl: (u.avatarUrl || u.foto || '/images/default/logo-default.png') as string,
            status: (u.status || 'Atleta Activo') as string,
            platform: (u.platform || 'CROSSPLAY') as string,
          };
        });
        setDbUsersList(mapped);
      })
      .catch((err) => console.error('Error fetching players:', err));

    Promise.all([fetchPromise, minDelay]).finally(() => {
      if (!cancelled) setIsLoadingPlayers(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeSection, gameSlug, game]);

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

  const filteredPlayers = dbUsersList.filter(p => {
    const matchesSearch = searchTerm === '' || 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.gamertag && p.gamertag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.team && p.team.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.gameId && p.gameId.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesPosition = selectedPosition === 'ALL' || p.pos === selectedPosition;
    
    return matchesSearch && matchesPosition;
  });

  // ── Section Change Handler ────────────────────────────────────────────────

  const handleSectionChange = (sec: GameSection) => {
    if (sec === 'jugadores' || sec === 'tops') {
      setIsLoadingPlayers(true);
    }
    setActiveSection(sec);
    setSearchTerm('');
    setSelectedPlayer(null);
  };

  return (
    <div
      className="min-h-screen pb-20 relative transition-all duration-500 text-[var(--text-primary)] bg-[var(--bg-main)]"
      style={{
        '--game-brand': game.brandColor,
        '--game-accent': game.accentColor,
      } as React.CSSProperties}
    >
      <GameSubNavbar game={game} activeSection={activeSection} onSelectSection={handleSectionChange} />

      <div className="relative w-full min-h-screen">
        {/* Fixed Background Banner */}
        <div className="absolute top-0 left-0 right-0 h-[800px] w-full overflow-hidden pointer-events-none z-0">
          <Image
            src={game.bannerUrl}
            alt={game.name}
            fill
            sizes="100vw"
            className="w-full h-full object-cover object-top opacity-[0.75] dark:opacity-95 filter contrast-[1.25] saturate-[1.2] brightness-[1.25] dark:brightness-100 dark:contrast-[1.3] dark:saturate-[1.25] transition-all duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg-main)]" />
        </div>

        <div className="standard-page-wrapper pt-0 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-forwards" key={activeSection}>
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
              <TournamentHubView game={game} initialSection="competencias" />
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
              <GameUIShowcasePage params={Promise.resolve({ gameSlug })} />
            </div>
          )}

          {/* ── DATOS / INFOGRAFIA / TOPS (Analytics) ─────────────────── */}
          {['datos', 'infografia'].includes(activeSection as string) && (
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
                    <FilterBar
                      searchPlaceholder={meta.searchPlaceholder}
                      searchValue={searchTerm}
                      onSearchChange={setSearchTerm}
                      brandColor={brandColor}
                    />
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
                  <FilterBar
                    searchPlaceholder={meta.searchPlaceholder}
                    searchValue={searchTerm}
                    onSearchChange={setSearchTerm}
                    options={[{ id: 'ALL', label: 'Todas las Posiciones' }, ...game.positions.map(p => ({ id: p, label: p }))]}
                    activeFilter={selectedPosition}
                    onFilterChange={setSelectedPosition}
                    brandColor={brandColor}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {filteredPlayers.map((player, idx) => (
                      <Card key={idx} className="glass-card-premium">
                        <CardHeader>
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="cyan" style={{ backgroundColor: `color-mix(in srgb, ${brandColor} 15%, transparent)`, color: brandColor, borderColor: `color-mix(in srgb, ${brandColor} 40%, transparent)` }}>{player.pos}</Badge>
                            <span className="text-xs font-mono font-bold text-amber-400">★ {player.rating}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Avatar fallback={player.name} size="md" status="online" />
                            <div>
                              <CardTitle className="text-base truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r transition-all" style={{ backgroundImage: `linear-gradient(to right, ${brandColor}, #ffffff)` }}>{player.name}</CardTitle>
                              <CardDescription>{player.team}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardFooter className="text-xs text-[var(--text-muted)] flex justify-between bg-[var(--bg-main)]/40 mt-auto py-2">
                          <span>Efectividad:</span>
                          <span className="font-bold text-[var(--accent-emerald)]">{player.pss}</span>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
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
    </div>
  );
}
