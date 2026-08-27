'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { GAMES_CATALOG } from '@/lib/games-data';
import { GameLogo } from '@/components/ui/game-logo';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Trophy, Shield, Users, MessageSquare, LogOut, Sparkles, ExternalLink, ArrowRight, Activity, Gamepad2, ChevronRight
} from 'lucide-react';

import { AdminDashboardView } from '@/components/admin/admin-dashboard-view';
import { OrganizerDashboardView } from '@/components/organizer/organizer-dashboard-view';

export default function DashboardPage() {
  const { currentUser, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  // Protect Dashboard Route: If not authenticated, redirect to /login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-heading)]">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-[var(--accent-cyan)] animate-spin" />
          <span className="font-extrabold text-sm uppercase">Cargando Panel eSports...</span>
        </div>
      </div>
    );
  }

  // Requirement 1 & 2: Role-based Dashboard Views
  if (currentUser.role === 'Administrador') {
    return <AdminDashboardView />;
  }

  if (currentUser.role === 'Organizador') {
    return <OrganizerDashboardView />;
  }

  const gameObj = GAMES_CATALOG[currentUser.primaryGame] || GAMES_CATALOG['eafc26'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-300">
      
      {/* 🚀 Top Dashboard Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[var(--border-card)] shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Glow Ambient Sphere */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-cyan-500/20 via-purple-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="flex items-center gap-5 relative z-10">
          <Avatar fallback={currentUser.name} size="xl" status="online" />

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge variant={currentUser.role === 'Capitán' ? 'violet' : 'cyan'}>
                {currentUser.role}
              </Badge>

              <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-slate-900 border border-slate-700 text-slate-200">
                {currentUser.platform}
              </span>

              <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-0.5">
                ★ {currentUser.rating}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black uppercase text-[var(--text-heading)] tracking-tight">
              {currentUser.name}
            </h1>

            <p className="text-xs font-mono text-[var(--accent-cyan)] font-extrabold">
              Gamertag Oficial: {currentUser.gamertag}
            </p>
          </div>
        </div>

        {/* Dashboard Actions */}
        <div className="flex items-center gap-3 relative z-10 flex-wrap">
          <Link href="/mensajes">
            <Button className="font-bold text-xs bg-[var(--accent-cyan)] text-slate-950 hover:opacity-90 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Mensajes Directos
            </Button>
          </Link>

          <Button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            variant="outline"
            className="font-bold text-xs text-rose-400 border-rose-500/40 hover:bg-rose-500/10 flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

      {/* 📊 Main Stats & Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Active Game & Role */}
        <Card className="glass-panel p-6 space-y-4 border border-[var(--border-card)] shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[var(--text-muted)] flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4 text-[var(--accent-cyan)]" />
              Disciplina Principal
            </span>
            <GameLogo game={gameObj} size="sm" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-[var(--text-heading)] uppercase">{gameObj.name}</h3>
            <p className="text-xs text-[var(--text-secondary)]">{gameObj.category}</p>
          </div>

          <div className="pt-2 border-t border-[var(--border-card)] space-y-1 text-xs font-semibold">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Posición Táctica:</span>
              <span className="text-[var(--accent-cyan)] font-bold font-mono">{currentUser.position}</span>
            </div>
            {currentUser.rankBadge && (
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Rango / Nivel:</span>
                <span className="text-amber-400 font-bold font-mono">{currentUser.rankBadge}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Card 2: Club Membership */}
        <Card className="glass-panel p-6 space-y-4 border border-[var(--border-card)] shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[var(--text-muted)] flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-purple-400" />
              Estado de Escuadra
            </span>
            <Badge variant={currentUser.teamName ? 'cyan' : 'gold'}>
              {currentUser.status}
            </Badge>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-[var(--text-heading)] uppercase">
              {currentUser.teamName || 'Agencia Libre'}
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              {currentUser.teamName
                ? 'Perteneces a una plantilla competitiva verificada'
                : 'Disponible para ofertas y pruebas de reclutamiento'}
            </p>
          </div>

          <div className="pt-2 border-t border-[var(--border-card)]">
            {currentUser.teamId ? (
              <Link href={`/${currentUser.primaryGame}/equipos/${currentUser.teamId}`}>
                <Button variant="outline" size="sm" className="w-full font-bold text-xs flex items-center justify-center gap-1.5">
                  Ver Ficha de Mi Club
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </Link>
            ) : (
              <Link href={`/${currentUser.primaryGame}/traspasos`}>
                <Button size="sm" className="w-full font-bold text-xs bg-amber-500 text-slate-950 flex items-center justify-center gap-1.5">
                  Explorar Agencia Libre
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </Card>

        {/* Card 3: Quick Tournaments & Circuit Access */}
        <Card className="glass-panel p-6 space-y-4 border border-[var(--border-card)] shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[var(--text-muted)] flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              Campeonatos & Ligas
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">Circuito 2026</span>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-[var(--text-heading)] uppercase">Torneos Inscriptos</h3>
            <p className="text-xs text-[var(--text-secondary)]">Consulta los fixtures, calendarios de partidos y clasificaciones</p>
          </div>

          <div className="pt-2 border-t border-[var(--border-card)]">
            <Link href={`/${currentUser.primaryGame}/competencias`}>
              <Button variant="outline" size="sm" className="w-full font-bold text-xs flex items-center justify-center gap-1.5">
                Ver Torneos de {gameObj.name}
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* 🚀 Quick Navigation Shortcut Grid */}
      <div className="glass-panel p-6 rounded-2xl border border-[var(--border-card)] space-y-4">
        <h3 className="text-base font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
          <Activity className="w-5 h-5 text-[var(--accent-cyan)]" />
          Accesos Rápidos al Portal eSports
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link href="/usuarios" className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] hover:border-[var(--accent-cyan)] transition-all space-y-1 group">
            <Users className="w-5 h-5 text-[var(--accent-cyan)] group-hover:scale-110 transition-transform" />
            <h4 className="font-extrabold text-xs text-[var(--text-heading)] uppercase">Directorio Atletas</h4>
            <p className="text-[10px] text-[var(--text-muted)]">Ver lista de usuarios</p>
          </Link>

          <Link href="/equipos" className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] hover:border-[var(--accent-cyan)] transition-all space-y-1 group">
            <Shield className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
            <h4 className="font-extrabold text-xs text-[var(--text-heading)] uppercase">Directorio Clubes</h4>
            <p className="text-[10px] text-[var(--text-muted)]">Ver todos los equipos</p>
          </Link>

          <Link href="/mensajes" className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] hover:border-[var(--accent-cyan)] transition-all space-y-1 group">
            <MessageSquare className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <h4 className="font-extrabold text-xs text-[var(--text-heading)] uppercase">Centro de Mensajes</h4>
            <p className="text-[10px] text-[var(--text-muted)]">Chat directo activo</p>
          </Link>

          <Link href={`/${currentUser.primaryGame}/traspasos`} className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] hover:border-[var(--accent-cyan)] transition-all space-y-1 group">
            <Sparkles className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <h4 className="font-extrabold text-xs text-[var(--text-heading)] uppercase">Mercado Fichajes</h4>
            <p className="text-[10px] text-[var(--text-muted)]">Publicar u ofertar</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
