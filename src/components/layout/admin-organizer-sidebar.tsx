'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import {
  Shield, Users, LayoutDashboard, Calendar, Award, ArrowRightLeft, CheckCircle2, Menu, X, Gamepad2, Swords, Globe, Home, Star, PieChart, Database, Target, Building2, MessageSquare, Ban
} from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games-data';

export function AdminOrganizerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, activeGameSlug, setActiveGameSlug } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const roleStr = (currentUser?.role || '').toLowerCase();
  const isAdmin = roleStr === 'administrador' || roleStr === 'admin';
  const isOrganizer = roleStr === 'organizador';

  // Do not render sidebar for regular players/captains
  if (!isAdmin && !isOrganizer) {
    return null;
  }

  const currentGameObj = GAMES_CATALOG[activeGameSlug] || GAMES_CATALOG['eafc26'];

  // Admin Sidebar Nav Items — 1. GESTIÓN GLOBAL
  const globalNavItems = [
    {
      title: 'Dashboard Global',
      href: '/dashboard',
      icon: <LayoutDashboard className="w-4 h-4 text-cyan-400" />,
      badge: 'Stats',
    },
    {
      title: 'Gestión Organizaciones',
      href: '/organizaciones',
      icon: <Building2 className="w-4 h-4 text-emerald-400" />,
      badge: 'Orgs.',
    },
    {
      title: 'Gestión de Competencias',
      href: '/dashboard/competencias',
      icon: <Swords className="w-4 h-4 text-purple-400" />,
      badge: 'Ligas',
    },
    {
      title: 'Usuarios / Atletas',
      href: '/usuarios',
      icon: <Users className="w-4 h-4 text-emerald-400" />,
      badge: 'Directorio',
    },
    {
      title: 'Equipos / Clubes',
      href: '/equipos',
      icon: <Shield className="w-4 h-4 text-amber-400" />,
      badge: 'Escuadras',
    },
    {
      title: 'Reportar Encuentros',
      href: '/matchday',
      icon: <CheckCircle2 className="w-4 h-4 text-rose-400" />,
      badge: 'Matchday',
    },
    {
      title: 'Moderación & Chat Global',
      href: '/moderacion',
      icon: <MessageSquare className="w-4 h-4 text-orange-400" />,
      badge: 'Bans/Chat',
    },
  ];

  // 2. GESTIÓN POR DISCIPLINA (Rutas públicas especializadas del submenú de la disciplina activa)
  const disciplineNavItems = [
    {
      title: `Portada (${currentGameObj.name})`,
      href: `/${activeGameSlug}`,
      icon: <Home className="w-4 h-4 text-slate-300" />,
      badge: 'Home',
    },
    {
      title: 'Torneos',
      href: `/${activeGameSlug}/organizaciones`,
      icon: <Target className="w-4 h-4 text-yellow-400" />,
      badge: 'Ligas',
    },
    {
      title: `Clasificación`,
      href: `/${activeGameSlug}/clasificacion`,
      icon: <Award className="w-4 h-4 text-purple-400" />,
      badge: 'Tabla',
    },
    {
      title: `Partidos / Fixture`,
      href: `/${activeGameSlug}/partidos`,
      icon: <Calendar className="w-4 h-4 text-emerald-400" />,
      badge: 'Partidos',
    },
    {
      title: `Traspasos & Fichajes`,
      href: `/${activeGameSlug}/traspasos`,
      icon: <ArrowRightLeft className="w-4 h-4 text-rose-400" />,
      badge: 'Fichajes',
    },
    {
      title: `Equipos & Clubes`,
      href: `/${activeGameSlug}/equipos`,
      icon: <Shield className="w-4 h-4 text-amber-400" />,
      badge: 'Clubes',
    },
    {
      title: `Jugadores`,
      href: `/${activeGameSlug}/jugadores`,
      icon: <Users className="w-4 h-4 text-cyan-400" />,
      badge: 'Atletas',
    },
    {
      title: `Tops & Rankings`,
      href: `/${activeGameSlug}/tops`,
      icon: <Star className="w-4 h-4 text-amber-300" />,
      badge: 'Tops',
    },
    {
      title: `Infografía & Stats`,
      href: `/${activeGameSlug}/infografia`,
      icon: <PieChart className="w-4 h-4 text-cyan-300" />,
      badge: 'Stats',
    },
    {
      title: `Datos & Ficha Técnica`,
      href: `/${activeGameSlug}/datos`,
      icon: <Database className="w-4 h-4 text-slate-400" />,
      badge: 'Datos',
    },
  ];

  return (
    <>
      {/* Mobile Toggle Bar */}
      <div className="md:hidden sticky top-14 z-40 bg-slate-950/90 border-b border-[var(--border-card)] p-2.5 flex items-center justify-between gap-2 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-2">
          <Badge variant={isAdmin ? 'cyan' : 'emerald'} className="text-[10px] uppercase font-bold">
            {isAdmin ? '🛡️ PANEL ADMIN' : '🏆 PANEL ORGANIZADOR'}
          </Badge>
          <span className="text-xs text-white font-bold truncate">
            @{currentUser?.gamertag || 'organizador'} • {currentGameObj.name}
          </span>
        </div>

        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-expanded={isMobileOpen}
          aria-label={isMobileOpen ? 'Cerrar menú administrativo' : 'Abrir menú administrativo'}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
        >
          {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {isMobileOpen && (
        <button
          type="button" aria-label="Cerrar menú administrativo"
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 top-14 z-30 bg-black/55 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Desktop & Mobile Sidebar Container */}
      <aside
        className={`fixed top-14 left-0 bottom-0 z-40 w-[min(18rem,calc(100vw-2rem))] md:w-64 bg-slate-950/95 border-r border-[var(--border-card)] backdrop-blur-xl flex flex-col justify-between p-4 transition-transform duration-300 overflow-y-auto overscroll-contain ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-5">
          
          {/* Header Box with Role & User */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-purple-500/30 space-y-2 shadow-xl">
            <div className="flex items-center justify-between">
              <Badge variant={isAdmin ? 'cyan' : 'emerald'} className="text-[9px] font-mono font-black uppercase tracking-wider">
                {isAdmin ? 'PANEL ADMINISTRATIVO' : 'PANEL ORGANIZADOR'}
              </Badge>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-white uppercase tracking-tight truncate">
                {currentUser?.role || 'Organizador'}
              </h4>
              <p className="text-[10px] text-cyan-400 font-mono font-bold truncate">
                @{currentUser?.gamertag || 'organizador'}
              </p>
            </div>
          </div>

          {/* 🌐 SECCIÓN 1: GESTIÓN GLOBAL */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider px-2 block flex items-center gap-1">
              <Globe className="w-3 h-3 text-cyan-400" />
              GESTIÓN GLOBAL:
            </span>

            <nav className="space-y-1">
              {globalNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`w-full p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 shadow-lg font-black'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white border border-transparent hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {item.icon}
                      <span className="truncate">{item.title}</span>
                    </div>

                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        isActive ? 'bg-black/30 text-white' : 'bg-slate-900 text-slate-400 border border-white/5'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* 🏆 SECCIÓN 2: GESTIÓN POR DISCIPLINA */}
          <div className="space-y-2 pt-3 border-t border-white/10">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-purple-300 tracking-wider px-2 block flex items-center gap-1">
                <Gamepad2 className="w-3 h-3 text-purple-400" />
                GESTIÓN POR DISCIPLINA:
              </span>

              {/* Selector de Juego / Disciplina Activa */}
              <select
                value={activeGameSlug}
                onChange={(e) => {
                  const newSlug = e.target.value;
                  setActiveGameSlug(newSlug);
                  const segments = pathname.split('/').filter(Boolean);
                  if (segments.length > 0 && GAMES_CATALOG[segments[0]]) {
                    segments[0] = newSlug;
                    router.push('/' + segments.join('/'));
                  }
                }}
                className="w-full p-2 rounded-xl bg-slate-900 border border-purple-500/40 text-purple-300 font-mono font-bold text-xs outline-none cursor-pointer hover:border-purple-400 transition-colors shadow-inner"
              >
                {Object.values(GAMES_CATALOG).map((g) => (
                  <option key={g.slug} value={g.slug}>
                    {g.icon} {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Links de la Disciplina */}
            <nav className="space-y-1">
              {disciplineNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`w-full p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-lg font-black'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white border border-transparent hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {item.icon}
                      <span className="truncate">{item.title}</span>
                    </div>

                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        isActive ? 'bg-black/30 text-white' : 'bg-slate-900 text-slate-400 border border-white/5'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom System Status */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Disciplina Activa:</span>
            <span className="text-cyan-400 font-bold">{currentGameObj.name}</span>
          </div>
          <p className="text-[9px] text-slate-400 font-mono">Filtro Exclusivo eSports</p>
        </div>
      </aside>
    </>
  );
}
