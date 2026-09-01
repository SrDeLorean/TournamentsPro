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
  Crown,
  Shield,
  Award,
  Hash,
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
  updateSquadMemberRoleAction,
  updateSquadMemberJerseyAction,
  transferCaptaincyAction,
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
    organization_name?: string | null;
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
  const [editingJerseyUserId, setEditingJerseyUserId] = useState<string | null>(null);
  const [jerseyInputValue, setJerseyInputValue] = useState<string>('');

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
      // Optimistic addition
      const optimisticMember: SquadMemberData = {
        id: `tm-${Date.now()}`,
        team_id: team.id,
        user_id: player.id,
        user_name: player.name,
        gamertag: player.gamertag,
        tactical_position: player.position || 'DFC',
        role_in_team: 'Jugador',
        avatar_url: player.avatar_url || player.foto,
        joined_at: new Date().toISOString(),
      };
      setSquad((prev) => [...prev, optimisticMember]);
      setAvailablePlayers((prev) => prev.filter((p) => p.id !== player.id));

      const res = await addPlayerToSquadAction(team.id, player.id, player.position, 'Jugador');
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: `Jugador ${player.name} (@${player.gamertag}) agregado a la escuadra.` });
        if (onRosterUpdated) onRosterUpdated();
        await loadData();
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'Error al agregar jugador.' });
        await loadData();
      }
    });
  };

  const handleRemovePlayer = (member: SquadMemberData) => {
    setFeedbackMsg(null);
    startTransition(async () => {
      // Optimistic removal
      setSquad((prev) => prev.filter((m) => m.user_id !== member.user_id));

      const res = await removePlayerFromSquadAction(team.id, member.user_id);
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: `Jugador ${member.user_name} desvinculado de la escuadra.` });
        if (onRosterUpdated) onRosterUpdated();
        await loadData();
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'Error al remover jugador.' });
        await loadData();
      }
    });
  };

  const handleChangeRole = (member: SquadMemberData, newRole: 'Capitán' | 'Encargado' | 'DT / Analyst' | 'Jugador') => {
    if (member.role_in_team === newRole) return;
    setFeedbackMsg(null);

    startTransition(async () => {
      // Optimistic update
      setSquad((prev) =>
        prev.map((m) => {
          if (m.user_id === member.user_id) {
            return { ...m, role_in_team: newRole };
          }
          if (newRole === 'Capitán' && (m.role_in_team === 'Capitán' || m.role_in_team === 'Capitan')) {
            return { ...m, role_in_team: 'Encargado' };
          }
          return m;
        })
      );

      const res = newRole === 'Capitán'
        ? await transferCaptaincyAction(team.id, member.user_id)
        : await updateSquadMemberRoleAction(team.id, member.user_id, newRole);

      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: newRole === 'Capitán'
            ? `👑 Capitanía transferida exitosamente a ${member.user_name}.`
            : `Rol de ${member.user_name} actualizado a "${newRole}".`,
        });
        if (onRosterUpdated) onRosterUpdated();
        await loadData();
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'Error al cambiar rol.' });
        await loadData();
      }
    });
  };

  const handleSaveJersey = (member: SquadMemberData) => {
    const parsedNumber = parseInt(jerseyInputValue, 10);
    const validJersey = !isNaN(parsedNumber) && parsedNumber >= 0 && parsedNumber <= 99 ? parsedNumber : null;

    setEditingJerseyUserId(null);
    startTransition(async () => {
      setSquad((prev) =>
        prev.map((m) => (m.user_id === member.user_id ? { ...m, jersey_number: validJersey } : m))
      );

      const res = await updateSquadMemberJerseyAction(member.id, validJersey);
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: `Dorsal de ${member.user_name} actualizado a #${validJersey ?? '--'}.` });
        if (onRosterUpdated) onRosterUpdated();
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'Error al guardar dorsal.' });
        await loadData();
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Gestión de plantilla" size="xl" showCloseButton={false} className="p-0 flex flex-col overflow-hidden font-mono">
      {/* HEADER DEL MODAL */}
      <div className="p-5 sm:p-6 border-b border-[var(--border-card)] flex items-center justify-between bg-[var(--bg-card)]">
        <div className="flex items-center gap-3">
          <Avatar
            fallback={team.tag || team.name.slice(0, 3).toUpperCase()}
            src={team.logo_url}
            size="md"
            className="ring-2 ring-[var(--accent-cyan)]/40"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black uppercase text-[var(--text-heading)] tracking-wider">{team.name}</h2>
              <Badge variant="cyan" className="text-[10px] font-mono">
                {team.game_slug.toUpperCase()}
              </Badge>
              {team.organization_name && (
                <Badge variant="violet" className="text-[10px] font-mono">
                  {team.organization_name}
                </Badge>
              )}
            </div>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
              Gestión Directa de Roster • {squad.length} / {team.max_members || 20} Jugadores Registrados
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

      {/* MENSAJE ALERTA FEEDBACK */}
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
          <span>2. Incorporar Jugadores</span>
        </button>
      </div>

      {/* CONTENIDO DEL MODAL */}
      <div className="p-6 overflow-y-auto flex-1 space-y-6 max-h-[60vh]">
        {/* TAB 1: PLANTILLA INSCRITA ACTUALMENTE */}
        {subTab === 'squad' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider font-bold">
                Integrantes Oficiales de {team.name}
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
                  Buscar e Incorporar Jugadores
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {squad.map((member) => {
                  const isCaptain = member.role_in_team === 'Capitán' || member.role_in_team === 'Capitan';
                  const isEditingJersey = editingJerseyUserId === member.user_id;

                  return (
                    <div
                      key={member.id}
                      className="p-3.5 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] flex flex-col justify-between gap-3 hover:border-[var(--accent-cyan)]/40 transition-all shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            fallback={member.user_name?.slice(0, 2).toUpperCase() || 'JG'}
                            src={member.avatar_url || member.foto || undefined}
                            size="md"
                            className="ring-1 ring-[var(--border-card)] flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-extrabold text-[var(--text-heading)] truncate max-w-[130px]">
                                {member.user_name}
                              </span>
                              {isCaptain ? (
                                <Badge variant="gold" className="text-[9px] font-mono uppercase py-0 px-1.5 flex items-center gap-1">
                                  <Crown className="w-2.5 h-2.5" /> Capitán
                                </Badge>
                              ) : member.role_in_team === 'Encargado' ? (
                                <Badge variant="violet" className="text-[9px] font-mono uppercase py-0 px-1.5 flex items-center gap-1">
                                  <Shield className="w-2.5 h-2.5" /> Encargado
                                </Badge>
                              ) : member.role_in_team === 'DT / Analyst' ? (
                                <Badge variant="gold" className="text-[9px] font-mono uppercase py-0 px-1.5 flex items-center gap-1">
                                  <Award className="w-2.5 h-2.5" /> DT
                                </Badge>
                              ) : (
                                <Badge variant="cyan" className="text-[9px] font-mono uppercase py-0 px-1.5">
                                  Jugador
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                              @{member.gamertag} • Pos: <span className="text-[var(--accent-cyan)] font-bold">{member.tactical_position}</span>
                            </p>
                          </div>
                        </div>

                        {/* Botón Quitar */}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() => handleRemovePlayer(member)}
                          className="text-[var(--accent-crimson)] hover:bg-[var(--accent-crimson-bg)] p-1.5 rounded-xl text-xs font-mono transition-colors flex-shrink-0"
                          title="Desvincular del equipo"
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Controles de Rol y Dorsal */}
                      <div className="pt-2 border-t border-[var(--border-card)]/60 flex items-center justify-between gap-2 text-[11px]">
                        {/* Selector de Rol */}
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <span className="text-[10px] text-[var(--text-muted)] uppercase font-mono">Rol:</span>
                          <select
                            disabled={isPending}
                            value={member.role_in_team === 'Capitan' ? 'Capitán' : member.role_in_team}
                            onChange={(e) => handleChangeRole(member, e.target.value as any)}
                            className="bg-[var(--bg-main)] text-[var(--text-heading)] border border-[var(--border-card)] rounded-lg px-2 py-0.5 text-[10px] font-mono focus:outline-none focus:border-[var(--accent-cyan)]"
                          >
                            <option value="Jugador">Jugador</option>
                            <option value="Encargado">Encargado</option>
                            <option value="DT / Analyst">DT / Analyst</option>
                            <option value="Capitán">👑 Capitán</option>
                          </select>
                        </div>

                        {/* Dorsal */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {isEditingJersey ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                max={99}
                                value={jerseyInputValue}
                                onChange={(e) => setJerseyInputValue(e.target.value)}
                                className="w-10 bg-[var(--bg-main)] text-white text-center rounded border border-[var(--accent-cyan)] text-[10px] py-0.5"
                                placeholder="#"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSaveJersey(member)}
                                className="text-[10px] p-1 h-6 bg-emerald-600/80 text-white rounded hover:bg-emerald-500"
                              >
                                OK
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingJerseyUserId(member.user_id);
                                setJerseyInputValue(member.jersey_number !== null && member.jersey_number !== undefined ? String(member.jersey_number) : '');
                              }}
                              className="px-2 py-0.5 rounded-md bg-[var(--bg-main)] hover:border-[var(--accent-cyan)] border border-[var(--border-card)] text-[10px] font-mono text-[var(--text-muted)] hover:text-white transition-colors flex items-center gap-1"
                              title="Editar número de dorsal"
                            >
                              <Hash className="w-2.5 h-2.5" />
                              <span>{member.jersey_number ? `#${member.jersey_number}` : 'Dorsal'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
              <span>Atletas disponibles ({availablePlayers.length})</span>
              <span className="text-[var(--accent-emerald)]">Traspaso libre directo a la plantilla</span>
            </div>

            {isLoadingAvailable ? (
              <div className="p-8 text-center text-[var(--text-muted)] font-mono text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-violet)]" />
                Buscando jugadores en el sistema...
              </div>
            ) : availablePlayers.length === 0 ? (
              <div className="p-10 text-center rounded-2xl border border-dashed border-[var(--border-card)] text-[var(--text-muted)] font-mono text-xs space-y-2">
                <Search className="w-8 h-8 mx-auto text-[var(--text-muted)]" />
                <p>No se encontraron jugadores que coincidan con la búsqueda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
                {availablePlayers.map((player) => (
                  <div
                    key={player.id}
                    className="p-3.5 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] flex items-center justify-between gap-3 hover:border-[var(--accent-violet)]/50 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        fallback={player.name?.slice(0, 2).toUpperCase() || 'JG'}
                        src={player.avatar_url || player.foto || undefined}
                        size="md"
                        className="ring-1 ring-[var(--border-card)] flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-extrabold text-[var(--text-heading)] truncate max-w-[140px] block">
                          {player.name}
                        </span>
                        <p className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                          @{player.gamertag} • <span className="text-[var(--accent-violet)] font-bold">{player.position}</span>
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleAddPlayer(player)}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-mono text-[11px] font-bold px-3 py-1.5 rounded-xl gap-1 shadow-md flex-shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Fichar</span>
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

