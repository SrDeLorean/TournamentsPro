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
  Filter,
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
import { getAllOrganizationsAction } from '@/app/actions/organizations';
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

interface OrgOption {
  id: string;
  name: string;
  tag: string;
}

export function SquadRosterModal({ isOpen, onClose, team, onRosterUpdated }: SquadRosterModalProps) {
  const { currentUser } = useAuth();
  const [squad, setSquad] = useState<SquadMemberData[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<AvailablePlayerData[]>([]);
  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [squadSearchQuery, setSquadSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [clubFilter, setClubFilter] = useState<'ALL' | 'FREE' | 'WITH_CLUB'>('ALL');
  const [isLoadingSquad, setIsLoadingSquad] = useState(false);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [editingJerseyUserId, setEditingJerseyUserId] = useState<string | null>(null);
  const [jerseyInputValue, setJerseyInputValue] = useState<string>('');

  // Selected adding role, position, & organization per player
  const [playerAddingRole, setPlayerAddingRole] = useState<Record<string, 'Jugador' | 'Encargado' | 'DT / Analyst' | 'Capitán'>>({});
  const [playerAddingPos, setPlayerAddingPos] = useState<Record<string, string>>({});
  const [playerAddingOrg, setPlayerAddingOrg] = useState<Record<string, string>>({});

  // Active sub-tab inside modal
  const [subTab, setSubTab] = useState<'squad' | 'add'>('squad');

  // Role permissions
  const isAdmin = currentUser?.role === 'Administrador';
  const isOrganizer = currentUser?.role === 'Organizador';
  const organizerOrgId = currentUser?.organizationId;
  const isOtherOrgTeam = isOrganizer && Boolean(team?.organization_id) && Boolean(organizerOrgId) && team?.organization_id !== organizerOrgId;
  const canManageSquad = isAdmin || !isOtherOrgTeam;

  const maxMembers = team?.max_members || 20;

  // Load current squad, available players & organizations
  const loadData = useCallback(async () => {
    if (!team) return;
    setIsLoadingSquad(true);
    setIsLoadingAvailable(true);

    const [squadRes, availRes, orgsRes] = await Promise.all([
      getTeamSquadAction(team.id),
      getAvailablePlayersForSquadAction(team.id, searchQuery, currentUser?.id),
      getAllOrganizationsAction(),
    ]);

    if (squadRes.success && squadRes.squad) {
      setSquad(squadRes.squad);
    }
    setIsLoadingSquad(false);

    if (availRes.success && availRes.players) {
      setAvailablePlayers(availRes.players);
    }
    setIsLoadingAvailable(false);

    if (orgsRes.success && orgsRes.organizations) {
      setOrganizations(orgsRes.organizations);
    }
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

    if (isOrganizer && isOtherOrgTeam) {
      setFeedbackMsg({
        type: 'error',
        text: 'Como organizador, solamente puedes agregar jugadores a plantillas de tu propia organización.',
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
    const chosenOrgId = isAdmin
      ? (playerAddingOrg[player.id] || team.organization_id || player.organization_id || organizations[0]?.id || null)
      : (organizerOrgId || team.organization_id || null);

    const chosenOrgName = organizations.find((o) => o.id === chosenOrgId)?.name || team.organization_name;

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
        organization_name: chosenOrgName,
        joined_at: new Date().toISOString(),
      };
      setSquad((prev) => [...prev, optimisticMember]);
      setAvailablePlayers((prev) => prev.filter((p) => p.id !== player.id));

      const res = await addPlayerToSquadAction(team.id, player.id, chosenPos, chosenRole, chosenOrgId);
      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: `¡${player.name} (@${player.gamertag}) incorporado exitosamente como ${chosenRole}${chosenOrgName ? ` en ${chosenOrgName}` : ''}!`,
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
    if (clubFilter === 'FREE' && p.current_team_name) return false;
    if (clubFilter === 'WITH_CLUB' && !p.current_team_name) return false;
    return true;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Gestión de plantilla" size="xl" showCloseButton={false} className="p-0 flex flex-col overflow-hidden font-[family-name:var(--font-active)]">
      {/* HEADER DEL MODAL */}
      <div className="p-5 sm:p-6 border-b border-[var(--border-card)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--bg-card)]">
        <div className="flex items-center gap-3">
          <Avatar
            fallback={team.tag || team.name.slice(0, 3).toUpperCase()}
            src={team.logo_url}
            size="md"
            className="ring-2 ring-[var(--app-accent)]/40"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black uppercase text-[var(--text-heading)] tracking-wider">{team.name}</h2>
              <Badge variant="cyan" className="text-[10px] font-[family-name:var(--font-active)]">
                {team.game_slug.toUpperCase()}
              </Badge>
              {team.organization_name && (
                <Badge variant="violet" className="text-[10px] font-[family-name:var(--font-active)] flex items-center gap-1">
                  <Building2 className="w-2.5 h-2.5" />
                  {team.organization_name}
                </Badge>
              )}
              {isAdmin ? (
                <Badge variant="gold" className="text-[10px] font-[family-name:var(--font-active)] flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5" />
                  Admin Global
                </Badge>
              ) : isOrganizer ? (
                <Badge variant="emerald" className="text-[10px] font-[family-name:var(--font-active)] flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" />
                  Organizador
                </Badge>
              ) : null}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs font-[family-name:var(--font-active)] text-[var(--text-muted)]">
                Gestión Directa de Roster • <span className="text-[var(--app-accent)] font-bold">{squad.length} / {maxMembers}</span> Jugadores Registrados
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
        <div className="px-6 py-2.5 bg-[var(--app-warning-soft)] border-b border-[var(--app-warning)]/30 text-[var(--app-warning)] text-xs flex items-center gap-2">
          <Lock className="w-4 h-4 flex-shrink-0 text-[var(--app-warning)]" />
          <span>
            <strong>Modo Solo Lectura:</strong> Este club pertenece a la organización <em>{team.organization_name}</em>. Como organizador, solo puedes modificar plantillas de tu propia organización.
          </span>
        </div>
      )}

      {/* MENSAJE ALERTA FEEDBACK */}
      {feedbackMsg && (
        <div
          className={`px-6 py-3 text-xs font-[family-name:var(--font-active)] font-bold flex items-center justify-between border-b ${
            feedbackMsg.type === 'success'
              ? 'bg-[var(--app-positive-soft)] text-[var(--app-positive)] border-[var(--app-positive)]/40'
              : 'bg-[var(--app-danger-soft)] text-[var(--app-danger)] border-[var(--app-danger)]/40'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[var(--app-positive)] flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[var(--app-danger)] flex-shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-[var(--text-muted)] hover:text-[var(--text-heading)]">
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
                ? 'border-[var(--app-accent)] text-[var(--app-accent)] bg-[var(--bg-card)]'
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
                  ? 'border-[var(--app-accent-2)] text-[var(--app-accent-2)] bg-[var(--bg-card)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>2. Incorporar Jugadores</span>
            </button>
          )}
        </div>

        <span className="text-[11px] text-[var(--text-muted)] hidden md:inline-block font-[family-name:var(--font-active)]">
          Límite: <strong className="text-[var(--app-accent)]">{squad.length} / {maxMembers}</strong>
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
                  className="bg-[var(--app-accent-2)] hover:bg-[var(--app-accent-2)] text-[var(--text-heading)] font-bold text-xs flex items-center gap-1.5 flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Atleta</span>
                </Button>
              )}
            </div>

            {isLoadingSquad ? (
              <div className="p-10 text-center text-[var(--text-muted)] font-[family-name:var(--font-active)] text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--app-accent)]" />
                Cargando plantilla del equipo...
              </div>
            ) : filteredSquad.length === 0 ? (
              <div className="p-10 text-center rounded-2xl border border-dashed border-[var(--border-card)] text-[var(--text-muted)] font-[family-name:var(--font-active)] text-xs space-y-2">
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
                    className="text-xs font-[family-name:var(--font-active)] text-[var(--app-accent-2)] border-[var(--border-card)] mt-2"
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
                      className="p-3.5 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] flex flex-col justify-between gap-3 hover:border-[var(--app-accent)]/40 transition-all shadow-sm"
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
                                <Badge variant="gold" className="text-[9px] font-[family-name:var(--font-active)] uppercase py-0 px-1.5 flex items-center gap-1">
                                  <Crown className="w-2.5 h-2.5" /> Capitán
                                </Badge>
                              ) : member.role_in_team === 'Encargado' ? (
                                <Badge variant="violet" className="text-[9px] font-[family-name:var(--font-active)] uppercase py-0 px-1.5 flex items-center gap-1">
                                  <Shield className="w-2.5 h-2.5" /> Encargado
                                </Badge>
                              ) : member.role_in_team === 'DT / Analyst' ? (
                                <Badge variant="gold" className="text-[9px] font-[family-name:var(--font-active)] uppercase py-0 px-1.5 flex items-center gap-1">
                                  <Award className="w-2.5 h-2.5" /> DT
                                </Badge>
                              ) : (
                                <Badge variant="cyan" className="text-[9px] font-[family-name:var(--font-active)] uppercase py-0 px-1.5">
                                  Jugador
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] font-[family-name:var(--font-active)] text-[var(--text-muted)] truncate">
                              @{member.gamertag} • Pos: <span className="text-[var(--app-accent)] font-bold">{member.tactical_position}</span>
                            </p>
                            {member.organization_name && (
                              <p className="text-[10px] text-[var(--app-accent-2)] font-bold truncate flex items-center gap-1">
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
                            className="text-[var(--app-danger)] hover:bg-[var(--app-danger-soft)] p-1.5 rounded-xl text-xs font-[family-name:var(--font-active)] transition-colors flex-shrink-0"
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
                          <span className="text-[10px] text-[var(--text-muted)] uppercase font-[family-name:var(--font-active)]">Rol:</span>
                          {canManageSquad ? (
                            <select
                              disabled={isPending}
                              value={member.role_in_team === 'Capitan' ? 'Capitán' : member.role_in_team}
                              onChange={(e) => handleChangeRole(member, e.target.value as any)}
                              className="bg-[var(--bg-main)] text-[var(--text-heading)] border border-[var(--border-card)] rounded-lg px-2 py-0.5 text-[10px] font-[family-name:var(--font-active)] focus:outline-none focus:border-[var(--app-accent)]"
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
                                className="w-10 bg-[var(--bg-main)] text-[var(--text-heading)] text-center rounded border border-[var(--app-accent)] text-[10px] py-0.5"
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
                                className="text-[10px] p-1 h-6 bg-[var(--app-positive)]/80 text-[var(--text-heading)] rounded hover:bg-[var(--app-positive)]"
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
                              className={`px-2 py-0.5 rounded-md bg-[var(--bg-main)] border border-[var(--border-card)] text-[10px] font-[family-name:var(--font-active)] flex items-center gap-1 ${
                                canManageSquad ? 'hover:border-[var(--app-accent)] text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer' : 'text-[var(--text-muted)] cursor-default'
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
            {/* INFO BANNER POR ROL */}
            {isAdmin ? (
              <div className="p-3.5 rounded-2xl bg-[var(--app-warning-soft)] border border-[var(--app-warning)]/30 text-xs text-[var(--app-warning)] flex items-start gap-2.5">
                <Crown className="w-4 h-4 text-[var(--app-warning)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[var(--text-heading)]">👑 Modo Administrador Global — Búsqueda y Asignación Directa</p>
                  <p className="text-[11px] text-[var(--app-warning)]/80 mt-0.5">
                    Puedes buscar a cualquier atleta registrado en la plataforma (incluso si actualmente pertenece a otro club) y asignarlo directamente a la Organización que desees para este club.
                  </p>
                </div>
              </div>
            ) : isOrganizer ? (
              <div className="p-3.5 rounded-2xl bg-[var(--app-positive-soft)] border border-[var(--app-positive)]/30 text-xs text-[var(--app-positive)] flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-[var(--app-positive)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[var(--text-heading)]">🛡️ Modo Organizador — Asignación a tu Organización</p>
                  <p className="text-[11px] text-[var(--app-positive)]/80 mt-0.5">
                    Puedes incorporar atletas a la plantilla de este club. Como organizador, los jugadores serán asignados formalmente a tu organización ({team.organization_name || 'tu organización'}).
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-[var(--app-accent-2-soft)] border border-[var(--app-accent-2)]/30 text-xs text-[var(--app-accent-2)] flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[var(--app-accent-2)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[var(--text-heading)]">Incorporación Directa con Salida Limpia</p>
                  <p className="text-[11px] text-[var(--app-accent-2)]/80 mt-0.5">
                    Al incorporar al atleta, se le vinculará formalmente a este club y a la Organización <strong>{team.organization_name || 'del club'}</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* FILTROS DE BÚSQUEDA Y POSICIÓN */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <Input
                  placeholder="Buscar jugador por nombre, gamertag, email o posición..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-xs font-[family-name:var(--font-active)] bg-[var(--bg-card)] border-[var(--border-card)] rounded-xl"
                />
              </div>

              {/* FILTROS DE POSICIÓN */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-[family-name:var(--font-active)]">
                {['ALL', 'DC', 'MCO', 'MC', 'MCD', 'DFC', 'LD', 'LI', 'EI', 'ED', 'PO'].map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setPositionFilter(pos)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      positionFilter === pos
                        ? 'bg-[var(--app-accent-2)] text-[var(--text-heading)] shadow-sm'
                        : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-heading)] border border-[var(--border-card)]'
                    }`}
                  >
                    {pos === 'ALL' ? 'TODAS LAS POSICIONES' : pos}
                  </button>
                ))}
              </div>

              {/* FILTRO POR ESTADO DE CLUB */}
              <div className="flex items-center gap-1.5 text-[10px] font-[family-name:var(--font-active)] pt-1">
                <Filter className="w-3 h-3 text-[var(--text-muted)]" />
                <span className="text-[var(--text-muted)]">Filtrar por club:</span>
                <button
                  onClick={() => setClubFilter('ALL')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-[family-name:var(--font-active)] transition-all ${
                    clubFilter === 'ALL'
                      ? 'bg-[var(--app-accent)]/30 text-[var(--app-accent)] border border-[var(--app-accent)]/50'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                  }`}
                >
                  Todos ({availablePlayers.length})
                </button>
                <button
                  onClick={() => setClubFilter('FREE')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-[family-name:var(--font-active)] transition-all ${
                    clubFilter === 'FREE'
                      ? 'bg-[var(--app-positive)]/30 text-[var(--app-positive)] border border-[var(--app-positive)]/50'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                  }`}
                >
                  Libres ({availablePlayers.filter((p) => !p.current_team_name).length})
                </button>
                <button
                  onClick={() => setClubFilter('WITH_CLUB')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-[family-name:var(--font-active)] transition-all ${
                    clubFilter === 'WITH_CLUB'
                      ? 'bg-[var(--app-warning)]/30 text-[var(--app-warning)] border border-[var(--app-warning)]/50'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                  }`}
                >
                  Con Club ({availablePlayers.filter((p) => Boolean(p.current_team_name)).length})
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-[family-name:var(--font-active)] text-[var(--text-muted)] px-1">
              <span>Atletas encontrados ({filteredAvailablePlayers.length})</span>
              <span className="text-[var(--app-positive)]">Fichaje e incorporación directa</span>
            </div>

            {isLoadingAvailable ? (
              <div className="p-10 text-center text-[var(--text-muted)] font-[family-name:var(--font-active)] text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--app-accent-2)]" />
                Buscando atletas en la plataforma...
              </div>
            ) : filteredAvailablePlayers.length === 0 ? (
              <div className="p-10 text-center rounded-2xl border border-dashed border-[var(--border-card)] text-[var(--text-muted)] font-[family-name:var(--font-active)] text-xs space-y-2">
                <Search className="w-8 h-8 mx-auto text-[var(--text-muted)] opacity-50" />
                <p>No se encontraron jugadores que coincidan con la búsqueda y filtros seleccionados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredAvailablePlayers.map((player) => {
                  const currentSelectedRole = playerAddingRole[player.id] || 'Jugador';
                  const currentSelectedPos = playerAddingPos[player.id] || player.position || 'DFC';
                  const selectedOrg = playerAddingOrg[player.id] || team.organization_id || player.organization_id || organizations[0]?.id || '';

                  return (
                    <div
                      key={player.id}
                      className="p-4 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] flex flex-col justify-between gap-3.5 hover:border-[var(--app-accent-2)]/50 transition-all shadow-sm"
                    >
                      {/* CABECERA DEL ATLETA */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            fallback={player.name?.slice(0, 2).toUpperCase() || 'JG'}
                            src={player.avatar_url || player.foto || undefined}
                            size="md"
                            className="ring-1 ring-[var(--app-accent-2)]/40 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-black text-[var(--text-heading)] truncate uppercase">
                                {player.name}
                              </span>
                              <Badge variant="cyan" className="text-[9px] font-[family-name:var(--font-active)] py-0 px-1.5">
                                {player.position || 'DFC'}
                              </Badge>
                            </div>
                            <p className="text-[11px] font-[family-name:var(--font-active)] text-[var(--text-muted)] truncate">
                              @{player.gamertag} {player.email ? `• ${player.email}` : ''}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* BADGES DE CLUB Y ORGANIZACIÓN ACTUAL */}
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-[family-name:var(--font-active)]">
                        {player.current_team_name ? (
                          <Badge variant="gold" className="text-[9px] font-[family-name:var(--font-active)] py-0.5 px-2 flex items-center gap-1 bg-[var(--app-warning-soft)] text-[var(--app-warning)] border-[var(--app-warning)]/30">
                            ⚽ Club actual: {player.current_team_name}
                          </Badge>
                        ) : (
                          <Badge variant="emerald" className="text-[9px] font-[family-name:var(--font-active)] py-0.5 px-2 flex items-center gap-1 bg-[var(--app-positive-soft)] text-[var(--app-positive)] border-[var(--app-positive)]/30">
                            🟢 Libre (Sin club)
                          </Badge>
                        )}

                        {player.organization_name ? (
                          <Badge variant="violet" className="text-[9px] font-[family-name:var(--font-active)] py-0.5 px-2 flex items-center gap-1 bg-[var(--app-accent-2-soft)] text-[var(--app-accent-2)] border-[var(--app-accent-2)]/30">
                            <Building2 className="w-2.5 h-2.5" />
                            Org: {player.organization_name}
                          </Badge>
                        ) : null}
                      </div>

                      {/* FORMULARIO DE ASIGNACIÓN DE ORGANIZACIÓN, ROL Y POSICIÓN */}
                      <div className="pt-3 border-t border-[var(--border-card)]/60 flex flex-col gap-2.5 text-[10px]">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                          {/* Selector de Organización (Solo Admin) o Badge Fijo (Organizador) */}
                          {isAdmin ? (
                            <div className="flex flex-col gap-1 sm:col-span-1">
                              <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase font-[family-name:var(--font-active)]">
                                Asignar Org:
                              </span>
                              <select
                                value={selectedOrg}
                                onChange={(e) =>
                                  setPlayerAddingOrg((prev) => ({
                                    ...prev,
                                    [player.id]: e.target.value,
                                  }))
                                }
                                className="bg-[var(--bg-main)] text-[var(--text-heading)] border border-[var(--border-card)] rounded-lg px-2 py-1 text-[10px] font-[family-name:var(--font-active)] focus:border-[var(--app-accent)] focus:outline-none truncate"
                              >
                                {organizations.map((org) => (
                                  <option key={org.id} value={org.id}>
                                    {org.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1 sm:col-span-1">
                              <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase font-[family-name:var(--font-active)]">
                                Organización:
                              </span>
                              <div className="bg-[var(--bg-main)] text-[var(--app-positive)] border border-[var(--app-positive)]/30 rounded-lg px-2 py-1 text-[10px] font-[family-name:var(--font-active)] truncate flex items-center gap-1">
                                <Building2 className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="truncate">{team.organization_name || 'Tu Organización'}</span>
                              </div>
                            </div>
                          )}

                          {/* Selector de Rol */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase font-[family-name:var(--font-active)]">
                              Rol en Roster:
                            </span>
                            <select
                              value={currentSelectedRole}
                              onChange={(e) =>
                                setPlayerAddingRole((prev) => ({
                                  ...prev,
                                  [player.id]: e.target.value as any,
                                }))
                              }
                              className="bg-[var(--bg-main)] text-[var(--text-heading)] border border-[var(--border-card)] rounded-lg px-2 py-1 text-[10px] font-[family-name:var(--font-active)] focus:border-[var(--app-accent)] focus:outline-none"
                            >
                              <option value="Jugador">Jugador</option>
                              <option value="Encargado">Encargado</option>
                              <option value="DT / Analyst">DT</option>
                              <option value="Capitán">👑 Capitán</option>
                            </select>
                          </div>

                          {/* Selector de Posición */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase font-[family-name:var(--font-active)]">
                              Posición:
                            </span>
                            <select
                              value={currentSelectedPos}
                              onChange={(e) =>
                                setPlayerAddingPos((prev) => ({
                                  ...prev,
                                  [player.id]: e.target.value,
                                }))
                              }
                              className="bg-[var(--bg-main)] text-[var(--text-heading)] border border-[var(--border-card)] rounded-lg px-2 py-1 text-[10px] font-[family-name:var(--font-active)] focus:border-[var(--app-accent)] focus:outline-none"
                            >
                              {['DC', 'MCO', 'MC', 'MCD', 'DFC', 'LD', 'LI', 'EI', 'ED', 'PO', 'FLEX'].map((pos) => (
                                <option key={pos} value={pos}>
                                  {pos}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Botón de Incorporación */}
                        <div className="flex justify-end pt-1">
                          <Button
                            size="sm"
                            disabled={isPending || (isOrganizer && isOtherOrgTeam)}
                            onClick={() => handleAddPlayer(player)}
                            className="w-full sm:w-auto bg-[var(--app-accent-2)] hover:bg-[var(--app-accent-2)] text-[var(--text-heading)] font-[family-name:var(--font-active)] text-[11px] font-bold px-4 py-1.5 rounded-xl gap-1.5 shadow-md transition-all flex items-center justify-center"
                          >
                            {isPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <UserPlus className="w-3.5 h-3.5" />
                            )}
                            <span>Incorporar a Plantilla</span>
                          </Button>
                        </div>
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
        <div className="text-[11px] text-[var(--text-muted)] font-[family-name:var(--font-active)] flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[var(--app-accent)]" />
          <span>
            {isAdmin
              ? '👑 Modo Administrador: Búsqueda global de atletas y asignación a cualquier organización.'
              : isOrganizer
              ? '🛡️ Modo Organizador: Incorporación exclusiva para equipos de tu propia organización.'
              : '⚽ Modo Capitán del Club.'}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="text-xs font-[family-name:var(--font-active)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border-[var(--border-card)]"
        >
          Cerrar Ventana
        </Button>
      </div>
    </Modal>
  );
}
