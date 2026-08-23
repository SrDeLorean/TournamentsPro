'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { FilterBar } from '@/components/ui/filter-bar';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Shield,
  ShieldAlert,
  Unlock,
  Trash2,
  Plus,
  Edit,
  UserCheck,
  Sparkles,
  MessageSquare,
  Star,
  Award,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { PositionBadge } from '@/components/ui/position-badge';
import { PlayerProfileView, PlayerData } from '@/components/players/player-profile-view';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { ModalForm } from '@/components/ui/modal-form';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { ImageUploadCard } from '@/components/ui/image-upload-card';
import { SocialMediaGroup } from '@/components/ui/social-media-group';
import { CrudAlertBanner, useCrudNotifier } from '@/components/ui/crud-alert';
import { GAMES_CATALOG } from '@/lib/games-data';
import { EsportsCard } from '@/components/ui/esports-card';
import { Pagination } from '@/components/ui/pagination';

export default function UsersModulePage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'directory' | 'management' | 'banned'>('directory');

  const [usersList, setUsersList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Selected Player for Ficha Pública view
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null);

  // CRUD Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [banConfirmUser, setBanConfirmUser] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Image Upload State for Modals
  const [modalAvatarUrl, setModalAvatarUrl] = useState<string>('');
  const [modalBannerUrl, setModalBannerUrl] = useState<string>('');
  const [modalIsBanned, setModalIsBanned] = useState<boolean>(false);

  const isAdmin = currentUser?.role === 'Administrador';
  const isOrganizer = currentUser?.role === 'Organizador';
  const canManage = isAdmin || isOrganizer;

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      const users = data.data?.users || data.users || (data.success && Array.isArray(data.data) ? data.data : []);
      if (Array.isArray(users) && users.length > 0) {
        setUsersList(users);
      } else {
        // Fallback to /api/users
        const res2 = await fetch('/api/users?limit=200');
        const data2 = await res2.json();
        const users2 = data2.data?.users || data2.users || (data2.success && Array.isArray(data2.data) ? data2.data : []);
        if (Array.isArray(users2)) {
          setUsersList(users2);
        }
      }
    } catch (err) {
      console.error('Error cargando usuarios desde BD MySQL:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Sync images and ban status when editing user opens
  useEffect(() => {
    if (editingUser) {
      setModalAvatarUrl(editingUser.avatar_url || editingUser.foto || '');
      setModalBannerUrl(editingUser.banner_url || '');
      setModalIsBanned(Boolean(editingUser.is_banned === 1 || editingUser.is_banned === true));
    } else {
      setModalAvatarUrl('');
      setModalBannerUrl('');
      setModalIsBanned(false);
    }
  }, [editingUser]);

  const { crudState, startOperation, endSuccess, endError, resetAlert } = useCrudNotifier();

  const [timeFilter, setTimeFilter] = useState<'NEWEST' | 'OLDEST' | 'NAME_ASC' | 'NAME_DESC'>('NEWEST');

  const filteredUsers = usersList.filter((user) => {
    const matchesSearch =
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.gamertag || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.position || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;

    const uGame = user.primaryGame || user.primary_game || user.gameSlug || user.game_slug || 'eafc26';
    const matchesDiscipline = selectedDiscipline === 'ALL' || uGame === selectedDiscipline;
    return matchesSearch && matchesRole && matchesDiscipline;
  });

  const activeDirectoryUsers = filteredUsers.filter((u) => u.status !== 'Baneado' && u.status !== 'Suspendido');

  const sortedActiveDirectoryUsers = React.useMemo(() => {
    let list = [...activeDirectoryUsers];
    if (timeFilter === 'OLDEST') {
      list.reverse();
    } else if (timeFilter === 'NAME_ASC') {
      list.sort((a, b) => (a.name || a.gamertag || '').localeCompare(b.name || b.gamertag || ''));
    } else if (timeFilter === 'NAME_DESC') {
      list.sort((a, b) => (b.name || b.gamertag || '').localeCompare(a.name || a.gamertag || ''));
    }
    return list;
  }, [activeDirectoryUsers, timeFilter]);

  const itemsPerPage = 12;
  const totalPages = Math.ceil(sortedActiveDirectoryUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDirectoryUsers = sortedActiveDirectoryUsers.slice(startIndex, startIndex + itemsPerPage);

  const DISCIPLINE_OPTIONS = [
    { id: 'ALL', label: 'TODAS LAS DISCIPLINAS' },
    { id: 'eafc26', label: 'EA FC 26' },
    { id: 'valorant', label: 'VALORANT' },
    { id: 'csgo', label: 'CS2' },
    { id: 'lol', label: 'LOL' },
    { id: 'rocketleague', label: 'ROCKET LEAGUE' },
    { id: 'fortnite', label: 'FORTNITE' },
  ];

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const userGamertag = (formData.get('gamertag') || formData.get('name') || 'NuevoUsuario') as string;

    startOperation(`Creación de Usuario @${userGamertag}`);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          gamertag: formData.get('gamertag'),
          email: formData.get('email'),
          password: formData.get('password'),
          role: formData.get('role'),
          primaryGame: formData.get('primaryGame'),
          position: formData.get('position'),
          secondaryPosition: formData.get('secondaryPosition'),
          platform: formData.get('platform'),
          status: formData.get('status'),
          rating: formData.get('rating'),
          biografia: formData.get('biografia'),
          avatarUrl: modalAvatarUrl,
          bannerUrl: modalBannerUrl,
          twitter: formData.get('social_twitter'),
          instagram: formData.get('social_instagram'),
          twitch: formData.get('social_twitch'),
          discord: formData.get('social_discord'),
          youtube: formData.get('social_youtube'),
          whatsapp: formData.get('social_whatsapp'),
          requesterRole: currentUser?.role,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsCreateModalOpen(false);
        setModalAvatarUrl('');
        setModalBannerUrl('');
        endSuccess(`El usuario @${userGamertag} fue creado exitosamente en la base de datos MySQL.`);
        fetchUsers();
      } else {
        endError(data.error || 'Error al crear usuario.');
      }
    } catch (err: any) {
      endError(err?.message || 'Error en la conexión con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit User
  const handleEditUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const userGamertag = editingUser.gamertag || editingUser.name || 'Usuario';

    startOperation(`Edición de Usuario @${userGamertag}`);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          name: formData.get('name'),
          gamertag: formData.get('gamertag'),
          email: formData.get('email'),
          newPassword: formData.get('newPassword'),
          role: formData.get('role'),
          status: formData.get('status'),
          isBanned: modalIsBanned ? 1 : 0,
          banReason: formData.get('ban_reason') ? String(formData.get('ban_reason')) : null,
          primaryGame: formData.get('primaryGame'),
          platform: formData.get('platform'),
          position: formData.get('position'),
          secondaryPosition: formData.get('secondaryPosition'),
          rating: formData.get('rating'),
          biografia: formData.get('biografia'),
          avatarUrl: modalAvatarUrl || editingUser.avatar_url,
          bannerUrl: modalBannerUrl || editingUser.banner_url,
          twitter: formData.get('social_twitter'),
          instagram: formData.get('social_instagram'),
          twitch: formData.get('social_twitch'),
          discord: formData.get('social_discord'),
          youtube: formData.get('social_youtube'),
          whatsapp: formData.get('social_whatsapp'),
          requesterRole: currentUser?.role,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditingUser(null);
        setModalAvatarUrl('');
        setModalBannerUrl('');
        endSuccess(`Los cambios en el usuario @${userGamertag} fueron guardados correctamente.`);
        fetchUsers();
      } else {
        endError(data.error || 'Error al actualizar usuario.');
      }
    } catch (err: any) {
      endError(err?.message || 'Error en la conexión al actualizar usuario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Ban/Unban User via ConfirmModal
  const handleConfirmBan = async (reason?: string) => {
    if (!banConfirmUser) return;
    const isCurrentlyBanned = banConfirmUser.is_banned === 1;
    const action = isCurrentlyBanned ? 'UNBAN' : 'BAN';
    const actionLabel = isCurrentlyBanned ? 'Desbaneo' : 'Baneo';
    const userGamertag = banConfirmUser.gamertag || banConfirmUser.name;

    startOperation(`${actionLabel} de Usuario @${userGamertag}`);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: banConfirmUser.id,
          action,
          banReason: reason || 'Infracción disciplinaria',
          requesterRole: currentUser?.role,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBanConfirmUser(null);
        endSuccess(isCurrentlyBanned ? `El usuario @${userGamertag} ha sido desbaneado y activado.` : `El usuario @${userGamertag} ha sido baneado del sistema.`);
        fetchUsers();
      } else {
        endError(data.error || `Error al procesar el ${actionLabel.toLowerCase()}.`);
      }
    } catch (err: any) {
      endError(err?.message || 'Error al conectar con el servidor.');
    }
  };

  const bannedUsers = usersList.filter((u) => u.is_banned === 1 || u.status === 'Baneado');

  // Columns definition for DataTable
  const userColumns: ColumnDef<any>[] = [
    {
      header: 'Usuario / Gamertag',
      sortable: true,
      accessorKey: 'name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar fallback={row.name} src={row.avatar_url || row.foto} size="sm" />
          <div>
            <div className="font-bold text-[var(--text-heading)] text-xs">{row.name}</div>
            <div className="text-[10px] font-mono text-[var(--accent-cyan)]">@{row.gamertag}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Email / Contacto',
      accessorKey: 'email',
      sortable: true,
      className: 'font-mono text-[var(--text-secondary)] text-[11px]',
    },
    {
      header: 'Rol eSports',
      sortable: true,
      accessorKey: 'role',
      cell: (row) => (
        <Badge
          className={`text-[10px] uppercase font-mono ${
            row.role === 'Administrador'
              ? 'bg-rose-950 text-rose-300 border-rose-500/40'
              : row.role === 'Organizador'
              ? 'bg-purple-950 text-purple-300 border-purple-500/40'
              : 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
          }`}
        >
          {row.role}
        </Badge>
      ),
    },
    {
      header: 'Posición Táctica',
      cell: (row) => <PositionBadge primaryPosition={row.position} secondaryPosition={row.secondary_position} />,
    },
    {
      header: 'Estado',
      sortable: true,
      accessorKey: 'status',
      cell: (row) => (
        <Badge
          className={`text-[10px] uppercase ${
            row.is_banned ? 'bg-rose-900 text-rose-200' : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
          }`}
        >
          {row.is_banned ? '🔴 Baneado' : `🟢 ${row.status || 'Activo'}`}
        </Badge>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader
        badgeText="Módulo de Gestión eSports"
        title="MÓDULO DE DEPURACIÓN Y GESTIÓN DE"
        highlightTitle="USUARIOS."
        description="Directorio público de atletas, administración de perfiles y menú de desbaneos."
      />

      <CrudAlertBanner state={crudState} onClose={resetAlert} />

      {/* Navigation Tabs per Module (Solo para Administrador u Organizador) */}
      {canManage && (
        <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3 overflow-x-auto scrollbar-none font-mono">
          <button
            onClick={() => {
              setSelectedPlayer(null);
              setActiveTab('directory');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'directory' ? 'bg-[var(--accent-cyan)] text-slate-950 shadow-lg' : 'bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Users className="w-4 h-4" />
            Directorio de Atletas
          </button>

          <button
            onClick={() => setActiveTab('management')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'management' ? 'bg-[var(--accent-violet)] text-slate-950 shadow-lg' : 'bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Gestión & Roles ({isAdmin ? 'Administrador' : 'Organizador'})
          </button>

          <button
            onClick={() => setActiveTab('banned')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'banned' ? 'bg-[var(--accent-crimson)] text-white shadow-lg' : 'bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Menú de Desbaneo ({bannedUsers.length})
          </button>
        </div>
      )}

      {/* TAB 1: DIRECTORIO PÚBLICO DE ATLETAS */}
      {activeTab === 'directory' && (
        selectedPlayer ? (
          <PlayerProfileView
            player={selectedPlayer}
            brandColor="#00F0FF"
            onBack={() => setSelectedPlayer(null)}
          />
        ) : (
          <div className="space-y-6">
            {/* BARRA UNIFICADA DE FILTRO Y ANTIGÜEDAD */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--bg-card)] border border-[var(--border-card)] p-4 rounded-2xl shadow-sm backdrop-blur-md font-mono">
              <div className="flex-1">
                <FilterBar
                  searchPlaceholder="Buscar por Gamertag, nombre o posición..."
                  searchValue={searchTerm}
                  onSearchChange={setSearchTerm}
                  options={DISCIPLINE_OPTIONS}
                  activeFilter={selectedDiscipline}
                  onFilterChange={setSelectedDiscipline}
                  renderAsSelect={true}
                  count={sortedActiveDirectoryUsers.length}
                  countLabel="ATLETAS"
                  brandColor="#00F0FF"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0 bg-[var(--bg-main)] border border-[var(--border-card)] px-3.5 py-2 rounded-xl text-xs font-bold text-[var(--text-heading)]">
                <Calendar className="w-4 h-4 text-[var(--accent-cyan)] shrink-0" />
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase hidden md:inline shrink-0">Antigüedad:</span>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as any)}
                  className="bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="NEWEST" className="bg-[#0b101b] text-slate-100 font-semibold">⏱️ Más recientes primero</option>
                  <option value="OLDEST" className="bg-[#0b101b] text-slate-100 font-semibold">⌛ Más antiguos primero</option>
                  <option value="NAME_ASC" className="bg-[#0b101b] text-slate-100 font-semibold">🔤 Gamertag A-Z</option>
                  <option value="NAME_DESC" className="bg-[#0b101b] text-slate-100 font-semibold">🔤 Gamertag Z-A</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentDirectoryUsers.map((user, index) => {
                const uGameSlug = user.primaryGame || user.primary_game || user.gameSlug || user.game_slug || 'eafc26';
                const gameCfg = GAMES_CATALOG[uGameSlug] || GAMES_CATALOG['eafc26'];
                const userBrandColor = gameCfg?.brandColor || '#00F0FF';

                return (
                  <EsportsCard
                    key={user.id}
                    onClick={() => setSelectedPlayer(user)}
                    title={user.name}
                    subtitle={`🎮 ${gameCfg?.name || 'FC 26'} | @${user.gamertag || user.name}`}
                    description={user.biografia || user.bio || `Atleta eSports oficial registrado en el circuito profesional.`}
                    bannerUrl={user.banner_url || user.bannerUrl || '/images/default/banner-default.jpg'}
                    logoUrl={user.avatar_url || user.foto || user.avatarUrl}
                    fallbackIcon={<Users className="w-8 h-8 text-cyan-400" />}
                    tag={user.position || user.pos || 'DFC'}
                    country={user.nacionalidad || user.country || 'Chile'}
                    socials={{
                      instagram: user.instagram,
                      twitch: user.twitch,
                      twitter: user.twitter,
                      whatsapp: user.whatsapp,
                      tiktok: user.tiktok,
                      youtube: user.youtube,
                      discord: user.discord,
                    }}
                    badges={[
                      { text: gameCfg?.name || 'eSports', variant: 'purple' },
                      {
                        text: user.role === 'Administrador' ? 'ADMIN' : user.role === 'Organizador' ? 'ORGANIZADOR' : 'ATLETA PRO',
                        variant: user.role === 'Administrador' ? 'amber' : user.role === 'Organizador' ? 'purple' : 'cyan',
                        pulse: user.status === 'Activo' || user.status === 'Atleta Activo',
                      },
                    ]}
                    stats={[
                      { icon: <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />, label: 'Rating', value: user.rating || '9.0', highlight: true },
                      { icon: <Award className="w-3.5 h-3.5 text-cyan-400" />, label: 'Posición', value: user.position || 'MCO' },
                    ]}
                    footerLeft={
                      <span className="flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" style={{ color: userBrandColor }} />
                        <span style={{ color: userBrandColor }} className="font-bold">{user.teamName || user.team || 'Agencia Libre'}</span>
                      </span>
                    }
                    actionText="VER FICHA"
                    brandColor={userBrandColor}
                    animationDelay={index * 50}
                  />
                );
              })}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                brandColor="#00F0FF"
                className="pt-6 pb-2"
              />
            )}
          </div>
        )
      )}

      {/* TAB 2: GESTIÓN DE ROLES Y PERFILES */}
      {activeTab === 'management' && canManage && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-purple-300 tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-400" />
              Tabla General de Usuarios & Gestión de Cuentas
            </h3>

            <Button
              onClick={() => {
                setModalAvatarUrl('');
                setModalBannerUrl('');
                setIsCreateModalOpen(true);
              }}
              className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs px-4 py-2 rounded-xl shadow-lg flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Usuario</span>
            </Button>
          </div>

          <DataTable
            columns={userColumns}
            data={usersList}
            searchPlaceholder="Buscar por nombre, gamertag o email..."
            searchField={(row) => `${row.name} ${row.gamertag} ${row.email}`}
            filterOptions={[
              {
                key: 'role',
                label: 'Rol',
                options: [
                  { label: 'Administrador', value: 'Administrador' },
                  { label: 'Organizador', value: 'Organizador' },
                  { label: 'Jugador', value: 'Jugador' },
                ],
              },
              {
                key: 'status',
                label: 'Estado',
                options: [
                  { label: 'Activo', value: 'Activo' },
                  { label: 'Inactivo', value: 'Inactivo' },
                  { label: 'Suspendido', value: 'Suspendido' },
                ],
              },
            ]}
            brandColor="#A855F7"
            defaultPageSize={10}
            actions={(row) => (
              <div className="flex items-center gap-1 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingUser(row)}
                  className="text-xs text-[var(--accent-violet)] hover:bg-[var(--accent-violet-bg)] p-2 rounded-xl transition-colors"
                  title="Editar datos del usuario"
                >
                  <Edit className="w-3.5 h-3.5" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setBanConfirmUser(row)}
                  className={`text-xs p-2 rounded-xl transition-colors ${
                    row.is_banned 
                      ? 'text-[var(--accent-emerald)] hover:bg-[var(--accent-emerald-bg)]' 
                      : 'text-[var(--accent-crimson)] hover:bg-[var(--accent-crimson-bg)]'
                  }`}
                  title={row.is_banned ? 'Desbanear usuario' : 'Banear usuario'}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          />
        </div>
      )}

      {/* TAB 3: MENÚ DE DESBANEO */}
      {activeTab === 'banned' && canManage && (
        <div className="space-y-6">
          <h3 className="text-sm font-black uppercase text-rose-400 tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            Menú de Desbaneo de Usuarios Sancionados
          </h3>

          <DataTable
            columns={[
              { header: 'Gamertag / Usuario', cell: (r) => <span className="font-bold text-rose-300">@{r.gamertag} ({r.name})</span> },
              { header: 'Motivo del Baneo', accessorKey: 'ban_reason', className: 'font-mono text-slate-300' },
              { header: 'Estado', cell: () => <Badge className="bg-rose-900 text-rose-200">🔴 Baneado</Badge> },
            ]}
            data={bannedUsers}
            searchPlaceholder="Buscar usuarios baneados..."
            brandColor="#F43F5E"
            actions={(row) => (
              <Button
                size="sm"
                onClick={() => setBanConfirmUser(row)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl shadow-lg"
              >
                <Unlock className="w-3.5 h-3.5 mr-1" />
                Desbanear
              </Button>
            )}
          />
        </div>
      )}

      {/* MODAL CREAR USUARIO */}
      <ModalForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nuevo Usuario"
        subtitle="Registrar un usuario en la plataforma"
        onSubmit={handleCreateUser}
        isSubmitting={isSubmitting}
        brandColor="#A855F7"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-900 border border-white/10">
            <ImageUploadCard
              label="Foto de Perfil"
              subtitle="Formato WebP"
              currentUrl={modalAvatarUrl}
              fallbackType="avatar"
              uploadType="logo"
              maxDimension={400}
              brandColor="#A855F7"
              uploadButtonText="Subir Foto"
              entityName="usr-new"
              onUploadSuccess={(url) => setModalAvatarUrl(url)}
            />
            <ImageUploadCard
              label="Banner Portada"
              subtitle="Formato HD WebP"
              currentUrl={modalBannerUrl}
              fallbackType="banner"
              uploadType="banner"
              maxDimension={1200}
              brandColor="#A855F7"
              uploadButtonText="Subir Banner"
              entityName="usr-new"
              onUploadSuccess={(url) => setModalBannerUrl(url)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
            <div className="space-y-1">
              <label className="text-slate-300 uppercase block">Nombre Completo:</label>
              <input type="text" name="name" required placeholder="Nombre Apellido" className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 uppercase block">Gamertag Oficial:</label>
              <input type="text" name="gamertag" required placeholder="GamertagPro" className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-cyan-400 font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 uppercase block">Email:</label>
              <input type="email" name="email" required placeholder="usuario@tournamentspro.com" className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 uppercase block">Contraseña:</label>
              <input type="password" name="password" required defaultValue="123456" className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 uppercase block">Rol eSports:</label>
              <select name="role" defaultValue="Jugador" className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white">
                <option value="Jugador">Jugador</option>
                {isAdmin && <option value="Organizador">Organizador</option>}
                {isAdmin && <option value="Administrador">Administrador</option>}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 uppercase block">Estado:</label>
              <select name="status" defaultValue="Activo" className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white">
                <option value="Activo">🟢 Activo</option>
                <option value="Inactivo">🟡 Inactivo</option>
                <option value="Suspendido">🔴 Suspendido</option>
              </select>
            </div>
          </div>

          <div className="space-y-1 text-xs font-bold">
            <label className="text-slate-300 uppercase block">Biografía / Perfil Atleta:</label>
            <textarea name="biografia" rows={2} placeholder="Descripción e historia del atleta..." className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-normal" />
          </div>

          <SocialMediaGroup prefixName="social" />
        </div>
      </ModalForm>

      {/* MODAL EDITAR USUARIO */}
      {editingUser && (
        <ModalForm
          isOpen={Boolean(editingUser)}
          onClose={() => setEditingUser(null)}
          title={`Editar Usuario: ${editingUser.name}`}
          subtitle={`Gamertag: @${editingUser.gamertag}`}
          onSubmit={handleEditUser}
          isSubmitting={isSubmitting}
          brandColor="#00F0FF"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-900 border border-white/10">
              <ImageUploadCard
                label="Foto de Perfil"
                subtitle="Formato WebP"
                currentUrl={modalAvatarUrl || editingUser.avatar_url}
                fallbackType="avatar"
                uploadType="logo"
                maxDimension={400}
                brandColor="#00F0FF"
                uploadButtonText="Cambiar Foto"
                entityName={editingUser.gamertag}
                entityId={editingUser.id}
                onUploadSuccess={(url) => setModalAvatarUrl(url)}
              />
              <ImageUploadCard
                label="Banner Portada"
                subtitle="Formato HD WebP"
                currentUrl={modalBannerUrl || editingUser.banner_url}
                fallbackType="banner"
                uploadType="banner"
                maxDimension={1200}
                brandColor="#00F0FF"
                uploadButtonText="Cambiar Banner"
                entityName={editingUser.gamertag}
                entityId={editingUser.id}
                onUploadSuccess={(url) => setModalBannerUrl(url)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-slate-300 uppercase block">Nombre Completo:</label>
                <input type="text" name="name" defaultValue={editingUser.name} className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 uppercase block">Gamertag:</label>
                <input type="text" name="gamertag" defaultValue={editingUser.gamertag} className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-cyan-400 font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 uppercase block">Email:</label>
                <input type="email" name="email" defaultValue={editingUser.email} className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 uppercase block">Rol eSports:</label>
                <select name="role" defaultValue={editingUser.role} disabled={!isAdmin} className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white">
                  <option value="Jugador">Jugador</option>
                  <option value="Organizador">Organizador</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 uppercase block">Nueva Contraseña (Opcional):</label>
                <input type="password" name="newPassword" placeholder="Dejar en blanco para conservar" className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 uppercase block font-bold">Estado del Usuario en Sistema:</label>
                <select name="status" defaultValue={editingUser.status || 'Activo'} className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono">
                  <option value="Activo">🟢 Activo (Acceso Permitido)</option>
                  <option value="Inactivo">🟡 Inactivo</option>
                  <option value="Suspendido">🟠 Suspendido (Acceso Suspendido)</option>
                  <option value="Baneado">🔴 Baneado (Bloqueo Total del Sistema)</option>
                </select>
              </div>
            </div>

            {/* 🚫 SANCIÓN Y BANEO DE CHAT ESPORTS */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400">
                  <MessageSquare className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold uppercase text-white">Sanción de Mensajería / Silenciar Chat</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_banned"
                    checked={modalIsBanned}
                    onChange={(e) => setModalIsBanned(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600" />
                </label>
              </div>

              {modalIsBanned && (
                <div className="space-y-1 text-xs">
                  <label className="text-rose-300 uppercase block font-bold">Motivo de Sanción / Silencio de Chat:</label>
                  <input
                    type="text"
                    name="ban_reason"
                    defaultValue={editingUser.ban_reason || 'Infracción disciplinaria del reglamento eSports'}
                    placeholder="Razón del silencio en chat..."
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-rose-500/40 text-rose-200 font-mono"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1 text-xs font-bold">
              <label className="text-slate-300 uppercase block">Biografía:</label>
              <textarea name="biografia" rows={2} defaultValue={editingUser.biografia || ''} className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-normal" />
            </div>

            <SocialMediaGroup
              twitter={editingUser.twitter}
              instagram={editingUser.instagram}
              twitch={editingUser.twitch}
              discord={editingUser.discord}
              prefixName="social"
            />
          </div>
        </ModalForm>
      )}

      {/* MODAL CONFIRMAR BANEO / DESBANEO */}
      {banConfirmUser && (
        <ConfirmModal
          isOpen={Boolean(banConfirmUser)}
          onClose={() => setBanConfirmUser(null)}
          onConfirm={handleConfirmBan}
          title={banConfirmUser.is_banned ? `Desbanear Usuario: @${banConfirmUser.gamertag}` : `Banear Usuario: @${banConfirmUser.gamertag}`}
          description={banConfirmUser.is_banned ? '¿Deseas restaurar el acceso al usuario?' : '¿Deseas suspender el acceso de este usuario al sistema?'}
          confirmText={banConfirmUser.is_banned ? 'Restaurar Acceso' : 'Confirmar Baneo'}
          variant={banConfirmUser.is_banned ? 'success' : 'danger'}
          requireReason={!banConfirmUser.is_banned}
          reasonPlaceholder="Motivo de la infracción o sanción..."
        />
      )}
    </div>
  );
}
