'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Shield, Save, CheckCircle2 } from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games-data';
import { TeamData } from '@/lib/data-store';
import { useAuth } from '@/components/providers/auth-provider';
import { BrandedImageUploadSection } from '@/components/ui/branded-image-upload-section';
import { SocialMediaGroup } from '@/components/ui/social-media-group';
import { shouldBypassImageOptimization } from '@/lib/image-utils';

interface ClubSettingsViewProps {
  team?: TeamData | null;
  activeGameSlug?: string;
  refetchTeams?: () => void;
}

export function ClubSettingsView({ team, activeGameSlug = 'eafc26', refetchTeams }: ClubSettingsViewProps) {
  const { currentUser, updateCurrentUser } = useAuth();
  const game = GAMES_CATALOG[activeGameSlug] || GAMES_CATALOG['eafc26'];
  const brandColor = game?.brandColor || 'var(--app-accent)';

  const [currentTeamId, setCurrentTeamId] = useState<string>(
    (team?.id || currentUser?.teamId || `tm-${activeGameSlug.slice(0, 8)}-${(currentUser?.id || 'pro').replace('usr-', '')}`).slice(0, 36)
  );
  const [logoUrl, setLogoUrl] = useState<string>(team?.logoUrl || '');
  const [bannerUrl, setBannerUrl] = useState<string>(team?.bannerUrl || '');

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [syncedTeam, setSyncedTeam] = useState(team);

  if (team !== syncedTeam) {
    setSyncedTeam(team);
    if (team?.id) setCurrentTeamId(team.id);
    setLogoUrl(team?.logoUrl || '');
    setBannerUrl(team?.bannerUrl || '');
  }

  // Unified persistent image update handler
  const persistImageUpdate = async (type: 'logo' | 'banner', newUrl: string) => {
    const updatedLogo = type === 'logo' ? newUrl : logoUrl;
    const updatedBanner = type === 'banner' ? newUrl : bannerUrl;

    if (type === 'logo') setLogoUrl(newUrl);
    if (type === 'banner') setBannerUrl(newUrl);

    try {
      const putRes = await fetch('/api/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentTeamId,
          name: team?.name || currentUser?.teamName || 'Escuadra Pro',
          tag: team?.tag || 'TP',
          gameSlug: activeGameSlug,
          captainId: currentUser?.id,
          captainName: currentUser?.gamertag || currentUser?.name,
          logoUrl: updatedLogo,
          bannerUrl: updatedBanner,
        }),
      });

      if (putRes.ok) {
        if (updateCurrentUser) updateCurrentUser({ teamId: currentTeamId });
        if (refetchTeams) await refetchTeams();
      } else if (putRes.status === 404) {
        // Team does not exist yet; create it
        const postRes = await fetch('/api/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: team?.name || currentUser?.teamName || 'Escuadra Pro',
            tag: team?.tag || 'TP',
            gameSlug: activeGameSlug,
            captainId: currentUser?.id,
            captainName: currentUser?.gamertag || currentUser?.name,
            logoUrl: updatedLogo,
            bannerUrl: updatedBanner,
          }),
        });
        if (postRes.ok) {
          const postData = await postRes.json();
          const newId = postData?.data?.team?.id || postData?.team?.id;
          if (newId) setCurrentTeamId(newId);
          if (updateCurrentUser && newId) updateCurrentUser({ teamId: newId });
          if (refetchTeams) await refetchTeams();
        }
      }
    } catch (err) {
      console.error('Error persisting image update:', err);
    }
  };

  const handleSaveTeam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const teamName = (formData.get('name') as string) || 'Escuadra Pro';
    const teamTag = (formData.get('tag') as string) || 'TP';

    const payload = {
      id: currentTeamId,
      name: teamName,
      tag: teamTag,
      description: formData.get('description'),
      platform: formData.get('platform'),
      clubIdEa: formData.get('clubIdEa'),
      color: brandColor,
      logoText: teamTag,
      logoUrl: logoUrl,
      bannerUrl: bannerUrl,
      status: formData.get('status'),
      gameSlug: activeGameSlug,
      captainId: currentUser?.id,
      captainName: currentUser?.gamertag || currentUser?.name,
      socialMedia: {
        twitter: formData.get('social_twitter'),
        instagram: formData.get('social_instagram'),
        twitch: formData.get('social_twitch'),
        youtube: formData.get('social_youtube'),
        discord: formData.get('social_discord'),
      },
    };

    try {
      let res = await fetch('/api/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok && res.status === 404) {
        // Fallback: create team if not existing
        res = await fetch('/api/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const resData = await res.json().catch(() => null);
        const savedId = resData?.data?.team?.id || resData?.team?.id || currentTeamId;
        if (savedId) setCurrentTeamId(savedId);
        if (updateCurrentUser) updateCurrentUser({ teamId: savedId, teamName });
        if (refetchTeams) await refetchTeams();
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Error guardando club:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card
      className="account-settings-card ui-dynamic-brand-border p-6 space-y-6 transition-all duration-500 max-w-4xl"
      style={{ '--ui-dynamic-brand': brandColor } as React.CSSProperties}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-card)] pb-4">
        <div className="flex items-center gap-3">
          <div
            className="ui-dynamic-brand-border w-12 h-12 rounded-xl bg-[var(--bg-elevated)] border-2 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-lg"
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Logo Club"
                width={48}
                height={48}
                unoptimized={shouldBypassImageOptimization(logoUrl)}
                className="w-full h-full object-cover"
              />
            ) : (
              <Shield className="w-6 h-6 text-[var(--text-muted)]" />
            )}
          </div>
          <div>
            <h3 className="text-base font-black uppercase text-[var(--text-heading)] tracking-wider flex items-center gap-2">
              <Settings className="ui-dynamic-brand-ink w-4 h-4" />
              Ajustes & Atributos del Club ({game.name})
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Configura el logo oficial, banner panorámico e identidad de la escuadra en MySQL.
            </p>
          </div>
        </div>

        <Badge
          className="ui-dynamic-brand-chip uppercase font-bold text-[10px] self-start sm:self-auto"
        >
          {team?.name || currentUser?.teamName || 'Escuadra Registrada'}
        </Badge>
      </div>

      <form onSubmit={handleSaveTeam} className="space-y-6">
        {/* SECCIÓN REUTILIZABLE DE SUBIDA DE LOGO & BANNER */}
        <BrandedImageUploadSection
          title="Imágenes Institucionales del Club (Logo Oficial & Banner de Portada):"
          brandColor={brandColor}
          items={[
            { label: 'Logo Oficial / Escudo', subtitle: 'Formato WebP optimizado', currentUrl: logoUrl, fallbackType: 'logo', uploadType: 'logo', maxDimension: 512, uploadButtonText: 'Subir / Cambiar Logo', entityName: team?.name || currentUser?.teamName || 'club', entityId: currentTeamId, onUploadSuccess: (url) => persistImageUpdate('logo', url) },
            { label: 'Banner de Portada', subtitle: 'Formato HD WebP panorámico', currentUrl: bannerUrl, fallbackType: 'banner', uploadType: 'banner', maxDimension: 1200, uploadButtonText: 'Subir / Cambiar Banner', entityName: team?.name || currentUser?.teamName || 'club', entityId: currentTeamId, onUploadSuccess: (url) => persistImageUpdate('banner', url) },
          ]}
        />

        {/* DATOS GENERALES DEL CLUB */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-[var(--text-secondary)] uppercase block">Nombre Oficial de la Escuadra:</label>
            <input
              type="text"
              name="name"
              required
              defaultValue={team?.name || currentUser?.teamName || 'Escuadra Pro'}
              className="ui-dynamic-brand-border w-full p-2.5 rounded-xl bg-[var(--bg-elevated)] border text-[var(--text-heading)] font-bold transition-all focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[var(--text-secondary)] uppercase block">Tag / Abreviatura (Máx 4):</label>
            <input
              type="text"
              name="tag"
              required
              maxLength={4}
              defaultValue={team?.tag || 'TP'}
              className="ui-dynamic-brand-border ui-dynamic-brand-ink w-full p-2.5 rounded-xl bg-[var(--bg-elevated)] border font-black uppercase text-center focus:outline-none"
            />
          </div>
        </div>

        {/* DESCRIPCIÓN E HISTORIA */}
        <div className="space-y-1.5 text-xs font-bold ">
          <label className="text-[var(--text-secondary)] uppercase block ">Descripción e Historia del Club:</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={team?.description || `Escuadra oficial del circuito eSports en la disciplina ${game.name}.`}
            className="ui-dynamic-brand-border w-full p-2.5 rounded-xl bg-[var(--bg-elevated)] border text-[var(--text-heading)] font-medium focus:outline-none"
          />
        </div>

        {/* PARÁMETROS TÉCNICOS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold ">
          <div className="space-y-1.5 ">
            <label className="text-[var(--text-secondary)] uppercase block ">Plataforma Oficial:</label>
            <select
              name="platform"
              defaultValue={team?.platform || 'CROSSPLAY'}
              className="w-full p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-card)] text-[var(--text-heading)] font-bold focus:outline-none "
            >
              <option value="CROSSPLAY">CROSSPLAY (Todas)</option>
              <option value="PS5">PlayStation 5</option>
              <option value="PC">PC Gaming</option>
              <option value="XBOX">Xbox Series X/S</option>
            </select>
          </div>

          <div className="space-y-1.5 ">
            <label className="text-[var(--text-secondary)] uppercase block ">ID Externo / Club EA ID:</label>
            <input
              type="text"
              name="clubIdEa"
              placeholder="ej. EA-18932402"
              defaultValue={team?.clubIdEa || ''}
              className="w-full p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-card)] text-[var(--app-positive)]  font-bold focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[var(--text-secondary)] uppercase block">Estado del Club:</label>
            <select
              name="status"
              defaultValue={team?.status || 'Escuadra Activa'}
              className="w-full p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-card)] text-[var(--text-heading)] font-bold focus:outline-none"
            >
              <option value="Escuadra Activa">🟢 Escuadra Activa</option>
              <option value="Búsqueda Abierta">⚡ En Reclutamiento</option>
              <option value="En Pausa">🔴 En Pausa Temporada</option>
            </select>
          </div>
        </div>

        {/* COMPONENTE GENÉRICO DE REDES SOCIALES */}
        <SocialMediaGroup
          twitter={team?.socialMedia?.twitter}
          instagram={team?.socialMedia?.instagram}
          twitch={team?.socialMedia?.twitch}
          youtube={team?.socialMedia?.youtube}
          discord={team?.socialMedia?.discord}
          prefixName="social"
        />

        {/* BOTÓN DE GUARDAR Y NOTIFICACIÓN */}
        <div className="pt-4 flex items-center gap-3">
          <Button
            type="submit"
            disabled={isSaving}
            className="ui-dynamic-brand-button font-black text-xs px-6 py-3 rounded-xl flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Guardando...' : 'Guardar Todos los Cambios del Club'}</span>
          </Button>

          {saveSuccess && (
            <div className="flex items-center gap-1.5 text-xs font-black text-[var(--app-positive)] animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>¡Cambios del club guardados en MySQL!</span>
            </div>
          )}
        </div>
      </form>
    </Card>
  );
}
