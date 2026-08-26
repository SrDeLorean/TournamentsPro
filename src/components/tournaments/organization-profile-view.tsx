'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GameConfig } from '@/lib/games-data';
import { shouldBypassImageOptimization } from '@/lib/image-utils';
import { SubSubNavbar, SubSubTabOption } from '@/components/layout/sub-sub-navbar';
import {
  Building2, Trophy, Shield, ArrowLeft, Gamepad2, Award,
  Globe, Star, ExternalLink, UserCheck, Activity, Mail, MapPin, BarChart2
} from 'lucide-react';
import { FixtureScheduleView } from '@/components/tournaments/fixture-schedule-view';
import { ClassificationView } from '@/components/tournaments/classification-view';
import { EsportsCard } from '@/components/ui/esports-card';

export type OrgTab = 'competencias' | 'organizadores' | 'clubes' | 'clasificacion' | 'partidos' | 'info';

export interface OrgProfileData {
  id: string;
  name: string;
  tag?: string;
  ownerId?: string;
  logoUrl?: string;
  bannerUrl?: string;
  country?: string;
  foundedYear?: string;
  rating?: string;
  website?: string;
  description?: string;
  status?: string;
  allowedGames?: string[];
  socialMedia?: Record<string, string>;
}

export interface CompetitionData {
  id: string;
  name: string;
  game_slug: string;
  mode_format?: string;
  format_type?: string;
  format?: string;
  status: string;
  created_at?: string;
  max_teams?: number;
  registered_teams_count?: number;
  teams_count?: number;
  prize_pool?: string;
  total_matches?: number;
  finished_matches?: number;
  logo_url?: string;
  logoUrl?: string;
  banner_url?: string;
  bannerUrl?: string;
  transfer_market_mode?: string;
}

export interface OrganizerUser {
  id: string;
  name: string;
  gamertag?: string;
  email?: string;
  role?: string;
  avatar_url?: string;
  foto?: string;
  country?: string;
}

export interface AffiliatedTeam {
  id: string;
  name: string;
  tag?: string;
  logo_url?: string;
  rating?: string;
  player_count?: number;
}

export interface OrgMatch {
  id: string;
  competition_id?: string;
  competition_name?: string;
  home_team_name?: string;
  home_team_tag?: string;
  home_logo?: string;
  away_team_name?: string;
  away_team_tag?: string;
  away_logo?: string;
  score_home?: number | null;
  score_away?: number | null;
  status?: string;
  scheduled_at?: string;
  matchday?: number;
  round_name?: string;
}

interface OrganizationProfileViewProps {
  gameSlug: string;
  gameConfig: GameConfig;
  org: OrgProfileData;
  competitions: CompetitionData[];
  organizers: OrganizerUser[];
  teams: AffiliatedTeam[];
  matches: OrgMatch[];
}

export function OrganizationProfileView({
  gameSlug,
  gameConfig,
  org,
  competitions = [],
  organizers = [],
  teams = [],
  matches = [],
}: OrganizationProfileViewProps) {
  const [activeTab, setActiveTab] = useState<OrgTab>('competencias');
  const brandColor = gameConfig?.brandColor || '#077D7E';

  const orgSubSubTabs: SubSubTabOption<OrgTab>[] = [
    { id: 'competencias', label: 'Torneos & Ligas', icon: <Trophy className="w-3.5 h-3.5" />, badge: competitions.length },
    { id: 'organizadores', label: 'Staff & Organizadores', icon: <UserCheck className="w-3.5 h-3.5" />, badge: organizers.length },
    { id: 'clubes', label: 'Clubes Afiliados', icon: <Shield className="w-3.5 h-3.5" />, badge: teams.length },
    { id: 'clasificacion', label: 'Clasificación', icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { id: 'partidos', label: 'Matchday & Encuentros', icon: <Activity className="w-3.5 h-3.5" />, badge: matches.length },
    { id: 'info', label: 'Información & Reglas', icon: <Building2 className="w-3.5 h-3.5" /> },
  ];

  const orgBanner = org.bannerUrl || org.logoUrl || gameConfig.bannerUrl || '/images/default/banner-default.jpg';
  const orgLogo = org.logoUrl || '/images/default/logo-default.png';
  const ratingVal = org.rating || '4.98';
  const countryVal = org.country || 'Global';
  const foundedVal = org.foundedYear || '2022';
  const isVerified = org.status === 'Activa';

  return (
    <div
      className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 -mt-px text-[var(--text-primary)]"
      style={{
        '--game-brand': brandColor,
        '--game-accent': gameConfig.accentColor || '#00F0FF',
      } as React.CSSProperties}
    >
      {/* ── 1. FULL-WIDTH HERO HEADER BANNER ────────────────────────────── */}
      <div className="relative w-full left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-slate-950 border-b border-[var(--border-card)] shadow-2xl overflow-hidden min-h-[260px] sm:min-h-[360px] flex flex-col justify-end">
        {/* Full-bleed background graphic with gradient overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src={orgBanner}
            alt={org.name}
            fill
            sizes="100vw"
            priority
            unoptimized={shouldBypassImageOptimization(orgBanner)}
            onError={(e) => {
              e.currentTarget.src = '/images/default/banner-default.jpg';
            }}
            className="object-cover opacity-90 filter contrast-[1.1] brightness-[0.85]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-transparent to-slate-950/90" />
        </div>

        {/* Content Box Over Banner */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10 relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
            {/* Crest Shield Container */}
            <div
              className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-slate-950/90 border-2 sm:border-4 flex items-center justify-center shadow-2xl flex-shrink-0 overflow-hidden relative group backdrop-blur-xl"
              style={{ borderColor: brandColor, boxShadow: `0 0 30px ${brandColor}40` }}
            >
              {orgLogo ? (
                <Image
                  src={orgLogo}
                  alt={org.name}
                  fill
                  sizes="112px"
                  unoptimized={shouldBypassImageOptimization(orgLogo)}
                  onError={(e) => {
                    e.currentTarget.src = '/images/default/logo-default.png';
                  }}
                  className="object-contain p-2 filter drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <Building2 className="w-10 h-10 sm:w-14 sm:h-14" style={{ color: brandColor }} />
              )}
            </div>

            {/* Main Info */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {org.tag && (
                  <span className="bg-white/10 border border-white/20 text-white px-2.5 py-0.5 rounded-lg text-xs font-mono font-black uppercase tracking-wider backdrop-blur-md">
                    [{org.tag}]
                  </span>
                )}
                {isVerified && (
                  <span className="flex items-center gap-1.5 text-[10px] font-black font-mono uppercase bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    ORGANIZACIÓN VERIFICADA
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-white uppercase tracking-tight drop-shadow-lg leading-none">
                {org.name}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl line-clamp-2 leading-relaxed font-sans">
                {org.description || `Comunidad oficial y sede de torneos eSports activa en el circuito competitivo de ${gameConfig.name}.`}
              </p>

              {/* Telemetry Bar */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-slate-200 font-mono pt-1">
                <div className="flex items-center gap-1.5 bg-black/50 px-3 py-1 rounded-xl backdrop-blur-md border border-white/10 shadow-inner">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span><strong className="text-white">{competitions.length}</strong> Torneos</span>
                </div>
                <div className="flex items-center gap-1.5 bg-black/50 px-3 py-1 rounded-xl backdrop-blur-md border border-white/10 shadow-inner">
                  <Shield className="w-3.5 h-3.5" style={{ color: brandColor }} />
                  <span><strong className="text-white">{teams.length}</strong> Clubes Afiliados</span>
                </div>
                <div className="flex items-center gap-1.5 bg-black/50 px-3 py-1 rounded-xl backdrop-blur-md border border-white/10 shadow-inner">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <span><strong className="text-white">{ratingVal}</strong> Rating</span>
                </div>
                <div className="flex items-center gap-1.5 bg-black/50 px-3 py-1 rounded-xl backdrop-blur-md border border-white/10 shadow-inner">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{countryVal}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action & Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {org.website && (
              <a
                href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-2xl font-bold text-xs transition-all duration-300 bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-md flex items-center gap-2"
              >
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Sitio Web</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}

            <Link href={`/${gameSlug}/organizaciones`}>
              <button className="px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-300 bg-slate-900/90 hover:bg-slate-800 border border-white/20 text-white backdrop-blur-md flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95">
                <ArrowLeft className="w-4 h-4" /> Volver al Directorio
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. SUB-SUB-NAVBAR TABS ────────────────────────────────────────── */}
      <SubSubNavbar
        tabs={orgSubSubTabs}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        brandColor={brandColor}
      />

      {/* ── 3. TAB CONTENTS ────────────────────────────────────────────── */}
      <div className="pb-16">
        {/* ── TAB 1: TORNEOS & LIGAS ─────────────────────────────────── */}
        {activeTab === 'competencias' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black font-display text-[var(--text-heading)] uppercase tracking-tight flex items-center gap-2">
                  <Trophy className="w-6 h-6" style={{ color: brandColor }} />
                  Torneos & Competencias de {org.name}
                </h2>
                <p className="text-xs text-[var(--text-muted)] font-mono mt-1">
                  Circuito oficial de ligas, copas y eliminatorias eSports administradas por la comunidad.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-slate-900 border border-white/10 text-cyan-400 self-start sm:self-auto shadow-md">
                {competitions.length} COMPETENCIA{competitions.length !== 1 ? 'S' : ''} REGISTRADA{competitions.length !== 1 ? 'S' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {competitions.map((comp, index) => {
                const regCount = comp.registered_teams_count || comp.teams_count || 0;
                const maxCount = comp.max_teams || 16;

                const compBanner = comp.banner_url || comp.bannerUrl || orgBanner;
                const compLogo = comp.logo_url || comp.logoUrl || orgLogo;

                const isPlayoff = (comp.format || comp.mode_format || '').toLowerCase().includes('playoff');
                const isHybrid = (comp.format || comp.mode_format || '').toLowerCase().includes('hibrid');

                return (
                  <EsportsCard
                    key={comp.id}
                    href={`/${gameSlug}/organizacion/${org.id}/competencias/${comp.id}`}
                    title={comp.name}
                    subtitle={comp.mode_format || '11v11'}
                    bannerUrl={compBanner}
                    logoUrl={compLogo}
                    tag={isPlayoff ? 'PLAYOFF' : isHybrid ? 'LIGA HÍBRIDA' : 'LIGA DE PUNTOS'}
                    badges={[
                      comp.status === 'Activo' || comp.status === 'EN CURSO'
                        ? { text: 'EN CURSO', variant: 'emerald', pulse: true }
                        : comp.status === 'Finalizado'
                        ? { text: 'FINALIZADO', variant: 'slate' }
                        : { text: 'INSCRIPCIONES ABIERTAS', variant: 'cyan' },
                    ]}
                    stats={[
                      { icon: <Award className="w-3.5 h-3.5 text-amber-400" />, label: 'Prize Pool', value: comp.prize_pool || 'Por Definir', highlight: true },
                      { icon: <Shield className="w-3.5 h-3.5 text-emerald-400" />, label: 'Mercado', value: comp.transfer_market_mode || 'ABIERTO' },
                    ]}
                    progress={{
                      label: 'EQUIPOS REGISTRADOS',
                      current: regCount,
                      max: maxCount,
                    }}
                    footerLeft={
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <Activity className="w-3.5 h-3.5" style={{ color: brandColor }} />
                        <span>{comp.total_matches || 0} Partidos</span>
                      </span>
                    }
                    actionText="EXPLORAR FIXTURE"
                    brandColor={brandColor}
                    animationDelay={index * 60}
                  />
                );
              })}

              {competitions.length === 0 && (
                <div className="col-span-full py-16 text-center border border-dashed border-[var(--border-card)] rounded-3xl glass-panel">
                  <Trophy className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-bold text-[var(--text-heading)]">No hay torneos activos publicables</h3>
                  <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto mt-2">
                    Esta organización no posee torneos o ligas públicas registradas actualmente para {gameConfig.name}.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: STAFF & ORGANIZADORES ────────────────────────────── */}
        {activeTab === 'organizadores' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-[var(--text-heading)] uppercase tracking-tight flex items-center gap-2">
                <UserCheck className="w-6 h-6" style={{ color: brandColor }} />
                Staff & Organizadores Oficiales
              </h2>
              <p className="text-xs text-[var(--text-muted)] font-mono mt-1">
                Personal verificado que administra las salas, fixtures y decisiones disciplinarias en {org.name}.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {organizers.map((orgUser) => (
                <div
                  key={orgUser.id}
                  className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-xl flex items-center gap-4 hover:border-[var(--game-brand)] transition-all group"
                >
                  <div className="relative w-16 h-16 rounded-2xl bg-[var(--bg-main)] border-2 border-[var(--border-card)] flex items-center justify-center overflow-hidden shrink-0 shadow-lg group-hover:border-[var(--game-brand)] transition-colors">
                    {orgUser.avatar_url || orgUser.foto ? (
                      <Image
                        src={orgUser.avatar_url || orgUser.foto || '/images/default/logo-default.png'}
                        alt={orgUser.name}
                        fill
                        sizes="64px"
                        unoptimized={shouldBypassImageOptimization(orgUser.avatar_url || orgUser.foto || '')}
                        className="object-cover"
                      />
                    ) : (
                      <UserCheck className="w-8 h-8 text-[var(--text-muted)]" />
                    )}
                  </div>

                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono font-black uppercase bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20">
                        {orgUser.role || 'Organizador'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[var(--text-heading)] truncate font-display group-hover:text-[var(--game-brand)] transition-colors">
                      {orgUser.gamertag || orgUser.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] truncate font-mono">
                      {orgUser.name}
                    </p>
                    {orgUser.email && (
                      <p className="text-[10px] text-[var(--text-muted)] truncate flex items-center gap-1">
                        <Mail className="w-3 h-3 text-[var(--game-brand)]" />
                        {orgUser.email}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {organizers.length === 0 && (
                <div className="col-span-full py-16 text-center border border-dashed border-[var(--border-card)] rounded-3xl glass-panel">
                  <UserCheck className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-bold text-[var(--text-heading)]">No hay organizadores asignados</h3>
                  <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto mt-2">
                    Los organizadores oficiales asociados a esta organización aparecerán listados aquí.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 3: CLUBES AFILIADOS ─────────────────────────────────── */}
        {activeTab === 'clubes' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-[var(--text-heading)] uppercase tracking-tight flex items-center gap-2">
                <Shield className="w-6 h-6" style={{ color: brandColor }} />
                Clubes & Escuadras Registradas
              </h2>
              <p className="text-xs text-[var(--text-muted)] font-mono mt-1">
                Equipos inscritos bajo la cobertura de la organización en {gameConfig.name}.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {teams.map((team) => (
                <Link
                  key={team.id}
                  href={`/${gameSlug}/equipos/${team.id}`}
                  className="group block"
                >
                  <div className="glass-panel p-5 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)]/60 backdrop-blur-xl relative overflow-hidden flex flex-col h-full hover:-translate-y-1 hover:border-[var(--game-brand)] hover:shadow-[0_0_20px_var(--game-brand)] transition-all">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative w-14 h-14 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-lg group-hover:border-[var(--game-brand)] transition-colors">
                        {team.logo_url ? (
                          <Image
                            src={team.logo_url}
                            alt={team.name}
                            fill
                            sizes="56px"
                            unoptimized={shouldBypassImageOptimization(team.logo_url)}
                            className="object-contain p-1 filter group-hover:drop-shadow-[0_0_8px_var(--game-brand)]"
                          />
                        ) : (
                          <Shield className="w-7 h-7 text-[var(--game-brand)]" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        {team.tag && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/5 border border-[var(--border-card)] text-[var(--text-secondary)] uppercase">
                            {team.tag}
                          </span>
                        )}
                        <h3 className="text-base font-bold text-[var(--text-heading)] group-hover:text-[var(--game-brand)] transition-colors truncate uppercase font-display">
                          {team.name}
                        </h3>
                        <span className="text-xs text-amber-400 font-mono font-bold">★ {team.rating || '4.9'}</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-3 border-t border-[var(--border-card)] flex justify-between items-center text-xs font-mono text-[var(--text-muted)]">
                      <span>{team.player_count || 11} Jugadores</span>
                      <span className="text-[var(--game-brand)] font-bold group-hover:translate-x-1 transition-transform">&rarr;</span>
                    </div>
                  </div>
                </Link>
              ))}

              {teams.length === 0 && (
                <div className="col-span-full py-16 text-center border border-dashed border-[var(--border-card)] rounded-3xl glass-panel">
                  <Shield className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-bold text-[var(--text-heading)]">No hay clubes registrados</h3>
                  <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto mt-2">
                    Las escuadras que disputen los torneos de esta comunidad se desglosarán en esta sección.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 4: CLASIFICACIÓN ────────────────────────────────────────── */}
        {activeTab === 'clasificacion' && (
          <div className="space-y-6">
            <ClassificationView
              game={gameConfig}
              initialOrgName={org.name}
              hideOrgFilter={true}
              hideCompFilter={false}
              hideHeader={true}
            />
          </div>
        )}

        {/* ── TAB 5: MATCHDAY & ENCUENTROS ────────────────────────────── */}
        {activeTab === 'partidos' && (
          <div className="space-y-6">
            <FixtureScheduleView
              game={gameConfig}
              initialOrgName={org.name}
              hideOrgFilter={true}
              hideCompFilter={false}
              hideHeader={true}
            />
          </div>
        )}

        {/* ── TAB 5: INFORMACIÓN & REGLAS ─────────────────────────────── */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-xl space-y-6">
              <h2 className="text-xl font-black font-display text-[var(--text-heading)] uppercase flex items-center gap-2">
                <Building2 className="w-5 h-5" style={{ color: brandColor }} />
                Acerca de {org.name}
              </h2>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed font-sans">
                {org.description || `Organización eSports dedicada a la creación, gestión y desarrollo de competencias profesionales en ${gameConfig.name}.`}
              </p>

              <div className="pt-6 border-t border-[var(--border-card)] space-y-4">
                <h3 className="text-sm font-bold text-[var(--text-heading)] uppercase font-mono">Disciplinas Autorizadas</h3>
                <div className="flex flex-wrap gap-2">
                  {(org.allowedGames || ['eafc26', 'valorant']).map((g) => (
                    <span
                      key={g}
                      className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-white/5 border border-[var(--border-card)] text-[var(--text-primary)] flex items-center gap-1.5"
                    >
                      <Gamepad2 className="w-3.5 h-3.5" style={{ color: brandColor }} />
                      {g.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-[var(--text-heading)] uppercase font-mono flex items-center gap-2">
                <Shield className="w-4 h-4" style={{ color: brandColor }} /> Ficha de Prestigio
              </h3>

              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between py-2 border-b border-[var(--border-card)]">
                  <span className="text-[var(--text-muted)]">ESTADO:</span>
                  <span className="font-bold text-emerald-400">{org.status || 'Activa'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--border-card)]">
                  <span className="text-[var(--text-muted)]">PAÍS SEDE:</span>
                  <span className="font-bold text-[var(--text-primary)]">{countryVal}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--border-card)]">
                  <span className="text-[var(--text-muted)]">AÑO FUNDACIÓN:</span>
                  <span className="font-bold text-[var(--text-primary)]">{foundedVal}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--border-card)]">
                  <span className="text-[var(--text-muted)]">RATING COMUNIDAD:</span>
                  <span className="font-bold text-yellow-400">★ {ratingVal}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
