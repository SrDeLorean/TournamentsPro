'use client';

import React, { useState, useEffect } from 'react';
import { GAMES_CATALOG } from '@/lib/games-data';
import { PageHeader } from '@/components/ui/page-header';
import { TeamDirectory } from '@/components/teams/team-directory';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, ShieldAlert, Unlock, Trash2, Edit, Plus, Globe } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { ModalForm } from '@/components/ui/modal-form';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { ImageUploadCard } from '@/components/ui/image-upload-card';
import { SocialMediaGroup } from '@/components/ui/social-media-group';
import { CrudAlertBanner, useCrudNotifier } from '@/components/ui/crud-alert';

export default function TeamsModulePage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'directory' | 'crud' | 'banned'>('directory');
  const [selectedGameSlug, setSelectedGameSlug] = useState<string>('ALL');

  const [teams, setTeams] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [banConfirmTeam, setBanConfirmTeam] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Image upload state for modals
  const [modalLogoUrl, setModalLogoUrl] = useState<string>('');
  const [modalBannerUrl, setModalBannerUrl] = useState<string>('');

  const isAdminOrOrganizer = currentUser?.role === 'Administrador' || currentUser?.role === 'Organizador';

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/admin/teams');
      const data = await res.json();
      if (data.success) setTeams(data.teams);
    } catch (e) {
      console.error('Error cargando equipos:', e);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (editingTeam) {
      setModalLogoUrl(editingTeam.logo_url || editingTeam.logoUrl || '');
      setModalBannerUrl(editingTeam.banner_url || editingTeam.bannerUrl || '');
    } else {
      setModalLogoUrl('');
      setModalBannerUrl('');
    }
  }, [editingTeam]);

  const { crudState, startOperation, endSuccess, endError, resetAlert } = useCrudNotifier();

  // Create Team
  const handleCreateTeam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const teamName = (formData.get('name') || 'NuevoEquipo') as string;
    const gameSlug = (formData.get('gameSlug') as string) || 'eafc26';
    const brandColor = GAMES_CATALOG[gameSlug]?.brandColor || '#00FF87';

    startOperation(`Creación de Escuadra eSports: ${teamName}`);

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
          captainId: currentUser?.id,
          captainName: currentUser?.gamertag || currentUser?.name,
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
        endSuccess(`La escuadra "${teamName}" fue registrada exitosamente en la base de datos.`);
        fetchTeams();
      } else {
        endError(data.error || 'Error al crear la escuadra.');
      }
    } catch (e: any) {
      endError(e?.message || 'Error de conexión al crear escuadra.');
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
          captainName: formData.get('captainName'),
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
        fetchTeams();
      } else {
        endError(data.error || 'Error al actualizar la escuadra.');
      }
    } catch (e: any) {
      endError(e?.message || 'Error de conexión al actualizar escuadra.');
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
        fetchTeams();
      } else {
        endError(data.error || `Error al procesar el ${actionLabel.toLowerCase()}.`);
      }
    } catch (e: any) {
      endError(e?.message || 'Error al conectar con el servidor.');
    }
  };

  const bannedTeams = teams.filter((t) => t.is_banned === 1);

  // DataTable columns definition with Game Badge
  const teamColumns: ColumnDef<any>[] = [
    {
      header: 'Escuadra / Tag',
      sortable: true,
      accessorKey: 'name',
      cell: (r) => {
        const gameConfig = GAMES_CATALOG[r.game_slug];
        const gColor = gameConfig?.brandColor || '#00F0FF';
        return (
          <div className="flex items-center gap-3">
            {r.logo_url ? (
              <img src={r.logo_url} alt={r.name} className="w-8 h-8 rounded-lg object-cover border border-white/10" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-purple-400/40 flex items-center justify-center font-black text-[10px] text-purple-400">
                {r.tag}
              </div>
            )}
            <div>
              <div className="font-black text-white text-xs">{r.name}</div>
              <div className="text-[10px] font-mono text-cyan-400">[{r.tag}]</div>
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
    { header: 'Capitán Oficial', accessorKey: 'captain_name', sortable: true, className: 'font-bold text-slate-200 text-xs' },
    { header: 'Plataforma', accessorKey: 'platform', sortable: true, className: 'font-mono text-cyan-300 text-xs' },
    {
      header: 'Estado',
      sortable: true,
      accessorKey: 'status',
      cell: (r) => (
        <Badge className={`text-[10px] uppercase ${r.is_banned ? 'bg-rose-900 text-rose-200' : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'}`}>
          {r.is_banned ? '🔴 Baneado' : `🟢 ${r.status || 'Activo'}`}
        </Badge>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader
        badgeText="Módulo de Clubes eSports"
        title="MÓDULO DE GESTIÓN & DIRECTORIO DE"
        highlightTitle="CLUBES."
        description="Explora las fichas de clubes de todas las disciplinas, administra información de escuadras y gestiona sanciones."
      />

      <CrudAlertBanner state={crudState} onClose={resetAlert} />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'directory' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'bg-slate-900 border border-white/10 text-slate-300'
          }`}
        >
          <Shield className="w-4 h-4" />
          1. Directorio Oficial de Escuadras
        </button>

        {isAdminOrOrganizer && (
          <button
            onClick={() => setActiveTab('crud')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'crud' ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-900 border border-white/10 text-slate-300'
            }`}
          >
            <Shield className="w-4 h-4" />
            2. Gestión de Escuadras ({teams.length})
          </button>
        )}

        {isAdminOrOrganizer && (
          <button
            onClick={() => setActiveTab('banned')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'banned' ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-900 border border-white/10 text-slate-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            3. Menú de Desbaneo de Clubes ({bannedTeams.length})
          </button>
        )}
      </div>

      {/* TAB 1: DIRECTORIO DE ESCUADRAS CON OPCIÓN "TODAS LAS DISCIPLINAS" */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-2">
            {/* Opción TODAS LAS DISCIPLINAS */}
            <button
              onClick={() => setSelectedGameSlug('ALL')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border flex-shrink-0 ${
                selectedGameSlug === 'ALL'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg scale-105'
                  : 'bg-slate-900/90 text-slate-300 border-white/10 hover:border-white/30'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>TODAS LAS DISCIPLINAS</span>
            </button>

            {Object.values(GAMES_CATALOG).map((g) => {
              const isSelected = g.slug === selectedGameSlug;
              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedGameSlug(g.slug)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border flex-shrink-0 ${
                    isSelected ? 'shadow-lg text-white scale-105' : 'bg-slate-900/90 text-slate-300 border-white/10 hover:border-white/30'
                  }`}
                  style={isSelected ? { backgroundColor: g.brandColor, borderColor: g.brandColor } : {}}
                >
                  <span>{g.name}</span>
                </button>
              );
            })}
          </div>

          <TeamDirectory
            gameName={selectedGameSlug === 'ALL' ? 'Todas las Disciplinas eSports' : GAMES_CATALOG[selectedGameSlug]?.name || 'EA SPORTS FC 26'}
            gameSlug={selectedGameSlug}
            brandColor={selectedGameSlug === 'ALL' ? '#00F0FF' : GAMES_CATALOG[selectedGameSlug]?.brandColor || '#00F0FF'}
            hideHeader={true}
          />
        </div>
      )}

      {/* TAB 2: GESTIÓN DE ESCUADRAS (ADMIN & ORGANIZADOR) */}
      {activeTab === 'crud' && isAdminOrOrganizer && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-purple-300 tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              Tabla General de Escuadras eSports ({teams.length})
            </h3>

            <Button
              onClick={() => {
                setModalLogoUrl('');
                setModalBannerUrl('');
                setIsCreateModalOpen(true);
              }}
              className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs px-4 py-2 rounded-xl shadow-lg flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Nueva Escuadra</span>
            </Button>
          </div>

          <DataTable
            columns={teamColumns}
            data={teams}
            searchPlaceholder="Buscar por escuadra, capitán o tag..."
            brandColor="#A855F7"
            actions={(row) => (
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => setEditingTeam(row)} className="text-xs text-cyan-300 hover:bg-cyan-950 p-2">
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setBanConfirmTeam(row)} className="text-xs text-rose-400 hover:bg-rose-950 p-2">
                  <ShieldAlert className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          />
        </div>
      )}

      {/* TAB 3: MENÚ DE DESBANEO DE CLUBES */}
      {activeTab === 'banned' && isAdminOrOrganizer && (
        <div className="space-y-6">
          <h3 className="text-sm font-black uppercase text-rose-400 tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            Escuadras eSports Sancionadas ({bannedTeams.length})
          </h3>

          <DataTable
            columns={teamColumns}
            data={bannedTeams}
            searchPlaceholder="Buscar escuadra baneada..."
            brandColor="#F43F5E"
            actions={(row) => (
              <Button
                size="sm"
                onClick={() => setBanConfirmTeam(row)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1"
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
        brandColor="#A855F7"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-900 border border-white/10">
            <ImageUploadCard
              label="Escudo Oficial del Club"
              subtitle="Formato WebP"
              currentUrl={modalLogoUrl}
              fallbackType="logo"
              uploadType="logo"
              maxDimension={512}
              brandColor="#A855F7"
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
              brandColor="#A855F7"
              uploadButtonText="Subir Banner"
              entityName="team-new"
              onUploadSuccess={(url) => setModalBannerUrl(url)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
            <div className="space-y-1">
              <label className="text-slate-300 uppercase block">Nombre de la Escuadra:</label>
              <input type="text" name="name" required placeholder="ViperX Gaming" className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 uppercase block">Tag / Trigram:</label>
              <input type="text" name="tag" required maxLength={5} placeholder="VPX" className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-purple-300 font-mono uppercase" />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 uppercase block">Disciplina eSports:</label>
              <select name="gameSlug" defaultValue="eafc26" className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white">
                {Object.entries(GAMES_CATALOG).map(([slug, g]) => (
                  <option key={slug} value={slug}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 uppercase block">Plataforma:</label>
              <select name="platform" defaultValue="CROSSPLAY" className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white">
                <option value="CROSSPLAY">CROSSPLAY</option>
                <option value="PS5">PlayStation 5</option>
                <option value="PC">PC Gaming</option>
                <option value="XBOX">Xbox Series X</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 uppercase block">Estado del Club:</label>
              <select name="status" defaultValue="Reclutando" className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white">
                <option value="Reclutando">🟢 Reclutando</option>
                <option value="Plantilla Completa">🟡 Plantilla Completa</option>
                <option value="Inactivo">🔴 Inactivo</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 uppercase block">ID EA / Tag Oficial:</label>
              <input type="text" name="clubIdEa" placeholder="ID Oficial EA / Faceit / Riot" className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono" />
            </div>
          </div>

          <div className="space-y-1 text-xs font-bold">
            <label className="text-slate-300 uppercase block">Historia / Descripción del Club:</label>
            <textarea name="description" rows={2} placeholder="Historia, logros y metas eSports..." className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-normal" />
          </div>

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
          brandColor="#00F0FF"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-900 border border-white/10">
              <ImageUploadCard
                label="Escudo Oficial del Club"
                subtitle="Formato WebP"
                currentUrl={modalLogoUrl || editingTeam.logo_url}
                fallbackType="logo"
                uploadType="logo"
                maxDimension={512}
                brandColor="#00F0FF"
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
                brandColor="#00F0FF"
                uploadButtonText="Cambiar Banner"
                entityName={editingTeam.name}
                entityId={editingTeam.id}
                onUploadSuccess={(url) => setModalBannerUrl(url)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-slate-300 uppercase block">Nombre de la Escuadra:</label>
                <input type="text" name="name" defaultValue={editingTeam.name} className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 uppercase block">Tag:</label>
                <input type="text" name="tag" defaultValue={editingTeam.tag} className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-purple-300 font-mono uppercase" />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 uppercase block">Capitán Oficial:</label>
                <input type="text" name="captainName" defaultValue={editingTeam.captain_name || editingTeam.captainName} className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 uppercase block">Disciplina eSports:</label>
                <select name="gameSlug" defaultValue={editingTeam.game_slug || 'eafc26'} className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white">
                  {Object.entries(GAMES_CATALOG).map(([slug, g]) => (
                    <option key={slug} value={slug}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 uppercase block">Plataforma:</label>
                <select name="platform" defaultValue={editingTeam.platform || 'CROSSPLAY'} className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white">
                  <option value="CROSSPLAY">CROSSPLAY</option>
                  <option value="PS5">PlayStation 5</option>
                  <option value="PC">PC Gaming</option>
                  <option value="XBOX">Xbox Series X</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 uppercase block">Estado del Club:</label>
                <select name="status" defaultValue={editingTeam.status || 'Reclutando'} className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white">
                  <option value="Reclutando">🟢 Reclutando</option>
                  <option value="Plantilla Completa">🟡 Plantilla Completa</option>
                  <option value="Inactivo">🔴 Inactivo</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 text-xs font-bold">
              <label className="text-slate-300 uppercase block">Descripción / Historia:</label>
              <textarea name="description" rows={2} defaultValue={editingTeam.description || ''} className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-normal" />
            </div>

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
    </div>
  );
}
