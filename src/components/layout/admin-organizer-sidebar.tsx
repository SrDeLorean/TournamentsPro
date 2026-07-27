'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import {
  Shield, Trophy, Users, Building2, LayoutDashboard, Calendar, Award, ArrowRightLeft, MessageSquare, ChevronRight, Settings, Sparkles, CheckCircle2, Menu, X, FileText, Activity, Gamepad2
} from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games-data';

export function AdminOrganizerSidebar() {
  const pathname = usePathname();
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

  // Admin Sidebar Nav Items
  const adminNavItems = [
    {
      title: 'Dashboard Global',
      href: '/dashboard',
      icon: <LayoutDashboard className="w-4 h-4 text-cyan-400" />,
      badge: 'Stats',
    },
    {
      title: 'Gestión de Usuarios',
      href: '/usuarios',
      icon: <Users className="w-4 h-4 text-purple-400" />,
      badge: 'Atletas',
    },
    {
      title: 'Gestión de Equipos',
      href: '/equipos',
      icon: <Shield className="w-4 h-4 text-emerald-400" />,
      badge: 'Clubes',
    },
    {
      title: 'Organizaciones Madre',
      href: '/organizaciones',
      icon: <Building2 className="w-4 h-4 text-amber-400" />,
      badge: 'Oficial',
    },
  ];

  // Organizer Sidebar Nav Items (Filtered dynamically for active selected game)
  const organizerNavItems = [
    {
      title: `Panel ${currentGameObj.name}`,
      href: '/dashboard',
      icon: <Trophy className="w-4 h-4 text-purple-400" />,
      badge: currentGameObj.slug.toUpperCase(),
    },
    {
      title: 'Matchday & Visto Bueno',
      href: '/club/matchday',
      icon: <CheckCircle2 className="w-4 h-4 text-amber-400" />,
      badge: 'Revisión',
    },
    {
      title: `Escuadras ${currentGameObj.name}`,
      href: '/equipos',
      icon: <Shield className="w-4 h-4 text-cyan-400" />,
      badge: 'Equipos',
    },
    {
      title: 'Directorio de Atletas',
      href: '/usuarios',
      icon: <Users className="w-4 h-4 text-emerald-400" />,
      badge: 'Jugadores',
    },
    {
      title: 'Organizaciones Madre',
      href: '/organizaciones',
      icon: <Building2 className="w-4 h-4 text-amber-400" />,
      badge: 'Sedes',
    },
    {
      title: 'Chat con Capitanes',
      href: '/mensajes',
      icon: <MessageSquare className="w-4 h-4 text-rose-400" />,
      badge: 'Soporte',
    },
  ];

  const currentNavItems = isAdmin ? adminNavItems : organizerNavItems;

  return (
    <>
      {/* Mobile Toggle Bar */}
      <div className="md:hidden sticky top-12 z-40 bg-slate-950/90 border-b border-[var(--border-card)] p-2.5 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Badge variant={isAdmin ? 'cyan' : 'emerald'} className="text-[10px] uppercase font-bold">
            {isAdmin ? '🛡️ PANEL ADMIN' : '🏆 PANEL ORGANIZADOR'}
          </Badge>
          <span className="text-xs text-white font-bold truncate">
            @{currentUser?.gamertag || 'organizador'} • {currentGameObj.name}
          </span>
        </div>

        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
        >
          {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Desktop & Mobile Sidebar Container */}
      <aside
        className={`fixed top-12 left-0 bottom-0 z-40 w-64 bg-slate-950/95 border-r border-[var(--border-card)] backdrop-blur-xl flex flex-col justify-between p-4 transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          
          {/* Header Box with Role, User & Interactive Game Selector */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-purple-500/30 space-y-2.5 shadow-xl">
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

            {/* SELECTOR DE JUEGO / DISCIPLINA DISCIPLINARIO (VALORANT, EA FC 26, ROCKET LEAGUE, ETC) */}
            <div className="pt-2 border-t border-white/10 space-y-1">
              <label className="text-[9px] font-mono uppercase text-cyan-400 font-black tracking-wider block flex items-center gap-1">
                <Gamepad2 className="w-3 h-3 text-cyan-400" />
                DISCIPLINA GESTIONADA:
              </label>
              <select
                value={activeGameSlug}
                onChange={(e) => setActiveGameSlug(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-[11px] outline-none cursor-pointer hover:border-cyan-400 transition-colors shadow-inner"
              >
                {Object.values(GAMES_CATALOG).map((g) => (
                  <option key={g.slug} value={g.slug}>
                    {g.icon} {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Navigation Category Label */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-2 block">
              {isAdmin ? 'MÓDULOS DEL SISTEMA:' : `GESTIÓN EXCLUSIVA ${currentGameObj.name}:`}
            </span>

            {/* Nav Items List */}
            <nav className="space-y-1">
              {currentNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${
                      isActive
                        ? isAdmin
                          ? 'bg-cyan-500 text-slate-950 shadow-lg font-black'
                          : 'bg-purple-600 text-white shadow-lg font-black'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white border border-transparent hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {item.icon}
                      <span className="truncate">{item.title}</span>
                    </div>

                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold transition-opacity ${
                        isActive
                          ? 'bg-black/30 text-white'
                          : 'bg-slate-900 text-slate-400 border border-white/5'
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
