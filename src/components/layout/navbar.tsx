'use client';

import { useState, useRef, useEffect, useCallback, type CSSProperties, type SetStateAction } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Trophy, Sparkles, Settings, Menu, X, LogIn, UserPlus, PanelLeftClose, PanelLeftOpen, LayoutDashboard, UserRoundCog, Mail, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';

import { NavLinks } from '@/components/layout/nav-links';
import { GAMES_CATALOG } from '@/lib/games-data';
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const AdminNavbar = dynamic(() => import('@/components/layout/admin-navbar').then((module) => module.AdminNavbar));
const NotificationCenter = dynamic(() => import('@/components/notifications/notification-center').then((module) => module.NotificationCenter));
const MobilePublicNavigation = dynamic(() => import('@/components/layout/mobile-public-navigation').then((module) => module.MobilePublicNavigation));

interface ManagementNavigationControl {
  isMobileOpen: boolean;
  isDesktopCollapsed: boolean;
  onToggle: () => void;
}

export function Navbar({
  forcePublic = false,
  managementNavigation,
}: {
  forcePublic?: boolean;
  managementNavigation?: ManagementNavigationControl;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isAuthenticated, activeGameSlug, logout } = useAuth();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mobileMenuState, setMobileMenuState] = useState({ pathname, open: false });
  const isMobileMenuOpen = mobileMenuState.pathname === pathname && mobileMenuState.open;
  const isPublicMobileMenuOpen = !managementNavigation && isMobileMenuOpen;
  const setIsMobileMenuOpen = useCallback((next: SetStateAction<boolean>) => {
    setMobileMenuState((current) => ({
      pathname,
      open: typeof next === 'function' ? next(current.pathname === pathname && current.open) : next,
    }));
  }, [pathname]);
  useBodyScrollLock(isPublicMobileMenuOpen, 'public-navigation');

  const settingsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const routeGameSlug = pathname.split('/').filter(Boolean)[0];
  const routeGame = GAMES_CATALOG[routeGameSlug];
  const currentGame = GAMES_CATALOG[routeGameSlug] || GAMES_CATALOG[activeGameSlug] || GAMES_CATALOG.eafc26;

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsSettingsOpen(false);
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    }
    const desktopViewport = window.matchMedia('(min-width: 1024px)');
    const closeAtDesktopBreakpoint = (event: MediaQueryListEvent) => {
      if (event.matches) setIsMobileMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    desktopViewport.addEventListener('change', closeAtDesktopBreakpoint);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      desktopViewport.removeEventListener('change', closeAtDesktopBreakpoint);
    };
  }, [setIsMobileMenuOpen]);

  // Keep hook ordering stable across authentication changes.
  if (isAuthenticated && !forcePublic) {
    return <AdminNavbar />;
  }

  return (
    <header
      className="app-navbar ui-navigation-bar sticky top-0 z-50 flex h-14 w-full items-center"
      data-game={routeGame?.slug}
      style={{ '--navigation-brand': routeGame?.brandColor || 'var(--app-accent)' } as CSSProperties}
    >
      {/* Thin Banner Stripe (h-12 / 48px) */}
      <div className="app-navbar-inner ui-navigation-frame h-full">
        {managementNavigation ? (
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsSettingsOpen(false);
              setIsUserMenuOpen(false);
              managementNavigation.onToggle();
            }}
            aria-controls="management-navigation"
            aria-label="Abrir o cerrar panel de gestión"
            title="Panel de gestión"
            data-mobile-open={managementNavigation.isMobileOpen}
            data-desktop-collapsed={managementNavigation.isDesktopCollapsed}
            className="management-navbar-toggle ui-navigation-icon-button size-9"
          >
            <PanelLeftOpen className="management-toggle-icon management-toggle-icon-open size-4" />
            <PanelLeftClose className="management-toggle-icon management-toggle-icon-close size-4" />
          </button>
        ) : null}

        {/* Brand Logo */}
        <Link href="/" aria-label="Ir al inicio de TournamentsPro" className="ui-navigation-brand group">
          <div className="ui-navigation-brand-mark">
            <div>
              <Trophy className="size-4" />
            </div>
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="ui-navigation-brand-title">
              TOURNAMENTS<span>PRO</span>
            </span>
            <span className="text-[9px] text-[var(--text-muted)] font-[family-name:var(--font-active)] font-bold uppercase tracking-wider">
              Plataforma Competitiva
            </span>
          </div>
        </Link>

        {/* Center Nav Links (Desktop) */}
        <NavLinks />

        {/* Right Controls: Settings Gear & Auth Buttons */}
        <div className="app-navbar-actions flex min-w-0 items-center gap-1.5 font-[family-name:var(--font-active)]">
          {isAuthenticated ? (
            <div className="hidden sm:block">
              <NotificationCenter onOpen={() => {
                setIsSettingsOpen(false);
                setIsUserMenuOpen(false);
                setIsMobileMenuOpen(false);
              }} />
            </div>
          ) : null}

          {/* Settings Gear Menu */}
          <div className={`relative ${isAuthenticated ? 'hidden sm:block' : ''}`} ref={settingsRef}>
            <button
              type="button"
              onClick={() => setIsSettingsOpen((open) => !open)}
              aria-label="Configuración de Plataforma (Tema e Idioma)"
              title="Configuración de Plataforma (Tema e Idioma)"
              className="ui-navigation-icon-button"
            >
              <Settings className={`w-4 h-4 transition-transform duration-300 ${isSettingsOpen ? 'rotate-90 text-[var(--navigation-brand)]' : ''}`} />
            </button>

            {/* Settings Dropdown Container */}
            {isSettingsOpen && (
              <div className="ui-navigation-popover absolute right-0 top-full z-50 mt-2 w-72 space-y-3 p-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="pb-2 border-b border-[var(--border-card)] flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-heading)] font-[family-name:var(--font-active)]">Preferencias</span>
                  <Sparkles className="w-3.5 h-3.5 text-[var(--navigation-brand)]" />
                </div>

                {/* Theme Switcher */}
                <div className="space-y-1.5 font-[family-name:var(--font-active)]">
                  <label className="text-[11px] font-bold text-[var(--text-muted)] block font-[family-name:var(--font-active)]">Tema Visual</label>
                  <ThemeSwitcher />
                </div>

                {/* Language Switcher */}
                <div className="space-y-1.5 font-[family-name:var(--font-active)]">
                  <label className="text-[11px] font-bold text-[var(--text-muted)] block font-[family-name:var(--font-active)]">Idioma / Region</label>
                  <LanguageSwitcher />
                </div>
              </div>
            )}
          </div>

          {/* Auth Buttons / Dashboard Session Button */}
          {isAuthenticated ? (
            <div className="relative font-[family-name:var(--font-active)]" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsMobileMenuOpen(false);
                  setIsUserMenuOpen((open) => !open);
                }}
                aria-label="Abrir menú de usuario"
                aria-expanded={isUserMenuOpen}
                aria-controls="public-authenticated-user-menu"
                className="flex h-9 items-center gap-2 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-1 pr-1.5 shadow-sm transition-colors hover:border-[var(--navigation-brand)]"
              >
                <Avatar src={currentUser?.avatarUrl || currentUser?.foto} fallback={currentUser?.name || currentUser?.gamertag || 'Usuario'} status="online" size="sm" />
                <span className="hidden max-w-28 truncate text-xs font-black text-[var(--text-heading)] md:inline font-[family-name:var(--font-active)]">{currentUser?.gamertag}</span>
                <ChevronDown className={`hidden size-3 text-[var(--text-muted)] transition-transform md:block ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserMenuOpen ? (
                <div id="public-authenticated-user-menu" className="management-popover fixed inset-x-2 top-14 z-50 max-h-[85vh] space-y-2 overflow-y-auto rounded-2xl p-3 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-1 sm:w-80 font-[family-name:var(--font-active)]">
                  <div className="management-profile-card space-y-3 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={currentUser?.avatarUrl || currentUser?.foto} fallback={currentUser?.name || 'Usuario'} status="online" size="md" />
                      <div className="min-w-0 flex-1">
                        <strong className="block truncate text-sm text-[var(--text-heading)] font-[family-name:var(--font-active)]">{currentUser?.name}</strong>
                        <span className="block truncate font-[family-name:var(--font-active)] text-xs font-bold text-[var(--navigation-brand)]">@{currentUser?.gamertag}</span>
                        <span className="block truncate text-[10px] text-[var(--text-muted)] font-[family-name:var(--font-active)]">{currentUser?.email}</span>
                      </div>
                    </div>
                    <Badge variant="neutral" className="navigation-role-badge">{currentUser?.role}</Badge>
                  </div>
                  <div className="space-y-1 text-xs font-bold font-[family-name:var(--font-active)]">
                    <Link href="/dashboard" onClick={() => setIsUserMenuOpen(false)} className="management-profile-action">
                      <LayoutDashboard className="size-4 text-[var(--navigation-brand)]" />Panel de gestión
                    </Link>
                    <Link href="/cuenta/ajustes" onClick={() => setIsUserMenuOpen(false)} className="management-profile-action">
                      <UserRoundCog className="size-4 text-[var(--navigation-brand)]" />Configuración de la cuenta
                    </Link>
                    <Link href="/mensajes" onClick={() => setIsUserMenuOpen(false)} className="management-profile-action">
                      <Mail className="size-4 text-[var(--navigation-brand)]" />Centro de mensajes
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                        router.push('/login');
                      }}
                      className="management-profile-action w-full border-t border-[var(--border-card)] text-left text-[var(--app-danger)] font-[family-name:var(--font-active)]"
                    >
                      <LogOut className="size-4" />Cerrar sesión
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              {/* Iniciar Sesión Link Button */}
              <Link href="/login" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm" className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--navigation-brand)] h-8 px-2.5">
                  <LogIn className="w-3.5 h-3.5 mr-1 text-[var(--navigation-brand)]" />
                  Ingresar
                </Button>
              </Link>

              {/* Registrarse Link Button */}
              <Link href="/registro" className="hidden sm:inline-flex">
                <Button variant="primary" size="sm" className="navigation-primary-action text-xs font-black h-8 px-3">
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  Registro
                </Button>
              </Link>
            </>
          )}

          {/* Mobile Hamburger Toggle */}
          {!managementNavigation ? (
            <button
              onClick={() => {
                setIsSettingsOpen(false);
                setIsUserMenuOpen(false);
                setIsMobileMenuOpen((open) => !open);
              }}
              className="app-navbar-mobile-toggle ui-navigation-icon-button lg:hidden"
              type="button"
              aria-label={isMobileMenuOpen ? 'Cerrar navegación global' : 'Abrir navegación global'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="public-mobile-navigation"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          ) : null}
        </div>
      </div>

      {isPublicMobileMenuOpen ? (
        <MobilePublicNavigation currentGame={currentGame} currentPath={pathname} isAuthenticated={isAuthenticated} onClose={() => setIsMobileMenuOpen(false)} />
      ) : null}
    </header>
  );
}
