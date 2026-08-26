'use client';

import React from 'react';
import { GameConfig } from '@/lib/games-data';
import { UserProfile, TeamData } from '@/lib/data-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Shield } from 'lucide-react';

// ── Player Stats Section ────────────────────────────────────────────────────

export function PlayerStatsSection({ game }: { game: GameConfig }) {
  return (
    <div className="space-y-6 pt-3 sm:pt-4 animate-in fade-in duration-300">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <span className="text-xs text-slate-400 uppercase font-bold block">Partidos en {game.name}</span>
          <span className="text-2xl font-black text-white font-mono">28</span>
        </Card>
        <Card className="p-4 text-center">
          <span className="text-xs text-slate-400 uppercase font-bold block">Goles / Kills</span>
          <span className="text-2xl font-black text-emerald-400 font-mono">14</span>
        </Card>
        <Card className="p-4 text-center">
          <span className="text-xs text-slate-400 uppercase font-bold block">Asistencias</span>
          <span className="text-2xl font-black text-purple-400 font-mono">9</span>
        </Card>
        <Card className="p-4 text-center">
          <span className="text-xs text-slate-400 uppercase font-bold block">Premios MVP</span>
          <span className="text-2xl font-black text-amber-400 font-mono">5</span>
        </Card>
      </div>
    </div>
  );
}

import { NewUserOffersView } from '../user/new-user-offers';

export function PlayerOffersSection({ game }: { game: GameConfig }) {
  return (
    <div data-game-slug={game.slug} className="pt-3 sm:pt-4 animate-in fade-in duration-300">
      <NewUserOffersView />
    </div>
  );
}

// ── Club Dashboard Section ──────────────────────────────────────────────────

interface ClubDashboardSectionProps {
  game: GameConfig;
  team: TeamData | undefined;
  TeamProfileViewComponent: React.ComponentType<{ team: TeamData; brandColor?: string }>;
}

export function ClubDashboardSection({ game, team, TeamProfileViewComponent }: ClubDashboardSectionProps) {
  if (!team) {
    return (
      <Card className="p-8 text-center space-y-4 max-w-xl mx-auto border-purple-500/30">
        <Shield className="w-12 h-12 text-purple-400 mx-auto" />
        <h3 className="text-xl font-black uppercase text-white">Aún no tienes club en {game.name}</h3>
        <p className="text-xs text-slate-300">
          Funda tu propia escuadra eSports o únete a un club activo para habilitar el Dashboard oficial del equipo.
        </p>
        <Button
          onClick={() => {
            const createBtn = document.querySelector('[data-create-team-btn]') as HTMLElement;
            if (createBtn) createBtn.click();
          }}
          className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-black text-xs shadow-xl"
        >
          + Fundar Nueva Escuadra en {game.name}
        </Button>
      </Card>
    );
  }

  return <TeamProfileViewComponent team={team} brandColor={game.brandColor} />;
}

import { NewSquadManagementView } from './new-squad-management';

// ── Roster Section ──────────────────────────────────────────────────────────

export function RosterSection({ game }: { game: GameConfig }) {
  return (
    <div className="pt-3 sm:pt-4 animate-in fade-in duration-300">
      <NewSquadManagementView game={game} />
    </div>
  );
}

// ── Recruitment Section ─────────────────────────────────────────────────────

export function RecruitmentSection({ game }: { game: GameConfig }) {
  return (
    <div className="space-y-6 pt-3 sm:pt-4 animate-in fade-in duration-300">
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-base font-black uppercase text-white">Publicación de Vacantes ({game.name})</h3>
          <Button size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs">+ Publicar Vacante</Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs space-y-1">
            <Badge variant="cyan">DFC (Defensa Central)</Badge>
            <p className="text-slate-300">Búsqueda abierta para liga oficial.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Matchday Section ────────────────────────────────────────────────────────

export function MatchdaySection({ game, currentUser }: { game: GameConfig; currentUser: UserProfile | null }) {
  return (
    <div className="space-y-6 pt-3 sm:pt-4 animate-in fade-in duration-300">
      <Card className="p-6 space-y-4">
        <h3 className="text-base font-black uppercase text-white">Alineación Matchday ({game.name})</h3>
        <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase">{currentUser?.name} (#10)</span>
          <Badge variant="gold">TITULAR</Badge>
        </div>
      </Card>
    </div>
  );
}

// ── Game Data Section ───────────────────────────────────────────────────────

export function GameDataSection({ game }: { game: GameConfig }) {
  return (
    <div className="space-y-6 pt-3 sm:pt-4">
      <Card className="p-4 sm:p-6 shadow-xl">
        <div className="space-y-4 text-xs text-[var(--text-secondary)]">
          <div className="p-3.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-card)]">
            <h4 className="font-bold text-sm text-[var(--text-heading)] mb-1">Modalidad de Juego</h4>
            <p>{game.category}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-card)]">
            <h4 className="font-bold text-sm text-[var(--text-heading)] mb-1">Roles / Posiciones Válidas</h4>
            <p>{game.positions.join(' • ')}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-card)]">
            <h4 className="font-bold text-sm text-[var(--text-heading)] mb-1">Reglamento eSports</h4>
            <p>Normativa oficial de reporte de encuentros, tiempos de prórroga y desempates de la temporada.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Player Ficha CRUD Section ───────────────────────────────────────────────

export function PlayerFichaCrudSection({ currentUser }: { currentUser: UserProfile | null }) {
  return (
    <div className="space-y-6 pt-3 sm:pt-4 animate-in fade-in duration-300">
      <Card className="border-[var(--border-card)] p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-4">
          <div className="flex items-center gap-3">
            <Avatar fallback={currentUser?.name || 'User'} size="lg" status="online" />
            <div>
              <h3 className="text-xl font-black uppercase text-[var(--text-heading)]">{currentUser?.name}</h3>
              <span className="text-xs text-[var(--accent-cyan)] font-mono font-bold">@{currentUser?.gamertag}</span>
            </div>
          </div>
          <Badge variant="cyan">{currentUser?.role || 'Jugador'}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
          <div className="space-y-1.5">
            <label className="text-slate-400 uppercase">Nombre Completo:</label>
            <input type="text" defaultValue={currentUser?.name} className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white" />
          </div>
          <div className="space-y-1.5">
            <label className="text-slate-400 uppercase">Gamertag:</label>
            <input type="text" defaultValue={currentUser?.gamertag} className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white" />
          </div>
          <div className="space-y-1.5">
            <label className="text-slate-400 uppercase">Posición Preferida:</label>
            <input type="text" defaultValue={currentUser?.position || 'DFC'} className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white" />
          </div>
          <div className="space-y-1.5">
            <label className="text-slate-400 uppercase">Plataforma:</label>
            <input type="text" defaultValue={currentUser?.platform || 'PS5'} className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white" />
          </div>
        </div>

        <Button className="w-full font-black text-xs bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg">
          💾 GUARDAR CAMBIOS DE LA FICHA
        </Button>
      </Card>
    </div>
  );
}
