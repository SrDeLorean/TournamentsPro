'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GameConfig } from '@/lib/games-data';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { CountryFlag } from '@/components/ui/country-flag';
import {
  Trophy,
  Award,
  Building2,
  Flame,
  Shield,
  Layers,
  ChevronRight,
  Zap,
} from 'lucide-react';

interface StandingsViewProps {
  game: GameConfig;
}

export interface StandingTeamRow {
  rank: number;
  teamId?: string;
  teamName: string;
  teamTag: string;
  countryCode?: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dif: number;
  pts: number;
  form: ('W' | 'D' | 'L')[];
  groupName?: string;
  statusZone?: 'CHAMPION' | 'QUALIFIED' | 'NEUTRAL' | 'RELEGATED';
}

export interface BracketMatch {
  id: string;
  round: 'CUARTOS' | 'SEMIFINAL' | 'FINAL' | 'TERCER_LUGAR';
  title: string;
  homeTeam: string;
  homeTag: string;
  awayTeam: string;
  awayTag: string;
  homeScore: number | null;
  awayScore: number | null;
  winner?: 'home' | 'away' | null;
  status: 'PROGRAMADO' | 'EN_VIVO' | 'FINALIZADO';
  timeDisplay?: string;
}

interface TournamentOption {
  id: string;
  name: string;
  format: string;
  mode_format?: string;
  description?: string;
  organizationName: string;
  organization_name?: string;
}

interface StandingsMatch {
  id: string;
  organization_name?: string;
  tournament_name?: string;
  group_name?: string;
  round_name?: string;
  home_team_name?: string;
  home_team_tag?: string;
  away_team_name?: string;
  away_team_tag?: string;
  homeTeam?: string;
  awayTeam?: string;
  score_home?: number | string | null;
  score_away?: number | string | null;
  status?: string;
  scheduled_time?: string;
  transmission_time?: string;
}

interface OrganizationApiItem {
  id?: string;
  name: string;
  tag?: string;
}

interface TournamentApiItem {
  id: string;
  name: string;
  format?: string;
  mode_format?: string;
  organization_name?: string;
}

// Helper to filter out placeholder entries like "1° de Grupo B", "Por Definir", "TBD"
function isPlaceholderTeam(name?: string): boolean {
  if (!name) return true;
  const lower = name.toLowerCase().trim();
  if (
    lower.includes('grupo') ||
    lower.includes('definir') ||
    lower === 'tbd' ||
    lower.includes('por definir') ||
    lower.match(/^\d+°/) ||
    lower.match(/^\d+st/) ||
    lower.match(/^\d+nd/) ||
    lower.match(/^\d+rd/) ||
    lower.match(/^\d+th/)
  ) {
    return true;
  }
  return false;
}

export function StandingsView({ game }: StandingsViewProps) {
  const brandColor = game.brandColor || '#077D7E';

  // Real Database Filters State
  const [organizations, setOrganizations] = useState<{ id: string; name: string; tag: string }[]>([]);
  const [tournaments, setTournaments] = useState<TournamentOption[]>([]);
  const [selectedOrgName, setSelectedOrgName] = useState<string>('TODAS');
  const [selectedTournName, setSelectedTournName] = useState<string>('');

  // Real Database Loaded Data
  const [dbMatches, setDbMatches] = useState<StandingsMatch[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  // Active Sub-tab for Hybrid view (Grupos vs Playoff)
  const [hybridTab, setHybridTab] = useState<'GRUPOS' | 'PLAYOFF'>('GRUPOS');

  // Helper for uppercase tag
  function UPPER_TAG(str?: string) {
    if (!str) return 'TPG';
    return str.substring(0, 3).toUpperCase();
  }

  // 1. Fetch Real Organizations from DB
  const fetchOrganizations = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/organizations');
      const data = await res.json();
      const raw = data.organizations || data.data || (Array.isArray(data) ? data : []);
      if (Array.isArray(raw)) {
        return (raw as OrganizationApiItem[]).map((o) => ({
          id: o.id || o.name,
          name: o.name,
          tag: o.tag || UPPER_TAG(o.name),
        }));
      }
    } catch (e) {
      console.error('Error fetching orgs:', e);
    }
    return [];
  }, []);

  // 2. Fetch Real Tournaments from DB
  const fetchTournaments = useCallback(
    async (orgName: string) => {
      try {
        let url = `/api/tournaments?gameSlug=${game.slug}`;
        if (orgName !== 'TODAS') {
          url += `&organizationName=${encodeURIComponent(orgName)}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        const raw = data.tournaments || data.competitions || data.data || (Array.isArray(data) ? data : []);
        if (Array.isArray(raw)) {
          return (raw as TournamentApiItem[]).map((t) => ({
            id: t.id,
            name: t.name,
            format: (t.format || t.mode_format || 'LIGA').toUpperCase(),
            organizationName: t.organization_name || orgName,
          }));
        }
      } catch (e) {
        console.error('Error fetching tournaments:', e);
      }
      return [];
    },
    [game.slug]
  );

  // 3. Fetch Real Matches from DB
  const fetchDbMatches = useCallback(async (orgName: string, tournName: string) => {
    setIsLoadingMatches(true);
    try {
      let url = `/api/matches?gameSlug=${game.slug}`;
      if (orgName !== 'TODAS') url += `&organizationName=${encodeURIComponent(orgName)}`;
      if (tournName !== 'TODAS' && tournName !== '') url += `&tournamentName=${encodeURIComponent(tournName)}`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.matches)) {
        setDbMatches(data.matches);
      } else {
        setDbMatches([]);
      }
    } catch (e) {
      console.error('Error fetching db matches for standings:', e);
      setDbMatches([]);
    } finally {
      setIsLoadingMatches(false);
    }
  }, [game.slug]);

  useEffect(() => {
    let isMounted = true;
    
    const initData = async () => {
      setIsInitialLoading(true);
      const [orgs, tourns] = await Promise.all([
        fetchOrganizations(),
        fetchTournaments('TODAS')
      ]);
      
      if (isMounted) {
        setOrganizations(orgs);
        setTournaments(tourns);
        
        // Auto-select first tournament if available
        let initialTournName = 'TODAS';
        if (tourns.length > 0) {
          initialTournName = tourns[0].name;
          setSelectedTournName(initialTournName);
        }
        
        await fetchDbMatches('TODAS', initialTournName);
        setIsInitialLoading(false);
      }
    };
    
    initData();
    
    return () => { isMounted = false; };
  }, [fetchOrganizations, fetchTournaments, fetchDbMatches]);

  // Derive available orgs (API + matches fallback)
  const availableOrgs = useMemo(() => {
    const map = new Map<string, { id: string; name: string; tag: string }>();
    organizations.forEach((o) => {
      if (o.name) map.set(o.name.toUpperCase(), o);
    });
    dbMatches.forEach((m) => {
      if (m.organization_name && !map.has(m.organization_name.toUpperCase())) {
        map.set(m.organization_name.toUpperCase(), {
          id: `org-${m.organization_name}`,
          name: m.organization_name,
          tag: m.organization_name.slice(0, 3).toUpperCase(),
        });
      }
    });
    return Array.from(map.values());
  }, [organizations, dbMatches]);

  // Derive available tournaments (API + matches fallback)
  const availableTournaments = useMemo(() => {
    const map = new Map<string, TournamentOption>();
    tournaments.forEach((t) => {
      if (selectedOrgName === 'TODAS' || (t.organizationName && t.organizationName.toUpperCase() === selectedOrgName.toUpperCase())) {
        map.set(t.name.toUpperCase(), t);
      }
    });
    dbMatches.forEach((m) => {
      if (m.tournament_name && !map.has(m.tournament_name.toUpperCase())) {
        map.set(m.tournament_name.toUpperCase(), {
          id: `t-${m.tournament_name}`,
          name: m.tournament_name,
          format: m.group_name && m.group_name.toUpperCase().includes('GRUPO') ? 'HIBRIDO' : 'LIGA',
          organizationName: m.organization_name || selectedOrgName,
        });
      }
    });
    return Array.from(map.values());
  }, [tournaments, dbMatches, selectedOrgName]);

  // Determine current active tournament format
  const activeTournamentObj = useMemo(() => {
    if (selectedTournName !== 'TODAS') {
      const found = availableTournaments.find((t) => t.name.toUpperCase() === selectedTournName.toUpperCase());
      if (found) return found;
    }
    return availableTournaments[0] || { name: 'Competencia BD', format: 'LIGA' };
  }, [availableTournaments, selectedTournName]);

  // 100% AUTOMATIC FORMAT DETECTION FROM DB RULES AND MATCHES
  const currentFormat = useMemo(() => {
    const fmt = (activeTournamentObj?.format || '').toUpperCase();
    const modeFmt = (activeTournamentObj?.mode_format || '').toUpperCase();
    const nameStr = (activeTournamentObj?.name || '').toUpperCase();
    const descStr = (activeTournamentObj?.description || '').toUpperCase();

    const combined = `${fmt} ${modeFmt} ${nameStr} ${descStr}`;

    const hasGroupMatches = dbMatches.some(
      (m) => m.group_name && m.group_name.toUpperCase().includes('GRUPO')
    );
    const hasPlayoffMatches = dbMatches.some(
      (m) =>
        (m.group_name && m.group_name.toUpperCase().includes('PLAYOFF')) ||
        (m.round_name &&
          (m.round_name.toUpperCase().includes('SEMIFINAL') ||
            m.round_name.toUpperCase().includes('FINAL') ||
            m.round_name.toUpperCase().includes('TERCER')))
    );

    // If matches contain both group stage matches and playoff matches, it is ALWAYS HIBRIDO!
    if (hasGroupMatches && hasPlayoffMatches) return 'HIBRIDO';

    if (
      combined.includes('HIBRID') ||
      combined.includes('HÍBRID') ||
      combined.includes('GRUPO') ||
      combined.includes('FASE') ||
      hasGroupMatches
    ) {
      return 'HIBRIDO';
    }

    if (
      combined.includes('PLAYOFF') ||
      combined.includes('ELIMINATORIA') ||
      combined.includes('BRACKET') ||
      hasPlayoffMatches
    ) {
      return 'PLAYOFF';
    }

    return 'LIGA';
  }, [activeTournamentObj, dbMatches]);

  // Compute Real League Standings Table strictly filtering out placeholders
  const leagueStandings: StandingTeamRow[] = useMemo(() => {
    const teamsMap = new Map<string, StandingTeamRow>();

    // Load teams from matches unconditionally
    dbMatches.forEach((m) => {
      const homeName = (m.home_team_name || m.homeTeam || '').trim();
      const awayName = (m.away_team_name || m.awayTeam || '').trim();

      if (homeName && !isPlaceholderTeam(homeName) && !teamsMap.has(homeName.toUpperCase())) {
        teamsMap.set(homeName.toUpperCase(), {
          rank: 0,
          teamName: homeName,
          teamTag: m.home_team_tag || homeName.slice(0, 3).toUpperCase(),
          countryCode: 'cl',
          pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0, pts: 0, form: [], statusZone: 'NEUTRAL',
        });
      }

      if (awayName && !isPlaceholderTeam(awayName) && !teamsMap.has(awayName.toUpperCase())) {
        teamsMap.set(awayName.toUpperCase(), {
          rank: 0,
          teamName: awayName,
          teamTag: m.away_team_tag || awayName.slice(0, 3).toUpperCase(),
          countryCode: 'cl',
          pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0, pts: 0, form: [], statusZone: 'NEUTRAL',
        });
      }
    });

    // Tally match results
    dbMatches.forEach((m) => {
      const homeName = (m.home_team_name || m.homeTeam || '').trim();
      const awayName = (m.away_team_name || m.awayTeam || '').trim();

      const homeObj = teamsMap.get(homeName.toUpperCase());
      const awayObj = teamsMap.get(awayName.toUpperCase());

      if (m.status === 'FINALIZADO' && m.score_home !== null && m.score_away !== null) {
        const hs = Number(m.score_home);
        const as = Number(m.score_away);

        if (homeObj) {
          homeObj.pj += 1; homeObj.gf += hs; homeObj.gc += as;
          if (hs > as) { homeObj.pg += 1; homeObj.pts += 3; homeObj.form.unshift('W'); }
          else if (hs === as) { homeObj.pe += 1; homeObj.pts += 1; homeObj.form.unshift('D'); }
          else { homeObj.pp += 1; homeObj.form.unshift('L'); }
        }

        if (awayObj) {
          awayObj.pj += 1; awayObj.gf += as; awayObj.gc += hs;
          if (as > hs) { awayObj.pg += 1; awayObj.pts += 3; awayObj.form.unshift('W'); }
          else if (as === hs) { awayObj.pe += 1; awayObj.pts += 1; awayObj.form.unshift('D'); }
          else { awayObj.pp += 1; awayObj.form.unshift('L'); }
        }
      }
    });

    const list = Array.from(teamsMap.values()).map((row) => {
      row.dif = row.gf - row.gc;
      row.form = row.form.slice(0, 5);
      return row;
    });

    list.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.dif !== a.dif) return b.dif - a.dif;
      return b.gf - a.gf;
    });

    return list.map((row, idx) => {
      row.rank = idx + 1;
      if (idx === 0) row.statusZone = 'CHAMPION';
      else if (idx < 4) row.statusZone = 'QUALIFIED';
      else if (idx >= list.length - 2 && list.length > 4) row.statusZone = 'RELEGATED';
      else row.statusZone = 'NEUTRAL';
      return row;
    });
  }, [dbMatches]);

  // Compute Real Group Standings dynamically grouped by m.group_name or split into Grupo A & B
  const groupStandingsMap = useMemo(() => {
    const groups: { [gName: string]: StandingTeamRow[] } = {};

    // Collect all group names from matches
    dbMatches.forEach((m) => {
      const gName = (m.group_name || '').trim().toUpperCase();
      if (gName && gName !== 'LIGA' && gName !== 'PLAYOFF') {
        if (!groups[gName]) groups[gName] = [];
      }
    });

    if (Object.keys(groups).length > 0) {
      Object.keys(groups).forEach((gName) => {
        const groupMatches = dbMatches.filter(
          (m) => m.group_name && m.group_name.toUpperCase() === gName
        );
        const teamMap = new Map<string, StandingTeamRow>();

        groupMatches.forEach((m) => {
          const homeName = (m.home_team_name || m.homeTeam || '').trim();
          const awayName = (m.away_team_name || m.awayTeam || '').trim();

          if (homeName && !isPlaceholderTeam(homeName) && !teamMap.has(homeName.toUpperCase())) {
            teamMap.set(homeName.toUpperCase(), {
              rank: 0, teamName: homeName, teamTag: m.home_team_tag || homeName.slice(0, 3).toUpperCase(), groupName: gName,
              pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0, pts: 0, form: [], statusZone: 'NEUTRAL',
            });
          }

          if (awayName && !isPlaceholderTeam(awayName) && !teamMap.has(awayName.toUpperCase())) {
            teamMap.set(awayName.toUpperCase(), {
              rank: 0, teamName: awayName, teamTag: m.away_team_tag || awayName.slice(0, 3).toUpperCase(), groupName: gName,
              pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0, pts: 0, form: [], statusZone: 'NEUTRAL',
            });
          }

          if (m.status === 'FINALIZADO' && m.score_home !== null && m.score_away !== null) {
            const hObj = teamMap.get(homeName.toUpperCase());
            const aObj = teamMap.get(awayName.toUpperCase());
            const hs = Number(m.score_home);
            const as = Number(m.score_away);

            if (hObj) {
              hObj.pj += 1; hObj.gf += hs; hObj.gc += as;
              if (hs > as) { hObj.pg += 1; hObj.pts += 3; hObj.form.unshift('W'); }
              else if (hs === as) { hObj.pe += 1; hObj.pts += 1; hObj.form.unshift('D'); }
              else { hObj.pp += 1; hObj.form.unshift('L'); }
            }

            if (aObj) {
              aObj.pj += 1; aObj.gf += as; aObj.gc += hs;
              if (as > hs) { aObj.pg += 1; aObj.pts += 3; aObj.form.unshift('W'); }
              else if (as === hs) { aObj.pe += 1; aObj.pts += 1; aObj.form.unshift('D'); }
              else { aObj.pp += 1; aObj.form.unshift('L'); }
            }
          }
        });

        const list = Array.from(teamMap.values()).map((row) => {
          row.dif = row.gf - row.gc;
          row.form = row.form.slice(0, 5);
          return row;
        });

        list.sort((a, b) => (b.pts !== a.pts ? b.pts - a.pts : b.dif !== a.dif ? b.dif - a.dif : b.gf - a.gf));

        groups[gName] = list.map((row, idx) => {
          row.rank = idx + 1;
          row.statusZone = idx < 2 ? 'QUALIFIED' : 'NEUTRAL';
          return row;
        });
      });

      return groups;
    }

    // Fallback if no explicit group_name in matches: Split leagueStandings teams into GRUPO A and GRUPO B
    const validTeams = leagueStandings.filter((t) => !isPlaceholderTeam(t.teamName));
    const half = Math.ceil(validTeams.length / 2);

    const groupA = validTeams.slice(0, half).map((t, idx) => ({ ...t, rank: idx + 1, groupName: 'GRUPO A', statusZone: idx < 2 ? ('QUALIFIED' as const) : ('NEUTRAL' as const) }));
    const groupB = validTeams.slice(half).map((t, idx) => ({ ...t, rank: idx + 1, groupName: 'GRUPO B', statusZone: idx < 2 ? ('QUALIFIED' as const) : ('NEUTRAL' as const) }));

    return {
      'GRUPO A': groupA,
      'GRUPO B': groupB,
    };
  }, [dbMatches, leagueStandings]);

  // Compute Real Brackets strictly from database matches (Separate Cuartos, Semis, Final & Tercer Lugar)
  const bracketMatches: BracketMatch[] = useMemo(() => {
    const playoffMatches = dbMatches.filter(
      (m) =>
        (m.group_name && m.group_name.toUpperCase().includes('PLAYOFF')) ||
        (m.round_name &&
          (m.round_name.toUpperCase().includes('CUARTO') ||
            m.round_name.toUpperCase().includes('SEMIFINAL') ||
            m.round_name.toUpperCase().includes('FINAL') ||
            m.round_name.toUpperCase().includes('TERCER') ||
            m.round_name.toUpperCase().includes('3ER')))
    );

    return playoffMatches.map((m) => {
      const rName = (m.round_name || '').toUpperCase();
      let roundType: 'CUARTOS' | 'SEMIFINAL' | 'FINAL' | 'TERCER_LUGAR' = 'SEMIFINAL';
      if (rName.includes('CUARTO') || rName.includes('QUARTER')) {
        roundType = 'CUARTOS';
      } else if (rName.includes('TERCER') || rName.includes('3ER') || rName.includes('BRONCE') || rName.includes('3º')) {
        roundType = 'TERCER_LUGAR';
      } else if (rName.includes('GRAN FINAL') || rName.includes('FINAL 🏆') || rName === 'FINAL' || rName.includes('FINAL (')) {
        roundType = 'FINAL';
      }

      const hScore = m.score_home !== null && m.score_home !== undefined ? Number(m.score_home) : null;
      const aScore = m.score_away !== null && m.score_away !== undefined ? Number(m.score_away) : null;
      let winner: 'home' | 'away' | null = null;
      if (hScore !== null && aScore !== null) {
        if (hScore > aScore) winner = 'home';
        else if (aScore > hScore) winner = 'away';
      }

      return {
        id: m.id,
        round: roundType,
        title: m.round_name || 'PARTIDO DE PLAYOFF',
        homeTeam: m.home_team_name || m.homeTeam || 'Por Definir',
        homeTag: m.home_team_tag || 'PO',
        awayTeam: m.away_team_name || m.awayTeam || 'Por Definir',
        awayTag: m.away_team_tag || 'PO',
        homeScore: hScore,
        awayScore: aScore,
        winner,
        status: m.status === 'FINALIZADO' ? 'FINALIZADO' : m.status === 'EN_VIVO' ? 'EN_VIVO' : 'PROGRAMADO',
        timeDisplay: m.scheduled_time ? `${m.scheduled_time} hrs` : (m.transmission_time || '20:00'),
      };
    });
  }, [dbMatches]);

  // Helper for rendering team slot in bracket cards
  const renderBracketTeamRow = (teamName: string, teamTag: string, score: number | null, isWinner?: boolean) => {
    const isPlaceholder = isPlaceholderTeam(teamName);
    return (
      <div
        className={`flex items-center justify-between text-xs font-bold p-2 rounded-xl transition-colors ${
          isWinner
            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
            : 'bg-slate-900/90 text-white border border-white/5'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {!isPlaceholder ? (
            <>
              <Avatar fallback={teamTag} size="sm" className="shrink-0" />
              <span className="truncate">{teamName}</span>
            </>
          ) : (
            <span className="text-slate-400 font-mono italic text-[11px] truncate">
              {teamName || 'Por Definir'}
            </span>
          )}
        </div>
        <span className="text-sm font-black font-mono shrink-0 ml-2">
          {score !== null ? score : '-'}
        </span>
      </div>
    );
  };

  // Helper for rendering a single Standings Table Component
  const renderStandingsTable = (items: StandingTeamRow[], title?: string) => {
    if (isLoadingMatches) {
      return (
        <div className="p-12 rounded-3xl glass-panel border border-[var(--border-card)] text-center text-slate-400 font-mono">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mb-2" />
          <p className="text-xs font-bold">Cargando clasificación desde la Base de Datos...</p>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="p-8 rounded-3xl glass-panel border border-[var(--border-card)] text-center space-y-2 font-mono">
          <Building2 className="w-8 h-8 text-slate-500 mx-auto" />
          <h4 className="text-sm font-bold text-white">Sin clubes o partidos en la Base de Datos</h4>
          <p className="text-xs text-slate-400">
            No existen registros de encuentros disputados para {title || 'esta competencia'} en la base de datos local.
          </p>
        </div>
      );
    }

    return (
      <div className="w-full space-y-3">
        {title && (
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300 uppercase tracking-widest px-1">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>{title}</span>
          </div>
        )}
        <div className="game-data-surface w-full overflow-x-auto rounded-2xl border border-[var(--border-card)] glass-panel shadow-xl">
          <table className="w-full text-left border-collapse min-w-[760px] font-mono">
            <thead>
              <tr className="bg-slate-950/90 border-b border-[var(--border-card)] text-[10px] font-black uppercase text-cyan-400 tracking-wider">
                <th className="p-3.5 text-center w-12">Pos</th>
                <th className="p-3.5">Club / Equipo BD</th>
                <th className="p-3.5 text-center w-12">PJ</th>
                <th className="p-3.5 text-center w-12">G</th>
                <th className="p-3.5 text-center w-12">E</th>
                <th className="p-3.5 text-center w-12">P</th>
                <th className="p-3.5 text-center w-14">GF</th>
                <th className="p-3.5 text-center w-14">GC</th>
                <th className="p-3.5 text-center w-14">DIF</th>
                <th className="p-3.5 text-center w-16 text-amber-400 font-extrabold">PTS</th>
                <th className="p-3.5 text-center w-28">Racha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {items.map((row) => {
                const isTop1 = row.rank === 1;
                const isTop4 = row.rank <= 4;
                return (
                  <tr
                    key={row.teamName}
                    className={`hover:bg-slate-900/60 transition-colors group ${
                      isTop1
                        ? 'bg-amber-500/5'
                        : isTop4
                        ? 'bg-cyan-500/5'
                        : ''
                    }`}
                  >
                    {/* POSICIÓN */}
                    <td className="p-3.5 text-center font-black">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          isTop1
                            ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-400/50'
                            : isTop4
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {row.rank}
                      </span>
                    </td>

                    {/* CLUB + AVATAR + BANDERA */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar fallback={row.teamTag} size="sm" className="ring-1 ring-white/10 shrink-0" />
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-extrabold text-xs sm:text-sm text-white group-hover:text-cyan-300 transition-colors truncate">
                            {row.teamName}
                          </span>
                          {row.countryCode && <CountryFlag code={row.countryCode} name={row.countryCode.toUpperCase()} size="sm" />}
                        </div>
                      </div>
                    </td>

                    {/* ESTADÍSTICAS REALES */}
                    <td className="p-3.5 text-center text-slate-300 font-bold">{row.pj}</td>
                    <td className="p-3.5 text-center text-emerald-400 font-bold">{row.pg}</td>
                    <td className="p-3.5 text-center text-amber-400 font-bold">{row.pe}</td>
                    <td className="p-3.5 text-center text-rose-400 font-bold">{row.pp}</td>
                    <td className="p-3.5 text-center text-slate-400">{row.gf}</td>
                    <td className="p-3.5 text-center text-slate-400">{row.gc}</td>
                    <td className="p-3.5 text-center font-bold text-slate-200">
                      {row.dif > 0 ? `+${row.dif}` : row.dif}
                    </td>

                    {/* PUNTOS */}
                    <td className="p-3.5 text-center font-black text-sm text-amber-400 bg-amber-500/5">
                      {row.pts}
                    </td>

                    {/* RACHA */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {row.form.length === 0 ? (
                          <span className="text-[10px] text-slate-500 font-mono">-</span>
                        ) : (
                          row.form.map((res, i) => (
                            <span
                              key={i}
                              className={`w-4 h-4 rounded text-[9px] font-black flex items-center justify-center ${
                                res === 'W'
                                  ? 'bg-emerald-500 text-slate-950'
                                  : res === 'D'
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-rose-500 text-white'
                              }`}
                            >
                              {res}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Helper for rendering the dynamic Brackets (Playoffs) Component
  const renderBracketsTree = () => {
    if (isLoadingMatches) {
      return (
        <div className="p-12 rounded-3xl glass-panel border border-[var(--border-card)] text-center text-slate-400 font-mono">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mb-2" />
          <p className="text-xs font-bold">Cargando brackets de Playoff desde BD...</p>
        </div>
      );
    }

    if (bracketMatches.length === 0) {
      return (
        <div className="p-8 rounded-3xl glass-panel border border-[var(--border-card)] text-center space-y-2 font-mono">
          <Trophy className="w-8 h-8 text-slate-500 mx-auto" />
          <h4 className="text-sm font-bold text-white">Sin llaves de Playoff en la Base de Datos</h4>
          <p className="text-xs text-slate-400">
            Aún no se ha generado el fixture de Playoff o Segunda Final para esta competencia en la base de datos real.
          </p>
        </div>
      );
    }

    const qfMatches = bracketMatches.filter((m) => m.round === 'CUARTOS');
    const sfMatches = bracketMatches.filter((m) => m.round === 'SEMIFINAL');
    const finalMatch = bracketMatches.find((m) => m.round === 'FINAL');
    
    // Flexible search for Tercer Lugar match
    const thirdMatch = bracketMatches.find((m) => {
      if (m.round === 'TERCER_LUGAR') return true;
      const t = (m.title || '').toUpperCase();
      return (
        t.includes('TERCER') ||
        t.includes('3ER') ||
        t.includes('3º') ||
        t.includes('BRONCE') ||
        t.includes('SEGUNDA FINAL') ||
        t.includes('TERCER LUGAR')
      );
    });

    return (
      <div className="w-full space-y-6 font-mono">
        <div className="p-6 rounded-3xl glass-panel border border-[var(--border-card)] shadow-2xl space-y-8 overflow-x-auto">
          
          <div className="flex items-center justify-between min-w-[850px] gap-6">
            
            {/* COLUMNA CUARTOS DE FINAL (SI EXISTEN) */}
            {qfMatches.length > 0 && (
              <>
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-widest border-b border-white/10 pb-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span>CUARTOS DE FINAL (BD REAL)</span>
                  </div>
                  <div className="space-y-4">
                    {qfMatches.map((m) => (
                      <div key={m.id} className="p-3.5 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-2 shadow-lg hover:border-cyan-400 transition-colors">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold border-b border-white/5 pb-1">
                          <span>{m.title}</span>
                          <Badge variant="cyan" className="text-[9px] py-0 px-1 font-bold">
                            {m.status}
                          </Badge>
                        </div>
                        <div className="space-y-1.5">
                          {renderBracketTeamRow(m.homeTeam, m.homeTag, m.homeScore, m.winner === 'home')}
                          {renderBracketTeamRow(m.awayTeam, m.awayTag, m.awayScore, m.winner === 'away')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center text-cyan-400 shrink-0">
                  <ChevronRight className="w-6 h-6 animate-pulse" />
                </div>
              </>
            )}

            {/* COLUMNA SEMIFINALES */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-widest border-b border-white/10 pb-2">
                <Trophy className="w-4 h-4 text-purple-400" />
                <span>SEMIFINALES (BD REAL)</span>
              </div>
              <div className="space-y-4">
                {sfMatches.length === 0 ? (
                  <p className="text-xs text-slate-500">Pendiente de disputar</p>
                ) : (
                  sfMatches.map((m) => (
                    <div key={m.id} className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-3 shadow-lg hover:border-purple-400 transition-colors">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold border-b border-white/5 pb-1.5">
                        <span>{m.title}</span>
                        <Badge variant="cyan" className="text-[9px] py-0 px-1.5 font-bold">
                          {m.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {renderBracketTeamRow(m.homeTeam, m.homeTag, m.homeScore, m.winner === 'home')}
                        {renderBracketTeamRow(m.awayTeam, m.awayTag, m.awayScore, m.winner === 'away')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* CONECTOR FLECHA */}
            <div className="flex items-center justify-center text-purple-400 shrink-0">
              <ChevronRight className="w-8 h-8 animate-pulse" />
            </div>

            {/* COLUMNA GRAN FINAL & TERCER LUGAR */}
            <div className="flex-1 space-y-6">
              
              {/* GRAN FINAL */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-widest border-b border-white/10 pb-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>GRAN FINAL 🏆</span>
                </div>
                {finalMatch ? (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-950 border-2 border-amber-500/60 space-y-3 shadow-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold border-b border-amber-500/20 pb-1.5">
                      <span>{finalMatch.title}</span>
                      <span className="text-amber-400 font-black">{finalMatch.timeDisplay}</span>
                    </div>
                    <div className="space-y-2">
                      {renderBracketTeamRow(finalMatch.homeTeam, finalMatch.homeTag, finalMatch.homeScore, finalMatch.winner === 'home')}
                      {renderBracketTeamRow(finalMatch.awayTeam, finalMatch.awayTag, finalMatch.awayScore, finalMatch.winner === 'away')}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-amber-500/20 space-y-2 opacity-80">
                    <div className="flex items-center justify-between text-[10px] text-amber-400/80 font-bold border-b border-white/5 pb-1">
                      <span>GRAN FINAL 🏆</span>
                      <span>22:00 hrs</span>
                    </div>
                    <div className="space-y-1.5">
                      {renderBracketTeamRow('Ganador Semifinal 1', 'SF1', null)}
                      {renderBracketTeamRow('Ganador Semifinal 2', 'SF2', null)}
                    </div>
                  </div>
                )}
              </div>

              {/* TERCER LUGAR (SEGUNDA FINAL 🥉) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-widest border-b border-white/10 pb-2">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span>TERCER LUGAR 🥉 (SEGUNDA FINAL)</span>
                </div>
                {thirdMatch ? (
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-2 shadow-lg">
                    <div className="flex items-center justify-between text-[10px] text-cyan-300 font-bold border-b border-white/5 pb-1">
                      <span>{thirdMatch.title}</span>
                      <span>{thirdMatch.timeDisplay}</span>
                    </div>
                    <div className="space-y-1.5">
                      {renderBracketTeamRow(thirdMatch.homeTeam, thirdMatch.homeTag, thirdMatch.homeScore, thirdMatch.winner === 'home')}
                      {renderBracketTeamRow(thirdMatch.awayTeam, thirdMatch.awayTag, thirdMatch.awayScore, thirdMatch.winner === 'away')}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-cyan-500/20 space-y-2 opacity-80">
                    <div className="flex items-center justify-between text-[10px] text-cyan-400/80 font-bold border-b border-white/5 pb-1">
                      <span>TERCER LUGAR 🥉 (SEGUNDA FINAL)</span>
                      <span>21:00 hrs</span>
                    </div>
                    <div className="space-y-1.5">
                      {renderBracketTeamRow('Perdedor Semifinal 1', 'SF1', null)}
                      {renderBracketTeamRow('Perdedor Semifinal 2', 'SF2', null)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  if (isInitialLoading) {
    return (
      <div className="w-full space-y-6">
        <div className="p-12 rounded-3xl glass-panel border border-[var(--border-card)] text-center text-slate-400 font-mono">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mb-4" />
          <p className="text-sm font-bold text-white">Sincronizando con Base de Datos...</p>
          <p className="text-xs">Cargando organizaciones, torneos y estadísticas en tiempo real.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 font-sans">
      
      {/* ── 1. CABECERA EXCLUSIVA DE CLASIFICACIÓN EN TIEMPO REAL ───────────── */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-[var(--border-card)] shadow-2xl space-y-3 relative overflow-hidden">
        <div
          className="absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: brandColor }}
        />

        <div className="flex items-center gap-2">
          <Badge
            variant="cyan"
            className="text-[10px] font-mono font-bold uppercase tracking-wider py-1 px-3"
            style={{ backgroundColor: `${brandColor}25`, borderColor: brandColor, color: '#fff' }}
          >
            {game.name} • TABLAS & BRACKETS REALES
          </Badge>
          <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            TIEMPO REAL (BASE DE DATOS)
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white flex items-center gap-3">
          <Trophy className="w-7 h-7 sm:w-9 h-9" style={{ color: brandColor }} />
          <span>CLASIFICACIÓN EN TIEMPO REAL</span>
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl font-sans leading-relaxed">
          Consulta las tablas de posiciones oficiales, el rendimiento de los clubes, el desglose de fases de grupos y las llaves de eliminatorias sincronizados con la Base de Datos.
        </p>
      </div>

      {/* ── 2. FILTROS POR ORGANIZACIÓN Y COMPETENCIA (BAJO LA CABECERA) ──────── */}
      <div className="p-5 rounded-3xl glass-panel border border-[var(--border-card)] shadow-xl space-y-4 font-mono">
        
        {/* Organizaciones */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>ORGANIZACIONES DISPONIBLES EN BD:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setSelectedOrgName('TODAS');
                setSelectedTournName('TODAS');
                fetchTournaments('TODAS');
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                selectedOrgName === 'TODAS'
                  ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-md ring-1 ring-cyan-400/40'
                  : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              TODAS LAS ORGANIZACIONES
            </button>

            {availableOrgs.map((org) => {
              const isActive = selectedOrgName.toUpperCase() === org.name.toUpperCase();
              return (
                <button
                  key={org.id}
                  onClick={() => {
                    setSelectedOrgName(org.name);
                    setSelectedTournName('TODAS');
                    fetchTournaments(org.name);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    isActive
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-md ring-1 ring-cyan-400/40'
                      : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white hover:border-cyan-500/40'
                  }`}
                >
                  {org.name} <span className="opacity-70">({org.tag})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Competencias de la Organización Seleccionada */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>COMPETENCIAS DE {selectedOrgName.toUpperCase()}:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedTournName('TODAS')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                selectedTournName === 'TODAS'
                  ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-md'
                  : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              TODAS LAS COMPETENCIAS
            </button>

            {availableTournaments.map((t) => {
              const isActive = selectedTournName.toUpperCase() === t.name.toUpperCase();
              return (
                <button
                  key={t.id || t.name}
                  onClick={() => setSelectedTournName(t.name)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-md'
                      : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white hover:border-amber-500/40'
                  }`}
                >
                  <span>{t.name}</span>
                  <Badge variant="cyan" className="text-[9px] py-0 px-1 font-mono uppercase">
                    {t.format || 'LIGA'}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 3. DETECTOR AUTOMÁTICO DEL FORMATO DE LA COMPETENCIA ─────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/80 border border-white/10 font-mono">
        <div className="flex items-center gap-2">
          <Badge
            variant={currentFormat === 'PLAYOFF' ? 'violet' : currentFormat === 'HIBRIDO' ? 'cyan' : 'gold'}
            className="text-xs font-bold uppercase py-1 px-3 flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>
              FORMATO DETECTADO:{' '}
              {currentFormat === 'PLAYOFF'
                ? 'PLAYOFF (ELIMINATORIA DIRECTA)'
                : currentFormat === 'HIBRIDO'
                ? 'HÍBRIDO (FASE DE GRUPOS + PLAYOFF)'
                : 'LIGA (TODOS CONTRA TODOS)'}
            </span>
          </Badge>
          <span className="text-xs text-slate-400 hidden sm:inline truncate max-w-xs">
            • {activeTournamentObj.name}
          </span>
        </div>

        {/* Sub-toggle selector solo para formato HÍBRIDO */}
        {currentFormat === 'HIBRIDO' && (
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-cyan-500/30">
            <button
              onClick={() => setHybridTab('GRUPOS')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                hybridTab === 'GRUPOS' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              FASE DE GRUPOS
            </button>
            <button
              onClick={() => setHybridTab('PLAYOFF')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                hybridTab === 'PLAYOFF' ? 'bg-purple-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              PLAYOFFS / BRACKETS
            </button>
          </div>
        )}
      </div>

      {/* ── 4. DESPLEGABLE ADAPTATIVO SEGÚN FORMATO AUTOMÁTICO (BD REAL) ─────── */}

      {/* CASO A: FORMATO LIGA */}
      {currentFormat === 'LIGA' && renderStandingsTable(leagueStandings, 'TABLA GENERAL DE POSICIONES (BD REAL)')}

      {/* CASO B: FORMATO PLAYOFF */}
      {currentFormat === 'PLAYOFF' && renderBracketsTree()}

      {/* CASO C: FORMATO HÍBRIDO */}
      {currentFormat === 'HIBRIDO' && (
        <div className="space-y-8">
          {hybridTab === 'GRUPOS' ? (
            <div className="space-y-6">
              {Object.keys(groupStandingsMap).length === 0 ? (
                renderStandingsTable([], 'FASE DE GRUPOS')
              ) : (
                Object.keys(groupStandingsMap).map((gName) => (
                  <div key={gName}>
                    {renderStandingsTable(groupStandingsMap[gName], `TABLA DE POSICIONES • ${gName}`)}
                  </div>
                ))
              )}
            </div>
          ) : (
            renderBracketsTree()
          )}
        </div>
      )}

    </div>
  );
}
