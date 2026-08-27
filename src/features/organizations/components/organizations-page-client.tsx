'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/components/providers/auth-provider';
import { Building2, Plus, Shield, Edit, Users, Trophy, Star, Trash2 } from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games-data';
import { DataTable } from '@/components/ui/data-table';
import { ModalForm } from '@/components/ui/modal-form';
import { ImageUploadCard } from '@/components/ui/image-upload-card';
import { SocialMediaGroup } from '@/components/ui/social-media-group';
import { CrudAlertBanner, useCrudNotifier } from '@/components/ui/crud-alert';
import { EsportsCard, type EsportsSocialLinks } from '@/components/ui/esports-card';
import { FilterBar } from '@/components/ui/filter-bar';
import { Pagination } from '@/components/ui/pagination';
import { shouldBypassImageOptimization } from '@/lib/image-utils';
import { getDirectoryEndpoint } from '@/lib/directory-endpoints';

interface OrganizerOption {
  id: string;
  name: string;
  gamertag?: string;
  avatar_url?: string;
  foto?: string;
}

interface OrganizationRecord {
  id: string;
  name: string;
  tag?: string;
  country?: string;
  description?: string;
  status?: string;
  game_slug?: string;
  logo_url?: string;
  logoUrl?: string;
  banner_url?: string;
  bannerUrl?: string;
  founded_year?: string | number;
  foundedYear?: string | number;
  rating?: string | number;
  website?: string;
  allowedGames?: string[] | string;
  organizers?: OrganizerOption[];
  organizers_count?: number;
  socialMedia?: Record<string, string>;
  social_media?: Record<string, string> | string;
  social_twitter?: string;
  social_instagram?: string;
  social_twitch?: string;
  social_youtube?: string;
}

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const organizationSocials = (organization: OrganizationRecord): EsportsSocialLinks => {
  let storedSocials: EsportsSocialLinks | undefined;
  if (typeof organization.social_media === 'string') {
    try {
      storedSocials = JSON.parse(organization.social_media) as EsportsSocialLinks;
    } catch {
      storedSocials = undefined;
    }
  } else {
    storedSocials = organization.social_media;
  }

  return organization.socialMedia || storedSocials || {
    twitter: organization.social_twitter,
    instagram: organization.social_instagram,
    twitch: organization.social_twitch,
    youtube: organization.social_youtube,
    website: organization.website,
  };
};

export default function OrganizationsModulePage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'directory' | 'admin'>('directory');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [availableOrganizers, setAvailableOrganizers] = useState<OrganizerOption[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingOrg, setEditingOrg] = useState<OrganizationRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Image Upload State for Modals
  const [modalLogoUrl, setModalLogoUrl] = useState<string>('');
  const [modalBannerUrl, setModalBannerUrl] = useState<string>('');

  const isAdmin = currentUser?.role === 'Administrador';

  const fetchOrganizations = React.useCallback(async (): Promise<OrganizationRecord[]> => {
    try {
      const res = await fetch(getDirectoryEndpoint('organizations', isAdmin));
      if (!res.ok) throw new Error(`No se pudieron cargar las organizaciones (${res.status})`);
      const data: { success?: boolean; organizations?: OrganizationRecord[] } = await res.json();
      return data.success && Array.isArray(data.organizations) ? data.organizations : [];
    } catch (e) {
      console.error('Error cargando organizaciones:', e);
      return [];
    }
  }, [isAdmin]);

  const fetchAvailableOrganizers = React.useCallback(async (): Promise<OrganizerOption[]> => {
    if (!isAdmin) return [];

    try {
      const res = await fetch('/api/admin/users?role=Organizador');
      if (!res.ok) throw new Error(`No se pudieron cargar los organizadores (${res.status})`);
      const data: { success?: boolean; users?: OrganizerOption[] } = await res.json();
      return data.success && Array.isArray(data.users) ? data.users : [];
    } catch (e) {
      console.error('Error cargando organizadores:', e);
      return [];
    }
  }, [isAdmin]);

  const refreshOrganizations = () => void fetchOrganizations().then(setOrganizations);

  useEffect(() => {
    void Promise.all([
      fetchOrganizations(),
      isAdmin ? fetchAvailableOrganizers() : Promise.resolve([]),
    ]).then(([organizationRows, organizerRows]) => {
      setOrganizations(organizationRows);
      setAvailableOrganizers(organizerRows);
    });
  }, [fetchAvailableOrganizers, fetchOrganizations, isAdmin]);

  const openCreateModal = () => {
    setModalLogoUrl('');
    setModalBannerUrl('');
    setIsCreateModalOpen(true);
  };

  const openEditModal = (organization: OrganizationRecord) => {
    setModalLogoUrl(organization.logo_url || organization.logoUrl || '');
    setModalBannerUrl(organization.banner_url || organization.bannerUrl || '');
    setEditingOrg(organization);
  };

  const { crudState, startOperation, endSuccess, endError, resetAlert } = useCrudNotifier();

  const filteredOrgs = organizations.filter((org) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = org.name.toLowerCase().includes(term) || (org.tag && org.tag.toLowerCase().includes(term)) || (org.country && org.country.toLowerCase().includes(term));
    const allowed = Array.isArray(org.allowedGames)
      ? org.allowedGames
      : (typeof org.allowedGames === 'string' ? JSON.parse(org.allowedGames || '[]') : []);
    const matchesDiscipline = selectedDiscipline === 'ALL' || allowed.includes(selectedDiscipline) || org.game_slug === selectedDiscipline;
    return matchesSearch && matchesDiscipline;
  });

  const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredOrgs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentOrgs = filteredOrgs.slice(startIndex, startIndex + itemsPerPage);

  const DISCIPLINE_OPTIONS = [
    { id: 'ALL', label: 'TODAS LAS DISCIPLINAS' },
    { id: 'eafc26', label: 'EA FC 26' },
    { id: 'valorant', label: 'VALORANT' },
    { id: 'csgo', label: 'CS2' },
    { id: 'lol', label: 'LOL' },
    { id: 'rocketleague', label: 'ROCKET LEAGUE' },
    { id: 'fortnite', label: 'FORTNITE' },
  ];

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
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsCreateModalOpen(false);
        setModalLogoUrl('');
        setModalBannerUrl('');
        endSuccess(`La organización "${orgName}" y sus organizadores asignados fueron registrados correctamente.`);
        refreshOrganizations();
      } else {
        endError(data.error || 'Error al crear la organización.');
      }
    } catch (e: unknown) {
      endError(errorMessage(e, 'Error de conexión al crear organización.'));
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
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditingOrg(null);
        setModalLogoUrl('');
        setModalBannerUrl('');
        endSuccess(`Los datos de la organización "${orgName}" fueron actualizados con éxito.`);
        refreshOrganizations();
      } else {
        endError(data.error || 'Error al actualizar la organización.');
      }
    } catch (e: unknown) {
      endError(errorMessage(e, 'Error de conexión al guardar cambios.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrg = async (organization: OrganizationRecord) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la organización "${organization.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    
    startOperation(`Eliminación de Organización: ${organization.name}`);
    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: organization.id }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        endSuccess(`La organización "${organization.name}" fue eliminada correctamente.`);
        refreshOrganizations();
      } else {
        endError(data.error || 'Error al eliminar la organización.');
      }
    } catch (e: unknown) {
      endError(errorMessage(e, 'Error de conexión al eliminar la organización.'));
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

      {/* Navigation Tabs (Solo para Administradores) */}
      {isAdmin && (
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'directory' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'bg-slate-900 border border-white/10 text-slate-300'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Directorio de Organizaciones
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'admin' ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-900 border border-white/10 text-slate-300'
            }`}
          >
            <Shield className="w-4 h-4" />
            Administración & Asignación de Organizadores
          </button>
        </div>
      )}

      {/* TAB 1: DIRECTORIO DE ORGANIZACIONES MADRE */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          <FilterBar
            searchPlaceholder="Buscar organizaciones madre por nombre, tag o país..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            options={DISCIPLINE_OPTIONS}
            activeFilter={selectedDiscipline}
            onFilterChange={setSelectedDiscipline}
            renderAsSelect={true}
            count={filteredOrgs.length}
            countLabel="ORGANIZACIONES"
            brandColor="#A855F7"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentOrgs.map((org, index) => {
              const bannerImg = org.banner_url || org.bannerUrl || '/images/default/banner-default.jpg';
              const logoImg = org.logo_url || org.logoUrl || '/images/default/logo-default.png';

              const allowedList = Array.isArray(org.allowedGames)
                ? org.allowedGames
                : (typeof org.allowedGames === 'string' ? JSON.parse(org.allowedGames || '[]') : []);

              const primarySlug = selectedDiscipline !== 'ALL'
                ? selectedDiscipline
                : (allowedList[0] || org.game_slug || 'eafc26');

              const gameCfg = GAMES_CATALOG[primarySlug] || GAMES_CATALOG['eafc26'];
              const orgBrandColor = gameCfg?.brandColor || '#A855F7';

              return (
                <EsportsCard
                  key={org.id}
                  title={org.name}
                  subtitle={`🎮 ${gameCfg?.name || 'eSports'} | ${org.tag ? `[${org.tag}]` : 'Madre'}`}
                  description={org.description || `Organización oficial eSports y administradora de torneos competitivos.`}
                  bannerUrl={bannerImg}
                  logoUrl={logoImg}
                  tag={org.tag}
                  country={org.country || 'Global'}
                  socials={organizationSocials(org)}
                  badges={[
                    { text: gameCfg?.name || 'eSports', variant: 'purple' },
                    { text: org.status || 'Activa', variant: 'emerald', pulse: true },
                  ]}
                  stats={[
                    { icon: <Trophy className="w-3.5 h-3.5 text-amber-400" />, label: 'Organizadores', value: org.organizers?.length || 1 },
                    { icon: <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />, label: 'Prestigio', value: org.rating || '4.98', highlight: true },
                  ]}
                  footerLeft={
                    <span className="flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" style={{ color: orgBrandColor }} />
                      <span style={{ color: orgBrandColor }} className="font-bold">Est. {org.founded_year || org.foundedYear || '2019'}</span>
                    </span>
                  }
                  actionText="VER DETALLES"
                  brandColor={orgBrandColor}
                  animationDelay={index * 50}
                >
                  <div className="pt-2 border-t border-[var(--border-card)]/50 space-y-1.5 font-mono">
                    <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-wider block">
                      Disciplinas Habilitadas:
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(allowedList.length > 0 ? allowedList : ['eafc26', 'valorant', 'lol']).map((gSlug: string) => {
                        const gConfig = GAMES_CATALOG[gSlug];
                        if (!gConfig) return null;

                        return (
                          <div
                            key={gSlug}
                            title={`Disciplina: ${gConfig.name}`}
                            className="w-7 h-7 rounded-xl bg-[var(--bg-main)]/90 border flex items-center justify-center p-1.5 hover:scale-125 transition-all duration-300 shadow-md group/logo cursor-pointer"
                            style={{
                              borderColor: gConfig.brandColor,
                              boxShadow: `0 0 10px color-mix(in srgb, ${gConfig.brandColor} 35%, transparent)`,
                            }}
                          >
                            {gConfig.logoUrl ? (
                              <Image
                                src={gConfig.logoUrl}
                                alt={gConfig.name}
                                width={32}
                                height={32}
                                unoptimized={shouldBypassImageOptimization(gConfig.logoUrl)}
                                className="w-full h-full object-contain filter drop-shadow group-hover/logo:scale-110 transition-transform"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <span className="text-xs">{gConfig.icon || '🎮'}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </EsportsCard>
              );
            })}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              brandColor="#A855F7"
              className="pt-6 pb-2"
            />
          )}
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
              onClick={openCreateModal}
              className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs px-4 py-2 rounded-xl shadow-lg flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Organización</span>
            </Button>
          </div>

          <DataTable<OrganizationRecord>
            columns={[
              {
                header: 'Organización',
                cell: (r) => (
                  <div className="flex items-center gap-3">
                    {r.logo_url ? (
                      <Image
                        src={r.logo_url}
                        alt={r.name}
                        width={32}
                        height={32}
                        unoptimized={shouldBypassImageOptimization(r.logo_url)}
                        className="w-8 h-8 rounded-lg object-cover border border-purple-400"
                      />
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
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => openEditModal(row)} className="text-xs text-purple-300 hover:bg-purple-950 p-2">
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDeleteOrg(row)} className="text-xs text-rose-400 hover:bg-rose-950/50 p-2">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
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
                  const isAssigned = editingOrg.organizers?.some((o) => o.id === oUser.id);
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
