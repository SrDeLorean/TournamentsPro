'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Search, Building2, Trophy, RefreshCw, BarChart2 } from 'lucide-react';
import { GameConfig } from '@/lib/games-data';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { TacticalLoadingSkeleton } from './tactical-loading-skeleton';
import { PlayoffBracket } from './playoff-bracket';
import { getOrganizationsWithStatsAction } from '@/app/actions/organizations';
import { shouldBypassImageOptimization } from '@/lib/image-utils';

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

interface OrgItem {
  id: string | number;
  name: string;
  tag?: string;
  gameSlugs?: string[];
  logoUrl?: string;
}

interface TournItem {
  id: string | number;
  name: string;
  gameSlug?: string;
  organizationName?: string;
  formatType?: string;
  logoUrl?: string;
}

interface TeamStanding {
  name: string;
  tag: string;
  pj: number; // Partidos Jugados
  g: number;  // Ganados
  e: number;  // Empatados
  p: number;  // Perdidos
  gf: number; // Goles a Favor
  gc: number; // Goles en Contra
  dif: number; // Diferencia (GF - GC)
  pts: number; // Puntos
  circuitName: string;
  competitionName: string;
  groupName: string;
}

interface ClassificationMatch {
  id: string | number;
  home_team_name: string;
  home_team_tag: string;
  away_team_name: string;
  away_team_tag: string;
  score_home: number | null;
  score_away: number | null;
  status: string;
  round_name: string;
  tournament_name?: string;
  tournament_id?: string | number;
  competition_id?: string | number;
  organization_name?: string;
  group_name?: string;
  matchday?: number;
}

interface TournamentApiItem {
  id: string | number;
  name: string;
  organization_name?: string;
  format_type?: string;
  format?: string;
  logo_url?: string;
  logoUrl?: string;
  banner_url?: string;
  bannerUrl?: string;
}

interface OrganizationApiItem {
  id: string | number;
  name: string;
  tag?: string;
  logo_url?: string | null;
  logoUrl?: string | null;
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
  const [organizations, setOrganizations] = useState<OrgItem[]>([]);
  const [tournaments, setTournaments] = useState<TournItem[]>([]);
  
  const [selectedOrgName, setSelectedOrgName] = useState(initialOrgName || 'TODAS');
  const [selectedTournName, setSelectedTournName] = useState(initialTournName || 'TODAS');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [allMatches, setAllMatches] = useState<ClassificationMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
        const standingsMap = new Map<string, TeamStanding>();

        matches.forEach((m) => {
          const homeName = m.home_team_name || 'Equipo Local';
          const homeTag = m.home_team_tag || 'LOC';
          const awayName = m.away_team_name || 'Equipo Visitante';
          const awayTag = m.away_team_tag || 'VIS';
          
          const scoreHome = m.score_home !== null && m.score_home !== undefined ? Number(m.score_home) : null;
          const scoreAway = m.score_away !== null && m.score_away !== undefined ? Number(m.score_away) : null;
          
          const compName = m.tournament_name || 'Competencia BD';
          const circName = m.organization_name || 'Organización Oficial BD';
          const groupName = m.group_name || 'GENERAL';

          // Skip playoff rounds from the standings table
          const rNameLower = (m.round_name || '').toLowerCase();
          const isPlayoffRound = ['octavos', 'cuartos', 'semifinal', 'tercer', 'final', 'dieciseisavos'].some(key => rNameLower.includes(key));
          if (isPlayoffRound) return;

          const homeKey = `${circName}_${compName}_${groupName}_${homeName}`;
          const awayKey = `${circName}_${compName}_${groupName}_${awayName}`;

          // Inicializar equipos si no existen (así aparecen con 0pts aunque no hayan jugado)
          if (!standingsMap.has(homeKey)) {
            standingsMap.set(homeKey, { name: homeName, tag: homeTag, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dif: 0, pts: 0, circuitName: circName, competitionName: compName, groupName });
          }
          if (!standingsMap.has(awayKey)) {
            standingsMap.set(awayKey, { name: awayName, tag: awayTag, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dif: 0, pts: 0, circuitName: circName, competitionName: compName, groupName });
          }

          // Solo sumar puntos y goles si el partido finalizó y tiene resultado válido
          if (m.status !== 'FINALIZADO' || scoreHome === null || scoreAway === null) return;
          
          const hStats = standingsMap.get(homeKey)!;
          const aStats = standingsMap.get(awayKey)!;

          // Actualizar Local
          hStats.pj += 1;
          hStats.gf += scoreHome;
          hStats.gc += scoreAway;
          hStats.dif = hStats.gf - hStats.gc;

          // Actualizar Visitante
          aStats.pj += 1;
          aStats.gf += scoreAway;
          aStats.gc += scoreHome;
          aStats.dif = aStats.gf - aStats.gc;

          // Puntos y G/E/P
          if (scoreHome > scoreAway) {
            hStats.g += 1;
            hStats.pts += 3;
            aStats.p += 1;
          } else if (scoreHome < scoreAway) {
            aStats.g += 1;
            aStats.pts += 3;
            hStats.p += 1;
          } else {
            hStats.e += 1;
            hStats.pts += 1;
            aStats.e += 1;
            aStats.pts += 1;
          }
        });

        // Convertir Map a Array y Ordenar
        const standingsArray = Array.from(standingsMap.values()).sort((a, b) => {
          if (b.pts !== a.pts) return b.pts - a.pts; // Mayor puntaje
          if (b.dif !== a.dif) return b.dif - a.dif; // Mayor diferencia de gol
          return b.gf - a.gf; // Mayor goles a favor
        });

        setStandings(standingsArray);
      } else {
        setStandings([]);
      }
    } catch (err) {
      console.error('Error fetching standings matches:', err);
      setStandings([]);
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

  // Handlers
  const handleSelectOrganization = (orgName: string) => {
    setSelectedOrgName(orgName);
    setSelectedTournName('TODAS');
    fetchTournamentsFromDB(orgName);
    fetchAndCalculateStandings(orgName, 'TODAS', searchQuery);
  };

  const handleSelectTournament = (tournName: string) => {
    setSelectedTournName(tournName);
    fetchAndCalculateStandings(selectedOrgName, tournName, searchQuery);
  };

  // Agrupar Clasificaciones por Organización -> Competencia (Usando tournaments base con fallback a allMatches)
  const groupedTournaments = useMemo(() => {
    const map: Record<string, TournItem[]> = {};
    
    // Fallback: If API tournaments list is empty, build tournament items from allMatches
    let activeTournaments: TournItem[] = [...tournaments];
    // Fallback: If API tournaments list is empty and we are NOT filtering by a specific team, build tournament items from allMatches
    if (activeTournaments.length === 0 && allMatches.length > 0 && !targetTeamName) {
      const matchTourns = new Map<string, TournItem>();
      allMatches.forEach((m) => {
        const tName = m.tournament_name || 'Competencia BD';
        if (!matchTourns.has(tName)) {
          matchTourns.set(tName, {
            id: m.competition_id || m.tournament_id || tName,
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
    <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-16">
      
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
            <div className="bg-[var(--bg-card)] p-5 sm:p-6 rounded-3xl border border-[var(--border-card)] shadow-xl space-y-5 backdrop-blur-md">
              
              {/* BUSCADOR */}
              {!hideSearchFilter && (
                <div className="relative w-full">
                  <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <Input
                    placeholder="Buscar por equipo, organización o liga..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        fetchAndCalculateStandings(selectedOrgName, selectedTournName, searchQuery);
                      }
                    }}
                    className="pl-12 py-3.5 text-xs sm:text-sm input-theme rounded-2xl glass-panel shadow-md w-full placeholder:text-[var(--text-muted)]"
                  />
                </div>
              )}

              {/* ORGANIZACIONES */}
              {!hideOrgFilter && (
                <div className="space-y-2 pt-1 font-mono">
                  <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
                    <Building2 className="w-3.5 h-3.5" style={{ color: brandColor }} />
                    <span>ORGANIZACIONES DISPONIBLES EN BD</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleSelectOrganization('TODAS')}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-2 ${
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
                          key={org.id}
                          onClick={() => handleSelectOrganization(org.name)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-2 ${
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
                <div className="space-y-2 pt-1 font-mono">
                  <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {targetTeamName 
                        ? 'COMPETENCIAS / TORNEOS EN DISPUTA' 
                        : `COMPETENCIAS / TORNEOS DE ${selectedOrgName.toUpperCase()}`}
                    </span>
                  </div>
                  
                  {tournaments.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleSelectTournament('TODAS')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-2 ${
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
                          key={comp.id}
                          onClick={() => handleSelectTournament(comp.name)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-2 ${
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
                    m.tournament_id === compInfo.id
                  );
                  
                  // Filter standings for this tournament
                  const teamList = standings.filter(t => 
                    t.competitionName.toLowerCase() === compName.toLowerCase()
                  );

                  return (
                    <div key={compName} className="space-y-3">
                    
                    {/* Header de Competencia */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl shadow-sm mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                          <Trophy className="w-4 h-4" />
                        </div>
                        <span className="font-black uppercase text-[var(--text-heading)] tracking-wider text-sm">
                          {compName}
                        </span>
                      </div>
                      <Badge variant="cyan" className="text-[10px] px-2.5 py-0.5 opacity-80">
                        {teamList.length} EQUIPOS
                      </Badge>
                    </div>

                    {/* TABS PARA HIBRIDO */}
                    {formatType === 'HIBRIDO' && (
                      <div className="flex items-center gap-2 mb-4 bg-[var(--bg-card)] border border-[var(--border-card)] p-1 rounded-xl w-fit">
                        <button
                          onClick={() => setActiveTabs(prev => ({ ...prev, [compName]: 'LIGA' }))}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeTabs[compName] !== 'PLAYOFF' ? 'bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                        >
                          Fase de Grupos
                        </button>
                        <button
                          onClick={() => setActiveTabs(prev => ({ ...prev, [compName]: 'PLAYOFF' }))}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeTabs[compName] === 'PLAYOFF' ? 'bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                        >
                          Fase Final
                        </button>
                      </div>
                    )}

                    {/* RENDERIZADO CONDICIONAL */}
                    {formatType === 'PLAYOFF' || (formatType === 'HIBRIDO' && activeTabs[compName] === 'PLAYOFF') ? (
                      <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-4 shadow-xl">
                        <PlayoffBracket matches={compMatches} brandColor={brandColor} />
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
                            <div key={gName} className="w-full overflow-x-auto rounded-2xl border border-[var(--border-card)] glass-panel shadow-xl">
                              {sortedGroups.length > 1 && (
                                <div className="px-4 py-3 bg-[var(--bg-card)] border-b border-[var(--border-card)] text-sm font-black uppercase text-[var(--accent-cyan)] tracking-wider">
                                  {gName}
                                </div>
                              )}
                              <table className="w-full text-left border-collapse min-w-[720px]">
                                <thead>
                                  <tr className="bg-[var(--bg-card)] border-b border-[var(--border-card)] text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider">
                                    <th className="p-3.5 w-16 text-center">Pos</th>
                                    <th className="p-3.5 text-left text-[var(--accent-cyan)]">Club / Equipo</th>
                                    <th className="p-3.5 w-12 text-center" title="Partidos Jugados">PJ</th>
                                    <th className="p-3.5 w-12 text-center text-emerald-400" title="Ganados">G</th>
                                    <th className="p-3.5 w-12 text-center text-amber-400" title="Empatados">E</th>
                                    <th className="p-3.5 w-12 text-center text-rose-400" title="Perdidos">P</th>
                                    <th className="p-3.5 w-12 text-center" title="Goles a Favor">GF</th>
                                    <th className="p-3.5 w-12 text-center" title="Goles en Contra">GC</th>
                                    <th className="p-3.5 w-12 text-center" title="Diferencia de Goles">DIF</th>
                                    <th className="p-3.5 w-16 text-center text-[var(--accent-cyan)] text-xs">PTS</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-card)] text-xs">
                                  {gTeams.map((team, index) => {
                                    const position = index + 1;
                                    let posStyles = 'text-[var(--text-secondary)] font-bold';
                                    if (position === 1) posStyles = 'text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded px-1.5 py-0.5 shadow-sm';
                                    else if (position === 2) posStyles = 'text-[var(--text-primary)] bg-[var(--bg-main)] border border-[var(--border-card)] rounded px-1.5 py-0.5';
                                    else if (position === 3) posStyles = 'text-orange-500 bg-orange-500/10 border border-orange-500/30 rounded px-1.5 py-0.5';
                                    
                                    const isBottom = position > gTeams.length - 3 && gTeams.length > 5;

                                    return (
                                      <tr key={team.name} className={`hover:bg-[var(--bg-card-hover)] transition-colors group ${isBottom ? 'opacity-80' : ''}`}>
                                        <td className="p-3.5 text-center">
                                          <span className={posStyles}>{position}</span>
                                        </td>
                                        <td className="p-3.5">
                                          <div className="flex items-center gap-3">
                                            <Avatar fallback={team.tag} size="sm" className="ring-1 ring-[var(--border-card)] shrink-0" />
                                            <span
                                              className={`font-extrabold font-display text-sm truncate max-w-[200px] transition-colors group-hover:text-[var(--team-hover)] ${position <= 3 ? 'text-[var(--text-primary)]' : 'text-[var(--text-heading)]'}`}
                                              style={{ '--team-hover': brandColor } as React.CSSProperties & Record<'--team-hover', string>}
                                            >
                                              {team.name}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="p-3.5 text-center font-bold text-[var(--text-secondary)]">{team.pj}</td>
                                        <td className="p-3.5 text-center font-black text-emerald-400/80">{team.g}</td>
                                        <td className="p-3.5 text-center font-bold text-amber-400/80">{team.e}</td>
                                        <td className="p-3.5 text-center font-bold text-rose-400/80">{team.p}</td>
                                        <td className="p-3.5 text-center font-semibold text-[var(--text-muted)]">{team.gf}</td>
                                        <td className="p-3.5 text-center font-semibold text-[var(--text-muted)]">{team.gc}</td>
                                        <td className="p-3.5 text-center font-black">
                                          <span className={team.dif > 0 ? 'text-emerald-400' : team.dif < 0 ? 'text-rose-400' : 'text-[var(--text-muted)]'}>
                                            {team.dif > 0 ? `+${team.dif}` : team.dif}
                                          </span>
                                        </td>
                                        <td className="p-3.5 text-center">
                                          <span className="px-2 py-1 bg-[var(--bg-main)] border border-[var(--border-card)] rounded font-black text-sm shadow-sm transition-colors" style={{ color: brandColor }}>
                                            {team.pts}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
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
