'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import type { UserProfile } from '@/lib/data-store';
import { GAMES_CATALOG } from '@/lib/games-data';
import { compressImageToWebP } from '@/lib/image-compressor';
import { getAuthHeaders } from '@/lib/fetch-utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { shouldBypassImageOptimization } from '@/lib/image-utils';
import { ManagementTabs, type ManagementTab } from '@/components/dashboard/management-ui';
import {
  User, Settings, Upload, CheckCircle2, AlertCircle, Sparkles, Globe, Save, ArrowLeft, Gamepad2,
} from 'lucide-react';
import {
  ProfileGameTab,
  ProfileGamertagsTab,
  ProfileAccountTab,
  ProfileSocialTab,
  type GameProfileEntry,
} from './settings';

interface UserProfileSettingsViewProps {
  onBack?: () => void;
  brandColor?: string;
  embedded?: boolean;
}

type ProfileSettingsTab = 'juego_basico' | 'gamertags' | 'sistema_general' | 'redes_contacto';

const PROFILE_SETTINGS_TABS: ManagementTab<ProfileSettingsTab>[] = [
  { id: 'juego_basico', label: 'Disciplina y perfil', shortLabel: 'Disciplina', icon: Gamepad2, tone: 'cyan' },
  { id: 'gamertags', label: 'Gamertags e IDs', shortLabel: 'Gamertags', icon: Sparkles, tone: 'violet' },
  { id: 'sistema_general', label: 'Cuenta y seguridad', shortLabel: 'Cuenta', icon: User, tone: 'emerald' },
  { id: 'redes_contacto', label: 'Contacto y redes', shortLabel: 'Contacto', icon: Globe, tone: 'gold' },
];

export function UserProfileSettingsView({ onBack, brandColor = 'var(--app-accent)', embedded = false }: UserProfileSettingsViewProps) {
  const router = useRouter();
  const { currentUser, updateCurrentUser, refetchUser } = useAuth();

  const currentUserRoleLower = (currentUser?.role || '').toLowerCase();
  const isAdminOrOrganizer = currentUserRoleLower === 'administrador' || currentUserRoleLower === 'admin' || currentUserRoleLower === 'organizador';

  const [activeTab, setActiveTab] = useState<ProfileSettingsTab>('juego_basico');

  // 1. Información Básica del Juego
  const [configuredGame, setConfiguredGame] = useState<string>(currentUser?.primaryGame || 'eafc26');
  const [platform, setPlatform] = useState<'PS5' | 'PS4' | 'XBOX' | 'PC' | 'CROSSPLAY'>(currentUser?.platform || 'CROSSPLAY');
  const [position, setPosition] = useState(currentUser?.position || 'DFC');
  const [secondaryPosition, setSecondaryPosition] = useState(currentUser?.secondaryPosition || '');
  const [primaryGame, setPrimaryGame] = useState<string>(currentUser?.primaryGame || 'eafc26');
  const [biografia, setBiografia] = useState(currentUser?.biografia || '');

  // 2. Gamertags, IDs y Posiciones por Juego
  const [gamertag, setGamertag] = useState(currentUser?.gamertag || '');
  const [gameProfiles, setGameProfiles] = useState<Record<string, GameProfileEntry>>(() => {
    const initialProfiles: Record<string, GameProfileEntry> = {};
    Object.keys(GAMES_CATALOG).forEach((slug) => {
      const defaultGamePos = GAMES_CATALOG[slug]?.positions?.[0] || '';
      initialProfiles[slug] = {
        gamertag: currentUser?.gameProfiles?.[slug]?.gamertag || currentUser?.gamertag || '',
        gameId: currentUser?.gameProfiles?.[slug]?.gameId || '',
        position: currentUser?.gameProfiles?.[slug]?.position || (slug === currentUser?.primaryGame ? currentUser?.position : defaultGamePos),
        secondaryPosition: currentUser?.gameProfiles?.[slug]?.secondaryPosition || (slug === currentUser?.primaryGame ? currentUser?.secondaryPosition : ''),
      };
    });
    return initialProfiles;
  });

  // 3. Información General del Sistema
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [nacionalidad, setNacionalidad] = useState(currentUser?.nacionalidad || 'Chile');
  const [fechaNacimiento, setFechaNacimiento] = useState(currentUser?.fechaNacimiento || '');
  const [role, setRole] = useState(currentUser?.role || 'Jugador');
  const [status, setStatus] = useState(currentUser?.status || 'Buscando Club');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 4. Redes Sociales y Contacto
  const [telefono, setTelefono] = useState(currentUser?.telefono || '');
  const [whatsapp, setWhatsapp] = useState(currentUser?.whatsapp || '');
  const [instagram, setInstagram] = useState(currentUser?.instagram || '');
  const [facebook, setFacebook] = useState(currentUser?.facebook || '');
  const [twitch, setTwitch] = useState(currentUser?.twitch || '');
  const [youtube, setYoutube] = useState(currentUser?.youtube || '');
  const [tiktok, setTiktok] = useState(currentUser?.tiktok || '');
  const [discord, setDiscord] = useState(currentUser?.discord || '');
  const [twitter, setTwitter] = useState(currentUser?.twitter || '');
  const [website, setWebsite] = useState(currentUser?.website || '');

  // Media Images State
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || currentUser?.foto || '');
  const [bannerUrl, setBannerUrl] = useState(currentUser?.bannerUrl || '');
  const [avatarStats, setAvatarStats] = useState('');
  const [bannerStats, setBannerStats] = useState('');
  const [isCompressingAvatar, setIsCompressingAvatar] = useState(false);
  const [isCompressingBanner, setIsCompressingBanner] = useState(false);

  const [savingMsg, setSavingMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize state if currentUser updates
  useEffect(() => {
    if (!currentUser) return;
    const timer = window.setTimeout(() => {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setGamertag(currentUser.gamertag || '');
      setPlatform(currentUser.platform || 'CROSSPLAY');
      setPosition(currentUser.position || 'DFC');
      setSecondaryPosition(currentUser.secondaryPosition || '');
      setPrimaryGame(currentUser.primaryGame || 'eafc26');
      setConfiguredGame(currentUser.primaryGame || 'eafc26');
      setNacionalidad(currentUser.nacionalidad || 'Chile');
      setFechaNacimiento(currentUser.fechaNacimiento || '');
      setRole(currentUser.role || 'Jugador');
      setStatus(currentUser.status || 'Buscando Club');
      setTelefono(currentUser.telefono || '');
      setWhatsapp(currentUser.whatsapp || '');
      setInstagram(currentUser.instagram || '');
      setFacebook(currentUser.facebook || '');
      setTwitch(currentUser.twitch || '');
      setYoutube(currentUser.youtube || '');
      setTiktok(currentUser.tiktok || '');
      setDiscord(currentUser.discord || '');
      setTwitter(currentUser.twitter || '');
      setWebsite(currentUser.website || '');
      setBiografia(currentUser.biografia || '');
      setAvatarUrl(currentUser.avatarUrl || currentUser.foto || '');
      setBannerUrl(currentUser.bannerUrl || '');

      if (currentUser.gameProfiles) {
        setGameProfiles((prev) => ({
          ...prev,
          ...currentUser.gameProfiles,
        }));
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [currentUser]);

  // Handle Position Change per Game
  const handleGamePositionChange = (gameSlug: string, newPosition: string) => {
    setGameProfiles((prev) => ({
      ...prev,
      [gameSlug]: {
        ...prev[gameSlug],
        position: newPosition,
      },
    }));
    if (gameSlug === primaryGame) {
      setPosition(newPosition);
    }
  };

  // Handle Secondary Position Change per Game
  const handleGameSecondaryPositionChange = (gameSlug: string, newSecondaryPos: string) => {
    setGameProfiles((prev) => ({
      ...prev,
      [gameSlug]: {
        ...prev[gameSlug],
        secondaryPosition: newSecondaryPos,
      },
    }));
    if (gameSlug === primaryGame) {
      setSecondaryPosition(newSecondaryPos);
    }
  };

  // Handle Image Upload & Fast WebP Compression
  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingAvatar(true);
      setAvatarStats('Optimizando foto a WebP...');
      const result = await compressImageToWebP(file, 400, 0.85);

      const formData = new FormData();
      formData.append('file', result.file);
      formData.append('type', 'logo');
      formData.append('entityName', gamertag || name || 'user');
      if (currentUser?.id) {
        formData.append('entityId', currentUser.id);
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        const savedPct = Math.round(((result.originalSize - result.compressedSize) / result.originalSize) * 100);
        setAvatarUrl(data.url);
        setAvatarStats(`${savedPct}% menos peso (${(result.compressedSize / 1024).toFixed(0)}KB)`);
        if (currentUser?.id) {
          const payload = {
            id: currentUser.id,
            name,
            gamertag,
            avatarUrl: data.url,
            foto: data.url,
            bannerUrl: bannerUrl || currentUser.bannerUrl || '',
          };
          await fetch('/api/users', {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
          });
          updateCurrentUser({ avatarUrl: data.url, foto: data.url });
          await refetchUser();
        }
      }
    } catch (err: unknown) {
      console.error(err);
      setAvatarStats('Error al subir foto');
    } finally {
      setIsCompressingAvatar(false);
    }
  };

  const handleBannerFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingBanner(true);
      setBannerStats('Optimizando portada a WebP HD...');
      const result = await compressImageToWebP(file, 1200, 0.85);

      const formData = new FormData();
      formData.append('file', result.file);
      formData.append('type', 'banner');
      formData.append('entityName', gamertag || name || 'user');
      if (currentUser?.id) {
        formData.append('entityId', currentUser.id);
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        const savedPct = Math.round(((result.originalSize - result.compressedSize) / result.originalSize) * 100);
        setBannerUrl(data.url);
        setBannerStats(`${savedPct}% optimizado`);
        if (currentUser?.id) {
          const payload = {
            id: currentUser.id,
            name,
            gamertag,
            avatarUrl: avatarUrl || currentUser.avatarUrl || '',
            foto: avatarUrl || currentUser.avatarUrl || '',
            bannerUrl: data.url,
          };
          await fetch('/api/users', {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
          });
          updateCurrentUser({ bannerUrl: data.url });
          await refetchUser();
        }
      }
    } catch (err: unknown) {
      console.error(err);
      setBannerStats('Error al subir portada');
    } finally {
      setIsCompressingBanner(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSavingMsg(null);

    try {
      if (newPassword && newPassword !== confirmPassword) {
        setSavingMsg({ type: 'error', text: 'Las nuevas contraseñas no coinciden.' });
        setIsSubmitting(false);
        return;
      }

      if (!currentUser?.id) {
        setSavingMsg({ type: 'error', text: 'No hay una sesión activa de usuario.' });
        setIsSubmitting(false);
        return;
      }

      const activePosition = gameProfiles[primaryGame]?.position || position || 'DFC';
      const activeSecondaryPosition = gameProfiles[primaryGame]?.secondaryPosition || secondaryPosition || undefined;

      const payload = {
        id: currentUser.id,
        name,
        email,
        gamertag,
        platform,
        position: activePosition,
        secondaryPosition: activeSecondaryPosition,
        primaryGame,
        nacionalidad,
        fechaNacimiento,
        role,
        status,
        telefono,
        whatsapp,
        biografia,
        avatarUrl,
        foto: avatarUrl,
        bannerUrl,
        instagram,
        facebook,
        twitch,
        youtube,
        tiktok,
        discord,
        twitter,
        website,
        gameProfiles,
        newPassword: newPassword.trim() || undefined,
      };

      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setSavingMsg({ type: 'success', text: 'Perfil y preferencias actualizados correctamente.' });
        const updatedUser = { ...currentUser, ...payload, secondaryPosition: activeSecondaryPosition };
        updateCurrentUser({ ...updatedUser, primaryGame: primaryGame as UserProfile['primaryGame'] });
        await refetchUser();
        router.refresh();
      } else {
        setSavingMsg({ type: 'error', text: data.error || 'No fue posible actualizar el perfil.' });
      }
    } catch (err: unknown) {
      setSavingMsg({ type: 'error', text: err instanceof Error ? err.message : 'Error de conexión guardando perfil' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="account-settings-view space-y-5 sm:space-y-6 animate-in fade-in duration-300"
      style={{ '--ui-dynamic-brand': brandColor } as React.CSSProperties}
    >
      {/* 1. Header Banner & Avatar Edit Preview */}
      {!embedded ? (
        <div className="account-settings-cover relative w-full bg-[var(--bg-card)] border border-[var(--border-card)] shadow-2xl overflow-hidden min-h-[240px] sm:min-h-[300px] flex flex-col justify-end">
          <div className="absolute inset-0 z-0 group">
            <Image
              src={bannerUrl || '/images/default/banner-default.jpg'}
              alt="Portada"
              fill
              sizes="100vw"
              loading="eager"
              unoptimized={shouldBypassImageOptimization(bannerUrl)}
              onError={(e) => {
                e.currentTarget.src = '/images/default/banner-default.jpg';
              }}
              className="object-cover opacity-90"
            />
            <div className="absolute inset-0 account-settings-cover-scrim" />

            <label className="absolute top-4 right-4 z-20 cursor-pointer px-3 py-1.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] border border-[var(--border-card)] text-xs font-bold text-[var(--text-heading)] shadow-xl flex items-center gap-1.5 backdrop-blur-md transition-all">
              <Upload className="w-3.5 h-3.5 text-[var(--app-accent)]" />
              <span>{isCompressingBanner ? 'Procesando...' : 'Cambiar Portada'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleBannerFileSelect} disabled={isCompressingBanner} />
            </label>
            {bannerStats && <span className="absolute top-14 right-4 z-20 text-[10px]  font-bold text-[var(--app-accent)] bg-[var(--bg-card)] px-2 py-0.5 rounded border border-[var(--app-accent)]">{bannerStats}</span>}
          </div>

          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-row items-center gap-4 sm:gap-6">
              <div className="relative group">
                <div
                  className="account-settings-avatar w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-[var(--bg-card)] border-4 flex items-center justify-center font-black text-2xl overflow-hidden relative"
                >
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={name}
                      fill
                      sizes="112px"
                      unoptimized={shouldBypassImageOptimization(avatarUrl)}
                      onError={(e) => {
                        e.currentTarget.src = '/images/default/logo-default.png';
                      }}
                      className="object-cover"
                    />
                  ) : (
                    <Avatar fallback={name} size="lg" status="online" />
                  )}
                </div>
                <label className="absolute inset-0 bg-[var(--bg-card)] opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex flex-col items-center justify-center cursor-pointer text-[var(--text-heading)] font-bold text-[10px]">
                  <Upload className="w-4 h-4 mb-1 text-[var(--app-accent)]" />
                  <span>{isCompressingAvatar ? 'Procesando...' : 'Cambiar Foto'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarFileSelect} disabled={isCompressingAvatar} />
                </label>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-3xl font-black text-[var(--text-heading)] tracking-tight uppercase flex items-center gap-2">
                    Ajustes de Perfil Atleta
                    <Settings className="w-5 h-5 text-[var(--app-accent)]" />
                  </h1>
                  <Badge variant="cyan" className=" font-bold text-xs uppercase">
                    @{gamertag || 'Gamertag'}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-secondary)] font-semibold flex items-center gap-2">
                  <span>{name || 'Nombre Usuario'}</span>
                  <span>•</span>
                  <span className="text-[var(--app-accent)]">
                    {gameProfiles[configuredGame]?.position || position || 'DFC'} ({platform})
                  </span>
                </p>
                {avatarStats && <p className="text-[10px]  text-[var(--app-positive)]">{avatarStats}</p>}
              </div>
            </div>

            {onBack && (
              <Button onClick={onBack} variant="ghost" className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-heading)] border border-[var(--border-card)] rounded-xl">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Volver
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {/* 2. TAB SECTIONS */}
      <div className={embedded ? 'account-settings-content space-y-5' : 'account-settings-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5'}>
        <ManagementTabs
          tabs={PROFILE_SETTINGS_TABS}
          activeTab={activeTab}
          onChange={setActiveTab}
          label="Secciones de configuración de la cuenta"
        />

        {/* Toast Notification */}
        {savingMsg && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-bold ${
            savingMsg.type === 'success' ? 'bg-[var(--app-positive-soft)] border-[var(--app-positive)] text-[var(--app-positive)]' : 'bg-[var(--app-danger-soft)] border-[var(--app-danger)] text-[var(--app-danger)]'
          }`}>
            {savingMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-[var(--app-positive)]" /> : <AlertCircle className="w-5 h-5 text-[var(--app-danger)]" />}
            <span>{savingMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="account-settings-form space-y-5">
          {activeTab === 'juego_basico' && (
            <ProfileGameTab
              configuredGame={configuredGame}
              setConfiguredGame={setConfiguredGame}
              avatarUrl={avatarUrl}
              setAvatarUrl={setAvatarUrl}
              bannerUrl={bannerUrl}
              setBannerUrl={setBannerUrl}
              gamertag={gamertag}
              name={name}
              currentUser={currentUser}
              updateCurrentUser={updateCurrentUser}
              refetchUser={refetchUser}
              gameProfiles={gameProfiles}
              setGameProfiles={setGameProfiles}
              handleGamePositionChange={handleGamePositionChange}
              handleGameSecondaryPositionChange={handleGameSecondaryPositionChange}
              platform={platform}
              setPlatform={setPlatform}
              primaryGame={primaryGame}
              setPrimaryGame={setPrimaryGame}
              biografia={biografia}
              setBiografia={setBiografia}
            />
          )}

          {activeTab === 'gamertags' && (
            <ProfileGamertagsTab
              gamertag={gamertag}
              setGamertag={setGamertag}
              gameProfiles={gameProfiles}
              setGameProfiles={setGameProfiles}
            />
          )}

          {activeTab === 'sistema_general' && (
            <ProfileAccountTab
              name={name}
              setName={setName}
              email={email}
              currentUser={currentUser}
              nacionalidad={nacionalidad}
              setNacionalidad={setNacionalidad}
              fechaNacimiento={fechaNacimiento}
              setFechaNacimiento={setFechaNacimiento}
              isAdminOrOrganizer={isAdminOrOrganizer}
              role={role}
              setRole={setRole}
              status={status}
              setStatus={setStatus}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
            />
          )}

          {activeTab === 'redes_contacto' && (
            <ProfileSocialTab
              telefono={telefono}
              setTelefono={setTelefono}
              whatsapp={whatsapp}
              setWhatsapp={setWhatsapp}
              instagram={instagram}
              setInstagram={setInstagram}
              twitch={twitch}
              setTwitch={setTwitch}
              youtube={youtube}
              setYoutube={setYoutube}
              discord={discord}
              setDiscord={setDiscord}
              facebook={facebook}
              setFacebook={setFacebook}
              website={website}
              setWebsite={setWebsite}
            />
          )}

          {/* Submit Action Button */}
          <div className="account-settings-actions flex items-center justify-end gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[var(--app-accent)] hover:bg-[var(--app-accent-2)] text-[var(--accent-contrast)] font-black text-xs px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 uppercase tracking-wider"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Guardando cambios...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
