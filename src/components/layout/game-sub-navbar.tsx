'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GameConfig } from '@/lib/games-data';
import { GameLogo } from '@/components/ui/game-logo';
import { useAuth } from '@/components/providers/auth-provider';
import { initialTeams, TeamData } from '@/lib/data-store';
import { UserAthleteSubnavbar } from '@/components/layout/user-athlete-subnavbar';
import { TeamClubSubnavbar } from '@/components/layout/team-club-subnavbar';
import { MobileResponsiveSubnavbar } from '@/components/layout/mobile-responsive-subnavbar';
import { ClubManagementModal } from '@/components/teams/club-management-modal';
import {
  Trophy, Award, Calendar, ArrowRightLeft, Users, UserCheck, Star, PieChart, Database, Home, ChevronLeft, ChevronRight
} from 'lucide-react';

export type GameSection =
  | 'home'
  | 'competencias'
  | 'clasificacion'
  | 'partidos'
  | 'traspasos'
  | 'equipos'
  | 'jugadores'
  | 'tops'
  | 'infografia'
  | 'datos';

interface GameSubNavbarProps {
  game: GameConfig;
  activeSection?: GameSection;
  onSelectSection?: (section: GameSection) => void;
}

export function GameSubNavbar({ game, activeSection, onSelectSection }: GameSubNavbarProps) {
  const pathname = usePathname();
  const { currentUser, isAuthenticated } = useAuth();
  const navRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const sections: { id: GameSection; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-3.5 h-3.5" /> },
    { id: 'competencias', label: 'Competencias', icon: <Trophy className="w-3.5 h-3.5" /> },
    { id: 'clasificacion', label: 'Clasificación', icon: <Award className="w-3.5 h-3.5" /> },
    { id: 'partidos', label: 'Partidos', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'traspasos', label: 'Traspasos', icon: <ArrowRightLeft className="w-3.5 h-3.5" /> },
    { id: 'equipos', label: 'Equipos', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'jugadores', label: 'Jugadores', icon: <UserCheck className="w-3.5 h-3.5" /> },
    { id: 'tops', label: 'Tops', icon: <Star className="w-3.5 h-3.5" /> },
    { id: 'infografia', label: 'Infografía', icon: <PieChart className="w-3.5 h-3.5" /> },
    { id: 'datos', label: 'Datos', icon: <Database className="w-3.5 h-3.5" /> },
  ];

  // Detect current active section from URL path if not passed explicitly
  const currentSection = activeSection || (() => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length >= 2) {
      const sectionSegment = segments[1] as GameSection;
      if (sections.some((s) => s.id === sectionSegment)) {
        return sectionSegment;
      }
    }
    return 'home';
  })();

  const checkScroll = () => {
    if (navRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

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

      {/* 💻 DESKTOP 4-TIER SUBNAVBAR STACK (>= md) */}
      <div className="hidden md:block">
        {/* 🎮 SUB-NAVBAR NIVEL 2: SECCIONES DEL JUEGO */}
        <div
          className="w-full bg-[var(--bg-card)] border-b border-[var(--border-card)] backdrop-blur-xl z-40 transition-all duration-300 shadow-md"
          style={{
            background: `linear-gradient(to right, color-mix(in srgb, ${game.brandColor} 15%, var(--bg-card)), var(--bg-card))`,
          }}
        >
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 h-11 flex items-center justify-between gap-2 relative">
            {/* Game Identifier Badge on Left */}
            <div className="flex items-center gap-1.5 flex-shrink-0 z-10 bg-inherit pr-1">
              <GameLogo game={game} size="sm" />
              <span
                className="font-display font-black text-xs uppercase tracking-wider hidden md:inline-block"
                style={{ color: game.brandColor }}
              >
                {game.name} PORTAL
              </span>
              <div
                className="w-px h-4 mx-1 hidden md:block"
                style={{ backgroundColor: `${game.brandColor}40` }}
              />
            </div>

            {/* Scroll Left Arrow Indicator */}
            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                className="p-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--accent-cyan)] shadow-md hover:scale-110 transition-all flex-shrink-0 z-10"
                aria-label="Desplazar a la izquierda"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}

            {/* 10 Navigation Items Container with Next.js Links */}
            <div
              ref={navRef}
              onScroll={checkScroll}
              className="flex items-center gap-1 overflow-x-auto scrollbar-none scroll-smooth h-full py-1 w-full touch-pan-x"
            >
              {sections.map((sec) => {
                const isActive = currentSection === sec.id;
                const href = sec.id === 'home' ? `/${game.slug}` : `/${game.slug}/${sec.id}`;

                return (
                  <Link
                    key={sec.id}
                    href={href}
                    onClick={(e) => {
                      if (onSelectSection) {
                        onSelectSection(sec.id);
                      }
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 border ${
                      isActive
                        ? 'shadow-md scale-102 font-extrabold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-card-hover)] border-transparent'
                    }`}
                    style={
                      isActive
                        ? {
                            backgroundColor: `color-mix(in srgb, ${game.brandColor} 30%, var(--bg-card))`,
                            borderColor: game.brandColor,
                            color: game.brandColor,
                            boxShadow: `0 2px 10px color-mix(in srgb, ${game.brandColor} 25%, transparent)`,
                          }
                        : {}
                    }
                  >
                    <span style={{ color: isActive ? game.brandColor : undefined }}>{sec.icon}</span>
                    <span>{sec.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Scroll Right Arrow Indicator */}
            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                className="p-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--accent-cyan)] shadow-md hover:scale-110 transition-all flex-shrink-0 z-10"
                aria-label="Desplazar a la derecha"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 👤 SUB-NAVBAR NIVEL 3: OPCIONES DEL USUARIO / ATLETA */}
        {isAuthenticated && <UserAthleteSubnavbar />}

        {/* 🛡️ SUB-NAVBAR NIVEL 4: OPCIONES DEL EQUIPO / CLUB */}
        {isAuthenticated && <TeamClubSubnavbar />}
      </div>
    </>
  );
}
