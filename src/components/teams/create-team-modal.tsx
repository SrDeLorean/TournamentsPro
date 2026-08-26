'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/components/providers/auth-provider';
import { GAMES_CATALOG } from '@/lib/games-data';
import { checkTeamNameAvailability, initialTeams, TeamData } from '@/lib/data-store';
import { getAuthHeaders } from '@/lib/fetch-utils';
import { GameLogo } from '@/components/ui/game-logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Sparkles, AlertCircle, X } from 'lucide-react';

import { compressImageToWebP } from '@/lib/image-compressor';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { shouldBypassImageOptimization } from '@/lib/image-utils';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (team: TeamData) => void;
  defaultGameSlug?: string;
}

export function CreateTeamModal({ isOpen, onClose, onSuccess, defaultGameSlug = 'eafc26' }: CreateTeamModalProps) {
  const { currentUser, updateCurrentUser } = useAuth();

  const [teamName, setTeamName] = useState('');
  const [tag, setTag] = useState('');
  const [gameSelection, setGameSelection] = useState({ defaultGameSlug, value: defaultGameSlug });
  const gameSlug = gameSelection.defaultGameSlug === defaultGameSlug
    ? gameSelection.value
    : defaultGameSlug;
  const setGameSlug = (value: string) => setGameSelection({ defaultGameSlug, value });
  const [platform, setPlatform] = useState<'PS5' | 'PS4' | 'XBOX' | 'PC' | 'CROSSPLAY'>('CROSSPLAY');
  const [description, setDescription] = useState('');
  const [includeSelfAsPlayer, setIncludeSelfAsPlayer] = useState(true);

  const [logoUrl, setLogoUrl] = useState<string>('');
  const [bannerUrl, setBannerUrl] = useState<string>('');
  const [logoStats, setLogoStats] = useState<string>('');
  const [bannerStats, setBannerStats] = useState<string>('');
  const [isCompressingLogo, setIsCompressingLogo] = useState(false);
  const [isCompressingBanner, setIsCompressingBanner] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const color = '#00F0FF';

  if (!isOpen) return null;

  const selectedGameObj = GAMES_CATALOG[gameSlug] || GAMES_CATALOG['eafc26'];
  const logoTextPreview = tag.trim() ? tag.trim().substring(0, 3).toUpperCase() : 'TP';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!teamName.trim()) {
      setErrorMsg('El nombre de la escuadra es obligatorio');
      return;
    }

    if (!tag.trim()) {
      setErrorMsg('El tag / sigla corta es obligatorio (ej. LYE)');
      return;
    }

    // Rule Validation 1: One team per discipline per user
    const existingTeamInDiscipline = initialTeams.find(
      (t) =>
        t.gameSlug === gameSlug &&
        (t.captainName?.toLowerCase() === currentUser?.name?.toLowerCase() ||
          t.captainName?.toLowerCase() === currentUser?.gamertag?.toLowerCase() ||
          t.id === currentUser?.teamId)
    );

    if (existingTeamInDiscipline) {
      setErrorMsg(`Ya posees el club "${existingTeamInDiscipline.name}" fundado en ${selectedGameObj.name}. Solo se permite 1 club por disciplina por usuario.`);
      return;
    }

    // Rule Validation 2: Unique team name within the SAME discipline
    const isAvailable = checkTeamNameAvailability(teamName, gameSlug);
    if (!isAvailable) {
      setErrorMsg(`El nombre "${teamName}" ya está registrado por otro club en ${selectedGameObj.name}. ¡Elige otro nombre!`);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teamName.trim(),
          tag: tag.trim(),
          gameSlug,
          captainId: currentUser?.id || 'usr-current',
          captainName: currentUser?.name || 'Nuevo Capitán',
          platform,
          description,
          color,
          logoUrl,
          bannerUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Error al registrar el club en el servidor');
        setIsSubmitting(false);
        return;
      }

      const createdTeam: TeamData = data.team;

      updateCurrentUser({ role: 'Capitán', teamId: createdTeam.id, teamName: createdTeam.name });

      setIsSubmitting(false);
      if (onSuccess) onSuccess(createdTeam);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo crear el equipo');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-950 border border-purple-500/40 rounded-3xl p-5 sm:p-7 space-y-6 shadow-[0_0_50px_rgba(168,85,247,0.2)] animate-in fade-in zoom-in-95 my-6 relative overflow-hidden">
        
        {/* Glowing Background Accent Circle */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 via-purple-600 to-pink-500 p-0.5 shadow-lg">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-black uppercase text-white tracking-tight leading-none flex items-center gap-2">
                Fundar Nueva Escuadra
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <span className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider mt-1 block">
                Asciende a Capitán & Director Técnico
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Crest Card Preview */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-950 to-slate-900 border border-purple-500/30 flex items-center justify-between gap-4 relative z-10 shadow-inner">
          <div className="flex items-center gap-3.5">
            <div
              className="w-14 h-14 rounded-2xl bg-slate-950 border-2 flex items-center justify-center font-black text-xl shadow-xl flex-shrink-0 transition-all overflow-hidden"
              style={{ borderColor: color, color: color, boxShadow: `0 0 20px ${color}33` }}
            >
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="Logo"
                  width={56}
                  height={56}
                  unoptimized={shouldBypassImageOptimization(logoUrl)}
                  className="w-full h-full object-cover"
                />
              ) : (
                logoTextPreview
              )}
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-slate-400 block uppercase">VISTA PREVIA ESCUDO:</span>
              <h4 className="text-lg font-black text-white uppercase tracking-tight line-clamp-1">
                {teamName.trim() || 'NOMBRE DE TU CLUB'}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="cyan" className="bg-cyan-950 text-cyan-300 border-cyan-400/30 text-[9px] uppercase font-mono font-bold">{selectedGameObj.name}</Badge>
                <span className="text-[10px] text-purple-300 font-mono font-bold">Capitán: {currentUser?.name || 'Tú'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-950/90 border border-rose-500/60 text-rose-200 text-xs font-bold flex items-start gap-2.5 relative z-10 shadow-lg">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          
          {/* 1. Game Selector */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-300 tracking-wider block">
              1. Disciplina eSports Principal:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.values(GAMES_CATALOG).map((g) => {
                const userHasTeamInThisGame = initialTeams.some(
                  (t) =>
                    t.gameSlug === g.slug &&
                    (t.captainName?.toLowerCase() === currentUser?.name?.toLowerCase() ||
                      t.captainName?.toLowerCase() === currentUser?.gamertag?.toLowerCase() ||
                      t.id === currentUser?.teamId)
                );

                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setGameSlug(g.slug);
                      setErrorMsg('');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-extrabold flex flex-col items-start gap-1 transition-all ${
                      gameSlug === g.slug
                        ? 'bg-purple-950 border-purple-500 text-purple-300 shadow-md font-black'
                        : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <GameLogo game={g} size="sm" />
                      <span className="truncate">{g.name}</span>
                    </div>
                    {userHasTeamInThisGame && (
                      <span className="text-[9px] text-amber-400 font-mono font-bold uppercase">
                        ● Ya tienes club
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Team Name, Tag & Brand Color */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-black uppercase text-slate-300 tracking-wider block">
                2. Nombre Oficial del Club:
              </label>
              <input
                type="text"
                required
                placeholder="ej. SANGRE NUEVA FC"
                value={teamName}
                onChange={(e) => {
                  setTeamName(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 shadow-inner"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-[var(--text-heading)] block">
                Tag / Sigla
              </label>
              <input
                type="text"
                required
                maxLength={5}
                placeholder="ej. SN FC"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl input-theme border border-[var(--border-card)] text-xs font-extrabold uppercase text-center"
              />
            </div>
          </div>

          {/* 3. Subida de Logo & Banner de Portada (Compresión WebP) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Logo Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-slate-300 tracking-wider block flex items-center justify-between">
                <span>Escudo / Logo:</span>
                <span className="text-[10px] text-cyan-400 font-mono font-bold">Auto-WebP</span>
              </label>
              <div className="relative border border-dashed border-white/20 rounded-xl p-3 bg-slate-900/90 text-center hover:border-cyan-400/60 transition-colors cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  disabled={isCompressingLogo}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setIsCompressingLogo(true);
                    try {
                      const compressed = await compressImageToWebP(file, 512, 0.85);
                      // Upload to API
                      const res = await fetch('/api/upload', {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({
                          fileBase64: compressed.base64,
                          fileName: file.name,
                          teamName: teamName.trim() || 'club',
                          type: 'logo',
                          previousUrl: logoUrl,
                        }),
                      });
                      const data = await res.json();
                      if (res.ok && (data.data?.url || data.url)) {
                        setLogoUrl(data.data?.url || data.url);
                        const origMb = (compressed.originalSize / 1024 / 1024).toFixed(1);
                        const compKb = (compressed.compressedSize / 1024).toFixed(0);
                        setLogoStats(`${origMb}MB ➔ ${compKb}KB WebP`);
                      }
                    } catch (err) {
                      console.error('Error al procesar logo:', err);
                    } finally {
                      setIsCompressingLogo(false);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                <div className="flex flex-col items-center gap-1">
                  <Upload className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold text-slate-300">
                    {isCompressingLogo ? 'Comprimiendo...' : logoUrl ? '✔ Logo Cargado' : 'Subir Logo (ej. PNG 8MB)'}
                  </span>
                  {logoStats && (
                    <span className="text-[9px] font-mono text-emerald-400 font-bold">{logoStats}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Banner Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-slate-300 tracking-wider block flex items-center justify-between">
                <span>Banner de Portada:</span>
                <span className="text-[10px] text-purple-400 font-mono font-bold">Auto-WebP</span>
              </label>
              <div className="relative border border-dashed border-white/20 rounded-xl p-3 bg-slate-900/90 text-center hover:border-purple-400/60 transition-colors cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  disabled={isCompressingBanner}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setIsCompressingBanner(true);
                    try {
                      const compressed = await compressImageToWebP(file, 1920, 0.85);
                      // Upload to API
                      const res = await fetch('/api/upload', {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({
                          fileBase64: compressed.base64,
                          fileName: file.name,
                          teamName: teamName.trim() || 'club',
                          type: 'banner',
                          previousUrl: bannerUrl,
                        }),
                      });
                      const data = await res.json();
                      if (res.ok && (data.data?.url || data.url)) {
                        setBannerUrl(data.data?.url || data.url);
                        const origMb = (compressed.originalSize / 1024 / 1024).toFixed(1);
                        const compKb = (compressed.compressedSize / 1024).toFixed(0);
                        setBannerStats(`${origMb}MB ➔ ${compKb}KB WebP`);
                      }
                    } catch (err) {
                      console.error('Error al procesar banner:', err);
                    } finally {
                      setIsCompressingBanner(false);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                <div className="flex flex-col items-center gap-1">
                  <ImageIcon className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold text-slate-300">
                    {isCompressingBanner ? 'Comprimiendo...' : bannerUrl ? '✔ Banner Cargado' : 'Subir Banner de Portada'}
                  </span>
                  {bannerStats && (
                    <span className="text-[9px] font-mono text-emerald-400 font-bold">{bannerStats}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Platform */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-[var(--text-heading)] block">
              Plataforma Oficial
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as typeof platform)}
              className="w-full px-3.5 py-2 rounded-xl input-theme border border-[var(--border-card)] text-xs font-bold"
            >
              <option value="CROSSPLAY">CROSSPLAY (Todas las plataformas)</option>
              <option value="PS5">PS5</option>
              <option value="PC">PC (Steam / Riot / Epic)</option>
              <option value="XBOX">XBOX Series X/S</option>
            </select>
          </div>

          {/* 4. Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-[var(--text-heading)] block">
              Descripción / Filosofía del Club
            </label>
            <textarea
              rows={2}
              placeholder="Presenta la historia, metas y horarios del equipo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl input-theme border border-[var(--border-card)] text-xs font-semibold"
            />
          </div>

          {/* 5. Include Self Checkbox */}
          <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] flex items-center justify-between text-xs">
            <span className="font-bold text-[var(--text-heading)]">
              Inscribirme como Jugador Titular en Roster
            </span>
            <input
              type="checkbox"
              checked={includeSelfAsPlayer}
              onChange={(e) => setIncludeSelfAsPlayer(e.target.checked)}
              className="rounded border-[var(--border-card)] text-[var(--accent-cyan)] focus:ring-0"
            />
          </div>

          {/* Form Controls */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="font-bold text-xs bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-xl"
            >
              {isSubmitting ? 'Creando Club...' : 'Crear Club & Ascender a Capitán'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
