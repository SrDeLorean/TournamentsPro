'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import {
  Trophy, Settings, LogOut, ChevronDown, Sparkles, Menu, X, LayoutDashboard, Globe2, UserRoundCog, Mail, Gamepad2
} from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games-data';
import { GameLogo } from '@/components/ui/game-logo';

interface AdminOrganizerHeaderProps {
  isManagementRoute: boolean;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

export function AdminOrganizerHeader({ isManagementRoute, isMenuOpen, onMenuToggle }: AdminOrganizerHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, activeGameSlug, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const roleStr = (currentUser?.role || '').toLowerCase();
  const isAdmin = roleStr === 'administrador' || roleStr === 'admin';
  const isOrganizer = roleStr === 'organizador';
  const currentGame = GAMES_CATALOG[activeGameSlug] || GAMES_CATALOG.eafc26;
  const managementSection = pathname.split('/').filter(Boolean)[1] || 'inicio';
  const managementSectionLabels: Record<string, string> = {
    inicio: 'Centro de control',
    organizaciones: 'Organizaciones',
    disciplinas: 'Disciplinas',
    competencias: 'Competencias',
    usuarios: 'Usuarios y atletas',
    equipos: 'Equipos y clubes',
    matchday: 'Operación matchday',
    moderacion: 'Moderación',
  };
  const managementSectionLabel = isManagementRoute
    ? managementSectionLabels[managementSection] || 'Espacio de gestión'
    : 'Vista pública';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <header className="management-header sticky top-0 z-50 h-14 w-full border-b border-[var(--border-card)] bg-[var(--bg-nav)]/95 shadow-[var(--shadow-soft)] backdrop-blur-xl transition-all duration-300">
      <div className="flex h-full w-full items-center">
        
        {/* Left Side: exact desktop continuation of the 18rem sidebar rail. */}
        <div className={`flex h-full min-w-0 flex-1 items-center gap-2 border-[var(--border-card)] px-3 lg:flex-none lg:px-4 ${isManagementRoute ? 'lg:w-72 lg:border-r' : 'lg:w-auto'}`}>
          <button
            type="button"
            onClick={onMenuToggle}
            aria-controls="management-navigation"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Cerrar menú administrativo' : 'Abrir menú administrativo'}
            className={`management-menu-toggle inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm transition-colors hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] ${isManagementRoute ? 'lg:hidden' : ''}`}
          >
            {isMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>

          <Link
            href="/dashboard"
            onClick={() => {
              if (isMenuOpen) onMenuToggle();
            }}
            className="flex items-center gap-2 group"
            aria-label="Ir al centro de control"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-purple-600 to-amber-500 p-0.5 shadow-lg group-hover:scale-105 transition-transform">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[var(--bg-main)]">
                <Trophy className="w-4 h-4 text-[var(--accent-cyan)]" />
              </div>
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-sm sm:text-base font-black tracking-tight text-[var(--text-heading)] uppercase leading-none">
                TOURNAMENTS<span className="text-cyan-400">PRO</span>
              </span>
              <span className="text-[9px] text-cyan-300 font-bold tracking-widest uppercase mt-0.5">
                {isAdmin ? 'PANEL ADMIN' : 'PANEL ORGANIZADOR'}
              </span>
            </div>
          </Link>

          <Badge variant={isAdmin ? 'cyan' : 'emerald'} className="ml-auto hidden text-[9px] font-mono uppercase font-bold xl:inline-flex">
            {isAdmin ? '🛡️ ADMIN GLOBAL' : '🏆 ORGANIZADOR'}
          </Badge>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 px-2 sm:px-4 lg:px-6">
          {/* Persistent role context plus explicit management/public mode switch. */}
          <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
            <div className="management-header-context min-w-0">
              <small>{isManagementRoute ? 'Espacio de gestión' : 'Contenido público'}</small>
              <strong>{managementSectionLabel}</strong>
            </div>
            <div className="management-active-game hidden min-w-0 items-center gap-2 xl:flex" style={{ '--management-game': currentGame.brandColor } as React.CSSProperties}>
              <GameLogo game={currentGame} size="sm" />
              <span><small>Disciplina activa</small><strong>{currentGame.name}</strong></span>
            </div>
          </div>

          <nav className="management-mode-switch" aria-label="Cambiar entre gestión y vista pública">
            <Link
              href="/dashboard"
              aria-current={isManagementRoute ? 'page' : undefined}
              className={isManagementRoute ? 'is-active' : ''}
              title="Abrir panel de gestión"
            >
              <LayoutDashboard className="size-3.5" />
              <span>Gestión</span>
            </Link>
            <Link
              href={`/${activeGameSlug}`}
              aria-current={!isManagementRoute ? 'page' : undefined}
              className={!isManagementRoute ? 'is-active' : ''}
              title="Ver el portal como el público"
            >
              <Globe2 className="size-3.5" />
              <span>Vista pública</span>
            </Link>
          </nav>

          {/* Right Side Controls ONLY: 1. Bell, 2. Settings Gear, 3. User Info Dropdown */}
          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          
          {/* 🔔 1. Campana de Notificaciones eSports */}
          <NotificationCenter onOpen={() => {
            setIsSettingsOpen(false);
            setIsUserMenuOpen(false);
          }} />

          {/* ⚙️ 2. Configuración (Tema e Idioma Dropdown) */}
          <div className="relative" ref={settingsRef}>
            <button
              type="button"
              onClick={() => {
                setIsUserMenuOpen(false);
                setIsSettingsOpen((open) => !open);
              }}
              aria-label="Abrir ajustes de tema e idioma"
              aria-expanded={isSettingsOpen}
              className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-2 text-[var(--text-secondary)] shadow-sm transition-all hover:text-[var(--accent-cyan)]"
              title="Configuración de Tema e Idioma"
            >
              <Settings className={`w-4 h-4 transition-transform duration-300 ${isSettingsOpen ? 'rotate-90 text-cyan-400' : ''}`} />
            </button>
            {isSettingsOpen && (
              <div className="management-popover fixed inset-x-2 top-14 sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:w-80 max-h-[85vh] overflow-y-auto rounded-2xl p-4 space-y-4 z-50 animate-in fade-in zoom-in-95">
                <div className="pb-2.5 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)]/40 text-[var(--accent-cyan)]">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase text-[var(--text-heading)] tracking-wider block leading-none">Preferencias rápidas</span>
                      <span className="text-[9px] font-mono text-[var(--accent-cyan)] font-bold">Apariencia e idioma</span>
                    </div>
                  </div>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>

                {/* Theme Switcher Box */}
                <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] space-y-2">
                  <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] block tracking-wider">
                    Tema visual
                  </label>
                  <ThemeSwitcher />
                </div>

                {/* Language Switcher Box */}
                <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] space-y-2">
                  <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] block tracking-wider">
                    Idioma de interfaz
                  </label>
                  <LanguageSwitcher />
                </div>
              </div>
            )}
          </div>

          {/* 👤 3. Información del Usuario & Dropdown Profile */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => {
                setIsSettingsOpen(false);
                setIsUserMenuOpen((open) => !open);
              }}
              aria-label="Abrir menú de usuario"
              aria-expanded={isUserMenuOpen}
              className="flex items-center gap-2.5 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-1.5 shadow-sm transition-all hover:border-[var(--border-card-hover)]"
            >
              <Avatar fallback={currentUser?.name || 'User'} status="online" size="sm" />
              <div className="hidden sm:flex flex-col text-left">
                <span className="max-w-[120px] truncate text-xs font-extrabold leading-tight text-[var(--text-heading)]">
                  {currentUser?.name}
                </span>
                <span className="text-[10px] text-cyan-400 font-mono font-bold">
                  @{currentUser?.gamertag}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180 text-[var(--accent-cyan)]' : ''}`} />
            </button>

            {isUserMenuOpen && (
              <div className="management-popover fixed inset-x-2 top-14 sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:w-80 max-h-[85vh] overflow-y-auto rounded-2xl z-50 p-3 space-y-2 animate-in fade-in zoom-in-95">
                
                {/* User Header Details */}
                <div className="management-profile-card p-3 rounded-xl space-y-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar fallback={currentUser?.name || 'User'} status="online" size="md" />
                    <div className="min-w-0 flex-1">
                      <span className="font-black text-sm text-[var(--text-heading)] block truncate">
                        {currentUser?.name}
                      </span>
                      <span className="text-xs text-[var(--accent-cyan)] font-mono font-bold block truncate">
                        @{currentUser?.gamertag}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-card)] text-[10px] font-bold">
                    <Badge variant={isAdmin ? 'cyan' : isOrganizer ? 'emerald' : 'violet'}>
                      {currentUser?.role}
                    </Badge>
                    <span className="truncate text-right text-[var(--text-muted)] font-mono">{currentUser?.email}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <span className="flex items-center gap-1 text-[var(--text-muted)]"><Gamepad2 className="size-3" /> Disciplina</span>
                    <strong className="truncate text-right text-[var(--text-secondary)]">{currentGame.name}</strong>
                  </div>
                </div>

                <div className="space-y-1 text-xs font-bold">
                  <Link href="/cuenta/ajustes" onClick={() => setIsUserMenuOpen(false)} className="management-profile-action">
                    <UserRoundCog className="size-4 text-[var(--accent-cyan)]" />
                    Configuración de la cuenta
                  </Link>
                  <Link href="/mensajes" onClick={() => setIsUserMenuOpen(false)} className="management-profile-action">
                    <Mail className="size-4 text-[var(--accent-emerald)]" />
                    Centro de mensajes
                  </Link>
                  <Link href="/dashboard" onClick={() => setIsUserMenuOpen(false)} className="management-profile-action">
                    <LayoutDashboard className="size-4 text-[var(--accent-violet)]" />
                    Ir al panel de gestión
                  </Link>
                </div>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                    router.push('/login');
                  }}
                  className="w-full text-left flex items-center gap-2.5 p-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors border-t border-[var(--border-card)] text-xs font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>

          </div>
        </div>

      </div>
    </header>
  );
}
