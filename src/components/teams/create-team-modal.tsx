'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useTeams } from '@/components/providers/auth-provider';
import { GAMES_CATALOG } from '@/lib/games-data';
import type { TeamData } from '@/lib/data-store';
import { GameLogo } from '@/components/ui/game-logo';
import { Badge } from '@/components/ui/badge';
import { ModalForm } from '@/components/ui/modal-form';
import { BrandedImageUploadSection } from '@/components/ui/branded-image-upload-section';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sparkles, Search, Loader2, Info } from 'lucide-react';
import { TeamApiSearchResults } from './team-api-search-results';
import { ExtractedTeam } from '@/lib/services/game-apis/types';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (team: TeamData) => void;
  defaultGameSlug?: string;
}

export function CreateTeamModal({ isOpen, onClose, onSuccess, defaultGameSlug = 'eafc26' }: CreateTeamModalProps) {
  const router = useRouter();
  const { currentUser, updateCurrentUser, refetchUser } = useAuth();
  const { userTeams, refetchTeams } = useTeams();

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

  // API Auto-Extraction States
  const [apiQuery, setApiQuery] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedTeams, setExtractedTeams] = useState<ExtractedTeam[]>([]);
  const [apiMessage, setApiMessage] = useState('');
  const [sourceApi, setSourceApi] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedGameObj = GAMES_CATALOG[gameSlug] || GAMES_CATALOG.eafc26;
  const color = selectedGameObj.brandColor;

  if (!isOpen) return null;

  const logoTextPreview = tag.trim() ? tag.trim().substring(0, 3).toUpperCase() : 'TP';

  const handleApiExtraction = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = apiQuery.trim() || teamName.trim();
    if (!query) {
      setErrorMsg(`Ingresa un nombre o ID de equipo para buscar en la API de ${selectedGameObj.name}`);
      return;
    }

    setIsExtracting(true);
    setErrorMsg('');
    setApiMessage('');

    try {
      const res = await fetch(`/api/games/${gameSlug}/extract-team?query=${encodeURIComponent(query)}&platform=${platform}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setApiMessage(data.error || `No se encontraron datos en la API oficial para "${query}". Procede ingresando los datos manualmente.`);
        setExtractedTeams([]);
        setIsExtracting(false);
        return;
      }

      setSourceApi(data.sourceApi || selectedGameObj.name);

      if (data.teams && data.teams.length > 0) {
        setExtractedTeams(data.teams);
        if (data.teams.length === 1) {
          applyExtractedTeamData(data.teams[0]);
        }
      } else {
        setApiMessage(`No se halló coincidencias para "${query}". Puedes registrar tu club manualmente a continuación.`);
        setExtractedTeams([]);
      }
    } catch (err: unknown) {
      setApiMessage(`La API no devolvió datos automáticos. Puedes continuar con el formulario manual.`);
      console.warn('Error al extraer datos desde API:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  const applyExtractedTeamData = (team: ExtractedTeam) => {
    setTeamName(team.teamName);
    setTag(team.tag);
    if (team.description) setDescription(team.description);
    if (team.logoUrl) setLogoUrl(team.logoUrl);
    if (team.bannerUrl) setBannerUrl(team.bannerUrl);
    if (team.platform) setPlatform(team.platform);
    setApiMessage(`✨ ¡Datos importados exitosamente desde ${team.sourceApi || 'API Oficial'}!`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = teamName.trim();
    if (!cleanName || cleanName.length < 3) {
      setErrorMsg('El nombre del club debe tener al menos 3 caracteres');
      return;
    }

    const cleanTag = tag.trim().toUpperCase();
    if (!cleanTag) {
      setErrorMsg('El tag / sigla corta es obligatorio (ej. SNFC)');
      return;
    }
    if (cleanTag.length < 2) {
      setErrorMsg('El tag debe tener al menos 2 caracteres (ej. SN)');
      return;
    }
    if (cleanTag.length > 10) {
      setErrorMsg('El tag no puede superar los 10 caracteres');
      return;
    }
    if (!/^[\p{L}0-9 _.-]+$/u.test(cleanTag)) {
      setErrorMsg('El tag solo puede contener letras, números, espacios, guiones y puntos');
      return;
    }

    // Rule Validation 1: One team per discipline per user
    const existingTeamInDiscipline = (userTeams || []).find(
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
    const isAvailable = !(userTeams || []).some(
      (t) => t.name.toLowerCase() === cleanName.toLowerCase() && t.gameSlug === gameSlug
    );
    if (!isAvailable) {
      setErrorMsg(`El nombre "${cleanName}" ya está registrado por otro club en ${selectedGameObj.name}. ¡Elige otro nombre!`);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          tag: cleanTag,
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

      const createdTeam: TeamData | undefined = data.data?.team || data.team || (data.data?.id ? data.data : undefined);

      if (!createdTeam || !createdTeam.id) {
        setErrorMsg('No se recibieron los datos del club creado por parte del servidor');
        setIsSubmitting(false);
        return;
      }

      updateCurrentUser({
        role: 'Capitán',
        teamId: createdTeam.id,
        teamName: createdTeam.name || cleanName,
        teamLogoUrl: createdTeam.logoUrl || logoUrl,
        teamBannerUrl: createdTeam.bannerUrl || bannerUrl,
      } as any);

      if (refetchTeams) refetchTeams();
      if (refetchUser) await refetchUser();
      window.dispatchEvent(new Event('teams_updated'));
      router.refresh();

      setIsSubmitting(false);
      if (onSuccess) onSuccess(createdTeam);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo crear el equipo');
      setIsSubmitting(false);
    }
  };

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title="Fundar nueva escuadra"
      subtitle="Crea el club, extrae o registra su identidad visual y asume su capitanía."
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitButtonText="Crear club y asumir capitanía"
      errorMessage={errorMsg}
      brandColor={color}
      size="lg"
    >
      <div className="space-y-5 font-[family-name:var(--font-active)] text-xs">

        {/* Live Crest Card Preview */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[var(--app-accent-2)]/60 via-[var(--app-canvas)] to-[var(--app-surface-1)] border border-[var(--app-accent-2)]/30 flex items-center justify-between gap-4 relative z-10 shadow-inner">
          <div className="flex items-center gap-3.5">
            <div
              className="ui-dynamic-brand-tile w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-black text-xl flex-shrink-0 transition-all overflow-hidden"
              style={{ '--ui-dynamic-brand': color } as React.CSSProperties}
            >
              <Avatar src={logoUrl || undefined} fallback={logoTextPreview} alt="Logo del club" size="lg" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[var(--text-muted)] block uppercase">VISTA PREVIA ESCUDO:</span>
              <h4 className="text-lg font-black text-[var(--text-heading)] uppercase tracking-tight line-clamp-1">
                {teamName.trim() || 'NOMBRE DE TU CLUB'}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="cyan" className="bg-[var(--app-accent-soft)] text-[var(--app-accent)] border-[var(--app-accent)]/30 text-[9px] uppercase font-bold">{selectedGameObj.name}</Badge>
                <span className="text-[10px] text-[var(--app-accent-2)] font-bold">Capitán: {currentUser?.name || 'Tú'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 1. Game Selector */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-[var(--text-secondary)] tracking-wider block">
            1. Disciplina eSports Principal:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.values(GAMES_CATALOG).map((g) => {
              const userHasTeamInThisGame = (userTeams || []).some(
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
                    setExtractedTeams([]);
                    setApiMessage('');
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-extrabold flex flex-col items-start gap-1 transition-all ${
                    gameSlug === g.slug
                      ? 'bg-[var(--app-accent-2-soft)] border-[var(--app-accent-2)] text-[var(--app-accent-2)] shadow-md font-black'
                      : 'bg-[var(--app-surface-2)] border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--app-surface-2)]'
                  }`}
                >
                  <div className="flex items-center gap-2 w-full">
                    <GameLogo game={g} size="sm" />
                    <span className="truncate">{g.name}</span>
                  </div>
                  {userHasTeamInThisGame && (
                    <span className="text-[9px] text-[var(--app-warning)] font-bold uppercase">
                      ● Ya tienes club
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ⚡ API Auto-Extraction Section */}
        <div className="p-3.5 rounded-2xl bg-[var(--app-surface-2)] border border-[var(--app-warning)]/30 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[var(--app-warning)] font-extrabold uppercase text-[11px]">
              <Sparkles className="w-4 h-4 animate-bounce" />
              <span>Auto-extraer datos vía API de {selectedGameObj.name}:</span>
            </div>
            <Badge variant="gold" className="text-[9px] uppercase font-bold">
              Búsqueda por Nombre o ID
            </Badge>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder={`Ej: Nombre de Club EA FC, Riot ID, o Faceit Team...`}
                value={apiQuery}
                onChange={(e) => setApiQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApiExtraction();
                  }
                }}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--app-canvas)] border border-[var(--border-card)] text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--app-warning)] font-bold"
              />
            </div>
            <Button
              type="button"
              onClick={handleApiExtraction}
              disabled={isExtracting}
              className="bg-[var(--app-warning)] text-[var(--bg-main)] hover:brightness-110 font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shrink-0 shadow-md"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Extraer</span>
                </>
              )}
            </Button>
          </div>

          {apiMessage && (
            <div className="p-2.5 rounded-xl bg-[var(--app-warning)]/10 border border-[var(--app-warning)]/20 text-[var(--app-warning)] text-[11px] font-bold flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{apiMessage}</span>
            </div>
          )}

          {/* Results list selector if candidates found */}
          {extractedTeams.length > 0 && (
            <TeamApiSearchResults
              teams={extractedTeams}
              sourceApi={sourceApi}
              onSelectTeam={applyExtractedTeamData}
              brandColor={color}
            />
          )}
        </div>

        {/* 2. Team Name, Tag & Brand Color */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-black uppercase text-[var(--text-secondary)] tracking-wider block">
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
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--app-surface-2)] border border-[var(--border-card)] text-xs font-bold text-[var(--text-heading)] placeholder-slate-500 focus:outline-none focus:border-[var(--app-accent-2)] shadow-inner"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-[var(--text-heading)] block">
              Tag / Sigla
            </label>
            <input
              type="text"
              required
              maxLength={10}
              placeholder="ej. SNFC"
              value={tag}
              onChange={(e) => {
                setTag(e.target.value.toUpperCase());
                setErrorMsg('');
              }}
              className="w-full px-3.5 py-2 rounded-xl input-theme border border-[var(--border-card)] text-xs font-extrabold uppercase text-center"
            />
          </div>
        </div>

        <BrandedImageUploadSection
          title="Identidad visual del club"
          brandColor={color}
          entityType="team"
          items={[
            {
              label: 'Escudo / Logo',
              currentUrl: logoUrl,
              fallbackType: 'logo',
              uploadType: 'logo',
              maxDimension: 512,
              uploadButtonText: 'Subir escudo',
              entityName: teamName.trim() || 'club',
              entityId: 'new-team',
              onUploadSuccess: (url) => setLogoUrl(url),
            },
            {
              label: 'Banner de portada',
              currentUrl: bannerUrl,
              fallbackType: 'banner',
              uploadType: 'banner',
              maxDimension: 1920,
              uploadButtonText: 'Subir portada',
              entityName: teamName.trim() || 'club',
              entityId: 'new-team',
              onUploadSuccess: (url) => setBannerUrl(url),
            },
          ]}
        />

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
            <option value="PS4">PS4</option>
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
            className="rounded border-[var(--border-card)] text-[var(--app-accent)] focus:ring-0"
          />
        </div>

      </div>
    </ModalForm>
  );
}
