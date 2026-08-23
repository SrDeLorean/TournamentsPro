'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { useTheme } from 'next-themes';
import { useTranslation } from '@/components/providers/language-provider';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { GAMES_CATALOG } from '@/lib/games-data';
import {
  Trophy, Shield, Settings, LogOut, LayoutDashboard, User, MessageSquare, Sun, Moon, Globe, CheckCircle2, ChevronDown, Sparkles, Home, Gamepad2, Swords, Users, ArrowRightLeft
} from 'lucide-react';

export function AdminOrganizerHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, logout, login, activeGameSlug, setActiveGameSlug } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useTranslation();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGamesOpen, setIsGamesOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const gamesRef = useRef<HTMLDivElement>(null);

  const roleStr = (currentUser?.role || '').toLowerCase();
  const isAdmin = roleStr === 'administrador' || roleStr === 'admin';
  const isOrganizer = roleStr === 'organizador';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
      if (gamesRef.current && !gamesRef.current.contains(event.target as Node)) {
        setIsGamesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/95 border-b border-[var(--border-card)] backdrop-blur-xl transition-all duration-300 shadow-xl h-14">
      <div className="w-full px-3 sm:px-6 h-full flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left Side: Brand Tag Connected to Sidebar */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-purple-600 to-amber-500 p-0.5 shadow-lg group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Trophy className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-sm sm:text-base font-black tracking-tight text-white uppercase leading-none">
                TOURNAMENTS<span className="text-cyan-400">PRO</span>
              </span>
              <span className="text-[9px] text-cyan-300 font-bold tracking-widest uppercase mt-0.5">
                {isAdmin ? 'PANEL ADMIN' : 'PANEL ORGANIZADOR'}
              </span>
            </div>
          </Link>

          <Badge variant={isAdmin ? 'cyan' : 'emerald'} className="hidden xl:inline-flex text-[9px] font-mono uppercase font-bold">
            {isAdmin ? '🛡️ ADMIN GLOBAL' : '🏆 ORGANIZADOR'}
          </Badge>
        </div>

        {/* 🌐 Center: Public Layout Navigation Views (Vistas Públicas Integradas) */}
        <nav className="hidden md:flex items-center gap-1 font-mono text-xs overflow-x-auto scrollbar-none">
          <Link
            href="/"
            className="px-2.5 py-1 rounded-lg font-bold text-slate-300 hover:text-cyan-400 hover:bg-slate-900 transition-colors flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5 text-cyan-400" />
            <span>Inicio</span>
          </Link>

          {/* Disciplinas eSports Dropdown */}
          <div className="relative" ref={gamesRef}>
            <button
              onClick={() => setIsGamesOpen(!isGamesOpen)}
              className="px-2.5 py-1 rounded-lg font-bold text-slate-300 hover:text-cyan-400 hover:bg-slate-900 transition-colors flex items-center gap-1.5"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Disciplinas</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isGamesOpen ? 'rotate-180 text-cyan-400' : ''}`} />
            </button>

            {isGamesOpen && (
              <div
                className="absolute top-full left-0 mt-1.5 w-60 rounded-2xl bg-slate-950/95 border border-purple-500/40 p-2 shadow-2xl z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 space-y-1"
                onMouseLeave={() => setIsGamesOpen(false)}
              >
                <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-purple-300 border-b border-white/10 flex items-center justify-between">
                  <span>Disciplinas eSports</span>
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                </div>
                {Object.values(GAMES_CATALOG).map((game) => (
                  <button
                    key={game.slug}
                    onClick={() => {
                      setActiveGameSlug(game.slug);
                      setIsGamesOpen(false);
                      const segments = pathname.split('/').filter(Boolean);
                      if (segments.length > 0 && GAMES_CATALOG[segments[0]]) {
                        segments[0] = game.slug;
                        router.push('/' + segments.join('/'));
                      } else {
                        router.push(`/${game.slug}/partidos`);
                      }
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                      activeGameSlug === game.slug
                        ? 'bg-purple-950 text-cyan-300 border border-purple-500/50'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-cyan-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{game.icon}</span>
                      <span>{game.name}</span>
                    </div>
                    {activeGameSlug === game.slug && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link
            href={`/${activeGameSlug}/partidos`}
            className="px-2.5 py-1 rounded-lg font-bold text-slate-300 hover:text-cyan-400 hover:bg-slate-900 transition-colors flex items-center gap-1.5"
          >
            <Swords className="w-3.5 h-3.5 text-amber-400" />
            <span>Partidos</span>
          </Link>

          <Link
            href="/informacion"
            className="px-2.5 py-1 rounded-lg font-bold text-slate-300 hover:text-cyan-400 hover:bg-slate-900 transition-colors flex items-center gap-1.5"
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span>Torneos</span>
          </Link>

          <Link
            href="/equipos"
            className="px-2.5 py-1 rounded-lg font-bold text-slate-300 hover:text-cyan-400 hover:bg-slate-900 transition-colors flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Equipos</span>
          </Link>

          <Link
            href="/atleta/ofertas"
            className="px-2.5 py-1 rounded-lg font-bold text-slate-300 hover:text-cyan-400 hover:bg-slate-900 transition-colors flex items-center gap-1.5"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-rose-400" />
            <span>Fichajes</span>
          </Link>

          <Link
            href="/usuarios"
            className="px-2.5 py-1 rounded-lg font-bold text-slate-300 hover:text-cyan-400 hover:bg-slate-900 transition-colors flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>Atletas</span>
          </Link>
        </nav>

        {/* Right Side Controls ONLY: 1. Bell, 2. Settings Gear, 3. User Info Dropdown */}
        <div className="flex items-center gap-3">
          
          {/* 🔔 1. Campana de Notificaciones eSports */}
          <NotificationCenter />

          {/* ⚙️ 2. Configuración (Tema e Idioma Dropdown) */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-cyan-400 transition-all shadow-sm"
              title="Configuración de Tema e Idioma"
            >
              <Settings className={`w-4 h-4 transition-transform duration-300 ${isSettingsOpen ? 'rotate-90 text-cyan-400' : ''}`} />
            </button>
            {isSettingsOpen && (
              <div className="fixed inset-x-2 top-14 sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:w-80 max-h-[85vh] overflow-y-auto bg-slate-950/95 border border-cyan-500/40 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.8)] space-y-4 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95">
                <div className="pb-2.5 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase text-white tracking-wider block leading-none">Ajustes & Preferencias</span>
                      <span className="text-[9px] font-mono text-cyan-400 font-bold">Personalización Visual</span>
                    </div>
                  </div>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>

                {/* Theme Switcher Box */}
                <div className="p-3 rounded-xl bg-slate-900 border border-white/10 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-300 block tracking-wider">
                    🎨 Tema Visual eSports:
                  </label>
                  <ThemeSwitcher />
                </div>

                {/* Language Switcher Box */}
                <div className="p-3 rounded-xl bg-slate-900 border border-white/10 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-300 block tracking-wider">
                    🌐 Idioma de Interfaz:
                  </label>
                  <LanguageSwitcher />
                </div>
              </div>
            )}
          </div>

          {/* 👤 3. Información del Usuario & Dropdown Profile */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-cyan-400/60 transition-all shadow-sm"
            >
              <Avatar fallback={currentUser?.name || 'User'} status="online" size="sm" />
              <div className="hidden sm:flex flex-col text-left">
                <span className="font-extrabold text-xs text-white leading-tight truncate max-w-[120px]">
                  {currentUser?.name}
                </span>
                <span className="text-[10px] text-cyan-400 font-mono font-bold">
                  @{currentUser?.gamertag}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isUserMenuOpen && (
              <div className="fixed inset-x-2 top-14 sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:w-64 max-h-[85vh] overflow-y-auto glass-panel border border-white/10 rounded-2xl shadow-2xl z-50 p-4 space-y-3 animate-in fade-in zoom-in-95">
                
                {/* User Header Details */}
                <div className="p-3 rounded-xl bg-slate-900 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar fallback={currentUser?.name || 'User'} status="online" size="md" />
                    <div className="min-w-0 flex-1">
                      <span className="font-black text-xs text-white uppercase block truncate">
                        {currentUser?.name}
                      </span>
                      <span className="text-xs text-cyan-400 font-mono font-bold block truncate">
                        @{currentUser?.gamertag}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] font-bold">
                    <Badge variant={isAdmin ? 'cyan' : isOrganizer ? 'emerald' : 'violet'}>
                      {currentUser?.role}
                    </Badge>
                    <span className="text-slate-400 font-mono">{currentUser?.email}</span>
                  </div>
                </div>

                {/* Role Switcher Pills */}
                <div className="p-2 rounded-xl bg-slate-900 border border-white/10 space-y-1.5 text-[10px]">
                  <span className="font-bold text-slate-400 block uppercase px-1">Cambiar Rol / Perfil:</span>
                  <button
                    onClick={async () => {
                      await login('admin@tournamentspro.com', '123456');
                      setIsUserMenuOpen(false);
                    }}
                    className={`w-full p-1.5 rounded-lg flex items-center justify-between font-bold transition-all ${
                      isAdmin ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>🛡️ Administrador</span>
                    {isAdmin && <CheckCircle2 className="w-3 h-3 text-cyan-400" />}
                  </button>

                  <button
                    onClick={async () => {
                      await login('organizador@tournamentspro.com', '123456');
                      setIsUserMenuOpen(false);
                    }}
                    className={`w-full p-1.5 rounded-lg flex items-center justify-between font-bold transition-all ${
                      isOrganizer ? 'bg-purple-950 text-purple-300 border border-purple-500/50' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>🏆 Organizador</span>
                    {isOrganizer && <CheckCircle2 className="w-3 h-3 text-purple-400" />}
                  </button>
                </div>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                    router.push('/login');
                  }}
                  className="w-full text-left flex items-center gap-2.5 p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors pt-2 border-t border-white/10 text-xs font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
