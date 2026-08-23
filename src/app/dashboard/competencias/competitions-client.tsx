'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { GAMES_CATALOG, GAME_MODE_OPTIONS, GameModeOption } from '@/lib/games-data';
import { CompetitionData, createCompetitionAction, updateCompetitionStatusAction, CompetitionStatus } from '@/app/actions/competitions';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { ModalForm } from '@/components/ui/modal-form';
import { CrudAlertBanner, useCrudNotifier } from '@/components/ui/crud-alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Plus, Eye, Edit3, Trash2, Calendar, Gamepad2, Shield } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { getOrganizationSeasonsAction, SeasonData } from '@/app/actions/seasons';

interface CompetitionsListClientProps {
  competitions: CompetitionData[];
  allowedGames?: string[];
  userRole?: string;
}

export function CompetitionsListClient({ competitions, allowedGames = [], userRole }: CompetitionsListClientProps) {
  const { currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { crudState, startOperation, endSuccess, endError, resetAlert } = useCrudNotifier();

  const [seasons, setSeasons] = useState<SeasonData[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [isCreatingNewSeason, setIsCreatingNewSeason] = useState<boolean>(false);

  const [selectedGameSlug, setSelectedGameSlug] = useState<string>('eafc26');

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
      getOrganizationSeasonsAction(currentUser?.organizationId || undefined).then((res) => {
        if (res.success && res.seasons) {
          setSeasons(res.seasons);
          if (res.seasons.length > 0 && !selectedSeasonId) {
            setSelectedSeasonId(res.seasons[0].id);
          }
        }
      });
    }
  }, [isModalOpen, currentUser]);

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

  const columns: ColumnDef<CompetitionData>[] = [
    {
      header: 'Competencia / Torneo',
      sortable: true,
      accessorKey: 'name',
      cell: (r) => {
        const gameConfig = GAMES_CATALOG[r.game_slug];
        const brandColor = gameConfig?.brandColor || '#00F0FF';
        return (
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl bg-[var(--bg-main)] border flex items-center justify-center font-black text-sm shadow-md"
              style={{ borderColor: brandColor, color: brandColor }}
            >
              {gameConfig?.icon || '🏆'}
            </div>
            <div>
              <Link href={`/dashboard/competencias/${r.id}`} className="font-black text-[var(--table-cell-heading)] text-xs hover:underline block">
                {r.name}
              </Link>
              <div className="text-[10px] font-mono text-[var(--table-cell-muted)]">
                Formato: <strong className="text-[var(--accent-cyan)]">{r.mode_format}</strong>
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
        const gColor = gameConfig?.brandColor || '#A855F7';
        return (
          <span
            className="px-2.5 py-1 rounded-md text-[10px] font-mono font-black uppercase border"
            style={{
              backgroundColor: `color-mix(in srgb, ${gColor} 15%, transparent)`,
              borderColor: `color-mix(in srgb, ${gColor} 40%, transparent)`,
              color: gColor,
            }}
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
        <div className="text-[11px] font-mono text-[var(--table-cell-text)]">
          <div>Inicio: <strong className="text-emerald-400">{new Date(r.fecha_inicio).toLocaleDateString('es-ES')}</strong></div>
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
          <Badge variant={variant} className="text-[10px] font-mono font-black uppercase">
            {label}
          </Badge>
        );
      },
    },
  ];

  // Sub-tabs & Sorting State
  const [activeTab, setActiveTab] = useState<'all' | 'Borrador' | 'Inscripcion' | 'En Curso' | 'Finalizada' | 'Eliminada'>('all');
  const [timeFilter, setTimeFilter] = useState<'NEWEST' | 'OLDEST' | 'NAME_ASC' | 'NAME_DESC'>('NEWEST');
  const [searchTerm, setSearchTerm] = useState('');

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
    <div className="space-y-6">
      <CrudAlertBanner state={crudState} onClose={resetAlert} />

      {/* Sub-navigation Tabs con los 5 estados */}
      <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3 overflow-x-auto scrollbar-none font-mono">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 flex-shrink-0 ${
            activeTab === 'all'
              ? 'bg-[var(--accent-violet)] text-slate-950 shadow-lg'
              : 'bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Todas ({competitions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('Borrador')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 flex-shrink-0 ${
            activeTab === 'Borrador'
              ? 'bg-amber-400 text-slate-950 shadow-lg'
              : 'bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span>📝 Borrador</span>
        </button>

        <button
          onClick={() => setActiveTab('Inscripcion')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 flex-shrink-0 ${
            activeTab === 'Inscripcion'
              ? 'bg-[var(--accent-cyan)] text-slate-950 shadow-lg'
              : 'bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span>📝 Inscripción</span>
        </button>

        <button
          onClick={() => setActiveTab('En Curso')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 flex-shrink-0 ${
            activeTab === 'En Curso'
              ? 'bg-purple-500 text-white shadow-lg'
              : 'bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span>⚡ En Curso</span>
        </button>

        <button
          onClick={() => setActiveTab('Finalizada')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 flex-shrink-0 ${
            activeTab === 'Finalizada'
              ? 'bg-emerald-500 text-slate-950 shadow-lg'
              : 'bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span>🏆 Finalizada</span>
        </button>

        <button
          onClick={() => setActiveTab('Eliminada')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 flex-shrink-0 ${
            activeTab === 'Eliminada'
              ? 'bg-[var(--accent-crimson)] text-white shadow-lg'
              : 'bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>🔴 Eliminada</span>
        </button>
      </div>

      {/* Selector de Filtros y Antigüedad */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-card)] border border-[var(--border-card)] p-4 rounded-2xl shadow-sm backdrop-blur-md font-mono">
        <div className="flex items-center gap-2 flex-1">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as any)}
            className="bg-[var(--bg-main)] border border-[var(--border-card)] px-3.5 py-2 rounded-xl text-xs font-bold text-[var(--text-heading)] focus:outline-none cursor-pointer focus:border-[var(--border-card-hover)] transition-colors"
          >
            <option value="all" className="bg-[#0b101b] text-slate-100 font-semibold">🔍 Filtro: Todas las Competencias</option>
            <option value="Borrador" className="bg-[#0b101b] text-slate-100 font-semibold">📝 Filtro: Borrador</option>
            <option value="Inscripcion" className="bg-[#0b101b] text-slate-100 font-semibold">📝 Filtro: Inscripción</option>
            <option value="En Curso" className="bg-[#0b101b] text-slate-100 font-semibold">⚡ Filtro: En Curso</option>
            <option value="Finalizada" className="bg-[#0b101b] text-slate-100 font-semibold">🏆 Filtro: Finalizada</option>
            <option value="Eliminada" className="bg-[#0b101b] text-slate-100 font-semibold">🔴 Filtro: Eliminada</option>
          </select>

          <div className="flex items-center gap-1.5 border-l border-[var(--border-card)] pl-3">
            <Calendar className="w-4 h-4 shrink-0 text-[var(--accent-violet)]" />
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase shrink-0 hidden md:inline">Antigüedad:</span>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="bg-[var(--bg-main)] border border-[var(--border-card)] px-3 py-2 rounded-xl text-xs font-bold text-[var(--text-heading)] focus:outline-none cursor-pointer focus:border-[var(--border-card-hover)] transition-colors"
            >
              <option value="NEWEST" className="bg-[#0b101b] text-slate-100 font-semibold">⏱️ Más recientes primero</option>
              <option value="OLDEST" className="bg-[#0b101b] text-slate-100 font-semibold">⌛ Más antiguas primero</option>
              <option value="NAME_ASC" className="bg-[#0b101b] text-slate-100 font-semibold">🔤 Nombre A-Z</option>
              <option value="NAME_DESC" className="bg-[#0b101b] text-slate-100 font-semibold">🔤 Nombre Z-A</option>
            </select>
          </div>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Nueva Competencia</span>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={processedCompetitions}
        searchPlaceholder="Buscar por torneo, juego o estado..."
        brandColor="#A855F7"
        actions={(row) => (
          <div className="flex items-center gap-1 justify-end font-mono">
            <Link href={`/dashboard/competencias/${row.id}`}>
              <Button size="sm" variant="ghost" className="text-xs text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-bg)] p-2 rounded-xl transition-colors" title="Ver / Administrar Competencia">
                <Eye className="w-3.5 h-3.5" />
              </Button>
            </Link>

            {/* Selector Rápido de Estado */}
            <select
              value={row.status}
              onChange={(e) => handleStatusChange(row.id, row.name, row.status, e.target.value as CompetitionStatus)}
              className="bg-[var(--bg-main)] border border-[var(--border-card)] px-2 py-1 rounded-lg text-[11px] font-bold text-[var(--text-heading)] focus:outline-none cursor-pointer hover:border-[var(--border-card-hover)] transition-colors"
            >
              <option value="Borrador" className="bg-[#0b101b] text-slate-100">📝 Borrador</option>
              <option value="Inscripcion" className="bg-[#0b101b] text-slate-100">📝 Inscripción</option>
              <option value="En Curso" className="bg-[#0b101b] text-slate-100">⚡ En Curso</option>
              <option value="Finalizada" className="bg-[#0b101b] text-slate-100">🏆 Finalizada</option>
              <option value="Eliminada" className="bg-[#0b101b] text-rose-300">🔴 Eliminada</option>
            </select>

            {row.status !== 'Eliminada' && row.status !== 'Deshabilitado' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleStatusChange(row.id, row.name, row.status, 'Eliminada')}
                className="text-xs text-[var(--accent-crimson)] hover:bg-[var(--accent-crimson-bg)] p-2 rounded-xl transition-colors"
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
        brandColor="#A855F7"
      >
        <div className="space-y-4 text-xs font-bold">
          {/* Campos Ocultos de Autoridad de la Organización */}
          <input type="hidden" name="organizerId" value={currentUser?.id || 'usr-organizer'} />
          <input type="hidden" name="organizerName" value={currentUser?.name || 'Organizador Oficial'} />
          <input type="hidden" name="organizationId" value={currentUser?.organizationId || ''} />

          <div className="space-y-1">
            <label className="text-slate-300 uppercase block">Nombre de la Competencia / Torneo:</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Ej: Liga Apertura eSports FC 26"
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white outline-none focus:border-purple-500"
            />
          </div>

          {/* Selección y Creación de Temporada */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 uppercase block">Temporada de la Organización:</label>
              <button
                type="button"
                onClick={() => setIsCreatingNewSeason(!isCreatingNewSeason)}
                className="text-[10px] font-mono text-purple-300 hover:underline font-bold"
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
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-purple-500/50 text-purple-200 outline-none font-mono"
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
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-purple-300 font-mono"
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
              <label className="text-slate-300 uppercase block">Disciplina eSports Autorizada:</label>
              <select
                name="gameSlug"
                value={currentSelectedGame}
                onChange={(e) => setSelectedGameSlug(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-cyan-300 font-mono"
              >
                {availableGames.map(([slug, g]) => (
                  <option key={slug} value={slug}>
                    {g.icon} {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 uppercase block">Modalidad de Juego:</label>
              <select
                name="modeFormat"
                defaultValue={activeModes[0]?.value || '11v11'}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-purple-500/40 text-purple-300 font-mono"
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
              <label className="text-slate-300 uppercase block text-[11px]">Estado Inicial:</label>
              <select name="status" defaultValue="Inscripcion" className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-cyan-300 font-mono text-xs">
                <option value="Borrador" className="bg-[#0b101b] text-slate-100">📝 Borrador (Configuración)</option>
                <option value="Inscripcion" className="bg-[#0b101b] text-slate-100">📝 Inscripción (Abierta)</option>
                <option value="En Curso" className="bg-[#0b101b] text-slate-100">⚡ En Curso (Activa)</option>
                <option value="Finalizada" className="bg-[#0b101b] text-slate-100">🏆 Finalizada (Concluida)</option>
                <option value="Eliminada" className="bg-[#0b101b] text-rose-300">🔴 Eliminada (Archivada)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 uppercase block text-[11px]">Bolsa de Premios:</label>
              <input
                type="text"
                name="prizePool"
                placeholder="Ej: $500,000 CLP + Trofeo"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-amber-300 font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 uppercase block text-[11px]">Mercado de Fichajes:</label>
              <select name="transferMarketMode" defaultValue="ABIERTO" className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-emerald-300 font-mono text-xs">
                <option value="ABIERTO">🔓 ABIERTO (Libre)</option>
                <option value="CERRADO">🔒 CERRADO (Limitado)</option>
                <option value="SIN_MERCADO">🚫 SIN MERCADO (Fijo)</option>
              </select>
            </div>
          </div>

          {/* 3 Fechas Oficiales de la Competencia */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 uppercase block text-[10px]">1. Límite Inscripción:</label>
              <input
                type="datetime-local"
                name="fechaLimiteInscripcion"
                defaultValue={new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300 font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 uppercase block text-[10px]">2. Inicio de Torneo:</label>
              <input
                type="datetime-local"
                name="fechaInicio"
                required
                defaultValue={new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 16)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-300 font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 uppercase block text-[10px]">3. Término Estimado:</label>
              <input
                type="datetime-local"
                name="fechaTermino"
                defaultValue={new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 16)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-mono text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 uppercase block">Descripción y Reglamento:</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Escribe los detalles del formato, premios y reglas eSports..."
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-normal"
            />
          </div>
        </div>
      </ModalForm>
    </div>
  );
}
