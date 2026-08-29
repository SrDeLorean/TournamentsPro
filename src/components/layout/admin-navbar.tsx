'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { GAMES_CATALOG } from '@/lib/games-data';
import { initialTeams } from '@/lib/data-store';
import { CreateTeamModal } from '@/components/teams/create-team-modal';
import { ClubManagementModal } from '@/components/teams/club-management-modal';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { GameLogo } from '@/components/ui/game-logo';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { shouldBypassImageOptimization } from '@/lib/image-utils';
import type { TeamData, UserProfile } from '@/lib/data-store';
import {
  Trophy, Shield, LogOut, Settings, Plus, Sparkles, ChevronDown, LayoutDashboard, CheckCircle2, Home, Gamepad2, Flag, Users, Info, Compass, UserRoundCog, Mail, SlidersHorizontal
} from 'lucide-react';

export function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, activeGameSlug, setActiveGameSlug, logout, userTeams } = useAuth();
  const userRoleStr = (currentUser?.role || '').toLowerCase();
  const isAdmin = userRoleStr === 'administrador' || userRoleStr === 'admin';
  const isOrganizer = userRoleStr === 'organizador';
  const currentGameObj = GAMES_CATALOG[activeGameSlug] || GAMES_CATALOG['eafc26'];

  const [isTeamsOpen, setIsTeamsOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isClubManageOpen, setIsClubManageOpen] = useState(false);

  const teamsRef = useRef<HTMLDivElement>(null);
  const exploreRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (teamsRef.current && !teamsRef.current.contains(event.target as Node)) {
        setIsTeamsOpen(false);
      }
      if (exploreRef.current && !exploreRef.current.contains(event.target as Node)) {
        setIsExploreOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsTeamsOpen(false);
        setIsExploreOpen(false);
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

  const teamsPool = userTeams && userTeams.length > 0 ? userTeams : initialTeams;
  type ManagedTeam = TeamData & {
    game_slug?: string;
    captain_id?: string;
    captain_name?: string;
    encargados?: unknown;
    encargados_json?: unknown;
  };

  const disciplineFilteredTeams = (teamsPool as ManagedTeam[]).filter((t) => {
    const slug = t.game_slug || t.gameSlug || 'eafc26';
    return slug === activeGameSlug || activeGameSlug === 'ALL';
  });

  const isUserTeamManager = (team: ManagedTeam, user: UserProfile | null, strictSpecific = false) => {
    if (!team || !user) return false;

    const uId = user.id;
    const uName = user.name?.toLowerCase();
    const uGamer = user.gamertag?.toLowerCase();

    const cId = team.captain_id || team.captainId;
    const cName = (team.captain_name || team.captainName || '').toLowerCase();

    if (cId && cId === uId) return true;
    if (cName && (cName === uName || cName === uGamer)) return true;
    if (user.teamId && team.id === user.teamId) return true;

    const encs = team.encargados || team.encargados_json;
    if (encs) {
      try {
        const arr = typeof encs === 'string' ? JSON.parse(encs) : encs;
        if (Array.isArray(arr)) {
          const isEnc = arr.some((enc: unknown) => {
            if (typeof enc === 'string') return enc === uId || enc.toLowerCase() === uName || enc.toLowerCase() === uGamer;
            if (!enc || typeof enc !== 'object') return false;
            const manager = enc as { id?: string; name?: string; gamertag?: string };
            return (
              manager.id === uId ||
              (manager.name && uName && manager.name.toLowerCase() === uName) ||
              (manager.gamertag && uGamer && manager.gamertag.toLowerCase() === uGamer)
            );
          });
          if (isEnc) return true;
        }
      } catch {}
    }

    if (!strictSpecific && (user.role === 'Administrador' || user.role === 'Organizador')) {
      return true;
    }

    return false;
  };

  let myTeamInActiveDiscipline = disciplineFilteredTeams.find((t) => isUserTeamManager(t, currentUser, true));
  if (!myTeamInActiveDiscipline && (isAdmin || isOrganizer)) {
    myTeamInActiveDiscipline = disciplineFilteredTeams[0] || teamsPool[0];
  }

  const isCaptain = userRoleStr === 'capitán' || userRoleStr === 'capitan' || userRoleStr === 'encargado' || Boolean(myTeamInActiveDiscipline);
  const activeTeamLogo = myTeamInActiveDiscipline?.logoUrl || (myTeamInActiveDiscipline as TeamData & { logo?: string } | undefined)?.logo;
  const athleteProfileHref = `/${activeGameSlug}/jugadores/${currentUser?.id || ''}`;
  const exploreLinks = [
    { href: '/', label: 'Inicio', description: 'Portada general', icon: Home },
    { href: `/${activeGameSlug}`, label: currentGameObj.name, description: 'Portal competitivo', icon: Gamepad2 },
    { href: '/equipos', label: 'Equipos', description: 'Directorio de clubes', icon: Shield },
    { href: '/organizaciones', label: 'Organizaciones', description: 'Ligas y organizadores', icon: Flag },
    { href: '/usuarios', label: 'Jugadores', description: 'Directorio de atletas', icon: Users },
    { href: '/informacion', label: 'Información', description: 'Ayuda y plataforma', icon: Info },
  ];

  return (
    <>
      <header className="app-navbar sticky top-0 z-50 w-full h-14 border-b transition-all duration-300">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-1 sm:gap-3">
          
          {/* 1. Left Brand & Admin Badge */}
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
            <Link href={`/${activeGameSlug}`} className="flex items-center gap-2 group">
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
                  {isCaptain ? 'Portal de capitán' : 'Portal del atleta'}
                </span>
              </div>
            </Link>

            {/* Dynamic Role Badge */}
            <Badge
              variant={isOrganizer ? 'emerald' : isCaptain ? 'violet' : 'cyan'}
              className="hidden sm:inline-flex text-[10px] uppercase font-black"
            >
              {isOrganizer ? 'Organizador' : isCaptain ? 'Capitán / DT' : 'Atleta Libre'}
            </Badge>
          </div>

          {/* 🛡️ SELECTOR PROTAGONISTA DE EQUIPOS Y DISCIPLINAS (Visible en Móvil y Escritorio) */}
          <div className="relative min-w-0 flex-1 sm:flex-none" ref={teamsRef}>
            <button
              type="button"
              onClick={() => {
                setIsExploreOpen(false);
                setIsSettingsOpen(false);
                setIsUserMenuOpen(false);
                setIsTeamsOpen((open) => !open);
              }}
              aria-expanded={isTeamsOpen}
              aria-controls="player-team-switcher-menu"
              className="player-team-switcher w-full sm:w-auto"
              style={{ '--player-game': currentGameObj.brandColor } as React.CSSProperties}
            >
              <div className="player-team-switcher-logo relative">
                {activeTeamLogo ? (
                  <Image
                    src={activeTeamLogo}
                    alt={myTeamInActiveDiscipline?.name || 'Club'}
                    fill
                    sizes="24px"
                    unoptimized={shouldBypassImageOptimization(activeTeamLogo)}
                    onError={(e) => {
                      e.currentTarget.src = '/images/default/logo-default.png';
                    }}
                    className="object-cover"
                  />
                ) : (
                  myTeamInActiveDiscipline?.logoText || 'TP'
                )}
              </div>
              <div className="min-w-0 flex-1 sm:flex-none flex flex-col text-left leading-none max-w-[100px] sm:max-w-[145px]">
                <small>{myTeamInActiveDiscipline ? 'Club activo' : 'Estado competitivo'}</small>
                <span className="text-[11px] sm:text-xs font-black text-[var(--text-heading)] truncate">
                  {myTeamInActiveDiscipline?.name || 'Agencia Libre'}
                </span>
              </div>
              <span className="player-team-game hidden xl:inline">{currentGameObj.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isTeamsOpen ? 'rotate-180' : ''}`} />
            </button>

            {isTeamsOpen && (
              <div id="player-team-switcher-menu" className="management-popover player-team-switcher-menu fixed inset-x-2 top-14 sm:absolute sm:inset-auto sm:top-full sm:left-0 sm:mt-1 sm:w-[22rem] max-h-[85vh] overflow-y-auto rounded-2xl p-3 space-y-3 z-50 animate-in fade-in zoom-in-95">
                <div className="pb-2 border-b border-[var(--border-card)] flex items-center justify-between">
                  <span className="min-w-0">
                    <span className="text-xs font-black text-[var(--text-heading)] flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-[var(--accent-violet)]" />
                      Club y disciplina
                    </span>
                    <small className="mt-0.5 block text-[9px] text-[var(--text-muted)]">Cambia tu contexto competitivo activo</small>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTeamsOpen(false);
                      setIsCreateTeamOpen(true);
                    }}
                    className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-[var(--border-card)] bg-[var(--bg-card)] px-2 py-1.5 text-[10px] font-bold text-[var(--accent-cyan)] hover:bg-[var(--bg-card-hover)]"
                  >
                    <Plus className="w-3 h-3" />
                    Crear Club
                  </button>
                </div>

                {/* List of Disciplines with attached Team */}
                <div className="space-y-1.5">
                  {Object.values(GAMES_CATALOG).map((gameItem) => {
                    const teamForGame = teamsPool.find(
                      (t) => t.gameSlug === gameItem.slug && isUserTeamManager(t, currentUser)
                    );

                    const isSelected = activeGameSlug === gameItem.slug;

                    return (
                      <button
                        key={gameItem.id}
                        onClick={() => {
                          setActiveGameSlug(gameItem.slug);
                          setIsTeamsOpen(false);
                          if (teamForGame) {
                            router.push(`/${gameItem.slug}/equipos/${teamForGame.id}`);
                          } else {
                            router.push(`/${gameItem.slug}`);
                          }
                        }}
                        style={{ '--team-game': gameItem.brandColor } as React.CSSProperties}
                        className={`player-team-option ${isSelected ? 'is-active' : ''}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <GameLogo game={gameItem} size="sm" />
                          <div>
                            <span className="font-extrabold text-xs text-[var(--text-heading)] block">
                              {teamForGame ? teamForGame.name : `Agencia Libre`}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)] font-mono font-bold">
                              {gameItem.name} {teamForGame ? '• Club registrado' : '• Sin club'}
                            </span>
                          </div>
                        </div>

                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[var(--team-game)]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Global destinations live in one compact menu; game links stay in the subnavbar. */}
          <div className="relative flex-shrink-0" ref={exploreRef}>
            <button
              type="button"
              onClick={() => {
                setIsTeamsOpen(false);
                setIsSettingsOpen(false);
                setIsUserMenuOpen(false);
                setIsExploreOpen((open) => !open);
              }}
              aria-expanded={isExploreOpen}
              aria-controls="authenticated-explore-menu"
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border-card)] bg-[var(--bg-card)] p-1.5 text-xs font-extrabold text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] sm:px-2.5"
            >
              <Compass className="h-4 w-4" />
              <span className="hidden lg:inline">Explorar</span>
              <ChevronDown className={`hidden h-3 w-3 transition-transform lg:block ${isExploreOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExploreOpen ? (
              <div id="authenticated-explore-menu" className="fixed inset-x-2 top-14 z-50 grid grid-cols-2 gap-1 rounded-2xl border border-[var(--border-card)] p-2 shadow-2xl glass-panel sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-1 sm:w-80">
                {exploreLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsExploreOpen(false)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex min-w-0 items-center gap-2 rounded-xl border p-2.5 transition-colors ${
                        isActive
                          ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan)]'
                          : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-heading)]'
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-black">{item.label}</span>
                        <span className="block truncate text-[9px] font-medium text-[var(--text-muted)]">{item.description}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* 3. Right Action Controls & User Profile Dropdown */}
          <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
            
            {/* eSports Real-time Notification Center Bell */}
            <NotificationCenter onOpen={() => {
              setIsTeamsOpen(false);
              setIsExploreOpen(false);
              setIsSettingsOpen(false);
              setIsUserMenuOpen(false);
            }} />

            {/* Settings Gear Dropdown */}
            <div className="relative" ref={settingsRef}>
              <button
                type="button"
                onClick={() => {
                  setIsTeamsOpen(false);
                  setIsExploreOpen(false);
                  setIsUserMenuOpen(false);
                  setIsSettingsOpen((open) => !open);
                }}
                aria-label="Abrir preferencias rápidas"
                aria-expanded={isSettingsOpen}
                aria-controls="player-preferences-menu"
                className="p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition-all shadow-sm"
                title="Configuración de Tema e Idioma"
              >
                <Settings className={`w-4 h-4 transition-transform duration-300 ${isSettingsOpen ? 'rotate-90 text-[var(--accent-cyan)]' : ''}`} />
              </button>

              {isSettingsOpen && (
                <div id="player-preferences-menu" className="management-popover fixed inset-x-2 top-14 sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:mt-1 sm:w-80 max-h-[85vh] overflow-y-auto rounded-2xl p-4 space-y-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="pb-2.5 border-b border-[var(--border-card)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)]/40 text-[var(--accent-cyan)]">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-[var(--text-heading)] tracking-wide block leading-none">Preferencias rápidas</span>
                        <span className="text-[9px] font-mono text-[var(--text-muted)] font-bold">Apariencia e idioma</span>
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

                  <Link
                    href="/cuenta/ajustes"
                    onClick={() => setIsSettingsOpen(false)}
                    className="management-profile-action border-[var(--border-card)] bg-[var(--bg-card)] text-xs font-bold"
                  >
                    <UserRoundCog className="w-4 h-4 text-[var(--accent-cyan)]" />
                    <span className="min-w-0 flex-1">
                      <strong className="block text-[var(--text-heading)]">Configuración de la cuenta</strong>
                      <small className="block truncate font-medium text-[var(--text-muted)]">Perfil, seguridad y datos personales</small>
                    </span>
                  </Link>
                </div>
              )}
            </div>

            {/* 👤 DESPLEGABLE DE PERFIL DE JUGADOR Y SESIÓN */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setIsTeamsOpen(false);
                  setIsExploreOpen(false);
                  setIsSettingsOpen(false);
                  setIsUserMenuOpen((open) => !open);
                }}
                aria-label="Abrir menú de usuario"
                aria-expanded={isUserMenuOpen}
                aria-controls="player-user-menu"
                className="flex items-center gap-2 p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-[var(--accent-cyan)] transition-all shadow-sm"
              >
                <Avatar fallback={currentUser?.name || 'User'} size="sm" status="online" />
                <div className="text-left hidden md:block leading-none">
                  <span className="text-xs font-black text-[var(--text-heading)] block truncate max-w-[110px]">
                    {currentUser?.gamertag}
                  </span>
                  <span className="text-[9px] text-[var(--accent-cyan)] font-mono font-bold">
                    ★ {currentUser?.rating || '9.8'}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-muted)] hidden md:block transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180 text-[var(--accent-cyan)]' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <div id="player-user-menu" className="management-popover fixed inset-x-2 top-14 sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:mt-1 sm:w-80 max-h-[85vh] overflow-y-auto rounded-2xl p-3 space-y-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  
                  {/* Profile Header Box */}
                  <div className="management-profile-card p-3 rounded-xl space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar fallback={currentUser?.name || 'User'} size="md" status="online" />
                      <div className="min-w-0">
                        <span className="font-black text-sm text-[var(--text-heading)] block truncate">
                          {currentUser?.name}
                        </span>
                        <span className="text-xs text-[var(--accent-cyan)] font-mono font-bold block truncate">
                          @{currentUser?.gamertag}
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] text-[var(--text-muted)]">{currentUser?.email}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] font-bold border-t border-[var(--border-card)]">
                      <Badge variant={isOrganizer ? 'emerald' : isCaptain ? 'violet' : 'cyan'}>
                        {currentUser?.role}
                      </Badge>

                      <span className="truncate text-right text-[var(--text-muted)] font-mono">
                        {currentUser?.platform} • {currentGameObj.name}
                      </span>
                    </div>
                    {myTeamInActiveDiscipline ? (
                      <div className="flex items-center justify-between gap-2 text-[10px]">
                        <span className="flex items-center gap-1 text-[var(--text-muted)]"><Shield className="size-3" /> Club activo</span>
                        <strong className="truncate text-[var(--text-secondary)]">{myTeamInActiveDiscipline.name}</strong>
                      </div>
                    ) : null}
                  </div>

                  {/* Navigation Links inside User Profile Menu */}
                  <div className="space-y-1 text-xs font-bold">
                    <Link
                      href="/cuenta/ajustes"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="management-profile-action"
                    >
                      <UserRoundCog className="w-4 h-4 text-[var(--accent-cyan)]" />
                      Configuración de la cuenta
                    </Link>

                    <Link
                      href={athleteProfileHref}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="management-profile-action"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[var(--accent-violet)]" />
                      Mi Ficha de Atleta
                    </Link>

                    <Link
                      href="/mensajes"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="management-profile-action"
                    >
                      <Mail className="w-4 h-4 text-[var(--accent-emerald)]" />
                      Centro de Mensajes
                    </Link>

                    {myTeamInActiveDiscipline && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsClubManageOpen(true);
                        }}
                        className="management-profile-action w-full text-left"
                      >
                        <SlidersHorizontal className="w-4 h-4 text-[var(--accent-violet)]" />
                        <span>Gestión rápida del club</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                        router.push('/login');
                      }}
                      className="w-full text-left flex items-center gap-2.5 p-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors border-t border-[var(--border-card)] mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Create Team Modal Dialog */}
      <CreateTeamModal
        isOpen={isCreateTeamOpen}
        defaultGameSlug={activeGameSlug}
        onClose={() => setIsCreateTeamOpen(false)}
        onSuccess={(team) => {
          router.push(`/${team.gameSlug}/equipos/${team.id}`);
        }}
      />

      {/* Club Management Modal Dialog Pre-Filtered for Active Discipline */}
      {myTeamInActiveDiscipline && (
        <ClubManagementModal
          team={myTeamInActiveDiscipline}
          isOpen={isClubManageOpen}
          onClose={() => setIsClubManageOpen(false)}
        />
      )}
    </>
  );
}
