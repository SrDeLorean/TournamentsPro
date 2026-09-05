'use client';

import React, { useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GameConfig } from '@/lib/games-data';
import { shouldBypassImageOptimization } from '@/lib/image-utils';
import { SubSubNavbar, SubSubTabOption } from '@/components/layout/sub-sub-navbar';
import { PublicProfileShell } from '@/components/public/public-profile-shell';
import {
  Building2, Trophy, Shield, ArrowLeft, Gamepad2, Award,
  Globe, Star, ExternalLink, UserCheck, Activity, Mail, MapPin, BarChart2,
  CalendarDays, CheckCircle2, Link2, Radio, Users
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
  prize_pool?: string | null;
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
  logo_url?: string | null;
  rating?: string;
  player_count?: number;
  banner_url?: string | null;
  description?: string | null;
  country?: string;
  platform?: string;
  status?: string;
}

export interface OrgMatch {
  id: string;
  competition_id?: string | null;
  competition_name?: string;
  home_team_name?: string | null;
  home_team_tag?: string | null;
  home_logo?: string | null;
  away_team_name?: string | null;
  away_team_tag?: string | null;
  away_logo?: string | null;
  score_home?: number | null;
  score_away?: number | null;
  status?: string;
  scheduled_at?: string | null;
  matchday?: number | null;
  round_name?: string | null;
}

interface OrganizationProfileViewProps {
  gameSlug: string;
  gameConfig: GameConfig;
  org: OrgProfileData;
  competitions: CompetitionData[];
  organizers: OrganizerUser[];
  teams: AffiliatedTeam[];
  matches: OrgMatch[];
  context?: 'global' | 'game';
}

function normalizeExternalHref(value: string, platform = 'website') {
  if (/^https?:\/\//i.test(value)) return value;

  const handle = value.replace(/^@/, '').trim();
  const normalizedPlatform = platform.toLowerCase();
  if (normalizedPlatform.includes('instagram')) return `https://instagram.com/${handle}`;
  if (normalizedPlatform === 'x' || normalizedPlatform.includes('twitter')) return `https://x.com/${handle}`;
  if (normalizedPlatform.includes('tiktok')) return `https://tiktok.com/@${handle}`;
  if (normalizedPlatform.includes('whatsapp')) return `https://wa.me/${handle.replace(/\D/g, '')}`;
  return `https://${handle}`;
}

function ProfileSectionHeader({ icon, title, description, count }: {
  icon: ReactNode;
  title: string;
  description: string;
  count?: string;
}) {
  return (
    <header className="org-profile-section-heading">
      <div className="org-profile-section-heading-copy">
        <span className="org-profile-section-icon" aria-hidden="true">{icon}</span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {count ? <span className="org-profile-section-count">{count}</span> : null}
    </header>
  );
}

function ProfileEmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="org-profile-empty">
      <span aria-hidden="true">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export function OrganizationProfileView({
  gameSlug,
  gameConfig,
  org,
  competitions = [],
  organizers = [],
  teams = [],
  matches = [],
  context = 'game',
}: OrganizationProfileViewProps) {
  const [activeTab, setActiveTab] = useState<OrgTab>('competencias');
  const brandColor = gameConfig?.brandColor || 'var(--app-accent)';

  const orgSubSubTabs: SubSubTabOption<OrgTab>[] = [
    { id: 'competencias', label: 'Torneos & Ligas', icon: <Trophy className="w-3.5 h-3.5" />, badge: competitions.length },
    { id: 'organizadores', label: 'Staff & Organizadores', icon: <UserCheck className="w-3.5 h-3.5" />, badge: organizers.length },
    { id: 'clubes', label: 'Clubes Afiliados', icon: <Shield className="w-3.5 h-3.5" />, badge: teams.length },
    { id: 'clasificacion', label: 'Clasificación', icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { id: 'partidos', label: 'Matchday & Encuentros', icon: <Activity className="w-3.5 h-3.5" />, badge: matches.length },
    { id: 'info', label: 'Información & Reglas', icon: <Building2 className="w-3.5 h-3.5" /> },
  ];

  const orgBanner = org.bannerUrl?.trim() || gameConfig.bannerUrl || '/images/default/banner-default.jpg';
  const orgLogo = org.logoUrl?.trim() || '/images/default/logo-default.png';
  const ratingVal = org.rating || '4.98';
  const countryVal = org.country || 'Global';
  const foundedVal = org.foundedYear || '2022';
  const isVerified = ['activa', 'activo', 'active', 'verificada', 'verified'].includes((org.status || '').toLowerCase());
  const activeCompetitions = competitions.filter((competition) => ['activo', 'en curso', 'active'].includes(competition.status.toLowerCase())).length;
  const liveMatches = matches.filter((match) => ['en_vivo', 'live'].includes((match.status || '').toLowerCase())).length;
  const socialEntries = Object.entries(org.socialMedia || {}).filter((entry): entry is [string, string] => Boolean(entry[1]?.trim()));
  const directoryHref = context === 'global' ? '/organizaciones' : `/${gameSlug}/organizaciones`;
  const organizationBaseHref = context === 'global' ? `/organizaciones/${org.id}` : `/${gameSlug}/organizacion/${org.id}`;
  const teamBaseHref = context === 'global' ? '/equipos' : `/${gameSlug}/equipos`;

  return (
    <PublicProfileShell
      entityId={org.id}
      transitionPrefix="organization"
      accentColor={brandColor}
      bannerUrl={orgBanner}
      bannerAlt={`Banner de ${org.name}`}
      logoUrl={orgLogo}
      logoAlt={`Logo de ${org.name}`}
      logoFallback={<Building2 className="size-12" />}
      logoFit="contain"
      eyebrow={<>{isVerified ? <><CheckCircle2 className="size-3.5" />Organización verificada</> : <><Radio className="size-3.5" />Portal oficial</>}</>}
      title={org.name}
      badge={org.tag || countryVal}
      description={org.description || `Comunidad oficial y sede de torneos eSports activa en el circuito competitivo de ${gameConfig.name}.`}
      facts={<><span><MapPin className="size-3.5" />{countryVal}</span><span><Gamepad2 className="size-3.5" />{gameConfig.name}</span><span className="is-active"><CheckCircle2 className="size-3.5" />{org.status || 'Activa'}</span></>}
      actions={<>
            {org.website && (
              <a
                href={normalizeExternalHref(org.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="public-team-primary-action"
              >
                <Globe className="size-4" /> Sitio oficial <ExternalLink className="size-3.5" />
              </a>
            )}
      </>}
      metrics={[
        { value: competitions.length, label: `${activeCompetitions} competencias activas` },
        { value: teams.length, label: 'clubes afiliados' },
        { value: organizers.length, label: 'organizadores' },
        { value: matches.length, label: `${liveMatches} partidos en vivo` },
        { value: ratingVal, label: 'prestigio oficial' },
      ]}
      tabs={<SubSubNavbar tabs={orgSubSubTabs} activeTab={activeTab} onSelectTab={setActiveTab} brandColor={brandColor} />}
      contentClassName="org-profile-content pb-16"
    >
        {/* ── TAB 1: TORNEOS & LIGAS ─────────────────────────────────── */}
        {activeTab === 'competencias' && (
          <div className="space-y-6">
            <ProfileSectionHeader
              icon={<Trophy className="size-5" />}
              title={`Torneos & competencias de ${org.name}`}
              description="Circuito oficial de ligas, copas y eliminatorias administradas por la comunidad."
              count={`${competitions.length} REGISTRADA${competitions.length !== 1 ? 'S' : ''}`}
            />

            <div className="game-directory-grid">
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
                    entityType="competition"
                    gameSlug={comp.game_slug || gameSlug}
                    href={`${organizationBaseHref}/competencias/${comp.id}`}
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
                      { icon: <Award className="w-3.5 h-3.5 text-[var(--app-warning)]" />, label: 'Prize Pool', value: comp.prize_pool || 'Por Definir', highlight: true },
                      { icon: <Shield className="w-3.5 h-3.5 text-[var(--app-positive)]" />, label: 'Mercado', value: comp.transfer_market_mode || 'ABIERTO' },
                    ]}
                    progress={{
                      label: 'EQUIPOS REGISTRADOS',
                      current: regCount,
                      max: maxCount,
                    }}
                    footerLeft={
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <Activity className="ui-dynamic-brand-ink w-3.5 h-3.5" />
                        <span>{comp.total_matches || 0} Partidos</span>
                      </span>
                    }
                    actionText="EXPLORAR FIXTURE"
                    animationDelay={index * 60}
                  />
                );
              })}

              {competitions.length === 0 && (
                <ProfileEmptyState
                  icon={<Trophy className="size-10" />}
                  title="No hay torneos activos publicables"
                  description={`Esta organización no posee torneos o ligas públicas registradas actualmente para ${gameConfig.name}.`}
                />
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: STAFF & ORGANIZADORES ────────────────────────────── */}
        {activeTab === 'organizadores' && (
          <div className="space-y-6">
            <ProfileSectionHeader
              icon={<UserCheck className="size-5" />}
              title="Staff & organizadores oficiales"
              description={`Personal verificado que administra salas, fixtures y decisiones en ${org.name}.`}
              count={`${organizers.length} MIEMBRO${organizers.length !== 1 ? 'S' : ''}`}
            />

            <div className="org-profile-staff-grid">
              {organizers.map((orgUser) => (
                <article key={orgUser.id} className="org-profile-staff-card">
                  <div className="org-profile-staff-avatar">
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
                      <UserCheck className="size-7" />
                    )}
                  </div>

                  <div className="org-profile-staff-copy">
                    <span><CheckCircle2 className="size-3" /> {orgUser.role || 'Organizador'}</span>
                    <h3>{orgUser.gamertag || orgUser.name}</h3>
                    <p>{orgUser.name}{orgUser.country ? ` · ${orgUser.country}` : ''}</p>
                    {orgUser.email && (
                      <a href={`mailto:${orgUser.email}`}>
                        <Mail className="size-3.5" />
                        {orgUser.email}
                      </a>
                    )}
                  </div>
                </article>
              ))}

              {organizers.length === 0 && (
                <ProfileEmptyState icon={<UserCheck className="size-10" />} title="No hay organizadores asignados" description="Los organizadores oficiales asociados a esta organización aparecerán listados aquí." />
              )}
            </div>
          </div>
        )}

        {/* ── TAB 3: CLUBES AFILIADOS ─────────────────────────────────── */}
        {activeTab === 'clubes' && (
          <div className="space-y-6">
            <ProfileSectionHeader
              icon={<Shield className="size-5" />}
              title="Clubes & escuadras registradas"
              description={`Equipos inscritos bajo la cobertura de la organización en ${gameConfig.name}.`}
              count={`${teams.length} CLUB${teams.length !== 1 ? 'ES' : ''}`}
            />

            <div className="game-directory-grid">
              {teams.map((team, index) => (
                <EsportsCard
                  key={team.id}
                  href={`${teamBaseHref}/${team.id}`}
                  entityType="team"
                  gameSlug={gameSlug}
                  title={team.name}
                  subtitle={`${gameConfig.name} · ${team.platform || 'CROSSPLAY'}`}
                  description={team.description || `Escuadra afiliada oficialmente a ${org.name}.`}
                  bannerUrl={team.banner_url || orgBanner}
                  logoUrl={team.logo_url || orgLogo}
                  tag={team.tag || 'CLUB'}
                  country={team.country || countryVal}
                  badges={[{ text: team.status || 'AFILIADO', variant: 'emerald' }]}
                  stats={[
                    { icon: <Users className="size-3.5" />, label: 'Plantilla', value: `${team.player_count || 0} atletas` },
                    { icon: <Star className="size-3.5" />, label: 'Rating', value: team.rating || '4.9', highlight: true },
                  ]}
                  footerLeft={<span className="flex items-center gap-1.5"><Shield className="size-3.5" /> {org.tag || org.name}</span>}
                  actionText="VER CLUB"
                  animationDelay={index * 60}
                />
              ))}

              {teams.length === 0 && (
                <ProfileEmptyState icon={<Shield className="size-10" />} title="No hay clubes registrados" description="Las escuadras que disputen los torneos de esta comunidad se desglosarán en esta sección." />
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

        {/* ── TAB 6: INFORMACIÓN & REGLAS ─────────────────────────────── */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            <ProfileSectionHeader
              icon={<Building2 className="size-5" />}
              title={`Acerca de ${org.name}`}
              description="Identidad institucional, disciplinas autorizadas y datos públicos de la organización."
              count={isVerified ? 'PERFIL VERIFICADO' : 'PERFIL PÚBLICO'}
            />
            <div className="org-profile-info-grid">
              <article className="org-profile-info-main">
                <span className="org-profile-info-kicker"><Link2 className="size-3.5" /> PERFIL INSTITUCIONAL</span>
                <p>
                {org.description || `Organización eSports dedicada a la creación, gestión y desarrollo de competencias profesionales en ${gameConfig.name}.`}
                </p>

                <div className="org-profile-disciplines">
                  <h3>Disciplinas autorizadas</h3>
                  <div>
                    {(org.allowedGames || [gameSlug]).map((game) => (
                      <span key={game}><Gamepad2 className="size-3.5" /> {game.toUpperCase()}</span>
                    ))}
                  </div>
                </div>
              </article>

              <aside className="org-profile-prestige-card">
                <h3><Shield className="size-4" /> Ficha de prestigio</h3>

                <div className="org-profile-facts">
                  <div><span><Radio className="size-3.5" /> Estado</span><strong>{org.status || 'Activa'}</strong></div>
                  <div><span><MapPin className="size-3.5" /> País sede</span><strong>{countryVal}</strong></div>
                  <div><span><CalendarDays className="size-3.5" /> Fundación</span><strong>{foundedVal}</strong></div>
                  <div><span><Star className="size-3.5" /> Rating</span><strong>★ {ratingVal}</strong></div>
                </div>
              </aside>
            </div>
          </div>
        )}
    </PublicProfileShell>
  );
}
