'use client';

import React, { useCallback, useState, useEffect, useTransition } from 'react';
import {
  X,
  UserPlus,
  UserMinus,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Modal } from '@/components/ui/modal';
import {
  getTeamSquadAction,
  getAvailablePlayersForSquadAction,
  addPlayerToSquadAction,
  removePlayerFromSquadAction,
  SquadMemberData,
  AvailablePlayerData,
} from '@/app/actions/squads';

import { useAuth } from '@/components/providers/auth-provider';

interface SquadRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: {
    id: string;
    name: string;
    tag: string;
    game_slug: string;
    members_count?: number;
    max_members?: number;
    logo_text?: string;
    logo_url?: string;
    organization_id?: string | null;
  } | null;
  onRosterUpdated?: () => void;
}

export function SquadRosterModal({ isOpen, onClose, team, onRosterUpdated }: SquadRosterModalProps) {
  const { currentUser } = useAuth();
  const [squad, setSquad] = useState<SquadMemberData[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<AvailablePlayerData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingSquad, setIsLoadingSquad] = useState(false);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Active sub-tab inside modal
  const [subTab, setSubTab] = useState<'squad' | 'add'>('squad');

  // Load current squad & available players
  const loadData = useCallback(async () => {
    if (!team) return;
    setIsLoadingSquad(true);
    setIsLoadingAvailable(true);

    const [squadRes, availRes] = await Promise.all([
      getTeamSquadAction(team.id),
      getAvailablePlayersForSquadAction(team.id, searchQuery, currentUser?.id),
    ]);

    if (squadRes.success && squadRes.squad) {
      setSquad(squadRes.squad);
    }
    setIsLoadingSquad(false);

    if (availRes.success && availRes.players) {
      setAvailablePlayers(availRes.players);
    }
    setIsLoadingAvailable(false);
  }, [currentUser?.id, searchQuery, team]);

  useEffect(() => {
    if (!isOpen || !team) return;
    const timer = setTimeout(() => void loadData(), searchQuery ? 300 : 0);

    return () => clearTimeout(timer);
  }, [isOpen, loadData, searchQuery, team]);

  if (!isOpen || !team) return null;

  const handleAddPlayer = (player: AvailablePlayerData) => {
    setFeedbackMsg(null);
    startTransition(async () => {
      const res = await addPlayerToSquadAction(team.id, player.id, player.position, 'Jugador');
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: `Jugador ${player.name} (${player.gamertag}) agregado a la escuadra.` });
        await loadData();
        if (onRosterUpdated) onRosterUpdated();
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'Error al agregar jugador.' });
      }
    });
  };

  const handleRemovePlayer = (member: SquadMemberData) => {
    setFeedbackMsg(null);
    startTransition(async () => {
      const res = await removePlayerFromSquadAction(team.id, member.user_id);
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: `Jugador ${member.user_name} removido de la escuadra.` });
        await loadData();
        if (onRosterUpdated) onRosterUpdated();
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'Error al remover jugador.' });
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Gestión de plantilla" size="xl" showCloseButton={false} className="p-0 flex flex-col overflow-hidden font-mono">
        {/* HEADER DEL MODAL */}
        <div className="p-5 sm:p-6 border-b border-[var(--border-card)] flex items-center justify-between bg-[var(--bg-card)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--bg-main)] border-2 border-[var(--accent-cyan)]/40 flex items-center justify-center text-[var(--accent-cyan)] font-black text-lg shadow-xl">
              {team.tag || team.name.slice(0, 3).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black uppercase text-[var(--text-heading)] tracking-wider">{team.name}</h2>
                <Badge variant="cyan" className="text-[10px] font-mono">
                  {team.game_slug.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
                Gestión Directa de Roster • {squad.length} / {team.max_members || 18} Jugadores Registrados
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* MENSAGE ALERTA FEEDBACK */}
        {feedbackMsg && (
          <div
            className={`px-6 py-3 text-xs font-mono font-bold flex items-center justify-between border-b ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-950/70 text-rose-300 border-rose-500/40'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* SUB-TABS DEL MODAL */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-[var(--border-card)] bg-[var(--bg-main)]/50">
          <button
            onClick={() => setSubTab('squad')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-black transition-all flex items-center gap-2 border-b-2 ${
              subTab === 'squad'
                ? 'border-[var(--accent-cyan)] text-[var(--accent-cyan)] bg-[var(--bg-card)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>1. Plantilla Inscrita ({squad.length})</span>
          </button>

          <button
            onClick={() => setSubTab('add')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-black transition-all flex items-center gap-2 border-b-2 ${
              subTab === 'add'
                ? 'border-[var(--accent-violet)] text-[var(--accent-violet)] bg-[var(--bg-card)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>2. Agregar Jugadores Disponibles al Equipo</span>
          </button>
        </div>

        {/* CONTENIDO DEL MODAL */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: PLANTILLA INSCRITA ACTUALMENTE */}
          {subTab === 'squad' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider font-bold">
                  Jugadores registrados en la plantilla de {team.name}
                </span>
              </div>

              {isLoadingSquad ? (
                <div className="p-8 text-center text-[var(--text-muted)] font-mono text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-cyan)]" />
                  Cargando plantilla del equipo...
                </div>
              ) : squad.length === 0 ? (
                <div className="p-10 text-center rounded-2xl border border-dashed border-[var(--border-card)] text-[var(--text-muted)] font-mono text-xs space-y-2">
                  <Users className="w-8 h-8 mx-auto text-[var(--text-muted)]" />
                  <p>No hay jugadores inscritos en esta escuadra actualmente.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSubTab('add')}
                    className="text-xs font-mono text-[var(--accent-violet)] border-[var(--border-card)] mt-2"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    Buscar y Agregar Jugadores
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {squad.map((member) => (
                    <div
                      key={member.id}
                      className="p-3.5 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] flex items-center justify-between gap-3 hover:border-[var(--accent-cyan)]/50 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          fallback={member.user_name?.slice(0, 2).toUpperCase() || 'JG'}
                          size="md"
                          className="ring-1 ring-[var(--border-card)]"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-[var(--text-heading)] truncate max-w-[140px]">
                              {member.user_name}
                            </span>
                            <Badge
                              variant={member.role_in_team === 'Capitan' || member.role_in_team === 'Capitán' ? 'gold' : member.role_in_team === 'Encargado' ? 'violet' : 'cyan'}
                              className="text-[9px] font-mono uppercase py-0 px-1.5"
                            >
                              {member.role_in_team}
                            </Badge>
                          </div>
                          <p className="text-[11px] font-mono text-[var(--text-muted)]">
                            @{member.gamertag} • Posición: <span className="text-[var(--accent-cyan)] font-bold">{member.tactical_position}</span>
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => handleRemovePlayer(member)}
                        className="text-[var(--accent-crimson)] hover:bg-[var(--accent-crimson-bg)] p-2 rounded-xl text-xs font-mono transition-colors"
                        title="Quitar del equipo"
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AGREGAR JUGADORES DISPONIBLES AL EQUIPO */}
          {subTab === 'add' && (
            <div className="space-y-4">
              {/* FILTRO DE BÚSQUEDA */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <Input
                  placeholder="Buscar jugador por nombre, gamertag, posición o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-xs font-mono input-theme rounded-xl"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] px-1">
                <span>Jugadores disponibles sin equipo ({availablePlayers.length})</span>
                <span className="text-[var(--accent-gold)]">Se excluyen jugadores asociados a otros clubes</span>
              </div>

              {isLoadingAvailable ? (
                <div className="p-8 text-center text-[var(--text-muted)] font-mono text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-violet)]" />
                  Buscando jugadores libres en el sistema...
                </div>
              ) : availablePlayers.length === 0 ? (
                <div className="p-10 text-center rounded-2xl border border-dashed border-[var(--border-card)] text-[var(--text-muted)] font-mono text-xs space-y-2">
                  <Search className="w-8 h-8 mx-auto text-[var(--text-muted)]" />
                  <p>No se encontraron jugadores libres que coincidan con la búsqueda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
                  {availablePlayers.map((player) => (
                    <div
                      key={player.id}
                      className="p-3.5 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] flex items-center justify-between gap-3 hover:border-[var(--accent-violet)]/50 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          fallback={player.name?.slice(0, 2).toUpperCase() || 'JG'}
                          size="md"
                          className="ring-1 ring-[var(--border-card)]"
                        />
                        <div>
                          <span className="text-xs font-extrabold text-[var(--text-heading)] truncate max-w-[140px] block">
                            {player.name}
                          </span>
                          <p className="text-[11px] font-mono text-[var(--text-muted)]">
                            @{player.gamertag} • <span className="text-[var(--accent-violet)] font-bold">{player.position}</span>
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleAddPlayer(player)}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-mono text-[11px] font-bold px-3 py-1.5 rounded-xl gap-1 shadow-md"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Agregar</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER DEL MODAL */}
        <div className="p-4 border-t border-[var(--border-card)] bg-[var(--bg-card)] flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] border-[var(--border-card)]">
            Cerrar Ventana
          </Button>
        </div>
    </Modal>
  );
}
