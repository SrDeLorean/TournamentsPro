'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GameConfig } from '@/lib/games-data';
import { shouldBypassImageOptimization } from '@/lib/image-utils';
import { SubSubNavbar, SubSubTabOption } from '@/components/layout/sub-sub-navbar';
import { PublicProfileShell } from '@/components/public/public-profile-shell';
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
  prize_pool?: string | null;
  status: string;
  fecha_inicio?: string | null;
  fecha_termino?: string | null;
  fecha_limite_inscripcion?: string | null;
  description?: string | null;
  transfer_market_mode?: string;
  org_name?: string;
  org_logo?: string;
  org_banner?: string;
  organization_id?: string | null;
  organizer_id?: string | null;
  organizer_name?: string | null;
  season_id?: string | null;
  created_at?: string;
}

export interface ConfirmedTeam {
  id: string;
  competition_id?: string;
  team_id?: string;
  team_name: string;
  team_tag?: string;
  team_logo?: string | null;
  captain_name?: string;
  status?: string;
  created_at?: string;
  enrolled_at?: string;
  updated_at?: string;
}

export interface CompetitionMatch {
  id: string;
  home_team_id?: string | null;
  team_home_id?: string | null;
  away_team_id?: string | null;
  team_away_id?: string | null;
  home_team_name?: string | null;
  home_team_tag?: string | null;
  home_logo?: string | null;
  away_team_name?: string | null;
  away_team_tag?: string | null;
  away_logo?: string | null;
  score_home?: number | null;
  score_away?: number | null;
  status?: string;
  scheduled_at?: string;
  reported_score_home?: number | null;
  reported_score_away?: number | null;
  matchday_number?: number | null;
  matchday?: number | null;
  round_name?: string | null;
  group_name?: string | null;
}

interface PublicCompetitionDetailViewProps {
  gameSlug: string;
  orgId: string;
  gameConfig: GameConfig;
  competition: CompetitionDetail;
  teams: ConfirmedTeam[];
  matches: CompetitionMatch[];
  context?: 'global' | 'game';
}

export function PublicCompetitionDetailView({
  gameSlug,
  orgId,
  gameConfig,
  competition,
  teams = [],
  matches = [],
  context = 'game',
}: PublicCompetitionDetailViewProps) {
  const [activeTab, setActiveTab] = useState<CompTab>('equipos');
  const brandColor = gameConfig?.brandColor || 'var(--app-accent)';

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
  const organizationHref = context === 'global' ? `/organizaciones/${orgId}` : `/${gameSlug}/organizacion/${orgId}`;
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
    matchday: match.matchday ?? undefined,
  }));

  return (
    <PublicProfileShell
      entityId={competition.id}
      transitionPrefix="competition"
      accentColor={brandColor}
      bannerUrl={compBanner}
      bannerAlt={competition.name}
      logoUrl={orgLogo}
      logoAlt={orgName}
      logoFallback={<Trophy className="size-12" />}
      logoFit="contain"
      eyebrow={<><Trophy className="size-3.5" />Competencia oficial</>}
      title={competition.name}
      badge={competition.status === 'Activo' ? 'EN CURSO' : competition.status}
      description={competition.description || `Competencia oficial organizada por ${orgName}.`}
      facts={<><span><Building2 className="size-3.5" />{orgName}</span><span><Users className="size-3.5" />{competition.mode_format || '11v11'}</span><span className="is-active"><CheckCircle2 className="size-3.5" />{isPlayoff ? 'Playoff' : isHybrid ? 'Liga híbrida' : 'Liga de puntos'}</span></>}
      actions={<Link href={organizationHref}><button className="public-team-primary-action"><Building2 className="size-4" />Ver organización</button></Link>}
      metrics={[
        { value: competition.prize_pool || '—', label: 'prize pool' },
        { value: `${regCount}/${maxCount}`, label: `${percent}% de equipos inscritos` },
        { value: competition.match_mode === 'IdaVuelta' ? 'I/V' : '1', label: competition.match_mode === 'IdaVuelta' ? 'ida y vuelta' : 'partido único' },
        { value: competition.transfer_market_mode || 'ABIERTO', label: 'mercado de fichajes' },
      ]}
      tabs={<SubSubNavbar tabs={compSubSubTabs} activeTab={activeTab} onSelectTab={setActiveTab} brandColor={brandColor} />}
      contentClassName="public-competition-content pb-16"
    >
        {/* ── TAB 1: EQUIPOS CONFIRMADOS ────────────────────────────────── */}
        {activeTab === 'equipos' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black font-[family-name:var(--font-active)] text-[var(--text-heading)] uppercase tracking-tight flex items-center gap-2">
                  <Shield className="ui-dynamic-brand-ink w-6 h-6" />
                  Equipos Confirmados ({teams.length})
                </h2>
                <p className="text-xs text-[var(--text-muted)] font-[family-name:var(--font-active)] mt-1">
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
                      <span className="text-[9px] font-[family-name:var(--font-active)] font-bold px-1.5 py-0.5 rounded bg-[var(--app-contrast-soft)] border border-[var(--border-card)] text-[var(--text-secondary)] uppercase">
                        {t.team_tag}
                      </span>
                    )}
                    <h3 className="text-base font-bold text-[var(--text-heading)] group-hover:text-[var(--game-brand)] transition-colors truncate uppercase font-[family-name:var(--font-active)]">
                      {t.team_name}
                    </h3>
                    <span className="text-[10px] text-[var(--app-positive)] font-[family-name:var(--font-active)] font-bold flex items-center gap-1">
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
                    <Target className="w-4 h-4 text-[var(--app-accent-2)]" />
                    Cuadro de Eliminatoria Playoffs
                  </h3>
                </div>
                {matches.length > 0 ? (
                  <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl p-6 shadow-xl overflow-x-auto relative backdrop-blur-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--app-accent-2-soft)] rounded-full blur-[80px] pointer-events-none" />
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
              <h2 className="text-xl font-black font-[family-name:var(--font-active)] text-[var(--text-heading)] uppercase flex items-center gap-2">
                <FileText className="ui-dynamic-brand-ink w-5 h-5" />
                Reglamento & Descripción del Torneo
              </h2>

              <p className="text-sm text-[var(--text-primary)] leading-relaxed font-[family-name:var(--font-active)]">
                {competition.description || `Competencia oficial de ${gameConfig.name} administrada por ${orgName}. Todos los participantes deben respetar los estatutos del circuito y reportar resultados en tiempo y forma.`}
              </p>

              <div className="pt-6 border-t border-[var(--border-card)] space-y-4 text-xs font-[family-name:var(--font-active)]">
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
                    <p className="font-bold text-[var(--app-warning)]">Top {competition.qualifiers_per_group || 2} por Grupo</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-[var(--text-heading)] uppercase font-[family-name:var(--font-active)] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--app-accent)]" /> Fechas Clave
              </h3>

              <div className="space-y-3 text-xs font-[family-name:var(--font-active)]">
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
    </PublicProfileShell>
  );
}
