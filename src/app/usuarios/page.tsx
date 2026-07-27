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

export default function UsersModulePage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'directory' | 'management' | 'banned'>('directory');

  const [usersList, setUsersList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

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

  const isAdmin = currentUser?.role === 'Administrador';
  const isOrganizer = currentUser?.role === 'Organizador';
  const canManage = isAdmin || isOrganizer;

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsersList(data.users);
      }
    } catch (err) {
      console.error('Error cargando usuarios desde BD MySQL:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Sync images when editing user opens
  useEffect(() => {
    if (editingUser) {
      setModalAvatarUrl(editingUser.avatar_url || editingUser.foto || '');
      setModalBannerUrl(editingUser.banner_url || '');
    } else {
      setModalAvatarUrl('');
      setModalBannerUrl('');
    }
  }, [editingUser]);

  const { crudState, startOperation, endSuccess, endError, resetAlert } = useCrudNotifier();

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

  const filteredUsers = usersList.filter((user) => {
    const matchesSearch =
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.gamertag || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.position || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

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
            <div className="font-bold text-white text-xs">{row.name}</div>
            <div className="text-[10px] font-mono text-cyan-400">@{row.gamertag}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Email / Contacto',
      accessorKey: 'email',
      sortable: true,
      className: 'font-mono text-slate-300 text-[11px]',
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

      {/* Navigation Tabs per Module */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => {
            setSelectedPlayer(null);
            setActiveTab('directory');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'directory' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'bg-slate-900 border border-white/10 text-slate-300'
          }`}
        >
          <Users className="w-4 h-4" />
          1. Directorio Público de Atletas ({usersList.filter((u) => !u.is_banned).length})
        </button>

        {canManage && (
          <button
            onClick={() => setActiveTab('management')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'management' ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-900 border border-white/10 text-slate-300'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            2. Gestión & Roles ({isAdmin ? 'Administrador' : 'Organizador'})
          </button>
        )}

        {canManage && (
          <button
            onClick={() => setActiveTab('banned')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'banned' ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-900 border border-white/10 text-slate-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            3. Menú de Desbaneo ({bannedUsers.length})
          </button>
        )}
      </div>

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
            <FilterBar
              searchPlaceholder="Buscar por Gamertag, nombre o posición..."
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              brandColor="#00F0FF"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers
                .filter((u) => !u.is_banned)
                .map((user) => (
                  <Card
                    key={user.id}
                    onClick={() => setSelectedPlayer(user)}
                    className="p-5 bg-slate-950 border border-white/10 hover:border-cyan-400/60 transition-all space-y-4 shadow-xl cursor-pointer hover:scale-[1.02] group"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar fallback={user.name} src={user.avatar_url || user.foto} size="md" status="online" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-white text-base uppercase group-hover:text-cyan-300 transition-colors">{user.name}</h4>
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <p className="text-xs font-mono text-cyan-400">@{user.gamertag}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                      <PositionBadge primaryPosition={user.position} secondaryPosition={user.secondaryPosition || user.secondary_position} />
                      <span className="text-xs font-mono font-black text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-amber-500/30">
                        ★ {user.rating || '9.0'} OVR
                      </span>
                    </div>
                  </Card>
                ))}
            </div>
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
                  className="text-xs text-purple-300 hover:bg-purple-950 p-2"
                >
                  <Edit className="w-3.5 h-3.5" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setBanConfirmUser(row)}
                  className={`text-xs p-2 ${
                    row.is_banned ? 'text-emerald-400 hover:bg-emerald-950' : 'text-rose-400 hover:bg-rose-950'
                  }`}
                >
                  {row.is_banned ? <Unlock className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
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
                <label className="text-slate-300 uppercase block">Estado:</label>
                <select name="status" defaultValue={editingUser.status || 'Activo'} className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white">
                  <option value="Activo">🟢 Activo</option>
                  <option value="Inactivo">🟡 Inactivo</option>
                  <option value="Suspendido">🔴 Suspendido</option>
                </select>
              </div>
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
