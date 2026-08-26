'use client';

import React, { useState } from 'react';
import { GameConfig } from '@/lib/games-data';
import { initialTeams } from '@/lib/data-store';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trophy, Award, Calendar, Sparkles, CheckCircle2, Shield, AlertCircle, Plus
} from 'lucide-react';

import { MatchReportModal } from '@/components/matches/match-report-modal';

interface TournamentHubViewProps {
  game: GameConfig;
  initialSection?: string;
}

interface ReportableMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  gameSlug: string;
  tournamentName: string;
}

export function TournamentHubView({ game, initialSection = 'competencias' }: TournamentHubViewProps) {
  const { currentUser } = useAuth();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedMatchForReport, setSelectedMatchForReport] = useState<ReportableMatch>();

  const [activeTab, setActiveTab] = useState<'TORNEOS' | 'POSICIONES' | 'BRACKETS' | 'FIXTURE' | 'INSCRIBIR'>(
    initialSection === 'clasificacion'
      ? 'POSICIONES'
      : initialSection === 'partidos'
      ? 'FIXTURE'
      : 'TORNEOS'
  );

  const [registeredNotice, setRegisteredNotice] = useState('');
  const [registeredTeamsCount, setRegisteredTeamsCount] = useState(12);

  // Teams registered in this game
  const myTeam = initialTeams.find(
    (t) =>
      t.gameSlug === game.slug &&
      (t.captainName.toLowerCase() === currentUser?.name?.toLowerCase() ||
        t.captainName.toLowerCase() === currentUser?.gamertag?.toLowerCase() ||
        t.id === currentUser?.teamId)
  );

  // Mock Tournaments for this discipline
  const tournament = {
    id: `tourn-${game.slug}`,
    name: `Liga Élite Pro ${game.name} 2026`,
    gameSlug: game.slug,
    format: game.slug === 'eafc26' ? '11v11' : game.slug === 'rocketleague' ? '3v3' : '5v5',
    maxTeams: 16,
    prizePool: '$1,500 USD + Trofeo Oficial',
    startDate: '1 de Agosto, 2026',
    status: 'RECLUTAMIENTO',
    description: `Circuito oficial de competición eSports para escuadras de ${game.name}. Formato de liga con fase de grupos y llaves de eliminatoria directa.`,
  };

  // Mock Standings Table
  const standings = [
    { rank: 1, team: 'SAN LORENZO ESP', pts: 28, pj: 10, pg: 9, pe: 1, pp: 0, gf: 24, gc: 5, dif: '+19', color: '#00F0FF' },
    { rank: 2, team: 'SANGRE NUEVA FC', pts: 24, pj: 10, pg: 7, pe: 3, pp: 0, gf: 20, gc: 8, dif: '+12', color: '#C084FC' },
    { rank: 3, team: 'HIGHFIELD XX', pts: 19, pj: 10, pg: 6, pe: 1, pp: 3, gf: 18, gc: 12, dif: '+6', color: '#F59E0B' },
    { rank: 4, team: 'VIPERX ESPORTS', pts: 16, pj: 10, pg: 5, pe: 1, pp: 4, gf: 15, gc: 14, dif: '+1', color: '#FF4655' },
    { rank: 5, team: 'CYBER ATHLETES', pts: 12, pj: 10, pg: 3, pe: 3, pp: 4, gf: 11, gc: 15, dif: '-4', color: '#10B981' },
  ];

  // Mock Fixture Matches
  const matches = [
    { id: 'm-101', home: 'SAN LORENZO ESP', homeLogo: 'SL', away: 'HIGHFIELD XX', awayLogo: 'HXX', score: '3 - 1', status: 'FINALIZADO', time: 'Ayer' },
    { id: 'm-102', home: 'SANGRE NUEVA FC', homeLogo: 'SN', away: 'VIPERX ESPORTS', awayLogo: 'VX', score: '2 - 0', status: 'FINALIZADO', time: 'Ayer' },
    { id: 'm-103', home: 'SAN LORENZO ESP', homeLogo: 'SL', away: 'SANGRE NUEVA FC', awayLogo: 'SN', score: 'vs', status: 'EN_VIVO', time: 'HORA ACTUAL' },
    { id: 'm-104', home: 'HIGHFIELD XX', homeLogo: 'HXX', away: 'CYBER ATHLETES', awayLogo: 'CA', score: 'vs', status: 'PROGRAMADO', time: 'Mañana 21:00' },
  ];

  const handleRegisterTeam = () => {
    if (!myTeam) return;
    setRegisteredTeamsCount((prev) => prev + 1);
    setRegisteredNotice(`¡Excelente! El club ${myTeam.name} ha sido inscrito exitosamente en la ${tournament.name}.`);
    setTimeout(() => setRegisteredNotice(''), 5000);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in pb-12">
      
      {/* Top Banner Hero */}
      <div
        className="w-full rounded-3xl p-6 sm:p-8 border backdrop-blur-xl space-y-4 shadow-2xl relative overflow-hidden"
        style={{
          backgroundColor: `color-mix(in srgb, ${game.brandColor} 15%, var(--bg-card))`,
          borderColor: `${game.brandColor}40`,
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="violet" className="font-mono font-bold uppercase">
                {game.name} PORTAL
              </Badge>
              <Badge variant="cyan" className="font-mono font-bold">
                {tournament.format} Format
              </Badge>
              <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" /> {tournament.prizePool}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black uppercase text-[var(--text-heading)] tracking-tight">
              {tournament.name}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium max-w-2xl">
              {tournament.description}
            </p>
          </div>

          {/* Direct CTA Action */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {myTeam ? (
              <Button
                onClick={() => setActiveTab('INSCRIBIR')}
                size="lg"
                className="font-black text-xs uppercase bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xl flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>Inscribir mi Club ({myTeam.name})</span>
              </Button>
            ) : (
              <Button
                onClick={() => setActiveTab('INSCRIBIR')}
                size="lg"
                className="font-black text-xs uppercase bg-[var(--accent-cyan)] text-slate-950 shadow-xl flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Club e Inscribirse</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {registeredNotice && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 font-bold text-xs flex items-center gap-3 animate-in fade-in shadow-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{registeredNotice}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs Strip */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none p-1.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)]">
        <button
          onClick={() => setActiveTab('TORNEOS')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'TORNEOS'
              ? 'bg-[var(--accent-cyan)] text-slate-950 shadow-md'
              : 'text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Torneos & Información</span>
        </button>

        <button
          onClick={() => setActiveTab('POSICIONES')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'POSICIONES'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Tabla de Posiciones</span>
        </button>

        <button
          onClick={() => setActiveTab('BRACKETS')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'BRACKETS'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Llaves de Eliminatoria (Brackets)</span>
        </button>

        <button
          onClick={() => setActiveTab('FIXTURE')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'FIXTURE'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Fixture & Partidos</span>
        </button>

        <button
          onClick={() => setActiveTab('INSCRIBIR')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'INSCRIBIR'
              ? 'bg-rose-500 text-white shadow-md'
              : 'text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Inscribir mi Club</span>
        </button>
      </div>

      {/* TAB 1: TORNEOS INFORMACIÓN */}
      {activeTab === 'TORNEOS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 glass-panel p-6 rounded-3xl border border-[var(--border-card)] space-y-4">
            <h3 className="text-lg font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Detalles del Circuito {tournament.name}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)]">
                <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Formato de Juego</span>
                <span className="font-extrabold text-sm text-[var(--text-heading)]">{tournament.format}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)]">
                <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Equipos Registrados</span>
                <span className="font-extrabold text-sm text-emerald-400">{registeredTeamsCount} / {tournament.maxTeams}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)]">
                <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Premio a Repartir</span>
                <span className="font-extrabold text-sm text-amber-400">{tournament.prizePool}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-black uppercase text-[var(--text-heading)]">Reglamento Oficial de Competición</h4>
              <ul className="text-xs text-[var(--text-secondary)] space-y-1.5 list-disc pl-4 font-medium">
                <li>Las plantillas se registran formalmente antes de la Fecha 1.</li>
                <li>Un jugador puede competir con su club en esta liga y en otro torneo con un club distinto sin conflicto.</li>
                <li>Los partidos se disputan en el horario pactado por los capitanes.</li>
              </ul>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-[var(--border-card)] space-y-4">
            <h3 className="text-sm font-black uppercase text-[var(--text-heading)]">Estado de Reclutamiento</h3>
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 space-y-2">
              <span className="text-xs font-black uppercase text-emerald-400 block">Inscripciones Abiertas</span>
              <p className="text-xs text-slate-300">
                Quedan <strong>{tournament.maxTeams - registeredTeamsCount} cupos disponibles</strong> para inscribir tu escuadra.
              </p>
              <Button onClick={() => setActiveTab('INSCRIBIR')} size="sm" className="w-full font-bold text-xs bg-emerald-500 text-slate-950 mt-2">
                Inscribir Club Ahora
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TABLA DE POSICIONES */}
      {activeTab === 'POSICIONES' && (
        <div className="glass-panel p-6 rounded-3xl border border-[var(--border-card)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              Tabla Oficial de Clasificación
            </h3>
            <Badge variant="violet">Fase de Liga</Badge>
          </div>

          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-card)] text-[10px] uppercase font-mono font-bold text-[var(--text-muted)]">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Club / Escuadra</th>
                  <th className="py-3 px-3 text-center">PTS</th>
                  <th className="py-3 px-3 text-center">PJ</th>
                  <th className="py-3 px-3 text-center">PG</th>
                  <th className="py-3 px-3 text-center">PE</th>
                  <th className="py-3 px-3 text-center">PP</th>
                  <th className="py-3 px-3 text-center">DIF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-card)]">
                {standings.map((row) => (
                  <tr key={row.team} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                    <td className="py-3 px-3 font-mono font-black text-amber-400">#{row.rank}</td>
                    <td className="py-3 px-3 font-extrabold text-[var(--text-heading)] flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[var(--bg-main)] border flex items-center justify-center text-[10px] font-black" style={{ borderColor: row.color, color: row.color }}>
                        {row.team.substring(0, 2)}
                      </div>
                      <span>{row.team}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-black text-sm text-[var(--accent-cyan)]">{row.pts}</td>
                    <td className="py-3 px-3 text-center font-bold text-[var(--text-secondary)]">{row.pj}</td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-400">{row.pg}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-400">{row.pe}</td>
                    <td className="py-3 px-3 text-center font-bold text-rose-400">{row.pp}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-purple-400">{row.dif}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LLAVES DE ELIMINATORIA (BRACKETS) */}
      {activeTab === 'BRACKETS' && (
        <div className="glass-panel p-6 rounded-3xl border border-[var(--border-card)] space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Llaves de Eliminatoria Directa (Playoffs)
            </h3>
            <Badge variant="cyan">Cuartos de Final</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center overflow-x-auto p-2">
            
            {/* CUARTOS */}
            <div className="space-y-4">
              <span className="text-xs font-black uppercase text-amber-400 block tracking-wider text-center">Cuartos de Final</span>
              
              <div className="p-3 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>🛡️ SAN LORENZO ESP</span>
                  <span className="font-mono text-emerald-400">3</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>🛡️ CYBER ATHLETES</span>
                  <span className="font-mono">1</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>🛡️ SANGRE NUEVA FC</span>
                  <span className="font-mono text-emerald-400">2</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>🛡️ VIPERX ESPORTS</span>
                  <span className="font-mono">0</span>
                </div>
              </div>
            </div>

            {/* SEMIFINAL */}
            <div className="space-y-4">
              <span className="text-xs font-black uppercase text-purple-400 block tracking-wider text-center">Semifinal</span>
              
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/40 space-y-2 shadow-lg">
                <div className="flex items-center justify-between text-xs font-black text-white">
                  <span>🛡️ SAN LORENZO ESP</span>
                  <span className="font-mono text-cyan-400">vs</span>
                </div>
                <div className="flex items-center justify-between text-xs font-black text-white">
                  <span>🛡️ SANGRE NUEVA FC</span>
                  <span className="font-mono text-cyan-400">vs</span>
                </div>
              </div>
            </div>

            {/* GRAN FINAL */}
            <div className="space-y-4">
              <span className="text-xs font-black uppercase text-emerald-400 block tracking-wider text-center">🏆 Gran Final</span>
              
              <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-center space-y-2 shadow-xl">
                <Trophy className="w-8 h-8 text-amber-400 mx-auto animate-bounce" />
                <span className="text-xs font-black text-white uppercase block">Por Definirse</span>
                <span className="text-[10px] text-emerald-300 font-mono font-bold block">Premio: {tournament.prizePool}</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 4: FIXTURE & CALENDARIO */}
      {activeTab === 'FIXTURE' && (
        <div className="glass-panel p-6 rounded-3xl border border-[var(--border-card)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Fixture & Partidos Programados
            </h3>
            <Badge variant="cyan">Fecha 4 de 14</Badge>
          </div>

          <div className="space-y-2.5">
            {matches.map((m) => (
              <div key={m.id} className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <Badge variant={m.status === 'EN_VIVO' ? 'rose' : m.status === 'FINALIZADO' ? 'slate' : 'violet'}>
                    {m.status}
                  </Badge>
                  <span className="text-[11px] text-[var(--text-muted)] font-mono">{m.time}</span>
                </div>

                <div className="flex items-center justify-center gap-4 font-black text-sm text-[var(--text-heading)]">
                  <div className="flex items-center gap-2">
                    <span>{m.home}</span>
                    <span className="w-6 h-6 rounded bg-[var(--bg-main)] border border-[var(--border-card)] text-[10px] flex items-center justify-center font-bold text-[var(--text-primary)]">{m.homeLogo}</span>
                  </div>
                  <span className="px-3 py-1 rounded bg-[var(--bg-main)] border border-[var(--border-card)] text-[var(--game-brand)] font-mono text-xs">{m.score}</span>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-[var(--bg-main)] border border-[var(--border-card)] text-[10px] flex items-center justify-center font-bold text-[var(--text-primary)]">{m.awayLogo}</span>
                    <span>{m.away}</span>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setSelectedMatchForReport({
                      id: m.id,
                      homeTeam: m.home,
                      awayTeam: m.away,
                      gameSlug: game.slug,
                      tournamentName: tournament.name,
                    });
                    setIsReportModalOpen(true);
                  }}
                  size="sm"
                  className="text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md"
                >
                  ⚽ Reportar Marcador
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: INSCRIBIR MI CLUB */}
      {activeTab === 'INSCRIBIR' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-emerald-500/40 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-[var(--border-card)] pb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 font-black text-xl shadow-xl">
              🛡️
            </div>
            <div>
              <h3 className="text-xl font-black uppercase text-[var(--text-heading)]">
                Inscripción de Escuadra a {tournament.name}
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Registra a tu club formalmente para participar en el circuito oficial de {game.name}
              </p>
            </div>
          </div>

          {myTeam ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-main)] border-2 flex items-center justify-center font-black text-xs transition-colors" style={{ borderColor: game.brandColor, color: game.brandColor }}>
                    {myTeam.logoText}
                  </div>
                  <div>
                    <span className="font-black text-sm text-[var(--text-heading)] block">{myTeam.name}</span>
                    <span className="text-xs text-[var(--text-secondary)] font-mono">Capitán: {myTeam.captainName} • {game.name}</span>
                  </div>
                </div>
                <Badge variant="emerald">Habilitado</Badge>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-2 text-xs shadow-inner">
                <span className="font-bold text-[var(--text-primary)] uppercase block">Regla de Elegibilidad de Plantilla:</span>
                <p className="text-[var(--text-secondary)]">
                  Al confirmar la inscripción, los integrantes inscritos en la plantilla de {myTeam.name} quedarán habilitados para la {tournament.name}.
                </p>
              </div>

              <Button
                onClick={handleRegisterTeam}
                size="lg"
                className="w-full font-black text-xs uppercase bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xl py-3.5 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirmar Inscripción Oficial de {myTeam.name}</span>
              </Button>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] text-center space-y-4 shadow-inner">
              <AlertCircle className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
              <div>
                <h4 className="text-sm font-black uppercase text-[var(--text-heading)]">No posees un club registrado en {game.name}</h4>
                <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto mt-1">
                  Para participar en este torneo debes ser Capitán o haber fundado un club en la disciplina de {game.name}.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ⚽ MODAL DE REPORTE DE RESULTADOS DE PARTIDOS */}
      <MatchReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        match={selectedMatchForReport}
      />
    </div>
  );
}
