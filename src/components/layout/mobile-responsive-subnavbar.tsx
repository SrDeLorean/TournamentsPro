'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { GameConfig, GAMES_CATALOG } from '@/lib/games-data';
import { initialTeams } from '@/lib/data-store';
import { Badge } from '@/components/ui/badge';
import {
  Gamepad2, User, Shield, Home, Trophy, Award, Calendar, ArrowRightLeft, Users, UserCheck, Star, PieChart, Database, Sparkles, Settings, FileText, BarChart2, LayoutDashboard
} from 'lucide-react';

export type MobileSubnavSegment = 'game' | 'athlete' | 'club';

interface MobileResponsiveSubnavbarProps {
  game: GameConfig;
  activeSection?: string;
  onSelectSection?: (section: any) => void;
}

export function MobileResponsiveSubnavbar({ game, activeSection, onSelectSection }: MobileResponsiveSubnavbarProps) {
  const pathname = usePathname();
  const { currentUser, activeGameSlug, userTeams, isAuthenticated } = useAuth();
  const [activeSegment, setActiveSegment] = useState<MobileSubnavSegment>('game');

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
  const gameSections = [
    { id: 'home', label: 'Home', href: `/${game.slug}`, icon: <Home className="w-3.5 h-3.5" /> },
    { id: 'competencias', label: 'Ligas', href: `/${game.slug}/competencias`, icon: <Trophy className="w-3.5 h-3.5" /> },
    { id: 'equipos', label: 'Equipos', href: `/${game.slug}/equipos`, icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'clasificacion', label: 'Torneos', href: `/${game.slug}/clasificacion`, icon: <Award className="w-3.5 h-3.5" /> },
    { id: 'traspasos', label: 'Fichajes', href: `/${game.slug}/traspasos`, icon: <ArrowRightLeft className="w-3.5 h-3.5" /> },
    { id: 'tops', label: 'Tops', href: `/${game.slug}/tops`, icon: <Star className="w-3.5 h-3.5" /> },
    { id: 'infografia', label: 'Stats', href: `/${game.slug}/infografia`, icon: <PieChart className="w-3.5 h-3.5" /> },
    { id: 'datos', label: 'Datos', href: `/${game.slug}/datos`, icon: <Database className="w-3.5 h-3.5" /> },
  ];

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

  return (
    <div className="block md:hidden w-full bg-slate-950 border-b border-[var(--border-card)] shadow-lg">
      
      {/* 1. Top Mobile Segmented Controller (1 Row) */}
      <div className="flex items-center justify-around border-b border-white/10 p-1 bg-slate-900/90 text-xs font-black">
        
        {/* Segment 1: JUEGO */}
        <button
          onClick={() => setActiveSegment('game')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSegment === 'game'
              ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>Juego</span>
        </button>

        {/* Segment 2: ATLETA (Users) */}
        {!isAdminOrOrganizer && isAuthenticated && (
          <button
            onClick={() => setActiveSegment('athlete')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeSegment === 'athlete'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Atleta</span>
          </button>
        )}

        {/* Segment 3: CLUB (Captains) */}
        {!isAdminOrOrganizer && isAuthenticated && myTeam && (
          <button
            onClick={() => setActiveSegment('club')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeSegment === 'club'
                ? 'bg-purple-600 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>Club</span>
          </button>
        )}

      </div>

      {/* 2. Active Segment Scrollable Options Bar */}
      <div className="py-2 px-3 flex items-center gap-1.5 overflow-x-auto scrollbar-none touch-pan-x">
        
        {/* Render JUEGO Options */}
        {activeSegment === 'game' &&
          gameSections.map((sec) => {
            const isActive = pathname === sec.href || (sec.id === 'home' && pathname === `/${game.slug}`);
            return (
              <Link
                key={sec.id}
                href={sec.href}
                onClick={() => onSelectSection && onSelectSection(sec.id)}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 border transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-black'
                    : 'bg-slate-900/80 text-slate-300 border-white/10 hover:bg-slate-800'
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
                className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 border transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-black'
                    : 'bg-cyan-950/70 text-cyan-200 border-cyan-500/40 hover:bg-cyan-900'
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
                className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 border transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md font-black'
                    : 'bg-purple-950/70 text-purple-200 border-purple-500/40 hover:bg-purple-900'
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
