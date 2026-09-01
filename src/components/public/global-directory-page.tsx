'use client';

import React from 'react';
import { Building2, Gamepad2, Globe2, Shield, Sparkles, Trophy, UserRound, Users } from 'lucide-react';
import { EsportsCard } from '@/components/ui/esports-card';
import { FilterBar } from '@/components/ui/filter-bar';
import { Pagination } from '@/components/ui/pagination';
import { GAMES_CATALOG } from '@/lib/games-data';

export type PublicDirectoryKind = 'organizations' | 'users' | 'teams';

interface DirectoryRecord {
  id: string;
  name: string;
  tag?: string | null;
  gamertag?: string | null;
  description?: string | null;
  country?: string | null;
  status?: string | null;
  color?: string | null;
  role?: string | null;
  position?: string | null;
  platform?: string | null;
  primaryGame?: string | null;
  primary_game_slug?: string | null;
  gameSlug?: string | null;
  game_slug?: string | null;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  foto?: string | null;
  logoUrl?: string | null;
  logo_url?: string | null;
  logo?: string | null;
  bannerUrl?: string | null;
  banner_url?: string | null;
  banner?: string | null;
  bio?: string | null;
  biografia?: string | null;
  rating?: string | number | null;
  rankBadge?: string | null;
  captainName?: string | null;
  membersCount?: number | null;
  teams_count?: number | null;
  organizers_count?: number | null;
  allowedGames?: string[];
  socialMedia?: Record<string, string | undefined>;
  website?: string | null;
  isBanned?: boolean;
}

interface DirectoryResponse {
  success?: boolean;
  organizations?: DirectoryRecord[];
  teams?: DirectoryRecord[];
  users?: DirectoryRecord[];
  data?: DirectoryRecord[] | {
    organizations?: DirectoryRecord[];
    teams?: DirectoryRecord[];
    users?: DirectoryRecord[];
  };
}

const DIRECTORY_CONFIG = {
  organizations: {
    eyebrow: 'Ecosistema competitivo',
    title: 'Organizaciones que hacen crecer la escena',
    description: 'Descubre comunidades, ligas y organizaciones verificadas de todas las disciplinas de TorneosPro.',
    search: 'Buscar organización, comunidad o tag...',
    countLabel: 'organizaciones',
    accent: 'var(--accent-violet)',
    icon: Building2,
  },
  users: {
    eyebrow: 'Talento de la comunidad',
    title: 'Atletas listos para competir',
    description: 'Explora perfiles públicos, posiciones, disciplinas y estado competitivo de los jugadores registrados.',
    search: 'Buscar atleta, gamertag o posición...',
    countLabel: 'atletas',
    accent: 'var(--accent-cyan)',
    icon: UserRound,
  },
  teams: {
    eyebrow: 'Clubes y escuadras',
    title: 'Equipos que compiten en TorneosPro',
    description: 'Conoce clubes, capitanes y plantillas activas dentro del circuito competitivo global.',
    search: 'Buscar equipo, tag o capitán...',
    countLabel: 'equipos',
    accent: 'var(--accent-emerald)',
    icon: Shield,
  },
} as const;

function extractRecords(kind: PublicDirectoryKind, response: DirectoryResponse): DirectoryRecord[] {
  if (Array.isArray(response.data)) return response.data;
  const nested = response.data?.[kind];
  if (Array.isArray(nested)) return nested;
  const direct = response[kind];
  return Array.isArray(direct) ? direct : [];
}

function getGameSlug(record: DirectoryRecord): string {
  return record.gameSlug || record.game_slug || record.primaryGame || record.primary_game_slug || record.allowedGames?.[0] || 'eafc26';
}

export default function GlobalDirectoryPage({ kind }: { kind: PublicDirectoryKind }) {
  const config = DIRECTORY_CONFIG[kind];
  const Icon = config.icon;
  const [records, setRecords] = React.useState<DirectoryRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [gameFilter, setGameFilter] = React.useState('ALL');
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setIsLoading(true);
        setLoadError('');
        const response = await fetch(`/api/${kind}?limit=200`);
        if (!response.ok) throw new Error(`No se pudo cargar el directorio (${response.status})`);
        const payload = await response.json() as DirectoryResponse;
        if (active) setRecords(extractRecords(kind, payload).filter((record) => !record.isBanned));
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : 'No se pudo cargar el directorio.');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [kind]);

  const filteredRecords = React.useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return records.filter((record) => {
      const gameSlug = getGameSlug(record);
      const matchesGame = gameFilter === 'ALL' || gameSlug === gameFilter || record.allowedGames?.includes(gameFilter);
      const haystack = [record.name, record.tag, record.gamertag, record.position, record.captainName, record.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return matchesGame && (!normalizedSearch || haystack.includes(normalizedSearch));
    });
  }, [gameFilter, records, search]);

  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRecords = filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize);
  const activeCount = records.filter((record) => !record.status || !/inactiv|suspend|retir/i.test(record.status)).length;
  const representedGames = new Set(records.flatMap((record) => record.allowedGames?.length ? record.allowedGames : [getGameSlug(record)])).size;
  const gameOptions = [
    { id: 'ALL', label: 'Todas las disciplinas', icon: <Globe2 className="size-3.5" /> },
    ...Object.values(GAMES_CATALOG).map((game) => ({ id: game.slug, label: game.name })),
  ];

  return (
    <main className="public-directory-page" style={{ '--directory-accent': config.accent } as React.CSSProperties}>
      <section className="public-directory-hero">
        <div className="public-directory-hero-glow" />
        <div className="public-directory-hero-copy">
          <div className="public-directory-icon"><Icon className="size-6 sm:size-8" /></div>
          <div>
            <p className="public-directory-eyebrow"><Sparkles className="size-3.5" />{config.eyebrow}</p>
            <h1>{config.title}</h1>
            <p className="public-directory-description">{config.description}</p>
          </div>
        </div>
        <div className="public-directory-metrics">
          <div><strong>{records.length}</strong><span>{config.countLabel}</span></div>
          <div><strong>{activeCount}</strong><span>activos</span></div>
          <div><strong>{representedGames}</strong><span>disciplinas</span></div>
        </div>
      </section>

      <section className="public-directory-content" aria-labelledby="directory-results-title">
        <div className="public-directory-section-heading">
          <div><p>Directorio público</p><h2 id="directory-results-title">Explora la comunidad</h2></div>
          <span><Trophy className="size-3.5" />Perfiles públicos verificados</span>
        </div>

        <FilterBar
          searchPlaceholder={config.search}
          searchValue={search}
          onSearchChange={(value) => { setSearch(value); setPage(1); }}
          options={gameOptions}
          activeFilter={gameFilter}
          onFilterChange={(value) => { setGameFilter(value); setPage(1); }}
          renderAsSelect
          count={filteredRecords.length}
          countLabel={config.countLabel}
          brandColor={config.accent}
        />

        {isLoading ? (
          <div className="public-directory-grid" aria-label="Cargando directorio">
            {Array.from({ length: 6 }, (_, index) => <div key={index} className="public-directory-skeleton" />)}
          </div>
        ) : loadError ? (
          <div role="alert" className="public-directory-empty"><Globe2 className="size-8" /><h3>No pudimos cargar el directorio</h3><p>{loadError}</p></div>
        ) : visibleRecords.length === 0 ? (
          <div className="public-directory-empty"><Gamepad2 className="size-8" /><h3>Sin resultados</h3><p>Prueba con otra búsqueda o disciplina.</p></div>
        ) : (
          <div className="public-directory-grid">
            {visibleRecords.map((record, index) => {
              const slug = getGameSlug(record);
              const game = GAMES_CATALOG[slug] || GAMES_CATALOG.eafc26;
              const isOrganization = kind === 'organizations';
              const isUser = kind === 'users';
              const href = isOrganization
                ? `/organizaciones/${record.id}`
                : isUser
                  ? `/usuarios/${record.id}`
                  : `/equipos/${record.id}`;
              const logoUrl = isUser
                ? record.avatarUrl || record.avatar_url || record.foto
                : record.logoUrl || record.logo_url || record.logo;
              const bannerUrl = record.bannerUrl || record.banner_url || record.banner;
              const subtitle = isOrganization
                ? `${record.tag ? `[${record.tag}] · ` : ''}${record.allowedGames?.length || 1} disciplinas`
                : isUser
                  ? `@${record.gamertag || record.name} · ${record.position || 'Jugador'}`
                  : `${record.tag ? `[${record.tag}] · ` : ''}${record.platform || 'Crossplay'}`;
              const stats = isOrganization
                ? [{ icon: <Users className="size-3.5" />, label: 'Equipos', value: record.teams_count || 0 }, { icon: <Trophy className="size-3.5" />, label: 'Organizadores', value: record.organizers_count || 0 }]
                : isUser
                  ? [{ icon: <Trophy className="size-3.5" />, label: 'Rating', value: record.rating || '—' }, { icon: <Gamepad2 className="size-3.5" />, label: 'Rango', value: record.rankBadge || 'Competitivo' }]
                  : [{ icon: <Users className="size-3.5" />, label: 'Plantilla', value: record.membersCount || 0 }, { icon: <Trophy className="size-3.5" />, label: 'Capitán', value: record.captainName || 'Por definir' }];

              return (
                <EsportsCard
                  key={record.id}
                  entityType={isOrganization ? 'organization' : isUser ? 'user' : 'team'}
                  href={href}
                  title={record.name}
                  subtitle={subtitle}
                  description={record.description || record.biografia || record.bio || (isUser ? 'Atleta registrado en el ecosistema competitivo de TorneosPro.' : 'Miembro oficial del ecosistema competitivo de TorneosPro.')}
                  bannerUrl={bannerUrl || undefined}
                  logoUrl={logoUrl || undefined}
                  fallbackIcon={isUser ? <UserRound className="size-8" /> : isOrganization ? <Building2 className="size-8" /> : <Shield className="size-8" />}
                  country={record.country || 'Chile'}
                  tag={record.tag || undefined}
                  badges={[{ text: record.status || 'Activo', variant: 'emerald', pulse: true }, { text: game.name, variant: 'purple' }]}
                  stats={stats}
                  socials={isOrganization ? { ...record.socialMedia, website: record.website || undefined } : undefined}
                  footerLeft={<span className="flex items-center gap-1"><Gamepad2 className="size-3.5" />{game.name}</span>}
                  actionText="VER PERFIL"
                  brandColor={game.brandColor || config.accent}
                  animationDelay={index * 35}
                  transitionName={kind === 'teams' ? `team-identity-${record.id}` : undefined}
                  transitionTypes={kind === 'teams' ? ['nav-forward'] : undefined}
                />
              );
            })}
          </div>
        )}

        {!isLoading && !loadError && totalPages > 1 ? <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} className="pt-4" /> : null}
      </section>
    </main>
  );
}
