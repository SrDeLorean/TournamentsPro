'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Textarea } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Modal } from '@/components/ui/modal';
import { ModalForm } from '@/components/ui/modal-form';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { useCrudNotifier, CrudAlertBanner } from '@/components/ui/crud-alert';
import { ImageUploadCard } from '@/components/ui/image-upload-card';
import { Alert } from '@/components/ui/alert';
import { PositionBadge } from '@/components/ui/position-badge';
import { DataTable, type ColumnDef, type FilterOption } from '@/components/ui/data-table';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Card3D, Card3DItem } from '@/components/3d/card-3d';
import { HologramStage3D } from '@/components/3d/hologram-stage-3d';
import { GameIdentityCard } from '@/components/game/game-identity-card';
import { AppUiEvolutionStudio } from '@/features/design-system/components/app-ui-evolution-studio';
import { GAMES_CATALOG } from '@/lib/games-data';
import {
  Trophy,
  Search,
  Sparkles,
  Send,
  Mail,
  User,
  Palette,
  CheckCircle2,
  Eye,
  EyeOff,
  SunMoon,
  Sliders,
  Copy,
  Check,
  Zap,
  Flame,
  Shield,
  Layers,
  Activity,
  Code2,
  RefreshCw,
  Crown,
  Swords,
  Crosshair,
  AlertTriangle,
  Info,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Plus,
  Edit,
  Trash2,
  Lock,
  UploadCloud,
  FileText,
  SlidersHorizontal,
  ChevronDown,
  X,
  ExternalLink,
} from 'lucide-react';

interface MockTeamRow {
  id: string;
  name: string;
  tag: string;
  game: string;
  captain: string;
  elo: number;
  membersCount: number;
  status: 'Activo' | 'En Revisión' | 'Suspendido';
  verified: boolean;
}

export default function ComponentsShowcasePage() {
  // Navigation & General State
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('eafc26');
  const [selectedGlobalTheme, setSelectedGlobalTheme] = useState<string>('cyan-void');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // 📝 Form State Playground
  const [inputVal, setInputVal] = useState('SrDeLorean');
  const [searchVal, setSearchVal] = useState('');
  const [passwordVal, setPasswordVal] = useState('AdminSecret2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [textareaVal, setTextareaVal] = useState('El equipo solicita prórroga de 10 minutos por problemas técnicos en el servidor de partido.');
  const [selectedGameSelect, setSelectedGameSelect] = useState('eafc26');
  const [selectedPlatform, setSelectedPlatform] = useState('PS5');
  const [selectedRole, setSelectedRole] = useState('MCO');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300');
  
  // Checkboxes & Toggles State
  const [check1, setCheck1] = useState(true);
  const [check2, setCheck2] = useState(false);
  const [toggle1, setToggle1] = useState(true);
  const [toggle2, setToggle2] = useState(false);
  const [radioFormat, setRadioFormat] = useState('11v11');

  // 💬 Modals System State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [activeEditingTeam, setActiveEditingTeam] = useState<MockTeamRow | null>(null);

  // CRUD Notifier Hook
  const { crudState, startOperation, endSuccess, endError, resetAlert } = useCrudNotifier();

  // 🎛️ Interactive 3D Lab Playground State
  const [labTilt, setLabTilt] = useState<number>(12);
  const [labGlare, setLabGlare] = useState<boolean>(true);
  const [labNeon, setLabNeon] = useState<boolean>(true);
  const [labAccent, setLabAccent] = useState<string>('#00F0FF');

  // 🧩 Interactive Primitives Sandbox State
  const [btnLoading, setBtnLoading] = useState<boolean>(false);
  const [btnDisabled, setBtnDisabled] = useState<boolean>(false);
  const [clickCount, setClickCount] = useState<number>(0);

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedToken(text);
      setTimeout(() => setCopiedToken(null), 2000);
    }
  };

  // 📊 Mock Data for Production DataTable
  const mockTeamsData: MockTeamRow[] = [
    { id: 'tm-1', name: 'LeguaYork eSports', tag: 'LY', game: 'EA FC 26', captain: 'SrDeLorean', elo: 1980, membersCount: 16, status: 'Activo', verified: true },
    { id: 'tm-2', name: 'Sangre Nueva FC', tag: 'SN', game: 'EA FC 26', captain: 'ElTanque9', elo: 1845, membersCount: 18, status: 'Activo', verified: true },
    { id: 'tm-3', name: 'KRÜ Tactical', tag: 'KRU', game: 'VALORANT', captain: 'KeznitPro', elo: 2450, membersCount: 5, status: 'Activo', verified: true },
    { id: 'tm-4', name: 'Imperial CS2', tag: 'IMP', game: 'CS2 / CS:GO', captain: 'FalleN_N1', elo: 2620, membersCount: 5, status: 'Activo', verified: true },
    { id: 'tm-5', name: 'Isurus Gaming', tag: 'ISG', game: 'League of Legends', captain: 'Seiya_Mid', elo: 2110, membersCount: 6, status: 'Activo', verified: true },
    { id: 'tm-6', name: 'Furia Rocket', tag: 'FUR', game: 'Rocket League', captain: 'Yanxnz_RL', elo: 2150, membersCount: 3, status: 'Activo', verified: true },
    { id: 'tm-7', name: 'Cyber Wolves eSp', tag: 'CW', game: 'VALORANT', captain: 'Shadow99', elo: 1540, membersCount: 5, status: 'En Revisión', verified: false },
    { id: 'tm-8', name: 'Alianza Lima eSports', tag: 'AL', game: 'EA FC 26', captain: 'Goleador_PE', elo: 1720, membersCount: 14, status: 'Activo', verified: true },
    { id: 'tm-9', name: 'Red Viper Squad', tag: 'RVS', game: 'CS2 / CS:GO', captain: 'Tox1c_Banned', elo: 1200, membersCount: 4, status: 'Suspendido', verified: false },
  ];

  // DataTable Columns Definition
  const tableColumns: ColumnDef<MockTeamRow>[] = [
    {
      header: 'Equipo / Club',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)]/30 flex items-center justify-center font-mono font-black text-xs text-[var(--accent-cyan)]">
            {row.tag}
          </div>
          <div>
            <div className="font-bold text-[var(--text-heading)] flex items-center gap-1.5">
              <span>{row.name}</span>
              {row.verified && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-cyan)] shrink-0" />}
            </div>
            <div className="text-[10px] font-mono text-[var(--text-muted)]">ID: {row.id}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Disciplina',
      accessorKey: 'game',
      sortable: true,
      cell: (row) => (
        <Badge variant="cyan" is3D className="text-[10px]">
          {row.game}
        </Badge>
      ),
    },
    {
      header: 'Capitán',
      accessorKey: 'captain',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2 font-mono text-xs">
          <Avatar fallback={row.captain.slice(0, 2)} size="sm" status="online" />
          <span className="font-bold text-[var(--text-primary)]">{row.captain}</span>
        </div>
      ),
    },
    {
      header: 'ELO',
      accessorKey: 'elo',
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-black text-xs text-[var(--accent-gold)]">
          {row.elo} PTS
        </span>
      ),
    },
    {
      header: 'Plantilla',
      accessorKey: 'membersCount',
      sortable: true,
      cell: (row) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">
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

  // Discipline mock showcase data
  const disciplineDataMap: Record<string, {
    match: { title: string; subtitle: string; teamA: string; teamB: string; score: string; status: string; format: string; modeLabel: string };
    player: { name: string; number: string; role: string; team: string; stats: { label: string; value: string; color: string }[]; rating: string; value: string };
    tournament: { name: string; prize: string; stage: string; teamsCount: string; description: string };
  }> = {
    eafc26: {
      match: {
        title: 'Gran Final Copa de Oro 11v11',
        subtitle: 'Estadio Nacional eSports • Árbitro Oficial VVP',
        teamA: 'San Lorenzo eSports',
        teamB: 'LeguaYork eSp',
        score: '3 - 1',
        status: 'MIN 78\' EN VIVO',
        format: '11v11 Clubes Pro',
        modeLabel: 'Fútbol 11v11',
      },
      player: {
        name: 'SrDeLorean',
        number: '#10',
        role: 'Mediapunta Creativo (MCO)',
        team: 'San Lorenzo eSports',
        stats: [
          { label: 'GOLES', value: '28', color: 'var(--accent-emerald)' },
          { label: 'ASISTENCIAS', value: '19', color: 'var(--accent-cyan)' },
          { label: 'PASES CLAVE', value: '88%', color: 'var(--accent-gold)' },
        ],
        rating: '9.8',
        value: '1,850 PTS ELO',
      },
      tournament: {
        name: 'Superliga Sudamericana 11v11',
        prize: '$15,000 USD',
        stage: 'PLAYOFFS ELITE',
        teamsCount: '32 Clubes',
        description: 'Torneo oficial de Clubes Pro 11v11 con fixture regular y doble eliminación.',
      },
    },
    valorant: {
      match: {
        title: 'Masters Santiago • Upper Finals',
        subtitle: 'Mapa: Ascent • Transmisión Oficial VCT',
        teamA: 'KRÜ Tactical',
        teamB: 'Leviatán Valorant',
        score: '11 - 9',
        status: 'RONDA 21 EN VIVO',
        format: '5v5 Táctico MR24',
        modeLabel: 'FPS 5v5',
      },
      player: {
        name: 'KeznitPro',
        number: '#01',
        role: 'Duelista Principal (Jett / Raze)',
        team: 'KRÜ Tactical',
        stats: [
          { label: 'K / D', value: '1.48', color: 'var(--accent-crimson)' },
          { label: 'ACS', value: '284', color: 'var(--accent-gold)' },
          { label: 'HS %', value: '42%', color: 'var(--accent-cyan)' },
        ],
        rating: '1.52 VLR',
        value: '2,400 PTS RADIANT',
      },
      tournament: {
        name: 'VALORANT Masters Chile',
        prize: '$25,000 USD',
        stage: 'GRAN FINAL',
        teamsCount: '16 Escuadras',
        description: 'El torneo insignia de shooter táctico 5v5 con actas automáticas anti-cheat.',
      },
    },
    csgo: {
      match: {
        title: 'Major Invitational • Gran Final',
        subtitle: 'Mapa: Mirage • Servidores Tickrate 128',
        teamA: 'Imperial CS2',
        teamB: '9z Team Global',
        score: '13 - 10',
        status: 'MAPA 2 EN VIVO',
        format: '5v5 Competitivo MR12',
        modeLabel: 'Shooter 5v5',
      },
      player: {
        name: 'FalleN_N1',
        number: '#05',
        role: 'AWPer Capitán (IGL)',
        team: 'Imperial CS2',
        stats: [
          { label: 'RATING 2.0', value: '1.34', color: 'var(--accent-gold)' },
          { label: 'ADR', value: '92.4', color: 'var(--accent-crimson)' },
          { label: 'CLUTCHES', value: '14 V1', color: 'var(--accent-emerald)' },
        ],
        rating: '1.34 HLTV',
        value: '2,650 ELO FACEIT',
      },
      tournament: {
        name: 'CS2 Americas Major Cup',
        prize: '$20,000 USD',
        stage: 'DECIDER MATCH',
        teamsCount: '24 Equipos',
        description: 'Competición oficial de Counter-Strike 2 con cuadro suizo y llaves eliminatorias.',
      },
    },
    lol: {
      match: {
        title: 'Copa de la Grieta • Semifinal',
        subtitle: 'Grieta del Invocador • Parche Oficial Riot',
        teamA: 'Isurus Gaming',
        teamB: 'Estral Esports',
        score: '2 - 1',
        status: 'JUEGO 4 (BO5)',
        format: '5v5 MOBA',
        modeLabel: 'MOBA 5v5',
      },
      player: {
        name: 'Seiya_Mid',
        number: '#07',
        role: 'Carril Central (Mid Laner)',
        team: 'Isurus Gaming',
        stats: [
          { label: 'KDA', value: '6.8', color: 'var(--accent-cyan)' },
          { label: 'CS / MIN', value: '9.8', color: 'var(--accent-gold)' },
          { label: 'DPM', value: '640', color: 'var(--accent-violet)' },
        ],
        rating: 'CHALLENGER',
        value: '1,120 LP MASTER',
      },
      tournament: {
        name: 'Copa de Campeones LoL LATAM',
        prize: '$18,000 USD',
        stage: 'SEMIFINALES',
        teamsCount: '16 Escuadras',
        description: 'Torneo 5v5 en la Grieta del Invocador con draft de campeones en vivo.',
      },
    },
    rocketleague: {
      match: {
        title: 'Championship Series • Grand Final',
        subtitle: 'DFH Stadium • Modalidad Aérea 3v3',
        teamA: 'Complexity RL',
        teamB: 'Furia Esports',
        score: '4 - 3',
        status: 'OT OVERTIME',
        format: '3v3 Soccar Vehicular',
        modeLabel: 'Soccar 3v3',
      },
      player: {
        name: 'Yanxnz_RL',
        number: '#09',
        role: 'Striker Aéreo / Rotador Global',
        team: 'Furia Esports',
        stats: [
          { label: 'GOLES / P', value: '2.4', color: 'var(--accent-cyan)' },
          { label: 'SALVADAS', value: '3.1', color: 'var(--accent-gold)' },
          { label: 'TIROS', value: '4.8', color: 'var(--accent-emerald)' },
        ],
        rating: 'SUPERSONIC',
        value: '2,150 MMR SSL',
      },
      tournament: {
        name: 'Rocket League Open Series',
        prize: '$12,000 USD',
        stage: 'FINAL DE LLAVES',
        teamsCount: '32 Equipos',
        description: 'Torneo de alta velocidad vehicular 3v3 con repeticiones y goles destacados.',
      },
    },
  };

  const activeGame = GAMES_CATALOG[selectedDiscipline] || GAMES_CATALOG.eafc26;
  const activeDisciplineData = disciplineDataMap[selectedDiscipline] || disciplineDataMap.eafc26;

  // Global Themes List
  const globalThemes = [
    { id: 'cyan-void', name: 'Cyber Void (Recomendada)', primary: 'var(--accent-cyan)', secondary: 'var(--accent-violet)', gold: 'var(--accent-gold)', bg: 'var(--bg-main)', tag: 'Top Recomendación', token: '--accent-cyan' },
    { id: 'gold-apex', name: 'Apex Gold & Titanium', primary: 'var(--accent-gold)', secondary: 'var(--accent-cyan)', gold: '#f59e0b', bg: 'var(--bg-elevated)', tag: 'Champions / Lujo', token: '--accent-gold' },
    { id: 'mint-cyber', name: 'Cyber Mint & Emerald', primary: 'var(--accent-emerald)', secondary: 'var(--accent-violet)', gold: 'var(--accent-gold)', bg: 'var(--bg-subtle)', tag: 'Moderna / Web3', token: '--accent-emerald' },
    { id: 'crimson-val', name: 'Crimson Radiant Pulse', primary: 'var(--accent-crimson)', secondary: 'var(--accent-gold)', gold: 'var(--accent-cyan)', bg: 'var(--bg-main)', tag: 'FPS Táctico', token: '--accent-crimson' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16">
      
      {/* Toast Notification when token is copied */}
      {copiedToken && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--accent-cyan)] text-[var(--text-primary)] text-xs font-mono font-bold flex items-center gap-2.5 shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
          <Check className="w-4 h-4 text-[var(--accent-cyan)]" />
          <span>¡Token <code>{copiedToken}</code> copiado al portapapeles!</span>
        </div>
      )}

      {/* Global CRUD Live Notifier Notification */}
      <CrudAlertBanner state={crudState} onClose={resetAlert} />

      {/* Page Header with Responsive Theme Controls */}
      <div className="border-b border-[var(--border-card)] pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>TournamentsPro · Sistema de Diseño y Catálogo de Componentes</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--text-heading)] uppercase font-display">
            Catálogo Integral de Componentes
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            Explora la suite completa de primitivas, formularios, tablas dinámicas con filtros y ordenamiento, y todos los modales interactivos (crear, editar, eliminar e informativos).
          </p>
        </div>

        {/* Live Theme & Language Switcher Bar */}
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-2 pr-2 border-r border-[var(--border-card)]">
            <SunMoon className="w-4 h-4 text-[var(--accent-cyan)]" />
            <span className="text-[11px] font-mono font-bold text-[var(--text-muted)] uppercase">Tema:</span>
          </div>
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </div>

      {/* 🚀 QUICK HUD SECTION NAVIGATOR */}
      <div className="sticky top-16 z-30 -mx-3.5 px-3.5 py-2.5 bg-[var(--bg-main)]/90 backdrop-blur-xl border-y border-[var(--border-card)] flex items-center gap-2 overflow-x-auto no-scrollbar shadow-md">
        <span className="text-[10px] font-mono font-extrabold text-[var(--accent-cyan)] uppercase tracking-wider pl-1 shrink-0">
          HUD DIRECTORY:
        </span>
        <a href="#ui-studio" className="px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-card)] text-[11px] font-bold text-[var(--text-secondary)] whitespace-nowrap transition-colors">
          ⚡ Studio UI
        </a>
        <a href="#forms" className="px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-card)] text-[11px] font-bold text-[var(--accent-cyan)] whitespace-nowrap transition-colors">
          📝 Formularios & Uploads
        </a>
        <a href="#tables" className="px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-card)] text-[11px] font-bold text-[var(--accent-emerald)] whitespace-nowrap transition-colors">
          📊 Tablas & DataTable
        </a>
        <a href="#modals" className="px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-card)] text-[11px] font-bold text-[var(--accent-violet)] whitespace-nowrap transition-colors">
          💬 Modales & Diálogos
        </a>
        <a href="#lab-3d" className="px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-card)] text-[11px] font-bold text-[var(--text-secondary)] whitespace-nowrap transition-colors">
          🎛️ Laboratorio 3D
        </a>
        <a href="#disciplines" className="px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-card)] text-[11px] font-bold text-[var(--text-secondary)] whitespace-nowrap transition-colors">
          🎮 Disciplinas
        </a>
        <a href="#primitives" className="px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-card)] text-[11px] font-bold text-[var(--text-secondary)] whitespace-nowrap transition-colors">
          🧩 Primitivas
        </a>
      </div>

      {/* ⚡ SECCIÓN 1: APPUIdesignStudio EVOLUCIÓN VISUAL */}
      <div id="ui-studio">
        <AppUiEvolutionStudio />
      </div>

      {/* 📝 SECCIÓN 2: FORMULARIOS, INPUTS, SELECTS, CHECKS, RADIOS & UPLOADS */}
      <section id="forms" className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4">
          <div>
            <span className="text-[10px] font-mono font-black text-[var(--accent-cyan)] uppercase tracking-widest block">
              [ CONTROLES DE FORMULARIO COMPUESTOS ]
            </span>
            <h2 className="text-2xl font-black text-[var(--text-heading)] uppercase tracking-tight font-display flex items-center gap-2">
              <FileText className="w-6 h-6 text-[var(--accent-cyan)]" />
              Formularios, Inputs, Selectores & Subida de Archivos
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Todos los elementos de entrada con sus estados (normal, activo, error, deshabilitado, contraseña con revelador, switches, radios y upload WebP):
            </p>
          </div>

          <Badge variant="cyan" is3D>
            📝 Suite Completa
          </Badge>
        </div>

        {/* Inputs & Textareas Grid */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-6 shadow-xl">
          <h3 className="text-sm font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[var(--accent-cyan)]" />
            1. Campos de Entrada (Inputs & Textareas)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Input Estándar */}
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wider block font-display">
                Gamertag Oficial (Con Icono)
              </label>
              <div className="relative group">
                <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[var(--accent-cyan)] transition-colors pointer-events-none" />
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="ej. SrDeLorean"
                  className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-2 focus:ring-[var(--accent-cyan-bg)] transition-all"
                />
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">Identificador oficial dentro de la plataforma.</p>
            </div>

            {/* Input Buscador con Clear */}
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wider block font-display">
                Buscador con Limpieza Rápida
              </label>
              <div className="relative group">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[var(--accent-cyan)] transition-colors pointer-events-none" />
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Buscar torneos, atletas..."
                  className="w-full min-h-[46px] pl-10 pr-10 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-2 focus:ring-[var(--accent-cyan-bg)] transition-all"
                />
                {searchVal && (
                  <button
                    type="button"
                    onClick={() => setSearchVal('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">Filtra en vivo con debounce integrado.</p>
            </div>

            {/* Password Input con Reveal */}
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wider block font-display">
                Contraseña (Con Ojo de Revelación)
              </label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[var(--accent-cyan)] transition-colors pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordVal}
                  onChange={(e) => setPasswordVal(e.target.value)}
                  className="w-full min-h-[46px] pl-10 pr-11 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-2 focus:ring-[var(--accent-cyan-bg)] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">Mínimo 10 caracteres con número.</p>
            </div>

            {/* Input Estado de Error */}
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-[var(--accent-crimson)] uppercase tracking-wider block font-display">
                Input en Estado de Error
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[var(--accent-crimson)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  defaultValue="correo-invalido@"
                  className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl bg-[var(--accent-crimson-bg)] border border-[var(--accent-crimson)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none ring-2 ring-[var(--accent-crimson)]/30"
                />
              </div>
              <p className="text-[10px] text-[var(--accent-crimson)] font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                El formato del correo electrónico no es válido.
              </p>
            </div>

            {/* Input Deshabilitado */}
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-wider block font-display">
                Input Deshabilitado / Solo Lectura
              </label>
              <div className="relative opacity-60">
                <Shield className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  disabled
                  value="ID-SUDAMERICA-PRO-2026"
                  className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-mono font-bold text-[var(--text-muted)] cursor-not-allowed"
                />
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">Generado automáticamente por el servidor.</p>
            </div>

            {/* Textarea con Contador */}
            <div className="space-y-1 md:col-span-2 lg:col-span-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wider block font-display">
                  Acta / Observaciones
                </label>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">{textareaVal.length}/200</span>
              </div>
              <textarea
                rows={2}
                maxLength={200}
                value={textareaVal}
                onChange={(e) => setTextareaVal(e.target.value)}
                className="w-full p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-2 focus:ring-[var(--accent-cyan-bg)] transition-all resize-none"
              />
            </div>

          </div>
        </div>

        {/* Selects, Checkboxes, Radios & Switches */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Selectores Estilizados */}
          <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-5">
            <h3 className="text-sm font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
              <ChevronDown className="w-4 h-4 text-[var(--accent-gold)]" />
              2. Menús Desplegables & Selects
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider block">
                  Disciplina eSports
                </label>
                <div className="relative">
                  <select
                    value={selectedGameSelect}
                    onChange={(e) => setSelectedGameSelect(e.target.value)}
                    className="w-full min-h-[46px] px-3.5 pr-8 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)] appearance-none cursor-pointer"
                  >
                    {Object.values(GAMES_CATALOG).map((g) => (
                      <option key={g.id} value={g.slug} className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider block">
                  Plataforma Oficial
                </label>
                <div className="relative">
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="w-full min-h-[46px] px-3.5 pr-8 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)] appearance-none cursor-pointer"
                  >
                    <option value="PS5" className="bg-[var(--bg-elevated)]">PS5 (PlayStation 5)</option>
                    <option value="PC" className="bg-[var(--bg-elevated)]">PC (Computadora)</option>
                    <option value="XBOX" className="bg-[var(--bg-elevated)]">XBOX Series / One</option>
                    <option value="CROSSPLAY" className="bg-[var(--bg-elevated)]">CROSSPLAY Universal</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Radio Group: Formato Competitivo */}
            <div className="space-y-2 pt-2">
              <label className="text-[11px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider block">
                Formato de Competición (Radio Group)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: '11v11', label: '11 vs 11', desc: 'Clubes Pro' },
                  { id: '5v5', label: '5 vs 5', desc: 'FPS / MOBA' },
                  { id: '3v3', label: '3 vs 3', desc: 'Vehicular' },
                  { id: '1v1', label: '1 vs 1', desc: 'Duelo Directo' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setRadioFormat(fmt.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      radioFormat === fmt.id
                        ? 'bg-[var(--accent-cyan-bg)] border-[var(--accent-cyan)] text-[var(--text-heading)] shadow-md'
                        : 'bg-[var(--bg-subtle)] border-[var(--border-card)] text-[var(--text-muted)] hover:border-[var(--border-card-hover)]'
                    }`}
                  >
                    <div className="text-xs font-black">{fmt.label}</div>
                    <div className="text-[9px] font-mono">{fmt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Checkboxes & Switches */}
          <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-5">
            <h3 className="text-sm font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)]" />
              3. Checkboxes & Switches Reactivos
            </h3>

            {/* Checkboxes List */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer select-none text-xs text-[var(--text-primary)] font-semibold p-2.5 rounded-xl hover:bg-[var(--bg-subtle)] transition-colors">
                <input
                  type="checkbox"
                  checked={check1}
                  onChange={(e) => setCheck1(e.target.checked)}
                  className="size-4.5 rounded bg-[var(--bg-subtle)] border-[var(--border-card)] text-[var(--accent-cyan)] focus:ring-0 cursor-pointer"
                />
                <span>Habilitar notificaciones de fichajes en tiempo real (Activo)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none text-xs text-[var(--text-primary)] font-semibold p-2.5 rounded-xl hover:bg-[var(--bg-subtle)] transition-colors">
                <input
                  type="checkbox"
                  checked={check2}
                  onChange={(e) => setCheck2(e.target.checked)}
                  className="size-4.5 rounded bg-[var(--bg-subtle)] border-[var(--border-card)] text-[var(--accent-cyan)] focus:ring-0 cursor-pointer"
                />
                <span>Auto-confirmar actas cuando el rival reporte idéntico resultado</span>
              </label>

              <label className="flex items-center gap-3 select-none text-xs text-[var(--text-muted)] font-semibold p-2.5 rounded-xl opacity-60 cursor-not-allowed">
                <input
                  type="checkbox"
                  disabled
                  checked={true}
                  className="size-4.5 rounded bg-[var(--bg-subtle)] border-[var(--border-card)] text-[var(--text-muted)] focus:ring-0 cursor-not-allowed"
                />
                <span>Protección anti-cheat forzada por el servidor de torneo (Bloqueado)</span>
              </label>
            </div>

            {/* eSports Switches */}
            <div className="pt-2 border-t border-[var(--border-card)] space-y-3">
              <div className="flex items-center justify-between p-2 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-[var(--text-heading)] block">Modo Transmisión en Vivo</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Oculta datos sensibles de árbitros durante el streaming</span>
                </div>
                <button
                  type="button"
                  onClick={() => setToggle1(!toggle1)}
                  className={`relative w-12 h-6.5 rounded-full transition-colors duration-300 p-1 cursor-pointer ${
                    toggle1 ? 'bg-[var(--accent-cyan)] shadow-[0_0_15px_var(--accent-cyan-bg)]' : 'bg-[var(--bg-subtle)] border border-[var(--border-card)]'
                  }`}
                >
                  <div
                    className={`size-4.5 rounded-full bg-white transition-transform duration-300 shadow-md ${
                      toggle1 ? 'translate-x-5.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-[var(--text-heading)] block">Mercado de Fichajes Abierto</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Permite que capitanes envíen ofertas a tu plantilla</span>
                </div>
                <button
                  type="button"
                  onClick={() => setToggle2(!toggle2)}
                  className={`relative w-12 h-6.5 rounded-full transition-colors duration-300 p-1 cursor-pointer ${
                    toggle2 ? 'bg-[var(--accent-violet)] shadow-[0_0_15px_var(--accent-violet-bg)]' : 'bg-[var(--bg-subtle)] border border-[var(--border-card)]'
                  }`}
                >
                  <div
                    className={`size-4.5 rounded-full bg-white transition-transform duration-300 shadow-md ${
                      toggle2 ? 'translate-x-5.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* 4. Image Upload Card Demo (Live WebP Compression) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-card)] pb-3">
            <div>
              <h3 className="text-sm font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-[var(--accent-cyan)]" />
                4. Subida y Optimización de Archivos WebP (ImageUploadCard)
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Comprime automáticamente cualquier imagen en el navegador a WebP antes de enviarla al servidor.
              </p>
            </div>
            <Badge variant="cyan" is3D>WebP Client-Side Engine</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <ImageUploadCard
              label="Logo Oficial del Club"
              subtitle="Optimización automática a 600x600 WebP"
              currentUrl={uploadedImageUrl}
              fallbackType="logo"
              brandColor="var(--accent-cyan)"
              entityName="Demo Club"
              entityId="demo-1"
              uploadType="logo"
              onUploadSuccess={(url, stats) => {
                setUploadedImageUrl(url);
                endSuccess(`Logo subido exitosamente: ${stats}`);
              }}
            />

            <div className="p-5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-card)] space-y-3 font-mono text-xs">
              <div className="text-[10px] font-black uppercase text-[var(--accent-cyan)] tracking-wider">
                [ CARACTERÍSTICAS DEL MOTOR DE SUBIDA ]
              </div>
              <ul className="space-y-2 text-[11px] text-[var(--text-secondary)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)] shrink-0" />
                  <span>Reducción de hasta un 85% en peso de imagen.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)] shrink-0" />
                  <span>Prevención de desbordes con redimensión máxima inteligente.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)] shrink-0" />
                  <span>Generación de vista previa instantánea sin recargar la página.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 📊 SECCIÓN 3: SISTEMA DE TABLAS DE GESTIÓN (DATATABLE & TABLE) */}
      <section id="tables" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4">
          <div>
            <span className="text-[10px] font-mono font-black text-[var(--accent-emerald)] uppercase tracking-widest block">
              [ SISTEMA DE TABLAS EN PRODUCCIÓN ]
            </span>
            <h2 className="text-2xl font-black text-[var(--text-heading)] uppercase tracking-tight font-display flex items-center gap-2">
              <Trophy className="w-6 h-6 text-[var(--accent-gold)]" />
              Tablas de Gestión & DataTable Oficial
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Componente <code>DataTable</code> con filtros multinivel, ordenamiento ascendente/descendente por columna, paginación integrada y acciones directas:
            </p>
          </div>

          <Badge variant="emerald" is3D>
            ⚡ DataTable V2 Activo
          </Badge>
        </div>

        {/* Real Production DataTable Component */}
        <div className="p-4 sm:p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-2xl space-y-4">
          <DataTable
            columns={tableColumns}
            data={mockTeamsData}
            searchPlaceholder="Buscar por nombre de equipo, tag o capitán..."
            filterOptions={tableFilters}
            defaultPageSize={5}
            brandColor="var(--accent-cyan)"
            ariaLabel="Tabla de equipos eSports"
          />
        </div>
      </section>

      {/* 💬 SECCIÓN 4: TODOS LOS MODALES & DIÁLOGOS DE CONFIRMACIÓN */}
      <section id="modals" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4">
          <div>
            <span className="text-[10px] font-mono font-black text-[var(--accent-violet)] uppercase tracking-widest block">
              [ MODALES, DIÁLOGOS & ALERTAS CRUD ]
            </span>
            <h2 className="text-2xl font-black text-[var(--text-heading)] uppercase tracking-tight font-display flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[var(--accent-violet)]" />
              Sistema Integral de Modales y Diálogos
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Interactúa con los modales de Creación (ModalForm), Edición, Confirmación Destructiva (ConfirmModal) e Informativos con notificaciones en vivo:
            </p>
          </div>

          <Badge variant="violet" is3D>
            💬 Interactive Dialog Suite
          </Badge>
        </div>

        {/* Modal Triggers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Trigger Modal Crear */}
          <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-[var(--accent-cyan)] transition-all flex flex-col justify-between space-y-4 shadow-lg">
            <div className="space-y-1.5">
              <div className="size-10 rounded-2xl bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)] flex items-center justify-center text-[var(--accent-cyan)]">
                <Plus className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-black text-[var(--text-heading)] uppercase font-display pt-1">Modal de Creación</h4>
              <p className="text-xs text-[var(--text-secondary)]">Formulario completo para crear equipos con upload y validación.</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Abrir Modal Crear
            </Button>
          </div>

          {/* 2. Trigger Modal Editar */}
          <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-[var(--accent-gold)] transition-all flex flex-col justify-between space-y-4 shadow-lg">
            <div className="space-y-1.5">
              <div className="size-10 rounded-2xl bg-[var(--accent-gold-bg)] border border-[var(--accent-gold)] flex items-center justify-center text-[var(--accent-gold)]">
                <Edit className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-black text-[var(--text-heading)] uppercase font-display pt-1">Modal de Edición</h4>
              <p className="text-xs text-[var(--text-secondary)]">Formulario pre-cargado para modificar datos de una entidad.</p>
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
              <Edit className="w-4 h-4 mr-1.5" />
              Abrir Modal Editar
            </Button>
          </div>

          {/* 3. Trigger Modal Eliminar */}
          <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-[var(--accent-crimson)] transition-all flex flex-col justify-between space-y-4 shadow-lg">
            <div className="space-y-1.5">
              <div className="size-10 rounded-2xl bg-[var(--accent-crimson-bg)] border border-[var(--accent-crimson)] flex items-center justify-center text-[var(--accent-crimson)]">
                <Trash2 className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-black text-[var(--text-heading)] uppercase font-display pt-1">Diálogo Destructivo</h4>
              <p className="text-xs text-[var(--text-secondary)]">Confirmación crítica con advertencia, consecuencias y motivo.</p>
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
              <Trash2 className="w-4 h-4 mr-1.5" />
              Abrir Modal Eliminar
            </Button>
          </div>

          {/* 4. Trigger Modal Informativo */}
          <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-[var(--accent-violet)] transition-all flex flex-col justify-between space-y-4 shadow-lg">
            <div className="space-y-1.5">
              <div className="size-10 rounded-2xl bg-[var(--accent-violet-bg)] border border-[var(--accent-violet)] flex items-center justify-center text-[var(--accent-violet)]">
                <Info className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-black text-[var(--text-heading)] uppercase font-display pt-1">Modal Informativo</h4>
              <p className="text-xs text-[var(--text-secondary)]">Acta de partido detallada con estadísticas y sellos oficiales.</p>
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
              <Eye className="w-4 h-4 mr-1.5" />
              Abrir Información
            </Button>
          </div>

        </div>

        {/* Botones de Notificaciones CRUD en Tiempo Real */}
        <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-[var(--accent-cyan)]" />
            <div>
              <span className="text-xs font-black text-[var(--text-heading)] uppercase block">Simulador de Alertas Notifier en Vivo</span>
              <span className="text-[11px] text-[var(--text-muted)]">Dispara eventos con medición de milisegundos y estado global:</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                startOperation('Sincronizando fixture con Riot Games');
                setTimeout(() => endSuccess('¡Partidas sincronizadas con éxito (38ms)!'), 1200);
              }}
            >
              Simular Éxito
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                startOperation('Guardando acta');
                setTimeout(() => endError('Fallo en la conexión: Servidor de actas ocupado'), 1000);
              }}
            >
              Simular Error
            </Button>
          </div>
        </div>
      </section>

      {/* 🎛️ SECCIÓN 5: LABORATORIO INTERACTIVO 3D */}
      <section id="lab-3d" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4">
          <div>
            <span className="text-[10px] font-mono font-black text-[var(--accent-cyan)] uppercase tracking-widest block">
              [ TESTBENCH & PLAYGROUND ]
            </span>
            <h2 className="text-2xl font-black text-[var(--text-heading)] uppercase tracking-tight font-display flex items-center gap-2">
              <Sliders className="w-6 h-6 text-[var(--accent-cyan)]" />
              Laboratorio Interactivo de Tarjetas 3D
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Ajusta la física de inclinación, reflejos holográficos y luces neón en tiempo real:
            </p>
          </div>

          <Badge variant="cyan" is3D>
            ⚡ Live Controller
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-5 shadow-xl">
            <h3 className="text-sm font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-cyan)]" />
              Parámetros de Física & Shader
            </h3>

            {/* Slider maxTilt */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--text-secondary)]">Inclinación Máxima (maxTilt):</span>
                <span className="font-bold text-[var(--accent-cyan)]">{labTilt}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={labTilt}
                onChange={(e) => setLabTilt(Number(e.target.value))}
                className="w-full accent-[var(--accent-cyan)] bg-[var(--bg-subtle)] h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Glare & Neon Toggles */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setLabGlare(!labGlare)}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  labGlare
                    ? 'bg-[var(--accent-cyan-bg)] border-[var(--accent-cyan)] text-[var(--accent-cyan)] shadow-md'
                    : 'bg-[var(--bg-subtle)] border-[var(--border-card)] text-[var(--text-muted)]'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Reflejo Glare: {labGlare ? 'ON' : 'OFF'}</span>
              </button>

              <button
                type="button"
                onClick={() => setLabNeon(!labNeon)}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  labNeon
                    ? 'bg-[var(--accent-violet-bg)] border-[var(--accent-violet)] text-[var(--accent-violet)] shadow-md'
                    : 'bg-[var(--bg-subtle)] border-[var(--border-card)] text-[var(--text-muted)]'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Borde Neón: {labNeon ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* Color Accent Picker */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-mono text-[var(--text-secondary)] block">Color Neón Activo:</span>
              <div className="grid grid-cols-6 gap-2">
                {[
                  { color: '#00F0FF', name: 'Cyan' },
                  { color: '#7C8CFF', name: 'Violet' },
                  { color: '#34D399', name: 'Emerald' },
                  { color: '#FF4655', name: 'Crimson' },
                  { color: '#F59E0B', name: 'Gold' },
                  { color: '#C084FC', name: 'Purple' },
                ].map((item) => (
                  <button
                    key={item.color}
                    type="button"
                    onClick={() => setLabAccent(item.color)}
                    className="size-10 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer shadow-md hover:scale-110 active:scale-95"
                    style={{
                      backgroundColor: item.color,
                      borderColor: labAccent === item.color ? '#FFFFFF' : 'transparent',
                    }}
                    title={item.name}
                  >
                    {labAccent === item.color && <Check className="w-4 h-4 text-black drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Snippet */}
            <div className="p-3 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-card)] font-mono text-[11px] text-[var(--text-muted)] space-y-1 relative">
              <div className="flex justify-between items-center pb-1">
                <span className="text-[10px] uppercase font-bold text-[var(--accent-cyan)]">Código JSX resultante</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`<Card3D maxTilt={${labTilt}} glareEffect={${labGlare}} neonBorder={${labNeon}} accentColor="${labAccent}">`)}
                  className="hover:text-[var(--text-primary)] transition-colors p-1"
                  title="Copiar código"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <code className="text-[var(--text-secondary)] block overflow-x-auto whitespace-pre">
                {`<Card3D maxTilt={${labTilt}} glareEffect={${labGlare}} neonBorder={${labNeon}} accentColor="${labAccent}">`}
              </code>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 sm:p-10 rounded-3xl bg-[var(--bg-main)] border border-[var(--border-card)] relative overflow-hidden min-h-[380px]">
            {/* Ambient Back Glow */}
            <div
              className="absolute inset-0 blur-3xl opacity-20 pointer-events-none transition-all duration-500"
              style={{ backgroundColor: labAccent }}
            />

            <Card3D
              maxTilt={labTilt}
              glareEffect={labGlare}
              neonBorder={labNeon}
              accentColor={labAccent}
              className="w-full max-w-md shadow-2xl"
            >
              <div className="p-6 sm:p-8 space-y-5">
                <Card3DItem depth={35}>
                  <div className="flex items-center justify-between">
                    <Badge
                      is3D
                      style={{
                        backgroundColor: `${labAccent}20`,
                        color: labAccent,
                        borderColor: `${labAccent}50`,
                      }}
                    >
                      ★ 3D LIVE TELEMETRY
                    </Badge>
                    <span className="text-[10px] font-mono font-extrabold" style={{ color: labAccent }}>
                      PING 14MS
                    </span>
                  </div>

                  <h4 className="text-xl font-black text-[var(--text-heading)] uppercase tracking-tight font-display mt-2">
                    Tarjeta Reactiva eSports
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Mueve el cursor o toca la pantalla para experimentar el efecto giroscópico y brillo especular.
                  </p>
                </Card3DItem>

                <Card3DItem depth={20}>
                  <div className="grid grid-cols-3 gap-2 text-center font-mono text-[10px]">
                    <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)]">
                      <span className="text-[var(--text-muted)] block font-bold">TILT</span>
                      <span className="font-black text-xs" style={{ color: labAccent }}>{labTilt}°</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)]">
                      <span className="text-[var(--text-muted)] block font-bold">GLARE</span>
                      <span className="font-black text-xs text-[var(--accent-emerald)]">{labGlare ? 'ACTIVO' : 'OFF'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)]">
                      <span className="text-[var(--text-muted)] block font-bold">NEON</span>
                      <span className="font-black text-xs text-[var(--accent-violet)]">{labNeon ? 'ACTIVO' : 'OFF'}</span>
                    </div>
                  </div>
                </Card3DItem>

                <Card3DItem depth={30} className="pt-2">
                  <Button
                    size="sm"
                    className="w-full font-black text-xs uppercase cursor-pointer"
                    style={{
                      backgroundColor: labAccent,
                      color: '#031018',
                      boxShadow: `0 0 25px ${labAccent}40`,
                    }}
                  >
                    <Zap className="w-4 h-4 mr-1.5" />
                    Probar Interacción 3D
                  </Button>
                </Card3DItem>
              </div>
            </Card3D>
          </div>
        </div>
      </section>

      {/* 🎮 SECCIÓN 6: SELECTOR INTERACTIVO DISCIPLINA POR DISCIPLINA */}
      <section id="disciplines" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4">
          <div>
            <span className="text-[10px] font-mono font-black text-[var(--accent-cyan)] uppercase tracking-widest block">
              [ NAVEGACIÓN ENTRE DISCIPLINAS ]
            </span>
            <h2 className="text-2xl font-black text-[var(--text-heading)] uppercase tracking-tight font-display">
              6. Suite de Disciplinas eSports
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Haz clic en cualquier juego para ver cómo reaccionan las tarjetas 3D con la paleta de la disciplina y el tema actual:
            </p>
          </div>

          <Badge variant="cyan" is3D>
            🎮 {activeGame.name} Activo
          </Badge>
        </div>

        {/* Discipline Tabs Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(GAMES_CATALOG).filter(([slug]) => slug !== 'fortnite').map(([slug, game]) => {
            const isSelected = selectedDiscipline === slug;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => setSelectedDiscipline(slug)}
                className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center gap-3 text-left relative overflow-hidden group cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--bg-card-hover)] border-2 shadow-xl scale-[1.03]'
                    : 'bg-[var(--bg-card)] border-[var(--border-card)] hover:border-[var(--border-card-hover)] hover:bg-[var(--bg-card-hover)]'
                }`}
                style={{
                  borderColor: isSelected ? game.brandColor : undefined,
                  boxShadow: isSelected ? `0 10px 25px -5px ${game.brandColor}35` : undefined,
                }}
              >
                <div
                  className="size-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-md"
                  style={{
                    backgroundColor: `${game.brandColor}20`,
                    border: `1px solid ${game.brandColor}50`,
                  }}
                >
                  {game.icon}
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-black text-[var(--text-heading)] uppercase truncate">{game.name}</div>
                  <div className="text-[10px] font-mono text-[var(--text-muted)] truncate">{game.category}</div>
                </div>

                {isSelected && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1"
                    style={{ backgroundColor: game.brandColor }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
          <GameIdentityCard game={activeGame} />
          <div className="glass-panel flex flex-col justify-between gap-5 rounded-3xl p-5 sm:p-6">
            <div>
              <Badge variant="cyan" is3D>Visual System V2</Badge>
              <h3 className="mt-4 text-2xl font-black uppercase tracking-tight">Una identidad, todas las vistas</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                Fondo original, profundidad, retícula, brillo y contraste se heredan desde el gameSlug sin duplicar estilos por página.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <span className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-subtle)] p-3"><b className="block text-[var(--game-brand)]">ESCENA</b>{activeGame.visualTheme.scene}</span>
              <span className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-subtle)] p-3"><b className="block text-[var(--game-accent)]">MOTIVO</b>{activeGame.visualTheme.motif}</span>
            </div>
          </div>
        </div>

        {/* VISTA EN VIVO SUITE 3D DISCIPLINA */}
        <div
          className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] backdrop-blur-xl shadow-2xl space-y-8 relative overflow-hidden transition-all duration-300"
          style={{
            borderColor: `${activeGame.brandColor}40`,
            boxShadow: `0 20px 60px -20px var(--shadow-card), 0 0 40px ${activeGame.brandColor}15`,
          }}
        >
          <div
            className="absolute top-0 right-0 size-96 blur-3xl pointer-events-none rounded-full opacity-20"
            style={{ backgroundColor: activeGame.brandColor }}
          />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4">
            <div className="flex items-center gap-3">
              <div
                className="size-12 rounded-2xl flex items-center justify-center text-2xl shadow-xl"
                style={{
                  backgroundColor: `${activeGame.brandColor}25`,
                  border: `1px solid ${activeGame.brandColor}60`,
                }}
              >
                {activeGame.icon}
              </div>
              <div>
                <span
                  className="text-[10px] font-mono font-black uppercase tracking-widest block"
                  style={{ color: activeGame.brandColor }}
                >
                  [ SUITE 3D OFICIAL • {activeGame.name} ]
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[var(--text-heading)] uppercase tracking-tight font-display">
                  {activeGame.tagline}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                is3D
                style={{
                  backgroundColor: `${activeGame.brandColor}20`,
                  color: activeGame.brandColor,
                  borderColor: `${activeGame.brandColor}50`,
                }}
              >
                Modo: {activeDisciplineData.match.modeLabel}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
            {/* 1. Matchday 3D */}
            <Card3D maxTilt={12} accentColor={activeGame.brandColor} className="h-full">
              <div className="p-6 space-y-5 h-full flex flex-col justify-between">
                <Card3DItem depth={35} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      is3D
                      style={{
                        backgroundColor: `${activeGame.brandColor}20`,
                        color: activeGame.brandColor,
                        borderColor: `${activeGame.brandColor}50`,
                      }}
                    >
                      {activeDisciplineData.match.format}
                    </Badge>
                    <span
                      className="text-[10px] font-mono font-extrabold flex items-center gap-1"
                      style={{ color: activeGame.brandColor }}
                    >
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {activeDisciplineData.match.status}
                    </span>
                  </div>

                  <h4 className="text-lg font-black text-[var(--text-heading)] uppercase tracking-tight font-display">
                    {activeDisciplineData.match.title}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                    {activeDisciplineData.match.subtitle}
                  </p>
                </Card3DItem>

                <Card3DItem depth={25}>
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-card)] flex items-center justify-between font-mono">
                    <div className="flex items-center gap-2">
                      <div
                        className="size-8 rounded-lg flex items-center justify-center font-black text-xs text-white"
                        style={{
                          backgroundColor: `${activeGame.brandColor}40`,
                          border: `1px solid ${activeGame.brandColor}70`,
                        }}
                      >
                        {activeDisciplineData.match.teamA.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-xs text-[var(--text-primary)] truncate max-w-[80px] sm:max-w-[95px]">
                        {activeDisciplineData.match.teamA}
                      </span>
                    </div>

                    <div className="text-center px-2">
                      <span className="text-base font-black" style={{ color: activeGame.brandColor }}>
                        {activeDisciplineData.match.score}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[var(--text-primary)] truncate max-w-[80px] sm:max-w-[95px]">
                        {activeDisciplineData.match.teamB}
                      </span>
                      <div className="size-8 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-card)] flex items-center justify-center font-black text-xs text-[var(--text-primary)]">
                        {activeDisciplineData.match.teamB.slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </Card3DItem>

                <Card3DItem depth={35} className="pt-2">
                  <Button
                    size="sm"
                    className="w-full font-black text-xs uppercase cursor-pointer"
                    style={{
                      backgroundColor: activeGame.brandColor,
                      color: '#FFFFFF',
                      boxShadow: `0 4px 20px ${activeGame.brandColor}40`,
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1.5" />
                    Ver Transmisión 3D
                  </Button>
                </Card3DItem>
              </div>
            </Card3D>

            {/* 2. Athlete 3D */}
            <Card3D maxTilt={12} accentColor={activeGame.accentColor} className="h-full">
              <div className="p-6 space-y-5 h-full flex flex-col justify-between">
                <Card3DItem depth={35} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <PositionBadge primaryPosition={activeDisciplineData.player.role.slice(0, 3)} brandColor={activeGame.accentColor} />
                    <span className="text-[10px] font-mono font-extrabold" style={{ color: activeGame.accentColor }}>
                      {activeDisciplineData.player.value}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <Avatar
                      size="lg"
                      fallback={activeDisciplineData.player.name.slice(0, 2)}
                      status="online"
                      className="border-2"
                      style={{ borderColor: activeGame.accentColor }}
                    />
                    <div>
                      <h4 className="text-lg font-black text-[var(--text-heading)] uppercase tracking-tight">
                        {activeDisciplineData.player.name}{' '}
                        <span className="font-mono text-sm" style={{ color: activeGame.accentColor }}>
                          {activeDisciplineData.player.number}
                        </span>
                      </h4>
                      <span className="text-xs text-[var(--text-secondary)] font-semibold block">
                        {activeDisciplineData.player.role}
                      </span>
                    </div>
                  </div>
                </Card3DItem>

                <Card3DItem depth={20}>
                  <div className="grid grid-cols-3 gap-2 text-center font-mono text-[10px]">
                    {activeDisciplineData.player.stats.map((st) => (
                      <div key={st.label} className="p-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)]">
                        <span className="text-[var(--text-muted)] block font-bold truncate">{st.label}</span>
                        <span className="font-black text-xs" style={{ color: st.color }}>
                          {st.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card3DItem>

                <Card3DItem depth={35} className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full font-black text-xs uppercase cursor-pointer"
                  >
                    <Send className="w-4 h-4 mr-1.5" />
                    Enviar Oferta de Fichaje
                  </Button>
                </Card3DItem>
              </div>
            </Card3D>

            {/* 3. Tournament 3D */}
            <Card3D maxTilt={12} accentColor={activeGame.brandColor} className="h-full">
              <div className="p-6 space-y-5 h-full flex flex-col justify-between">
                <Card3DItem depth={35} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="violet" is3D>Circuito Oficial</Badge>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] font-extrabold">
                      {activeDisciplineData.tournament.teamsCount}
                    </span>
                  </div>

                  <h4 className="text-lg font-black text-[var(--text-heading)] uppercase tracking-tight font-display">
                    {activeDisciplineData.tournament.name}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] font-medium">
                    {activeDisciplineData.tournament.description}
                  </p>
                </Card3DItem>

                <Card3DItem depth={25}>
                  <div className="p-3.5 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-subtle)] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Trophy
                        className="w-5 h-5"
                        style={{ color: activeGame.accentColor || 'var(--accent-gold)' }}
                      />
                      <div>
                        <span className="text-[9px] font-mono uppercase text-[var(--text-muted)] font-bold block">
                          Premio a Repartir
                        </span>
                        <span className="text-sm font-black text-[var(--text-heading)] font-mono">
                          {activeDisciplineData.tournament.prize}
                        </span>
                      </div>
                    </div>

                    <span
                      className="text-[9px] font-mono font-bold px-2 py-1 rounded-md border"
                      style={{
                        backgroundColor: `${activeGame.brandColor}15`,
                        color: activeGame.brandColor,
                        borderColor: `${activeGame.brandColor}40`,
                      }}
                    >
                      {activeDisciplineData.tournament.stage}
                    </span>
                  </div>
                </Card3DItem>

                <Card3DItem depth={35} className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full font-black text-xs uppercase cursor-pointer"
                  >
                    <Trophy className="w-4 h-4 mr-1.5" />
                    Inscribir Escuadra
                  </Button>
                </Card3DItem>
              </div>
            </Card3D>
          </div>
        </div>
      </section>

      {/* 🎨 SECCIÓN 7: SIMULADOR DE PALETAS PARA LA PORTADA PRINCIPAL */}
      <section id="palettes" className="space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-[var(--accent-gold)]" />
            <h2 className="text-xl font-bold text-[var(--text-heading)]">7. Paletas Globales Recomendadas</h2>
          </div>
          <Badge variant="gold" is3D>Global Themes</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {globalThemes.map((theme) => {
            const isSelected = selectedGlobalTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setSelectedGlobalTheme(theme.id)}
                className={`text-left p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-3 relative group cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--bg-card-hover)] border-2 shadow-xl scale-[1.02]'
                    : 'bg-[var(--bg-card)] border-[var(--border-card)] hover:border-[var(--border-card-hover)] hover:bg-[var(--bg-card-hover)]'
                }`}
                style={{
                  borderColor: isSelected ? theme.primary : undefined,
                }}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-card)]">
                      {theme.tag}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4" style={{ color: theme.primary }} />
                    )}
                  </div>
                  <h4 className="text-sm font-black text-[var(--text-heading)] uppercase pt-1">{theme.name}</h4>
                </div>

                <div className="flex items-center gap-1.5 pt-2">
                  <div
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(theme.token); }}
                    className="h-6 flex-1 rounded-md shadow-sm hover:scale-105 transition-transform"
                    style={{ backgroundColor: theme.primary }}
                    title={`Copiar ${theme.token}`}
                  />
                  <div className="h-6 flex-1 rounded-md shadow-sm" style={{ backgroundColor: theme.secondary }} />
                  <div className="h-6 flex-1 rounded-md shadow-sm" style={{ backgroundColor: theme.gold }} />
                  <div className="h-6 flex-1 rounded-md border border-[var(--border-card)] shadow-sm" style={{ backgroundColor: theme.bg }} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══════════════ MODALES ACTIVOS ═══════════════ */}

      {/* 1. Modal de Creación (ModalForm) */}
      <ModalForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nueva Escuadra eSports"
        subtitle="Registra el club en el circuito oficial y asigna el capitán inicial"
        brandColor="var(--accent-cyan)"
        submitButtonText="Crear y Registrar Club"
        onSubmit={async (e) => {
          e.preventDefault();
          startOperation('Creando escuadra');
          setIsCreateModalOpen(false);
          setTimeout(() => endSuccess('¡Escuadra creada y capitaneada exitosamente (42ms)!'), 800);
        }}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-extrabold uppercase">Nombre del Club</label>
              <input required type="text" placeholder="ej. Gladiators Gaming" className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-semibold focus:outline-none focus:border-[var(--accent-cyan)]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-extrabold uppercase">TAG del Club (3-4 letras)</label>
              <input required maxLength={4} type="text" placeholder="ej. GLD" className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-mono font-bold uppercase focus:outline-none focus:border-[var(--accent-cyan)]" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-extrabold uppercase">Disciplina</label>
              <select className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-bold focus:outline-none focus:border-[var(--accent-cyan)]">
                <option value="eafc26">EA FC 26 (Clubes Pro)</option>
                <option value="valorant">VALORANT</option>
                <option value="csgo">CS2 / CS:GO</option>
                <option value="lol">League of Legends</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-extrabold uppercase">Gamertag del Capitán</label>
              <input required type="text" placeholder="ej. CapitanPro" className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-semibold focus:outline-none focus:border-[var(--accent-cyan)]" />
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
        brandColor="var(--accent-gold)"
        submitButtonText="Guardar Cambios"
        onSubmit={async (e) => {
          e.preventDefault();
          startOperation('Actualizando club');
          setIsEditModalOpen(false);
          setTimeout(() => endSuccess(`¡Datos de ${activeEditingTeam?.name} actualizados en 31ms!`), 700);
        }}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-extrabold uppercase">Nombre del Club</label>
              <input defaultValue={activeEditingTeam?.name} type="text" className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-semibold focus:outline-none focus:border-[var(--accent-gold)]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-extrabold uppercase">Capitán Designado</label>
              <input defaultValue={activeEditingTeam?.captain} type="text" className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-semibold focus:outline-none focus:border-[var(--accent-gold)]" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-extrabold uppercase">Puntos ELO</label>
              <input defaultValue={activeEditingTeam?.elo} type="number" className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-mono font-bold focus:outline-none focus:border-[var(--accent-gold)]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-extrabold uppercase">Estado de Participación</label>
              <select defaultValue={activeEditingTeam?.status} className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-bold focus:outline-none focus:border-[var(--accent-gold)]">
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
        description="Esta acción desvinculará a los jugadores de la plantilla y revocará los cupos en torneos activos."
        confirmText="Eliminar Club Permanentemente"
        variant="danger"
        requireReason={true}
        reasonPlaceholder="Indica el motivo de la expulsión o eliminación..."
        consequences={[
          'Se eliminarán las estadísticas históricas y ELO del club.',
          'Los jugadores pasarán automáticamente a la Bolsa de Agentes Libres.',
          'Las actas de partidos anteriores se marcarán con resultado por forfeit (3-0).',
        ]}
        onConfirm={async (reason) => {
          startOperation(`Eliminando ${activeEditingTeam?.name}`);
          setTimeout(() => endSuccess(`Club ${activeEditingTeam?.name} eliminado. Motivo: ${reason || 'Sin motivo'}`), 800);
        }}
      />

      {/* 4. Modal Informativo / Ficha de Partido (Modal) */}
      <Modal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title={`Ficha de Club: ${activeEditingTeam?.name || 'Equipo'}`}
        description="Detalle oficial de rendimiento, capitán y miembros registrados en la base de datos."
        size="lg"
      >
        <div className="space-y-5 text-xs text-[var(--text-secondary)]">
          <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-card)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)] flex items-center justify-center font-mono font-black text-sm text-[var(--accent-cyan)]">
                {activeEditingTeam?.tag}
              </div>
              <div>
                <h4 className="text-base font-black text-[var(--text-heading)] uppercase">{activeEditingTeam?.name}</h4>
                <span className="text-[11px] font-mono text-[var(--accent-cyan)]">{activeEditingTeam?.game} · {activeEditingTeam?.status}</span>
              </div>
            </div>

            <div className="text-right font-mono">
              <span className="text-[10px] text-[var(--text-muted)] uppercase block">Rating ELO</span>
              <span className="text-base font-black text-[var(--accent-gold)]">{activeEditingTeam?.elo} PTS</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-center">
            <div className="p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-card)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase block">Capitán</span>
              <span className="font-bold text-[var(--text-heading)]">{activeEditingTeam?.captain}</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-card)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase block">Plantilla</span>
              <span className="font-bold text-[var(--text-heading)]">{activeEditingTeam?.membersCount} Atletas</span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-card)] col-span-2 sm:col-span-1">
              <span className="text-[10px] text-[var(--text-muted)] uppercase block">Verificación</span>
              <span className="font-bold text-[var(--accent-emerald)]">{activeEditingTeam?.verified ? 'Verificado' : 'No verificado'}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-card)]">
            <Button variant="outline" size="sm" onClick={() => setIsInfoModalOpen(false)}>Cerrar Ficha</Button>
            <Button variant="primary" size="sm" onClick={() => { setIsInfoModalOpen(false); setIsEditModalOpen(true); }}>Editar Equipo</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
