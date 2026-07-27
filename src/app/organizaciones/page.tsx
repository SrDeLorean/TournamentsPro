'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/components/providers/auth-provider';
import { Building2, Plus, Shield, Edit, Globe, Calendar, MapPin, Sparkles, Users, CheckCircle2 } from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games-data';
import { DataTable } from '@/components/ui/data-table';
import { ModalForm } from '@/components/ui/modal-form';
import { ImageUploadCard } from '@/components/ui/image-upload-card';
import { SocialMediaGroup } from '@/components/ui/social-media-group';
import { CrudAlertBanner, useCrudNotifier } from '@/components/ui/crud-alert';

export default function OrganizationsModulePage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'directory' | 'admin'>('directory');

  const [organizations, setOrganizations] = useState<any[]>([]);
  const [availableOrganizers, setAvailableOrganizers] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingOrg, setEditingOrg] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Image Upload State for Modals
  const [modalLogoUrl, setModalLogoUrl] = useState<string>('');
  const [modalBannerUrl, setModalBannerUrl] = useState<string>('');

  const isAdmin = currentUser?.role === 'Administrador';

  const fetchOrganizations = async () => {
    try {
      const res = await fetch('/api/admin/organizations');
      const data = await res.json();
      if (data.success) {
        setOrganizations(data.organizations);
      }
    } catch (e) {
      console.error('Error cargando organizaciones:', e);
    }
  };

  const fetchAvailableOrganizers = async () => {
    try {
      const res = await fetch('/api/admin/users?role=Organizador');
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setAvailableOrganizers(data.users);
      }
    } catch (e) {
      console.error('Error cargando organizadores:', e);
    }
  };

  useEffect(() => {
    fetchOrganizations();
    if (isAdmin) fetchAvailableOrganizers();
  }, [isAdmin]);

  // Sync images when editing org opens
  useEffect(() => {
    if (editingOrg) {
      setModalLogoUrl(editingOrg.logo_url || editingOrg.logoUrl || '');
      setModalBannerUrl(editingOrg.banner_url || editingOrg.bannerUrl || '');
    } else {
      setModalLogoUrl('');
      setModalBannerUrl('');
    }
  }, [editingOrg]);

  const { crudState, startOperation, endSuccess, endError, resetAlert } = useCrudNotifier();

  const handleCreateOrg = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const orgName = (formData.get('name') || 'NuevaOrganización') as string;

    startOperation(`Creación de Organización Madre: ${orgName}`);

    const selectedGames: string[] = [];
    Object.keys(GAMES_CATALOG).forEach((slug) => {
      if (formData.get(`game_${slug}`)) selectedGames.push(slug);
    });

    const selectedOrganizerIds: string[] = [];
    availableOrganizers.forEach((orgUser) => {
      if (formData.get(`organizer_${orgUser.id}`)) selectedOrganizerIds.push(orgUser.id);
    });

    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          tag: formData.get('tag'),
          ownerId: currentUser?.id,
          allowedGames: selectedGames,
          logoUrl: modalLogoUrl,
          bannerUrl: modalBannerUrl,
          country: formData.get('country'),
          foundedYear: formData.get('foundedYear'),
          rating: formData.get('rating'),
          website: formData.get('website'),
          organizerIds: selectedOrganizerIds,
          socialMedia: {
            twitter: formData.get('social_twitter'),
            instagram: formData.get('social_instagram'),
            twitch: formData.get('social_twitch'),
            youtube: formData.get('social_youtube'),
          },
          requesterRole: currentUser?.role,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsCreateModalOpen(false);
        setModalLogoUrl('');
        setModalBannerUrl('');
        endSuccess(`La organización "${orgName}" y sus organizadores asignados fueron registrados correctamente.`);
        fetchOrganizations();
      } else {
        endError(data.error || 'Error al crear la organización.');
      }
    } catch (e: any) {
      endError(e?.message || 'Error de conexión al crear organización.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditOrg = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingOrg) return;
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const orgName = editingOrg.name || 'Organización';

    startOperation(`Edición de Organización Madre: ${orgName}`);

    const selectedGames: string[] = [];
    Object.keys(GAMES_CATALOG).forEach((slug) => {
      if (formData.get(`game_${slug}`)) selectedGames.push(slug);
    });

    const selectedOrganizerIds: string[] = [];
    availableOrganizers.forEach((orgUser) => {
      if (formData.get(`organizer_${orgUser.id}`)) selectedOrganizerIds.push(orgUser.id);
    });

    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingOrg.id,
          name: formData.get('name'),
          tag: formData.get('tag'),
          status: formData.get('status'),
          allowedGames: selectedGames,
          logoUrl: modalLogoUrl || editingOrg.logo_url,
          bannerUrl: modalBannerUrl || editingOrg.banner_url,
          country: formData.get('country'),
          foundedYear: formData.get('foundedYear'),
          rating: formData.get('rating'),
          website: formData.get('website'),
          organizerIds: selectedOrganizerIds,
          socialMedia: {
            twitter: formData.get('social_twitter'),
            instagram: formData.get('social_instagram'),
            twitch: formData.get('social_twitch'),
            youtube: formData.get('social_youtube'),
          },
          requesterRole: currentUser?.role,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditingOrg(null);
        setModalLogoUrl('');
        setModalBannerUrl('');
        endSuccess(`Los datos de la organización "${orgName}" fueron actualizados con éxito.`);
        fetchOrganizations();
      } else {
        endError(data.error || 'Error al actualizar la organización.');
      }
    } catch (e: any) {
      endError(e?.message || 'Error de conexión al guardar cambios.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader
        badgeText="Módulo de Organizaciones Madre"
        title="ORGANIZACIONES & ASIGNACIÓN DE"
        highlightTitle="COMPETENCIAS."
        description="Explora las Organizaciones eSports oficiales, asignación de organizadores vinculados y disciplinas autorizadas."
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
          <Building2 className="w-4 h-4" />
          1. Directorio Oficial de Organizaciones ({organizations.length})
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'admin' ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-900 border border-white/10 text-slate-300'
            }`}
          >
            <Shield className="w-4 h-4" />
            2. Administración & Asignación de Organizadores (Admin Only)
          </button>
        )}
      </div>

      {/* TAB 1: DIRECTORIO DE ORGANIZACIONES MADRE */}
      {activeTab === 'directory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {organizations.map((org) => (
            <Card key={org.id} className="overflow-hidden bg-slate-950 border border-white/10 space-y-0 shadow-2xl hover:border-purple-400/50 transition-all">
              {/* Banner de Portada */}
              <div className="h-28 relative bg-gradient-to-r from-purple-950 via-slate-900 to-cyan-950 overflow-hidden">
                {org.banner_url ? (
                  <img src={org.banner_url} alt={org.name} className="w-full h-full object-cover opacity-60" />
                ) : (
                  <div className="w-full h-full bg-purple-900/20" />
                )}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <Badge variant="cyan" className="font-mono text-[10px] uppercase font-bold">
                    ★ {org.rating || '4.98'} Rating
                  </Badge>
                  <Badge className="bg-emerald-950 text-emerald-300 font-mono text-[10px] border border-emerald-500/30">
                    🟢 {org.status || 'Activa'}
                  </Badge>
                </div>
              </div>

              {/* Contenido Principal & Logo */}
              <div className="p-6 pt-0 relative space-y-4">
                <div className="flex items-end justify-between -mt-8 mb-2">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-purple-400 overflow-hidden shadow-xl flex items-center justify-center font-black text-white text-xl">
                    {org.logo_url ? (
                      <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
                    ) : (
                      org.tag
                    )}
                  </div>
                  <span className="text-xs font-mono text-purple-300 font-bold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {org.country || 'Venezuela'} • Est. {org.founded_year || '2019'}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-white text-lg uppercase tracking-wider">{org.name}</h3>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-xs text-slate-400 font-mono">Tag Oficial: [{org.tag}]</p>
                </div>

                {/* Organizadores Asignados */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-black tracking-wider block flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    Organizadores Asignados:
                  </span>
                  {org.organizers && org.organizers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {org.organizers.map((oUser: any) => (
                        <div key={oUser.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-500/30">
                          <Avatar fallback={oUser.name} src={oUser.avatar_url || oUser.foto} size="sm" />
                          <span className="text-[11px] font-bold text-purple-200">@{oUser.gamertag || oUser.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">Sin organizadores vinculados</span>
                  )}
                </div>

                {/* Disciplinas Autorizadas */}
                <div className="pt-2 border-t border-white/10 space-y-1.5">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase block">Disciplinas eSports Autorizadas:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(org.allowedGames || ['eafc26', 'valorant']).map((gameSlug: string) => (
                      <span key={gameSlug} className="px-2.5 py-1 rounded bg-purple-950 text-purple-300 font-mono text-[10px] font-bold border border-purple-500/30 uppercase">
                        {gameSlug}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 2: ADMINISTRACIÓN CRUD & ASIGNACIÓN DE ORGANIZADORES */}
      {activeTab === 'admin' && isAdmin && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-purple-300 tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              Tabla General de Organizaciones & Asignación de Organizadores
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
              <span>Nueva Organización</span>
            </Button>
          </div>

          <DataTable
            columns={[
              {
                header: 'Organización',
                cell: (r) => (
                  <div className="flex items-center gap-3">
                    {r.logo_url ? (
                      <img src={r.logo_url} alt={r.name} className="w-8 h-8 rounded-lg object-cover border border-purple-400" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-400 flex items-center justify-center font-black text-[10px] text-white">
                        {r.tag}
                      </div>
                    )}
                    <div>
                      <div className="font-black text-white text-xs">{r.name}</div>
                      <div className="text-[10px] font-mono text-purple-300">[{r.tag}]</div>
                    </div>
                  </div>
                ),
              },
              {
                header: 'Organizadores Vinculados',
                cell: (r) => (
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-white font-bold">{r.organizers_count || r.organizers?.length || 0}</span>
                    <span className="text-[10px] text-slate-400">asignados</span>
                  </div>
                ),
              },
              { header: 'País / Sede', accessorKey: 'country', className: 'font-mono text-slate-300' },
              { header: 'Año Fundación', accessorKey: 'founded_year', className: 'font-mono text-slate-300' },
              { header: 'Estado', cell: (r) => <Badge variant="cyan" className="font-mono text-[10px] uppercase">{r.status || 'Activa'}</Badge> },
            ]}
            data={organizations}
            searchPlaceholder="Buscar organización..."
            brandColor="#A855F7"
            actions={(row) => (
              <Button size="sm" variant="ghost" onClick={() => setEditingOrg(row)} className="text-xs text-purple-300 hover:bg-purple-950 p-2">
                <Edit className="w-3.5 h-3.5" />
              </Button>
            )}
          />
        </div>
      )}

      {/* MODAL CREAR ORGANIZACIÓN */}
      <ModalForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nueva Organización eSports"
        subtitle="Registrar organización en la base de datos MySQL"
        onSubmit={handleCreateOrg}
        isSubmitting={isSubmitting}
        brandColor="#A855F7"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-900 border border-white/10">
            <ImageUploadCard
              label="Logo / Escudo Oficial"
              subtitle="Formato WebP"
              currentUrl={modalLogoUrl}
              fallbackType="logo"
              uploadType="logo"
              maxDimension={512}
              brandColor="#A855F7"
              uploadButtonText="Subir Escudo"
              entityName="org-new"
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
              entityName="org-new"
              onUploadSuccess={(url) => setModalBannerUrl(url)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
            <div className="space-y-1">
              <label className="text-slate-300 uppercase block">Nombre Oficial:</label>
              <input type="text" name="name" required placeholder="San Lorenzo eSports" className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 uppercase block">Tag / Abreviatura:</label>
              <input type="text" name="tag" required maxLength={5} placeholder="SL" className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-purple-300 font-mono uppercase" />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 uppercase block">País / Sede:</label>
              <input type="text" name="country" defaultValue="Venezuela" className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 uppercase block">Año de Fundación:</label>
              <input type="text" name="foundedYear" defaultValue="2019" className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 uppercase block">Rating de Prestigio:</label>
              <input type="text" name="rating" defaultValue="4.98" className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-amber-400 font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 uppercase block">Sitio Web Oficial:</label>
              <input type="text" name="website" placeholder="https://sanlorenzoesports.com" className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono" />
            </div>
          </div>

          {/* Asignación de Organizadores */}
          <div className="space-y-2 p-3 rounded-xl bg-slate-900 border border-white/10">
            <label className="text-xs font-bold text-slate-300 uppercase block flex items-center gap-1">
              <Users className="w-4 h-4 text-purple-400" />
              Asignar Organizadores a la Organización:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableOrganizers.map((oUser) => (
                <label key={oUser.id} className="flex items-center gap-2 text-xs font-semibold text-white bg-slate-950 p-2 rounded-lg border border-white/10 cursor-pointer">
                  <input type="checkbox" name={`organizer_${oUser.id}`} />
                  <Avatar fallback={oUser.name} src={oUser.avatar_url || oUser.foto} size="sm" />
                  <span>@{oUser.gamertag || oUser.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase block">Disciplinas eSports Autorizadas:</label>
            <div className="flex flex-wrap gap-3">
              {Object.entries(GAMES_CATALOG).map(([slug, g]) => (
                <label key={slug} className="flex items-center gap-2 text-xs font-semibold text-white bg-slate-900 p-2 rounded-xl border border-white/10 cursor-pointer">
                  <input type="checkbox" name={`game_${slug}`} defaultChecked />
                  <span>{g.name}</span>
                </label>
              ))}
            </div>
          </div>

          <SocialMediaGroup prefixName="social" />
        </div>
      </ModalForm>

      {/* MODAL EDITAR ORGANIZACIÓN */}
      {editingOrg && (
        <ModalForm
          isOpen={Boolean(editingOrg)}
          onClose={() => setEditingOrg(null)}
          title={`Editar Organización: ${editingOrg.name}`}
          subtitle={`Tag: [${editingOrg.tag}]`}
          onSubmit={handleEditOrg}
          isSubmitting={isSubmitting}
          brandColor="#00F0FF"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-900 border border-white/10">
              <ImageUploadCard
                label="Logo / Escudo Oficial"
                subtitle="Formato WebP"
                currentUrl={modalLogoUrl || editingOrg.logo_url}
                fallbackType="logo"
                uploadType="logo"
                maxDimension={512}
                brandColor="#00F0FF"
                uploadButtonText="Cambiar Escudo"
                entityName={editingOrg.name}
                entityId={editingOrg.id}
                onUploadSuccess={(url) => setModalLogoUrl(url)}
              />
              <ImageUploadCard
                label="Banner de Portada"
                subtitle="Formato HD WebP"
                currentUrl={modalBannerUrl || editingOrg.banner_url}
                fallbackType="banner"
                uploadType="banner"
                maxDimension={1200}
                brandColor="#00F0FF"
                uploadButtonText="Cambiar Banner"
                entityName={editingOrg.name}
                entityId={editingOrg.id}
                onUploadSuccess={(url) => setModalBannerUrl(url)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-slate-300 uppercase block">Nombre Oficial:</label>
                <input type="text" name="name" defaultValue={editingOrg.name} className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 uppercase block">Tag:</label>
                <input type="text" name="tag" defaultValue={editingOrg.tag} className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-purple-300 font-mono uppercase" />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 uppercase block">País / Sede:</label>
                <input type="text" name="country" defaultValue={editingOrg.country || 'Venezuela'} className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 uppercase block">Año de Fundación:</label>
                <input type="text" name="foundedYear" defaultValue={editingOrg.founded_year || '2019'} className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 uppercase block">Rating de Prestigio:</label>
                <input type="text" name="rating" defaultValue={editingOrg.rating || '4.98'} className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-amber-400 font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 uppercase block">Sitio Web Oficial:</label>
                <input type="text" name="website" defaultValue={editingOrg.website || ''} className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono" />
              </div>
            </div>

            {/* Asignación de Organizadores */}
            <div className="space-y-2 p-3 rounded-xl bg-slate-900 border border-white/10">
              <label className="text-xs font-bold text-slate-300 uppercase block flex items-center gap-1">
                <Users className="w-4 h-4 text-purple-400" />
                Asignar Organizadores a esta Organización:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableOrganizers.map((oUser) => {
                  const isAssigned = editingOrg.organizers?.some((o: any) => o.id === oUser.id);
                  return (
                    <label key={oUser.id} className="flex items-center gap-2 text-xs font-semibold text-white bg-slate-950 p-2 rounded-lg border border-white/10 cursor-pointer">
                      <input type="checkbox" name={`organizer_${oUser.id}`} defaultChecked={isAssigned} />
                      <Avatar fallback={oUser.name} src={oUser.avatar_url || oUser.foto} size="sm" />
                      <span>@{oUser.gamertag || oUser.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase block">Disciplinas eSports Autorizadas:</label>
              <div className="flex flex-wrap gap-3">
                {Object.entries(GAMES_CATALOG).map(([slug, g]) => {
                  const isChecked = (editingOrg.allowedGames || []).includes(slug);
                  return (
                    <label key={slug} className="flex items-center gap-2 text-xs font-semibold text-white bg-slate-900 p-2 rounded-xl border border-white/10 cursor-pointer">
                      <input type="checkbox" name={`game_${slug}`} defaultChecked={isChecked} />
                      <span>{g.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <SocialMediaGroup
              twitter={editingOrg.socialMedia?.twitter}
              instagram={editingOrg.socialMedia?.instagram}
              twitch={editingOrg.socialMedia?.twitch}
              prefixName="social"
            />
          </div>
        </ModalForm>
      )}
    </div>
  );
}
