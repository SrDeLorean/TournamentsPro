'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Search, Building2, Trophy, RefreshCw, BarChart2, LoaderCircle, X, SlidersHorizontal, RotateCcw, GitBranch, ListOrdered, CheckCircle2, Clock3 } from 'lucide-react';
import { GameConfig } from '@/lib/games-data';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TacticalLoadingSkeleton } from './tactical-loading-skeleton';
import { PlayoffBracket } from './playoff-bracket';
import { LeagueStandingsTable } from './league-standings-table';
import { getOrganizationsWithStatsAction } from '@/app/actions/organizations';
import { shouldBypassImageOptimization } from '@/lib/image-utils';
import {
  calculateStandings,
  isFinalizedMatchStatus,
  type ClassificationMatch,
  type OrganizationApiItem,
  type OrganizationItem,
  type TeamStanding,
  type TournamentApiItem,
  type TournamentItem,
} from '@/features/competitions/classification/classification-model';

interface ClassificationViewProps {
  game: GameConfig;
  initialOrgName?: string;
  initialTournName?: string;
  initialTournId?: string;
  hideOrgFilter?: boolean;
  hideCompFilter?: boolean;
  hideSearchFilter?: boolean;
  hideHeader?: boolean;
  targetTeamName?: string;
}

export function ClassificationView({
  game,
  initialOrgName,
  initialTournName,
  initialTournId,
  hideOrgFilter = false,
  hideCompFilter = false,
  hideSearchFilter = false,
  hideHeader = false,
  targetTeamName,
}: ClassificationViewProps) {
  const brandColor = game.brandColor;
  
  // States
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [tournaments, setTournaments] = useState<TournamentItem[]>([]);
  
  const [selectedOrgName, setSelectedOrgName] = useState(initialOrgName || 'TODAS');
  const [selectedTournName, setSelectedTournName] = useState(initialTournName || 'TODAS');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [allMatches, setAllMatches] = useState<ClassificationMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [activeTabs, setActiveTabs] = useState<Record<string, 'LIGA' | 'PLAYOFF'>>({});

  // 1. Fetch Organizations
  const fetchOrganizationsFromDB = useCallback(async () => {
    try {
      const res = await getOrganizationsWithStatsAction(game.slug);
      if (res.success && res.organizations) {
        const mapped = (res.organizations as OrganizationApiItem[]).map((o) => ({
          id: o.id || o.name,
          name: o.name,
          tag: o.tag,
          logoUrl: o.logo_url || o.logoUrl || '/images/default/logo-default.png',
        }));
        setOrganizations(mapped);
      }
    } catch (err) {
      console.error('Error fetching orgs:', err);
    }
  }, [game.slug]);

  // 2. Fetch Tournaments
  const fetchTournamentsFromDB = useCallback(async (orgName: string) => {
    try {
      let url = `/api/tournaments?gameSlug=${game.slug}&_t=${Date.now()}`;
      if (orgName !== 'TODAS') url += `&organizationName=${encodeURIComponent(orgName)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.tournaments)) {
        const mapped = (data.tournaments as TournamentApiItem[]).map((t) => {
          // The API swaps them: c.format is returned as format_type, and c.mode_format is returned as format
          let rawFormat = (t.format_type || t.format || 'LIGA').toUpperCase();
          rawFormat = rawFormat.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // HÍBRIDO -> HIBRIDO
          
          let parsedFormat = 'LIGA';
          if (rawFormat.includes('PLAYOFF') || rawFormat.includes('ELIMINATORIA')) parsedFormat = 'PLAYOFF';
          else if (rawFormat.includes('HIBRID')) parsedFormat = 'HIBRIDO';

          return {
            id: t.id,
            name: t.name,
            organizationName: t.organization_name,
            formatType: parsedFormat,
            matchMode: t.match_mode || 'PartidoUnico',
            qualifiersPerGroup: Number(t.qualifiers_per_group || 2),
            logoUrl: t.logo_url || t.logoUrl || t.banner_url || t.bannerUrl || '/images/default/logo-default.png',
          };
        });
        
        let filteredMapped = mapped;
        // If targetTeamName is provided, only keep tournaments where this team has matches
        if (targetTeamName) {
           try {
             const mRes = await fetch(`/api/matches?gameSlug=${game.slug}&search=${encodeURIComponent(targetTeamName)}`);
             const mData = await mRes.json();
             if (mData.success && Array.isArray(mData.matches)) {
                const teamTournaments = new Set(
                  (mData.matches as Pick<ClassificationMatch, 'tournament_name'>[]).map((m) => m.tournament_name)
                );
                filteredMapped = mapped.filter((t) => teamTournaments.has(t.name));
             }
           } catch {}
        }
        setTournaments(filteredMapped);
      } else {
        setTournaments([]);
      }
    } catch (err) {
      console.error('Error fetching tournaments:', err);
    }
  }, [game.slug, targetTeamName]);

  // 3. Fetch Matches & Calculate Standings
  const fetchAndCalculateStandings = useCallback(async (orgName: string, tournName: string, queryText: string) => {
    setIsRefreshing(true);
    try {
      // Pedir TODOS los partidos (no solo FINALIZADOS) para poder poblar la tabla con 0 puntos si no han jugado.
      let url = `/api/matches?gameSlug=${game.slug}&_t=${Date.now()}`;
      if (orgName !== 'TODAS') url += `&organizationName=${encodeURIComponent(orgName)}`;
      if (initialTournId) url += `&tournamentId=${encodeURIComponent(initialTournId)}`;
      else if (tournName !== 'TODAS') url += `&tournamentName=${encodeURIComponent(tournName)}`;
      if (queryText) url += `&search=${encodeURIComponent(queryText)}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.success && Array.isArray(data.matches)) {
        const matches = data.matches as ClassificationMatch[];
        setAllMatches(matches);
        setStandings(calculateStandings(matches));
      } else {
        setStandings([]);
      }
    } catch (err) {
      console.error('Error fetching standings matches:', err);
      setStandings([]);
    } finally {
      setIsRefreshing(false);
    }
  }, [game.slug, initialTournId]);

  // Initial Load
  useEffect(() => {
    let isMounted = true;
    const loadAllInitialData = async () => {
      try {
        const targetOrg = initialOrgName || 'TODAS';
        const targetTourn = initialTournName || 'TODAS';
        await Promise.all([
          fetchOrganizationsFromDB(),
          fetchTournamentsFromDB(targetOrg),
          fetchAndCalculateStandings(targetOrg, targetTourn, ''),
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadAllInitialData();
    return () => { isMounted = false; };
  }, [fetchAndCalculateStandings, fetchOrganizationsFromDB, fetchTournamentsFromDB, initialOrgName, initialTournName]);

  useEffect(() => {
    if (isLoading) return;
    const debounceId = window.setTimeout(() => {
      fetchAndCalculateStandings(selectedOrgName, selectedTournName, searchQuery.trim());
    }, 320);
    return () => window.clearTimeout(debounceId);
  }, [fetchAndCalculateStandings, isLoading, searchQuery, selectedOrgName, selectedTournName]);

  // Handlers
  const handleSelectOrganization = (orgName: string) => {
    setSelectedOrgName(orgName);
    setSelectedTournName('TODAS');
    fetchTournamentsFromDB(orgName);
  };

  const handleSelectTournament = (tournName: string) => {
    setSelectedTournName(tournName);
  };

  // Agrupar Clasificaciones por Organización -> Competencia (Usando tournaments base con fallback a allMatches)
  const groupedTournaments = useMemo(() => {
    const map: Record<string, TournamentItem[]> = {};
    
    // Fallback: If API tournaments list is empty, build tournament items from allMatches
    let activeTournaments: TournamentItem[] = [...tournaments];
    // Fallback: If API tournaments list is empty and we are NOT filtering by a specific team, build tournament items from allMatches
    if (activeTournaments.length === 0 && allMatches.length > 0 && !targetTeamName) {
      const matchTourns = new Map<string, TournamentItem>();
      allMatches.forEach((m) => {
        const tName = m.tournament_name || 'Competencia BD';
        if (!matchTourns.has(tName)) {
          matchTourns.set(tName, {
            id: m.competition_id || tName,
            name: tName,
            gameSlug: game.slug,
            organizationName: m.organization_name || 'Organización Oficial',
            formatType: 'LIGA',
          });
        }
      });
      activeTournaments = Array.from(matchTourns.values());
    }
    
    let filteredTournaments = activeTournaments;
    if (selectedOrgName !== 'TODAS') {
      filteredTournaments = filteredTournaments.filter(t => (t.organizationName || '').toLowerCase() === selectedOrgName.toLowerCase());
    }
    if (selectedTournName !== 'TODAS') {
      filteredTournaments = filteredTournaments.filter(t => t.name.toLowerCase() === selectedTournName.toLowerCase());
    }
    
    // Group by organization
    filteredTournaments.forEach((t) => {
      const orgName = t.organizationName || 'Organización Oficial';
      if (!map[orgName]) map[orgName] = [];
      map[orgName].push(t);
    });
    return map;
  }, [tournaments, allMatches, selectedOrgName, selectedTournName, game.slug, targetTeamName]);

  // Motor de Estados Vacíos
  const getEmptyStateMessage = () => {
    if (targetTeamName && tournaments.length === 0) {
      return {
        title: 'Sin competencias registradas',
        desc: 'El equipo no se encuentra inscrito en ninguna competencia actualmente.'
      };
    }
    if (searchQuery) {
      return {
        title: `Sin resultados para "${searchQuery}"`,
        desc: 'No existen equipos o competencias que coincidan con la búsqueda ingresada.'
      };
    }
    if (selectedTournName !== 'TODAS') {
      return {
        title: 'Competencia sin resultados oficiales',
        desc: `Actualmente la competencia ${selectedTournName} no tiene partidos finalizados registrados en la plataforma.`
      };
    }
    if (selectedOrgName !== 'TODAS') {
      return {
        title: 'Organización sin tablas de posiciones',
        desc: `No existen competencias con partidos finalizados en la organización ${selectedOrgName}.`
      };
    }
    return {
      title: 'No hay datos de clasificación',
      desc: 'No se encontraron partidos finalizados en la plataforma para generar las tablas de posiciones.'
    };
  };

  const emptyState = getEmptyStateMessage();

  return (
    <div className="classification-view w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-16">
      
      {/* ── 1. ENCABEZADO ──────────────────────────────────────────────────────── */}
      {!hideHeader && (
        <PageHeader
          badgeText={`TEMPORADA OFICIAL / ${game.name.toUpperCase()}`}
          badgeIcon={<BarChart2 className="w-3.5 h-3.5" style={{ color: brandColor, fill: brandColor }} />}
          title="Tabla de Posiciones y Clasificación General"
          highlightTitle="Clasificación"
          description="Sigue de cerca el rendimiento de tu equipo, puntos, diferencia de gol y estadísticas en todas las ligas de TournamentsPro."
          brandColor={brandColor}
        />
      )}

      {isLoading ? (
        <div className="pt-12">
          <TacticalLoadingSkeleton game={game} message={`CALCULANDO CLASIFICACIÓN DE ${game.name.toUpperCase()}...`} />
        </div>
      ) : (
        <>
          {/* ── 2. FILTROS EN TARJETA (GLASS-PANEL) ─────────────────────────────────── */}
          {(!hideSearchFilter || !hideOrgFilter || !hideCompFilter) && (
            <div className="classification-filter-card game-query-panel bg-[var(--bg-card)] rounded-3xl border border-[var(--border-card)] shadow-xl backdrop-blur-md">
              <div className="classification-filter-heading">
                <div className="classification-filter-heading-copy">
                  <span className="classification-filter-heading-icon" aria-hidden="true">
                    <SlidersHorizontal className="size-4" />
                  </span>
                  <div>
                    <h2>Explorar clasificación</h2>
                    <p>Busca un equipo o acota la tabla por organización y competencia.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    handleSelectOrganization('TODAS');
                  }}
                  disabled={!searchQuery && selectedOrgName === 'TODAS' && selectedTournName === 'TODAS'}
                  className="classification-filter-reset"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Restablecer</span>
                </button>
              </div>
              
              {/* BUSCADOR */}
              {!hideSearchFilter && (
                <div className="game-search-control relative w-full">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--game-brand)]" />
                  <Input
                    type="search"
                    aria-label="Buscar en la clasificación"
                    placeholder="Buscar por equipo, organización o liga..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        fetchAndCalculateStandings(selectedOrgName, selectedTournName, searchQuery);
                      }
                    }}
                    className="pl-11 pr-12 text-xs sm:text-sm w-full"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                    {isRefreshing ? (
                      <LoaderCircle className="size-4 animate-spin text-[var(--game-brand)]" aria-label="Actualizando resultados" />
                    ) : searchQuery ? (
                      <button type="button" onClick={() => setSearchQuery('')} className="game-search-clear" aria-label="Limpiar búsqueda">
                        <X className="size-4" />
                      </button>
                    ) : (
                      <kbd className="game-search-hint">ENTER</kbd>
                    )}
                  </div>
                </div>
              )}

              <div className="classification-filter-grid">

              {/* ORGANIZACIONES */}
              {!hideOrgFilter && (
                <div className="classification-filter-section font-mono">
                  <div className="classification-filter-label">
                    <span className="flex min-w-0 items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 shrink-0" style={{ color: brandColor }} />
                      <span className="truncate">Organizaciones</span>
                    </span>
                    <span className="classification-filter-count">{organizations.length}</span>
                  </div>
                  <div className="game-filter-options mobile-scroll-row flex items-center gap-2 overflow-x-auto pb-1">
                    <button
                      type="button"
                      aria-pressed={selectedOrgName === 'TODAS'}
                      onClick={() => handleSelectOrganization('TODAS')}
                      className={`classification-filter-chip px-3.5 py-1.5 text-xs font-bold transition-all border flex items-center gap-2 ${
                        selectedOrgName === 'TODAS'
                          ? 'shadow-md font-black'
                          : 'bg-[var(--bg-card)] border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                      }`}
                      style={
                        selectedOrgName === 'TODAS'
                          ? {
                              backgroundColor: `color-mix(in srgb, ${brandColor} 20%, transparent)`,
                              borderColor: brandColor,
                              color: brandColor,
                              boxShadow: `0 0 15px color-mix(in srgb, ${brandColor} 30%, transparent)`,
                            }
                          : undefined
                      }
                    >
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span>TODAS</span>
                    </button>
                    {organizations.map((org) => {
                      const isActive = selectedOrgName.toUpperCase() === org.name.toUpperCase();
                      return (
                        <button
                          type="button"
                          aria-pressed={isActive}
                          key={org.id}
                          onClick={() => handleSelectOrganization(org.name)}
                          className={`classification-filter-chip px-3.5 py-1.5 text-xs font-bold transition-all border flex items-center gap-2 ${
                            isActive
                              ? 'shadow-md font-black'
                              : 'bg-[var(--bg-card)] border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                          }`}
                          style={
                            isActive
                              ? {
                                  backgroundColor: `color-mix(in srgb, ${brandColor} 20%, transparent)`,
                                  borderColor: brandColor,
                                  color: brandColor,
                                  boxShadow: `0 0 15px color-mix(in srgb, ${brandColor} 30%, transparent)`,
                                }
                              : undefined
                          }
                        >
                          {org.logoUrl ? (
                            <Image
                              src={org.logoUrl}
                              alt={org.name}
                              width={16}
                              height={16}
                              unoptimized={shouldBypassImageOptimization(org.logoUrl)}
                              className="w-4 h-4 object-contain rounded-full filter drop-shadow shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Building2 className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>{org.name}</span>
                          {org.tag && <span className="opacity-70 text-[10px]">[{org.tag}]</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* COMPETENCIAS */}
              {!hideCompFilter && (
                <div className="classification-filter-section font-mono">
                  <div className="classification-filter-label">
                    <span className="flex min-w-0 items-center gap-2">
                    <Trophy className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span className="truncate">
                      {targetTeamName 
                        ? 'Competencias en disputa'
                        : selectedOrgName === 'TODAS' ? 'Competencias' : `Competencias de ${selectedOrgName}`}
                    </span>
                    </span>
                    <span className="classification-filter-count">{tournaments.length}</span>
                  </div>
                  
                  {tournaments.length > 0 && (
                    <div className="game-filter-options mobile-scroll-row flex items-center gap-2 overflow-x-auto pb-1">
                      <button
                        type="button"
                        aria-pressed={selectedTournName === 'TODAS'}
                        onClick={() => handleSelectTournament('TODAS')}
                        className={`classification-filter-chip px-3.5 py-1.5 text-xs font-bold transition-all border flex items-center gap-2 ${
                          selectedTournName === 'TODAS'
                            ? 'shadow-md font-black'
                            : 'bg-[var(--bg-card)] border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                        }`}
                        style={
                          selectedTournName === 'TODAS'
                            ? {
                                backgroundColor: `color-mix(in srgb, ${brandColor} 20%, transparent)`,
                                borderColor: brandColor,
                                color: brandColor,
                                boxShadow: `0 0 15px color-mix(in srgb, ${brandColor} 30%, transparent)`,
                              }
                            : undefined
                        }
                      >
                        <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>TODAS</span>
                      </button>
                    {tournaments.map((comp) => {
                      const isActive = selectedTournName.toUpperCase() === comp.name.toUpperCase();
                      return (
                        <button
                          type="button"
                          aria-pressed={isActive}
                          key={comp.id}
                          onClick={() => handleSelectTournament(comp.name)}
                          className={`classification-filter-chip px-3.5 py-1.5 text-xs font-bold transition-all border flex items-center gap-2 ${
                            isActive
                              ? 'shadow-md font-black'
                              : 'bg-[var(--bg-card)] border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                          }`}
                          style={
                            isActive
                              ? {
                                  backgroundColor: `color-mix(in srgb, ${brandColor} 20%, transparent)`,
                                  borderColor: brandColor,
                                  color: brandColor,
                                  boxShadow: `0 0 15px color-mix(in srgb, ${brandColor} 30%, transparent)`,
                                }
                              : undefined
                          }
                        >
                          {comp.logoUrl ? (
                            <Image
                              src={comp.logoUrl}
                              alt={comp.name}
                              width={16}
                              height={16}
                              unoptimized={shouldBypassImageOptimization(comp.logoUrl)}
                              className="w-4 h-4 object-contain rounded-full filter drop-shadow shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                          <span>{comp.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  )}
                </div>
              )}
              </div>
            </div>
          )}

      {/* ── 3. CONTENIDO PRINCIPAL (Sincronizado) ─────────────────────────────── */}
        <div className="space-y-8 pt-2 animate-fade-up">
          {Object.keys(groupedTournaments).length === 0 ? (
            
            /* EMPTY STATE */
            <div className="p-12 text-center rounded-3xl glass-panel border border-[var(--border-card)] space-y-4">
              <BarChart2 className="w-12 h-12 mx-auto text-[var(--text-muted)] opacity-60" />
              <h3 className="text-xl font-bold font-display text-[var(--text-heading)]">
                {emptyState.title}
              </h3>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                {emptyState.desc}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  handleSelectOrganization('TODAS');
                }}
                className="text-xs gap-1.5 mt-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restablecer Filtros
              </Button>
            </div>
          ) : (
            
            /* STANDINGS POR ORGANIZACIÓN -> COMPETENCIA */
            Object.entries(groupedTournaments).map(([circuitName, comps]) => (
              <div key={circuitName} className="space-y-6">
                
                {/* Header de la Organización */}
                <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-6 h-6" style={{ color: brandColor }} />
                    <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[var(--text-heading)] tracking-wider uppercase">
                      {circuitName}
                    </h2>
                  </div>
                </div>

                {/* Sub-grupos por Competencia */}
                {comps.map((compInfo) => {
                  const compName = compInfo.name;
                  const formatType = compInfo.formatType || 'LIGA';
                  
                  // Filter matches for this tournament
                  const compMatches = allMatches.filter(m => 
                    (m.tournament_name || '').toLowerCase() === compName.toLowerCase() ||
                    m.competition_id === compInfo.id || 
                    m.competition_id === compInfo.id
                  );
                  
                  // Filter standings for this tournament
                  const teamList = standings.filter(t => 
                    t.competitionName.toLowerCase() === compName.toLowerCase()
                  );
                  const competitionTeamCount = new Set(
                    compMatches.flatMap((match) => [match.home_team_name, match.away_team_name])
                      .filter((name) => name && !name.toLowerCase().includes('definir')),
                  ).size;
                  const playoffRoundPattern = /dieciseisavos|octavos|cuartos|semifinal|tercer|final/i;
                  const leaguePhaseMatches = compMatches.filter((match) =>
                    !playoffRoundPattern.test(match.round_name || '') &&
                    !(match.group_name || '').toUpperCase().includes('PLAYOFF'),
                  );
                  const completedLeagueMatches = leaguePhaseMatches.filter((match) => isFinalizedMatchStatus(match.status));
                  const leaguePhaseComplete = leaguePhaseMatches.length > 0 && completedLeagueMatches.length === leaguePhaseMatches.length;
                  const playoffMatches = compMatches.filter((match) =>
                    playoffRoundPattern.test(match.round_name || '') ||
                    (match.group_name || '').toUpperCase().includes('PLAYOFF'),
                  );
                  const activePhase = activeTabs[compName] || 'LIGA';

                  return (
                    <div key={compName} className="classification-competition space-y-3">
                    
                    {/* Header de Competencia */}
                    <div className="classification-competition-heading">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="classification-competition-icon">
                          <Trophy className="w-4 h-4" />
                        </div>
                        <span className="classification-competition-copy">
                          <strong>{compName}</strong>
                          <small>{formatType === 'PLAYOFF' ? 'Eliminación directa' : formatType === 'HIBRIDO' ? 'Liga + fase eliminatoria' : 'Todos contra todos'}</small>
                        </span>
                      </div>
                      <div className="classification-competition-badges">
                        <Badge variant={formatType === 'PLAYOFF' ? 'violet' : formatType === 'HIBRIDO' ? 'cyan' : 'gold'}>{formatType}</Badge>
                        <Badge variant="slate">{Math.max(teamList.length, competitionTeamCount)} equipos</Badge>
                      </div>
                    </div>

                    {/* TABS PARA HIBRIDO */}
                    {formatType === 'HIBRIDO' && (
                      <div className="classification-phase-switch" role="tablist" aria-label={`Fases de ${compName}`}>
                        <button
                          type="button"
                          role="tab"
                          aria-selected={activePhase === 'LIGA'}
                          onClick={() => setActiveTabs(prev => ({ ...prev, [compName]: 'LIGA' }))}
                          className={activePhase === 'LIGA' ? 'is-active' : ''}
                        >
                          <ListOrdered /><span><strong>Fase de liga</strong><small>{completedLeagueMatches.length}/{leaguePhaseMatches.length} partidos</small></span>
                        </button>
                        <button
                          type="button"
                          role="tab"
                          aria-selected={activePhase === 'PLAYOFF'}
                          onClick={() => setActiveTabs(prev => ({ ...prev, [compName]: 'PLAYOFF' }))}
                          className={activePhase === 'PLAYOFF' ? 'is-active' : ''}
                        >
                          <GitBranch /><span><strong>Playoff</strong><small>{leaguePhaseComplete ? 'Cruces habilitados' : 'Proyección de cruces'}</small></span>
                        </button>
                        <div className={`classification-phase-status ${leaguePhaseComplete ? 'is-ready' : ''}`}>
                          {leaguePhaseComplete ? <CheckCircle2 /> : <Clock3 />}
                          <span>{leaguePhaseComplete ? 'Liga completada · fase final disponible' : 'La fase final se completa al cerrar la liga'}</span>
                        </div>
                      </div>
                    )}

                    {/* RENDERIZADO CONDICIONAL */}
                    {formatType === 'PLAYOFF' || (formatType === 'HIBRIDO' && activePhase === 'PLAYOFF') ? (
                      <div className="classification-bracket-shell">
                        <PlayoffBracket matches={playoffMatches} brandColor={brandColor} matchMode={compInfo.matchMode} />
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {(() => {
                          const groupsObj: Record<string, typeof teamList> = {};
                          teamList.forEach(t => {
                            if (!groupsObj[t.groupName]) groupsObj[t.groupName] = [];
                            groupsObj[t.groupName].push(t);
                          });
                          
                          // Sort groups alphabetically (Grupo A, Grupo B, etc.)
                          const sortedGroups = Object.entries(groupsObj).sort((a, b) => a[0].localeCompare(b[0]));

                          return sortedGroups.map(([gName, gTeams]) => (
                            <LeagueStandingsTable
                              key={gName}
                              teams={gTeams}
                              brandColor={brandColor}
                              groupName={sortedGroups.length > 1 ? gName : undefined}
                              qualifiedCount={formatType === 'HIBRIDO' ? compInfo.qualifiersPerGroup || 2 : 0}
                            />
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            ))
          )}
        </div>
        </>
      )}
    </div>
  );
}
