'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { CountryFlag } from '@/components/ui/country-flag';
import { GameLogo } from '@/components/ui/game-logo';
import { PositionBadge } from '@/components/ui/position-badge';
import { SocialMediaGroup } from '@/components/ui/social-media-group';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Alert } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';
import { FilterBar } from '@/components/ui/filter-bar';
import { GameExplorerPanel } from '@/components/ui/game-explorer-panel';
import { DesignControls } from '@/components/ui/design-controls';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { ParachuteDownloadButton } from '@/components/ui/parachute-download-button';
import { DataTable, type ColumnDef, type FilterOption } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { ModalForm } from '@/components/ui/modal-form';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { useCrudNotifier, CrudAlertBanner } from '@/components/ui/crud-alert';
import { ImageUploadCard } from '@/components/ui/image-upload-card';
import { HologramStage3D } from '@/components/3d/hologram-stage-3d';
import { GameIdentityCard } from '@/components/game/game-identity-card';
import { GameSwitcher } from '@/components/layout/game-switcher';
import { Navbar } from '@/components/layout/navbar';
import { GameSubNavbar, type GameSection } from '@/components/layout/game-sub-navbar';
import { Footer } from '@/components/layout/footer';
import { getGamePortalStyle } from '@/components/game/game-portal-backdrop';
import { EsportsCard } from '@/components/ui/esports-card';
import { MatchdayMatchCard, type MatchdayReportItem } from '@/components/matches/matchday-match-card';
import { AppMetricCard, AppCommandBar } from '@/components/ui/app-primitives';
import { LeagueStandingsTable } from '@/components/tournaments/league-standings-table';
import { PlayoffBracket } from '@/components/tournaments/playoff-bracket';
import { DateCarousel, type CalendarDayItem } from '@/components/tournaments/date-carousel';
import { MatchFilterToolbar } from '@/components/tournaments/match-filter-toolbar';
import { TacticalLoadingSkeleton } from '@/components/tournaments/tactical-loading-skeleton';
import { MatchCard } from '@/components/tournaments/match-card';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { GoogleOAuthModal } from '@/components/auth/google-oauth-modal';
import { AppUiEvolutionStudio } from '@/features/design-system/components/app-ui-evolution-studio';
import type { TeamStanding } from '@/features/competitions/classification/classification-model';
import type { FixtureMatchItem } from '@/features/competitions/fixture/fixture-model';
import { GAMES_CATALOG, SYSTEM_SEMANTIC_PALETTE, type GameConfig, type GameSemanticPalette } from '@/lib/games-data';
import { useTranslation } from '@/components/providers/language-provider';
import { cn } from '@/lib/utils';
import {
  Trophy,
  Search,
  Sparkles,
  Mail,
  User,
  Palette,
  CheckCircle2,
  Eye,
  EyeOff,
  SunMoon,
  Check,
  Zap,
  Flame,
  Shield,
  Layers,
  Activity,
  Crown,
  Swords,
  Info,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Lock,
  UploadCloud,
  FileText,
  SlidersHorizontal,
  X,
  Globe,
  Radio,
  Gamepad2,
  Compass,
  Monitor,
  Users,
  Box,
  Layers3,
  Award,
  Bell,
} from 'lucide-react';

const FILTER_DEMO_OPTIONS = [
  { id: 'ALL', label: 'Todas las disciplinas' },
  { id: 'eafc26', label: 'EA FC 26 (11v11)' },
  { id: 'valorant', label: 'VALORANT (5v5)' },
  { id: 'csgo', label: 'Counter-Strike 2 (5v5)' },
  { id: 'lol', label: 'League of Legends (5v5)' },
  { id: 'rocketleague', label: 'Rocket League (3v3)' },
  { id: 'fortnite', label: 'Fortnite (Battle Royale)' },
];

interface MockTeamRow {
  id: string;
  name: string;
  tag: string;
  game: string;
  captain: string;
  country: string;
  elo: number;
  membersCount: number;
  status: 'Activo' | 'En Revisión' | 'Suspendido';
  verified: boolean;
}

type CatalogDiscipline = 'system' | 'valorant' | 'eafc26' | 'csgo' | 'lol' | 'rocketleague' | 'fortnite';

export default function ComponentsShowcasePage() {
  const { language, setLanguage } = useTranslation();

  // 🎮 Discipline & Dual Theming State
  const [selectedDiscipline, setSelectedDiscipline] = useState<CatalogDiscipline>('system');
  const [demoSubnavSection, setDemoSubnavSection] = useState<GameSection>('home');
  const [demoFooterCompact, setDemoFooterCompact] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const isSystemTheme = selectedDiscipline === 'system';
  const activeGame: GameConfig = (!isSystemTheme && GAMES_CATALOG[selectedDiscipline]) ? GAMES_CATALOG[selectedDiscipline] : GAMES_CATALOG.eafc26;
  const activePalette: GameSemanticPalette = isSystemTheme ? SYSTEM_SEMANTIC_PALETTE : activeGame.semanticPalette;

  // 📝 Form State Playground
  const [inputVal, setInputVal] = useState('SrDeLorean');
  const [searchVal, setSearchVal] = useState('');
  const [filterDemoSearch, setFilterDemoSearch] = useState('');
  const [filterDemoGame, setFilterDemoGame] = useState('ALL');
  const [passwordVal, setPasswordVal] = useState('AdminSecret2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [textareaVal, setTextareaVal] = useState('El equipo solicita prórroga de 10 minutos por problemas técnicos en el servidor de partido.');
  const [selectedGameSelect, setSelectedGameSelect] = useState('valorant');
  const [selectedPlatform, setSelectedPlatform] = useState('PC');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('/images/games/eafc26.png');

  // Checkboxes, Toggles & Radios
  const [toggle1, setToggle1] = useState(true);
  const [radioFormat, setRadioFormat] = useState('5v5');
  const [demoPaginationPage, setDemoPaginationPage] = useState(2);

  // 💬 Modals System State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isOAuthModalOpen, setIsOAuthModalOpen] = useState(false);
  const [activeEditingTeam, setActiveEditingTeam] = useState<MockTeamRow | null>(null);

  // CRUD Notifier Hook
  const { crudState, startOperation, endSuccess, endError, resetAlert } = useCrudNotifier();

  // Command bar & filter toolbar state
  const [commandQuery, setCommandQuery] = useState('');
  const [toolbarSearch, setToolbarSearch] = useState('');
  const [toolbarStatus, setToolbarStatus] = useState<'TODOS' | 'EN_VIVO' | 'PROXIMOS' | 'FINALIZADOS'>('TODOS');
  const [toolbarOrg, setToolbarOrg] = useState('');
  const [toolbarTourn, setToolbarTourn] = useState('');
  const [selectedDateStr, setSelectedDateStr] = useState('2026-09-02');
  const [showSkeletonDemo, setShowSkeletonDemo] = useState(false);

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedToken(text);
      setTimeout(() => setCopiedToken(null), 2000);
    }
  };

  // 📊 Mock Data for Production DataTable
  const mockTeamsData: MockTeamRow[] = [
    { id: 'tm-1', name: 'LeguaYork eSports', tag: 'LY', game: 'EA FC 26', captain: 'SrDeLorean', country: 'cl', elo: 1980, membersCount: 16, status: 'Activo', verified: true },
    { id: 'tm-2', name: 'KRÜ Tactical', tag: 'KRU', game: 'VALORANT', captain: 'KeznitPro', country: 'ar', elo: 2450, membersCount: 5, status: 'Activo', verified: true },
    { id: 'tm-3', name: 'Imperial CS2', tag: 'IMP', game: 'CS2 / CS:GO', captain: 'FalleN_N1', country: 'br', elo: 2620, membersCount: 5, status: 'Activo', verified: true },
    { id: 'tm-4', name: 'Isurus Gaming', tag: 'ISG', game: 'League of Legends', captain: 'Seiya_Mid', country: 'mx', elo: 2110, membersCount: 6, status: 'Activo', verified: true },
    { id: 'tm-5', name: 'Furia Rocket', tag: 'FUR', game: 'Rocket League', captain: 'Yanxnz_RL', country: 'br', elo: 2150, membersCount: 3, status: 'Activo', verified: true },
    { id: 'tm-6', name: 'Sangre Nueva FC', tag: 'SN', game: 'EA FC 26', captain: 'ElTanque9', country: 'cl', elo: 1845, membersCount: 18, status: 'Activo', verified: true },
    { id: 'tm-7', name: 'Cyber Wolves eSp', tag: 'CW', game: 'VALORANT', captain: 'Shadow99', country: 'pe', elo: 1540, membersCount: 5, status: 'En Revisión', verified: false },
    { id: 'tm-8', name: 'Alianza Lima eSports', tag: 'AL', game: 'EA FC 26', captain: 'Goleador_PE', country: 'pe', elo: 1720, membersCount: 14, status: 'Activo', verified: true },
    { id: 'tm-9', name: 'Red Viper Squad', tag: 'RVS', game: 'CS2 / CS:GO', captain: 'Tox1c_Banned', country: 've', elo: 1200, membersCount: 4, status: 'Suspendido', verified: false },
  ];

  // DataTable Columns Definition
  const tableColumns: ColumnDef<MockTeamRow>[] = [
    {
      header: 'Equipo / Club',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3 font-sans">
          <div className="size-9 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] flex items-center justify-center font-sans font-black text-xs text-[var(--app-accent)] shadow-sm">
            {row.tag}
          </div>
          <div className="font-sans">
            <div className="font-bold text-[var(--text-heading)] flex items-center gap-1.5 font-sans">
              <span>{row.name}</span>
              <CountryFlag code={row.country} name={row.name} size="sm" />
              {row.verified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            </div>
            <div className="text-[10px] font-sans text-[var(--text-muted)]">ID: {row.id} · {row.country.toUpperCase()}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Disciplina',
      accessorKey: 'game',
      sortable: true,
      cell: (row) => (
        <Badge variant="cyan" is3D className="text-[10px] font-sans">
          {row.game}
        </Badge>
      ),
    },
    {
      header: 'Capitán Oficial',
      accessorKey: 'captain',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2 font-sans text-xs">
          <Avatar fallback={row.captain.slice(0, 2)} size="sm" status="online" />
          <span className="font-bold text-[var(--text-primary)] font-sans">{row.captain}</span>
        </div>
      ),
    },
    {
      header: 'ELO Rating',
      accessorKey: 'elo',
      sortable: true,
      cell: (row) => (
        <span className="font-sans font-black text-xs text-[var(--accent-warning)]">
          {row.elo} PTS
        </span>
      ),
    },
    {
      header: 'Plantilla',
      accessorKey: 'membersCount',
      sortable: true,
      cell: (row) => (
        <span className="font-sans text-xs text-[var(--text-secondary)]">
          {row.membersCount} atletas
        </span>
      ),
    },
    {
      header: 'Estado',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        if (row.status === 'Activo') return <Badge variant="emerald" is3D>Activo</Badge>;
        if (row.status === 'En Revisión') return <Badge variant="gold" is3D>En Revisión</Badge>;
        return <Badge variant="rose" is3D>Suspendido</Badge>;
      },
    },
    {
      header: 'Acciones',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setActiveEditingTeam(row);
              setIsInfoModalOpen(true);
            }}
            title="Ver Ficha"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setActiveEditingTeam(row);
              setIsEditModalOpen(true);
            }}
            title="Editar Equipo"
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              setActiveEditingTeam(row);
              setIsDeleteModalOpen(true);
            }}
            title="Eliminar Equipo"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const tableFilters: FilterOption[] = [
    {
      key: 'game',
      label: 'Disciplina',
      options: [
        { label: 'Todas las disciplinas', value: 'ALL' },
        { label: 'EA FC 26', value: 'EA FC 26' },
        { label: 'VALORANT', value: 'VALORANT' },
        { label: 'CS2 / CS:GO', value: 'CS2 / CS:GO' },
        { label: 'League of Legends', value: 'League of Legends' },
        { label: 'Rocket League', value: 'Rocket League' },
      ],
    },
    {
      key: 'status',
      label: 'Estado',
      options: [
        { label: 'Todos los estados', value: 'ALL' },
        { label: 'Activo', value: 'Activo' },
        { label: 'En Revisión', value: 'En Revisión' },
        { label: 'Suspendido', value: 'Suspendido' },
      ],
    },
  ];

  // Mock Standings for LeagueStandingsTable
  const mockStandings: TeamStanding[] = [
    { name: 'KRÜ Tactical Squad', tag: 'KRU', logoUrl: '/images/games/valorant.png', circuitName: 'Circuito Pro LATAM', competitionName: `${activeGame.name} Champions Cup`, groupName: 'Grupo A', pts: 21, pj: 7, g: 7, e: 0, p: 0, gf: 91, gc: 42, dif: 49, positionChange: 0 },
    { name: 'Leviatán eSports', tag: 'LEV', logoUrl: '/images/games/valorant.png', circuitName: 'Circuito Pro LATAM', competitionName: `${activeGame.name} Champions Cup`, groupName: 'Grupo A', pts: 16, pj: 7, g: 5, e: 1, p: 1, gf: 84, gc: 55, dif: 29, positionChange: 1 },
    { name: 'LeguaYork eSports', tag: 'LY', logoUrl: '/images/games/eafc26.png', circuitName: 'Circuito Pro LATAM', competitionName: `${activeGame.name} Champions Cup`, groupName: 'Grupo A', pts: 13, pj: 7, g: 4, e: 1, p: 2, gf: 72, gc: 60, dif: 12, positionChange: -1 },
    { name: 'Imperial CS2 Pro', tag: 'IMP', logoUrl: '/images/games/csgo.png', circuitName: 'Circuito Pro LATAM', competitionName: `${activeGame.name} Champions Cup`, groupName: 'Grupo A', pts: 10, pj: 7, g: 3, e: 1, p: 3, gf: 65, gc: 68, dif: -3, positionChange: 2 },
    { name: 'Isurus Gaming', tag: 'ISG', logoUrl: '/images/games/lol.webp', circuitName: 'Circuito Pro LATAM', competitionName: `${activeGame.name} Champions Cup`, groupName: 'Grupo A', pts: 4, pj: 7, g: 1, e: 1, p: 5, gf: 44, gc: 80, dif: -36, positionChange: -2 },
  ];

  // Mock Playoff Matches for PlayoffBracket
  const mockPlayoffMatches = [
    { id: 'po-1', round_name: 'Cuartos de final', home_team_name: 'KRÜ Tactical', home_team_tag: 'KRU', away_team_name: 'Isurus Gaming', away_team_tag: 'ISG', score_home: 2, score_away: 0, status: 'FINALIZADO', scheduled_time: '18:00' },
    { id: 'po-2', round_name: 'Cuartos de final', home_team_name: 'Leviatán eSports', home_team_tag: 'LEV', away_team_name: 'Imperial CS2', away_team_tag: 'IMP', score_home: 2, score_away: 1, status: 'FINALIZADO', scheduled_time: '20:00' },
    { id: 'po-3', round_name: 'Semifinal', home_team_name: 'KRÜ Tactical', home_team_tag: 'KRU', away_team_name: 'LeguaYork eSports', away_team_tag: 'LY', score_home: 2, score_away: 1, status: 'FINALIZADO', scheduled_time: '19:00' },
    { id: 'po-4', round_name: 'Semifinal', home_team_name: 'Leviatán eSports', home_team_tag: 'LEV', away_team_name: 'Furia Rocket', away_team_tag: 'FUR', score_home: 2, score_away: 0, status: 'FINALIZADO', scheduled_time: '21:00' },
    { id: 'po-5', round_name: 'Final', home_team_name: 'KRÜ Tactical', home_team_tag: 'KRU', away_team_name: 'Leviatán eSports', away_team_tag: 'LEV', score_home: 3, score_away: 2, status: 'FINALIZADO', scheduled_time: '22:00' },
  ];

  // Mock Calendar Days for DateCarousel
  const mockCalendarDays: CalendarDayItem[] = [
    { dateStr: '2026-08-31', label: 'LUN', dayName: 'Lunes', dayDDMM: '31/08', dayNumber: 31, count: 4 },
    { dateStr: '2026-09-01', label: 'MAR', dayName: 'Martes', dayDDMM: '01/09', dayNumber: 1, count: 6 },
    { dateStr: '2026-09-02', label: 'HOY', dayName: 'Miércoles', dayDDMM: '02/09', dayNumber: 2, count: 12 },
    { dateStr: '2026-09-03', label: 'JUE', dayName: 'Jueves', dayDDMM: '03/09', dayNumber: 3, count: 8 },
    { dateStr: '2026-09-04', label: 'VIE', dayName: 'Viernes', dayDDMM: '04/09', dayNumber: 4, count: 14 },
    { dateStr: '2026-09-05', label: 'SÁB', dayName: 'Sábado', dayDDMM: '05/09', dayNumber: 5, count: 20 },
    { dateStr: '2026-09-06', label: 'DOM', dayName: 'Domingo', dayDDMM: '06/09', dayNumber: 6, count: 18 },
  ];

  // Matchday Mock Demo Item
  const demoMatchReport: MatchdayReportItem = {
    id: 'match-demo-01',
    gameSlug: activeGame.slug,
    gameName: activeGame.name,
    tournamentId: 'tourn-latam-2026',
    tournamentName: `${activeGame.name} Champions Cup LATAM`,
    organizationName: 'TorneosPro Official League',
    homeTeam: 'KRÜ Esports',
    homeTag: 'KRU',
    awayTeam: 'Leviatán',
    awayTag: 'LEV',
    homeScore: 13,
    awayScore: 11,
    status: 'EN_VIVO',
    matchDate: '2026-09-02',
    transmissionTime: '21:00',
    groupJornada: 'GRAN FINAL · BO3',
    proofUrl: '/images/games-background/v2/eafc26-arena.webp',
  };

  // Fixture Match Demo for MatchCard
  const demoFixtureMatch: FixtureMatchItem = {
    id: 'fix-01',
    homeTeam: 'KRÜ Tactical',
    homeTag: 'KRU',
    homeLogoUrl: '/images/games/valorant.png',
    awayTeam: 'Leviatán eSports',
    awayTag: 'LEV',
    awayLogoUrl: '/images/games/valorant.png',
    homeScore: 13,
    awayScore: 11,
    status: 'EN_VIVO',
    transmissionTime: '21:00',
    exactDateDisplay: '02 Sep 2026',
    matchDate: '2026-09-02',
    dayLabel: 'Hoy · 21:00 HS',
    dayNumber: 2,
    circuitName: 'Circuito Pro LATAM',
    competitionName: `${activeGame.name} Major Tournament`,
    groupJornada: 'Jornada 5 · Fase Regular',
  };

  // HUD Sections Directory (14 Categorías Completas)
  const HUD_SECTIONS = [
    { id: 'hud-identity', label: '🎮 Identidad & Paletas', count: '6 juegos' },
    { id: 'hud-themes', label: '🎨 Temas & Design Controls', count: 'Claro/Osc/OLED' },
    { id: 'hud-primitives', label: '🧩 Primitivas UI (2D/3D)', count: '12 botones' },
    { id: 'hud-forms', label: '📝 Formularios & Uploads', count: 'WebP Engine' },
    { id: 'hud-tables', label: '📊 Tablas & DataTable', count: 'V2 Filters' },
    { id: 'hud-tournaments', label: '🏆 Torneos & Fixture', count: 'Tablas/Playoffs' },
    { id: 'hud-matches', label: '⚔️ Módulos de Partidos', count: 'Matchday' },
    { id: 'hud-cards', label: '🎴 Tarjetas Compuestas', count: 'EsportsCard' },
    { id: 'hud-navigation', label: '🧭 Navbars & Footer', count: '3 módulos' },
    { id: 'hud-modals', label: '💬 Diálogos, Modales & OAuth', count: '5 tipos' },
    { id: 'hud-notifications', label: '🔔 Centro de Notificaciones', count: 'Live Notifier' },
    { id: 'hud-3d', label: '🎛️ Holograma & Lab 3D', count: 'Canvas Gyro' },
    { id: 'hud-i18n', label: '🌐 Idioma & Monedas', count: 'ES / EN / PT' },
    { id: 'hud-studio', label: '⚡ Studio UI Evolution', count: 'Mobile Sim' },
  ];

  return (
    <div
      className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] relative font-sans"
      data-game={isSystemTheme ? undefined : selectedDiscipline}
      style={isSystemTheme ? undefined : getGamePortalStyle(activeGame)}
    >
      {/* Toast Notification when token is copied */}
      {copiedToken && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--app-accent)] text-[var(--text-primary)] text-xs font-sans font-bold flex items-center gap-3 shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-sans">¡Código <code>{copiedToken}</code> copiado al portapapeles!</span>
        </div>
      )}

      {/* Global CRUD Live Notifier Notification */}
      <CrudAlertBanner state={crudState} onClose={resetAlert} />

      {/* ── TOP HERO PAGE HEADER ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-6 sm:pt-10 space-y-8">

        <PageHeader
          badgeText="SISTEMA DE DISEÑO INTEGRAL · CATÁLOGO DE PRODUCCIÓN AISLADO"
          badgeIcon={<Sparkles className="size-3.5" />}
          heroIcon={<Layers />}
          title="Catálogo Maestro"
          highlightTitle="de Componentes & Identidad"
          description="Suite de referencia con primitivas 2D/3D, formularios, tablas dinámicas, módulos competitivos, notificaciones, multi-tema e internacionalización por disciplina eSports."
          density="cinematic"
          headingLevel={2}
        >
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-3 shadow-lg backdrop-blur-xl">
            <div className="flex items-center gap-2 border-r border-[var(--border-card)] pr-2">
              <SunMoon className="size-4 text-[var(--accent-cyan)]" />
              <span className="font-sans text-[11px] font-bold uppercase text-[var(--text-muted)]">Tema</span>
            </div>
            <ThemeSwitcher />
            <LanguageSwitcher />
            <NotificationCenter />
          </div>
        </PageHeader>

        {/* Global Disciplines & Dual Theming Quick Bar */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-xl backdrop-blur-xl flex flex-col gap-4 font-sans">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Gamepad2 className="w-5 h-5 text-[var(--app-accent)] shrink-0" />
              <div>
                <span className="text-[10px] font-sans font-black uppercase tracking-wider text-[var(--app-accent)] block">
                  [ DUAL THEMING ENGINE · SIMULADOR MAESTRO 9 COLORES ]
                </span>
                <h3 className="text-sm font-black uppercase text-[var(--text-heading)] font-sans">
                  Seleccionar Contexto Visual para Simular Toda la Suite
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {/* Opción 1: Sistema Base Fuera de GameSlug */}
              <button
                type="button"
                onClick={() => setSelectedDiscipline('system')}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-xs font-bold font-sans transition-all flex items-center gap-2 shrink-0 border cursor-pointer',
                  isSystemTheme
                    ? 'shadow-lg scale-105 border-2 text-[var(--accent-contrast)] bg-[var(--app-accent)] border-white'
                    : 'bg-[var(--bg-subtle)] border-[var(--border-card)] text-[var(--text-secondary)] hover:border-[var(--border-card-hover)]'
                )}
                style={isSystemTheme ? { boxShadow: '0 0 20px rgba(220, 32, 17, 0.45)' } : {}}
              >
                <Trophy className="size-4" />
                <span>🛡️ Sistema Base (TournamentsPro)</span>
              </button>

              {/* Opción 2: Las 6 Disciplinas GameSlug */}
              {Object.values(GAMES_CATALOG).map((g) => {
                const isSelected = selectedDiscipline === g.slug;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedDiscipline(g.slug as CatalogDiscipline)}
                    className={cn(
                      'px-3.5 py-2 rounded-xl text-xs font-bold font-sans transition-all flex items-center gap-2 shrink-0 border cursor-pointer',
                      isSelected
                        ? 'shadow-lg scale-105 border-2 text-white'
                        : 'bg-[var(--bg-subtle)] border-[var(--border-card)] text-[var(--text-secondary)] hover:border-[var(--border-card-hover)]'
                    )}
                    style={
                      isSelected
                        ? {
                            backgroundColor: g.semanticPalette.brandPrimary,
                            borderColor: '#ffffff',
                            boxShadow: `0 0 20px ${g.semanticPalette.brandPrimary}60`,
                          }
                        : {}
                    }
                  >
                    <GameLogo game={g} size="sm" />
                    <span>{g.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tira Visual en Vivo: Los 9 Colores Activos del Contexto */}
          <div className="pt-3 border-t border-[var(--border-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full animate-pulse" style={{ backgroundColor: activePalette.brandPrimary }} />
              <span className="text-xs font-bold text-[var(--text-heading)]">
                {isSystemTheme ? 'Sistema Base Activo (9 Colores Oficiales)' : `GameSlug: /${selectedDiscipline} · ${activeGame.name} (9 Colores Equilibrados)`}
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { name: 'Primary', token: '--app-accent', hex: activePalette.brandPrimary },
                { name: 'Secondary', token: '--app-accent-2', hex: activePalette.brandSecondary },
                { name: 'Deep', token: '--brand-900', hex: activePalette.brandDeep },
                { name: 'Success', token: '--accent-success', hex: activePalette.success },
                { name: 'Warning', token: '--accent-warning', hex: activePalette.warning },
                { name: 'Danger', token: '--accent-crimson', hex: activePalette.danger },
                { name: 'Canvas', token: '--bg-main', hex: activePalette.canvas },
                { name: 'Surface', token: '--bg-card', hex: activePalette.surface },
                { name: 'Border', token: '--border-card', hex: activePalette.border },
              ].map((sw) => (
                <button
                  key={sw.token}
                  type="button"
                  onClick={() => copyToClipboard(sw.hex)}
                  title={`${sw.name}: ${sw.token} (${sw.hex}) - Clic para copiar`}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--bg-main)] border border-[var(--border-card)] hover:border-[var(--app-accent)] transition-all text-[10px] font-sans shrink-0 cursor-pointer"
                >
                  <span className="size-3 rounded-full shrink-0 shadow-inner" style={{ backgroundColor: sw.hex }} />
                  <span className="font-bold text-[var(--text-secondary)]">{sw.name}</span>
                  <code className="text-[9px] text-[var(--text-muted)] font-mono">{sw.hex}</code>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 🚀 STICKY HUD SECTION NAVIGATOR & EXPLORER BAR */}
      <div className="sticky top-0 z-40 my-8 bg-[var(--bg-main)]/95 backdrop-blur-2xl border-y border-[var(--border-card)] shadow-xl font-sans">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">

          <div className="flex items-center gap-2 shrink-0">
            <Compass className="w-4 h-4 text-[var(--accent-cyan)] animate-spin-slow" />
            <span className="text-[11px] font-sans font-black uppercase tracking-widest text-[var(--accent-cyan)] hidden sm:inline">
              HUD EXPLORER:
            </span>
          </div>

          {/* Horizontal Desktop/Tablet Jump Links */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {HUD_SECTIONS.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className="px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-card)] text-[11px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] whitespace-nowrap transition-all flex items-center gap-1.5 font-sans"
              >
                <span>{sec.label}</span>
                <span className="text-[9px] font-sans font-bold px-1.5 py-0.2 rounded-md bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-card)]">
                  {sec.count}
                </span>
              </a>
            ))}
          </div>

          {/* Quick Stats Pill */}
          <div className="hidden lg:flex items-center gap-2 font-sans font-bold text-[10px] text-[var(--text-muted)] shrink-0 pl-2 border-l border-[var(--border-card)]">
            <span className="flex items-center gap-1 text-emerald-400"><Zap className="w-3 h-3" /> 100% COMPONENTES</span>
          </div>

        </div>
      </div>

      {/* ── MAIN CONTENT SECTIONS ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-16 pb-24">

        {/* ════════════════════════════════════════════════════════════════
            1. IDENTIDAD GAMESLUG & PALETAS OFICIALES (5 COLORES)
        ════════════════════════════════════════════════════════════════ */}
        <section id="hud-identity" className="space-y-6 pt-4 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4 font-sans">
            <div>
              <span className="text-[10px] font-sans font-black text-[var(--app-accent)] uppercase tracking-widest block">
                [ 01 · IDENTIDAD VISUAL & ESCENAS ]
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-heading)] uppercase tracking-tight font-sans flex items-center gap-2">
                <Gamepad2 className="w-7 h-7 text-[var(--app-accent)]" />
                Identidad GameSlug: {activeGame.name}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-sans">
                Motivos visuales, banners oficiales, kit de identidad descargable y badges de cada disciplina:
              </p>
            </div>
            <div className="flex items-center gap-2 font-sans">
              <Badge variant="cyan" is3D className="font-sans">{activeGame.category}</Badge>
              <GameSwitcher game={activeGame} compact />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch font-sans">
            <div className="lg:col-span-8">
              <GameIdentityCard game={activeGame} />
            </div>

            <div className="lg:col-span-4 p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] flex flex-col justify-between space-y-5 shadow-xl font-sans">
              <div className="space-y-3 font-sans">
                <div className="flex items-center justify-between font-sans">
                  <span className="text-[10px] font-sans font-black uppercase text-[var(--app-accent)] tracking-wider">
                    [ LOGOS & ESCALABILIDAD ]
                  </span>
                  <Badge variant="violet" is3D className="font-sans">Vector Assets</Badge>
                </div>
                <h3 className="text-sm font-black text-[var(--text-heading)] uppercase font-sans">Logotipos Oficiales ({activeGame.name})</h3>
                <div className="flex items-center justify-around p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-card)] font-sans">
                  <div className="text-center font-sans"><GameLogo game={activeGame} size="sm" /><span className="text-[9px] font-sans font-bold block mt-1">SM (20px)</span></div>
                  <div className="text-center font-sans"><GameLogo game={activeGame} size="md" /><span className="text-[9px] font-sans font-bold block mt-1">MD (32px)</span></div>
                  <div className="text-center font-sans"><GameLogo game={activeGame} size="lg" /><span className="text-[9px] font-sans font-bold block mt-1">LG (48px)</span></div>
                  <div className="text-center font-sans"><GameLogo game={activeGame} size="xl" /><span className="text-[9px] font-sans font-bold block mt-1">XL (64px)</span></div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[var(--border-card)] font-sans">
                <div className="text-[10px] font-sans text-[var(--text-muted)] flex justify-between font-bold">
                  <span>DESCARGADOR TÁCTICO:</span>
                  <span className="text-emerald-400 font-bold">PARACHUTE ENGINE</span>
                </div>
                <ParachuteDownloadButton
                  data={JSON.stringify(activeGame, null, 2)}
                  fileName={`${activeGame.slug}-full-config.json`}
                  label="Descargar Configuración JSON"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* PALETAS OFICIALES DE LOS 6 JUEGOS (5 COLORES EXACTOS CON HEX & RGB) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-card)] pb-3">
              <div>
                <span className="text-[10px] font-sans font-black uppercase text-[var(--app-accent)] tracking-wider block">
                  [ DICCIONARIO CROMÁTICO OFICIAL DE JUEGOS ]
                </span>
                <h3 className="text-base font-black uppercase text-[var(--text-heading)] flex items-center gap-2 font-sans">
                  <Palette className="w-4 h-4 text-[var(--app-accent)]" />
                  Paletas Oficiales de las 6 Disciplinas (5 Colores · Hex & RGB)
                </h3>
              </div>
              <Badge variant="cyan" is3D className="font-sans">6 Disciplinas Oficiales</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 font-sans">
              {Object.values(GAMES_CATALOG).map((gameItem) => {
                const isActive = selectedDiscipline === gameItem.slug;
                return (
                  <div
                    key={gameItem.id}
                    onClick={() => setSelectedDiscipline(gameItem.slug as CatalogDiscipline)}
                    className={cn(
                      'p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 relative group font-sans',
                      isActive
                        ? 'bg-[var(--bg-card-hover)] border-2 shadow-2xl scale-[1.02]'
                        : 'bg-[var(--bg-subtle)] border-[var(--border-card)] hover:border-[var(--border-card-hover)]'
                    )}
                    style={isActive ? { borderColor: gameItem.brandColor, boxShadow: `0 10px 30px -10px ${gameItem.brandColor}40` } : {}}
                  >
                    <div className="flex items-center justify-between font-sans">
                      <div className="flex items-center gap-2.5">
                        <GameLogo game={gameItem} size="sm" />
                        <div>
                          <h4 className="text-xs font-black uppercase text-[var(--text-heading)] font-sans">{gameItem.name}</h4>
                          <span className="text-[10px] font-sans text-[var(--text-muted)]">{gameItem.category}</span>
                        </div>
                      </div>
                      {isActive && <Badge is3D className="font-sans" style={{ backgroundColor: `${gameItem.brandColor}30`, color: '#fff', borderColor: gameItem.brandColor }}>ACTIVO</Badge>}
                    </div>

                    {/* 5 Swatches with Hex & Tooltip */}
                    <div className="space-y-1.5 pt-1 font-sans">
                      <span className="text-[9px] font-sans uppercase text-[var(--text-muted)] font-bold block">
                        5 Colores Oficiales (Clic para copiar Hex):
                      </span>
                      <div className="grid grid-cols-5 gap-1.5 font-sans">
                        {(gameItem.palette || []).map((hex, idx) => (
                          <button
                            key={`${gameItem.slug}-${hex}-${idx}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(hex);
                            }}
                            className="group/swatch relative flex flex-col items-center gap-1 p-1 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] hover:scale-105 transition-all cursor-pointer font-sans"
                            title={`Copiar ${hex}`}
                          >
                            <span
                              className="size-7 sm:size-8 rounded-lg shadow-sm border border-white/10 shrink-0"
                              style={{ backgroundColor: hex }}
                            />
                            <span className="text-[8px] font-sans font-bold text-[var(--text-primary)] uppercase truncate max-w-full">
                              {hex}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            2. TOKENS CSS, TEMAS (CLARO / OSCURO / OLED) & DESIGN CONTROLS
        ════════════════════════════════════════════════════════════════ */}
        <section id="hud-themes" className="space-y-6 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4 font-sans">
            <div>
              <span className="text-[10px] font-sans font-black text-[var(--accent-warning)] uppercase tracking-widest block">
                [ 02 · MULTI-TEMA & CONTROLES GLOBALES ]
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-heading)] uppercase tracking-tight font-sans flex items-center gap-2">
                <Palette className="w-7 h-7 text-[var(--accent-warning)]" />
                Temas (Claro, Oscuro, OLED) & Editor Global
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-sans">
                Inspección de tokens CSS, contraste visual y preferencias de diseño (densidad, radio, desenfoque y animación):
              </p>
            </div>
            <ThemeSwitcher />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans text-xs">
            <div className="p-5 rounded-3xl bg-[#f3f5f7] text-[#23272e] border border-[#1f2937]/15 space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-[#8f0b13]">TEMA CLARO (LIGHT)</span>
                <Badge className="bg-[#8f0b13] text-white">#f3f5f7</Badge>
              </div>
              <h3 className="text-sm font-black uppercase">Blanco Técnico & Borgoña</h3>
              <p className="text-[11px] text-[#4c4f54]">Contraste de alta legibilidad editorial para entornos de día y actas oficiales.</p>
            </div>

            <div className="p-5 rounded-3xl bg-[#111414] text-[#efdfc5] border border-[var(--border-card)] space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-[#dc2011]">TEMA OSCURO (DARK)</span>
                <Badge className="bg-[#dc2011] text-white">#111414</Badge>
              </div>
              <h3 className="text-sm font-black uppercase">Carbón Espacial & Neón</h3>
              <p className="text-[11px] text-[#c6b9a4]">La paleta emblemática de TorneosPro con profundidad en capas y acentos vivos.</p>
            </div>

            <div className="p-5 rounded-3xl bg-[#000000] text-white border border-white/20 space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-[#dc2011]">TEMA OLED (PITCH BLACK)</span>
                <Badge className="bg-[#000000] text-red-500 border border-red-500">#000000</Badge>
              </div>
              <h3 className="text-sm font-black uppercase">Negro Puro & Láser 100%</h3>
              <p className="text-[11px] text-zinc-400">Cero consumo en pantallas OLED y máxima luminancia en los acentos de juego.</p>
            </div>
          </div>

          <DesignControls />
        </section>

        {/* ════════════════════════════════════════════════════════════════
            3. PRIMITIVAS UI (COLECCIÓN COMPLETA 2D Y 3D)
        ════════════════════════════════════════════════════════════════ */}
        <section id="hud-primitives" className="space-y-6 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4 font-sans">
            <div>
              <span className="text-[10px] font-sans font-black text-[var(--accent-success)] uppercase tracking-widest block">
                [ 03 · COLECCIÓN TOTAL DE PRIMITIVAS ]
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-heading)] uppercase tracking-tight font-sans flex items-center gap-2">
                <Sparkles className="w-7 h-7 text-[var(--accent-success)]" />
                Primitivas UI: Botones 2D/3D, Badges, Banderas & Avatares
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-sans">
                Todas las variantes de interacción y presentación visual en sus estados normales, hover, active y loading:
              </p>
            </div>
            <Badge variant="emerald" is3D className="font-sans">100% Componentes Activos</Badge>
          </div>

          {/* 3.1 BOTONES (TODAS LAS 12 VARIANTES Y TAMAÑOS) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
                <Zap className="w-4 h-4 text-[var(--accent-cyan)]" />
                1. Botones Estándar & Botones 3D eSports
              </h3>
              <span className="text-[10px] font-sans font-bold text-[var(--text-muted)]">Variants: 12 · Sizes: sm, md, lg, icon</span>
            </div>

            {/* 2D Standard Buttons */}
            <div className="space-y-2">
              <span className="text-[11px] font-sans font-bold text-[var(--text-muted)] uppercase block">Botones 2D de Sistema:</span>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary Action</Button>
                <Button variant="secondary">Secondary Action</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="danger">Danger Action</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="glass">Glass Button</Button>
                <Button variant="primary" isLoading>Cargando</Button>
                <Button variant="primary" disabled>Deshabilitado</Button>
              </div>
            </div>

            {/* 3D Gaming Action Buttons */}
            <div className="space-y-2 pt-3 border-t border-[var(--border-card)]">
              <span className="text-[11px] font-sans font-bold text-[var(--accent-cyan)] uppercase block">Botones 3D Neón eSports (Efecto Push):</span>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="3d-cyan"><Flame className="w-4 h-4 mr-1.5" /> 3D Cyan Pulse</Button>
                <Button variant="3d-violet"><Crown className="w-4 h-4 mr-1.5" /> 3D Violet Hex</Button>
                <Button variant="3d-emerald"><Shield className="w-4 h-4 mr-1.5" /> 3D Emerald</Button>
                <Button variant="3d-gold"><Trophy className="w-4 h-4 mr-1.5" /> 3D Gold Trophy</Button>
                <Button variant="3d-crimson"><Swords className="w-4 h-4 mr-1.5" /> 3D Crimson Red</Button>
                <Button variant="3d-glass"><Eye className="w-4 h-4 mr-1.5" /> 3D Glass Surface</Button>
              </div>
            </div>

            {/* Button Sizes */}
            <div className="space-y-2 pt-3 border-t border-[var(--border-card)]">
              <span className="text-[11px] font-sans font-bold text-[var(--text-muted)] uppercase block">Escala de Tamaños:</span>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant="primary">Small (sm)</Button>
                <Button size="md" variant="primary">Medium (md)</Button>
                <Button size="lg" variant="primary">Large Hero (lg)</Button>
                <Button size="icon" variant="outline" title="Icon Only"><Plus className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>

          {/* 3.2 BADGES, BANDERAS Y AVATARES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">

            {/* Badges & Country Flags */}
            <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-5 shadow-xl">
              <h3 className="text-sm font-black uppercase text-[var(--text-heading)] flex items-center gap-2 font-sans">
                <Award className="w-4 h-4 text-emerald-400" />
                2. Badges 2D / 3D & Banderas Internacionales
              </h3>

              <div className="space-y-2">
                <span className="text-[11px] font-sans text-[var(--text-muted)] block font-bold">Badges 2D Planos:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="cyan">Cyan</Badge>
                  <Badge variant="violet">Violet</Badge>
                  <Badge variant="emerald">Emerald</Badge>
                  <Badge variant="gold">Gold</Badge>
                  <Badge variant="rose">Crimson</Badge>
                  <Badge variant="slate">Slate</Badge>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[var(--border-card)]">
                <span className="text-[11px] font-sans text-[var(--accent-cyan)] block font-bold">Badges 3D Neón:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="cyan" is3D>★ 3D Cyan</Badge>
                  <Badge variant="violet" is3D>★ 3D Violet</Badge>
                  <Badge variant="emerald" is3D>★ 3D Emerald</Badge>
                  <Badge variant="gold" is3D>★ 3D Gold</Badge>
                  <Badge variant="rose" is3D>★ 3D Crimson</Badge>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[var(--border-card)]">
                <span className="text-[11px] font-sans text-[var(--text-muted)] block font-bold">Banderas CountryFlag (CL, AR, PE, BR, MX, ES, US):</span>
                <div className="flex flex-wrap items-center gap-3">
                  {['cl', 'ar', 'pe', 'br', 'mx', 'es', 'us', 've', 'co', 'uy'].map((c) => (
                    <div key={c} className="flex items-center gap-1.5 font-sans text-xs p-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)]">
                      <CountryFlag code={c} name={c} size="md" />
                      <span className="font-bold uppercase">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Avatars & Position Badges */}
            <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-5 shadow-xl">
              <h3 className="text-sm font-black uppercase text-[var(--text-heading)] flex items-center gap-2 font-sans">
                <Users className="w-4 h-4 text-[var(--accent-violet)]" />
                3. Avatares & Badges de Posición por Juego
              </h3>

              <div className="space-y-2">
                <span className="text-[11px] font-sans text-[var(--text-muted)] block font-bold">Avatares con Estados de Conexión:</span>
                <div className="flex items-center gap-4">
                  <Avatar fallback="DL" size="sm" status="online" />
                  <Avatar fallback="KZ" size="md" status="away" />
                  <Avatar fallback="FN" size="lg" status="offline" />
                  <Avatar fallback="SY" size="xl" status="online" />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[var(--border-card)]">
                <span className="text-[11px] font-sans text-[var(--accent-violet)] block font-bold">Insignias de Posición (EA FC, Valorant, CS2, LoL):</span>
                <div className="flex flex-wrap items-center gap-2">
                  <PositionBadge primaryPosition="MCO" secondaryPosition="DC" brandColor="#077d7e" />
                  <PositionBadge primaryPosition="Duelista" secondaryPosition="Iniciador" brandColor="#ff4654" />
                  <PositionBadge primaryPosition="AWPer" secondaryPosition="IGL" brandColor="#de9b35" />
                  <PositionBadge primaryPosition="MID" secondaryPosition="ADC" brandColor="#d39542" />
                  <PositionBadge primaryPosition="Rotador" brandColor="#00bbff" />
                </div>
              </div>
            </div>

          </div>

          {/* 3.3 ALERTAS & EMPTY STATES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-4 shadow-xl">
              <h3 className="text-sm font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[var(--accent-cyan)]" />
                4. Banners de Alerta (Alert)
              </h3>
              <div className="space-y-3">
                <Alert variant="info" title="Información del Torneo">
                  El período de inscripciones para la Copa Sudamericana cierra en 48 horas.
                </Alert>
                <Alert variant="success" title="Acta Verificada">
                  El resultado del partido ha sido confirmado por ambos capitanes.
                </Alert>
                <Alert variant="warning" title="Advertencia de Fair Play">
                  Un atleta de la plantilla tiene 2 tarjetas amarillas acumuladas.
                </Alert>
                <Alert variant="danger" title="Sanción Disciplinaria">
                  El equipo fue descalificado por incomparecencia injustificada.
                </Alert>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] flex flex-col justify-between shadow-xl">
              <h3 className="text-sm font-black uppercase text-[var(--text-heading)] flex items-center gap-2 mb-4">
                <Box className="w-4 h-4 text-[var(--accent-gold)]" />
                5. Estado Vacío (EmptyState)
              </h3>
              <EmptyState
                icon={<Trophy className="w-8 h-8" />}
                title="No hay torneos activos en este momento"
                description="Actualmente no hay competiciones abiertas para la disciplina seleccionada. Crea un torneo o suscríbete a alertas."
                actionLabel="Crear Primer Torneo"
                onAction={() => setIsCreateModalOpen(true)}
                brandColor={activeGame.brandColor}
              />
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            4. FORMULARIOS, INPUTS, SELECTS, SWITCHES & SUBIDA WEBP
        ════════════════════════════════════════════════════════════════ */}
        <section id="hud-forms" className="space-y-6 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4 font-sans">
            <div>
              <span className="text-[10px] font-sans font-black text-[var(--app-accent)] uppercase tracking-widest block">
                [ 04 · FORMULARIOS & CONTROLES DE ENTRADA ]
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-heading)] uppercase tracking-tight font-sans flex items-center gap-2">
                <FileText className="w-7 h-7 text-[var(--app-accent)]" />
                Formularios, Inputs, Selects, Switches & WebP Upload
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-sans">
                Controles de formulario con validación, iconos, reveladores de contraseña y compresión de imagen WebP:
              </p>
            </div>
            <Badge variant="cyan" is3D className="font-sans">Client-Side WebP</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-xl font-sans">
            {/* Input Standard */}
            <div className="space-y-1 font-sans">
              <label htmlFor="catalog-gamertag" className="text-xs font-bold uppercase text-[var(--text-secondary)] font-sans">Gamertag Oficial (Con Icono)</label>
              <div className="relative group font-sans">
                <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[var(--app-accent)] transition-colors pointer-events-none" />
                <input
                  id="catalog-gamertag"
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="ej. SrDeLorean"
                  className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-[var(--radius-control)] bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent)]/20 font-sans"
                />
              </div>
              <p className="text-[10px] text-[var(--text-muted)] font-sans">Identificador oficial del atleta.</p>
            </div>

            {/* Input Search with Clear */}
            <div className="space-y-1 font-sans">
              <label htmlFor="catalog-search" className="text-xs font-bold uppercase text-[var(--text-secondary)] font-sans">Buscador con Limpieza</label>
              <div className="relative group font-sans">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[var(--app-accent)] transition-colors pointer-events-none" />
                <input
                  id="catalog-search"
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Buscar torneos, atletas..."
                  className="w-full min-h-[46px] pl-10 pr-10 py-2.5 rounded-[var(--radius-control)] bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent)]/20 font-sans"
                />
                {searchVal && (
                  <button type="button" aria-label="Limpiar búsqueda" onClick={() => setSearchVal('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white p-1 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-[var(--text-muted)] font-sans">Filtra con debounce integrado.</p>
            </div>

            {/* Password Reveal */}
            <div className="space-y-1">
              <label htmlFor="catalog-password" className="text-xs font-bold uppercase text-[var(--text-secondary)] font-sans">Contraseña con Revelador</label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[var(--accent-cyan)] transition-colors pointer-events-none" />
                <input
                  id="catalog-password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordVal}
                  onChange={(e) => setPasswordVal(e.target.value)}
                  className="w-full min-h-[46px] pl-10 pr-11 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)] font-sans"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">Mínimo 10 caracteres con número.</p>
            </div>

            {/* Error Input */}
            <div className="space-y-1">
              <label htmlFor="catalog-email-error" className="text-xs font-bold uppercase text-[var(--accent-crimson)] font-sans">Input con Error</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[var(--accent-crimson)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="catalog-email-error"
                  aria-invalid="true"
                  aria-describedby="catalog-email-error-message"
                  type="email"
                  defaultValue="correo-invalido@"
                  className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl bg-[var(--accent-crimson-bg)] border border-[var(--accent-crimson)] text-xs font-semibold text-[var(--text-primary)] font-sans"
                />
              </div>
              <p id="catalog-email-error-message" className="text-[10px] text-[var(--accent-crimson)] font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                El formato de correo es incorrecto.
              </p>
            </div>

            {/* Disabled Input */}
            <div className="space-y-1">
              <label htmlFor="catalog-server-id" className="text-xs font-bold uppercase text-[var(--text-muted)] font-sans">Input Deshabilitado</label>
              <div className="relative opacity-60">
                <Shield className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="catalog-server-id"
                  type="text"
                  disabled
                  value="ID-SUDAMERICA-PRO-2026"
                  className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-bold text-[var(--text-muted)] cursor-not-allowed font-sans"
                />
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">Generado por el servidor de torneo.</p>
            </div>

            {/* Textarea with Character Counter */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label htmlFor="catalog-observations" className="text-xs font-bold uppercase text-[var(--text-secondary)] font-sans">Acta / Observaciones</label>
                <span className="text-[10px] font-sans font-bold text-[var(--text-muted)]">{textareaVal.length}/200</span>
              </div>
              <textarea
                id="catalog-observations"
                rows={2}
                maxLength={200}
                value={textareaVal}
                onChange={(e) => setTextareaVal(e.target.value)}
                className="w-full p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)] resize-none font-sans"
              />
            </div>
          </div>

          {/* Selects, Radios, Switches & ImageUploadCard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-5 shadow-xl">
              <h3 className="text-sm font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[var(--accent-gold)]" />
                Selectores, Radios & Switches Reactivos
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Disciplina eSports"
                  value={selectedGameSelect}
                  onChange={(e) => setSelectedGameSelect(e.target.value)}
                  options={Object.values(GAMES_CATALOG).map((g) => ({ label: g.name, value: g.slug }))}
                />
                <Select
                  label="Plataforma Oficial"
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  options={[
                    { label: 'PC (Competitivo)', value: 'PC' },
                    { label: 'PlayStation 5 (PS5)', value: 'PS5' },
                    { label: 'XBOX Series X/S', value: 'XBOX' },
                    { label: 'Crossplay Habilitado', value: 'CROSSPLAY' },
                  ]}
                />
              </div>

              {/* Competitive Format Radios */}
              <div className="space-y-2 pt-2 border-t border-[var(--border-card)] font-sans">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase font-sans block">
                  Formato de Competición (Radio Group)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-sans" role="radiogroup" aria-label="Formato de competición">
                  {[
                    { id: '11v11', label: '11 vs 11', desc: 'Clubes Pro' },
                    { id: '5v5', label: '5 vs 5', desc: 'Tactical FPS' },
                    { id: '3v3', label: '3 vs 3', desc: 'Vehicular' },
                    { id: '1v1', label: '1 vs 1', desc: 'Duelo Directo' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      role="radio"
                      aria-checked={radioFormat === fmt.id}
                      onClick={() => setRadioFormat(fmt.id)}
                      className={cn(
                        'p-2.5 rounded-xl border text-left transition-all cursor-pointer font-sans',
                        radioFormat === fmt.id
                          ? 'bg-[var(--app-accent)]/15 border-[var(--app-accent)] text-[var(--text-heading)] shadow-md'
                          : 'bg-[var(--bg-subtle)] border-[var(--border-card)] text-[var(--text-muted)] hover:border-[var(--border-card-hover)]'
                      )}
                    >
                      <div className="text-xs font-black font-sans">{fmt.label}</div>
                      <div className="text-[9px] font-sans font-medium">{fmt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Switches */}
              <div className="space-y-3 pt-2 border-t border-[var(--border-card)]">
                <div className="flex items-center justify-between p-2 rounded-xl">
                  <div>
                    <span className="text-xs font-bold text-[var(--text-heading)] block">Modo Transmisión en Vivo</span>
                    <span className="text-[10px] text-[var(--text-muted)]">Oculta datos de árbitros durante el streaming</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={toggle1}
                    aria-label="Modo transmisión en vivo"
                    onClick={() => setToggle1(!toggle1)}
                    className={cn(
                      'relative w-12 h-6.5 rounded-full transition-colors duration-300 p-1 cursor-pointer',
                      toggle1 ? 'bg-[var(--accent-cyan)] shadow-lg' : 'bg-[var(--bg-subtle)] border border-[var(--border-card)]'
                    )}
                  >
                    <div className={cn('size-4.5 rounded-full bg-white transition-transform duration-300 shadow-md', toggle1 ? 'translate-x-5.5' : 'translate-x-0')} />
                  </button>
                </div>
              </div>
            </div>

            {/* ImageUploadCard Demo */}
            <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-4 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3 mb-4">
                  <h3 className="text-sm font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-[var(--accent-cyan)]" />
                    Subida y Optimización WebP (ImageUploadCard)
                  </h3>
                  <Badge variant="cyan" is3D>Client-Side Engine</Badge>
                </div>

                <ImageUploadCard
                  label="Logo Oficial del Club / Organización"
                  subtitle="Compresión automática a 600x600 WebP sin recarga"
                  currentUrl={uploadedImageUrl}
                  fallbackType="logo"
                  brandColor="var(--accent-cyan)"
                  entityName="Demo Club"
                  entityId="demo-1"
                  uploadType="logo"
                  mode="preview"
                  onUploadSuccess={(url, stats) => {
                    setUploadedImageUrl(url);
                    endSuccess(`Logo subido exitosamente: ${stats}`);
                  }}
                />
              </div>

              {/* Social Media Group inputs inside form */}
              <SocialMediaGroup
                twitter="@TorneosPro"
                instagram="@torneospro_latam"
                twitch="torneospro"
                discord="discord.gg/torneospro"
                youtube="TorneosProOficial"
              />
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            5. TABLAS DE DATOS & DATATABLE V2 DE PRODUCCIÓN
        ════════════════════════════════════════════════════════════════ */}
        <section id="hud-tables" className="space-y-6 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4 font-sans">
            <div>
              <span className="text-[10px] font-sans font-black text-[var(--accent-success)] uppercase tracking-widest block">
                [ 05 · TABLAS DE GESTIÓN & DATATABLE ]
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-heading)] uppercase tracking-tight font-sans flex items-center gap-2">
                <Trophy className="w-7 h-7 text-[var(--accent-warning)]" />
                Tablas de Datos, FilterBar & Telemetría
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-sans">
                Componente <code>DataTable</code> con filtros multinivel, ordenación ascendente/descendente, barra de filtros <code>FilterBar</code> y <code>GameExplorerPanel</code>:
              </p>
            </div>
            <Badge variant="emerald" is3D className="font-sans">DataTable V2 Activo</Badge>
          </div>

          {/* FilterBar & GameExplorerPanel Demo */}
          <div className="space-y-4">
            <FilterBar
              searchValue={filterDemoSearch}
              onSearchChange={setFilterDemoSearch}
              options={FILTER_DEMO_OPTIONS}
              activeFilter={filterDemoGame}
              onFilterChange={setFilterDemoGame}
              count={mockTeamsData.length}
              brandColor={activeGame.brandColor}
            />

            <GameExplorerPanel
              title="Panel de Consulta y Filtrado Táctico (GameExplorerPanel)"
              description="Contenedor maestro con fondo reactivo por disciplina y disparador de restablecimiento."
              brandColor={activeGame.brandColor}
              onReset={() => {
                setFilterDemoSearch('');
                setFilterDemoGame('ALL');
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)]">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block font-bold">Filtro Activo</span>
                  <span className="text-xs font-bold text-[var(--text-heading)]">{filterDemoGame}</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)]">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block font-bold">Término de Búsqueda</span>
                  <span className="text-xs font-bold text-[var(--accent-cyan)]">{filterDemoSearch || 'Sin filtro'}</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)]">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block font-bold">Disciplina Base</span>
                  <span className="text-xs font-bold" style={{ color: activeGame.brandColor }}>{activeGame.name}</span>
                </div>
              </div>
            </GameExplorerPanel>
          </div>

          <div className="p-4 sm:p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-2xl space-y-6">
            <DataTable
              columns={tableColumns}
              data={mockTeamsData}
              searchPlaceholder="Buscar por nombre de equipo, tag o capitán..."
              filterOptions={tableFilters}
              defaultPageSize={5}
              brandColor="var(--accent-cyan)"
              ariaLabel="Tabla de equipos eSports"
            />

            {/* Standalone Pagination Demo */}
            <div className="pt-4 border-t border-[var(--border-card)] space-y-2">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase block text-center tracking-wider">
                Componente de Paginación Aislado (Pagination)
              </span>
              <Pagination
                currentPage={demoPaginationPage}
                totalPages={8}
                onPageChange={setDemoPaginationPage}
                brandColor="var(--accent-cyan)"
              />
            </div>
          </div>

          {/* App Primitives: AppMetricCard, AppEntityRow & AppCommandBar */}
          <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-5 shadow-xl">
            <h3 className="text-sm font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
              <Layers3 className="w-4 h-4 text-[var(--accent-cyan)]" />
              Primitivas de Telemetría (AppMetricCard, AppEntityRow & AppCommandBar)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <AppMetricCard label="Torneos Activos" value="12 Copas" detail="3 en fase final" trend="+18%" icon={<Trophy />} tone="gold" />
              <AppMetricCard label="Atletas Registrados" value="1,840" detail="98% verificados" trend="+24%" icon={<Users />} tone="cyan" />
              <AppMetricCard label="Partidos Transmitidos" value="342" detail="14 en vivo ahora" icon={<Radio />} tone="crimson" />
              <AppMetricCard label="Estabilidad del Servidor" value="99.9%" detail="Latencia media 18ms" icon={<Shield />} tone="emerald" />
            </div>

            <AppCommandBar
              value={commandQuery}
              onValueChange={setCommandQuery}
              placeholder="Escribe para buscar equipos, llaves o actas..."
              resultLabel="9 resultados disponibles"
            />
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            6. MÓDULOS DE TORNEOS, CLASIFICACIÓN, PLAYOFFS & FIXTURE
        ════════════════════════════════════════════════════════════════ */}
        <section id="hud-tournaments" className="space-y-6 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4 font-sans">
            <div>
              <span className="text-[10px] font-sans font-black text-[var(--accent-warning)] uppercase tracking-widest block">
                [ 06 · COMPETICIÓN & FIXTURE OFICIAL ]
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-heading)] uppercase tracking-tight font-sans flex items-center gap-2">
                <Trophy className="w-7 h-7 text-[var(--accent-warning)]" />
                Clasificación de Liga, Playoffs, Carrusel & Skeleton
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-sans">
                Visualización de tablas de posiciones con zonas de podio/ascenso, árbol eliminatorio de playoffs y carrusel interactivo de fechas:
              </p>
            </div>
            <Badge variant="gold" is3D className="font-sans">Tournament Engine</Badge>
          </div>

          {/* DateCarousel Component */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
              1. Carrusel Interactivo de Fechas (DateCarousel)
            </span>
            <DateCarousel
              game={activeGame}
              calendarDays={mockCalendarDays}
              selectedDate={selectedDateStr}
              onSelectDate={setSelectedDateStr}
            />
          </div>

          {/* MatchFilterToolbar */}
          <div className="space-y-2 font-sans">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block font-sans">
              2. Barra de Filtros de Encuentros (MatchFilterToolbar)
            </span>
            <MatchFilterToolbar
              game={activeGame}
              searchQuery={toolbarSearch}
              setSearchQuery={setToolbarSearch}
              statusFilter={toolbarStatus}
              setStatusFilter={setToolbarStatus}
              selectedOrgName={toolbarOrg}
              setSelectedOrgName={setToolbarOrg}
              selectedTournName={toolbarTourn}
              setSelectedTournName={setToolbarTourn}
              availableOrgs={[
                { id: 'org-1', name: 'Liga Sudamericana Pro', tag: 'LSP' },
                { id: 'org-2', name: 'Valorant Champions League', tag: 'VCL' },
              ]}
              availableTournaments={[
                { id: 't-1', name: `${activeGame.name} Champions Cup` },
                { id: 't-2', name: `${activeGame.name} Open League` },
              ]}
              totalMatchesCount={48}
            />
          </div>

          {/* LeagueStandingsTable & PlayoffBracket */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 space-y-3">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                3. Tabla de Posiciones y Clasificación (LeagueStandingsTable)
              </span>
              <LeagueStandingsTable
                teams={mockStandings}
                brandColor={activeGame.brandColor}
                groupName="Grupo A · Fase Regular"
                qualifiedCount={2}
              />
            </div>

            <div className="lg:col-span-6 space-y-3">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                4. Árbol Eliminatorio de Llaves (PlayoffBracket)
              </span>
              <div className="p-4 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-xl overflow-x-auto">
                <PlayoffBracket
                  matches={mockPlayoffMatches}
                  brandColor={activeGame.brandColor}
                />
              </div>
            </div>
          </div>

          {/* TacticalLoadingSkeleton Demo */}
          <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[var(--accent-gold)]" />
                  5. Skeleton de Carga Táctica (TacticalLoadingSkeleton)
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">Animación shimmer con logotipo vectorial e iluminación de arena:</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowSkeletonDemo(!showSkeletonDemo)}>
                {showSkeletonDemo ? 'Ocultar Skeleton' : 'Simular Carga'}
              </Button>
            </div>

            {showSkeletonDemo && (
              <div className="pt-2 border-t border-[var(--border-card)] animate-in fade-in duration-300">
                <TacticalLoadingSkeleton game={activeGame} message={`Sincronizando directiva de ${activeGame.name}...`} />
              </div>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            7. MÓDULOS DE PARTIDOS (MATCHDAY & MATCHCARD)
        ════════════════════════════════════════════════════════════════ */}
        <section id="hud-matches" className="space-y-6 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4 font-sans">
            <div>
              <span className="text-[10px] font-sans font-black text-[var(--accent-crimson)] uppercase tracking-widest block">
                [ 07 · MÓDULOS DE PARTIDOS ]
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-heading)] uppercase tracking-tight font-sans flex items-center gap-2">
                <Swords className="w-7 h-7 text-[var(--accent-crimson)]" />
                Módulos de Encuentros: Matchday & MatchCard
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-sans">
                Tarjetas oficiales de partido en tiempo real, actas, zonas horarias y gestión de resultados:
              </p>
            </div>
            <Badge variant="rose" is3D className="font-sans">Match Engine</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Matchday Live Match Card */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                1. Tarjeta de Partido Matchday (MatchdayMatchCard)
              </span>
              <MatchdayMatchCard
                match={demoMatchReport}
                game={activeGame}
                canReport={true}
                canApprove={true}
                onOpenTimezone={(time) => alert(`Zona horaria: ${time} CLT (UTC-3)`)}
                onReport={(m) => alert(`Reportando resultado para partido ${m.id}`)}
                onApprove={(m) => alert(`Aprobando resultado oficial de ${m.tournamentName}`)}
              />
            </div>

            {/* Fixture MatchCard */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                2. Tarjeta de Fixture (MatchCard)
              </span>
              <MatchCard
                match={demoFixtureMatch}
                game={activeGame}
                isAdminOrOrganizer={true}
                isCaptainOrCoach={true}
                onOpenReportModal={(m) => alert(`Abrir reporte de partido: ${m.id}`)}
                onOpenTimezoneModal={(t) => alert(`Horario del partido: ${t} CLT`)}
              />
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            8. TARJETAS COMPUESTAS (ESPORTSCARD & CARD CONTAINERS)
        ════════════════════════════════════════════════════════════════ */}
        <section id="hud-cards" className="space-y-6 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4 font-sans">
            <div>
              <span className="text-[10px] font-sans font-black text-[var(--app-accent)] uppercase tracking-widest block">
                [ 08 · TARJETAS COMPUESTAS ]
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-heading)] uppercase tracking-tight font-sans flex items-center gap-2">
                <Layers className="w-7 h-7 text-[var(--app-accent)]" />
                Tarjetas Compuestas: EsportsCard & Contenedores
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-sans">
                Fichas de rendimiento para organizaciones, atletas, clubes y contenedores estándar `Card`:
              </p>
            </div>
            <Badge variant="cyan" is3D>Card Suite</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* EsportsCard */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                1. Tarjeta Compuesta de Entidad (EsportsCard)
              </span>
              <EsportsCard
                entityType="team"
                gameSlug={activeGame.slug}
                title="KRÜ Tactical Squad"
                subtitle="VALORANT Champions Tour 2026"
                description="Escuadra profesional de shooter táctico 5v5 con clasificación directa a la Gran Final."
                country="Argentina"
                tag="KRU"
                badges={[
                  { text: 'Campeón VCT', variant: 'emerald', pulse: true },
                  { text: 'Top 1 ELO', variant: 'amber' },
                ]}
                stats={[
                  { icon: <Trophy className="w-3.5 h-3.5" />, label: 'TÍTULOS', value: '14' },
                  { icon: <Zap className="w-3.5 h-3.5" />, label: 'WIN RATE', value: '78%', highlight: true },
                  { icon: <Users className="w-3.5 h-3.5" />, label: 'ATLETAS', value: '5' },
                ]}
                progress={{ label: 'Progreso a Playoffs', current: 18, max: 20 }}
                socials={{
                  twitter: 'KRUesports',
                  twitch: 'kruesports',
                  instagram: 'kruesports',
                  discord: 'kru',
                }}
              />
            </div>

            {/* Standard UI Card primitive */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                2. Contenedor de Tarjeta Primitiva (Card)
              </span>
              <Card className="shadow-2xl border border-[var(--border-card)] bg-[var(--bg-card)] overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-[var(--accent-cyan)] to-indigo-500" />
                <CardHeader className="border-b border-[var(--border-card)] bg-[var(--bg-subtle)] pb-4 font-sans">
                  <div className="flex items-center justify-between gap-2 mb-1 font-sans">
                    <span className="text-[10px] font-sans font-black uppercase text-[var(--app-accent)] tracking-widest flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> Directiva Oficial v4.2
                    </span>
                    <Badge variant="cyan" is3D className="font-sans">Vigente 2026</Badge>
                  </div>
                  <CardTitle className="text-base sm:text-lg font-black uppercase tracking-tight font-sans">
                    Reglamento Oficial de Competición
                  </CardTitle>
                  <CardDescription className="text-xs font-sans">
                    Normativa vinculante para atletas, capitanes, árbitros y organizaciones inscritas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4 text-xs font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                    <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-1 font-sans">
                      <span className="text-[10px] font-sans font-bold text-[var(--app-accent)] uppercase block">§ 1. Check-In de Sala</span>
                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-sans">
                        Conexión obligatoria 15 min antes del pitazo inicial con verificación de ID.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-1 font-sans">
                      <span className="text-[10px] font-sans font-bold text-[var(--accent-warning)] uppercase block">§ 2. Pausa Técnica</span>
                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-sans">
                        Hasta 5 minutos por equipo en caso de desconexión o falla de servidor.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-2 font-sans">
                    <span className="text-[10px] font-sans font-bold text-[var(--accent-success)] uppercase block">§ 3. Subida de Actas & Validación</span>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-sans">
                      El capitán ganador debe cargar la captura de pantalla oficial en formato WebP dentro de los 30 minutos posteriores a la conclusión.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--bg-subtle)] border-t border-[var(--border-card)] p-4 font-sans">
                  <span className="text-[10px] font-sans font-bold text-[var(--text-muted)]">Federación Sudamericana eSports</span>
                  <div className="flex items-center gap-2 font-sans">
                    <Button size="sm" variant="outline" className="text-xs font-sans">Ver Estatutos</Button>
                    <Button size="sm" variant="primary" className="text-xs font-sans">Descargar PDF</Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            9. MODALES, DIÁLOGOS, OAUTH & NOTIFICACIONES CRUD EN VIVO
        ════════════════════════════════════════════════════════════════ */}
        <section id="hud-modals" className="space-y-6 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4 font-sans">
            <div>
              <span className="text-[10px] font-sans font-black text-[var(--app-accent)] uppercase tracking-widest block">
                [ 09 · DIÁLOGOS, MODALES & OAUTH ]
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-heading)] uppercase tracking-tight font-sans flex items-center gap-2">
                <Sparkles className="w-7 h-7 text-[var(--app-accent)]" />
                Modales, Confirmaciones Destructivas & OAuth Google
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-sans">
                Interactúa con los modales y simula operaciones CRUD con notificaciones globales en vivo:
              </p>
            </div>
            <Badge variant="violet" is3D>Modal Dialog Suite</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Trigger Modal Crear */}
            <div className="ui-modal-demo-card" data-tone="primary">
              <div className="space-y-1.5">
                <div className="size-10 rounded-2xl bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)] flex items-center justify-center text-[var(--accent-cyan)]">
                  <Plus className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-black text-[var(--text-heading)] uppercase font-display pt-1">Modal Crear</h4>
                <p className="text-xs text-[var(--text-secondary)]">Formulario completo para crear entidades.</p>
              </div>
              <Button variant="primary" size="sm" className="w-full" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Abrir Modal
              </Button>
            </div>

            {/* 2. Trigger Modal Editar */}
            <div className="ui-modal-demo-card" data-tone="warning">
              <div className="space-y-1.5">
                <div className="size-10 rounded-2xl bg-[var(--accent-gold-bg)] border border-[var(--accent-gold)] flex items-center justify-center text-[var(--accent-gold)]">
                  <Edit className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-black text-[var(--text-heading)] uppercase font-display pt-1">Modal Editar</h4>
                <p className="text-xs text-[var(--text-secondary)]">Formulario para modificar datos.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setActiveEditingTeam(mockTeamsData[0]);
                  setIsEditModalOpen(true);
                }}
              >
                <Edit className="w-4 h-4 mr-1.5" /> Abrir Editar
              </Button>
            </div>

            {/* 3. Trigger Modal Eliminar */}
            <div className="ui-modal-demo-card" data-tone="danger">
              <div className="space-y-1.5">
                <div className="size-10 rounded-2xl bg-[var(--accent-crimson-bg)] border border-[var(--accent-crimson)] flex items-center justify-center text-[var(--accent-crimson)]">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-black text-[var(--text-heading)] uppercase font-display pt-1">Diálogo Crítico</h4>
                <p className="text-xs text-[var(--text-secondary)]">Confirmación obligatoria con motivo.</p>
              </div>
              <Button
                variant="danger"
                size="sm"
                className="w-full"
                onClick={() => {
                  setActiveEditingTeam(mockTeamsData[0]);
                  setIsDeleteModalOpen(true);
                }}
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> Abrir Eliminar
              </Button>
            </div>

            {/* 4. Trigger Modal Informativo */}
            <div className="ui-modal-demo-card" data-tone="secondary">
              <div className="space-y-1.5">
                <div className="size-10 rounded-2xl bg-[var(--accent-violet-bg)] border border-[var(--accent-violet)] flex items-center justify-center text-[var(--accent-violet)]">
                  <Info className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-black text-[var(--text-heading)] uppercase font-display pt-1">Modal Info</h4>
                <p className="text-xs text-[var(--text-secondary)]">Ficha detallada de rendimiento.</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => {
                  setActiveEditingTeam(mockTeamsData[0]);
                  setIsInfoModalOpen(true);
                }}
              >
                <Eye className="w-4 h-4 mr-1.5" /> Abrir Ficha
              </Button>
            </div>

            {/* 5. Trigger Google OAuth Modal */}
            <div className="ui-modal-demo-card" data-tone="success">
              <div className="space-y-1.5">
                <div className="size-10 rounded-2xl bg-[var(--accent-emerald-bg)] border border-[var(--accent-emerald)] flex items-center justify-center text-[var(--accent-emerald)]">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-black text-[var(--text-heading)] uppercase font-display pt-1">Google OAuth</h4>
                <p className="text-xs text-[var(--text-secondary)]">Inicio de sesión rápido con Google.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setIsOAuthModalOpen(true)}
              >
                <Lock className="w-4 h-4 mr-1.5" /> Abrir OAuth
              </Button>
            </div>
          </div>

          {/* Notifier Live Triggers */}
          <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-[var(--accent-cyan)]" />
              <div>
                <span className="text-xs font-black text-[var(--text-heading)] uppercase block font-display">Simulador de Alertas Notifier en Tiempo Real</span>
                <span className="text-[11px] text-[var(--text-secondary)]">Dispara eventos con medición de milisegundos:</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  startOperation('Sincronizando con los servidores del torneo');
                  setTimeout(() => endSuccess('¡Partidas sincronizadas con éxito (28ms)!'), 1000);
                }}
              >
                Simular Éxito
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  startOperation('Guardando acta');
                  setTimeout(() => endError('Fallo en la conexión: Servidor de actas ocupado'), 900);
                }}
              >
                Simular Error
              </Button>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            🧭 NAVEGACIÓN Y FOOTER DEL SISTEMA (Navbar, GameSubNavbar, Footer)
        ════════════════════════════════════════════════════════════════ */}
        <section id="hud-navigation" className="space-y-8 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4 font-sans">
            <div>
              <span className="text-[10px] font-sans font-black text-[var(--app-accent)] uppercase tracking-widest block">
                [ NAVEGACIÓN & ESTRUCTURA MAESTRA ]
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-heading)] uppercase tracking-tight font-sans flex items-center gap-2">
                <Compass className="w-7 h-7 text-[var(--app-accent)]" />
                Navbars del Sistema & Footer eSports Multi-Columna
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-sans">
                Estructuras de navegación global y disciplinar sincronizadas con las 9 variables globales del Dual Theming Engine:
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="primary" is3D>Global UI</Badge>
              <Badge variant="secondary">Outfit Typography</Badge>
            </div>
          </div>

          {/* 1. Navbar Principal Global */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase text-[var(--text-heading)] font-sans">
                  1. Navbar Global de Plataforma (TournamentsPro)
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Consume <code className="text-[var(--app-accent)]">var(--app-accent)</code>, tema visual, selector de idiomas y auth state.
                </p>
              </div>
              <Badge variant="neutral">Top Shell 56px</Badge>
            </div>

            <div className="rounded-2xl border border-[var(--border-card)] overflow-hidden shadow-2xl bg-[var(--bg-main)]">
              <Navbar />
            </div>
          </div>

          {/* 2. GameSubNavbar Contextual */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase text-[var(--text-heading)] font-sans">
                  2. Sub-Navbar de Disciplina eSports (GameSubNavbar)
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Navegación secundaria de 10 secciones con scroll horizontal táctil, identificador de disciplina y colores dinámicos de juego:
                </p>
              </div>
              <Badge variant="warning">Contextual GameSlug</Badge>
            </div>

            <div className="rounded-2xl border border-[var(--border-card)] overflow-hidden shadow-2xl bg-[var(--bg-card)] p-2">
              <GameSubNavbar
                game={activeGame}
                activeSection={demoSubnavSection}
                onSelectSection={(sec) => setDemoSubnavSection(sec)}
              />
            </div>
          </div>

          {/* 3. Footer Global del Sistema */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black uppercase text-[var(--text-heading)] font-sans">
                  3. Footer Oficial Multi-Columna & Estado de Infraestructura
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  4 columnas semánticas (Competición, Comunidad, Plataforma, Institucional), telemetría de servidores, redes sociales y WCAG AAA.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={demoFooterCompact ? 'outline' : 'primary'}
                  onClick={() => setDemoFooterCompact(false)}
                >
                  Modo Público Completo
                </Button>
                <Button
                  size="sm"
                  variant={demoFooterCompact ? 'primary' : 'outline'}
                  onClick={() => setDemoFooterCompact(true)}
                >
                  Modo Gestión Compacto
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border-card)] overflow-hidden shadow-2xl bg-[var(--bg-main)]">
              <Footer compact={demoFooterCompact} />
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            10. CENTRO DE NOTIFICACIONES
        ════════════════════════════════════════════════════════════════ */}
        <section id="hud-notifications" className="space-y-6 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4 font-sans">
            <div>
              <span className="text-[10px] font-sans font-black text-[var(--app-accent)] uppercase tracking-widest block">
                [ 10 · CENTRO DE NOTIFICACIONES ]
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-heading)] uppercase tracking-tight font-sans flex items-center gap-2">
                <Bell className="w-7 h-7 text-[var(--app-accent)]" />
                Centro de Alertas & Notificaciones de Torneo (NotificationCenter)
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-sans">
                Bandeja desplegable interactiva con filtro de traspasos, convocatorias de partido y actualizaciones de sistema:
              </p>
            </div>
            <Badge variant="violet" is3D className="font-sans">Live Center</Badge>
          </div>

          <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl font-sans">
            <div className="space-y-1 font-sans">
              <h3 className="text-sm font-black uppercase text-[var(--text-heading)] font-sans">Campana Desplegable Oficial de Notificaciones</h3>
              <p className="text-xs text-[var(--text-secondary)] font-sans">Haz clic en la campana para probar el drawer flotante con lecturas y filtros por categoría.</p>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-card)] flex items-center gap-4 font-sans">
              <span className="text-xs font-sans font-bold text-[var(--text-secondary)]">Disparador:</span>
              <NotificationCenter />
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            11. HOLOGRAMA 3D WIREFRAME
        ════════════════════════════════════════════════════════════════ */}
        <section id="hud-3d" className="space-y-6 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4 font-sans">
            <div>
              <span className="text-[10px] font-sans font-black text-[var(--app-accent)] uppercase tracking-widest block">
                [ 11 · TESTBENCH & SHADERS 3D ]
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-heading)] uppercase tracking-tight font-sans flex items-center gap-2">
                <Trophy className="w-7 h-7 text-[var(--app-accent)]" />
                Holograma 3D Wireframe
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-sans">
                Trofeo tridimensional integrado al sistema visual, sin controles experimentales ni superficies redundantes.
              </p>
            </div>
            <Badge variant="cyan" is3D className="font-sans">Canvas optimizado</Badge>
          </div>

          <div className="ui-hologram-showcase relative grid min-h-[28rem] place-items-center overflow-hidden rounded-[var(--ui-radius-card)] border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-card)] font-sans">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--app-accent)_15%,transparent),transparent_60%)]" />
              <div className="relative flex min-h-[380px] w-full max-w-3xl flex-col items-center justify-center overflow-hidden rounded-[calc(var(--ui-radius-card)-0.25rem)] border border-[var(--border-card)] bg-[var(--bg-main)] p-6 shadow-inner font-sans">
                <span className="absolute top-4 left-4 text-[10px] font-sans font-bold uppercase text-[var(--app-accent)] z-10 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[var(--app-accent)] animate-pulse" />
                  [ HOLOGRAMA 3D WIREFRAME · {activeGame.name.toUpperCase()} ]
                </span>
                <HologramStage3D glowColor={activeGame.brandColor} accentColor={activeGame.accentColor || activeGame.brandColor} size={300} />
                <p className="relative mt-3 max-w-md text-center text-xs leading-relaxed text-[var(--text-secondary)] font-sans">
                  Trofeo tridimensional holográfico optimizado y sincronizado en tiempo real con la paleta de {activeGame.name}.
                </p>
              </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            12. APARTADO DE INTERNACIONALIZACIÓN, IDIOMA & MONEDAS (i18n)
        ════════════════════════════════════════════════════════════════ */}
        <section id="hud-i18n" className="space-y-6 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4 font-sans">
            <div>
              <span className="text-[10px] font-sans font-black text-[var(--app-accent)] uppercase tracking-widest block">
                [ 12 · INTERNACIONALIZACIÓN & LOCALIZACIÓN ]
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-heading)] uppercase tracking-tight font-sans flex items-center gap-2">
                <Globe className="w-7 h-7 text-[var(--app-accent)]" />
                Apartado de Idiomas & Monedas Internacionales
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-sans">
                Conmutador dinámico de idioma (ES 🇪🇸, EN 🇺🇸, PT 🇧🇷) con formato de fechas y monedas oficiales:
              </p>
            </div>
            <LanguageSwitcher />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-xl text-xs">
            {/* ES */}
            <div className={cn('p-5 rounded-2xl border transition-all', language === 'es' ? 'bg-[var(--accent-cyan-bg)] border-[var(--accent-cyan)] shadow-lg' : 'bg-[var(--bg-subtle)] border-[var(--border-card)]')}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-bold font-display">🇪🇸 Español (ES)</span>
                {language === 'es' && <Badge variant="cyan" is3D>Activo</Badge>}
              </div>
              <ul className="space-y-2 text-[11px] text-[var(--text-secondary)]">
                <li><strong>Torneos:</strong> Campeonato Sudamericano</li>
                <li><strong>Fecha:</strong> {new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</li>
                <li><strong>Premio:</strong> {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(15000000)}</li>
              </ul>
              <Button size="sm" variant="outline" className="w-full mt-4" onClick={() => setLanguage('es')}>Seleccionar Español</Button>
            </div>

            {/* EN */}
            <div className={cn('p-5 rounded-2xl border transition-all', language === 'en' ? 'bg-[var(--accent-cyan-bg)] border-[var(--accent-cyan)] shadow-lg' : 'bg-[var(--bg-subtle)] border-[var(--border-card)]')}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-bold font-display">🇺🇸 English (EN)</span>
                {language === 'en' && <Badge variant="cyan" is3D>Active</Badge>}
              </div>
              <ul className="space-y-2 text-[11px] text-[var(--text-secondary)]">
                <li><strong>Tournaments:</strong> South American Championship</li>
                <li><strong>Date:</strong> {new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</li>
                <li><strong>Prize Pool:</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(25000)}</li>
              </ul>
              <Button size="sm" variant="outline" className="w-full mt-4" onClick={() => setLanguage('en')}>Select English</Button>
            </div>

            {/* PT */}
            <div className={cn('p-5 rounded-2xl border transition-all', language === 'pt' ? 'bg-[var(--accent-cyan-bg)] border-[var(--accent-cyan)] shadow-lg' : 'bg-[var(--bg-subtle)] border-[var(--border-card)]')}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-bold font-display">🇧🇷 Português (PT)</span>
                {language === 'pt' && <Badge variant="cyan" is3D>Ativo</Badge>}
              </div>
              <ul className="space-y-2 text-[11px] text-[var(--text-secondary)]">
                <li><strong>Torneios:</strong> Campeonato Sul-Americano</li>
                <li><strong>Data:</strong> {new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</li>
                <li><strong>Premiação:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(120000)}</li>
              </ul>
              <Button size="sm" variant="outline" className="w-full mt-4" onClick={() => setLanguage('pt')}>Selecionar Português</Button>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            13. STUDIO UI EVOLUTION (SIMULADOR DESKTOP & MOBILE)
        ════════════════════════════════════════════════════════════════ */}
        <section id="hud-studio" className="space-y-6 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4 font-sans">
            <div>
              <span className="text-[10px] font-sans font-black text-[var(--accent-warning)] uppercase tracking-widest block">
                [ 13 · LABORATORIO DE EXPERIENCIA GLOBAL ]
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-heading)] uppercase tracking-tight font-sans flex items-center gap-2">
                <Monitor className="w-7 h-7 text-[var(--accent-warning)]" />
                App UI Evolution Studio
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-sans">
                Visualización de jerarquías de interfaz, densidad y simulación en pantallas móviles y de escritorio:
              </p>
            </div>
            <Badge variant="gold" is3D className="font-sans">Studio Live View</Badge>
          </div>

          <AppUiEvolutionStudio />
        </section>

      </div>

      {/* ════════════════════════════════════════════════════════════════
          MODALES ACTIVOS
      ════════════════════════════════════════════════════════════════ */}

      {/* 1. Modal de Creación (ModalForm) */}
      <ModalForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nueva Escuadra eSports"
        subtitle="Registra el club en el circuito oficial y asigna el capitán inicial"
        brandColor="var(--app-accent)"
        submitButtonText="Crear y Registrar Club"
        onSubmit={async (e) => {
          e.preventDefault();
          startOperation('Creando escuadra');
          setIsCreateModalOpen(false);
          setTimeout(() => endSuccess('¡Escuadra creada y capitaneada exitosamente (38ms)!'), 700);
        }}
      >
        <div className="space-y-4 font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
            <div className="space-y-1 font-sans">
              <label className="text-xs font-bold uppercase font-sans">Nombre del Club</label>
              <input required type="text" placeholder="ej. Gladiators Gaming" className="w-full min-h-[44px] px-3.5 py-2 rounded-[var(--radius-control)] bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-semibold focus:outline-none focus:border-[var(--app-accent)] font-sans" />
            </div>
            <div className="space-y-1 font-sans">
              <label className="text-xs font-bold uppercase font-sans">TAG del Club (3-4 letras)</label>
              <input required maxLength={4} type="text" placeholder="ej. GLD" className="w-full min-h-[44px] px-3.5 py-2 rounded-[var(--radius-control)] bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-sans font-black uppercase focus:outline-none focus:border-[var(--app-accent)]" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
            <div className="space-y-1 font-sans">
              <label className="text-xs font-bold uppercase font-sans">Disciplina</label>
              <select className="w-full min-h-[44px] px-3.5 py-2 rounded-[var(--radius-control)] bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-bold focus:outline-none focus:border-[var(--app-accent)] font-sans">
                <option value="valorant">VALORANT (5v5)</option>
                <option value="eafc26">EA FC 26 (Clubes Pro)</option>
                <option value="csgo">CS2 / CS:GO</option>
                <option value="lol">League of Legends</option>
              </select>
            </div>
            <div className="space-y-1 font-sans">
              <label className="text-xs font-bold uppercase font-sans">Gamertag del Capitán</label>
              <input required type="text" placeholder="ej. CapitanPro" className="w-full min-h-[44px] px-3.5 py-2 rounded-[var(--radius-control)] bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-semibold focus:outline-none focus:border-[var(--app-accent)] font-sans" />
            </div>
          </div>
        </div>
      </ModalForm>

      {/* 2. Modal de Edición (ModalForm) */}
      <ModalForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Editar Club: ${activeEditingTeam?.name || 'Equipo'}`}
        subtitle={`ID: ${activeEditingTeam?.id} · Disciplina: ${activeEditingTeam?.game}`}
        brandColor="var(--accent-warning)"
        submitButtonText="Guardar Cambios"
        onSubmit={async (e) => {
          e.preventDefault();
          startOperation('Actualizando club');
          setIsEditModalOpen(false);
          setTimeout(() => endSuccess(`¡Datos de ${activeEditingTeam?.name} actualizados en 31ms!`), 600);
        }}
      >
        <div className="space-y-4 font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
            <div className="space-y-1 font-sans">
              <label className="text-xs font-bold uppercase font-sans">Nombre del Club</label>
              <input defaultValue={activeEditingTeam?.name} type="text" className="w-full min-h-[44px] px-3.5 py-2 rounded-[var(--radius-control)] bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-semibold focus:outline-none focus:border-[var(--accent-warning)] font-sans" />
            </div>
            <div className="space-y-1 font-sans">
              <label className="text-xs font-bold uppercase font-sans">Capitán Designado</label>
              <input defaultValue={activeEditingTeam?.captain} type="text" className="w-full min-h-[44px] px-3.5 py-2 rounded-[var(--radius-control)] bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-semibold focus:outline-none focus:border-[var(--accent-warning)] font-sans" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
            <div className="space-y-1 font-sans">
              <label className="text-xs font-bold uppercase font-sans">Puntos ELO</label>
              <input defaultValue={activeEditingTeam?.elo} type="number" className="w-full min-h-[44px] px-3.5 py-2 rounded-[var(--radius-control)] bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-sans font-bold focus:outline-none focus:border-[var(--accent-warning)]" />
            </div>
            <div className="space-y-1 font-sans">
              <label className="text-xs font-bold uppercase font-sans">Estado</label>
              <select defaultValue={activeEditingTeam?.status} className="w-full min-h-[44px] px-3.5 py-2 rounded-[var(--radius-control)] bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-bold focus:outline-none focus:border-[var(--accent-warning)] font-sans">
                <option value="Activo">Activo</option>
                <option value="En Revisión">En Revisión</option>
                <option value="Suspendido">Suspendido</option>
              </select>
            </div>
          </div>
        </div>
      </ModalForm>

      {/* 3. Modal de Confirmación Destructiva (ConfirmModal) */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={`¿Eliminar definitivamente a ${activeEditingTeam?.name}?`}
        description="Esta acción desvinculará a los atletas y revocará los cupos en torneos activos."
        confirmText="Eliminar Permanentemente"
        variant="danger"
        requireReason={true}
        reasonPlaceholder="Indica el motivo de la expulsión..."
        consequences={[
          'Se eliminarán las estadísticas históricas y ELO del club.',
          'Los atletas pasarán a la Bolsa de Agentes Libres.',
          'Las actas pendientes se declararán por forfeit (3-0).',
        ]}
        onConfirm={async (reason) => {
          startOperation(`Eliminando ${activeEditingTeam?.name}`);
          setTimeout(() => endSuccess(`Club ${activeEditingTeam?.name} eliminado. Motivo: ${reason || 'Sin motivo'}`), 700);
        }}
      />

      {/* 4. Modal Informativo / Ficha Detallada (Modal) */}
      <Modal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title={`Ficha de Club: ${activeEditingTeam?.name || 'Equipo'}`}
        description="Detalle oficial de rendimiento, capitán y miembros registrados en la base de datos."
        size="lg"
      >
        <div className="ui-profile-modal space-y-5 text-xs text-[var(--text-secondary)] font-sans">
          <div className="ui-profile-modal-hero flex flex-col items-center justify-between gap-4 sm:flex-row font-sans">
            <div className="flex items-center gap-3 font-sans">
              <div className="size-12 rounded-2xl bg-[var(--app-accent)]/15 border border-[var(--app-accent)] flex items-center justify-center font-sans font-black text-sm text-[var(--app-accent)]">
                {activeEditingTeam?.tag}
              </div>
              <div className="font-sans">
                <h4 className="text-base font-black text-[var(--text-heading)] uppercase font-sans">{activeEditingTeam?.name}</h4>
                <span className="text-[11px] font-sans font-bold text-[var(--app-accent)]">{activeEditingTeam?.game} · {activeEditingTeam?.status}</span>
              </div>
            </div>

            <div className="text-right font-sans">
              <span className="text-[10px] text-[var(--text-muted)] uppercase block font-sans">Rating ELO</span>
              <span className="text-base font-black text-[var(--accent-warning)] font-sans">{activeEditingTeam?.elo} PTS</span>
            </div>
          </div>

          <div className="ui-profile-modal-metrics grid grid-cols-2 gap-3 font-sans text-center sm:grid-cols-3">
            <div className="font-sans">
              <span className="text-[10px] text-[var(--text-muted)] uppercase block font-sans">Capitán</span>
              <span className="font-bold text-[var(--text-heading)] font-sans">{activeEditingTeam?.captain}</span>
            </div>
            <div className="font-sans">
              <span className="text-[10px] text-[var(--text-muted)] uppercase block font-sans">Plantilla</span>
              <span className="font-bold text-[var(--text-heading)] font-sans">{activeEditingTeam?.membersCount} Atletas</span>
            </div>
            <div className="col-span-2 sm:col-span-1 font-sans">
              <span className="text-[10px] text-[var(--text-muted)] uppercase block font-sans">Verificación</span>
              <span className="font-bold text-[var(--app-positive)] font-sans">{activeEditingTeam?.verified ? 'Verificado' : 'No verificado'}</span>
            </div>
          </div>

          <div className="ui-profile-modal-actions flex flex-col-reverse justify-end gap-2 border-t border-[var(--border-card)] pt-4 sm:flex-row">
            <Button variant="outline" size="sm" onClick={() => setIsInfoModalOpen(false)}>Cerrar Ficha</Button>
            <Button variant="primary" size="sm" onClick={() => { setIsInfoModalOpen(false); setIsEditModalOpen(true); }}>Editar Equipo</Button>
          </div>
        </div>
      </Modal>

      {/* 5. Google OAuth Modal */}
      <GoogleOAuthModal
        isOpen={isOAuthModalOpen}
        onClose={() => setIsOAuthModalOpen(false)}
        mode="preview"
      />

    </div>
  );
}
