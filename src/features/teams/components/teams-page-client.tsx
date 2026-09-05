'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { GAMES_CATALOG } from '@/lib/games-data';
import { TeamDirectory } from '@/components/teams/team-directory';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, ShieldAlert, Unlock, Edit, Plus, UserPlus, X, Activity, Trophy } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { getDirectoryEndpoint } from '@/lib/directory-endpoints';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { ModalForm } from '@/components/ui/modal-form';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { ImageUploadCard } from '@/components/ui/image-upload-card';
import { SocialMediaGroup } from '@/components/ui/social-media-group';
import { CrudAlertBanner, useCrudNotifier } from '@/components/ui/crud-alert';
import dynamic from 'next/dynamic';

const SquadRosterModal = dynamic(
  () => import('@/components/teams/squad-roster-modal').then((m) => m.SquadRosterModal),
  { ssr: false }
);
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { shouldBypassImageOptimization } from '@/lib/image-utils';
import {
  ManagementHero,
  ManagementMetrics,
  ManagementPage,
  ManagementTabs,
  MetricCard,
} from '@/components/dashboard/management-ui';

interface TeamManager {
  id: string;
  name: string;
  gamertag?: string;
}

interface AdminUser extends TeamManager {
  role?: string;
}

interface AdminTeam {
  id: string;
  name: string;
  tag: string;
  game_slug: string;
  platform?: string;
  status?: string;
  description?: string;
  captain_id?: string;
  captainId?: string;
  captain_name?: string;
  members_count?: number;
  max_members?: number;
  logo_text?: string;
  logo_url?: string;
  logoUrl?: string;
  banner_url?: string;
  bannerUrl?: string;
  organization_id?: string | null;
  encargados?: TeamManager[];
  is_banned?: boolean | number;
  social_twitter?: string;
  social_instagram?: string;
  social_twitch?: string;
  social_discord?: string;
}

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function TeamsModulePage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'directory' | 'crud' | 'banned'>('directory');
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingTeam, setEditingTeam] = useState<AdminTeam | null>(null);
  const [banConfirmTeam, setBanConfirmTeam] = useState<AdminTeam | null>(null);
  const [managingRosterTeam, setManagingRosterTeam] = useState<AdminTeam | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Captain & N Encargados state for Create Modal
  const [createCaptainId, setCreateCaptainId] = useState<string>('');
  const [createEncargados, setCreateEncargados] = useState<TeamManager[]>([]);
  const [createCandidateEncargadoId, setCreateCandidateEncargadoId] = useState<string>('');

  // Captain & N Encargados state for Edit Modal
  const [editCaptainId, setEditCaptainId] = useState<string>('');
  const [editEncargados, setEditEncargados] = useState<TeamManager[]>([]);
  const [editCandidateEncargadoId, setEditCandidateEncargadoId] = useState<string>('');

  // Image upload state for modals
  const [modalLogoUrl, setModalLogoUrl] = useState<string>('');
  const [modalBannerUrl, setModalBannerUrl] = useState<string>('');

  const isAdminOrOrganizer = currentUser?.role === 'Administrador' || currentUser?.role === 'Organizador';

  const fetchTeams = React.useCallback(async (): Promise<AdminTeam[]> => {
    try {
      const res = await fetch(getDirectoryEndpoint('teams', isAdminOrOrganizer));
      if (!res.ok) throw new Error(`No se pudieron cargar los equipos (${res.status})`);
      const data: { success?: boolean; teams?: AdminTeam[]; data?: { teams?: AdminTeam[] } } = await res.json();
      const teams = data.teams || data.data?.teams;
      return data.success && Array.isArray(teams) ? teams : [];
    } catch (e) {
      console.error('Error cargando equipos:', e);
      return [];
    }
  }, [isAdminOrOrganizer]);

  const fetchUsers = React.useCallback(async (): Promise<AdminUser[]> => {
    if (!isAdminOrOrganizer) return [];

    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error(`No se pudieron cargar los usuarios (${res.status})`);
      const data: { success?: boolean; users?: AdminUser[] } = await res.json();
      return data.success && Array.isArray(data.users) ? data.users : [];
    } catch (e) {
      console.error('Error cargando usuarios:', e);
      return [];
    }
  }, [isAdminOrOrganizer]);

  const refreshTeams = () => void fetchTeams().then(setTeams);

  useEffect(() => {
    void Promise.all([fetchTeams(), fetchUsers()]).then(([teamRows, userRows]) => {
      setTeams(teamRows);
      setUsersList(userRows);
    });
  }, [fetchTeams, fetchUsers]);

  const openCreateModal = () => {
    setModalLogoUrl('');
    setModalBannerUrl('');
    setCreateCaptainId(currentUser?.id || usersList[0]?.id || '');
    setIsCreateModalOpen(true);
  };

  const openEditModal = (team: AdminTeam) => {
    setModalLogoUrl(team.logo_url || team.logoUrl || '');
    setModalBannerUrl(team.banner_url || team.bannerUrl || '');
    setEditCaptainId(team.captain_id || team.captainId || usersList[0]?.id || '');
    setEditEncargados(Array.isArray(team.encargados) ? team.encargados : []);
    setEditingTeam(team);
  };

  const { crudState, startOperation, endSuccess, endError, resetAlert } = useCrudNotifier();

  // Create Team
  const handleCreateTeam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const teamName = (formData.get('name') || 'NuevoEquipo') as string;
    const gameSlug = (formData.get('gameSlug') as string) || 'eafc26';
  const brandColor = GAMES_CATALOG[gameSlug]?.brandColor || 'var(--app-positive)';

    startOperation(`Creación de Escuadra eSports: ${teamName}`);

    const selectedCapUser = usersList.find((u) => u.id === createCaptainId);

    try {
      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          tag: formData.get('tag'),
          gameSlug,
          platform: formData.get('platform'),
          status: formData.get('status'),
          description: formData.get('description'),
          clubIdEa: formData.get('clubIdEa'),
          color: brandColor,
          captainId: createCaptainId || currentUser?.id,
          captainName: selectedCapUser?.name || selectedCapUser?.gamertag || currentUser?.gamertag || currentUser?.name,
          encargados: createEncargados,
          logoUrl: modalLogoUrl,
          bannerUrl: modalBannerUrl,
          socialMedia: {
            twitter: formData.get('social_twitter'),
            instagram: formData.get('social_instagram'),
            twitch: formData.get('social_twitch'),
            youtube: formData.get('social_youtube'),
            discord: formData.get('social_discord'),
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsCreateModalOpen(false);
        setModalLogoUrl('');
        setModalBannerUrl('');
        setCreateEncargados([]);
        endSuccess(`La escuadra "${teamName}" fue registrada exitosamente en la base de datos con Capitán y Encargados.`);
        refreshTeams();
      } else {
        endError(data.error || 'Error al crear la escuadra.');
      }
    } catch (e: unknown) {
      endError(errorMessage(e, 'Error de conexión al crear escuadra.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Team
  const handleEditTeam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTeam) return;
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const teamName = editingTeam.name || 'Escuadra';

    startOperation(`Edición de Escuadra eSports: ${teamName}`);

    const selectedCapUser = usersList.find((u) => u.id === editCaptainId);

    try {
      const res = await fetch('/api/admin/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTeam.id,
          name: formData.get('name'),
          tag: formData.get('tag'),
          gameSlug: formData.get('gameSlug'),
          platform: formData.get('platform'),
          status: formData.get('status'),
          description: formData.get('description'),
          clubIdEa: formData.get('clubIdEa'),
          captainId: editCaptainId,
          captainName: selectedCapUser?.name || selectedCapUser?.gamertag || formData.get('captainName') || editingTeam.captain_name,
          encargados: editEncargados,
          logoUrl: modalLogoUrl || editingTeam.logo_url,
          bannerUrl: modalBannerUrl || editingTeam.banner_url,
          socialMedia: {
            twitter: formData.get('social_twitter'),
            instagram: formData.get('social_instagram'),
            twitch: formData.get('social_twitch'),
            youtube: formData.get('social_youtube'),
            discord: formData.get('social_discord'),
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditingTeam(null);
        setModalLogoUrl('');
        setModalBannerUrl('');
        endSuccess(`Los cambios en la escuadra "${teamName}" fueron actualizados con éxito.`);
        refreshTeams();
      } else {
        endError(data.error || 'Error al actualizar la escuadra.');
      }
    } catch (e: unknown) {
      endError(errorMessage(e, 'Error de conexión al actualizar escuadra.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ban/Unban Team
  const handleConfirmBanTeam = async (reason?: string) => {
    if (!banConfirmTeam) return;
    const isCurrentlyBanned = banConfirmTeam.is_banned === 1;
    const action = isCurrentlyBanned ? 'UNBAN' : 'BAN';
    const actionLabel = isCurrentlyBanned ? 'Desbaneo' : 'Baneo';
    const teamName = banConfirmTeam.name;

    startOperation(`${actionLabel} de Escuadra: ${teamName}`);

    try {
      const res = await fetch('/api/admin/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: banConfirmTeam.id,
          action,
          banReason: reason || 'Infracción a las normas eSports',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBanConfirmTeam(null);
        endSuccess(isCurrentlyBanned ? `La escuadra "${teamName}" fue desbaneada y activada.` : `La escuadra "${teamName}" ha sido baneada.`);
        refreshTeams();
      } else {
        endError(data.error || `Error al procesar el ${actionLabel.toLowerCase()}.`);
      }
    } catch (e: unknown) {
      endError(errorMessage(e, 'Error al conectar con el servidor.'));
    }
  };

  const bannedTeams = teams.filter((t) => t.is_banned === 1);

  // DataTable columns definition with Game Badge
  const teamColumns: ColumnDef<AdminTeam>[] = [
    {
      header: 'Escuadra / Tag',
      sortable: true,
      accessorKey: 'name',
      cell: (r) => (
        <div className="flex items-center gap-3">
          <Avatar fallback={r.tag || r.name} src={r.logo_url || r.logoUrl} size="sm" alt={r.name} />
          <div>
            <div className="font-bold text-[var(--text-heading)] text-xs">{r.name}</div>
            <div className="text-[10px] font-[family-name:var(--font-active)] text-[var(--app-accent)]">[{r.tag}]</div>
          </div>
        </div>
      ),
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
    { header: 'Capitán Oficial', accessorKey: 'captain_name', sortable: true, className: 'font-bold text-[var(--table-cell-text)] text-xs' },
    { header: 'Plataforma', accessorKey: 'platform', sortable: true, className: 'font-[family-name:var(--font-active)] text-[var(--app-accent)] text-xs' },
    {
      header: 'Plantilla',
      accessorKey: 'members_count',
      sortable: true,
      className: 'font-[family-name:var(--font-active)] text-xs text-[var(--table-cell-text)]',
      cell: (r) => (
        <span className="font-bold text-[var(--app-accent)]">
          {r.members_count || 0} / {r.max_members || 45}
        </span>
      ),
    },
    {
      header: 'Estado',
      sortable: true,
      accessorKey: 'status',
      cell: (r) => (
        <Badge className={`text-[10px] uppercase ${r.is_banned ? 'bg-[var(--app-danger-soft-strong)] text-[var(--app-danger)]' : 'bg-[var(--app-positive-soft)] text-[var(--app-positive)] border-[var(--app-positive)]/40'}`}>
          {r.is_banned ? '🔴 Baneado' : `🟢 ${r.status || 'Activo'}`}
        </Badge>
      ),
    },
  ];

  return (
    <ManagementPage>
      <ManagementHero
        eyebrow="Gestión global · Clubes y plantillas"
        title="Directorio y gestión de escuadras"
        description="Explora las fichas de clubes de todas las disciplinas, administra información de escuadras y gestiona sanciones."
        icon={Shield}
        tone="violet"
        badge={isAdminOrOrganizer ? 'Operación habilitada' : 'Directorio global'}
        actions={isAdminOrOrganizer ? (
          <Button onClick={openCreateModal}>
            <Plus className="mr-2 size-4" /> Registrar escuadra
          </Button>
        ) : undefined}
      />

      <ManagementMetrics>
        <MetricCard label="Escuadras" value={teams.length} hint="Clubes registrados" icon={Shield} tone="violet" />
        <MetricCard label="Activas" value={teams.filter((team) => !team.is_banned).length} hint="Disponibles para competir" icon={Activity} tone="emerald" />
        <MetricCard label="Integrantes" value={teams.reduce((total, team) => total + (team.members_count || 0), 0)} hint="Plantillas declaradas" icon={UserPlus} tone="cyan" />
        <MetricCard label="Sancionadas" value={bannedTeams.length} hint="Bloqueos vigentes" icon={ShieldAlert} tone="crimson" />
      </ManagementMetrics>

      <CrudAlertBanner state={crudState} onClose={resetAlert} />

      {/* Navigation Tabs (Solo para Administrador u Organizador) */}
      {isAdminOrOrganizer && (
        <ManagementTabs
          label="Secciones de escuadras"
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'directory', label: 'Directorio de escuadras', shortLabel: 'Directorio', count: teams.length, icon: Trophy, tone: 'cyan' },
            { id: 'crud', label: 'Gestión de escuadras', shortLabel: 'Gestionar', count: teams.length, icon: Shield, tone: 'violet' },
            { id: 'banned', label: 'Menú de desbaneo', shortLabel: 'Sanciones', count: bannedTeams.length, icon: ShieldAlert, tone: 'crimson' },
          ]}
        />
      )}

      {/* TAB 1: DIRECTORIO DE ESCUADRAS (TODAS LAS DISCIPLINAS DESDE LA BASE DE DATOS SIN FILTROS) */}
      {activeTab === 'directory' && (
        <TeamDirectory
          gameName="Todas las Escuadras eSports"
          gameSlug="ALL"
          brandColor="var(--app-accent)"
          hideHeader={true}
        />
      )}

      {/* TAB 2: GESTIÓN DE ESCUADRAS (ADMIN & ORGANIZADOR) */}
      {activeTab === 'crud' && isAdminOrOrganizer && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-black uppercase text-[var(--app-accent-2)] tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--app-accent-2)]" />
              Tabla General de Escuadras eSports ({teams.length})
            </h3>

            <Button
              onClick={openCreateModal}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--app-accent-2)] px-4 py-2 text-xs font-black text-[var(--text-heading)] shadow-lg hover:bg-[var(--app-accent-2)] sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Nueva Escuadra</span>
            </Button>
          </div>

          <DataTable
            columns={teamColumns}
            data={teams}
            searchPlaceholder="Buscar por escuadra, capitán o tag..."
          brandColor="var(--app-accent-2)"
            actions={(row) => {
              const isAdmin = currentUser?.role === 'Administrador';
              const organizerOrgId = currentUser?.organizationId;
              const isMyOrgTeam = !row.organization_id || !organizerOrgId || row.organization_id === organizerOrgId;
              const canManageRoster = isAdmin || isMyOrgTeam;

              return (
                <div className="flex items-center gap-1 justify-end">
                  {canManageRoster ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setManagingRosterTeam(row)}
                      className="text-xs text-[var(--app-accent-2)] hover:bg-[var(--app-accent-2-soft)] p-2 rounded-xl transition-colors"
                      title={isAdmin ? 'Gestionar Plantilla Global (Acceso Administrador)' : 'Gestionar Plantilla (Tu Organización)'}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled
                      className="text-xs text-[var(--text-muted)] opacity-40 cursor-not-allowed p-2 rounded-xl"
                      title="Solo lectura: Esta escuadra pertenece a otra organización"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditModal(row)}
                    className="text-xs text-[var(--app-accent)] hover:bg-[var(--app-accent-soft)] p-2 rounded-xl transition-colors"
                    title="Editar Escuadra"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setBanConfirmTeam(row)}
                    className="text-xs text-[var(--app-danger)] hover:bg-[var(--app-danger-soft)] p-2 rounded-xl transition-colors"
                    title={row.is_banned ? 'Desbanear Escuadra' : 'Banear Escuadra'}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            }}
          />
        </div>
      )}

      {/* TAB 3: MENÚ DE DESBANEO DE CLUBES */}
      {activeTab === 'banned' && isAdminOrOrganizer && (
        <div className="space-y-6">
          <h3 className="text-sm font-black uppercase text-[var(--app-danger)] tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[var(--app-danger)]" />
            Escuadras eSports Sancionadas ({bannedTeams.length})
          </h3>

          <DataTable
            columns={teamColumns}
            data={bannedTeams}
            searchPlaceholder="Buscar escuadra baneada..."
          brandColor="var(--app-danger)"
            actions={(row) => (
              <Button
                size="sm"
                onClick={() => setBanConfirmTeam(row)}
                className="bg-[var(--app-positive)] hover:bg-[var(--app-positive)] text-[var(--accent-contrast)] font-black text-xs px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1"
              >
                <Unlock className="w-3.5 h-3.5" />
                Desbanear Escuadra
              </Button>
            )}
          />
        </div>
      )}

      {/* MODAL CREAR ESCUADRA */}
      <ModalForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Registrar Nueva Escuadra eSports"
        subtitle="Alta de club en la base de datos MySQL"
        onSubmit={handleCreateTeam}
        isSubmitting={isSubmitting}
          brandColor="var(--app-accent-2)"
        size="xl"
      >
        <div className="space-y-4 font-[family-name:var(--font-active)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)]">
            <ImageUploadCard
              label="Escudo Oficial del Club"
              subtitle="Formato WebP"
              currentUrl={modalLogoUrl}
              fallbackType="logo"
              uploadType="logo"
              maxDimension={512}
          brandColor="var(--app-accent-2)"
              uploadButtonText="Subir Escudo"
              entityName="team-new"
              onUploadSuccess={(url) => setModalLogoUrl(url)}
            />
            <ImageUploadCard
              label="Banner de Portada"
              subtitle="Formato HD WebP"
              currentUrl={modalBannerUrl}
              fallbackType="banner"
              uploadType="banner"
              maxDimension={1200}
          brandColor="var(--app-accent-2)"
              uploadButtonText="Subir Banner"
              entityName="team-new"
              onUploadSuccess={(url) => setModalBannerUrl(url)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Nombre de la Escuadra:" name="name" required placeholder="ViperX Gaming" />
            <Input label="Tag / Trigram:" name="tag" required maxLength={5} placeholder="VPX" className="uppercase text-[var(--app-accent-2)]" />

            <Select
              label="Capitán Oficial (Seleccionar del listado de Jugadores):"
              name="captainId"
              value={createCaptainId}
              onChange={(e) => setCreateCaptainId(e.target.value)}
              required
            >
              {usersList.map((u) => (
                <option key={u.id} value={u.id} className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">
                  👑 {u.name} (@{u.gamertag}) — {u.role}
                </option>
              ))}
            </Select>

            <Select label="Disciplina eSports:" name="gameSlug" defaultValue="eafc26">
              {Object.entries(GAMES_CATALOG).map(([slug, g]) => (
                <option key={slug} value={slug} className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">{g.name}</option>
              ))}
            </Select>

            <Select label="Plataforma:" name="platform" defaultValue="CROSSPLAY">
              <option value="CROSSPLAY" className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">CROSSPLAY</option>
              <option value="PS5" className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">PlayStation 5</option>
              <option value="PC" className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">PC Gaming</option>
              <option value="XBOX" className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">Xbox Series X</option>
            </Select>

            <Select label="Estado del Club:" name="status" defaultValue="Reclutando">
              <option value="Reclutando" className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">🟢 Reclutando</option>
              <option value="Plantilla Completa" className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">🟡 Plantilla Completa</option>
              <option value="Inactivo" className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">🔴 Inactivo</option>
            </Select>

            <Input label="ID EA / Tag Oficial:" name="clubIdEa" placeholder="ID Oficial EA / Faceit / Riot" />
          </div>

          {/* SECCIÓN ASIGNACIÓN DE N ENCARGADOS */}
          <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-[family-name:var(--font-active)] font-bold text-[var(--text-heading)] uppercase flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[var(--app-accent-2)]" />
                <span>Encargados del Equipo (Asignar N Encargados / DTs):</span>
              </label>
              <Badge variant="violet" className="text-[10px] uppercase font-[family-name:var(--font-active)]">{createEncargados.length} Asignados</Badge>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] font-[family-name:var(--font-active)]">
              Selecciona sub-capitanes, administradores o encargados con permisos de gestión para esta escuadra.
            </p>

            <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
              <Select
                value={createCandidateEncargadoId}
                onChange={(e) => setCreateCandidateEncargadoId(e.target.value)}
                className="flex-1 text-xs"
              >
                <option value="" className="bg-[var(--app-surface-2)] text-[var(--text-heading)]">-- Seleccionar Jugador para Asignar Encargado --</option>
                {usersList
                  .filter((u) => u.id !== createCaptainId && !createEncargados.some((e) => e.id === u.id))
                  .map((u) => (
                    <option key={u.id} value={u.id} className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">
                      👤 {u.name} (@{u.gamertag}) — {u.role}
                    </option>
                  ))}
              </Select>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (!createCandidateEncargadoId) return;
                  const uObj = usersList.find((u) => u.id === createCandidateEncargadoId);
                  if (uObj && !createEncargados.some((e) => e.id === uObj.id)) {
                    setCreateEncargados((prev) => [...prev, { id: uObj.id, name: uObj.name, gamertag: uObj.gamertag }]);
                    setCreateCandidateEncargadoId('');
                  }
                }}
                className="flex w-full shrink-0 items-center justify-center gap-1 bg-[var(--app-accent-2)] text-xs font-bold text-[var(--text-heading)] hover:bg-[var(--app-accent-2)] sm:w-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                Añadir Encargado
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {createEncargados.map((enc) => (
                <span
                  key={enc.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[var(--app-accent-2)]/10 border border-[var(--app-accent-2)]/30 text-[var(--app-accent-2)] font-[family-name:var(--font-active)] shadow-sm"
                >
                  <span>🛡️ {enc.name} (@{enc.gamertag})</span>
                  <button
                    type="button"
                    onClick={() => setCreateEncargados((prev) => prev.filter((e) => e.id !== enc.id))}
                    className="text-[var(--app-accent-2)] hover:text-[var(--app-danger)] transition-colors p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {createEncargados.length === 0 && (
                <span className="text-[11px] text-[var(--text-muted)] italic font-[family-name:var(--font-active)]">Sin encargados secundarios asignados.</span>
              )}
            </div>
          </div>

          <Textarea label="Historia / Descripción del Club:" name="description" rows={2} placeholder="Historia, logros y metas eSports..." />

          <SocialMediaGroup prefixName="social" />
        </div>
      </ModalForm>

      {/* MODAL EDITAR ESCUADRA */}
      {editingTeam && (
        <ModalForm
          isOpen={Boolean(editingTeam)}
          onClose={() => setEditingTeam(null)}
          title={`Editar Escuadra: ${editingTeam.name}`}
          subtitle={`Tag: [${editingTeam.tag}]`}
          onSubmit={handleEditTeam}
          isSubmitting={isSubmitting}
          brandColor="var(--app-accent)"
          size="xl"
        >
          <div className="space-y-4 font-[family-name:var(--font-active)]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)]">
              <ImageUploadCard
                label="Escudo Oficial del Club"
                subtitle="Formato WebP"
                currentUrl={modalLogoUrl || editingTeam.logo_url}
                fallbackType="logo"
                uploadType="logo"
                maxDimension={512}
          brandColor="var(--app-accent)"
                uploadButtonText="Cambiar Escudo"
                entityName={editingTeam.name}
                entityId={editingTeam.id}
                onUploadSuccess={(url) => setModalLogoUrl(url)}
              />
              <ImageUploadCard
                label="Banner de Portada"
                subtitle="Formato HD WebP"
                currentUrl={modalBannerUrl || editingTeam.banner_url}
                fallbackType="banner"
                uploadType="banner"
                maxDimension={1200}
          brandColor="var(--app-accent)"
                uploadButtonText="Cambiar Banner"
                entityName={editingTeam.name}
                entityId={editingTeam.id}
                onUploadSuccess={(url) => setModalBannerUrl(url)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Nombre de la Escuadra:" name="name" defaultValue={editingTeam.name} required />
              <Input label="Tag:" name="tag" defaultValue={editingTeam.tag} required maxLength={5} className="uppercase text-[var(--app-accent)]" />

              <Select
                label="Capitán Oficial (Seleccionar del listado de Jugadores):"
                name="captainId"
                value={editCaptainId}
                onChange={(e) => setEditCaptainId(e.target.value)}
                required
              >
                {usersList.map((u) => (
                  <option key={u.id} value={u.id} className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">
                    👑 {u.name} (@{u.gamertag}) — {u.role}
                  </option>
                ))}
              </Select>
              
              <Select label="Disciplina eSports:" name="gameSlug" defaultValue={editingTeam.game_slug || 'eafc26'}>
                {Object.entries(GAMES_CATALOG).map(([slug, g]) => (
                  <option key={slug} value={slug} className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">{g.name}</option>
                ))}
              </Select>

              <Select label="Plataforma:" name="platform" defaultValue={editingTeam.platform || 'CROSSPLAY'}>
                <option value="CROSSPLAY" className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">CROSSPLAY</option>
                <option value="PS5" className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">PlayStation 5</option>
                <option value="PC" className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">PC Gaming</option>
                <option value="XBOX" className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">Xbox Series X</option>
              </Select>

              <Select label="Estado del Club:" name="status" defaultValue={editingTeam.status || 'Reclutando'}>
                <option value="Reclutando" className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">🟢 Reclutando</option>
                <option value="Plantilla Completa" className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">🟡 Plantilla Completa</option>
                <option value="Inactivo" className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">🔴 Inactivo</option>
              </Select>
            </div>

            {/* SECCIÓN ASIGNACIÓN DE N ENCARGADOS PARA EDICIÓN */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-[family-name:var(--font-active)] font-bold text-[var(--text-heading)] uppercase flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[var(--app-accent)]" />
                  <span>Encargados del Equipo (Asignar N Encargados / DTs):</span>
                </label>
                <Badge variant="cyan" className="text-[10px] uppercase font-[family-name:var(--font-active)]">{editEncargados.length} Asignados</Badge>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] font-[family-name:var(--font-active)]">
                Modifica los sub-capitanes o encargados secundarios con permisos sobre la escuadra.
              </p>

              <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                <Select
                  value={editCandidateEncargadoId}
                  onChange={(e) => setEditCandidateEncargadoId(e.target.value)}
                  className="flex-1 text-xs"
                >
                  <option value="" className="bg-[var(--app-surface-2)] text-[var(--text-heading)]">-- Seleccionar Jugador para Asignar Encargado --</option>
                  {usersList
                    .filter((u) => u.id !== editCaptainId && !editEncargados.some((e) => e.id === u.id))
                    .map((u) => (
                      <option key={u.id} value={u.id} className="bg-[var(--app-surface-2)] text-[var(--text-heading)] font-semibold">
                        👤 {u.name} (@{u.gamertag}) — {u.role}
                      </option>
                    ))}
                </Select>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (!editCandidateEncargadoId) return;
                    const uObj = usersList.find((u) => u.id === editCandidateEncargadoId);
                    if (uObj && !editEncargados.some((e) => e.id === uObj.id)) {
                      setEditEncargados((prev) => [...prev, { id: uObj.id, name: uObj.name, gamertag: uObj.gamertag }]);
                      setEditCandidateEncargadoId('');
                    }
                  }}
                  className="flex w-full shrink-0 items-center justify-center gap-1 bg-[var(--app-accent)] text-xs font-bold text-[var(--accent-contrast)] hover:bg-[var(--app-accent)] sm:w-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Añadir Encargado
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {editEncargados.map((enc) => (
                  <span
                    key={enc.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[var(--app-accent)]/10 border border-[var(--app-accent)]/30 text-[var(--app-accent)] font-[family-name:var(--font-active)] shadow-sm"
                  >
                    <span>🛡️ {enc.name} (@{enc.gamertag})</span>
                    <button
                      type="button"
                      onClick={() => setEditEncargados((prev) => prev.filter((e) => e.id !== enc.id))}
                      className="text-[var(--app-accent)] hover:text-[var(--app-danger)] transition-colors p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
                {editEncargados.length === 0 && (
                  <span className="text-[11px] text-[var(--text-muted)] italic font-[family-name:var(--font-active)]">Sin encargados secundarios asignados.</span>
                )}
              </div>
            </div>

            <Textarea label="Descripción / Historia:" name="description" rows={2} defaultValue={editingTeam.description || ''} />

            <SocialMediaGroup
              twitter={editingTeam.social_twitter}
              instagram={editingTeam.social_instagram}
              twitch={editingTeam.social_twitch}
              discord={editingTeam.social_discord}
              prefixName="social"
            />
          </div>
        </ModalForm>
      )}

      {/* MODAL CONFIRMAR BANEO / DESBANEO DE ESCUADRA */}
      {banConfirmTeam && (
        <ConfirmModal
          isOpen={Boolean(banConfirmTeam)}
          onClose={() => setBanConfirmTeam(null)}
          onConfirm={handleConfirmBanTeam}
          title={banConfirmTeam.is_banned ? `Desbanear Escuadra: ${banConfirmTeam.name}` : `Banear Escuadra: ${banConfirmTeam.name}`}
          description={banConfirmTeam.is_banned ? '¿Deseas restaurar la actividad eSports del club?' : '¿Deseas suspender a este club de disputar torneos?'}
          confirmText={banConfirmTeam.is_banned ? 'Restaurar Escuadra' : 'Confirmar Baneo'}
          variant={banConfirmTeam.is_banned ? 'success' : 'danger'}
          requireReason={!banConfirmTeam.is_banned}
          reasonPlaceholder="Motivo de la infracción disciplinaria..."
        />
      )}

      {/* MODAL GESTIÓN DE ROSTER Y AGREGACIÓN DIRECTA DE JUGADORES */}
      <SquadRosterModal
        isOpen={Boolean(managingRosterTeam)}
        onClose={() => setManagingRosterTeam(null)}
        team={managingRosterTeam}
        onRosterUpdated={refreshTeams}
      />
    </ManagementPage>
  );
}
