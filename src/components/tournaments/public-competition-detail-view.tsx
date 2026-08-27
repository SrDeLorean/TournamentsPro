'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GameConfig } from '@/lib/games-data';
import { shouldBypassImageOptimization } from '@/lib/image-utils';
import { SubSubNavbar, SubSubTabOption } from '@/components/layout/sub-sub-navbar';
import {
  Trophy, Shield, Calendar, ArrowLeft, Award, Users, Target, Activity,
  CheckCircle2, FileText, Building2, RefreshCw, BarChart2
} from 'lucide-react';
import { PlayoffBracket } from '@/components/tournaments/playoff-bracket';
import { FixtureScheduleView } from '@/components/tournaments/fixture-schedule-view';
import { ClassificationView } from '@/components/tournaments/classification-view';

export type CompTab = 'equipos' | 'bracket' | 'partidos' | 'reglas';

export interface CompetitionDetail {
  id: string;
  name: string;
  game_slug: string;
  mode_format?: string;
  format?: string;
  match_mode?: string;
  group_count?: number;
  qualifiers_per_group?: number;
  max_teams?: number;
  registered_teams_count?: number;
  prize_pool?: string;
  status: string;
  fecha_inicio?: string;
  fecha_termino?: string;
  fecha_limite_inscripcion?: string;
  description?: string;
  transfer_market_mode?: string;
  org_name?: string;
  org_logo?: string;
  org_banner?: string;
  organization_id?: string;
}

export interface ConfirmedTeam {
  id: string;
  team_id?: string;
  team_name: string;
  team_tag?: string;
  team_logo?: string;
  captain_name?: string;
  status?: string;
  created_at?: string;
}

export interface CompetitionMatch {
  id: string;
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
  group_name?: string;
}

interface PublicCompetitionDetailViewProps {
  gameSlug: string;
  orgId: string;
  gameConfig: GameConfig;
  competition: CompetitionDetail;
  teams: ConfirmedTeam[];
  matches: CompetitionMatch[];
}

export function PublicCompetitionDetailView({
  gameSlug,
  orgId,
  gameConfig,
  competition,
  teams = [],
  matches = [],
}: PublicCompetitionDetailViewProps) {
  const [activeTab, setActiveTab] = useState<CompTab>('equipos');
  const brandColor = gameConfig?.brandColor || '#077D7E';

  const isPlayoff = competition.format?.toLowerCase().includes('playoff') || competition.mode_format?.toLowerCase().includes('playoff');
  const isHybrid = competition.format?.toLowerCase().includes('hibrid') || competition.mode_format?.toLowerCase().includes('hibrid');

  const compSubSubTabs: SubSubTabOption<CompTab>[] = [
    { id: 'equipos', label: 'Equipos Confirmados', icon: <Shield className="w-3.5 h-3.5" />, badge: teams.length },
    { id: 'bracket', label: isPlayoff ? 'Cuadro Playoffs' : isHybrid ? 'Cuadro & Posiciones' : 'Tabla de Clasificación', icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { id: 'partidos', label: 'Calendario Partidos', icon: <Activity className="w-3.5 h-3.5" />, badge: matches.length },
    { id: 'reglas', label: 'Reglamento & Fechas', icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  const regCount = teams.length || competition.registered_teams_count || 0;
  const maxCount = competition.max_teams || 16;
  const percent = Math.min(100, Math.round((regCount / maxCount) * 100));

  const compBanner = competition.org_banner || gameConfig.bannerUrl || '/images/default/banner-default.jpg';
  const orgLogo = competition.org_logo || '/images/default/logo-default.png';
  const orgName = competition.org_name || 'Organización Oficial';
  const playoffMatches = matches.map((match) => ({
    id: match.id,
    home_team_name: match.home_team_name || 'Por definir',
    home_team_tag: match.home_team_tag || '',
    away_team_name: match.away_team_name || 'Por definir',
    away_team_tag: match.away_team_tag || '',
    score_home: match.score_home ?? null,
    score_away: match.score_away ?? null,
    status: match.status || 'Pendiente',
    round_name: match.round_name || 'Ronda Única',
    matchday: match.matchday,
  }));

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
        {/* Full-bleed background graphic */}
        <div className="absolute inset-0 z-0">
          <Image
            src={compBanner}
            alt={competition.name}
            fill
            sizes="100vw"
            loading="eager"
            unoptimized={shouldBypassImageOptimization(compBanner)}
            onError={(e) => {
              e.currentTarget.src = '/images/default/banner-default.jpg';
            }}
            className="object-cover opacity-90 filter contrast-[1.1] brightness-[0.85]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-transparent to-slate-950/90" />
        </div>

        {/* Content Box Layer */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10 relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
            {/* Org Logo Crest */}
            <Link href={`/${gameSlug}/organizacion/${orgId}`}>
              <div
                className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-slate-950/90 border-2 sm:border-4 flex items-center justify-center shadow-2xl flex-shrink-0 overflow-hidden relative group backdrop-blur-xl hover:scale-105 transition-all"
                style={{ borderColor: brandColor, boxShadow: `0 0 30px ${brandColor}40` }}
              >
                {orgLogo ? (
                  <Image
                    src={orgLogo}
                    alt={orgName}
                    fill
                    sizes="112px"
                    unoptimized={shouldBypassImageOptimization(orgLogo)}
                    onError={(e) => {
                      e.currentTarget.src = '/images/default/logo-default.png';
                    }}
                    className="object-contain p-2 filter drop-shadow-md"
                  />
                ) : (
                  <Building2 className="w-10 h-10 sm:w-14 sm:h-14" style={{ color: brandColor }} />
                )}
              </div>
            </Link>

            {/* Title & Badges */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-black uppercase tracking-wider backdrop-blur-md border ${
                    competition.status === 'Activo' || competition.status === 'EN CURSO'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                  }`}
                >
                  {competition.status === 'Activo' ? 'EN CURSO' : competition.status}
                </span>

                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1 border border-white/10 bg-white/10 px-2.5 py-0.5 rounded-lg backdrop-blur-md">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  {isPlayoff ? 'PLAYOFF ELIMINATORIA' : isHybrid ? 'LIGA HÍBRIDA' : 'LIGA DE PUNTOS'}
                </span>

                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1 border border-white/10 bg-white/10 px-2.5 py-0.5 rounded-lg backdrop-blur-md">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  {competition.mode_format || '11v11'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-white uppercase tracking-tight drop-shadow-lg leading-none">
                {competition.name}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300 font-mono pt-1">
                <Link
                  href={`/${gameSlug}/organizacion/${orgId}`}
                  className="flex items-center gap-1.5 bg-black/50 px-3 py-1 rounded-xl backdrop-blur-md border border-white/10 shadow-inner hover:border-cyan-400 transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5" style={{ color: brandColor }} />
                  <span>Sede: <strong className="text-white hover:underline">{orgName}</strong></span>
                </Link>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href={`/${gameSlug}/organizacion/${orgId}`}>
              <button className="px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-300 bg-slate-900/90 hover:bg-slate-800 border border-white/20 text-white backdrop-blur-md flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95">
                <ArrowLeft className="w-4 h-4" /> Volver a la Organización
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. TELEMETRY & PRIZE POOL STRIPE ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/15 via-[var(--bg-card)] to-[var(--bg-card)] border border-amber-500/30 shadow-xl backdrop-blur-md flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> PRIZE POOL
            </span>
            <div className="text-2xl font-black font-display text-amber-400">
              {competition.prize_pool || 'Por Definir'}
            </div>
          </div>
          <Trophy className="w-8 h-8 text-amber-400/40" />
        </div>

        <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-xl backdrop-blur-md flex flex-col justify-between space-y-2">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-[var(--text-muted)] uppercase tracking-wider">EQUIPOS INSCRITOS</span>
            <span className="font-bold text-[var(--text-primary)]">{regCount} / {maxCount}</span>
          </div>
          <div className="w-full h-2.5 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border-card)] p-0.5">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${percent}%`,
                backgroundColor: brandColor,
                boxShadow: `0 0 12px ${brandColor}`,
              }}
            />
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-mono text-right">{percent}% Completado</span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-xl backdrop-blur-md flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest">
              FORMATO ENCUENTROS
            </span>
            <div className="text-sm font-bold text-[var(--text-primary)]">
              {competition.match_mode === 'IdaVuelta' ? 'Ida y Vuelta' : 'Partido Único'}
            </div>
          </div>
          <Activity className="w-6 h-6 text-purple-400 opacity-60" />
        </div>

        <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-xl backdrop-blur-md flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest">
              MERCADO FICHAJES
            </span>
            <div className="text-xs font-bold text-emerald-400 font-mono">
              {competition.transfer_market_mode || 'ABIERTO'}
            </div>
          </div>
          <RefreshCw className="w-6 h-6 text-emerald-400 opacity-60" />
        </div>
      </div>

      {/* ── 3. SUB-SUB-NAVBAR TABS ────────────────────────────────────────── */}
      <SubSubNavbar
        tabs={compSubSubTabs}
        activeTab={activeTab}
        onSelectTab={(t) => setActiveTab(t as CompTab)}
        brandColor={brandColor}
      />

      {/* ── 4. TAB CONTENT ─────────────────────────────────────────────── */}
      <div className="pb-16">
        {/* ── TAB 1: EQUIPOS CONFIRMADOS ────────────────────────────────── */}
        {activeTab === 'equipos' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black font-display text-[var(--text-heading)] uppercase tracking-tight flex items-center gap-2">
                  <Shield className="w-6 h-6" style={{ color: brandColor }} />
                  Equipos Confirmados ({teams.length})
                </h2>
                <p className="text-xs text-[var(--text-muted)] font-mono mt-1">
                  Escuadras oficiales inscritas que disputan esta competencia.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {teams.map((t, index) => (
                <div
                  key={t.id}
                  className="glass-panel p-5 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)]/60 backdrop-blur-xl relative overflow-hidden flex items-center gap-4 hover:border-[var(--game-brand)] transition-all animate-fade-up group"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div className="relative w-14 h-14 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-lg group-hover:border-[var(--game-brand)] transition-colors">
                    {t.team_logo ? (
                      <Image
                        src={t.team_logo}
                        alt={t.team_name}
                        fill
                        sizes="56px"
                        unoptimized={shouldBypassImageOptimization(t.team_logo)}
                        className="object-contain p-1 filter group-hover:drop-shadow-[0_0_8px_var(--game-brand)]"
                      />
                    ) : (
                      <Shield className="w-7 h-7 text-[var(--game-brand)]" />
                    )}
                  </div>

                  <div className="overflow-hidden space-y-1">
                    {t.team_tag && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/5 border border-[var(--border-card)] text-[var(--text-secondary)] uppercase">
                        {t.team_tag}
                      </span>
                    )}
                    <h3 className="text-base font-bold text-[var(--text-heading)] group-hover:text-[var(--game-brand)] transition-colors truncate uppercase font-display">
                      {t.team_name}
                    </h3>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> CONFIRMADO
                    </span>
                  </div>
                </div>
              ))}

              {teams.length === 0 && (
                <div className="col-span-full py-16 text-center border border-dashed border-[var(--border-card)] rounded-3xl glass-panel">
                  <Shield className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-bold text-[var(--text-heading)]">No hay equipos inscritos aún</h3>
                  <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto mt-2">
                    Las escuadras confirmadas en esta competencia aparecerán reflejadas aquí.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: BRACKET O TABLA DE POSICIONES ───────────────────────── */}
        {activeTab === 'bracket' && (
          <div className="space-y-6">
            {(isPlayoff || isHybrid) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-2">
                  <h3 className="text-sm font-black uppercase text-[var(--text-heading)] tracking-wider flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    Cuadro de Eliminatoria Playoffs
                  </h3>
                </div>
                {matches.length > 0 ? (
                  <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl p-6 shadow-xl overflow-x-auto relative backdrop-blur-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
                    <PlayoffBracket matches={playoffMatches} brandColor={brandColor} />
                  </div>
                ) : (
                  <div className="py-12 text-center border border-dashed border-[var(--border-card)] rounded-3xl glass-panel">
                    <Target className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-50" />
                    <h3 className="text-base font-bold text-[var(--text-heading)]">Cuadro de Playoffs por generar</h3>
                    <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mt-1">
                      El organizador publicará el cuadro oficial al finalizar la fase de grupos.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tabla de Clasificación General de la Liga */}
            {(!isPlayoff || isHybrid) && (
              <div className={isHybrid ? "pt-6 border-t border-[var(--border-card)]" : ""}>
                <ClassificationView
                  game={gameConfig}
                  initialOrgName={competition.org_name || orgId}
                  initialTournName={competition.name}
                  hideOrgFilter={true}
                  hideCompFilter={true}
                  hideSearchFilter={true}
                  hideHeader={true}
                />
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: CALENDARIO PARTIDOS ────────────────────────────────── */}
        {activeTab === 'partidos' && (
          <div className="space-y-6">
            <FixtureScheduleView
              game={gameConfig}
              initialOrgName={competition.org_name || orgId}
              initialTournName={competition.name}
              hideOrgFilter={true}
              hideCompFilter={true}
              hideSearchFilter={true}
              hideHeader={true}
            />
          </div>
        )}

        {/* ── TAB 4: REGLAMENTO & DATES ─────────────────────────────────── */}
        {activeTab === 'reglas' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-xl space-y-6">
              <h2 className="text-xl font-black font-display text-[var(--text-heading)] uppercase flex items-center gap-2">
                <FileText className="w-5 h-5" style={{ color: brandColor }} />
                Reglamento & Descripción del Torneo
              </h2>

              <p className="text-sm text-[var(--text-primary)] leading-relaxed font-sans">
                {competition.description || `Competencia oficial de ${gameConfig.name} administrada por ${orgName}. Todos los participantes deben respetar los estatutos del circuito y reportar resultados en tiempo y forma.`}
              </p>

              <div className="pt-6 border-t border-[var(--border-card)] space-y-4 text-xs font-mono">
                <h3 className="text-sm font-bold text-[var(--text-heading)] uppercase">Especificaciones del Sistema</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-1">
                    <span className="text-[var(--text-muted)]">MODALIDAD DE JUEGO</span>
                    <p className="font-bold text-[var(--text-primary)]">{competition.mode_format || '11v11'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-1">
                    <span className="text-[var(--text-muted)]">FORMATO DE PARTIDOS</span>
                    <p className="font-bold text-[var(--text-primary)]">{competition.match_mode === 'IdaVuelta' ? 'Ida y Vuelta' : 'Partido Único'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-1">
                    <span className="text-[var(--text-muted)]">CANTIDAD DE GRUPOS</span>
                    <p className="font-bold text-[var(--text-primary)]">{competition.group_count || 4} Grupos</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-1">
                    <span className="text-[var(--text-muted)]">CLASIFICAN A PLAYOFFS</span>
                    <p className="font-bold text-amber-400">Top {competition.qualifiers_per_group || 2} por Grupo</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-[var(--text-heading)] uppercase font-mono flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" /> Fechas Clave
              </h3>

              <div className="space-y-3 text-xs font-mono">
                <div className="flex flex-col gap-1 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
                  <span className="text-[var(--text-muted)]">INICIO DEL TORNEO:</span>
                  <strong className="text-[var(--text-primary)] font-bold">
                    {competition.fecha_inicio ? new Date(competition.fecha_inicio).toLocaleDateString('es-ES', { dateStyle: 'long' }) : 'Por definir'}
                  </strong>
                </div>

                <div className="flex flex-col gap-1 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
                  <span className="text-[var(--text-muted)]">CIERRE INSCRIPCIONES:</span>
                  <strong className="text-[var(--text-primary)] font-bold">
                    {competition.fecha_limite_inscripcion ? new Date(competition.fecha_limite_inscripcion).toLocaleDateString('es-ES', { dateStyle: 'long' }) : 'Por definir'}
                  </strong>
                </div>

                <div className="flex flex-col gap-1 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
                  <span className="text-[var(--text-muted)]">FECHA FINALIZACIÓN:</span>
                  <strong className="text-[var(--text-primary)] font-bold">
                    {competition.fecha_termino ? new Date(competition.fecha_termino).toLocaleDateString('es-ES', { dateStyle: 'long' }) : 'Por definir'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
