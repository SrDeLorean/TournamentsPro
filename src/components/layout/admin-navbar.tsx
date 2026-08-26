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
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { shouldBypassImageOptimization } from '@/lib/image-utils';
import type { TeamData, UserProfile } from '@/lib/data-store';
import {
  Trophy, Shield, MessageSquare, LogOut, Settings, Plus, Sparkles, ChevronDown, LayoutDashboard, ArrowRightLeft, User, CheckCircle2
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isClubManageOpen, setIsClubManageOpen] = useState(false);

  const teamsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (teamsRef.current && !teamsRef.current.contains(event.target as Node)) {
        setIsTeamsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  return (
    <>
      <header className="dark sticky top-0 z-50 w-full bg-[#05070d]/90 border-b border-[var(--border-card)] backdrop-blur-xl transition-all duration-300 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-3">
          
          {/* 1. Left Brand & Admin Badge */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2 group">
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
                  Panel de Administración
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
          <div className="relative flex-shrink-0" ref={teamsRef}>
            <button
              onClick={() => setIsTeamsOpen(!isTeamsOpen)}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-purple-950 via-slate-950 to-slate-900 border border-purple-500/50 text-purple-300 hover:border-purple-400 transition-all flex items-center gap-2 shadow-lg hover:scale-[1.01]"
            >
              <div className="relative w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-slate-950 border border-purple-400 flex items-center justify-center font-black text-[10px] sm:text-xs text-purple-300 shadow-sm flex-shrink-0 overflow-hidden">
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
              <div className="flex flex-col text-left leading-none max-w-[100px] sm:max-w-[130px]">
                <span className="text-[11px] sm:text-xs font-black uppercase text-white truncate">
                  {myTeamInActiveDiscipline?.name || 'Agencia Libre'}
                </span>
                <span className="text-[8px] sm:text-[9px] text-[var(--accent-cyan)] font-mono font-bold uppercase mt-0.5 truncate">
                  {currentGameObj.name}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-purple-400 transition-transform duration-200 ${isTeamsOpen ? 'rotate-180' : ''}`} />
            </button>

            {isTeamsOpen && (
              <div className="fixed inset-x-2 top-14 sm:absolute sm:inset-auto sm:top-full sm:left-0 sm:w-80 max-h-[85vh] overflow-y-auto rounded-2xl glass-panel p-3 shadow-2xl border border-[var(--border-card)] space-y-3 z-50 animate-in fade-in zoom-in-95">
                <div className="pb-2 border-b border-[var(--border-card)] flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[var(--text-heading)] flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-purple-400" />
                    Seleccionar Club & Juego
                  </span>
                  <button
                    onClick={() => {
                      setIsTeamsOpen(false);
                      setIsCreateTeamOpen(true);
                    }}
                    className="text-[10px] font-bold text-[var(--accent-cyan)] hover:underline flex items-center gap-1"
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
                        className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all group text-left ${
                          isSelected
                            ? 'bg-[var(--accent-cyan-bg)] border-[var(--accent-cyan)]/50 shadow-md'
                            : 'bg-[var(--bg-main)] border-[var(--border-card)] hover:bg-[var(--bg-card-hover)]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <GameLogo game={gameItem} size="sm" />
                          <div>
                            <span className="font-extrabold text-xs text-[var(--text-heading)] block group-hover:text-[var(--accent-cyan)]">
                              {teamForGame ? teamForGame.name : `Agencia Libre`}
                            </span>
                            <span className="text-[10px] text-[var(--accent-cyan)] font-mono font-bold">
                              {gameItem.name} {teamForGame ? '• (Capitán)' : ''}
                            </span>
                          </div>
                        </div>

                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[var(--accent-cyan)]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. Navigation Items */}
          <nav className="hidden lg:flex items-center gap-2">
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                pathname === '/dashboard'
                  ? 'bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/40 shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-card-hover)]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </Link>

            {!isAdmin && (
              <Link
                href={`/${activeGameSlug}/traspasos`}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center gap-1.5"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Traspasos ({currentGameObj.name})
              </Link>
            )}

            <Link
              href="/mensajes"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                pathname === '/mensajes' ? 'text-[var(--accent-cyan)] font-extrabold' : 'text-[var(--text-secondary)]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              Mensajes
            </Link>
          </nav>

          {/* 3. Right Action Controls & User Profile Dropdown */}
          <div className="flex items-center gap-2">
            
            {/* If Captain -> Direct Club Management Button for Active Discipline */}
            {isCaptain && myTeamInActiveDiscipline && !isAdmin && (
              <Button
                onClick={() => setIsClubManageOpen(true)}
                size="sm"
                className="font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white shadow-md flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gestión de Club</span>
              </Button>
            )}

            {/* Create Club Button (Hidden for Admin) */}
            {!isAdmin && (
              <Button
                onClick={() => setIsCreateTeamOpen(true)}
                size="sm"
                className="font-bold text-xs bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-md flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Crear Club</span>
              </Button>
            )}

            {/* eSports Real-time Notification Center Bell */}
            <NotificationCenter />

            {/* Settings Gear Dropdown */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition-all shadow-sm"
                title="Configuración de Tema e Idioma"
              >
                <Settings className={`w-4 h-4 transition-transform duration-300 ${isSettingsOpen ? 'rotate-90 text-[var(--accent-cyan)]' : ''}`} />
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

            {/* 👤 DESPLEGABLE DE PERFIL DE JUGADOR Y SESIÓN */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
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
                <div className="fixed inset-x-2 top-14 sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:w-72 max-h-[85vh] overflow-y-auto rounded-2xl glass-panel p-4 shadow-2xl border border-[var(--border-card)] space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  
                  {/* Profile Header Box */}
                  <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-2">
                    <div className="flex items-center gap-3">
                      <Avatar fallback={currentUser?.name || 'User'} size="md" status="online" />
                      <div className="min-w-0">
                        <span className="font-black text-sm text-[var(--text-heading)] block truncate uppercase">
                          {currentUser?.name}
                        </span>
                        <span className="text-xs text-[var(--accent-cyan)] font-mono font-bold block truncate">
                          ID: {currentUser?.gamertag}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[10px] font-bold border-t border-[var(--border-card)]">
                      <Badge variant={isOrganizer ? 'emerald' : isCaptain ? 'violet' : 'cyan'}>
                        {currentUser?.role}
                      </Badge>

                      <span className="text-[var(--text-muted)] font-mono">
                        {currentUser?.platform} • {currentGameObj.name}
                      </span>
                    </div>
                  </div>

                  {/* Navigation Links inside User Profile Menu */}
                  <div className="space-y-1 text-xs font-bold">
                    <Link
                      href="/dashboard"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-card-hover)] transition-all"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[var(--accent-cyan)]" />
                      Mi Dashboard / Panel
                    </Link>

                    <Link
                      href="/usuarios"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-card-hover)] transition-all"
                    >
                      <User className="w-4 h-4 text-purple-400" />
                      Mi Ficha de Atleta
                    </Link>

                    <Link
                      href="/mensajes"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-card-hover)] transition-all"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      Centro de Mensajes
                    </Link>

                    {myTeamInActiveDiscipline && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsClubManageOpen(true);
                        }}
                        className="w-full text-left flex items-center gap-2.5 p-2 rounded-xl text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-all font-bold"
                      >
                        <Shield className="w-4 h-4 text-purple-400" />
                        <span>Opciones del Club (Gestión Capitán/Staff)</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                        router.push('/login');
                      }}
                      className="w-full text-left flex items-center gap-2.5 p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors pt-2 border-t border-[var(--border-card)] mt-1"
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
