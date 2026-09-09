'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GameConfig } from '@/lib/games-data';
import { GameSwitcher } from '@/components/layout/game-switcher';
import { useAuth } from '@/components/providers/auth-provider';
import { AuthenticatedContextSubnavbar } from '@/components/layout/authenticated-context-subnavbar';
import { MobileResponsiveSubnavbar } from '@/components/layout/mobile-responsive-subnavbar';
import { PUBLIC_GAME_NAV_ITEMS } from '@/lib/section-config';
import {
  Trophy, Award, Calendar, ArrowRightLeft, Users, UserCheck, Star, PieChart, Database, Home, ChevronLeft, ChevronRight
} from 'lucide-react';

export type GameSection =
  | 'home'
  | 'organizaciones'
  | 'competencias'
  | 'clasificacion'
  | 'partidos'
  | 'traspasos'
  | 'equipos'
  | 'jugadores'
  | 'tops'
  | 'infografia'
  | 'datos'
  | 'UI';

interface GameSubNavbarProps {
  game: GameConfig;
  activeSection?: GameSection;
  onSelectSection?: (section: GameSection) => void;
}

export function GameSubNavbar({ game, activeSection, onSelectSection }: GameSubNavbarProps) {
  const pathname = usePathname();
  const { currentUser, isAuthenticated } = useAuth();
  const navRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const sectionIcons: Record<(typeof PUBLIC_GAME_NAV_ITEMS)[number]['id'], React.ReactNode> = {
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
  const sections = PUBLIC_GAME_NAV_ITEMS.map((section) => ({ ...section, icon: sectionIcons[section.id] }));

  // Detect current active section from URL path if not passed explicitly
  const currentSection = activeSection || (() => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length >= 2) {
      const aliases: Partial<Record<string, GameSection>> = {
        organizacion: 'organizaciones',
        usuarios: 'jugadores',
        usuario: 'jugadores',
      };
      const sectionSegment = aliases[segments[1]] || segments[1] as GameSection;
      if (sections.some((s) => s.id === sectionSegment)) {
        return sectionSegment;
      }
    }
    return 'home';
  })();

  const checkScroll = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;

    const { scrollLeft, scrollWidth, clientWidth } = nav;
    const nextCanScrollLeft = scrollLeft > 4;
    const nextCanScrollRight = scrollLeft < scrollWidth - clientWidth - 4;
    setCanScrollLeft((current) => current === nextCanScrollLeft ? current : nextCanScrollLeft);
    setCanScrollRight((current) => current === nextCanScrollRight ? current : nextCanScrollRight);
  }, []);

  useEffect(() => {
    checkScroll();
    const observer = new ResizeObserver(checkScroll);
    if (navRef.current) observer.observe(navRef.current);
    return () => observer.disconnect();
  }, [checkScroll]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const nav = navRef.current;
      const activeLink = nav?.querySelector<HTMLElement>('[data-active="true"]');
      if (!nav || !activeLink || nav.clientWidth === 0) return;

      const centeredLeft = activeLink.offsetLeft - (nav.clientWidth - activeLink.offsetWidth) / 2;
      nav.scrollTo({ left: Math.max(0, centeredLeft), behavior: 'smooth' });
      checkScroll();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [checkScroll, currentSection]);

  const scroll = (direction: 'left' | 'right') => {
    if (navRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      navRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* 📱 MOBILE RESPONSIVE UNIFIED SUBNAVBAR (< md) */}
      <MobileResponsiveSubnavbar game={game} activeSection={currentSection} onSelectSection={onSelectSection} />

      {/* Desktop: competition navigation + one contextual workspace */}
      <div className="game-portal-navigation hidden md:block">
        {/* 🎮 SUB-NAVBAR NIVEL 2: SECCIONES DEL JUEGO */}
        <div
          className="game-portal-navbar ui-navigation-tier w-full z-40"
        >
          <div className="game-portal-navbar-frame ui-navigation-frame h-11 gap-1.5 sm:gap-2">
            {/* Game Identifier Badge on Left */}
            <div className="flex items-center gap-1.5 flex-shrink-0 z-20 bg-inherit pr-1">
              <GameSwitcher game={game} compact />
              <div
                className="w-px h-4 mx-1 hidden md:block"
                style={{ backgroundColor: `${game.brandColor}40` }}
              />
            </div>

            {/* Scroll Left Arrow Indicator */}
            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                type="button"
                className="game-portal-scroll-button ui-navigation-icon-button"
                aria-label="Desplazar a la izquierda"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}

            {/* 10 Navigation Items Container with Next.js Links */}
            <nav
              ref={navRef}
              onScroll={checkScroll}
              className="game-portal-desktop-links scrollbar-none"
              aria-label={`Secciones de ${game.name}`}
            >
              {sections.map((sec) => {
                const isActive = currentSection === sec.id;
                const href = sec.id === 'home' ? `/${game.slug}` : `/${game.slug}/${sec.id}`;

                return (
                  <Link
                    key={sec.id}
                    href={href}
                    data-active={isActive}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={(event) => {
                      if (onSelectSection) {
                        event.preventDefault();
                        onSelectSection(sec.id);
                      }
                    }}
                    className={`ui-navigation-link ui-navigation-link-compact ${
                      isActive
                        ? 'game-portal-nav-item-active shadow-md font-extrabold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-card-hover)] border-transparent'
                    }`}
                  >
                    <span style={{ color: isActive ? game.brandColor : undefined }}>{sec.icon}</span>
                    <span>{sec.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Scroll Right Arrow Indicator */}
            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                type="button"
                className="game-portal-scroll-button ui-navigation-icon-button"
                aria-label="Desplazar a la derecha"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Only one user workspace is visible at a time (Atleta or Club). */}
        {(isAuthenticated || Boolean(currentUser)) && 
         currentUser?.role && 
         !['organizador', 'administrador', 'admin'].includes(currentUser.role.toLowerCase()) && (
          <AuthenticatedContextSubnavbar gameSlug={game.slug} />
        )}
      </div>
    </>
  );
}
