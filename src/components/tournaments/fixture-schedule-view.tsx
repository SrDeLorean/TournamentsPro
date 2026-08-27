'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';
import { GameConfig } from '@/lib/games-data';
import { getSectionMetadata } from '@/lib/section-config';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/providers/auth-provider';
import { getOrganizationsWithStatsAction } from '@/app/actions/organizations';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Calendar,
  RefreshCw,
  Flame,
  Building2,
  Database,
  Clock,
  CheckCircle2,
  Info,
  Globe2,
  X,
} from 'lucide-react';
import { MatchReportModal } from '@/components/matches/match-report-modal';
import { CountryFlag } from '@/components/ui/country-flag';
import { TacticalLoadingSkeleton } from './tactical-loading-skeleton';
import { shouldBypassImageOptimization } from '@/lib/image-utils';
import {
  getLocalDateString,
  upperTag,
  type FixtureApiMatch,
  type FixtureMatchItem,
  type OrganizationApiItem,
  type OrganizationOption,
  type TournamentApiItem,
  type TournamentOption,
} from '@/features/competitions/fixture/fixture-model';

export type { FixtureMatchItem } from '@/features/competitions/fixture/fixture-model';

interface FixtureScheduleViewProps {
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

export function FixtureScheduleView({
  game,
  initialOrgName,
  initialTournName,
  initialTournId,
  hideOrgFilter = false,
  hideCompFilter = false,
  hideSearchFilter = false,
  hideHeader = false,
  targetTeamName,
}: FixtureScheduleViewProps) {
  const brandColor = game?.brandColor || 'var(--accent-cyan)';
  const meta = getSectionMetadata(game, 'partidos');
  const { currentUser } = useAuth();

  // User Role & Permissions Check
  const roleStr = (currentUser?.role || '').toLowerCase();
  const isAdminOrOrganizer = roleStr === 'administrador' || roleStr === 'admin' || roleStr === 'organizador';
  const isCaptainOrCoach = roleStr === 'entrenador' || roleStr === 'capitan' || roleStr === 'capitán' || roleStr === 'club';

  // Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedMatchForReport, setSelectedMatchForReport] = useState<FixtureMatchItem | null>(null);
  const [isTimezoneModalOpen, setIsTimezoneModalOpen] = useState(false);
  const [selectedMatchForTimezone, setSelectedMatchForTimezone] = useState<string>('22:00');

  // Helper for regional time conversion based on Chile time (UTC-4) with LATAM Country Flags
  const getRegionalTimes = useCallback((timeStr: string) => {
    const [h, m] = (timeStr || '22:00').split(':').map(Number);
    const baseMinutes = (isNaN(h) ? 22 : h) * 60 + (isNaN(m) ? 0 : m);

    const calc = (offsetMinutes: number) => {
      const total = (baseMinutes + offsetMinutes + 1440) % 1440;
      const hh = String(Math.floor(total / 60)).padStart(2, '0');
      const mm = String(total % 60).padStart(2, '0');
      return `${hh}:${mm}`;
    };

    return [
      { country: 'Chile', flag: '🇨🇱', code: 'CL', zone: 'CLT (UTC-4)', time: calc(0), note: 'Hora Oficial Sede' },
      { country: 'Argentina', flag: '🇦🇷', code: 'AR', zone: 'ART (UTC-3)', time: calc(60), note: '+1 hrs' },
      { country: 'Uruguay', flag: '🇺🇾', code: 'UY', zone: 'UYT (UTC-3)', time: calc(60), note: '+1 hrs' },
      { country: 'Bolivia', flag: '🇧🇴', code: 'BO', zone: 'BOT (UTC-4)', time: calc(0), note: 'Misma hora' },
      { country: 'Paraguay', flag: '🇵🇾', code: 'PY', zone: 'PYT (UTC-4)', time: calc(0), note: 'Misma hora' },
      { country: 'Perú', flag: '🇵🇪', code: 'PE', zone: 'PET (UTC-5)', time: calc(-60), note: '-1 hrs' },
      { country: 'Colombia', flag: '🇨🇴', code: 'CO', zone: 'COT (UTC-5)', time: calc(-60), note: '-1 hrs' },
      { country: 'Ecuador', flag: '🇪🇨', code: 'EC', zone: 'ECT (UTC-5)', time: calc(-60), note: '-1 hrs' },
      { country: 'México', flag: '🇲🇽', code: 'MX', zone: 'CST (UTC-6)', time: calc(-120), note: '-2 hrs' },
    ];
  }, []);

  // Real Database State (MySQL Local / Prisma)
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [tournaments, setTournaments] = useState<TournamentOption[]>([]);
  const [matches, setMatches] = useState<FixtureMatchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Carousel State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'EN_VIVO' | 'PROXIMOS' | 'FINALIZADOS'>('TODOS');
  const [selectedOrgName, setSelectedOrgName] = useState<string>(initialOrgName || 'TODAS');
  const [selectedTournName, setSelectedTournName] = useState<string>(initialTournName || 'TODAS');
  const [selectedTimeSlotInput, setSelectedTimeSlot] = useState<string>('TODOS');
  const [selectedDateInput, setSelectedDate] = useState<string>('');
  const [todayDate] = useState(getLocalDateString);
  const [, setDatePage] = useState(0);
  const dateCarouselRef = useRef<HTMLDivElement>(null);

  const scrollDateCarousel = (direction: 'left' | 'right') => {
    if (dateCarouselRef.current) {
      const scrollAmount = direction === 'left' ? -148 : 148;
      dateCarouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // 1. Fetch Real Organizations from Local Database API via Server Action
  const fetchOrganizationsFromDB = useCallback(async () => {
    try {
      const res = await getOrganizationsWithStatsAction(game.slug);
      if (res.success && res.organizations) {
        const fetchedOrgs: OrganizationOption[] = (res.organizations as OrganizationApiItem[]).map((o) => ({
          id: o.id || o.name,
          name: o.name,
          tag: o.tag || upperTag(o.name),
          logoUrl: o.logo_url || o.logoUrl || '/images/default/logo-default.png',
        }));
        setOrganizations(fetchedOrgs);
      }
    } catch (err) {
      console.error('Error fetching orgs:', err);
    }
  }, [game.slug]);

  // 2. Fetch Real Tournaments from Local Database API (/api/tournaments)
  const fetchTournamentsFromDB = useCallback(async (orgName: string) => {
    try {
      let url = `/api/tournaments?gameSlug=${game.slug}`;
      if (orgName !== 'TODAS') {
        url += `&organizationName=${encodeURIComponent(orgName)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      const rawList = data.tournaments || data.competitions || data.data || (Array.isArray(data) ? data : []);
      if (Array.isArray(rawList)) {
        const fetchedTourns: TournamentOption[] = (rawList as TournamentApiItem[]).map((t) => ({
          id: t.id || t.name,
          name: t.name,
          gameSlug: t.game_slug || game.slug,
          organizationName: t.organization_name || orgName,
          logoUrl: t.logo_url || t.logoUrl || t.banner_url || t.bannerUrl || '/images/default/logo-default.png',
        }));
        setTournaments(fetchedTourns);
      }
    } catch (err) {
      console.error('Error fetching tournaments:', err);
    }
  }, [game.slug]);

  // Clean helper functions for date and time formatting
  function parseCleanDateStr(m: FixtureApiMatch): string {
    if (m.match_date && typeof m.match_date === 'string' && m.match_date.length >= 10) {
      return m.match_date.slice(0, 10);
    }
    if (m.scheduled_at) {
      const s = String(m.scheduled_at).trim();
      if (s.length >= 10) return s.slice(0, 10);
    }
    return new Date().toISOString().slice(0, 10);
  }

  function parseCleanTimeStr(m: FixtureApiMatch): string {
    const rawTime = m.scheduled_time || m.transmission_time || m.time;
    if (typeof rawTime === 'string' && rawTime.trim()) {
      const hhmmMatch = rawTime.trim().match(/^(\d{1,2}):(\d{2})/);
      if (hhmmMatch) {
        return `${hhmmMatch[1].padStart(2, '0')}:${hhmmMatch[2]}`;
      }
    }
    if (m.scheduled_at && typeof m.scheduled_at === 'string') {
      const s = m.scheduled_at.trim();
      if (s.includes('T')) {
        const timePart = s.split('T')[1];
        if (timePart && timePart.length >= 5) return timePart.slice(0, 5);
      } else if (s.includes(' ')) {
        const timePart = s.split(' ')[1];
        if (timePart && timePart.length >= 5) return timePart.slice(0, 5);
      }
    }
    return '22:00';
  }

  function formatMatchDayDateLabel(dateStr: string): string {
    if (!dateStr || dateStr.length < 10) return 'Martes 11/08';
    const parts = dateStr.slice(0, 10).split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, month, day);
      const daysFull = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const dayName = daysFull[dateObj.getDay()] || 'Martes';
      const dayDD = String(day).padStart(2, '0');
      const monthMM = String(month + 1).padStart(2, '0');
      return `${dayName} ${dayDD}/${monthMM}`;
    }
    return 'Martes 11/08';
  }

  // 3. Fetch Real Matches from Local Database API (/api/matches)
  const fetchMatchesFromDB = useCallback(async (orgName: string, tournName: string, queryText: string, status: string) => {
    try {
      let url = `/api/matches?gameSlug=${game.slug}`;
      if (orgName !== 'TODAS') url += `&organizationName=${encodeURIComponent(orgName)}`;
      if (initialTournId) url += `&tournamentId=${encodeURIComponent(initialTournId)}`;
      else if (tournName !== 'TODAS') url += `&tournamentName=${encodeURIComponent(tournName)}`;
      if (status !== 'TODOS') url += `&status=${encodeURIComponent(status)}`;
      
      if (targetTeamName) {
        url += `&search=${encodeURIComponent(targetTeamName)}`;
      } else if (queryText) {
        url += `&search=${encodeURIComponent(queryText)}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.success && Array.isArray(data.matches)) {
        let rawMatches = data.matches as FixtureApiMatch[];
        if (targetTeamName && queryText) {
          const lowerQuery = queryText.toLowerCase();
          rawMatches = rawMatches.filter((m) =>
            (m.home_team_name || '').toLowerCase().includes(lowerQuery) ||
            (m.away_team_name || '').toLowerCase().includes(lowerQuery) ||
            (m.tournament_name || '').toLowerCase().includes(lowerQuery)
          );
        }

        const mapped: FixtureMatchItem[] = rawMatches.map((m, idx) => {
          const dateStr = parseCleanDateStr(m);
          const timeStr = parseCleanTimeStr(m);
          const dayDateLabel = formatMatchDayDateLabel(dateStr);
          const exactDateDisplay = `${dayDateLabel} ${timeStr}`;

          return {
            id: m.id || `M-${idx + 1}`,
            homeTeam: m.home_team_name || 'Equipo Local',
            homeTag: m.home_team_tag || upperTag(m.home_team_name),
            homeLogoUrl: m.home_team_logo || m.home_logo_url || m.homeLogoUrl || m.home_logo || m.homeLogo,
            awayTeam: m.away_team_name || 'Equipo Visitante',
            awayTag: m.away_team_tag || upperTag(m.away_team_name),
            awayLogoUrl: m.away_team_logo || m.away_logo_url || m.awayLogoUrl || m.away_logo || m.awayLogo,
            homeScore: m.score_home !== undefined && m.score_home !== null ? Number(m.score_home) : null,
            awayScore: m.score_away !== undefined && m.score_away !== null ? Number(m.score_away) : null,
            status: m.status === 'EN_VIVO' ? 'EN_VIVO' : m.status === 'FINALIZADO' ? 'FINALIZADO' : 'PROGRAMADO',
            transmissionTime: timeStr,
            exactDateDisplay,
            matchDate: dateStr,
            dayLabel: dayDateLabel,
            dayNumber: parseInt(dateStr.slice(8, 10), 10) || 1,
            circuitName: m.organization_name || 'Organización Oficial BD',
            competitionName: m.tournament_name || 'Competencia BD',
            groupJornada: m.round_name || `JORNADA ${m.matchday || m.matchday_number || 1}`,
          };
        });
        setMatches(mapped);
      } else {
        setMatches([]);
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
      setMatches([]);
    }
  }, [game.slug, initialTournId, targetTeamName]);

  // Initial Load from Local DB - Synchronized with Promise.all
  useEffect(() => {
    let isMounted = true;
    const loadAllInitialData = async () => {
      try {
        const targetOrg = initialOrgName || 'TODAS';
        const targetTourn = initialTournName || 'TODAS';
        await Promise.all([
          fetchOrganizationsFromDB(),
          fetchTournamentsFromDB(targetOrg),
          fetchMatchesFromDB(targetOrg, targetTourn, '', 'TODOS'),
        ]);
      } catch (err) {
        console.error('Error sincronizando datos iniciales:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAllInitialData();
    return () => {
      isMounted = false;
    };
  }, [fetchOrganizationsFromDB, fetchTournamentsFromDB, fetchMatchesFromDB, initialOrgName, initialTournName]);

  // Cascading Selection: Click Organization -> Fetch linked Tournaments & Matches from Local DB
  const handleSelectOrganization = (orgName: string) => {
    setSelectedOrgName(orgName);
    setSelectedTournName('TODAS');
    setSelectedTimeSlot('TODOS');
    setSelectedDate('');
    setDatePage(0);
    fetchTournamentsFromDB(orgName);
    fetchMatchesFromDB(orgName, 'TODAS', searchQuery, statusFilter);
  };

  // Click Tournament -> Fetch Matches from Local DB
  const handleSelectTournament = (tournName: string) => {
    setSelectedTournName(tournName);
    setSelectedTimeSlot('TODOS');
    setSelectedDate('');
    setDatePage(0);
    fetchMatchesFromDB(selectedOrgName, tournName, searchQuery, statusFilter);
  };

  // Dynamically computed list of Organizations (API + loaded matches fallback)
  const availableOrganizations = useMemo(() => {
    const orgsMap = new Map<string, OrganizationOption>();

    organizations.forEach((o) => {
      if (o.name) orgsMap.set(o.name.toUpperCase(), o);
    });

    matches.forEach((m) => {
      if (m.circuitName && !orgsMap.has(m.circuitName.toUpperCase())) {
        orgsMap.set(m.circuitName.toUpperCase(), {
          id: `org-${m.circuitName}`,
          name: m.circuitName,
          tag: m.circuitName.slice(0, 3).toUpperCase(),
          logoUrl: '/images/default/logo-default.png',
        });
      }
    });

    return Array.from(orgsMap.values());
  }, [organizations, matches]);

  // Dynamically computed list of Competitions (API + loaded matches fallback)
  const availableTournaments = useMemo(() => {
    const tournMap = new Map<string, TournamentOption>();

    tournaments.forEach((t) => {
      if (t.name) tournMap.set(t.name.toUpperCase(), t);
    });

    matches.forEach((m) => {
      if (m.competitionName && !tournMap.has(m.competitionName.toUpperCase())) {
        tournMap.set(m.competitionName.toUpperCase(), {
          id: `t-${m.competitionName}`,
          name: m.competitionName,
          gameSlug: game.slug,
          organizationName: m.circuitName,
        });
      }
    });

    return Array.from(tournMap.values());
  }, [tournaments, matches, game.slug]);

  // Calendar dates derived dynamically from real DB matches & sorted chronologically
  const calendarDays = (() => {
    const datesMap: { [key: string]: { dateStr: string; label: string; dayName: string; dayDDMM: string; dayNumber: number; count: number } } = {};
    const daysFull = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    matches.forEach((m) => {
      if (!m.matchDate) return;
      if (!datesMap[m.matchDate]) {
        const dateObj = new Date(m.matchDate + 'T00:00:00');
        const dayName = daysFull[dateObj.getDay()];
        const dayDD = String(dateObj.getDate()).padStart(2, '0');
        const monthMM = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dayLbl = `${dayName} ${dayDD}/${monthMM}`;

        datesMap[m.matchDate] = {
          dateStr: m.matchDate,
          label: dayLbl,
          dayName,
          dayDDMM: `${dayDD}/${monthMM}`,
          dayNumber: dateObj.getDate(),
          count: 0,
        };
      }
      datesMap[m.matchDate].count += 1;
    });

    return Object.values(datesMap).sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  })();

  const selectedDate = calendarDays.some((day) => day.dateStr === selectedDateInput)
    ? selectedDateInput
    : calendarDays.reduce((closest, day) => {
        if (!closest) return day.dateStr;
        const dayDifference = Math.abs(new Date(`${day.dateStr}T00:00:00`).getTime() - new Date(`${todayDate}T00:00:00`).getTime());
        const closestDifference = Math.abs(new Date(`${closest}T00:00:00`).getTime() - new Date(`${todayDate}T00:00:00`).getTime());
        return dayDifference < closestDifference ? day.dateStr : closest;
      }, '');

  const handlePrevDate = () => {
    const currIdx = calendarDays.findIndex((day) => day.dateStr === selectedDate);
    if (currIdx > 0) setSelectedDate(calendarDays[currIdx - 1].dateStr);
    scrollDateCarousel('left');
  };

  const handleNextDate = () => {
    const currIdx = calendarDays.findIndex((day) => day.dateStr === selectedDate);
    if (currIdx >= 0 && currIdx < calendarDays.length - 1) {
      setSelectedDate(calendarDays[currIdx + 1].dateStr);
    }
    scrollDateCarousel('right');
  };

  // Auto-scroll selected date into view in carousel
  useEffect(() => {
    if (selectedDate && dateCarouselRef.current) {
      const idx = calendarDays.findIndex((d) => d.dateStr === selectedDate);
      if (idx >= 0) {
        const itemWidth = 148;
        const containerWidth = dateCarouselRef.current.clientWidth || 600;
        const targetScroll = idx * itemWidth - (containerWidth / 2 - itemWidth / 2);
        dateCarouselRef.current.scrollTo({
          left: Math.max(0, targetScroll),
          behavior: 'smooth',
        });
      }
    }
  }, [selectedDate, calendarDays]);

  // Available Time Slots dynamically extracted ONLY for the selected date in calendar
  const availableTimeSlots = useMemo(() => {
    const timesSet = new Set<string>();
    matches.forEach((m) => {
      if (selectedDate && m.matchDate !== selectedDate) return;
      if (m.transmissionTime) timesSet.add(m.transmissionTime);
    });
    return Array.from(timesSet).sort((a, b) => a.localeCompare(b));
  }, [matches, selectedDate]);
  const selectedTimeSlot = selectedTimeSlotInput === 'TODOS' || availableTimeSlots.includes(selectedTimeSlotInput)
    ? selectedTimeSlotInput
    : 'TODOS';

  // Compute status counters from real DB matches
  const statusCounts = useMemo(() => {
    const todos = matches.length;
    const enVivo = matches.filter((m) => m.status === 'EN_VIVO').length;
    const proximos = matches.filter((m) => m.status === 'PROGRAMADO').length;
    const finalizados = matches.filter((m) => m.status === 'FINALIZADO').length;

    return { todos, enVivo, proximos, finalizados };
  }, [matches]);

  // Filter matches by selectedDate and selectedTimeSlot
  const displayMatches = useMemo(() => {
    let filtered = matches;
    if (selectedDate) {
      filtered = filtered.filter((m) => m.matchDate === selectedDate);
    }
    if (selectedTimeSlot !== 'TODOS') {
      filtered = filtered.filter((m) => m.transmissionTime === selectedTimeSlot);
    }
    return filtered;
  }, [matches, selectedDate, selectedTimeSlot]);

  // Group filtered DB matches by Organization & Tournament, sorted chronologically from 00:01 to 23:59
  const groupedMatches = useMemo(() => {
    const groups: { [circuit: string]: { [comp: string]: FixtureMatchItem[] } } = {};

    displayMatches.forEach((match) => {
      const circ = match.circuitName || 'Organización BD';
      const comp = match.competitionName || 'Competencia BD';

      if (!groups[circ]) groups[circ] = {};
      if (!groups[circ][comp]) groups[circ][comp] = [];

      groups[circ][comp].push(match);
    });

    // Sort matches chronologically by transmissionTime (00:01 to 23:59)
    Object.keys(groups).forEach((circ) => {
      Object.keys(groups[circ]).forEach((comp) => {
        groups[circ][comp].sort((a, b) => {
          const timeA = a.transmissionTime || '00:00';
          const timeB = b.transmissionTime || '00:00';
          return timeA.localeCompare(timeB);
        });
      });
    });

    return groups;
  }, [displayMatches]);

  const getEmptyStateMessage = () => {
    if (searchQuery) {
      return {
        title: `Sin resultados para "${searchQuery}"`,
        desc: 'No existen encuentros que coincidan con la búsqueda ingresada.'
      };
    }
    if (selectedTournName !== 'TODAS') {
      if (statusFilter !== 'TODOS') {
        const stateName = statusFilter === 'EN_VIVO' ? 'En Vivo' : statusFilter === 'PROXIMOS' ? 'Programados' : 'Finalizados';
        return {
          title: `Sin partidos ${stateName}`,
          desc: `Actualmente la competencia ${selectedTournName} no tiene partidos en estado ${stateName}.`
        };
      }
      return {
        title: 'Cruces no realizados',
        desc: 'Actualmente la competencia no tiene los cruces realizados, por favor espere a que sean programados por la administración.'
      };
    }
    if (selectedOrgName !== 'TODAS') {
      if (statusFilter !== 'TODOS') {
        const stateName = statusFilter === 'EN_VIVO' ? 'En Vivo' : statusFilter === 'PROXIMOS' ? 'Programados' : 'Finalizados';
        return {
          title: `No se encuentran partidos ${stateName.toLowerCase()} actualmente`,
          desc: `No existen partidos en estado ${stateName} para la organización ${selectedOrgName}.`
        };
      }
      return {
        title: 'Sin actividad reciente',
        desc: `No se encuentran competencias o partidos actualmente en ${selectedOrgName}.`
      };
    }
    if (statusFilter !== 'TODOS') {
      const stateName = statusFilter === 'EN_VIVO' ? 'En Vivo' : statusFilter === 'PROXIMOS' ? 'Programados' : 'Finalizados';
      return {
        title: `No se encuentran partidos ${stateName.toLowerCase()} actualmente`,
        desc: `Actualmente no hay partidos registrados en la plataforma bajo el estado ${stateName}.`
      };
    }
    return {
      title: 'La organización no posee competencias organizadas todavía.',
      desc: 'Explora otras organizaciones o cambia los filtros de búsqueda para ver más encuentros.'
    };
  };

  const emptyState = getEmptyStateMessage();

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-16">
      {/* ── 1. ENCABEZADO PRINCIPAL (PageHeader) - PERMANENTE EN DOM ────────── */}
      {!hideHeader && (
        <PageHeader
          badgeText={meta.badgeText}
          badgeIcon={<Flame className="w-3.5 h-3.5" style={{ color: brandColor, fill: brandColor }} />}
          title={meta.title}
          highlightTitle={meta.highlightTitle}
          description={meta.description}
          brandColor={brandColor}
        />
      )}

      {/* ── 2. FILTROS Y BÚSQUEDA (SIEMPRE VISIBLES) ─────────────────── */}
      <div className="bg-[var(--bg-card)] p-5 sm:p-6 rounded-3xl border border-[var(--border-card)] shadow-xl space-y-5 backdrop-blur-md">
        {/* BARRA DE BÚSQUEDA */}
        {!hideSearchFilter && (
          <div className="relative w-full">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              placeholder="Buscar en la base de datos local (equipos, competencias, organizaciones)..."
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                setSelectedTimeSlot('TODOS');
                setSelectedDate('');
                setDatePage(0);
                fetchMatchesFromDB(selectedOrgName, selectedTournName, val, statusFilter);
              }}
              className="pl-12 py-3.5 text-xs sm:text-sm input-theme rounded-2xl glass-panel shadow-md w-full placeholder:text-[var(--text-muted)]"
            />
          </div>
        )}

      {/* ── 3. BOTONES DE FILTRO DE ESTADO (CON BRANDCOLOR DE DISCIPLINA) ───────────── */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 font-mono">
        <button
          onClick={() => {
            setStatusFilter('TODOS');
            setSelectedTimeSlot('TODOS');
            setSelectedDate('');
            setDatePage(0);
            fetchMatchesFromDB(selectedOrgName, selectedTournName, searchQuery, 'TODOS');
          }}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-2 select-none active:scale-95 ${
            statusFilter === 'TODOS'
              ? 'shadow-md font-black'
              : 'bg-[var(--bg-card)] border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
          }`}
          style={
            statusFilter === 'TODOS'
              ? {
                  backgroundColor: `color-mix(in srgb, ${brandColor} 22%, transparent)`,
                  borderColor: brandColor,
                  color: brandColor,
                  boxShadow: `0 0 15px color-mix(in srgb, ${brandColor} 30%, transparent)`,
                }
              : undefined
          }
        >
          <span>🌐 TODOS</span>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-bold"
            style={{
              backgroundColor: `color-mix(in srgb, ${brandColor} 30%, transparent)`,
              color: brandColor,
            }}
          >
            {statusCounts.todos}
          </span>
        </button>

        <button
          onClick={() => {
            setStatusFilter('EN_VIVO');
            setSelectedTimeSlot('TODOS');
            setSelectedDate('');
            setDatePage(0);
            fetchMatchesFromDB(selectedOrgName, selectedTournName, searchQuery, 'EN_VIVO');
          }}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-2 select-none active:scale-95 ${
            statusFilter === 'EN_VIVO'
              ? 'shadow-md font-black'
              : 'bg-[var(--bg-card)] border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
          }`}
          style={
            statusFilter === 'EN_VIVO'
              ? {
                  backgroundColor: `color-mix(in srgb, ${brandColor} 22%, transparent)`,
                  borderColor: brandColor,
                  color: brandColor,
                  boxShadow: `0 0 15px color-mix(in srgb, ${brandColor} 30%, transparent)`,
                }
              : undefined
          }
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
          <span>EN VIVO</span>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-bold"
            style={{
              backgroundColor: `color-mix(in srgb, ${brandColor} 30%, transparent)`,
              color: brandColor,
            }}
          >
            {statusCounts.enVivo}
          </span>
        </button>

        <button
          onClick={() => {
            setStatusFilter('PROXIMOS');
            setSelectedTimeSlot('TODOS');
            setSelectedDate('');
            setDatePage(0);
            fetchMatchesFromDB(selectedOrgName, selectedTournName, searchQuery, 'PROXIMOS');
          }}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-2 select-none active:scale-95 ${
            statusFilter === 'PROXIMOS'
              ? 'shadow-md font-black'
              : 'bg-[var(--bg-card)] border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
          }`}
          style={
            statusFilter === 'PROXIMOS'
              ? {
                  backgroundColor: `color-mix(in srgb, ${brandColor} 22%, transparent)`,
                  borderColor: brandColor,
                  color: brandColor,
                  boxShadow: `0 0 15px color-mix(in srgb, ${brandColor} 30%, transparent)`,
                }
              : undefined
          }
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>PRÓXIMOS</span>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-bold"
            style={{
              backgroundColor: `color-mix(in srgb, ${brandColor} 30%, transparent)`,
              color: brandColor,
            }}
          >
            {statusCounts.proximos}
          </span>
        </button>

        <button
          onClick={() => {
            setStatusFilter('FINALIZADOS');
            setSelectedTimeSlot('TODOS');
            setSelectedDate('');
            setDatePage(0);
            fetchMatchesFromDB(selectedOrgName, selectedTournName, searchQuery, 'FINALIZADOS');
          }}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-2 select-none active:scale-95 ${
            statusFilter === 'FINALIZADOS'
              ? 'shadow-md font-black'
              : 'bg-[var(--bg-card)] border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
          }`}
          style={
            statusFilter === 'FINALIZADOS'
              ? {
                  backgroundColor: `color-mix(in srgb, ${brandColor} 22%, transparent)`,
                  borderColor: brandColor,
                  color: brandColor,
                  boxShadow: `0 0 15px color-mix(in srgb, ${brandColor} 30%, transparent)`,
                }
              : undefined
          }
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>FINALIZADOS</span>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-bold"
            style={{
              backgroundColor: `color-mix(in srgb, ${brandColor} 30%, transparent)`,
              color: brandColor,
            }}
          >
            {statusCounts.finalizados}
          </span>
        </button>
      </div>

      {/* ── 4. ORGANIZACIONES / MADRE EN BD LOCAL ──────────────────────────── */}
      {!hideOrgFilter && availableOrganizations.length > 0 && (
        <div className="space-y-3 p-4 glass-panel rounded-2xl border border-[var(--border-card)] relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-[var(--text-muted)] uppercase">
            <Building2 className="w-4 h-4" style={{ color: brandColor }} />
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
              <span>TODAS LAS ORGANIZACIONES</span>
            </button>

            {availableOrganizations.map((org) => {
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

      {/* ── 5. COMPETENCIAS EN BD LOCAL FILTRADAS EN CASCADA ────────────────── */}
      {!hideCompFilter && availableTournaments.length > 0 && (
        <div className="space-y-3 p-4 glass-panel rounded-2xl border border-[var(--border-card)] relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-[var(--text-muted)] uppercase">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>
              {targetTeamName 
                ? 'COMPETENCIAS EN LAS QUE PARTICIPA EL EQUIPO'
                : `COMPETENCIAS / TORNEOS DE ${selectedOrgName.toUpperCase()}`}
            </span>
          </div>
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
              <span>TODAS LAS COMPETENCIAS</span>
            </button>

            {availableTournaments.map((comp) => {
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
        </div>
      )}

      </div>

      {/* ── 3. CONTENIDO PRINCIPAL O SINCRONIZADOR DE DATOS ─────────────────── */}
      {isLoading ? (
        <div className="pt-2"><TacticalLoadingSkeleton game={game} message={`SINCRONIZANDO PARTIDOS DE ${game.name.toUpperCase()}...`} /></div>
      ) : (
        <>
      {/* ── 6. CARRUSEL DE FECHAS EN CALENDARIO CON BOTONES < > A LOS COSTADOS ────────────────── */}
      {calendarDays.length > 0 && (
        <div className="space-y-4 pt-3 pb-3 bg-[var(--bg-card)] p-4 sm:p-5 rounded-3xl border border-[var(--border-card)] shadow-2xl text-center backdrop-blur-md font-mono">
          
          {/* Header centered */}
          <div className="flex items-center justify-center gap-2">
            <Calendar className="w-5 h-5 animate-pulse" style={{ color: brandColor }} />
            <span className="text-xs sm:text-sm font-black text-[var(--text-heading)] uppercase tracking-wider">
              FECHAS DISPONIBLES EN CALENDARIO
            </span>
            <span
              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `color-mix(in srgb, ${brandColor} 25%, transparent)`,
                color: brandColor,
                borderColor: brandColor,
              }}
            >
              {calendarDays.length} FECHAS
            </span>
          </div>

          {/* Side-by-side layout: < Button [ Date Carousel ] > Button */}
          <div className="flex items-center gap-2 sm:gap-3 w-full">
            {/* Left Arrow Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevDate}
              disabled={calendarDays.findIndex((d) => d.dateStr === selectedDate) <= 0}
              className="p-2 sm:p-3 rounded-2xl border-2 border-[var(--border-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] disabled:opacity-20 disabled:pointer-events-none shrink-0 shadow-lg"
              title="Anterior Fecha"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            {/* Interactive Scrollable Carousel container for dates — WITH VISIBLE BOTTOM SCROLLBAR */}
            <div
              ref={dateCarouselRef}
              data-date-carousel
              className="flex items-center justify-start sm:justify-center gap-3 overflow-x-auto scroll-smooth py-2.5 pb-4 flex-1 px-1"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: `${brandColor} var(--bg-main)`,
              }}
            >
              {calendarDays.map((day) => {
                const isActive = selectedDate === day.dateStr;
                return (
                  <button
                    key={day.dateStr}
                    onClick={() => setSelectedDate(day.dateStr)}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all text-center min-w-[135px] shrink-0 relative overflow-hidden group shadow-xl ${
                      isActive
                        ? 'border-white text-slate-950 scale-105 font-black ring-4'
                        : 'bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                    }`}
                    style={
                      isActive
                        ? {
                            backgroundColor: brandColor,
                            borderColor: '#ffffff',
                            color: '#05070d',
                            boxShadow: `0 0 25px ${brandColor}`,
                          }
                        : undefined
                    }
                  >
                    <span
                      className={`text-[11px] uppercase font-black tracking-wider ${
                        isActive ? 'text-slate-950' : ''
                      }`}
                      style={{ color: !isActive ? brandColor : undefined }}
                    >
                      {day.dayName}
                    </span>
                    <span
                      className={`text-2xl font-black my-0.5 tracking-tight ${
                        isActive ? 'text-slate-950' : 'text-[var(--text-heading)]'
                      }`}
                    >
                      {day.dayDDMM}
                    </span>
                    <span
                      className={`text-[9px] font-bold py-0.5 px-2.5 rounded-full uppercase mt-1 transition-colors ${
                        isActive
                          ? 'bg-slate-950 text-white font-black'
                          : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-card)]'
                      }`}
                    >
                      {day.count} PARTIDO{day.count !== 1 ? 'S' : ''}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Arrow Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextDate}
              disabled={calendarDays.findIndex((d) => d.dateStr === selectedDate) >= calendarDays.length - 1}
              className="p-2 sm:p-3 rounded-2xl border-2 border-[var(--border-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] disabled:opacity-20 disabled:pointer-events-none shrink-0 shadow-lg"
              title="Siguiente Fecha"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* ── 7. PAGINADOR DE HORARIOS INTEGRADO EN CALENDARIO ── */}
          {availableTimeSlots.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 mt-2 border-t border-[var(--border-card)] w-full">
              <div className="flex items-center gap-2 shrink-0">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] sm:text-xs font-black uppercase text-[var(--text-heading)] tracking-wider">
                  HORARIOS
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs bg-[var(--bg-main)] border border-[var(--border-card)] px-3 sm:px-4 py-2 sm:py-2.5 rounded-full shadow-inner">
                <button
                  onClick={() => setSelectedTimeSlot('TODOS')}
                  className={`px-3 py-1 rounded-xl font-bold transition-all border ${
                    selectedTimeSlot === 'TODOS'
                      ? 'shadow-sm font-black'
                      : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-card)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                  style={
                    selectedTimeSlot === 'TODOS'
                      ? {
                          backgroundColor: `color-mix(in srgb, ${brandColor} 20%, transparent)`,
                          borderColor: brandColor,
                          color: brandColor,
                        }
                      : undefined
                  }
                >
                  TODOS LOS HORARIOS
                </button>

                {availableTimeSlots.map((time) => {
                  const countForSlot = matches.filter(
                    (m) => m.matchDate === selectedDate && m.transmissionTime === time
                  ).length;

                  const isSlotActive = selectedTimeSlot === time;

                  return (
                    <button
                      key={time}
                      onClick={() => setSelectedTimeSlot(time)}
                      className={`px-3 py-1 rounded-xl font-bold transition-all border flex items-center gap-1.5 ${
                        isSlotActive
                          ? 'shadow-md ring-1'
                          : 'bg-[var(--bg-main)] text-[var(--text-primary)] border-[var(--border-card)] hover:border-[var(--border-card-hover)]'
                      }`}
                      style={
                        isSlotActive
                          ? {
                              backgroundColor: `color-mix(in srgb, ${brandColor} 22%, transparent)`,
                              borderColor: brandColor,
                              color: brandColor,
                            }
                          : undefined
                      }
                    >
                      <span>{time} hrs</span>
                      <span
                        className="text-[10px] px-1.5 py-0.2 rounded font-black"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${brandColor} 30%, transparent)`,
                          color: brandColor,
                        }}
                      >
                        {countForSlot}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 8. LISTADO DE PARTIDOS EN FORMATO TABLA ORDENADO POR HORA (00:01 a 23:59) ── */}
      <div className="space-y-8 pt-2">
        {Object.keys(groupedMatches).length === 0 ? (
          /* EMPTY STATE SI NO HAY REGISTROS EN BD LOCAL */
          <div className="p-12 text-center rounded-3xl glass-panel border border-[var(--border-card)] space-y-4">
            <Database className="w-12 h-12 mx-auto text-[var(--text-muted)] opacity-60" />
            <h3 className="text-xl font-bold font-display text-[var(--text-heading)]">
              {emptyState.title}
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              {emptyState.desc}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectOrganization('TODAS')}
              className="text-xs gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Restablecer Filtros
            </Button>
          </div>
        ) : (
          Object.entries(groupedMatches).map(([circuitName, comps]) => {
            const totalCircuitMatches = Object.values(comps).reduce((sum, arr) => sum + arr.length, 0);

            return (
              <div key={circuitName} className="space-y-6">
                {/* Header de la Organización desde BD Local */}
                <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-6 h-6" style={{ color: brandColor }} />
                    <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[var(--text-heading)] tracking-wider uppercase">
                      {circuitName}
                    </h2>
                  </div>
                  <Badge variant="cyan" className="font-bold">
                    {totalCircuitMatches} ENCUENTROS
                  </Badge>
                </div>

                {/* Sub-grupos por Competencia desde BD Local */}
                {Object.entries(comps).map(([compName, matchesList]) => (
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
                        {matchesList.length} ENCUENTROS
                      </Badge>
                    </div>

                    {/* TABLA HIGH-TECH ORDENADA POR HORA DE 00:01 A 23:59 */}
                    <div className="w-full overflow-x-auto rounded-2xl border border-[var(--border-card)] glass-panel shadow-xl font-mono">
                      <table className="w-full text-left border-collapse min-w-[720px]">
                        <thead>
                          <tr className="bg-[var(--bg-card)] border-b border-[var(--border-card)] text-[10px] font-black uppercase tracking-wider" style={{ color: brandColor }}>
                            <th className="p-3.5 w-44">
                              <div className="flex items-center gap-1.5">
                                <span>Día / Hora</span>
                                <button
                                  onClick={() => {
                                    setSelectedMatchForTimezone('22:00');
                                    setIsTimezoneModalOpen(true);
                                  }}
                                  className="p-0.5 rounded transition-colors"
                                  style={{ color: brandColor }}
                                  title="Ver equivalencias por país (ℹ️)"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </th>
                            <th className="p-3.5 text-center">Enfrentamiento (Local vs Visitante)</th>
                            <th className="p-3.5 text-center w-28">Jornada</th>
                            <th className="p-3.5 text-center w-28">Estado</th>
                            <th className="p-3.5 text-right w-44">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-card)] text-xs">
                          {matchesList.map((match) => {
                            // Check if current user is captain/coach in one of the match teams
                            const isUserTeamInMatch = !!currentUser?.teamName && (
                              match.homeTeam.toLowerCase() === currentUser.teamName.toLowerCase() ||
                              match.awayTeam.toLowerCase() === currentUser.teamName.toLowerCase()
                            );

                            const canReport = isAdminOrOrganizer || (isCaptainOrCoach && isUserTeamInMatch);

                            return (
                              <tr key={match.id} className="hover:bg-[var(--bg-card-hover)] transition-all duration-300 group relative">
                                
                                {/* 1. DÍA Y HORA POR SEPARADO + ICONO INFO DE HORARIO REGIONAL */}
                                <td className="p-3.5 whitespace-nowrap">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-black capitalize tracking-tight" style={{ color: brandColor }}>
                                      {formatMatchDayDateLabel(match.matchDate)}
                                    </span>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-xs font-black text-amber-400">
                                        {match.transmissionTime}
                                      </span>
                                      <CountryFlag code="cl" name="Chile" size="sm" />
                                      <button
                                        onClick={() => {
                                          setSelectedMatchForTimezone(match.transmissionTime);
                                          setIsTimezoneModalOpen(true);
                                        }}
                                        className="transition-colors ml-0.5"
                                        style={{ color: brandColor }}
                                        title="Ver horario por país LATAM (ℹ️)"
                                      >
                                        <Info className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </td>

                                {/* 2. ENFRENTAMIENTO CENTRAL (Nombre Logo Resultado Logo Nombre) */}
                                <td className="p-3.5">
                                  <div className="flex items-center justify-center gap-3 w-full">
                                    {/* Equipo Local */}
                                    <div className="flex items-center gap-2.5 flex-1 justify-end text-right">
                                      <span className="font-extrabold font-display text-xs sm:text-sm text-[var(--text-heading)] transition-colors truncate max-w-[150px]" style={{ color: undefined }}>
                                        {match.homeTeam}
                                      </span>
                                      <Avatar
                                        src={match.homeLogoUrl}
                                        fallback={match.homeTag}
                                        size="sm"
                                        className="ring-1 ring-[var(--border-card)] shrink-0 shadow-md"
                                      />
                                    </div>

                                    {/* Marcador Central */}
                                    <div
                                      className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-main)] border flex items-center justify-center min-w-[70px] shrink-0 shadow-inner"
                                      style={{
                                        borderColor: `color-mix(in srgb, ${brandColor} 30%, transparent)`,
                                      }}
                                    >
                                      <span className="font-black text-xs sm:text-sm tracking-tight text-[var(--text-primary)]">
                                        {match.homeScore !== null ? match.homeScore : '-'}
                                      </span>
                                      <span className="px-1.5 font-black text-xs" style={{ color: brandColor }}>VS</span>
                                      <span className="font-black text-xs sm:text-sm tracking-tight text-[var(--text-primary)]">
                                        {match.awayScore !== null ? match.awayScore : '-'}
                                      </span>
                                    </div>

                                    {/* Equipo Visitante */}
                                    <div className="flex items-center gap-2.5 flex-1 justify-start text-left">
                                      <Avatar
                                        src={match.awayLogoUrl}
                                        fallback={match.awayTag}
                                        size="sm"
                                        className="ring-1 ring-[var(--border-card)] shrink-0 shadow-md"
                                      />
                                      <span className="font-extrabold font-display text-xs sm:text-sm text-[var(--text-heading)] transition-colors truncate max-w-[150px]">
                                        {match.awayTeam}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* 3. JORNADA */}
                                <td className="p-3.5 text-center whitespace-nowrap">
                                  <span
                                    className="text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm"
                                    style={{
                                      backgroundColor: `color-mix(in srgb, ${brandColor} 15%, transparent)`,
                                      borderColor: `color-mix(in srgb, ${brandColor} 40%, transparent)`,
                                      color: brandColor,
                                    }}
                                  >
                                    {match.groupJornada}
                                  </span>
                                </td>

                                {/* 4. ESTADO */}
                                <td className="p-3.5 text-center whitespace-nowrap">
                                  {match.status === 'EN_VIVO' ? (
                                    <span
                                      className="animate-pulse text-[10px] font-black px-2.5 py-1 rounded-full border shadow-sm inline-flex items-center gap-1"
                                      style={{
                                        backgroundColor: `color-mix(in srgb, ${brandColor} 25%, transparent)`,
                                        borderColor: brandColor,
                                        color: brandColor,
                                      }}
                                    >
                                      ● EN VIVO
                                    </span>
                                  ) : match.status === 'FINALIZADO' ? (
                                    <Badge variant="slate" className="text-[10px] font-bold">
                                      FINALIZADO
                                    </Badge>
                                  ) : (
                                    <span
                                      className="text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm"
                                      style={{
                                        backgroundColor: `color-mix(in srgb, ${brandColor} 12%, transparent)`,
                                        borderColor: `color-mix(in srgb, ${brandColor} 30%, transparent)`,
                                        color: brandColor,
                                      }}
                                    >
                                      PROGRAMADO
                                    </span>
                                  )}
                                </td>

                                {/* 5. ACCIONES (Reportar Ficha vs Analizar) */}
                                <td className="p-3.5 text-right whitespace-nowrap">
                                  {canReport ? (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedMatchForReport(match);
                                        setIsReportModalOpen(true);
                                      }}
                                      className="text-xs font-bold py-1 px-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow"
                                    >
                                      REPORTAR FICHA
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs font-bold py-1 px-3 border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40"
                                    >
                                      ANALIZAR
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
      </>
      )}

      {/* Modal de Reporte de Partido */}
      {selectedMatchForReport && (
        <MatchReportModal
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false);
            setSelectedMatchForReport(null);
          }}
          match={{
            id: selectedMatchForReport.id,
            homeTeam: selectedMatchForReport.homeTeam,
            awayTeam: selectedMatchForReport.awayTeam,
            gameSlug: game.slug,
            tournamentName: selectedMatchForReport.competitionName,
          }}
        />
      )}

      {/* Modal de Equivalencia de Horarios por Región con Banderas de Países LATAM */}
      {isTimezoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl p-6 shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3">
              <div className="flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black text-[var(--text-heading)] uppercase tracking-wider">
                  Horarios por País LATAM ({selectedMatchForTimezone} Chile)
                </h3>
              </div>
              <button
                onClick={() => setIsTimezoneModalOpen(false)}
                className="p-1 rounded-lg bg-[var(--bg-main)] border border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Equivalencias horarias del partido para competidores de Latinoamérica basadas en la hora oficial de Chile:
            </p>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {getRegionalTimes(selectedMatchForTimezone).map((item) => (
                <div
                  key={item.country}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] text-xs hover:border-cyan-500/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CountryFlag code={item.code} name={item.country} size="md" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-[var(--text-heading)]">{item.country}</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-[var(--bg-card)] text-[var(--text-muted)] font-bold">
                          {item.code}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)]">{item.zone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-black text-amber-400 text-sm">{item.time} hrs</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-bold">
                      {item.note}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-1 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTimezoneModalOpen(false)}
                className="w-full text-xs font-bold"
              >
                Cerrar Ventana
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
