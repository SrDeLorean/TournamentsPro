'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import {
  Users,
  Shield,
  Plus,
  Crown,
  Award,
  UserMinus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Hash,
} from 'lucide-react';
import { getUserEnrolledTeamsAction, getTeamSquadAction, updateSquadMemberRoleAction, updateSquadMemberJerseyAction, removePlayerFromSquadAction, SquadMemberData } from '@/app/actions/squads';
import dynamic from 'next/dynamic';

const SquadRosterModal = dynamic(
  () => import('@/components/teams/squad-roster-modal').then((m) => m.SquadRosterModal),
  { ssr: false }
);

interface ManagedTeam {
  id: string;
  name: string;
  tag: string;
  gameSlug: string;
  logoUrl?: string | null;
  members_count?: number;
  max_members?: number;
  organizations?: { organization_id: string; organization_name: string }[];
}

export default function ClubPlantillaPage() {
  const { currentUser } = useAuth();
  const [teams, setTeams] = useState<ManagedTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [squad, setSquad] = useState<SquadMemberData[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [isLoadingSquad, setIsLoadingSquad] = useState(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingJerseyUserId, setEditingJerseyUserId] = useState<string | null>(null);
  const [jerseyInputValue, setJerseyInputValue] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];

  // 1. Load User's Managed Teams
  useEffect(() => {
    if (!currentUser?.id) {
      setIsLoadingTeams(false);
      return;
    }
    setIsLoadingTeams(true);
    getUserEnrolledTeamsAction(currentUser.id, 'ALL').then((res) => {
      if (res.success && res.teams && res.teams.length > 0) {
        setTeams(res.teams as unknown as ManagedTeam[]);
        setSelectedTeamId(res.teams[0].id);
      }
      setIsLoadingTeams(false);
    });
  }, [currentUser?.id]);

  // 2. Load Squad for Selected Team
  const loadSquad = useCallback(async () => {
    if (!selectedTeamId) return;
    setIsLoadingSquad(true);
    try {
      const res = await getTeamSquadAction(selectedTeamId);
      if (res.success && res.squad) {
        setSquad(res.squad);
      }
    } catch (err) {
      console.error('Error cargando plantilla:', err);
    } finally {
      setIsLoadingSquad(false);
    }
  }, [selectedTeamId]);

  useEffect(() => {
    void loadSquad();
  }, [loadSquad]);

  // Handle Role Change
  const handleChangeRole = (member: SquadMemberData, newRole: 'Capitán' | 'Encargado' | 'DT / Analyst' | 'Jugador') => {
    if (!selectedTeamId) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await updateSquadMemberRoleAction(selectedTeamId, member.user_id, newRole);
      if (res.success) {
        setFeedback({
          type: 'success',
          text: `Rol de ${member.user_name} actualizado a ${newRole}.`,
        });
        void loadSquad();
      } else {
        setFeedback({
          type: 'error',
          text: res.error || 'Error al actualizar el rol.',
        });
      }
    });
  };

  // Handle Jersey Change
  const handleSaveJersey = (member: SquadMemberData) => {
    const val = jerseyInputValue.trim() === '' ? null : parseInt(jerseyInputValue, 10);
    if (val !== null && (isNaN(val) || val < 0 || val > 99)) {
      setFeedback({ type: 'error', text: 'El dorsal debe ser un número entre 0 y 99.' });
      return;
    }
    startTransition(async () => {
      const res = await updateSquadMemberJerseyAction(member.id, val);
      setEditingJerseyUserId(null);
      if (res.success) {
        setFeedback({ type: 'success', text: `Dorsal de ${member.user_name} actualizado.` });
        void loadSquad();
      } else {
        setFeedback({ type: 'error', text: res.error || 'Error al actualizar dorsal.' });
      }
    });
  };

  // Handle Remove Player
  const handleRemovePlayer = (member: SquadMemberData) => {
    if (!selectedTeamId) return;
    if (!confirm(`¿Estás seguro de desvincular a ${member.user_name} (@${member.gamertag}) de la plantilla?`)) return;

    setFeedback(null);
    startTransition(async () => {
      const orgName = selectedTeam?.organizations?.[0]?.organization_name;
      const res = await removePlayerFromSquadAction(selectedTeamId, member.user_id, orgName);
      if (res.success) {
        setFeedback({
          type: 'success',
          text: `${member.user_name} ha sido desvinculado de la plantilla.`,
        });
        void loadSquad();
      } else {
        setFeedback({
          type: 'error',
          text: res.error || 'Error al desvincular jugador.',
        });
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300 font-mono">
      <PageHeader
        badgeText="Gestión Oficial de Roster de Escuadra"
        badgeIcon={<Users className="w-3.5 h-3.5 text-purple-400" />}
        title="PLANTILLA DEL"
        highlightTitle="CLUB."
        description="Administra la nómina completa de integrantes del club, asigna dorsales, posiciones tácticas y gestiona roles de Capitán/Staff vinculados a tu Organización."
      />

      {/* FEEDBACK ALERT */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-mono font-bold flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
              : 'bg-rose-950/70 text-rose-300 border-rose-500/40'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {isLoadingTeams ? (
        <div className="p-8 text-center text-[var(--text-muted)] text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
          Cargando tus escuadras gestionadas...
        </div>
      ) : teams.length === 0 ? (
        <Card className="border-[var(--border-card)] bg-[var(--bg-card)] p-8 text-center space-y-3">
          <Shield className="w-10 h-10 mx-auto text-[var(--text-muted)] opacity-50" />
          <h3 className="text-base font-black uppercase text-[var(--text-heading)]">No gestionas ningún equipo activo</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            Para gestionar una plantilla oficial, debes ser Capitán o Administrador de una escuadra.
          </p>
          <Link href="/equipos" className="inline-block mt-2">
            <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs">
              Crear o Unirte a un Club
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* CLUB SELECTOR & ACTIONS BAR */}
          <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar
                src={selectedTeam?.logoUrl || undefined}
                fallback={selectedTeam?.tag || selectedTeam?.name.slice(0, 2).toUpperCase()}
                size="md"
                className="ring-2 ring-purple-500/40"
              />
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block font-bold">
                  Club Seleccionado
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="bg-[var(--bg-main)] text-[var(--text-heading)] font-black text-sm uppercase px-3 py-1.5 rounded-xl border border-[var(--border-card)] focus:outline-none focus:border-purple-400"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.gameSlug.toUpperCase()})
                      </option>
                    ))}
                  </select>
                  {selectedTeam?.organizations?.[0] && (
                    <Badge variant="violet" className="text-[10px] font-mono flex items-center gap-1">
                      <Building2 className="w-2.5 h-2.5" />
                      {selectedTeam.organizations[0].organization_name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => setIsRosterModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md px-4"
            >
              <Plus className="w-4 h-4" />
              Incorporar Jugadores
            </Button>
          </div>

          {/* SQUAD ROSTER CARD */}
          <Card className="border-[var(--border-card)] bg-[var(--bg-card)]">
            <CardHeader className="border-b border-[var(--border-card)] flex flex-row items-center justify-between">
              <CardTitle className="text-base font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <span>Roster Oficial de {selectedTeam?.name} ({squad.length} Jugadores)</span>
              </CardTitle>
              <Badge variant="cyan" className="text-xs font-mono">
                {selectedTeam?.gameSlug.toUpperCase()}
              </Badge>
            </CardHeader>
            <CardContent className="p-6">
              {isLoadingSquad ? (
                <div className="p-12 text-center text-[var(--text-muted)] text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  Cargando integrantes de la plantilla...
                </div>
              ) : squad.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-[var(--border-card)] text-[var(--text-muted)] text-xs space-y-3">
                  <Users className="w-8 h-8 mx-auto opacity-50" />
                  <p className="font-bold text-[var(--text-primary)]">No hay jugadores inscritos en esta escuadra.</p>
                  <Button
                    size="sm"
                    onClick={() => setIsRosterModalOpen(true)}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Incorporar Primer Jugador
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {squad.map((member) => {
                    const isCaptain = member.role_in_team === 'Capitán' || member.role_in_team === 'Capitan';
                    const isEditingJersey = editingJerseyUserId === member.user_id;

                    return (
                      <div
                        key={member.id}
                        className="p-4 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-main)] flex flex-col justify-between gap-3 hover:border-purple-500/50 transition-all shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar
                              src={member.avatar_url || member.foto || undefined}
                              fallback={member.user_name?.slice(0, 2).toUpperCase() || 'JG'}
                              size="md"
                              className="ring-2 ring-purple-500/30 flex-shrink-0"
                            />
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-sm text-[var(--text-heading)] uppercase truncate max-w-[130px]">
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
                              <p className="text-[11px] text-[var(--text-muted)] truncate">
                                @{member.gamertag} • Pos: <span className="text-cyan-400 font-bold">{member.tactical_position}</span>
                              </p>
                              {member.organization_name && (
                                <p className="text-[10px] text-purple-400 font-bold truncate flex items-center gap-1">
                                  <Building2 className="w-2.5 h-2.5" />
                                  {member.organization_name}
                                </p>
                              )}
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isPending}
                            onClick={() => handleRemovePlayer(member)}
                            className="text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-xl text-xs transition-colors flex-shrink-0"
                            title="Desvincular del equipo"
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* CONTROLES DE ROL Y DORSAL */}
                        <div className="pt-2 border-t border-[var(--border-card)] flex items-center justify-between gap-2 text-[11px]">
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">Rol:</span>
                            <select
                              disabled={isPending}
                              value={member.role_in_team === 'Capitan' ? 'Capitán' : member.role_in_team}
                              onChange={(e) => handleChangeRole(member, e.target.value as any)}
                              className="bg-[var(--bg-card)] text-[var(--text-heading)] border border-[var(--border-card)] rounded-lg px-2 py-0.5 text-[10px] focus:outline-none focus:border-purple-400"
                            >
                              <option value="Jugador">Jugador</option>
                              <option value="Encargado">Encargado</option>
                              <option value="DT / Analyst">DT / Analyst</option>
                              <option value="Capitán">👑 Capitán</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            {isEditingJersey ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min={0}
                                  max={99}
                                  value={jerseyInputValue}
                                  onChange={(e) => setJerseyInputValue(e.target.value)}
                                  className="w-10 bg-[var(--bg-card)] text-[var(--text-heading)] border border-purple-400 rounded px-1 text-center text-xs"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveJersey(member);
                                    if (e.key === 'Escape') setEditingJerseyUserId(null);
                                  }}
                                />
                                <button
                                  onClick={() => handleSaveJersey(member)}
                                  className="text-emerald-400 hover:text-emerald-300 text-xs font-bold"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => setEditingJerseyUserId(null)}
                                  className="text-slate-400 hover:text-white text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingJerseyUserId(member.user_id);
                                  setJerseyInputValue(member.jersey_number !== null && member.jersey_number !== undefined ? String(member.jersey_number) : '');
                                }}
                                className="px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-purple-400 text-cyan-400 font-black text-[10px] flex items-center gap-0.5"
                                title="Editar dorsal"
                              >
                                <Hash className="w-2.5 h-2.5" />
                                {member.jersey_number !== null && member.jersey_number !== undefined ? `#${member.jersey_number}` : 'S/N'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* SQUAD ROSTER MODAL */}
      {selectedTeam && (
        <SquadRosterModal
          isOpen={isRosterModalOpen}
          onClose={() => setIsRosterModalOpen(false)}
          team={{
            id: selectedTeam.id,
            name: selectedTeam.name,
            tag: selectedTeam.tag,
            game_slug: selectedTeam.gameSlug,
            logo_url: selectedTeam.logoUrl || undefined,
            organization_name: selectedTeam.organizations?.[0]?.organization_name,
          }}
          onRosterUpdated={() => {
            void loadSquad();
          }}
        />
      )}
    </div>
  );
}
