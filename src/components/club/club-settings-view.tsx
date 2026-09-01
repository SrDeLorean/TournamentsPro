'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Shield, Save, CheckCircle2, ImageIcon } from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games-data';
import { TeamData } from '@/lib/data-store';
import { useAuth } from '@/components/providers/auth-provider';
import { ImageUploadCard } from '@/components/ui/image-upload-card';
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
  const brandColor = game?.brandColor || '#00F0FF';

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
      className="p-6 space-y-6 bg-slate-950 transition-all duration-500 shadow-2xl max-w-4xl border"
      style={{
        borderColor: `color-mix(in srgb, ${brandColor} 50%, transparent)`,
        boxShadow: `0 0 35px ${brandColor}18`,
      }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl bg-slate-900 border-2 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-lg"
            style={{ borderColor: brandColor }}
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
              <Shield className="w-6 h-6 text-slate-500" />
            )}
          </div>
          <div>
            <h3 className="text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
              <Settings className="w-4 h-4" style={{ color: brandColor }} />
              Ajustes & Atributos del Club ({game.name})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configura el logo oficial, banner panorámico e identidad de la escuadra en MySQL.
            </p>
          </div>
        </div>

        <Badge
          className="uppercase font-mono text-[10px] self-start sm:self-auto"
          style={{
            backgroundColor: `color-mix(in srgb, ${brandColor} 20%, transparent)`,
            color: brandColor,
            borderColor: `color-mix(in srgb, ${brandColor} 40%, transparent)`,
          }}
        >
          {team?.name || currentUser?.teamName || 'Escuadra Registrada'}
        </Badge>
      </div>

      <form onSubmit={handleSaveTeam} className="space-y-6">
        {/* SECCIÓN REUTILIZABLE DE SUBIDA DE LOGO & BANNER */}
        <div
          className="p-5 rounded-2xl bg-slate-900/90 border space-y-4 transition-all"
          style={{ borderColor: `color-mix(in srgb, ${brandColor} 35%, transparent)` }}
        >
          <h4
            className="text-xs font-black uppercase tracking-wider flex items-center gap-2"
            style={{ color: brandColor }}
          >
            <ImageIcon className="w-4 h-4" style={{ color: brandColor }} />
            Imágenes Institucionales del Club (Logo Oficial & Banner de Portada):
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Logo Oficial */}
            <ImageUploadCard
              label="Logo Oficial / Escudo"
              subtitle="Formato WebP optimizado"
              currentUrl={logoUrl}
              fallbackType="logo"
              uploadType="logo"
              maxDimension={512}
              brandColor={brandColor}
              uploadButtonText="Subir / Cambiar Logo"
              entityName={team?.name || currentUser?.teamName || 'club'}
              entityId={currentTeamId}
              onUploadSuccess={(url) => persistImageUpdate('logo', url)}
            />

            {/* Banner Portada */}
            <ImageUploadCard
              label="Banner de Portada"
              subtitle="Formato HD WebP panorámico"
              currentUrl={bannerUrl}
              fallbackType="banner"
              uploadType="banner"
              maxDimension={1200}
              brandColor={brandColor}
              uploadButtonText="Subir / Cambiar Banner"
              entityName={team?.name || currentUser?.teamName || 'club'}
              entityId={currentTeamId}
              onUploadSuccess={(url) => persistImageUpdate('banner', url)}
            />
          </div>
        </div>

        {/* DATOS GENERALES DEL CLUB */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-slate-300 uppercase block">Nombre Oficial de la Escuadra:</label>
            <input
              type="text"
              name="name"
              required
              defaultValue={team?.name || currentUser?.teamName || 'Escuadra Pro'}
              className="w-full p-2.5 rounded-xl bg-slate-900 border text-white font-bold transition-all focus:outline-none"
              style={{ borderColor: `color-mix(in srgb, ${brandColor} 40%, transparent)` }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 uppercase block">Tag / Abreviatura (Máx 4):</label>
            <input
              type="text"
              name="tag"
              required
              maxLength={4}
              defaultValue={team?.tag || 'TP'}
              className="w-full p-2.5 rounded-xl bg-slate-900 border text-white font-mono font-black uppercase text-center focus:outline-none"
              style={{ borderColor: `color-mix(in srgb, ${brandColor} 40%, transparent)`, color: brandColor }}
            />
          </div>
        </div>

        {/* DESCRIPCIÓN E HISTORIA */}
        <div className="space-y-1.5 text-xs font-bold">
          <label className="text-slate-300 uppercase block">Descripción e Historia del Club:</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={team?.description || `Escuadra oficial del circuito eSports en la disciplina ${game.name}.`}
            className="w-full p-2.5 rounded-xl bg-slate-900 border text-white font-medium focus:outline-none"
            style={{ borderColor: `color-mix(in srgb, ${brandColor} 40%, transparent)` }}
          />
        </div>

        {/* PARÁMETROS TÉCNICOS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
          <div className="space-y-1.5">
            <label className="text-slate-300 uppercase block">Plataforma Oficial:</label>
            <select
              name="platform"
              defaultValue={team?.platform || 'CROSSPLAY'}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-bold focus:outline-none"
            >
              <option value="CROSSPLAY">CROSSPLAY (Todas)</option>
              <option value="PS5">PlayStation 5</option>
              <option value="PC">PC Gaming</option>
              <option value="XBOX">Xbox Series X/S</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 uppercase block">ID Externo / Club EA ID:</label>
            <input
              type="text"
              name="clubIdEa"
              placeholder="ej. EA-18932402"
              defaultValue={team?.clubIdEa || ''}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-emerald-400 font-mono font-bold focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 uppercase block">Estado del Club:</label>
            <select
              name="status"
              defaultValue={team?.status || 'Escuadra Activa'}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-bold focus:outline-none"
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
            className="font-black text-xs px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 transition-all"
            style={{
              backgroundColor: brandColor,
              color: '#020617',
            }}
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Guardando...' : 'Guardar Todos los Cambios del Club'}</span>
          </Button>

          {saveSuccess && (
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>¡Cambios del club guardados en MySQL!</span>
            </div>
          )}
        </div>
      </form>
    </Card>
  );
}
