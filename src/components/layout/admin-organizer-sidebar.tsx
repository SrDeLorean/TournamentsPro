'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import {
  Shield, Users, LayoutDashboard, Calendar, Award, ArrowRightLeft, CheckCircle2, Menu, X, Gamepad2, Swords, Globe, Home, Star, PieChart, Database, Target, Building2, MessageSquare
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

  const adminNavItems = [
    {
      title: 'Dashboard Global',
      href: '/dashboard',
      icon: <LayoutDashboard className="w-4 h-4 text-cyan-400" />,
      badge: 'Stats',
    },
    {
      title: 'Gestión Organizaciones',
      href: '/dashboard/organizaciones',
      icon: <Building2 className="w-4 h-4 text-emerald-400" />,
      badge: 'Orgs.',
    },
    {
      title: 'Gestión Disciplinas',
      href: '/dashboard/disciplinas',
      icon: <Gamepad2 className="w-4 h-4 text-pink-400" />,
      badge: 'Juegos',
    },
    {
      title: 'Gestión de Competencias',
      href: '/dashboard/competencias',
      icon: <Swords className="w-4 h-4 text-purple-400" />,
      badge: 'Ligas',
    },
    {
      title: 'Usuarios / Atletas',
      href: '/dashboard/usuarios',
      icon: <Users className="w-4 h-4 text-emerald-400" />,
      badge: 'Directorio',
    },
    {
      title: 'Equipos / Clubes',
      href: '/dashboard/equipos',
      icon: <Shield className="w-4 h-4 text-amber-400" />,
      badge: 'Escuadras',
    },
    {
      title: 'Reportar Encuentros',
      href: '/dashboard/matchday',
      icon: <CheckCircle2 className="w-4 h-4 text-rose-400" />,
      badge: 'Matchday',
    },
    {
      title: 'Moderación & Chat Global',
      href: '/dashboard/moderacion',
      icon: <MessageSquare className="w-4 h-4 text-orange-400" />,
      badge: 'Bans/Chat',
    },
  ];

  const organizerNavItems = [
    { title: 'Centro operativo', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4 text-[var(--accent-cyan)]" />, badge: 'Inicio' },
    { title: 'Mis competencias', href: '/dashboard/competencias', icon: <Swords className="w-4 h-4 text-[var(--accent-violet)]" />, badge: 'Ligas' },
    { title: 'Usuarios / Atletas', href: '/dashboard/usuarios', icon: <Users className="w-4 h-4 text-[var(--accent-cyan)]" />, badge: 'Directorio' },
    { title: 'Clubes inscritos', href: '/dashboard/equipos', icon: <Shield className="w-4 h-4 text-[var(--accent-gold)]" />, badge: 'Clubes' },
    { title: 'Operación matchday', href: '/dashboard/matchday', icon: <CheckCircle2 className="w-4 h-4 text-[var(--accent-crimson)]" />, badge: 'Partidos' },
  ];

  const globalNavItems = isAdmin ? adminNavItems : organizerNavItems;

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
      <div className="fixed inset-x-0 top-14 z-40 flex h-[3.25rem] items-center justify-between gap-2 border-b border-[var(--border-card)] bg-[var(--bg-nav)]/95 px-3 backdrop-blur-xl lg:hidden">
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
          className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-2 text-[var(--text-primary)]"
        >
          {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {isMobileOpen && (
        <button
          type="button" aria-label="Cerrar menú administrativo"
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 top-[6.5rem] z-30 bg-black/55 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Desktop & Mobile Sidebar Container */}
      <aside
        className={`fixed bottom-0 left-0 top-[6.5rem] z-40 flex w-[min(18rem,calc(100vw-1rem))] flex-col justify-between overflow-y-auto overscroll-contain border-r border-[var(--border-card)] bg-[var(--bg-nav)]/95 p-3 backdrop-blur-xl transition-transform duration-300 lg:top-14 lg:w-72 lg:translate-x-0 lg:p-4 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-5">
          
          {/* Header Box with Role & User */}
          <div className="space-y-2 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-3 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between">
              <Badge variant={isAdmin ? 'cyan' : 'emerald'} className="text-[9px] font-mono font-black uppercase tracking-wider">
                {isAdmin ? 'PANEL ADMINISTRATIVO' : 'PANEL ORGANIZADOR'}
              </Badge>
              <span className="h-2 w-2 rounded-full bg-[var(--accent-emerald)]" />
            </div>

            <div className="space-y-0.5">
              <h4 className="truncate text-xs font-black uppercase tracking-tight text-[var(--text-heading)]">
                {currentUser?.role || 'Organizador'}
              </h4>
              <p className="truncate font-mono text-[10px] font-bold text-[var(--accent-cyan)]">
                @{currentUser?.gamertag || 'organizador'}
              </p>
            </div>
          </div>

          {/* 🌐 SECCIÓN 1: GESTIÓN GLOBAL */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider px-2 block flex items-center gap-1">
              <Globe className="w-3 h-3 text-cyan-400" />
              {isAdmin ? 'GESTIÓN GLOBAL' : 'MI ORGANIZACIÓN'}
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
                        ? 'border-[var(--accent-cyan)]/30 bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan)] shadow-sm font-black'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border-card)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {item.icon}
                      <span className="truncate">{item.title}</span>
                    </div>

                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        isActive ? 'bg-black/10 text-inherit' : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-card)]'
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
          <div className="space-y-2 border-t border-[var(--border-card)] pt-3">
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
                className="ui-control w-full cursor-pointer p-2 font-mono text-xs font-bold text-[var(--accent-violet)]"
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
                        ? 'border-[var(--accent-violet)]/30 bg-[var(--accent-violet-bg)] text-[var(--accent-violet)] shadow-sm font-black'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border-card)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {item.icon}
                      <span className="truncate">{item.title}</span>
                    </div>

                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        isActive ? 'bg-black/10 text-inherit' : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-card)]'
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
        <div className="space-y-1 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-3">
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
