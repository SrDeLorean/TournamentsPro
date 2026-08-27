'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { GAMES_CATALOG } from '@/lib/games-data';
import {
  Trophy, Shield, Settings, LogOut, CheckCircle2, ChevronDown, Sparkles, Home, Gamepad2, Users, Flag, Info
} from 'lucide-react';
import { NavLinks } from '@/components/layout/nav-links';

export function AdminOrganizerHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, logout, activeGameSlug, setActiveGameSlug } = useAuth();
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
        <NavLinks />

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
