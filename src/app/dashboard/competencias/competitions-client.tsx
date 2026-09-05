'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { GAMES_CATALOG, GAME_MODE_OPTIONS, GameModeOption } from '@/lib/games-data';
import { CompetitionData, createCompetitionAction, updateCompetitionStatusAction, CompetitionStatus } from '@/app/actions/competitions';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { ModalForm } from '@/components/ui/modal-form';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { CrudAlertBanner, useCrudNotifier } from '@/components/ui/crud-alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Plus, Eye, Trash2, Calendar, ClipboardList, Radio, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { getOrganizationSeasonsAction, SeasonData } from '@/app/actions/seasons';
import {
  ManagementHero,
  ManagementMetrics,
  ManagementPage,
  ManagementTabs,
  MetricCard,
} from '@/components/dashboard/management-ui';

interface CompetitionsListClientProps {
  competitions: CompetitionData[];
  allowedGames?: string[];
  userRole?: string;
}

type CompetitionFilter = 'all' | 'Borrador' | 'Inscripcion' | 'En Curso' | 'Finalizada' | 'Eliminada';
type TimeFilter = 'NEWEST' | 'OLDEST' | 'NAME_ASC' | 'NAME_DESC';

export function CompetitionsListClient({ competitions, allowedGames = [], userRole }: CompetitionsListClientProps) {
  const { currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingCompetition, setDeletingCompetition] = useState<CompetitionData | null>(null);
  const [isPending, startTransition] = useTransition();
  const { crudState, startOperation, endSuccess, endError, resetAlert } = useCrudNotifier();

  const [seasons, setSeasons] = useState<SeasonData[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [isCreatingNewSeason, setIsCreatingNewSeason] = useState<boolean>(false);

  const [selectedGameSlug, setSelectedGameSlug] = useState<string>('eafc26');
  const [defaultDates] = useState(() => {
    const now = Date.now();
    const format = (days: number) => new Date(now + 86400000 * days).toISOString().slice(0, 16);
    return { registration: format(3), start: format(5), end: format(30) };
  });
  const organizationId = currentUser?.organizationId;

  // Filtrar disciplinas según los permisos de la Organización del usuario
  const availableGames = React.useMemo(() => {
    const isSuperAdmin = userRole === 'Administrador' || currentUser?.role === 'Administrador';
    if (isSuperAdmin || allowedGames.length === 0) {
      return Object.entries(GAMES_CATALOG);
    }
    return Object.entries(GAMES_CATALOG).filter(([slug]) => allowedGames.includes(slug));
  }, [allowedGames, userRole, currentUser]);

  const currentSelectedGame = availableGames.some(([slug]) => slug === selectedGameSlug)
    ? selectedGameSlug
    : availableGames[0]?.[0] || 'eafc26';

  const activeModes: GameModeOption[] = GAME_MODE_OPTIONS[currentSelectedGame] || [
    { value: '5v5', label: 'Competitivo 5v5 (Equipos)', isIndividual: false },
  ];

  React.useEffect(() => {
    if (isModalOpen) {
      getOrganizationSeasonsAction(organizationId || undefined).then((res) => {
        if (res.success && res.seasons) {
          setSeasons(res.seasons);
          if (res.seasons.length > 0) {
            setSelectedSeasonId((current) => current || res.seasons![0].id);
          }
        }
      });
    }
  }, [isModalOpen, organizationId]);

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;

    startOperation(`Creación de Competencia: ${name}`);

    startTransition(async () => {
      const res = await createCompetitionAction(formData);
      if (res.success) {
        setIsModalOpen(false);
        endSuccess(res.message || 'Competencia registrada exitosamente.');
      } else {
        endError(res.error || 'Error al crear la competencia.');
      }
    });
  };

  const handleStatusChange = (id: string, name: string, currentStatus: CompetitionStatus, targetStatus: CompetitionStatus) => {
    const actionLabel = targetStatus === 'Deshabilitado' ? 'Deshabilitación (Soft Delete)' : `Cambio a ${targetStatus}`;
    startOperation(`${actionLabel} de: ${name}`);

    startTransition(async () => {
      const res = await updateCompetitionStatusAction(id, targetStatus);
      if (res.success) {
        endSuccess(res.message || 'Estado actualizado.');
      } else {
        endError(res.error || 'Error al cambiar estado.');
      }
    });
  };

  const handleDeleteCompetition = async (competition: CompetitionData) => {
    startOperation(`Eliminación de competencia: ${competition.name}`);
    const res = await updateCompetitionStatusAction(competition.id, 'Eliminada');
    if (!res.success) {
      const message = res.error || 'No se pudo eliminar la competencia.';
      endError(message);
      throw new Error(message);
    }
    endSuccess(res.message || `La competencia "${competition.name}" fue eliminada.`);
  };

  const columns: ColumnDef<CompetitionData>[] = [
    {
      header: 'Competencia / Torneo',
      sortable: true,
      accessorKey: 'name',
      cell: (r) => {
        const gameConfig = GAMES_CATALOG[r.game_slug];
        const brandColor = gameConfig?.brandColor || 'var(--app-accent)';
        return (
          <div className="flex items-center gap-3">
            <div
              className="ui-dynamic-brand-tile w-9 h-9 rounded-xl border flex items-center justify-center font-black text-sm"
              style={{ '--ui-dynamic-brand': brandColor } as React.CSSProperties}
            >
              {gameConfig?.icon || '🏆'}
            </div>
            <div>
              <Link href={`/dashboard/competencias/${r.id}`} className="font-black text-[var(--table-cell-heading)] text-xs hover:underline block">
                {r.name}
              </Link>
              <div className="text-[10px] font-[family-name:var(--font-active)] text-[var(--table-cell-muted)]">
                Formato: <strong className="text-[var(--app-accent)]">{r.mode_format}</strong>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Disciplina eSports',
      sortable: true,
      accessorKey: 'game_slug',
      cell: (r) => {
        const gameConfig = GAMES_CATALOG[r.game_slug];
        const gName = gameConfig?.name || r.game_slug;
        const gColor = gameConfig?.brandColor || 'var(--app-accent-2)';
        return (
          <span
            className="ui-dynamic-brand-chip px-2.5 py-1 rounded-md text-[10px] font-[family-name:var(--font-active)] font-black uppercase border"
            style={{ '--ui-dynamic-brand': gColor } as React.CSSProperties}
          >
            {gName}
          </span>
        );
      },
    },
    {
      header: 'Fecha Inicio / Término',
      sortable: true,
      accessorKey: 'fecha_inicio',
      cell: (r) => (
        <div className="text-[11px] font-[family-name:var(--font-active)] text-[var(--table-cell-text)]">
          <div>Inicio: <strong className="text-[var(--app-positive)]">{new Date(r.fecha_inicio).toLocaleDateString('es-ES')}</strong></div>
          <div className="text-[var(--table-cell-muted)] text-[10px]">
            Término: {r.fecha_termino ? new Date(r.fecha_termino).toLocaleDateString('es-ES') : 'TBD (Al concluir)'}
          </div>
        </div>
      ),
    },
    {
      header: 'Estado de la Competencia',
      sortable: true,
      accessorKey: 'status',
      cell: (r) => {
        let label: string = String(r.status);
        let variant: 'cyan' | 'emerald' | 'gold' | 'rose' | 'violet' = 'cyan';

        if (r.status === 'Borrador') {
          label = '📝 Borrador';
          variant = 'gold';
        } else if (r.status === 'Inscripcion') {
          label = '📝 Inscripción';
          variant = 'cyan';
        } else if (r.status === 'En Curso' || r.status === 'Activo') {
          label = '⚡ En Curso';
          variant = 'violet';
        } else if (r.status === 'Finalizada' || r.status === 'Finalizado') {
          label = '🏆 Finalizada';
          variant = 'emerald';
        } else if (r.status === 'Eliminada' || r.status === 'Deshabilitado') {
          label = '🔴 Eliminada';
          variant = 'rose';
        }

        return (
          <Badge variant={variant} className="text-[10px] font-[family-name:var(--font-active)] font-black uppercase">
            {label}
          </Badge>
        );
      },
    },
  ];

  // Sub-tabs & Sorting State
  const [activeTab, setActiveTab] = useState<CompetitionFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('NEWEST');
  const searchTerm = '';

  // Process & filter competitions data
  const processedCompetitions = React.useMemo(() => {
    let result = competitions.filter((comp) => {
      const matchesTab =
        activeTab === 'all'
          ? true
          : activeTab === 'Eliminada'
          ? comp.status === 'Eliminada' || comp.status === 'Deshabilitado'
          : activeTab === 'En Curso'
          ? comp.status === 'En Curso' || comp.status === 'Activo'
          : activeTab === 'Finalizada'
          ? comp.status === 'Finalizada' || comp.status === 'Finalizado'
          : comp.status === activeTab;

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        comp.name.toLowerCase().includes(searchLower) ||
        (comp.game_slug && comp.game_slug.toLowerCase().includes(searchLower)) ||
        (comp.status && comp.status.toLowerCase().includes(searchLower));

      return matchesTab && matchesSearch;
    });

    if (timeFilter === 'OLDEST') {
      result = [...result].reverse();
    } else if (timeFilter === 'NAME_ASC') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (timeFilter === 'NAME_DESC') {
      result = [...result].sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [competitions, activeTab, timeFilter, searchTerm]);

  return (
    <ManagementPage>
      <ManagementHero
        eyebrow="Gestión global · Circuito competitivo"
        title="Gestión y control de competencias"
        description="Administra ligas, torneos, inscripciones y la generación de fixtures desde una operación unificada."
        icon={Trophy}
        tone="violet"
        badge={userRole === 'Administrador' ? 'Vista administrativa' : 'Vista organizador'}
        actions={(
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 size-4" /> Crear competencia
          </Button>
        )}
      />

      <ManagementMetrics>
        <MetricCard label="Competencias" value={competitions.length} hint="Registros totales" icon={Trophy} tone="violet" />
        <MetricCard label="En curso" value={competitions.filter((item) => item.status === 'En Curso').length} hint="Operación activa" icon={Radio} tone="cyan" />
        <MetricCard label="Inscripciones" value={competitions.filter((item) => item.status === 'Inscripcion').length} hint="Convocatorias abiertas" icon={ClipboardList} tone="gold" />
        <MetricCard label="Finalizadas" value={competitions.filter((item) => item.status === 'Finalizada').length} hint="Histórico cerrado" icon={CheckCircle2} tone="emerald" />
      </ManagementMetrics>

      <CrudAlertBanner state={crudState} onClose={resetAlert} />

      {/* Sub-navigation Tabs con los 5 estados */}
      <ManagementTabs
        label="Estados de competencias"
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'all', label: 'Todas', count: competitions.length, icon: Trophy, tone: 'violet' },
          { id: 'Borrador', label: 'Borrador', count: competitions.filter((item) => item.status === 'Borrador').length, icon: ClipboardList, tone: 'gold' },
          { id: 'Inscripcion', label: 'Inscripción', count: competitions.filter((item) => item.status === 'Inscripcion').length, icon: Calendar, tone: 'cyan' },
          { id: 'En Curso', label: 'En curso', count: competitions.filter((item) => item.status === 'En Curso').length, icon: Radio, tone: 'violet' },
          { id: 'Finalizada', label: 'Finalizada', count: competitions.filter((item) => item.status === 'Finalizada').length, icon: CheckCircle2, tone: 'emerald' },
          { id: 'Eliminada', label: 'Eliminada', count: competitions.filter((item) => item.status === 'Eliminada').length, icon: ShieldAlert, tone: 'crimson' },
        ]}
      />

      {/* Selector de Filtros y Antigüedad */}
      <div className="management-toolbar font-[family-name:var(--font-active)]">
        <div className="flex items-center gap-2 flex-1">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as CompetitionFilter)}
            className="bg-[var(--bg-main)] border border-[var(--border-card)] px-3.5 py-2 rounded-xl text-xs font-bold text-[var(--text-heading)] focus:outline-none cursor-pointer focus:border-[var(--border-card-hover)] transition-colors"
          >
            <option value="all" className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">🔍 Filtro: Todas las Competencias</option>
            <option value="Borrador" className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">📝 Filtro: Borrador</option>
            <option value="Inscripcion" className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">📝 Filtro: Inscripción</option>
            <option value="En Curso" className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">⚡ Filtro: En Curso</option>
            <option value="Finalizada" className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">🏆 Filtro: Finalizada</option>
            <option value="Eliminada" className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">🔴 Filtro: Eliminada</option>
          </select>

          <div className="flex items-center gap-1.5 border-l border-[var(--border-card)] pl-3">
            <Calendar className="w-4 h-4 shrink-0 text-[var(--app-accent-2)]" />
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase shrink-0 hidden md:inline">Antigüedad:</span>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
              className="bg-[var(--bg-main)] border border-[var(--border-card)] px-3 py-2 rounded-xl text-xs font-bold text-[var(--text-heading)] focus:outline-none cursor-pointer focus:border-[var(--border-card-hover)] transition-colors"
            >
              <option value="NEWEST" className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">⏱️ Más recientes primero</option>
              <option value="OLDEST" className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">⌛ Más antiguas primero</option>
              <option value="NAME_ASC" className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">🔤 Nombre A-Z</option>
              <option value="NAME_DESC" className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">🔤 Nombre Z-A</option>
            </select>
          </div>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--app-accent-2)] hover:bg-[var(--app-accent-2)] text-[var(--text-heading)] font-black text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Nueva Competencia</span>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={processedCompetitions}
        searchPlaceholder="Buscar por torneo, juego o estado..."
          brandColor="var(--app-accent-2)"
        actions={(row) => (
          <div className="flex items-center gap-1 justify-end font-[family-name:var(--font-active)]">
            <Link href={`/dashboard/competencias/${row.id}`}>
              <Button size="sm" variant="ghost" className="text-xs text-[var(--app-accent)] hover:bg-[var(--app-accent-soft)] p-2 rounded-xl transition-colors" title="Ver / Administrar Competencia">
                <Eye className="w-3.5 h-3.5" />
              </Button>
            </Link>

            {/* Selector Rápido de Estado */}
            <select
              value={row.status}
              onChange={(e) => {
                const targetStatus = e.target.value as CompetitionStatus;
                if (targetStatus === 'Eliminada') setDeletingCompetition(row);
                else handleStatusChange(row.id, row.name, row.status, targetStatus);
              }}
              className="bg-[var(--bg-main)] border border-[var(--border-card)] px-2 py-1 rounded-lg text-[11px] font-bold text-[var(--text-heading)] focus:outline-none cursor-pointer hover:border-[var(--border-card-hover)] transition-colors"
            >
              <option value="Borrador" className="bg-[var(--app-surface-2)] text-[var(--text-heading)]">📝 Borrador</option>
              <option value="Inscripcion" className="bg-[var(--app-surface-2)] text-[var(--text-heading)]">📝 Inscripción</option>
              <option value="En Curso" className="bg-[var(--app-surface-2)] text-[var(--text-heading)]">⚡ En Curso</option>
              <option value="Finalizada" className="bg-[var(--app-surface-2)] text-[var(--text-heading)]">🏆 Finalizada</option>
              <option value="Eliminada" className="bg-[var(--app-surface-2)] text-[var(--app-danger)]">🔴 Eliminada</option>
            </select>

            {row.status !== 'Eliminada' && row.status !== 'Deshabilitado' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDeletingCompetition(row)}
                className="text-xs text-[var(--app-danger)] hover:bg-[var(--app-danger-soft)] p-2 rounded-xl transition-colors"
                title="Eliminar Competencia (Alerta de Peligro)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )}
      />

      {/* Modal Form para Crear Competencia */}
      <ModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nueva Competencia eSports"
        subtitle="Módulo del Organizador • TournamentsPro"
        onSubmit={handleCreateSubmit}
        isSubmitting={isPending}
          brandColor="var(--app-accent-2)"
      >
        <div className="space-y-4 text-xs font-bold">
          <div className="space-y-1">
            <label className="text-[var(--text-secondary)] uppercase block">Nombre de la Competencia / Torneo:</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Ej: Liga Apertura eSports FC 26"
              className="w-full p-2.5 rounded-xl bg-[var(--app-surface-2)] border border-[var(--text-heading)]/10 text-[var(--text-heading)] outline-none focus:border-[var(--app-accent-2)]"
            />
          </div>

          {/* Selección y Creación de Temporada */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[var(--text-secondary)] uppercase block">Temporada de la Organización:</label>
              <button
                type="button"
                onClick={() => setIsCreatingNewSeason(!isCreatingNewSeason)}
                className="text-[10px] font-[family-name:var(--font-active)] text-[var(--app-accent-2)] hover:underline font-bold"
              >
                {isCreatingNewSeason ? '← Seleccionar Temporada Existente' : '➕ Crear Nueva Temporada'}
              </button>
            </div>

            {isCreatingNewSeason ? (
              <input
                type="text"
                name="newSeasonName"
                required={isCreatingNewSeason}
                placeholder="Ej: Temporada Apertura 2026"
                className="w-full p-2.5 rounded-xl bg-[var(--app-surface-2)] border border-[var(--app-accent-2)]/50 text-[var(--app-accent-2)] outline-none font-[family-name:var(--font-active)]"
              />
            ) : (
              <select
                name="seasonId"
                value={selectedSeasonId}
                onChange={(e) => {
                  if (e.target.value === '__NEW__') {
                    setIsCreatingNewSeason(true);
                  } else {
                    setSelectedSeasonId(e.target.value);
                  }
                }}
                className="w-full p-2.5 rounded-xl bg-[var(--app-surface-2)] border border-[var(--text-heading)]/10 text-[var(--app-accent-2)] font-[family-name:var(--font-active)]"
              >
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    📅 {s.name} ({s.status})
                  </option>
                ))}
                <option value="__NEW__">➕ + CREAR NUEVA TEMPORADA...</option>
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[var(--text-secondary)] uppercase block">Disciplina eSports Autorizada:</label>
              <select
                name="gameSlug"
                value={currentSelectedGame}
                onChange={(e) => setSelectedGameSlug(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[var(--app-surface-2)] border border-[var(--text-heading)]/10 text-[var(--app-accent)] font-[family-name:var(--font-active)]"
              >
                {availableGames.map(([slug, g]) => (
                  <option key={slug} value={slug}>
                    {g.icon} {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[var(--text-secondary)] uppercase block">Modalidad de Juego:</label>
              <select
                name="modeFormat"
                defaultValue={activeModes[0]?.value || '11v11'}
                className="w-full p-2.5 rounded-xl bg-[var(--app-surface-2)] border border-[var(--app-accent-2)]/40 text-[var(--app-accent-2)] font-[family-name:var(--font-active)]"
              >
                {activeModes.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[var(--text-secondary)] uppercase block text-[11px]">Estado Inicial:</label>
              <select name="status" defaultValue="Inscripcion" className="w-full p-2.5 rounded-xl bg-[var(--app-surface-2)] border border-[var(--text-heading)]/10 text-[var(--app-accent)] font-[family-name:var(--font-active)] text-xs">
                <option value="Borrador" className="bg-[var(--app-surface-2)] text-[var(--text-heading)]">📝 Borrador (Configuración)</option>
                <option value="Inscripcion" className="bg-[var(--app-surface-2)] text-[var(--text-heading)]">📝 Inscripción (Abierta)</option>
                <option value="En Curso" className="bg-[var(--app-surface-2)] text-[var(--text-heading)]">⚡ En Curso (Activa)</option>
                <option value="Finalizada" className="bg-[var(--app-surface-2)] text-[var(--text-heading)]">🏆 Finalizada (Concluida)</option>
                <option value="Eliminada" className="bg-[var(--app-surface-2)] text-[var(--app-danger)]">🔴 Eliminada (Archivada)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[var(--text-secondary)] uppercase block text-[11px]">Bolsa de Premios:</label>
              <input
                type="text"
                name="prizePool"
                placeholder="Ej: $500,000 CLP + Trofeo"
                className="w-full p-2.5 rounded-xl bg-[var(--app-surface-2)] border border-[var(--text-heading)]/10 text-[var(--app-warning)] font-[family-name:var(--font-active)] text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[var(--text-secondary)] uppercase block text-[11px]">Mercado de Fichajes:</label>
              <select name="transferMarketMode" defaultValue="ABIERTO" className="w-full p-2.5 rounded-xl bg-[var(--app-surface-2)] border border-[var(--text-heading)]/10 text-[var(--app-positive)] font-[family-name:var(--font-active)] text-xs">
                <option value="ABIERTO">🔓 ABIERTO (Libre)</option>
                <option value="CERRADO">🔒 CERRADO (Limitado)</option>
                <option value="SIN_MERCADO">🚫 SIN MERCADO (Fijo)</option>
              </select>
            </div>
          </div>

          {/* 3 Fechas Oficiales de la Competencia */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[var(--text-secondary)] uppercase block text-[10px]">1. Límite Inscripción:</label>
              <input
                type="datetime-local"
                name="fechaLimiteInscripcion"
                defaultValue={defaultDates.registration}
                className="w-full p-2.5 rounded-xl bg-[var(--app-surface-2)] border border-[var(--app-warning)]/40 text-[var(--app-warning)] font-[family-name:var(--font-active)] text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[var(--text-secondary)] uppercase block text-[10px]">2. Inicio de Torneo:</label>
              <input
                type="datetime-local"
                name="fechaInicio"
                required
                defaultValue={defaultDates.start}
                className="w-full p-2.5 rounded-xl bg-[var(--app-surface-2)] border border-[var(--app-accent)]/40 text-[var(--app-accent)] font-[family-name:var(--font-active)] text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[var(--text-secondary)] uppercase block text-[10px]">3. Término Estimado:</label>
              <input
                type="datetime-local"
                name="fechaTermino"
                defaultValue={defaultDates.end}
                className="w-full p-2.5 rounded-xl bg-[var(--app-surface-2)] border border-[var(--border-card)] text-[var(--text-secondary)] font-[family-name:var(--font-active)] text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[var(--text-secondary)] uppercase block">Descripción y Reglamento:</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Escribe los detalles del formato, premios y reglas eSports..."
              className="w-full p-2.5 rounded-xl bg-[var(--app-surface-2)] border border-[var(--text-heading)]/10 text-[var(--text-heading)] font-normal"
            />
          </div>
        </div>
      </ModalForm>
      {deletingCompetition && (
        <ConfirmModal
          isOpen
          onClose={() => setDeletingCompetition(null)}
          onConfirm={() => handleDeleteCompetition(deletingCompetition)}
          title={`Eliminar competencia: ${deletingCompetition.name}`}
          description="La competencia se moverá al estado Eliminada y dejará de aparecer en la operación activa."
          confirmText="Eliminar competencia"
          variant="danger"
          confirmationText={deletingCompetition.name}
          consequences={[
            'Se cerrará su operación competitiva activa.',
            'No aceptará nuevas inscripciones ni cambios de fixture.',
            'Permanecerá disponible como registro histórico eliminado.',
          ]}
        />
      )}
    </ManagementPage>
  );
}
