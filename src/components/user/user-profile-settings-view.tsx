'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { GAMES_CATALOG } from '@/lib/games-data';
import { compressImageToWebP } from '@/lib/image-compressor';
import { ImageUploadCard } from '@/components/ui/image-upload-card';
import { PositionBadge } from '@/components/ui/position-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import {
  User, Shield, Settings, Upload, Image as ImageIcon, CheckCircle2, AlertCircle, Sparkles, Monitor, Globe, Share2, Video, Tv, MessageSquare, Phone, Calendar, Hash, Tag, Save, ArrowLeft, Gamepad2, ShieldAlert, Key
} from 'lucide-react';

interface UserProfileSettingsViewProps {
  onBack?: () => void;
  brandColor?: string;
}

export function UserProfileSettingsView({ onBack, brandColor = '#00F0FF' }: UserProfileSettingsViewProps) {
  const router = useRouter();
  const { currentUser, updateCurrentUser, refetchUser } = useAuth();

  const currentUserRoleLower = (currentUser?.role || '').toLowerCase();
  const isAdminOrOrganizer = currentUserRoleLower === 'administrador' || currentUserRoleLower === 'admin' || currentUserRoleLower === 'organizador';

  const [activeTab, setActiveTab] = useState<'juego_basico' | 'gamertags' | 'sistema_general' | 'redes_contacto'>('juego_basico');

  // 1. Información Básica del Juego
  const [configuredGame, setConfiguredGame] = useState<string>(currentUser?.primaryGame || 'eafc26');
  const [platform, setPlatform] = useState<'PS5' | 'PS4' | 'XBOX' | 'PC' | 'CROSSPLAY'>(currentUser?.platform || 'CROSSPLAY');
  const [position, setPosition] = useState(currentUser?.position || 'DFC');
  const [secondaryPosition, setSecondaryPosition] = useState(currentUser?.secondaryPosition || '');
  const [primaryGame, setPrimaryGame] = useState<string>(currentUser?.primaryGame || 'eafc26');
  const [biografia, setBiografia] = useState(currentUser?.biografia || '');

  // 2. Gamertags, IDs y Posiciones por Juego
  const [gamertag, setGamertag] = useState(currentUser?.gamertag || '');
  const [gameProfiles, setGameProfiles] = useState<Record<string, { gamertag: string; gameId: string; position?: string; secondaryPosition?: string }>>(() => {
    const initialProfiles: Record<string, { gamertag: string; gameId: string; position?: string; secondaryPosition?: string }> = {};
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
    if (currentUser) {
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
      setBiografia(currentUser.biografia || '');
      setAvatarUrl(currentUser.avatarUrl || currentUser.foto || '');
      setBannerUrl(currentUser.bannerUrl || '');
      setInstagram(currentUser.instagram || '');
      setFacebook(currentUser.facebook || '');
      setTwitch(currentUser.twitch || '');
      setYoutube(currentUser.youtube || '');
      setTiktok(currentUser.tiktok || '');
      setDiscord(currentUser.discord || '');
      setTwitter(currentUser.twitter || '');
      setWebsite(currentUser.website || '');

      const updatedGameProfiles: Record<string, { gamertag: string; gameId: string; position?: string; secondaryPosition?: string }> = {};
      Object.keys(GAMES_CATALOG).forEach((slug) => {
        const defaultGamePos = GAMES_CATALOG[slug]?.positions?.[0] || '';
        updatedGameProfiles[slug] = {
          gamertag: currentUser.gameProfiles?.[slug]?.gamertag || currentUser.gamertag || '',
          gameId: currentUser.gameProfiles?.[slug]?.gameId || '',
          position: currentUser.gameProfiles?.[slug]?.position || (slug === currentUser.primaryGame ? currentUser.position : defaultGamePos),
          secondaryPosition: currentUser.gameProfiles?.[slug]?.secondaryPosition || (slug === currentUser.primaryGame ? currentUser.secondaryPosition : ''),
        };
      });
      setGameProfiles(updatedGameProfiles);
    }
  }, [currentUser]);

  // Position change handlers per game
  const handleGamePositionChange = (gameSlug: string, pos: string) => {
    setGameProfiles((prev) => ({
      ...prev,
      [gameSlug]: {
        ...prev[gameSlug],
        position: pos,
      },
    }));
    if (gameSlug === primaryGame) {
      setPosition(pos);
    }
  };

  const handleGameSecondaryPositionChange = (gameSlug: string, secPos: string) => {
    setGameProfiles((prev) => ({
      ...prev,
      [gameSlug]: {
        ...prev[gameSlug],
        secondaryPosition: secPos,
      },
    }));
    if (gameSlug === primaryGame) {
      setSecondaryPosition(secPos);
    }
  };

  // Handle Logo/Avatar Upload with instant preview, compression & MySQL persistence
  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingAvatar(true);
      const originalMB = (file.size / (1024 * 1024)).toFixed(2);
      const compressedRes = await compressImageToWebP(file, 400, 0.85);
      const compressedMB = (compressedRes.compressedSize / (1024 * 1024)).toFixed(2);
      const reduction = Math.round((1 - compressedRes.compressedSize / file.size) * 100);

      setAvatarStats(`Compreso: ${originalMB}MB ➔ ${compressedMB}MB (-${reduction}%)`);

      const cleanUserSlug = (gamertag || name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '-');

      const token = typeof window !== 'undefined' ? localStorage.getItem('tournamentspro_token') : null;
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          fileBase64: compressedRes.base64,
          fileName: `avatar-${Date.now()}.webp`,
          teamName: cleanUserSlug,
          teamId: currentUser?.id,
          type: 'logo',
          previousUrl: avatarUrl,
        }),
      });

      const data = await res.json();

      const uploadUrl = data.data?.url || data.url;
      if (data.success && uploadUrl) {
        setAvatarUrl(uploadUrl);
        // Persist immediately in MySQL & AuthProvider
        if (currentUser?.id) {
          const payload = {
            id: currentUser.id,
            name,
            gamertag,
            avatarUrl: uploadUrl,
            foto: uploadUrl,
            bannerUrl: bannerUrl || currentUser.bannerUrl || '',
          };
          await fetch('/api/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          updateCurrentUser({ avatarUrl: uploadUrl, foto: uploadUrl });
          await refetchUser();
        }
      }
    } catch (err) {
      console.error('Error procesando avatar:', err);
    } finally {
      setIsCompressingAvatar(false);
    }
  };

  // Handle Banner Upload with instant preview, compression & MySQL persistence
  const handleBannerFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingBanner(true);
      const originalMB = (file.size / (1024 * 1024)).toFixed(2);
      const compressedRes = await compressImageToWebP(file, 1200, 0.85);
      const compressedMB = (compressedRes.compressedSize / (1024 * 1024)).toFixed(2);
      const reduction = Math.round((1 - compressedRes.compressedSize / file.size) * 100);

      setBannerStats(`Compreso: ${originalMB}MB ➔ ${compressedMB}MB (-${reduction}%)`);

      const cleanUserSlug = (gamertag || name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '-');

      const bannerToken = typeof window !== 'undefined' ? localStorage.getItem('tournamentspro_token') : null;
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(bannerToken ? { 'Authorization': `Bearer ${bannerToken}` } : {}) },
        body: JSON.stringify({
          fileBase64: compressedRes.base64,
          fileName: `banner-${Date.now()}.webp`,
          teamName: cleanUserSlug,
          teamId: currentUser?.id,
          type: 'banner',
          previousUrl: bannerUrl,
        }),
      });

      const data = await res.json();

      const bannerUploadUrl = data.data?.url || data.url;
      if (data.success && bannerUploadUrl) {
        setBannerUrl(bannerUploadUrl);
        // Persist immediately in MySQL & AuthProvider
        if (currentUser?.id) {
          const payload = {
            id: currentUser.id,
            name,
            gamertag,
            avatarUrl: avatarUrl || currentUser.avatarUrl || '',
            foto: avatarUrl || currentUser.avatarUrl || '',
            bannerUrl: bannerUploadUrl,
          };
          await fetch('/api/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          updateCurrentUser({ bannerUrl: bannerUploadUrl });
          await refetchUser();
        }
      }
    } catch (err) {
      console.error('Error procesando banner:', err);
    } finally {
      setIsCompressingBanner(false);
    }
  };

  // Save changes to MySQL & update AuthProvider state
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    try {
      setIsSubmitting(true);
      setSavingMsg(null);

      if (newPassword.trim()) {
        if (newPassword.trim().length < 4) {
          setSavingMsg({ type: 'error', text: 'La nueva contraseña debe tener al menos 4 caracteres.' });
          setIsSubmitting(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          setSavingMsg({ type: 'error', text: 'Las contraseñas no coinciden.' });
          setIsSubmitting(false);
          return;
        }
      }

      // Ensure position for configured primary game is updated
      const activePosition = gameProfiles[primaryGame]?.position || position;
      const activeSecondaryPosition = gameProfiles[primaryGame]?.secondaryPosition || secondaryPosition;

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setSavingMsg({ type: 'success', text: '¡Perfil de atleta y posiciones por juego actualizados en MySQL!' });
        // Synchronize in-memory session, local storage and trigger real-time route refresh
        const updatedUser = { ...currentUser, ...payload };
        updateCurrentUser(updatedUser as any);
        await refetchUser();
        router.refresh();
      } else {
        setSavingMsg({ type: 'error', text: data.error || 'Error actualizando el perfil en MySQL' });
      }
    } catch (err: any) {
      setSavingMsg({ type: 'error', text: err.message || 'Error de conexión guardando perfil' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Banner & Avatar Edit Preview */}
      <div className="relative w-full left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-slate-950 border-b border-[var(--border-card)] shadow-2xl overflow-hidden min-h-[260px] sm:min-h-[320px] flex flex-col justify-end">
        {/* Full Bleed Banner Image Graphic */}
        <div className="absolute inset-0 z-0 group">
          <img
            src={bannerUrl || '/images/default/banner-default.jpg'}
            alt="Portada"
            onError={(e) => {
              e.currentTarget.src = '/images/default/banner-default.jpg';
            }}
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          
          {/* Banner Upload Trigger Overlay */}
          <label className="absolute top-4 right-4 z-20 cursor-pointer px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-white/20 text-xs font-bold text-white shadow-xl flex items-center gap-1.5 backdrop-blur-md transition-all">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isCompressingBanner ? 'Procesando...' : 'Cambiar Portada'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleBannerFileSelect} disabled={isCompressingBanner} />
          </label>
          {bannerStats && <span className="absolute top-14 right-4 z-20 text-[10px] font-mono font-bold text-cyan-300 bg-slate-950/90 px-2 py-0.5 rounded border border-cyan-500/30">{bannerStats}</span>}
        </div>

        {/* Content Box Over Banner */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-row items-center gap-4 sm:gap-6">
            {/* Avatar Shield Box */}
            <div className="relative group">
              <div
                className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-slate-950 border-4 flex items-center justify-center font-black text-2xl shadow-2xl overflow-hidden relative"
                style={{ borderColor: brandColor, boxShadow: `0 0 25px ${brandColor}44` }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    onError={(e) => {
                      e.currentTarget.src = '/images/default/logo-default.png';
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Avatar fallback={name} size="lg" status="online" />
                )}
              </div>
              <label className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex flex-col items-center justify-center cursor-pointer text-white font-bold text-[10px]">
                <Upload className="w-4 h-4 mb-1 text-cyan-400" />
                <span>{isCompressingAvatar ? 'Procesando...' : 'Cambiar Foto'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarFileSelect} disabled={isCompressingAvatar} />
              </label>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                  Ajustes de Perfil Atleta
                  <Settings className="w-5 h-5 text-cyan-400" />
                </h1>
                <Badge variant="cyan" className="font-mono font-bold text-xs uppercase">
                  @{gamertag || 'Gamertag'}
                </Badge>
              </div>
              <p className="text-xs text-slate-300 font-semibold flex items-center gap-2">
                <span>{name || 'Nombre Usuario'}</span>
                <span>•</span>
                <span className="text-cyan-300">
                  {gameProfiles[configuredGame]?.position || position || 'DFC'} ({platform})
                </span>
              </p>
              {avatarStats && <p className="text-[10px] font-mono text-emerald-400">{avatarStats}</p>}
            </div>
          </div>

          {onBack && (
            <Button onClick={onBack} variant="ghost" className="text-xs font-bold text-slate-300 hover:text-white border border-white/10 rounded-xl">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Volver
            </Button>
          )}
        </div>
      </div>

      {/* 2. TAB SECTIONS ORDERED BY USER SPECIFICATION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('juego_basico')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'juego_basico' ? 'bg-cyan-500 text-slate-950 shadow-lg scale-[1.02]' : 'bg-slate-900 border border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            1. Información Básica del Juego
          </button>

          <button
            onClick={() => setActiveTab('gamertags')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'gamertags' ? 'bg-purple-600 text-white shadow-lg scale-[1.02]' : 'bg-slate-900 border border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            2. Gamertags, IDs & Posiciones por Juego
          </button>

          <button
            onClick={() => setActiveTab('sistema_general')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'sistema_general' ? 'bg-emerald-500 text-slate-950 shadow-lg scale-[1.02]' : 'bg-slate-900 border border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            3. Información General del Sistema
          </button>

          <button
            onClick={() => setActiveTab('redes_contacto')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'redes_contacto' ? 'bg-amber-500 text-slate-950 shadow-lg scale-[1.02]' : 'bg-slate-900 border border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            4. Redes Sociales y Contacto
          </button>
        </div>

        {/* Toast Notification */}
        {savingMsg && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-bold ${
            savingMsg.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
          }`}>
            {savingMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
            <span>{savingMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">

          {/* TAB 1: INFORMACIÓN BÁSICA DEL JUEGO (ESTILIZADA DINÁMICAMENTE SEGÚN EL JUEGO SELECCIONADO) */}
          {activeTab === 'juego_basico' && (
            <Card
              className="p-6 space-y-6 bg-slate-950 transition-all duration-500 shadow-2xl"
              style={{
                borderColor: `color-mix(in srgb, ${GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF'} 50%, transparent)`,
                boxShadow: `0 0 35px ${(GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF')}20`,
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4" style={{ color: GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF' }} />
                    1. Información Básica del Juego:
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Selecciona una disciplina para configurar sus <strong>posiciones específicas exclusivas</strong>.
                  </p>
                </div>

                {/* Game Selector for Position Configuration */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300 uppercase">Juego a Configurar:</span>
                  <select
                    value={configuredGame}
                    onChange={(e) => setConfiguredGame(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 font-bold text-xs focus:outline-none transition-all"
                    style={{
                      borderColor: `color-mix(in srgb, ${GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF'} 60%, transparent)`,
                      color: GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF',
                    }}
                  >
                    {Object.entries(GAMES_CATALOG).map(([slug, g]) => (
                      <option key={slug} value={slug}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Game Badge Banner Indicator (Dynamic Theme Color) */}
              <div
                className="p-3.5 rounded-xl bg-slate-900/90 border flex items-center justify-between text-xs transition-all"
                style={{
                  borderColor: `color-mix(in srgb, ${GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF'} 40%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF'} 8%, transparent)`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full animate-pulse" style={{ backgroundColor: GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF' }} />
                  <span className="font-black text-white uppercase">{GAMES_CATALOG[configuredGame]?.name}</span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF'} 25%, transparent)`,
                      color: GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF',
                    }}
                  >
                    {GAMES_CATALOG[configuredGame]?.category}
                  </span>
                </div>
                <span className="text-[11px] text-slate-300 font-semibold">
                  Mostrando únicamente posiciones correspondientes a <strong style={{ color: GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF' }}>{GAMES_CATALOG[configuredGame]?.name}</strong>
                </span>
              </div>

              {/* Sección de Subida de Foto de Perfil & Banner de Portada (Dynamic Color) */}
              <div
                className="p-5 rounded-2xl bg-slate-900/90 border space-y-4 transition-all"
                style={{ borderColor: `color-mix(in srgb, ${GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF'} 35%, transparent)` }}
              >
                <h4
                  className="text-xs font-black uppercase tracking-wider flex items-center gap-2"
                  style={{ color: GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF' }}
                >
                  <ImageIcon className="w-4 h-4" style={{ color: GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF' }} />
                  Imágenes del Atleta (Foto de Perfil & Banner de Portada):
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Foto de Perfil */}
                  <ImageUploadCard
                    label="Foto de Perfil / Logo"
                    subtitle="Formato WebP optimizado"
                    currentUrl={avatarUrl}
                    fallbackType="avatar"
                    uploadType="logo"
                    maxDimension={400}
                    brandColor={GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF'}
                    uploadButtonText="Subir / Cambiar Foto de Perfil"
                    entityName={gamertag || name || 'user'}
                    entityId={currentUser?.id}
                    onUploadSuccess={async (url) => {
                      setAvatarUrl(url);
                      if (currentUser?.id) {
                        const payload = {
                          id: currentUser.id,
                          name,
                          gamertag,
                          avatarUrl: url,
                          foto: url,
                          bannerUrl: bannerUrl || currentUser.bannerUrl || '',
                        };
                        await fetch('/api/users', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(payload),
                        });
                        updateCurrentUser({ avatarUrl: url, foto: url });
                        await refetchUser();
                      }
                    }}
                  />

                  {/* Banner de Portada */}
                  <ImageUploadCard
                    label="Banner de Portada"
                    subtitle="Formato HD WebP panorámico"
                    currentUrl={bannerUrl}
                    fallbackType="banner"
                    uploadType="banner"
                    maxDimension={1200}
                    brandColor={GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF'}
                    uploadButtonText="Subir / Cambiar Banner Portada"
                    entityName={gamertag || name || 'user'}
                    entityId={currentUser?.id}
                    onUploadSuccess={async (url) => {
                      setBannerUrl(url);
                      if (currentUser?.id) {
                        const payload = {
                          id: currentUser.id,
                          name,
                          gamertag,
                          avatarUrl: avatarUrl || currentUser.avatarUrl || '',
                          foto: avatarUrl || currentUser.avatarUrl || '',
                          bannerUrl: url,
                        };
                        await fetch('/api/users', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(payload),
                        });
                        updateCurrentUser({ bannerUrl: url });
                        await refetchUser();
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Posición Principal Exclusiva del Juego Configurado */}
                <div className="space-y-1">
                  <label className="font-bold uppercase block flex items-center gap-1" style={{ color: GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF' }}>
                    <Tag className="w-3.5 h-3.5" style={{ color: GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF' }} />
                    Posición Principal ({GAMES_CATALOG[configuredGame]?.name}) *
                  </label>
                  <select
                    value={gameProfiles[configuredGame]?.position || GAMES_CATALOG[configuredGame]?.positions?.[0] || ''}
                    onChange={(e) => handleGamePositionChange(configuredGame, e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border text-white focus:outline-none font-bold transition-all"
                    style={{ borderColor: `color-mix(in srgb, ${GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF'} 50%, transparent)` }}
                  >
                    {(GAMES_CATALOG[configuredGame]?.positions || []).map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Posición Secundaria Exclusiva del Juego Configurado */}
                <div className="space-y-1">
                  <label className="font-bold uppercase block flex items-center gap-1" style={{ color: GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF' }}>
                    <Tag className="w-3.5 h-3.5" style={{ color: GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF' }} />
                    Posición Secundaria ({GAMES_CATALOG[configuredGame]?.name})
                  </label>
                  <select
                    value={gameProfiles[configuredGame]?.secondaryPosition || ''}
                    onChange={(e) => handleGameSecondaryPositionChange(configuredGame, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border text-white focus:outline-none font-bold transition-all"
                    style={{ borderColor: `color-mix(in srgb, ${GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF'} 50%, transparent)` }}
                  >
                    <option value="">-- Sin Posición Secundaria --</option>
                    {(GAMES_CATALOG[configuredGame]?.positions || []).map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Gamertag Específico del Juego Configurado */}
                <div className="space-y-1">
                  <label className="font-bold uppercase block flex items-center gap-1" style={{ color: GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF' }}>
                    <Sparkles className="w-3.5 h-3.5" style={{ color: GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF' }} />
                    Gamertag en {GAMES_CATALOG[configuredGame]?.name}
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border text-white focus:outline-none font-mono font-bold transition-all"
                    style={{ borderColor: `color-mix(in srgb, ${GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF'} 50%, transparent)` }}
                  />
                </div>

                {/* ID Juego para API del Juego Configurado */}
                <div className="space-y-1">
                  <label className="font-bold uppercase block flex items-center gap-1" style={{ color: GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF' }}>
                    <Hash className="w-3.5 h-3.5" style={{ color: GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF' }} />
                    ID Juego para API ({GAMES_CATALOG[configuredGame]?.name})
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
                    placeholder="Ej. EA-ID #1234, Riot Tag, SteamID"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border text-white focus:outline-none font-mono font-bold transition-all"
                    style={{ borderColor: `color-mix(in srgb, ${GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF'} 50%, transparent)` }}
                  />
                </div>

                {/* Plataforma de Juego */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase block">Plataforma Principal de Juego</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none font-semibold"
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
                  <label className="font-bold text-amber-300 uppercase block">Disciplina eSports Principal</label>
                  {primaryGame === configuredGame ? (
                    <div
                      className="p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF'} 15%, transparent)`,
                        borderColor: `color-mix(in srgb, ${GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF'} 50%, transparent)`,
                        color: GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF',
                      }}
                    >
                      <span className="flex items-center gap-1.5">⭐ {GAMES_CATALOG[configuredGame]?.name} es tu Disciplina Principal</span>
                      <Badge variant="gold" className="text-[10px]">ACTIVA ⭐</Badge>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPrimaryGame(configuredGame)}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <span>⭐ Establecer {GAMES_CATALOG[configuredGame]?.name} como Disciplina Principal</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-bold uppercase block" style={{ color: GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF' }}>
                  Biografía & Perfil Competitivo ({GAMES_CATALOG[configuredGame]?.name})
                </label>
                <textarea
                  rows={4}
                  value={biografia}
                  onChange={(e) => setBiografia(e.target.value)}
                  placeholder={`Describe tu trayectoria deportiva, estilo de juego, rol en la escuadra y palmarés eSports en ${GAMES_CATALOG[configuredGame]?.name}...`}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border text-white focus:outline-none font-semibold leading-relaxed transition-all"
                  style={{ borderColor: `color-mix(in srgb, ${GAMES_CATALOG[configuredGame]?.brandColor || '#00F0FF'} 40%, transparent)` }}
                />
              </div>
            </Card>
          )}

          {/* TAB 2: GAMERTAGS Y ID DE LOS JUEGOS */}
          {activeTab === 'gamertags' && (
            <Card className="p-6 space-y-6 border-purple-500/30 bg-slate-950">
              <div>
                <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  2. Gamertags e IDs de los Juegos:
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Configura tu <strong>Gamertag universal</strong> y los identificadores (<strong>ID Juego</strong>) con los cuales las APIs oficiales de cada título consultan tus estadísticas eSports.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs space-y-1">
                <label className="font-bold text-cyan-300 uppercase block">Gamertag Principal del Usuario *</label>
                <input
                  type="text"
                  value={gamertag}
                  onChange={(e) => setGamertag(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-cyan-400/40 text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono font-bold"
                />
              </div>

              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-300 uppercase block">Configuración por Disciplina eSports:</span>

                {Object.entries(GAMES_CATALOG).map(([slug, g]) => {
                  const p = gameProfiles[slug] || { gamertag: '', gameId: '', position: '', secondaryPosition: '' };
                  return (
                    <div key={slug} className="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.brandColor }} />
                          <h4 className="font-black text-sm uppercase text-white">{g.name}</h4>
                          <Badge variant="cyan" className="text-[10px] font-mono">{g.category}</Badge>
                        </div>
                        {p.position && (
                          <Badge variant="violet" className="text-[10px] font-mono font-bold">
                            Posición: {p.position}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-300 uppercase block">Gamertag ({g.name}):</label>
                          <input
                            type="text"
                            value={p.gamertag}
                            onChange={(e) =>
                              setGameProfiles({
                                ...gameProfiles,
                                [slug]: { ...p, gamertag: e.target.value },
                              })
                            }
                            placeholder={`Ej. ${gamertag || 'Gamertag'}`}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-cyan-400 font-mono font-semibold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-cyan-300 uppercase block flex items-center gap-1">
                            <Tag className="w-3 h-3 text-cyan-400" />
                            ID Juego para API ({g.name}):
                          </label>
                          <input
                            type="text"
                            value={p.gameId}
                            onChange={(e) =>
                              setGameProfiles({
                                ...gameProfiles,
                                [slug]: { ...p, gameId: e.target.value },
                              })
                            }
                            placeholder="Ej. EA-ID #1234, SteamID64, Riot Tag"
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-cyan-500/30 text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* TAB 3: INFORMACIÓN GENERAL DEL SISTEMA */}
          {activeTab === 'sistema_general' && (
            <Card className="p-6 space-y-6 border-emerald-500/30 bg-slate-950">
              <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" />
                3. Información General del Sistema:
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase block">Nombre Completo del Usuario *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-emerald-400 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-400 uppercase block flex items-center gap-1">
                    Correo Electrónico (No Modificable)
                  </label>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-between">
                    <span className="font-semibold text-slate-300 font-mono">{email || currentUser?.email || 'email@tournamentspro.com'}</span>
                    <Badge variant="slate" className="text-[10px] font-mono">Correo Registrado 🔒</Badge>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase block">Nacionalidad / País</label>
                  <input
                    type="text"
                    value={nacionalidad}
                    onChange={(e) => setNacionalidad(e.target.value)}
                    placeholder="Ej. Chile, Argentina, México"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-emerald-400 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase block">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-emerald-400 font-semibold"
                  />
                </div>

                {/* Rol en el Sistema (Solo editable por Organizador y Administrador) */}
                {isAdminOrOrganizer ? (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 uppercase block flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      Rol en el Sistema (Gestión Organizador/Admin)
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300 font-bold focus:outline-none"
                    >
                      <option value="Jugador">Jugador / Atleta</option>
                      <option value="Capitán">Capitán de Club</option>
                      <option value="Organizador">Organizador de Torneos</option>
                      <option value="Administrador">Administrador</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-400 uppercase block flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-slate-400" />
                      Rol en el Sistema
                    </label>
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-between">
                      <span className="font-bold text-slate-200 uppercase">{currentUser?.role || role || 'Jugador'}</span>
                      <Badge variant="cyan" className="text-[10px] font-mono">Rol Protegido 🔒</Badge>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase block">Estado en el Sistema</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-emerald-400 font-semibold"
                  >
                    <option value="Buscando Club">Buscando Club (Agente Libre)</option>
                    <option value="En Escuadra">En Escuadra / Firmado</option>
                    <option value="Organizador">Organizador Oficial</option>
                  </select>
                </div>

                {/* Sección Cambiar Contraseña */}
                <div className="pt-4 border-t border-white/10 col-span-1 sm:col-span-2 space-y-3">
                  <h4 className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    Cambiar Contraseña de Acceso:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300 uppercase block">Nueva Contraseña</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 4 caracteres (Dejar en blanco si no cambia)"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300 uppercase block">Confirmar Nueva Contraseña</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite la nueva contraseña"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* TAB 4: REDES SOCIALES Y CONTACTO */}
          {activeTab === 'redes_contacto' && (
            <Card className="p-6 space-y-6 border-amber-500/30 bg-slate-950">
              <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                4. Redes Sociales y Contacto:
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase block flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase block flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+56912345678"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase block flex items-center gap-1">
                    <Share2 className="w-3.5 h-3.5 text-pink-400" />
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@usuario"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase block flex items-center gap-1">
                    <Tv className="w-3.5 h-3.5 text-purple-400" />
                    Twitch TV
                  </label>
                  <input
                    type="text"
                    value={twitch}
                    onChange={(e) => setTwitch(e.target.value)}
                    placeholder="twitch.tv/canal"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase block flex items-center gap-1">
                    <Video className="w-3.5 h-3.5 text-rose-400" />
                    YouTube Channel
                  </label>
                  <input
                    type="text"
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    placeholder="youtube.com/@canal"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase block flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    Discord Username
                  </label>
                  <input
                    type="text"
                    value={discord}
                    onChange={(e) => setDiscord(e.target.value)}
                    placeholder="usuario#1234 o usuario"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase block flex items-center gap-1">
                    <Share2 className="w-3.5 h-3.5 text-blue-400" />
                    Facebook
                  </label>
                  <input
                    type="text"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="facebook.com/pagina"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-semibold"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-300 uppercase block flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    Sitio Web Personal / Portfolio
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://micontenido.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-semibold"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Submit Action Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-black text-xs px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 uppercase tracking-wider"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Guardando en MySQL...' : 'Guardar Cambios de Perfil'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
