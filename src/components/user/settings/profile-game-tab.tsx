'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BrandedImageUploadSection } from '@/components/ui/branded-image-upload-section';
import { GAMES_CATALOG } from '@/lib/games-data';
import { Gamepad2, Tag, Sparkles, Hash } from 'lucide-react';
import type { UserProfile } from '@/lib/data-store';

export interface GameProfileEntry {
  gamertag: string;
  gameId: string;
  position?: string;
  secondaryPosition?: string;
}

interface ProfileGameTabProps {
  configuredGame: string;
  setConfiguredGame: (game: string) => void;
  avatarUrl: string;
  setAvatarUrl: (url: string) => void;
  bannerUrl: string;
  setBannerUrl: (url: string) => void;
  gamertag: string;
  name: string;
  currentUser: UserProfile | null;
  updateCurrentUser: (patch: Partial<UserProfile>) => void;
  refetchUser: () => Promise<void>;
  gameProfiles: Record<string, GameProfileEntry>;
  setGameProfiles: React.Dispatch<React.SetStateAction<Record<string, GameProfileEntry>>>;
  handleGamePositionChange: (gameSlug: string, pos: string) => void;
  handleGameSecondaryPositionChange: (gameSlug: string, pos: string) => void;
  platform: 'PS5' | 'PS4' | 'XBOX' | 'PC' | 'CROSSPLAY';
  setPlatform: (p: 'PS5' | 'PS4' | 'XBOX' | 'PC' | 'CROSSPLAY') => void;
  primaryGame: string;
  setPrimaryGame: (g: string) => void;
  biografia: string;
  setBiografia: (b: string) => void;
}

export function ProfileGameTab({
  configuredGame,
  setConfiguredGame,
  avatarUrl,
  setAvatarUrl,
  bannerUrl,
  setBannerUrl,
  gamertag,
  name,
  currentUser,
  updateCurrentUser,
  refetchUser,
  gameProfiles,
  setGameProfiles,
  handleGamePositionChange,
  handleGameSecondaryPositionChange,
  platform,
  setPlatform,
  primaryGame,
  setPrimaryGame,
  biografia,
  setBiografia,
}: ProfileGameTabProps) {
  const brandColor = GAMES_CATALOG[configuredGame]?.brandColor || 'var(--app-accent)';
  const gameInfo = GAMES_CATALOG[configuredGame];

  const persistProfileImage = async (type: 'avatar' | 'banner', url: string) => {
    if (type === 'avatar') setAvatarUrl(url);
    else setBannerUrl(url);
    if (!currentUser?.id) return;

    const payload = {
      id: currentUser.id,
      name,
      gamertag,
      avatarUrl: type === 'avatar' ? url : avatarUrl || currentUser.avatarUrl || '',
      foto: type === 'avatar' ? url : avatarUrl || currentUser.avatarUrl || '',
      bannerUrl: type === 'banner' ? url : bannerUrl || currentUser.bannerUrl || '',
    };
    await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    updateCurrentUser(type === 'avatar' ? { avatarUrl: url, foto: url } : { bannerUrl: url });
    await refetchUser();
  };

  return (
    <Card
      className="account-settings-card ui-dynamic-brand-border p-4 sm:p-6 space-y-6 transition-all duration-500"
      style={{ '--ui-dynamic-brand': brandColor } as React.CSSProperties}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-card)] pb-4">
        <div>
          <h3 className="text-sm font-black uppercase text-[var(--text-heading)] tracking-wider flex items-center gap-2">
            <Gamepad2 className="ui-dynamic-brand-ink w-4 h-4" />
            1. Información Básica del Juego:
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Selecciona una disciplina para configurar sus <strong>posiciones específicas exclusivas</strong>.
          </p>
        </div>

        {/* Game Selector for Position Configuration */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Juego a Configurar:</span>
          <select
            value={configuredGame}
            onChange={(e) => setConfiguredGame(e.target.value)}
            className="ui-dynamic-brand-border ui-dynamic-brand-ink px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] border font-bold text-xs focus:outline-none transition-all"
          >
            {Object.entries(GAMES_CATALOG).map(([slug, g]) => (
              <option key={slug} value={slug}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Game Badge Banner Indicator (Dynamic Theme Color) */}
      <div
        className="ui-dynamic-brand-chip p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all"
      >
        <div className="flex items-center gap-2">
          <span className="game-brand-dot animate-pulse" />
          <span className="font-black text-[var(--text-heading)] uppercase">{gameInfo?.name}</span>
          <span className="ui-dynamic-brand-chip px-2 py-0.5 rounded text-[10px] font-bold uppercase">
            {gameInfo?.category}
          </span>
        </div>
        <span className="text-[11px] text-[var(--text-secondary)] font-semibold">
          Mostrando únicamente posiciones correspondientes a <strong className="ui-dynamic-brand-ink">{gameInfo?.name}</strong>
        </span>
      </div>

      {/* Sección de Subida de Foto de Perfil & Banner de Portada */}
      <BrandedImageUploadSection
        title="Imágenes del Atleta (Foto de Perfil & Banner de Portada):"
        brandColor={brandColor}
        items={[
          { label: 'Foto de Perfil / Logo', subtitle: 'Formato WebP optimizado', currentUrl: avatarUrl, fallbackType: 'avatar', uploadType: 'logo', maxDimension: 400, uploadButtonText: 'Subir / Cambiar Foto de Perfil', entityName: gamertag || name || 'user', entityId: currentUser?.id, onUploadSuccess: (url) => persistProfileImage('avatar', url) },
          { label: 'Banner de Portada', subtitle: 'Formato HD WebP panorámico', currentUrl: bannerUrl, fallbackType: 'banner', uploadType: 'banner', maxDimension: 1200, uploadButtonText: 'Subir / Cambiar Banner Portada', entityName: gamertag || name || 'user', entityId: currentUser?.id, onUploadSuccess: (url) => persistProfileImage('banner', url) },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Posición Principal Exclusiva del Juego Configurado */}
        <div className="space-y-1">
          <label className="ui-dynamic-brand-ink font-bold uppercase block flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" />
            Posición Principal ({gameInfo?.name}) *
          </label>
          <select
            value={gameProfiles[configuredGame]?.position || gameInfo?.positions?.[0] || ''}
            onChange={(e) => handleGamePositionChange(configuredGame, e.target.value)}
            required
            className="ui-dynamic-brand-border w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border text-[var(--text-heading)] focus:outline-none font-bold transition-all"
          >
            {(gameInfo?.positions || []).map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>

        {/* Posición Secundaria Exclusiva del Juego Configurado */}
        <div className="space-y-1">
          <label className="ui-dynamic-brand-ink font-bold uppercase block flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" />
            Posición Secundaria ({gameInfo?.name})
          </label>
          <select
            value={gameProfiles[configuredGame]?.secondaryPosition || ''}
            onChange={(e) => handleGameSecondaryPositionChange(configuredGame, e.target.value)}
            className="ui-dynamic-brand-border w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border text-[var(--text-heading)] focus:outline-none font-bold transition-all"
          >
            <option value="">-- Sin Posición Secundaria --</option>
            {(gameInfo?.positions || []).map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>

        {/* Gamertag Específico del Juego Configurado */}
        <div className="space-y-1">
          <label className="ui-dynamic-brand-ink font-bold uppercase block flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Gamertag en {gameInfo?.name}
          </label>
          <input
            type="text"
            value={gameProfiles[configuredGame]?.gamertag || ''}
            onChange={(e) =>
              setGameProfiles((prev) => ({
                ...prev,
                [configuredGame]: { ...prev[configuredGame], gamertag: e.target.value },
              }))
            }
            placeholder={`Ej. @${gamertag || 'Gamertag'}`}
            className="ui-dynamic-brand-border w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border text-[var(--text-heading)] focus:outline-none font-bold transition-all"
          />
        </div>

        {/* ID Juego para API del Juego Configurado */}
        <div className="space-y-1">
          <label className="ui-dynamic-brand-ink font-bold uppercase block flex items-center gap-1">
            <Hash className="w-3.5 h-3.5" />
            ID Juego para API ({gameInfo?.name})
          </label>
          <input
            type="text"
            value={gameProfiles[configuredGame]?.gameId || ''}
            onChange={(e) =>
              setGameProfiles((prev) => ({
                ...prev,
                [configuredGame]: { ...prev[configuredGame], gameId: e.target.value },
              }))
            }
            placeholder="Ej. EA-ID 1234, Riot Tag, SteamID"
            className="ui-dynamic-brand-border w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border text-[var(--text-heading)] focus:outline-none font-bold transition-all"
          />
        </div>

        {/* Plataforma de Juego */}
        <div className="space-y-1">
          <label className="font-bold text-[var(--text-secondary)] uppercase block">Plataforma Principal de Juego</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as typeof platform)}
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-card)] text-[var(--text-heading)] focus:outline-none font-semibold"
          >
            <option value="CROSSPLAY">CROSSPLAY (Todas las Plataformas)</option>
            <option value="PS5">PlayStation 5 (PS5)</option>
            <option value="PS4">PlayStation 4 (PS4)</option>
            <option value="XBOX">Xbox Series X|S / One</option>
            <option value="PC">PC Gaming</option>
          </select>
        </div>

        {/* Marcador de Disciplina Principal */}
        <div className="space-y-1">
          <label className="font-bold text-[var(--app-warning)] uppercase block">Disciplina eSports Principal</label>
          {primaryGame === configuredGame ? (
            <div
              className="ui-dynamic-brand-chip p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all"
            >
              <span className="flex items-center gap-1.5">⭐ {gameInfo?.name} es tu Disciplina Principal</span>
              <Badge variant="gold" className="text-[10px]">ACTIVA ⭐</Badge>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPrimaryGame(configuredGame)}
              className="w-full py-2.5 px-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--app-surface-2)] border border-[var(--app-warning)] text-[var(--app-warning)] text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <span>⭐ Establecer {gameInfo?.name} como Disciplina Principal</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1 text-xs">
        <label className="ui-dynamic-brand-ink font-bold uppercase block">
          Biografía & Perfil Competitivo ({gameInfo?.name})
        </label>
        <textarea
          rows={4}
          value={biografia}
          onChange={(e) => setBiografia(e.target.value)}
          placeholder={`Describe tu trayectoria deportiva, estilo de juego, rol en la escuadra y palmarés eSports en ${gameInfo?.name}...`}
          className="ui-dynamic-brand-border w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border text-[var(--text-heading)] focus:outline-none font-semibold leading-relaxed transition-all"
        />
      </div>
    </Card>
  );
}
