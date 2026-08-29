'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Trophy, Shield, Users, User, Sparkles, Settings, Info, Home, Menu, X, Flag, LogIn, UserPlus, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';

import { AdminNavbar } from '@/components/layout/admin-navbar';
import { NavLinks } from '@/components/layout/nav-links';
import { GAMES_CATALOG } from '@/lib/games-data';
import { GameLogo } from '@/components/ui/game-logo';

export function Navbar({ forcePublic = false }: { forcePublic?: boolean }) {
  const { currentUser, isAuthenticated } = useAuth();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const settingsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keep hook ordering stable across authentication changes.
  if (isAuthenticated && !forcePublic) {
    return <AdminNavbar />;
  }

  return (
    <header className="app-navbar sticky top-0 z-50 w-full h-14 border-b transition-colors duration-300 flex items-center">
      {/* Thin Banner Stripe (h-12 / 48px) */}
      <div className="app-navbar-inner max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full h-full flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 via-purple-600 to-amber-500 p-0.5 shadow-lg group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center">
              <Trophy className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-base font-black tracking-tight text-[var(--text-heading)] uppercase leading-none">
              TOURNAMENTS<span className="text-cyan-400">PRO</span>
            </span>
            <span className="text-[9px] text-[var(--text-muted)] font-mono font-bold uppercase">
              Plataforma Competitiva
            </span>
          </div>
        </Link>

        {/* Center Nav Links (Desktop) */}
        <NavLinks />

        {/* Right Controls: Settings Gear & Auth Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Settings Gear Menu */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              title="Configuración de Plataforma (Tema e Idioma)"
              className="p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:bg-[var(--bg-card-hover)] transition-all shadow-sm flex items-center justify-center"
            >
              <Settings className={`w-4 h-4 transition-transform duration-300 ${isSettingsOpen ? 'rotate-90 text-[var(--accent-cyan)]' : ''}`} />
            </button>

            {/* Settings Dropdown Container */}
            {isSettingsOpen && (
              <div className="absolute top-full right-0 mt-1 w-72 rounded-xl glass-panel p-3 shadow-2xl border border-[var(--border-card)] animate-in fade-in zoom-in-95 duration-150 z-50 space-y-3">
                <div className="pb-2 border-b border-[var(--border-card)] flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-heading)]">Preferencias</span>
                  <Sparkles className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                </div>

                {/* Theme Switcher */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[var(--text-muted)] block">Tema Visual</label>
                  <ThemeSwitcher />
                </div>

                {/* Language Switcher */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[var(--text-muted)] block">Idioma / Region</label>
                  <LanguageSwitcher />
                </div>
              </div>
            )}
          </div>

          {/* Auth Buttons / Dashboard Session Button */}
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="sm" className="text-xs font-black h-8 px-3 bg-[var(--accent-cyan)] text-slate-950 hover:opacity-90 flex items-center gap-1.5 shadow-md">
                <User className="w-3.5 h-3.5" />
                <span>{currentUser?.gamertag}</span>
              </Button>
            </Link>
          ) : (
            <>
              {/* Iniciar Sesión Link Button */}
              <Link href="/login" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm" className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] h-8 px-2.5">
                  <LogIn className="w-3.5 h-3.5 mr-1 text-[var(--accent-cyan)]" />
                  Ingresar
                </Button>
              </Link>

              {/* Registrarse Link Button */}
              <Link href="/registro" className="hidden sm:inline-flex">
                <Button size="sm" className="text-xs font-black h-8 px-3 bg-[var(--accent-cyan)] text-slate-950 hover:opacity-90">
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  Registro
                </Button>
              </Link>
            </>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="app-navbar-mobile-toggle lg:hidden p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition-colors"
            type="button"
            aria-label={isMobileMenuOpen ? 'Cerrar menú principal' : 'Abrir menú principal'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="public-mobile-navigation"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div id="public-mobile-navigation" className="app-navbar-mobile-menu lg:hidden fixed top-14 left-0 right-0 max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain glass-panel rounded-none border-x-0 border-t-0 p-3 space-y-3 z-40 shadow-2xl animate-in slide-in-from-top duration-200">
          <section className="mobile-games-panel" aria-labelledby="mobile-games-title">
            <div className="mobile-games-heading">
              <div><Gamepad2 className="size-4" /><span id="mobile-games-title">Cambiar juego</span></div>
              <small>{Object.keys(GAMES_CATALOG).length} disciplinas</small>
            </div>
            <div className="mobile-games-grid">
              {Object.values(GAMES_CATALOG).map((game) => (
                <Link key={game.id} href={`/${game.slug}`} onClick={() => setIsMobileMenuOpen(false)} style={{ '--mobile-game-color': game.brandColor } as React.CSSProperties}>
                  <GameLogo game={game} size="sm" />
                  <span><strong>{game.name}</strong><small>{game.category}</small></span>
                </Link>
              ))}
            </div>
          </section>

          <div className="app-navbar-mobile-links space-y-1">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 rounded-lg text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
            >
              <Home className="w-4 h-4 text-[var(--accent-cyan)]" />
              Inicio
            </Link>
            <Link
              href="/equipos"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 rounded-lg text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
            >
              <Shield className="w-4 h-4 text-[var(--accent-cyan)]" />
              Directorio de Equipos
            </Link>
            <Link
              href="/organizaciones"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 rounded-lg text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
            >
              <Flag className="w-4 h-4 text-[var(--accent-emerald)]" />
              Organizaciones
            </Link>
            <Link
              href="/usuarios"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 rounded-lg text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
            >
              <Users className="w-4 h-4 text-[var(--accent-violet)]" />
              Usuarios & Atletas
            </Link>
            <Link
              href="/informacion"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 rounded-lg text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
            >
              <Info className="w-4 h-4 text-[var(--text-muted)]" />
              Información & Reglamento
            </Link>

            {!isAuthenticated ? <div className="pt-2 border-t border-[var(--border-card)] grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-bold bg-[var(--bg-card-hover)] border border-[var(--border-card)] text-[var(--text-primary)]"
              >
                <LogIn className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                Ingresar
              </Link>
              <Link
                href="/registro"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-black bg-[var(--accent-cyan)] text-slate-950"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Registro
              </Link>
            </div> : <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-black bg-[var(--accent-cyan)] text-slate-950"><User className="size-4" />Ir a mi panel</Link>}
          </div>
        </div>
      )}
    </header>
  );
}
