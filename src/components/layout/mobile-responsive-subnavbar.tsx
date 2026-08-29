'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { GameConfig } from '@/lib/games-data';
import { initialTeams } from '@/lib/data-store';
import type { GameSection } from '@/components/layout/game-sub-navbar';
import { PUBLIC_GAME_NAV_ITEMS } from '@/lib/section-config';
import { GameSwitcher } from '@/components/layout/game-switcher';
import {
  Gamepad2, User, Shield, Home, Trophy, Award, ArrowRightLeft, Users, UserCheck, Calendar, Star, PieChart, Database, Sparkles, Settings, FileText, BarChart2, LayoutDashboard
} from 'lucide-react';

export type MobileSubnavSegment = 'game' | 'athlete' | 'club';

interface MobileResponsiveSubnavbarProps {
  game: GameConfig;
  activeSection?: string;
  onSelectSection?: (section: GameSection) => void;
}

export function MobileResponsiveSubnavbar({ game, activeSection, onSelectSection }: MobileResponsiveSubnavbarProps) {
  const pathname = usePathname();
  const { currentUser, userTeams, isAuthenticated } = useAuth();
  const [activeSegment, setActiveSegment] = useState<MobileSubnavSegment>('game');
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeLink = linksRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    activeLink?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeSegment, pathname]);

  const roleStr = (currentUser?.role || '').toLowerCase();
  const isAdminOrOrganizer = roleStr === 'administrador' || roleStr === 'admin' || roleStr === 'organizador';

  // Check if user has team in THIS active discipline
  const teamsPool = userTeams && userTeams.length > 0 ? userTeams : initialTeams;
  const myTeam = teamsPool.find(
    (t) =>
      t.gameSlug === game.slug &&
      (t.captainName?.toLowerCase() === currentUser?.name?.toLowerCase() ||
        t.captainName?.toLowerCase() === currentUser?.gamertag?.toLowerCase() ||
        t.id === currentUser?.teamId)
  );

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

  // 2. Athlete User Options
  const athleteOptions = [
    { id: 'dashboard', label: 'Dashboard', href: `/${game.slug}/jugadores/${userId}`, icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'stats', label: 'Mis Stats', href: `/${game.slug}/stats`, icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { id: 'ofertas', label: 'Mis Ofertas', href: `/${game.slug}/ofertas`, icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'ajustes', label: 'Ajustes', href: `/${game.slug}/atleta-ajustes`, icon: <Settings className="w-3.5 h-3.5" /> },
  ];

  // 3. Club Captain Options
  const clubOptions = [
    { id: 'dashboard', label: 'Dashboard', href: myTeam ? `/${game.slug}/equipos/${myTeam.id}` : `/${game.slug}/ajustes`, icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'plantilla', label: 'Plantilla', href: `/${game.slug}/plantilla`, icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'reclutamiento', label: 'Vacantes', href: `/${game.slug}/reclutamiento`, icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'matchday', label: 'Matchday', href: `/${game.slug}/matchday`, icon: <Award className="w-3.5 h-3.5" /> },
    { id: 'ajustes', label: 'Ajustes', href: `/${game.slug}/ajustes`, icon: <Settings className="w-3.5 h-3.5" /> },
  ];
  const showSegmentSwitcher = isAuthenticated && !isAdminOrOrganizer;

  return (
    <div
      className="game-portal-mobile-nav block md:hidden w-full border-b border-[var(--border-card)] shadow-lg"
      style={{ '--game-brand': game.brandColor } as React.CSSProperties}
    >
      <div className="game-portal-mobile-game-row">
        <GameSwitcher game={game} />
        <span>Portal competitivo</span>
      </div>
      
      {/* 1. Top Mobile Segmented Controller (1 Row) */}
      {showSegmentSwitcher ? <div className="game-portal-mobile-segments flex items-center justify-around border-b border-[var(--border-card)] p-1 text-xs font-black" role="tablist" aria-label="Cambiar contexto de navegación">
        
        {/* Segment 1: JUEGO */}
        <button
          type="button"
          role="tab"
          aria-selected={activeSegment === 'game'}
          onClick={() => setActiveSegment('game')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSegment === 'game'
              ? 'game-portal-mobile-segment-active shadow-md font-black'
              : 'text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-card-hover)]'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>Juego</span>
        </button>

        {/* Segment 2: ATLETA (Users) */}
        {!isAdminOrOrganizer && isAuthenticated && (
          <button
            type="button"
            role="tab"
            aria-selected={activeSegment === 'athlete'}
            onClick={() => setActiveSegment('athlete')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeSegment === 'athlete'
                ? 'game-portal-mobile-segment-active shadow-md font-black'
                : 'text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-card-hover)]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Atleta</span>
          </button>
        )}

        {/* Segment 3: CLUB (Captains) */}
        {!isAdminOrOrganizer && isAuthenticated && myTeam && (
          <button
            type="button"
            role="tab"
            aria-selected={activeSegment === 'club'}
            onClick={() => setActiveSegment('club')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeSegment === 'club'
                ? 'game-portal-mobile-segment-active shadow-md font-black'
                : 'text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-card-hover)]'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>Club</span>
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
            const isActive = pathname === opt.href;
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
                {opt.icon}
                <span>{opt.label}</span>
              </Link>
            );
          })}

        {/* Render CLUB Options */}
        {activeSegment === 'club' &&
          clubOptions.map((opt) => {
            const isActive = pathname === opt.href;
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
                {opt.icon}
                <span>{opt.label}</span>
              </Link>
            );
          })}

      </div>
    </div>
  );
}
