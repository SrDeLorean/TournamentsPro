'use client';

import React, { useCallback, useState, useEffect, useTransition } from 'react';
import {
  X,
  Plus,
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
  Building2,
  Info,
  Sparkles,
  Lock,
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
  const [squadSearchQuery, setSquadSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [isLoadingSquad, setIsLoadingSquad] = useState(false);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [editingJerseyUserId, setEditingJerseyUserId] = useState<string | null>(null);
  const [jerseyInputValue, setJerseyInputValue] = useState<string>('');

  // Selected adding role & position per player
  const [playerAddingRole, setPlayerAddingRole] = useState<Record<string, 'Jugador' | 'Encargado' | 'DT / Analyst' | 'Capitán'>>({});
  const [playerAddingPos, setPlayerAddingPos] = useState<Record<string, string>>({});

  // Active sub-tab inside modal
  const [subTab, setSubTab] = useState<'squad' | 'add'>('squad');

  // Role permissions
  const isAdmin = currentUser?.role === 'Administrador';
  const isOrganizer = currentUser?.role === 'Organizador';
  const organizerOrgId = currentUser?.organizationId;
  const isOtherOrgTeam = isOrganizer && Boolean(team?.organization_id) && Boolean(organizerOrgId) && team?.organization_id !== organizerOrgId;
  const canManageSquad = isAdmin || !isOtherOrgTeam;

  const maxMembers = team?.max_members || 20;

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

  // Handle Add Player to Squad
  const handleAddPlayer = (player: AvailablePlayerData) => {
    if (!canManageSquad) {
      setFeedbackMsg({
        type: 'error',
        text: 'Solo el administrador o el organizador de esta asociación puede agregar jugadores a esta plantilla.',
      });
      return;
    }

    if (squad.length >= maxMembers) {
      setFeedbackMsg({
        type: 'error',
        text: `La plantilla ha alcanzado el límite máximo de ${maxMembers} jugadores.`,
      });
      return;
    }

    const chosenRole = playerAddingRole[player.id] || 'Jugador';
    const chosenPos = playerAddingPos[player.id] || player.position || 'DFC';

    setFeedbackMsg(null);
    startTransition(async () => {
      // Optimistic addition
      const optimisticMember: SquadMemberData = {
        id: `tm-${Date.now()}`,
        team_id: team.id,
        user_id: player.id,
        user_name: player.name,
        gamertag: player.gamertag,
        tactical_position: chosenPos,
        role_in_team: chosenRole,
        avatar_url: player.avatar_url || player.foto,
        organization_name: team.organization_name,
        joined_at: new Date().toISOString(),
      };
      setSquad((prev) => [...prev, optimisticMember]);
      setAvailablePlayers((prev) => prev.filter((p) => p.id !== player.id));

      const res = await addPlayerToSquadAction(team.id, player.id, chosenPos, chosenRole);
      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: `¡${player.name} (@${player.gamertag}) incorporado exitosamente como ${chosenRole}! (Salida limpia aplicada)`,
        });
        if (onRosterUpdated) onRosterUpdated();
        await loadData();
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'Error al incorporar jugador.' });
        await loadData();
      }
    });
  };

  // Handle Remove Player
  const handleRemovePlayer = (member: SquadMemberData) => {
    if (!canManageSquad) {
      setFeedbackMsg({
        type: 'error',
        text: 'No tienes permisos para remover jugadores de este club.',
      });
      return;
    }

    if (!confirm(`¿Estás seguro de desvincular a ${member.user_name} (@${member.gamertag}) de la plantilla de ${team.name}?`)) {
      return;
    }

    setFeedbackMsg(null);
    startTransition(async () => {
      // Optimistic removal
      setSquad((prev) => prev.filter((m) => m.user_id !== member.user_id));

      const res = await removePlayerFromSquadAction(team.id, member.user_id, team.organization_name || undefined);
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: `Jugador ${member.user_name} desvinculado de la plantilla.` });
        if (onRosterUpdated) onRosterUpdated();
        await loadData();
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'Error al desvincular jugador.' });
        await loadData();
      }
    });
  };

  // Handle Role Change
  const handleChangeRole = (member: SquadMemberData, newRole: 'Capitán' | 'Encargado' | 'DT / Analyst' | 'Jugador') => {
    if (!canManageSquad) return;
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

  // Handle Jersey Number Save
  const handleSaveJersey = (member: SquadMemberData) => {
    const val = jerseyInputValue.trim() === '' ? null : parseInt(jerseyInputValue, 10);
    if (val !== null && (isNaN(val) || val < 0 || val > 99)) {
      setFeedbackMsg({ type: 'error', text: 'El dorsal debe ser un número entre 0 y 99.' });
      return;
    }

    setEditingJerseyUserId(null);
    startTransition(async () => {
      setSquad((prev) =>
        prev.map((m) => (m.user_id === member.user_id ? { ...m, jersey_number: val } : m))
      );

      const res = await updateSquadMemberJerseyAction(member.id, val);
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: `Dorsal de ${member.user_name} guardado como #${val ?? 'S/N'}.` });
        if (onRosterUpdated) onRosterUpdated();
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'Error al guardar dorsal.' });
        await loadData();
      }
    });
  };

  // Filter squad in Tab 1
  const filteredSquad = squad.filter((m) => {
    if (!squadSearchQuery) return true;
    const q = squadSearchQuery.toLowerCase();
    return (
      m.user_name.toLowerCase().includes(q) ||
      m.gamertag.toLowerCase().includes(q) ||
      m.tactical_position.toLowerCase().includes(q) ||
      m.role_in_team.toLowerCase().includes(q)
    );
  });

  // Filter available players in Tab 2
  const filteredAvailablePlayers = availablePlayers.filter((p) => {
    if (positionFilter !== 'ALL' && p.position !== positionFilter) return false;
    return true;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Gestión de plantilla" size="xl" showCloseButton={false} className="p-0 flex flex-col overflow-hidden font-mono">
      {/* HEADER DEL MODAL */}
      <div className="p-5 sm:p-6 border-b border-[var(--border-card)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--bg-card)]">
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
                <Badge variant="violet" className="text-[10px] font-mono flex items-center gap-1">
                  <Building2 className="w-2.5 h-2.5" />
                  {team.organization_name}
                </Badge>
              )}
              {isAdmin ? (
                <Badge variant="gold" className="text-[10px] font-mono flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5" />
                  Admin Global
                </Badge>
              ) : isOrganizer ? (
                <Badge variant="emerald" className="text-[10px] font-mono flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" />
                  Organizador
                </Badge>
              ) : null}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs font-mono text-[var(--text-muted)]">
                Gestión Directa de Roster • <span className="text-[var(--accent-cyan)] font-bold">{squad.length} / {maxMembers}</span> Jugadores Registrados
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors self-end sm:self-auto"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* ALERTA DE MODO SOLO LECTURA SI ES ORGANIZADOR EN OTRA ORGANIZACIÓN */}
      {isOtherOrgTeam && (
        <div className="px-6 py-2.5 bg-amber-950/60 border-b border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <Lock className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>
            <strong>Modo Solo Lectura:</strong> Este club pertenece a la organización <em>{team.organization_name}</em>. Como organizador, solo puedes modificar plantillas de tu propia asociación.
          </span>
        </div>
      )}

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
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SUB-TABS DEL MODAL */}
      <div className="flex items-center justify-between px-6 pt-4 border-b border-[var(--border-card)] bg-[var(--bg-main)]/50">
        <div className="flex items-center gap-2">
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

          {canManageSquad && (
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
          )}
        </div>

        <span className="text-[11px] text-[var(--text-muted)] hidden md:inline-block font-mono">
          Límite: <strong className="text-cyan-400">{squad.length} / {maxMembers}</strong>
        </span>
      </div>

      {/* CONTENIDO DEL MODAL */}
      <div className="p-6 overflow-y-auto flex-1 space-y-6 max-h-[60vh]">
        {/* TAB 1: PLANTILLA INSCRITA ACTUALMENTE */}
        {subTab === 'squad' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <Input
                  placeholder="Filtrar integrantes por nombre, gamertag o posición..."
                  value={squadSearchQuery}
                  onChange={(e) => setSquadSearchQuery(e.target.value)}
                  className="pl-9 text-xs bg-[var(--bg-card)] border-[var(--border-card)]"
                />
              </div>

              {canManageSquad && squad.length < maxMembers && (
                <Button
                  size="sm"
                  onClick={() => setSubTab('add')}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Atleta</span>
                </Button>
              )}
            </div>

            {isLoadingSquad ? (
              <div className="p-10 text-center text-[var(--text-muted)] font-mono text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-cyan)]" />
                Cargando plantilla del equipo...
              </div>
            ) : filteredSquad.length === 0 ? (
              <div className="p-10 text-center rounded-2xl border border-dashed border-[var(--border-card)] text-[var(--text-muted)] font-mono text-xs space-y-2">
                <Users className="w-8 h-8 mx-auto text-[var(--text-muted)] opacity-50" />
                <p>
                  {squad.length === 0
                    ? 'No hay jugadores inscritos en esta escuadra actualmente.'
                    : 'No se encontraron integrantes que coincidan con la búsqueda.'}
                </p>
                {canManageSquad && squad.length === 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSubTab('add')}
                    className="text-xs font-mono text-[var(--accent-violet)] border-[var(--border-card)] mt-2"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    Buscar e Incorporar Jugadores
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredSquad.map((member) => {
                  const isCaptain = member.role_in_team === 'Capitán' || member.role_in_team === 'Capitan';
                  const isEditingJersey = editingJerseyUserId === member.user_id;

                  return (
                    <div
                      key={member.id}
                      className="p-3.5 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] flex flex-col justify-between gap-3 hover:border-[var(--accent-cyan)]/40 transition-all shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            fallback={member.user_name?.slice(0, 2).toUpperCase() || 'JG'}
                            src={member.avatar_url || member.foto || undefined}
                            size="md"
                            className="ring-1 ring-[var(--border-card)] flex-shrink-0"
                          />
                          <div className="min-w-0 space-y-0.5">
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
                            {member.organization_name && (
                              <p className="text-[10px] text-purple-400 font-bold truncate flex items-center gap-1">
                                <Building2 className="w-2.5 h-2.5" />
                                {member.organization_name}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Botón Quitar */}
                        {canManageSquad && (
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
                        )}
                      </div>

                      {/* Controles de Rol y Dorsal */}
                      <div className="pt-2 border-t border-[var(--border-card)]/60 flex items-center justify-between gap-2 text-[11px]">
                        {/* Selector de Rol */}
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <span className="text-[10px] text-[var(--text-muted)] uppercase font-mono">Rol:</span>
                          {canManageSquad ? (
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
                          ) : (
                            <span className="font-bold text-[var(--text-primary)]">{member.role_in_team}</span>
                          )}
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
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveJersey(member);
                                  if (e.key === 'Escape') setEditingJerseyUserId(null);
                                }}
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
                              disabled={!canManageSquad}
                              onClick={() => {
                                if (!canManageSquad) return;
                                setEditingJerseyUserId(member.user_id);
                                setJerseyInputValue(member.jersey_number !== null && member.jersey_number !== undefined ? String(member.jersey_number) : '');
                              }}
                              className={`px-2 py-0.5 rounded-md bg-[var(--bg-main)] border border-[var(--border-card)] text-[10px] font-mono flex items-center gap-1 ${
                                canManageSquad ? 'hover:border-[var(--accent-cyan)] text-[var(--text-muted)] hover:text-white cursor-pointer' : 'text-slate-500 cursor-default'
                              }`}
                              title={canManageSquad ? 'Editar número de dorsal' : 'Dorsal oficial'}
                            >
                              <Hash className="w-2.5 h-2.5" />
                              <span>{member.jersey_number !== null && member.jersey_number !== undefined ? `#${member.jersey_number}` : 'S/N'}</span>
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
        {subTab === 'add' && canManageSquad && (
          <div className="space-y-4">
            {/* INFO BANNER SOBRE SALIDA LIMPIA */}
            <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Incorporación Directa con Salida Limpia</p>
                <p className="text-[11px] text-purple-300/80 mt-0.5">
                  Al incorporar al atleta, se le desvinculará automáticamente de cualquier club previo en {team.game_slug.toUpperCase()} y se registrará formalmente bajo la Organización <strong>{team.organization_name || 'del club'}</strong>.
                </p>
              </div>
            </div>

            {/* FILTROS DE BÚSQUEDA Y POSICIÓN */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <Input
                  placeholder="Buscar jugador por nombre, gamertag o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-xs font-mono bg-[var(--bg-card)] border-[var(--border-card)] rounded-xl"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-mono">
                {['ALL', 'DC', 'MCO', 'MC', 'MCD', 'DFC', 'LD', 'LI', 'EI', 'ED', 'PO'].map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setPositionFilter(pos)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      positionFilter === pos
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-white border border-[var(--border-card)]'
                    }`}
                  >
                    {pos === 'ALL' ? 'TODAS' : pos}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] px-1">
              <span>Atletas disponibles ({filteredAvailablePlayers.length})</span>
              <span className="text-[var(--accent-emerald)]">Traspaso libre directo a la plantilla</span>
            </div>

            {isLoadingAvailable ? (
              <div className="p-10 text-center text-[var(--text-muted)] font-mono text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-violet)]" />
                Buscando atletas en el mercado...
              </div>
            ) : filteredAvailablePlayers.length === 0 ? (
              <div className="p-10 text-center rounded-2xl border border-dashed border-[var(--border-card)] text-[var(--text-muted)] font-mono text-xs space-y-2">
                <Search className="w-8 h-8 mx-auto text-[var(--text-muted)] opacity-50" />
                <p>No se encontraron jugadores disponibles para este criterio de búsqueda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
                {filteredAvailablePlayers.map((player) => {
                  const currentSelectedRole = playerAddingRole[player.id] || 'Jugador';
                  const currentSelectedPos = playerAddingPos[player.id] || player.position || 'DFC';

                  return (
                    <div
                      key={player.id}
                      className="p-3.5 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] flex flex-col justify-between gap-3 hover:border-purple-500/50 transition-all shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            fallback={player.name?.slice(0, 2).toUpperCase() || 'JG'}
                            src={player.avatar_url || player.foto || undefined}
                            size="md"
                            className="ring-1 ring-purple-500/30 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-extrabold text-[var(--text-heading)] truncate max-w-[140px] block uppercase">
                              {player.name}
                            </span>
                            <p className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                              @{player.gamertag}
                            </p>
                          </div>
                        </div>

                        <Badge variant="cyan" className="text-[10px] font-mono">
                          {player.position || 'DFC'}
                        </Badge>
                      </div>

                      {/* Selectores de Posición y Rol al Fichar */}
                      <div className="pt-2 border-t border-[var(--border-card)]/60 flex items-center justify-between gap-2 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[var(--text-muted)] uppercase">Rol:</span>
                          <select
                            value={currentSelectedRole}
                            onChange={(e) =>
                              setPlayerAddingRole((prev) => ({
                                ...prev,
                                [player.id]: e.target.value as any,
                              }))
                            }
                            className="bg-[var(--bg-main)] text-[var(--text-heading)] border border-[var(--border-card)] rounded-md px-1.5 py-0.5 text-[10px] font-mono focus:outline-none"
                          >
                            <option value="Jugador">Jugador</option>
                            <option value="Encargado">Encargado</option>
                            <option value="DT / Analyst">DT</option>
                            <option value="Capitán">👑 Capitán</option>
                          </select>
                        </div>

                        <Button
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleAddPlayer(player)}
                          className="bg-purple-600 hover:bg-purple-500 text-white font-mono text-[11px] font-bold px-3 py-1 rounded-xl gap-1 shadow-md flex-shrink-0"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Incorporar</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER DEL MODAL */}
      <div className="p-4 border-t border-[var(--border-card)] bg-[var(--bg-card)] flex items-center justify-between">
        <div className="text-[11px] text-[var(--text-muted)] font-mono flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            {isAdmin
              ? '👑 Modo Administrador: Acceso a todas las organizaciones.'
              : isOrganizer
              ? '🛡️ Modo Organizador: Acceso limitado a equipos de tu organización.'
              : '⚽ Modo Capitán del Club.'}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] border-[var(--border-card)]"
        >
          Cerrar Ventana
        </Button>
      </div>
    </Modal>
  );
}

