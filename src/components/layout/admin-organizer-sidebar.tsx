'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronDown, Gamepad2, Globe } from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games-data';
import { GameLogo } from '@/components/ui/game-logo';
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock';
import {
  adminNavItems,
  getDisciplineNavItems,
  isNavigationItemActive,
  organizerNavItems,
} from '@/components/layout/management-navigation-model';

interface AdminOrganizerSidebarProps {
  isMobileOpen: boolean;
  isDesktopCollapsed: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

export function AdminOrganizerSidebar({ isMobileOpen, isDesktopCollapsed, onMobileOpenChange }: AdminOrganizerSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, activeGameSlug, setActiveGameSlug } = useAuth();

  const roleStr = (currentUser?.role || '').toLowerCase();
  const isAdmin = roleStr === 'administrador' || roleStr === 'admin';
  const isOrganizer = roleStr === 'organizador';
  useBodyScrollLock(isMobileOpen, 'management-navigation');

  React.useEffect(() => {
    if (!isMobileOpen) return;

    const mobileViewport = window.matchMedia('(max-width: 1023px)');
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onMobileOpenChange(false);
    };
    const closeAtDesktopBreakpoint = (event: MediaQueryListEvent) => {
      if (!event.matches) onMobileOpenChange(false);
    };

    document.addEventListener('keydown', closeOnEscape);
    mobileViewport.addEventListener('change', closeAtDesktopBreakpoint);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      mobileViewport.removeEventListener('change', closeAtDesktopBreakpoint);
    };
  }, [isMobileOpen, onMobileOpenChange]);

  const [isGameSelectOpen, setIsGameSelectOpen] = React.useState(false);
  const gameSelectRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isGameSelectOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (gameSelectRef.current && !gameSelectRef.current.contains(e.target as Node)) {
        setIsGameSelectOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsGameSelectOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isGameSelectOpen]);

  // Do not render sidebar for regular players/captains.
  if (!isAdmin && !isOrganizer) {
    return null;
  }

  const currentGameObj = GAMES_CATALOG[activeGameSlug] || GAMES_CATALOG['eafc26'];

  const globalNavItems = isAdmin ? adminNavItems : organizerNavItems;

  const disciplineNavItems = getDisciplineNavItems(activeGameSlug, currentGameObj.name);

  return (
    <>
      {isMobileOpen && (
        <button
          type="button" aria-label="Cerrar menú administrativo"
          onClick={() => onMobileOpenChange(false)}
          className="fixed inset-0 top-14 z-30 bg-[var(--app-overlay)] backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Desktop & Mobile Sidebar Container */}
      <aside
        id="management-navigation"
        aria-label={isAdmin ? 'Navegación administrativa' : 'Navegación del organizador'}
        className={`management-sidebar fixed bottom-0 left-0 top-14 z-40 flex w-[min(18rem,calc(100vw-1rem))] flex-col justify-between overflow-y-auto overscroll-contain border-r border-[var(--border-card)] bg-[var(--bg-nav)]/97 p-3 shadow-2xl backdrop-blur-xl transition-transform duration-300 lg:w-72 lg:p-4 ${isDesktopCollapsed ? 'lg:-translate-x-full' : 'lg:translate-x-0 lg:shadow-none'} ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-5">
          
          {/* Header Box with Role & User */}
          <div className="space-y-2 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-3 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between">
              <Badge variant={isAdmin ? 'cyan' : 'emerald'} className="text-[9px] font-[family-name:var(--font-active)] font-black uppercase tracking-wider">
                {isAdmin ? 'PANEL ADMINISTRATIVO' : 'PANEL ORGANIZADOR'}
              </Badge>
              <span className="h-2 w-2 rounded-full bg-[var(--app-positive)]" />
            </div>

            <div className="space-y-0.5">
              <h4 className="truncate text-xs font-black uppercase tracking-tight text-[var(--text-heading)]">
                {currentUser?.role || 'Organizador'}
              </h4>
              <p className="truncate font-[family-name:var(--font-active)] text-[10px] font-bold text-[var(--app-accent)]">
                @{currentUser?.gamertag || 'organizador'}
              </p>
            </div>
          </div>

          {/* 🌐 SECCIÓN 1: GESTIÓN GLOBAL */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase text-[var(--app-accent)] tracking-wider px-2 block flex items-center gap-1">
              <Globe className="w-3 h-3 text-[var(--app-accent)]" />
              {isAdmin ? 'GESTIÓN GLOBAL' : 'MI ORGANIZACIÓN'}
            </span>

            <nav className="space-y-1">
              {globalNavItems.map((item) => {
                const isActive = isNavigationItemActive(pathname, item.href);
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={() => onMobileOpenChange(false)}
                    className={`w-full p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${
                      isActive
                        ? 'border-[var(--app-accent)]/30 bg-[var(--app-accent-soft)] text-[var(--app-accent)] shadow-sm font-black'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border-card)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {item.icon}
                      <span className="truncate">{item.title}</span>
                    </div>

                    <span
                      className={`text-[9px] font-[family-name:var(--font-active)] px-1.5 py-0.5 rounded font-bold ${
                        isActive ? 'bg-[var(--app-contrast-soft)] text-inherit' : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-card)]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Public shortcuts preserve the same pages an anonymous visitor sees. */}
          <div className="management-public-shortcuts hidden space-y-2 border-t border-[var(--border-card)] pt-3 lg:block">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-[var(--app-accent-2)] tracking-wider px-2 block flex items-center gap-1">
                <Gamepad2 className="w-3 h-3 text-[var(--app-accent-2)]" />
                ACCESOS PÚBLICOS POR DISCIPLINA
              </span>

              {/* Selector de Juego / Disciplina Activa */}
              <div ref={gameSelectRef} className="relative z-20">
                <button
                  type="button"
                  aria-expanded={isGameSelectOpen}
                  aria-haspopup="listbox"
                  aria-label={`Disciplina activa: ${currentGameObj.name}`}
                  onClick={() => setIsGameSelectOpen((prev) => !prev)}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl border p-2 text-left font-[family-name:var(--font-active)] transition-all focus:outline-none ${
                    isGameSelectOpen
                      ? 'border-[var(--app-accent-2)] bg-[var(--bg-card-hover)] shadow-md ring-1 ring-[var(--app-accent-2)]/30'
                      : 'border-[var(--border-card)] bg-[var(--bg-main)]/80 hover:border-[var(--app-accent-2)]/50 hover:bg-[var(--bg-card-hover)]'
                  }`}
                  style={{
                    borderColor: isGameSelectOpen ? (currentGameObj.brandColor || 'var(--app-accent-2)') : undefined,
                  }}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div
                      className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-[var(--border-card)] bg-[var(--bg-card)] p-0.5 shadow-sm"
                      style={{
                        borderColor: `color-mix(in srgb, ${currentGameObj.brandColor || 'var(--app-accent-2)'} 40%, var(--border-card))`,
                      }}
                    >
                      <GameLogo game={currentGameObj} size="sm" />
                    </div>
                    <span className="truncate text-xs font-black uppercase tracking-tight text-[var(--text-heading)]">
                      {currentGameObj.name}
                    </span>
                  </div>
                  <ChevronDown
                    className={`size-3.5 shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${
                      isGameSelectOpen ? 'rotate-180 text-[var(--app-accent-2)]' : ''
                    }`}
                  />
                </button>

                {/* Dropdown flotante con los logos oficiales reales */}
                {isGameSelectOpen && (
                  <div
                    role="listbox"
                    aria-label="Disciplinas disponibles"
                    className="absolute left-0 top-full z-50 mt-1.5 w-full rounded-xl border border-[var(--border-card)] bg-[var(--ui-surface-solid)]/98 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-1"
                    style={{
                      borderColor: `color-mix(in srgb, ${currentGameObj.brandColor || 'var(--app-accent-2)'} 45%, var(--border-card))`,
                    }}
                  >
                    <div className="mb-1 flex items-center justify-between border-b border-[var(--border-card)]/70 px-2 py-1 text-[9px] font-[family-name:var(--font-active)] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      <span>Disciplinas oficiales</span>
                      <span className="rounded-full bg-[var(--app-accent-2)]/15 px-1.5 py-0.2 text-[9px] font-black text-[var(--app-accent-2)]">
                        {Object.values(GAMES_CATALOG).length}
                      </span>
                    </div>

                    <div className="max-h-56 space-y-1 overflow-y-auto pr-0.5">
                      {Object.values(GAMES_CATALOG).map((g) => {
                        const isSelected = activeGameSlug === g.slug;
                        const optColor = g.brandColor || 'var(--app-accent-2)';

                        return (
                          <button
                            key={g.slug}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              setActiveGameSlug(g.slug);
                              setIsGameSelectOpen(false);
                              const segments = pathname.split('/').filter(Boolean);
                              if (segments.length > 0 && GAMES_CATALOG[segments[0]]) {
                                segments[0] = g.slug;
                                router.push('/' + segments.join('/'));
                              }
                            }}
                            className={`flex w-full items-center gap-2 rounded-lg p-1.5 text-left transition-all ${
                              isSelected
                                ? 'border border-[var(--opt-accent)]/50 bg-[var(--opt-accent)]/15 font-black text-[var(--text-heading)]'
                                : 'border border-transparent text-[var(--text-secondary)] hover:border-[var(--opt-accent)]/30 hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
                            }`}
                            style={{ '--opt-accent': optColor } as React.CSSProperties}
                          >
                            <div
                              className="flex size-6 shrink-0 items-center justify-center rounded-md border border-[var(--border-card)] bg-[var(--bg-card)] p-0.5 shadow-sm"
                              style={{
                                borderColor: `color-mix(in srgb, ${optColor} 40%, var(--border-card))`,
                              }}
                            >
                              <GameLogo game={g} size="sm" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-bold uppercase leading-tight">
                                {g.name}
                              </span>
                              <span className="block truncate text-[9px] font-medium leading-tight text-[var(--text-muted)]">
                                {g.category}
                              </span>
                            </div>

                            {isSelected && (
                              <Check
                                className="size-3.5 shrink-0"
                                style={{ color: optColor }}
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Links de la Disciplina */}
            <nav className="space-y-1">
              {disciplineNavItems.map((item) => {
                const isActive = isNavigationItemActive(pathname, item.href);
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={() => onMobileOpenChange(false)}
                    className={`w-full p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${
                      isActive
                        ? 'border-[var(--app-accent-2)]/30 bg-[var(--app-accent-2-soft)] text-[var(--app-accent-2)] shadow-sm font-black'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border-card)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {item.icon}
                      <span className="truncate">{item.title}</span>
                    </div>

                    <span
                      className={`text-[9px] font-[family-name:var(--font-active)] px-1.5 py-0.5 rounded font-bold ${
                        isActive ? 'bg-[var(--app-contrast-soft)] text-inherit' : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-card)]'
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
          <div className="flex items-center justify-between text-[10px] font-[family-name:var(--font-active)] text-[var(--text-muted)]">
            <span>Vista pública activa:</span>
            <span className="text-[var(--app-accent)] font-bold">{currentGameObj.name}</span>
          </div>
          <p className="text-[9px] text-[var(--text-muted)] font-[family-name:var(--font-active)]">El contenido se muestra sin herramientas de edición.</p>
        </div>
      </aside>
    </>
  );
}
