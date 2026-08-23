'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/components/providers/language-provider';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Trophy, Shield, Gamepad2, Users, User, ChevronDown, Sparkles, Settings, Info, Home, Menu, X, Flag, LogIn, UserPlus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GAMES_CATALOG } from '@/lib/games-data';
import { GameLogo } from '@/components/ui/game-logo';
import { useAuth } from '@/components/providers/auth-provider';

import { AdminNavbar } from '@/components/layout/admin-navbar';

export function Navbar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { currentUser, isAuthenticated } = useAuth();

  // If user is authenticated, render the dynamic AdminNavbar
  if (isAuthenticated) {
    return <AdminNavbar />;
  }

  const [isGamesOpen, setIsGamesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const gamesRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (gamesRef.current && !gamesRef.current.contains(event.target as Node)) {
        setIsGamesOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="dark relative top-0 z-50 w-full h-12 border-b border-[var(--border-card)] bg-[#05070d]/90 backdrop-blur-2xl saturate-150 transition-colors duration-300 flex items-center shadow-md">
      {/* Thin Banner Stripe (h-12 / 48px) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full h-full flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 p-0.5 shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
            <div className="w-full h-full bg-[var(--bg-main)] rounded-[6px] flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5 text-[var(--accent-cyan)] group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-display text-sm font-black tracking-wider bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500 bg-clip-text text-transparent uppercase">
              TorneosEsport
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan)] font-extrabold uppercase hidden sm:inline-block">
              PRO
            </span>
          </div>
        </Link>

        {/* Center Nav Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:bg-[var(--bg-card-hover)] transition-all duration-300 flex items-center gap-1.5 neon-fx-hover"
          >
            <Home className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
            Inicio
          </Link>

          {/* Juegos Dropdown */}
          <div className="relative" ref={gamesRef}>
            <button
              onClick={() => setIsGamesOpen(!isGamesOpen)}
              onMouseEnter={() => setIsGamesOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:bg-[var(--bg-card-hover)] transition-all duration-300 flex items-center gap-1.5 neon-fx-hover"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
              {t('nav.games')}
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isGamesOpen ? 'rotate-180 text-[var(--accent-cyan)]' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isGamesOpen && (
              <div
                className="absolute top-full left-0 mt-1 w-64 rounded-xl glass-panel p-2 shadow-2xl border border-[var(--border-card)] animate-in fade-in zoom-in-95 duration-150 z-50"
                onMouseLeave={() => setIsGamesOpen(false)}
              >
                <div className="px-2 py-1 mb-1 border-b border-[var(--border-card)] flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Disciplinas eSports</span>
                  <Sparkles className="w-3 h-3 text-[var(--accent-cyan)]" />
                </div>
                <div className="space-y-1">
                  {Object.values(GAMES_CATALOG).map((game) => (
                    <Link
                      key={game.id}
                      href={`/${game.slug}`}
                      onClick={() => setIsGamesOpen(false)}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <GameLogo game={game} size="sm" className="group-hover:scale-110" />
                        <div>
                          <span className="font-bold text-xs block text-[var(--text-heading)] group-hover:text-[var(--accent-cyan)] transition-colors">
                            {game.name}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] block line-clamp-1">{game.category}</span>
                        </div>
                      </div>
                      <span
                        className="w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: game.brandColor }}
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link
            href="/equipos"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:bg-[var(--bg-card-hover)] transition-all duration-300 flex items-center gap-1.5 neon-fx-hover"
          >
            <Shield className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
            Equipos
          </Link>

          <Link
            href="/organizaciones"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:bg-[var(--bg-card-hover)] transition-all duration-300 flex items-center gap-1.5 neon-fx-hover"
          >
            <Flag className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
            {t('nav.organizations')}
          </Link>

          <Link
            href="/usuarios"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:bg-[var(--bg-card-hover)] transition-all duration-300 flex items-center gap-1.5 neon-fx-hover"
          >
            <Users className="w-3.5 h-3.5 text-[var(--accent-violet)]" />
            Usuarios
          </Link>

          <Link
            href="/mensajes"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:bg-[var(--bg-card-hover)] transition-all duration-300 flex items-center gap-1.5 neon-fx-hover"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
            Mensajes
          </Link>

          <Link
            href="/informacion"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:bg-[var(--bg-card-hover)] transition-colors flex items-center gap-1.5"
          >
            <Info className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            Información
          </Link>

          <Link
            href="/componentes"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:bg-[var(--bg-card-hover)] transition-colors flex items-center gap-1.5"
          >
            UI Kit
          </Link>
        </nav>

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
            className="lg:hidden p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed top-12 left-0 right-0 bg-[var(--bg-card)] border-b border-[var(--border-card)] p-4 space-y-3 z-40 shadow-2xl animate-in slide-in-from-top duration-200">
          <div className="space-y-1">
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

            <div className="pt-2 border-t border-[var(--border-card)] grid grid-cols-2 gap-2">
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
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
