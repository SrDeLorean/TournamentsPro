'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { GameConfig } from '@/lib/games-data';
import { initialTeams } from '@/lib/data-store';
import { CreateTeamModal } from '@/components/teams/create-team-modal';
import type { GameSection } from '@/components/layout/game-sub-navbar';
import { PUBLIC_GAME_NAV_ITEMS } from '@/lib/section-config';
import {
  findManagedTeamForUser,
  getAthleteNavigation,
  getClubNavigation,
  isAuthenticatedNavItemActive,
  type AuthenticatedNavItemId,
} from '@/lib/authenticated-navigation';
import {
  Gamepad2, User, Shield, Home, Trophy, Award, ArrowRightLeft, Users, UserCheck, Calendar, Star, PieChart, Database, Sparkles, Settings, FileText, BarChart2, LayoutDashboard, MessageSquare, History, BriefcaseBusiness, Activity, Plus
} from 'lucide-react';

export type MobileSubnavSegment = 'game' | 'athlete' | 'club';

interface MobileResponsiveSubnavbarProps {
  game: GameConfig;
  activeSection?: string;
  onSelectSection?: (section: GameSection) => void;
}

export function MobileResponsiveSubnavbar({ game, activeSection, onSelectSection }: MobileResponsiveSubnavbarProps) {
  const pathname = usePathname();
  const { currentUser, userTeams, isAuthenticated, refetchTeams } = useAuth();
  const [preferredSegment, setPreferredSegment] = useState<MobileSubnavSegment>('game');
  const [isCreateClubOpen, setIsCreateClubOpen] = useState(false);
  const routeSegment: MobileSubnavSegment | null = pathname.startsWith(`/${game.slug}/atleta`)
    ? 'athlete'
    : pathname.startsWith(`/${game.slug}/club`)
      ? 'club'
      : null;
  const activeSegment = routeSegment ?? preferredSegment;
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const container = linksRef.current;
      const activeLink = container?.querySelector<HTMLElement>('[data-active="true"]');
      if (!container || !activeLink || container.clientWidth === 0) return;
      const centeredLeft = activeLink.offsetLeft - (container.clientWidth - activeLink.offsetWidth) / 2;
      container.scrollTo({ left: Math.max(0, centeredLeft), behavior: 'smooth' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeSegment, pathname]);

  const roleStr = (currentUser?.role || '').toLowerCase();
  const isAdminOrOrganizer = roleStr === 'administrador' || roleStr === 'admin' || roleStr === 'organizador';

  // Check if user has team in THIS active discipline
  const teamsPool = userTeams && userTeams.length > 0 ? userTeams : initialTeams;
  const myTeam = findManagedTeamForUser(teamsPool, currentUser, game.slug);

  // 1. Game Sections
  const gameSectionIcons: Record<(typeof PUBLIC_GAME_NAV_ITEMS)[number]['id'], React.ReactNode> = {
    home: <Home className="w-3.5 h-3.5" />,
    organizaciones: <Users className="w-3.5 h-3.5" />,
    competencias: <Trophy className="w-3.5 h-3.5" />,
    clasificacion: <Award className="w-3.5 h-3.5" />,
    partidos: <Calendar className="w-3.5 h-3.5" />,
    traspasos: <ArrowRightLeft className="w-3.5 h-3.5" />,
    equipos: <Users className="w-3.5 h-3.5" />,
    jugadores: <UserCheck className="w-3.5 h-3.5" />,
    tops: <Star className="w-3.5 h-3.5" />,
    infografia: <PieChart className="w-3.5 h-3.5" />,
    datos: <Database className="w-3.5 h-3.5" />,
  };
  const gameSections = PUBLIC_GAME_NAV_ITEMS.map((section) => ({
    ...section,
    href: section.id === 'home' ? `/${game.slug}` : `/${game.slug}/${section.id}`,
    icon: gameSectionIcons[section.id],
  }));

  const userId = currentUser?.id || 'usr-1784762163316';

  const authenticatedIcons: Record<AuthenticatedNavItemId, React.ReactNode> = {
    'athlete-dashboard': <LayoutDashboard className="w-3.5 h-3.5" />,
    profile: <User className="w-3.5 h-3.5" />,
    stats: <BarChart2 className="w-3.5 h-3.5" />,
    offers: <FileText className="w-3.5 h-3.5" />,
    teams: <BriefcaseBusiness className="w-3.5 h-3.5" />,
    'athlete-history': <History className="w-3.5 h-3.5" />,
    messages: <MessageSquare className="w-3.5 h-3.5" />,
    'athlete-settings': <Settings className="w-3.5 h-3.5" />,
    'club-dashboard': <LayoutDashboard className="w-3.5 h-3.5" />,
    'club-profile': <Shield className="w-3.5 h-3.5" />,
    roster: <Users className="w-3.5 h-3.5" />,
    recruitment: <Sparkles className="w-3.5 h-3.5" />,
    matchday: <Award className="w-3.5 h-3.5" />,
    'club-stats': <Activity className="w-3.5 h-3.5" />,
    'club-history': <History className="w-3.5 h-3.5" />,
    'club-messages': <MessageSquare className="w-3.5 h-3.5" />,
    'club-settings': <Settings className="w-3.5 h-3.5" />,
  };
  const athleteOptions = getAthleteNavigation(game.slug, userId);
  const clubOptions = myTeam ? getClubNavigation(game.slug, myTeam.id) : [];
  const showSegmentSwitcher = isAuthenticated && !isAdminOrOrganizer;

  return (
    <div
      className="game-portal-mobile-nav block md:hidden w-full border-b border-[var(--border-card)] shadow-lg"
      style={{ '--game-brand': game.brandColor } as React.CSSProperties}
    >
      {/* 1. Top Mobile Segmented Controller (1 Row) */}
      {showSegmentSwitcher ? <div className="game-portal-mobile-segments flex items-center justify-around border-b border-[var(--border-card)] p-1 text-xs font-black" role="tablist" aria-label="Cambiar contexto de navegación">
        
        {/* Segment 1: JUEGO */}
        <Link
          href={`/${game.slug}`}
          role="tab"
          aria-selected={activeSegment === 'game'}
          onClick={() => setPreferredSegment('game')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSegment === 'game'
              ? 'game-portal-mobile-segment-active shadow-md font-black'
              : 'text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-card-hover)]'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>Juego</span>
        </Link>

        {/* Segment 2: ATLETA (Users) */}
        {!isAdminOrOrganizer && isAuthenticated && (
          <Link
            href={`/${game.slug}/atleta`}
            role="tab"
            aria-selected={activeSegment === 'athlete'}
            onClick={() => setPreferredSegment('athlete')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeSegment === 'athlete'
                ? 'game-portal-mobile-segment-active shadow-md font-black'
                : 'text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-card-hover)]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Atleta</span>
          </Link>
        )}

        {/* Segment 3: CLUB (Captains) */}
        {!isAdminOrOrganizer && isAuthenticated && myTeam && (
          <Link
            href={`/${game.slug}/club`}
            role="tab"
            aria-selected={activeSegment === 'club'}
            onClick={() => setPreferredSegment('club')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeSegment === 'club'
                ? 'game-portal-mobile-segment-active shadow-md font-black'
                : 'text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-card-hover)]'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>Club</span>
          </Link>
        )}
        {!isAdminOrOrganizer && isAuthenticated && !myTeam && (
          <button
            type="button"
            onClick={() => setIsCreateClubOpen(true)}
            className="game-portal-mobile-create-club flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5"
            aria-label={`Crear club en ${game.name}`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear club</span>
          </button>
        )}
      </div> : null}

      {/* 2. Active Segment Scrollable Options Bar */}
      <div ref={linksRef} className="game-portal-mobile-links mobile-scroll-row py-2 px-3 flex items-center gap-1.5 overflow-x-auto touch-pan-x" aria-label="Secciones del portal">
        
        {/* Render JUEGO Options */}
        {(activeSegment === 'game' || !showSegmentSwitcher) &&
          gameSections.map((sec) => {
            const isActive = activeSection === sec.id || pathname === sec.href || (sec.id === 'home' && pathname === `/${game.slug}`);
            return (
              <Link
                key={sec.id}
                href={sec.href}
                data-active={isActive}
                onClick={() => onSelectSection && onSelectSection(sec.id as GameSection)}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 border transition-all ${
                  isActive
                    ? 'game-portal-mobile-link-active shadow-md font-black'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-card)] hover:bg-[var(--bg-card-hover)]'
                }`}
              >
                {sec.icon}
                <span>{sec.label}</span>
              </Link>
            );
          })}

        {/* Render ATLETA Options */}
        {activeSegment === 'athlete' &&
          athleteOptions.map((opt) => {
            const isActive = isAuthenticatedNavItemActive(pathname, opt);
            return (
              <Link
                key={opt.id}
                href={opt.href}
                data-active={isActive}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 border transition-all ${
                  isActive
                    ? 'game-portal-mobile-link-active shadow-md font-black'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-card)] hover:bg-[var(--bg-card-hover)]'
                }`}
              >
                {authenticatedIcons[opt.id]}
                <span>{opt.shortLabel}</span>
              </Link>
            );
          })}

        {/* Render CLUB Options */}
        {activeSegment === 'club' &&
          clubOptions.map((opt) => {
            const isActive = isAuthenticatedNavItemActive(pathname, opt);
            return (
              <Link
                key={opt.id}
                href={opt.href}
                data-active={isActive}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 border transition-all ${
                  isActive
                    ? 'game-portal-mobile-link-active shadow-md font-black'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-card)] hover:bg-[var(--bg-card-hover)]'
                }`}
              >
                {authenticatedIcons[opt.id]}
                <span>{opt.shortLabel}</span>
              </Link>
            );
          })}

      </div>
      <CreateTeamModal
        isOpen={isCreateClubOpen}
        onClose={() => setIsCreateClubOpen(false)}
        defaultGameSlug={game.slug}
        onSuccess={() => refetchTeams()}
      />
    </div>
  );
}
