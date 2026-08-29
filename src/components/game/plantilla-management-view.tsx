'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { GameConfig } from '@/lib/games-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { ModalForm } from '@/components/ui/modal-form';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { CrudAlertBanner, useCrudNotifier } from '@/components/ui/crud-alert';
import { useAuth } from '@/components/providers/auth-provider';
import type { TeamData } from '@/lib/data-store';
import {
  getTeamSquadAction,
  getAllPlayersForContractOfferAction,
  removePlayerFromSquadAction,
  updateSquadMemberJerseyAction,
  getPlayerInscriptionsMatrixAction,
  SquadMemberData,
} from '@/app/actions/squads';
import {
  sendClubContractOfferAction,
  getOutgoingOffersAction,
  cancelTransferOfferAction,
} from '@/app/actions/transfers';
import {
  Users,
  UserPlus,
  FileText,
  Building2,
  Search,
  Hash,
  Send,
  Loader2,
  Trash2,
  Clock,
  Ban,
  MessageSquare,
  CheckSquare,
  Square,
} from 'lucide-react';

interface PlantillaManagementViewProps {
  game: GameConfig;
}

type ManagedTeam = TeamData & {
  game_slug?: string;
  captain_id?: string;
  captain_name?: string;
  encargados?: unknown;
  encargados_json?: unknown;
};

interface OrganizationOption {
  id: string;
  name: string;
  tag?: string;
  acronym?: string;
}

interface CompetitionOption {
  game_slug?: string;
  gameSlug?: string;
  organization_id?: string;
  organizationId?: string;
}

interface ContractPlayer {
  id: string;
  name: string;
  gamertag: string;
  email?: string;
  position?: string;
  current_team_id?: string | null;
  current_team_name?: string | null;
  current_team_tag?: string | null;
}

interface OutgoingOffer {
  id: string;
  player_user_id: string;
  player_name: string;
  player_gamertag: string;
  position: string;
  pitch_message?: string;
  status: string;
  created_at: string;
}

interface MatrixOrganization {
  id: string;
  name: string;
  acronym?: string;
  competitionName?: string | null;
}

interface InscriptionMatrixEntry {
  user_id: string;
  user_name: string;
  gamertag?: string;
  organizations: MatrixOrganization[];
  tactical_position?: string | null;
  jersey_number?: number | null;
}

type SquadMemberWithOrganizations = SquadMemberData & {
  organization_ids?: string;
  organization_names?: string;
};

const errorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

export function PlantillaManagementView({ game }: PlantillaManagementViewProps) {
  const gameSlug = game.slug || 'eafc26';
  const { currentUser, userTeams } = useAuth();
  const { crudState, startOperation, endSuccess, endError, resetAlert } = useCrudNotifier();

  // 1. Strictly determine the specific club managed by currentUser
  const myTeam = ((userTeams || []) as ManagedTeam[]).find((t) => {
    const slug = t.game_slug || t.gameSlug || 'eafc26';
    if (slug !== gameSlug && gameSlug !== 'ALL') return false;

    const uId = currentUser?.id;
    const uName = currentUser?.name?.toLowerCase();
    const uGamer = currentUser?.gamertag?.toLowerCase();

    const cId = t.captain_id || t.captainId;
    const cName = (t.captain_name || t.captainName || '').toLowerCase();

    if (cId && cId === uId) return true;
    if (cName && (cName === uName || cName === uGamer)) return true;
    if (currentUser?.teamId && t.id === currentUser.teamId) return true;

    const encs = t.encargados || t.encargados_json;
    if (encs) {
      try {
        const arr = typeof encs === 'string' ? JSON.parse(encs) : encs;
        if (Array.isArray(arr)) {
          return arr.some((enc: unknown) => {
            if (typeof enc === 'string') return enc === uId || enc.toLowerCase() === uName || enc.toLowerCase() === uGamer;
            if (!enc || typeof enc !== 'object') return false;
            const manager = enc as { id?: string; name?: string; gamertag?: string };
            return (
              manager.id === uId ||
              (manager.name && uName && manager.name.toLowerCase() === uName) ||
              (manager.gamertag && uGamer && manager.gamertag.toLowerCase() === uGamer)
            );
          });
        }
      } catch {}
    }

    if (currentUser?.role === 'Administrador' || currentUser?.role === 'Organizador') return true;
    return false;
  }) || (userTeams && userTeams.length > 0 ? userTeams[0] as ManagedTeam : null);

  const teamId = myTeam?.id || 'tm-1';
  const teamName = myTeam?.name || 'Escuadra Oficial';
  const teamTag = myTeam?.tag || 'CLUB';

  // Organizations state
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [contractOrgs, setContractOrgs] = useState<OrganizationOption[]>([]);
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'roster' | 'send_contracts' | 'sent_offers' | 'matrix'>('roster');

  // Roster & Players state
  const [squad, setSquad] = useState<SquadMemberData[]>([]);
  const [isLoadingSquad, setIsLoadingSquad] = useState(false);

  // All Players for Contract Offers (Tab 2)
  const [allPlayers, setAllPlayers] = useState<ContractPlayer[]>([]);
  const [searchPlayerQuery, setSearchPlayerQuery] = useState('');
  const [isLoadingAllPlayers, setIsLoadingAllPlayers] = useState(false);

  // Sent Offers state (Tab 3)
  const [outgoingOffers, setOutgoingOffers] = useState<OutgoingOffer[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);

  // Inscriptions Matrix state (Tab 4 for THIS club)
  const [inscriptionsMatrix, setInscriptionsMatrix] = useState<InscriptionMatrixEntry[]>([]);
  const [isLoadingMatrix, setIsLoadingMatrix] = useState(false);
  const [matrixSearchQuery, setMatrixSearchQuery] = useState('');

  // Modals state
  const [editingMember, setEditingMember] = useState<SquadMemberData | null>(null);
  const [jerseyInput, setJerseyInput] = useState<string>('');
  const [isSubmittingJersey, setIsSubmittingJersey] = useState(false);

  const [removingMember, setRemovingMember] = useState<SquadMemberData | null>(null);

  // Contract Offer Modal State (with Multi-Select Checkboxes for Organizations)
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [targetPlayer, setTargetPlayer] = useState<ContractPlayer | null>(null);
  const [contractPosition, setContractPosition] = useState<string>('DC');
  const [selectedContractOrgNames, setSelectedContractOrgNames] = useState<string[]>([]);
  const [contractTermsMessage, setContractTermsMessage] = useState<string>('');
  const [isSendingContract, setIsSendingContract] = useState(false);

  // Fetch Organizations & Filter Organizations with active tournaments in this gameSlug
  const fetchOrgsAndCompetitions = useCallback(async () => {
    try {
      const [orgRes, compRes] = await Promise.all([
        fetch('/api/admin/organizations').then((r) => r.json()).catch(() => ({ success: false, organizations: [] })),
        fetch('/api/tournaments').then((r) => r.json()).catch(() => ({ competitions: [] })),
      ]);

      const allOrgs = (orgRes.success && Array.isArray(orgRes.organizations) ? orgRes.organizations : []) as OrganizationOption[];
      const comps = (compRes.competitions || compRes.data?.competitions || []) as CompetitionOption[];

      // Filter organization IDs with active tournaments in this gameSlug
      const activeOrgIds = new Set(
        comps
          .filter((c) => (c.game_slug || c.gameSlug || 'eafc26') === gameSlug)
          .map((c) => c.organization_id || c.organizationId)
          .filter(Boolean)
      );

      setOrganizations(allOrgs);

      // Filtered Organizations for Contract Offer Modal (only orgs with active competitions in this game)
      const validForContract = allOrgs.filter((org) => activeOrgIds.size === 0 || activeOrgIds.has(org.id));
      const orgsList = validForContract.length > 0 ? validForContract : allOrgs;
      setContractOrgs(orgsList);
      if (orgsList.length > 0) {
        setSelectedContractOrgNames([orgsList[0].name]);
      }
    } catch (e) {
      console.error('Error cargando organizaciones y competencias:', e);
    }
  }, [gameSlug]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchOrgsAndCompetitions(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchOrgsAndCompetitions]);

  // Load Squad Roster for THIS Club
  const loadSquad = useCallback(async () => {
    if (!teamId) return;
    setIsLoadingSquad(true);
    try {
      const res = await getTeamSquadAction(teamId);
      if (res.success && res.squad) {
        setSquad(res.squad);
      } else {
        setSquad([]);
      }
    } catch (e) {
      console.error('Error cargando plantilla:', e);
    } finally {
      setIsLoadingSquad(false);
    }
  }, [teamId]);

  // Load ALL Players (Tab 2: shows all registered athletes in DB for this discipline)
  const loadAllPlayers = useCallback(async () => {
    setIsLoadingAllPlayers(true);
    try {
      const res = await getAllPlayersForContractOfferAction(gameSlug, searchPlayerQuery);
      let playersList = res.success && res.players ? res.players : [];

      if (currentUser) {
        const selfExists = playersList.some((p) => p.id === currentUser.id);
        if (!selfExists) {
          const matchesQuery = !searchPlayerQuery || 
            currentUser.name?.toLowerCase().includes(searchPlayerQuery.toLowerCase()) || 
            currentUser.gamertag?.toLowerCase().includes(searchPlayerQuery.toLowerCase());
          
          if (matchesQuery) {
            playersList = [
              {
                id: currentUser.id,
                name: currentUser.name || 'Mi Perfil Directivo',
                gamertag: currentUser.gamertag || currentUser.name || 'Atleta',
                email: currentUser.email || '',
                position: 'DFC',
                current_team_id: teamId,
                current_team_name: teamName,
                current_team_tag: teamTag,
              },
              ...playersList,
            ];
          }
        } else {
          // Move self to top of the list for easy access
          const selfObj = playersList.find((p) => p.id === currentUser.id);
          const rest = playersList.filter((p) => p.id !== currentUser.id);
          if (selfObj) playersList = [selfObj, ...rest];
        }
      }

      setAllPlayers(playersList);
    } catch (e) {
      console.error('Error cargando todos los jugadores:', e);
    } finally {
      setIsLoadingAllPlayers(false);
    }
  }, [currentUser, gameSlug, searchPlayerQuery, teamId, teamName, teamTag]);

  // Load Sent Offers (Tab 3) for THIS Club
  const loadSentOffers = useCallback(async () => {
    if (!teamId) return;
    setIsLoadingOffers(true);
    try {
      const res = await getOutgoingOffersAction(teamId, gameSlug);
      if (res.success && res.data) {
        setOutgoingOffers(res.data as unknown as OutgoingOffer[]);
      } else {
        setOutgoingOffers([]);
      }
    } catch (e) {
      console.error('Error cargando solicitudes enviadas:', e);
    } finally {
      setIsLoadingOffers(false);
    }
  }, [gameSlug, teamId]);

  // Load Inscriptions Matrix for THIS Club (Tab 4)
  const loadInscriptionsMatrix = useCallback(async () => {
    if (!teamId) return;
    setIsLoadingMatrix(true);
    try {
      const res = await getPlayerInscriptionsMatrixAction(teamId, gameSlug);
      if (res.success && res.data) {
        setInscriptionsMatrix(res.data);
      } else {
        setInscriptionsMatrix([]);
      }
    } catch (e) {
      console.error('Error cargando matriz de inscripciones del club:', e);
    } finally {
      setIsLoadingMatrix(false);
    }
  }, [gameSlug, teamId]);

  useEffect(() => {
    if (!teamId) return;
    const timer = window.setTimeout(() => {
      void Promise.all([loadSquad(), loadAllPlayers(), loadSentOffers()]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAllPlayers, loadSentOffers, loadSquad, teamId]);

  useEffect(() => {
    if (activeTab !== 'matrix' || !teamId) return;
    const timer = window.setTimeout(() => void loadInscriptionsMatrix(), 0);
    return () => window.clearTimeout(timer);
  }, [activeTab, loadInscriptionsMatrix, teamId]);

  useEffect(() => {
    if (searchPlayerQuery !== undefined) {
      const timer = setTimeout(loadAllPlayers, 300);
      return () => clearTimeout(timer);
    }
  }, [loadAllPlayers, searchPlayerQuery]);

  // Roster filtered by Organization (Tab 1)
  const filteredSquad = squad.filter((member) => {
    if (selectedOrgFilter === 'ALL') return true;
    const memberWithOrganizations = member as SquadMemberWithOrganizations;
    const orgIds = (memberWithOrganizations.organization_ids || '').split(',');
    const orgNames = (memberWithOrganizations.organization_names || '').split(',');
    return (
      orgIds.includes(selectedOrgFilter) ||
      orgNames.includes(selectedOrgFilter) ||
      orgNames.some((n: string) => n.trim().toLowerCase() === selectedOrgFilter.trim().toLowerCase())
    );
  });

  // Action: Save Jersey Number (# Dorsal)
  const handleSaveJersey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsSubmittingJersey(true);
    startOperation(`Asignación de Dorsal #${jerseyInput || 'Sin Número'} para ${editingMember.user_name}`);

    const num = jerseyInput ? parseInt(jerseyInput, 10) : null;

    try {
      const res = await updateSquadMemberJerseyAction(editingMember.id, num);
      if (res.success) {
        setEditingMember(null);
        endSuccess(`El dorsal #${num || '—'} fue asignado exitosamente a ${editingMember.user_name}.`);
        loadSquad();
      } else {
        endError(res.error || 'Error al actualizar dorsal.');
      }
    } catch (error: unknown) {
      endError(errorMessage(error, 'Error de conexión al guardar dorsal.'));
    } finally {
      setIsSubmittingJersey(false);
    }
  };

  // Action: Remove Player from Squad
  const handleConfirmRemovePlayer = async () => {
    if (!removingMember || !teamId) return;
    startOperation(`Baja y Desvinculación de Jugador: ${removingMember.user_name}`);

    try {
      const res = await removePlayerFromSquadAction(teamId, removingMember.user_id);
      if (res.success) {
        setRemovingMember(null);
        endSuccess(`El jugador ${removingMember.user_name} (@${removingMember.gamertag}) fue dado de baja de la plantilla.`);
        loadSquad();
        loadAllPlayers();
      } else {
        endError(res.error || 'Error al desvincular jugador de la escuadra.');
      }
    } catch (error: unknown) {
      endError(errorMessage(error, 'Error de conexión al dar de baja al jugador.'));
    }
  };

  // Toggle Organization Checkbox in Modal
  const toggleOrgSelection = (orgName: string) => {
    setSelectedContractOrgNames((prev) =>
      prev.includes(orgName) ? prev.filter((name) => name !== orgName) : [...prev, orgName]
    );
  };

  const handleSelectAllOrgs = () => {
    setSelectedContractOrgNames(contractOrgs.map((o) => o.name));
  };

  const handleDeselectAllOrgs = () => {
    setSelectedContractOrgNames([]);
  };

  // Action: Send Contract Offer (with Multi-Select Checkboxes per Organization)
  const handleSendContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPlayer || !teamId || !currentUser) return;
    if (selectedContractOrgNames.length === 0) {
      endError('Debes seleccionar al menos una organización para emitir la propuesta de contrato.');
      return;
    }
    setIsSendingContract(true);
    startOperation(`Emisión de ${selectedContractOrgNames.length} Oferta(s) de Contrato para ${targetPlayer.name} (@${targetPlayer.gamertag})`);

    try {
      const res = await sendClubContractOfferAction({
        teamId,
        playerUserId: targetPlayer.id,
        offeredByUserId: currentUser.id,
        position: contractPosition,
        organizationIds: selectedContractOrgNames,
        pitchMessage: contractTermsMessage || `Propuesta formal de contrato para unirse a ${teamName}.`,
        gameSlug,
      });

      if (res.success) {
        setIsContractModalOpen(false);
        setTargetPlayer(null);
        setContractTermsMessage('');
        endSuccess(`Se emitieron ${selectedContractOrgNames.length} contrato(s) independiente(s) por Organización para ${targetPlayer.name}.`);
        loadSentOffers();
      } else {
        endError(res.error || 'Error al enviar contratos.');
      }
    } catch (error: unknown) {
      endError(errorMessage(error, 'Error al enviar propuestas de contrato.'));
    } finally {
      setIsSendingContract(false);
    }
  };

  // Action: Cancel Sent Offer
  const handleCancelOffer = async (offerId: string, playerName: string) => {
    startOperation(`Cancelación de Oferta de Contrato enviada a ${playerName}`);
    try {
      const res = await cancelTransferOfferAction(offerId);
      if (res.success) {
        endSuccess(`La propuesta de contrato a ${playerName} fue revocada.`);
        loadSentOffers();
      } else {
        endError(res.error || 'Error al cancelar propuesta.');
      }
    } catch (error: unknown) {
      endError(errorMessage(error, 'Error al cancelar oferta.'));
    }
  };

  // Filter matrix by query
  const filteredMatrix = inscriptionsMatrix.filter((item) => {
    if (!matrixSearchQuery) return true;
    const q = matrixSearchQuery.toLowerCase();
    return (
      item.user_name?.toLowerCase().includes(q) ||
      item.gamertag?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pt-3 sm:pt-4 font-sans">
      {/* BANNER DE NOTIFICACIONES CRUD */}
      <CrudAlertBanner state={crudState} onClose={resetAlert} />

      {/* BANNER PRINCIPAL EXCLUSIVO DEL CLUB */}
      <Card className="p-4 bg-[var(--bg-card)] border border-[var(--border-card)] space-y-3 shadow-xl rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] flex items-center justify-center font-black text-sm text-[var(--accent-purple)] shadow-md">
              {teamTag}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black uppercase text-[var(--text-heading)] tracking-wide">{teamName}</h2>
                <Badge variant="violet" className="text-[10px] font-mono uppercase font-bold">
                  🛡️ Tu Escuadra Oficial
                </Badge>
              </div>
              <span className="text-xs font-mono text-[var(--text-muted)] block mt-0.5">
                Capitán Directivo: <strong className="text-[var(--accent-purple)]">{myTeam?.captain_name || myTeam?.captainName || currentUser?.name}</strong> • Disciplina: <span className="text-[var(--accent-cyan)] font-bold uppercase">{game.name}</span>
              </span>
            </div>
          </div>

          {/* Filtro por Organización del Torneo */}
          <div className="flex items-center gap-2 sm:w-72 shrink-0">
            <Building2 className="w-4 h-4 text-[var(--accent-purple)] shrink-0" />
            <div className="w-full">
              <label className="text-[10px] font-mono font-bold uppercase text-[var(--text-muted)] block mb-0.5">
                Filtrar Roster por Organización:
              </label>
              <Select
                value={selectedOrgFilter}
                onChange={(e) => setSelectedOrgFilter(e.target.value)}
                className="w-full text-xs font-mono font-bold bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-heading)]"
              >
                <option value="ALL" className="bg-[#0b101b] text-slate-100">🌐 Todas las Organizaciones ({organizations.length})</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id} className="bg-[#0b101b] text-slate-100">
                    🏛️ {org.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* NAVEGACIÓN POR PESTAÑAS (4 TABS DEL CLUB - TARJETA PILL COMPATIBLE CON MODO CLARO / OSCURO / OLED) */}
      <Card className="p-2 bg-[var(--bg-card)] border border-[var(--border-card)] shadow-lg rounded-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 font-mono text-xs">
          <button
            onClick={() => setActiveTab('roster')}
            className={`p-3 rounded-xl font-extrabold uppercase transition-all flex items-center justify-center gap-2 border shadow-sm ${
              activeTab === 'roster'
                ? 'bg-[var(--accent-cyan-bg)] border-[var(--accent-cyan)] text-[var(--accent-cyan)] shadow-md'
                : 'bg-[var(--bg-main)]/60 border-transparent text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-main)]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>1. Plantilla Roster ({filteredSquad.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('send_contracts')}
            className={`p-3 rounded-xl font-extrabold uppercase transition-all flex items-center justify-center gap-2 border shadow-sm ${
              activeTab === 'send_contracts'
                ? 'bg-purple-950/40 border-[var(--accent-purple)] text-[var(--accent-purple)] shadow-md'
                : 'bg-[var(--bg-main)]/60 border-transparent text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-main)]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>2. Emitir Contratos ({allPlayers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sent_offers')}
            className={`p-3 rounded-xl font-extrabold uppercase transition-all flex items-center justify-center gap-2 border shadow-sm ${
              activeTab === 'sent_offers'
                ? 'bg-emerald-950/40 border-[var(--accent-emerald)] text-[var(--accent-emerald)] shadow-md'
                : 'bg-[var(--bg-main)]/60 border-transparent text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-main)]'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>3. Contratos Enviados ({outgoingOffers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`p-3 rounded-xl font-extrabold uppercase transition-all flex items-center justify-center gap-2 border shadow-sm ${
              activeTab === 'matrix'
                ? 'bg-amber-950/40 border-[var(--accent-gold)] text-[var(--accent-gold)] shadow-md'
                : 'bg-[var(--bg-main)]/60 border-transparent text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-main)]'
            }`}
          >
            <Building2 className="w-4 h-4 text-purple-400" />
            <span>4. Matriz Organizaciones</span>
          </button>
        </div>
      </Card>

      {/* CONTENIDO PESTAÑA 1: PLANTILLA ROSTER, DORSALES Y ELIMINACIÓN DE JUGADORES */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-card)] shadow-md backdrop-blur-xl">
            <div>
              <h3 className="text-base font-extrabold uppercase text-[var(--text-heading)] flex items-center gap-2">
                <span>Plantilla Oficial de {teamName}</span>
                <Badge variant="cyan" className="font-mono">{filteredSquad.length} Jugadores en Roster</Badge>
              </h3>
              <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
                Roster oficial filtrado por Organización. Asigna dorsales (#) o desvincula integrantes.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => setActiveTab('send_contracts')}
              className="bg-[var(--accent-purple)] hover:opacity-90 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Emitir Oferta de Contrato</span>
            </Button>
          </div>

          {isLoadingSquad ? (
            <div className="p-12 text-center text-[var(--text-muted)] font-mono text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-cyan)]" />
              Cargando roster de la escuadra...
            </div>
          ) : filteredSquad.length === 0 ? (
            <Card className="p-12 text-center space-y-3 font-mono text-xs bg-[var(--bg-card)] border-[var(--border-card)]">
              <Users className="w-10 h-10 text-[var(--text-muted)] mx-auto opacity-50" />
              <p className="font-bold text-[var(--text-heading)]">No hay jugadores registrados en esta plantilla para el filtro seleccionado.</p>
              <p className="text-[var(--text-muted)]">Envía ofertas de contrato a atletas para armar tu equipo oficial.</p>
              <Button
                size="sm"
                onClick={() => setActiveTab('send_contracts')}
                className="bg-[var(--accent-cyan)] text-slate-950 font-bold text-xs mt-2"
              >
                <UserPlus className="w-4 h-4 mr-1.5" />
                Buscar Jugadores para Fichar
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSquad.map((member) => {
                const isCaptain = member.role_in_team === 'Capitan' || member.role_in_team === 'Capitán';
                const isEncargado = member.role_in_team === 'Encargado';

                return (
                  <Card key={member.id} className="p-4 space-y-3 relative bg-[var(--bg-card)] border-[var(--border-card)] hover:border-[var(--accent-cyan)] transition-all shadow-md group rounded-2xl">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar fallback={member.user_name?.slice(0, 2).toUpperCase() || 'JG'} size="md" />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-extrabold text-[var(--text-heading)] truncate max-w-[140px]">
                              {member.user_name}
                            </span>
                            <Badge
                              variant={isCaptain ? 'gold' : isEncargado ? 'violet' : 'cyan'}
                              className="text-[9px] font-mono uppercase px-1.5 py-0"
                            >
                              {isCaptain ? '👑 Capitán' : isEncargado ? '🛡️ Encargado' : '👤 Jugador'}
                            </Badge>
                          </div>
                          <span className="text-xs font-mono text-[var(--text-muted)] block">
                            @{member.gamertag}
                          </span>
                        </div>
                      </div>

                      {/* Dorsal Badge (#) */}
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase font-bold">Dorsal</span>
                        <span className="text-base font-black font-mono text-[var(--accent-cyan)] bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)]/30 px-2.5 py-0.5 rounded-xl shadow-inner">
                          #{member.jersey_number ?? '—'}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] flex items-center justify-between text-xs font-mono">
                      <span className="text-[var(--text-muted)]">Posición Táctica:</span>
                      <Badge variant="cyan" className="font-mono text-[10px] uppercase font-bold">
                        {member.tactical_position || 'DFC'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-[var(--border-card)]">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingMember(member);
                          setJerseyInput(member.jersey_number ? String(member.jersey_number) : '');
                        }}
                        className="flex-1 text-[11px] font-mono font-bold text-[var(--accent-cyan)] border-[var(--accent-cyan)]/30 hover:bg-[var(--accent-cyan-bg)] flex items-center justify-center gap-1 h-8"
                      >
                        <Hash className="w-3.5 h-3.5" />
                        <span>Asignar Dorsal</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRemovingMember(member)}
                        className="text-rose-400 hover:bg-rose-950/40 border border-rose-500/20 px-2.5 h-8 font-mono text-[11px] flex items-center gap-1"
                        title="Dar de baja de la plantilla"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Quitar</span>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO PESTAÑA 2: EMITIR CONTRATOS A TODOS LOS JUGADORES */}
      {activeTab === 'send_contracts' && (
        <div className="space-y-6">
          <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-card)] shadow-md backdrop-blur-xl space-y-3">
            <h3 className="text-base font-extrabold uppercase text-[var(--text-heading)] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[var(--accent-purple)]" />
              <span>Buscador General de Jugadores & Emisión de Contratos ({teamName})</span>
            </h3>
            <p className="text-xs font-mono text-[var(--text-muted)]">
              Muestra todos los jugadores registrados en la disciplina. Selecciona las organizaciones/torneos independientes para emitir propuestas.
            </p>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                type="text"
                value={searchPlayerQuery}
                onChange={(e) => setSearchPlayerQuery(e.target.value)}
                placeholder="Buscar jugador por nombre, gamertag o posición (ej. DFC, MCO, DC)..."
                className="pl-10 text-xs font-mono bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-heading)]"
              />
            </div>
          </div>

          {isLoadingAllPlayers ? (
            <div className="p-12 text-center text-[var(--text-muted)] font-mono text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-purple)]" />
              Cargando catálogo completo de jugadores...
            </div>
          ) : allPlayers.length === 0 ? (
            <Card className="p-8 text-center text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-card)] border-[var(--border-card)]">
              No se encontraron jugadores registrados con ese criterio de búsqueda.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allPlayers.map((player) => {
                const isSelf = player.id === currentUser?.id;
                const isInThisTeam = player.current_team_id === teamId;
                const isInOtherTeam = Boolean(player.current_team_id && player.current_team_id !== teamId);

                return (
                  <Card key={player.id} className="p-4 space-y-3 shadow-md bg-[var(--bg-card)] border-[var(--border-card)] hover:border-[var(--accent-purple)] transition-all rounded-2xl">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar fallback={player.name?.slice(0, 2).toUpperCase() || 'JG'} size="md" />
                        <div>
                          <span className="text-sm font-extrabold text-[var(--text-heading)] block truncate">
                            {player.name}
                          </span>
                          <span className="text-xs font-mono text-[var(--accent-purple)] block font-bold">
                            @{player.gamertag}
                          </span>
                        </div>
                      </div>

                      {/* Team Status Badge */}
                      <Badge
                        variant={isSelf ? 'gold' : isInThisTeam ? 'cyan' : isInOtherTeam ? 'violet' : 'emerald'}
                        className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5"
                      >
                        {isSelf && '👑 Tu Perfil Directivo'}
                        {!isSelf && isInThisTeam && '🛡️ En este Club'}
                        {!isSelf && isInOtherTeam && `🛡️ ${player.current_team_name}`}
                        {!isSelf && !isInThisTeam && !isInOtherTeam && '🟢 Agente Libre'}
                      </Badge>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] flex items-center justify-between text-xs font-mono">
                      <span className="text-[var(--text-muted)]">Posición Habitual:</span>
                      <span className="text-[var(--text-heading)] font-bold">{player.position || 'DFC'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setTargetPlayer(player);
                          setContractPosition(player.position || 'DC');
                          if (contractOrgs.length > 0) {
                            setSelectedContractOrgNames([contractOrgs[0].name]);
                          }
                          setIsContractModalOpen(true);
                        }}
                        className="flex-1 font-mono font-bold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md flex items-center justify-center gap-1.5 h-8"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Emitir Contrato Jugador</span>
                      </Button>

                      {!isSelf && (
                        <Link href={`/mensajes?user=${player.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-[var(--border-card)] hover:bg-[var(--bg-main)] text-[var(--accent-cyan)] h-8 font-mono text-xs px-2.5"
                            title="Abrir chat directo con el atleta"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO PESTAÑA 3: LISTADO DE SOLICITUDES & CONTRATOS ENVIADOS */}
      {activeTab === 'sent_offers' && (
        <div className="space-y-6">
          <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-card)] shadow-md backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold uppercase text-[var(--text-heading)] flex items-center gap-2">
                <Send className="w-5 h-5 text-[var(--accent-emerald)]" />
                <span>Historial de Solicitudes y Ofertas de Contrato Enviadas por {teamName}</span>
              </h3>
              <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
                Revisa el estado de cada propuesta emitida por Organización de forma independiente.
              </p>
            </div>

            <Badge variant="emerald" className="font-mono text-xs font-black">
              {outgoingOffers.length} Ofertas Emitidas
            </Badge>
          </div>

          {isLoadingOffers ? (
            <div className="p-12 text-center text-[var(--text-muted)] font-mono text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-emerald)]" />
              Cargando historial de solicitudes enviadas...
            </div>
          ) : outgoingOffers.length === 0 ? (
            <Card className="p-12 text-center text-xs font-mono text-[var(--text-muted)] space-y-2 bg-[var(--bg-card)] border-[var(--border-card)]">
              <Clock className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
              <p className="font-bold text-[var(--text-heading)]">No has emitido ofertas de contrato para {teamName} aún.</p>
              <p>Usa la pestaña de emisión de contratos para reclutar nuevos atletas.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {outgoingOffers.map((offer) => {
                const isPending = offer.status === 'PENDIENTE';
                const isAccepted = offer.status === 'ACEPTADO';
                const isRejected = offer.status === 'RECHAZADO';

                return (
                  <Card key={offer.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-[var(--accent-emerald)] transition-all shadow-md rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Avatar fallback={offer.player_name?.slice(0, 2).toUpperCase() || 'AG'} size="md" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-[var(--text-heading)]">
                            {offer.player_name}
                          </span>
                          <span className="text-xs font-mono text-[var(--accent-emerald)] font-bold">
                            @{offer.player_gamertag}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
                          Posición propuesta: <strong className="text-[var(--text-heading)]">{offer.position}</strong> • Fecha: {new Date(offer.created_at).toLocaleDateString()}
                        </p>
                        {offer.pitch_message && (
                          <p className="text-[11px] font-mono italic text-[var(--text-secondary)] mt-1 bg-[var(--bg-main)] p-2 rounded-lg border border-[var(--border-card)]">
                            &quot;{offer.pitch_message}&quot;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Badge
                        variant={isAccepted ? 'emerald' : isRejected ? 'rose' : isPending ? 'gold' : 'cyan'}
                        className="font-mono text-xs uppercase px-2.5 py-1"
                      >
                        {isAccepted && '✅ Aceptado'}
                        {isRejected && '❌ Rechazado'}
                        {isPending && '⏳ Pendiente'}
                        {!isAccepted && !isRejected && !isPending && offer.status}
                      </Badge>

                      <Link href={`/mensajes?user=${offer.player_user_id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[var(--border-card)] text-[var(--accent-cyan)] font-mono text-xs h-8 flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat</span>
                        </Button>
                      </Link>

                      {isPending && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCancelOffer(offer.id, offer.player_name)}
                          className="text-rose-400 hover:bg-rose-950/40 border border-rose-500/20 text-xs font-mono font-bold h-8 flex items-center gap-1"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Revocar</span>
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO PESTAÑA 4: MATRIZ DE INSCRIPCIONES POR JUGADOR & TORNEO DE ESTE CLUB */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-card)] shadow-md backdrop-blur-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold uppercase text-[var(--text-heading)] flex items-center gap-2">
                  <span>Matriz de Inscripciones por Jugador & Organización</span>
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Las plantillas y fichajes operan a nivel de Organización. Aquí se muestra en cuáles Organizaciones está oficialmente habilitado cada jugador de <strong className="text-[var(--text-heading)]">{teamName}</strong>.
                </p>
              </div>

              <Badge variant="gold" className="font-mono text-xs font-black">
                {inscriptionsMatrix.length} Atletas de {teamName}
              </Badge>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                type="text"
                value={matrixSearchQuery}
                onChange={(e) => setMatrixSearchQuery(e.target.value)}
                placeholder={`Filtrar jugadores de ${teamName} por nombre o gamertag...`}
                className="pl-10 text-xs font-mono bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-heading)]"
              />
            </div>
          </div>

          {isLoadingMatrix ? (
            <div className="p-12 text-center text-[var(--text-muted)] font-mono text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-gold)]" />
              Calculando matriz de inscripciones por organización para {teamName}...
            </div>
          ) : filteredMatrix.length === 0 ? (
            <Card className="p-12 text-center text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-card)] border-[var(--border-card)]">
              No se encontraron integrantes con organizaciones asignadas para {teamName}.
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredMatrix.map((item) => {
                const orgList = item.organizations || [];
                const orgCount = orgList.length;

                return (
                  <Card key={item.user_id} className="p-4 space-y-3 bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-[var(--accent-gold)] transition-all shadow-md rounded-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-card)] pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar fallback={item.user_name?.slice(0, 2).toUpperCase() || 'JG'} size="md" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-[var(--text-heading)]">
                              {item.user_name}
                            </span>
                            <span className="text-xs font-mono text-[var(--accent-gold)] font-bold">
                              @{item.gamertag}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-[var(--text-muted)] block">
                            Escuadra: <strong className="text-[var(--accent-cyan)]">{teamName}</strong> • Posición: {item.tactical_position || 'DFC'} • Dorsal: #{item.jersey_number ?? '—'}
                          </span>
                        </div>
                      </div>

                      <Badge variant="gold" className="font-mono text-xs font-bold shrink-0 self-start sm:self-auto">
                        🏛️ {orgCount} Organización{orgCount === 1 ? '' : 'es'} Inscrita{orgCount === 1 ? '' : 's'}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 font-mono text-xs">
                      <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase block">
                        🏛️ HABILITACIÓN OFICIAL DE PLANTILLA POR ORGANIZACIÓN:
                      </span>
                      {orgCount === 0 ? (
                        <span className="text-[11px] text-[var(--text-muted)] italic block">
                          Sin organizaciones ni contratos oficiales asignados para este atleta actualmente.
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {orgList.map((org) => (
                            <div
                              key={org.id}
                              className="px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center gap-2 text-purple-200 shadow-sm"
                            >
                              <Building2 className="w-3.5 h-3.5 text-purple-400" />
                              <span className="font-bold">{org.name}</span>
                              {org.acronym && (
                                <span className="text-[10px] text-purple-300 opacity-80 font-mono font-bold">
                                  ({org.acronym})
                                </span>
                              )}
                              {org.competitionName && (
                                <span className="text-[10px] text-amber-300 bg-amber-950/50 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                  🏆 {org.competitionName}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: EDITAR DORSAL (# JERSEY NUMBER) */}
      {editingMember && (
        <ModalForm
          isOpen={Boolean(editingMember)}
          onClose={() => setEditingMember(null)}
          title={`Asignar Dorsal Oficial — ${editingMember.user_name}`}
          subtitle={`Jugador: @${editingMember.gamertag} • Posición: ${editingMember.tactical_position}`}
          onSubmit={handleSaveJersey}
          isSubmitting={isSubmittingJersey}
          brandColor="#00F0FF"
        >
          <div className="space-y-4 font-mono">
            <div className="p-4 rounded-2xl bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)]/30 space-y-2 text-xs">
              <label className="font-bold text-[var(--accent-cyan)] uppercase block">Número de Camiseta / Dorsal (1 a 99):</label>
              <Input
                type="number"
                min={1}
                max={99}
                value={jerseyInput}
                onChange={(e) => setJerseyInput(e.target.value)}
                placeholder="Ej. 10, 7, 1..."
                className="text-lg font-black text-[var(--accent-cyan)] font-mono bg-[var(--bg-main)] border-[var(--border-card)]"
                required
              />
              <p className="text-[11px] text-[var(--text-muted)]">
                El número de dorsal aparecerá asignado en las convocatorias de matchday y fichas de partido oficiales.
              </p>
            </div>
          </div>
        </ModalForm>
      )}

      {/* MODAL 2: CONFIRMAR BAJA / ELIMINAR JUGADOR */}
      {removingMember && (
        <ConfirmModal
          isOpen={Boolean(removingMember)}
          onClose={() => setRemovingMember(null)}
          onConfirm={handleConfirmRemovePlayer}
          title={`Dar de Baja a ${removingMember.user_name}`}
          description={`¿Estás seguro de que deseas desvincular a @${removingMember.gamertag} de la plantilla del equipo ${teamName}? El jugador pasará a estado Agente Libre.`}
          confirmText="Confirmar Baja"
          variant="danger"
        />
      )}

      {/* MODAL 3: EMITIR OFERTA DE CONTRATO (CON CHECKBOXES DE SELECCIÓN MÚLTIPLE DE ORGANIZACIONES) */}
      {isContractModalOpen && targetPlayer && (
        <ModalForm
          isOpen={isContractModalOpen}
          onClose={() => {
            setIsContractModalOpen(false);
            setTargetPlayer(null);
          }}
          title={`Emitir Ofertas de Contrato para ${targetPlayer.name}`}
          subtitle={`Gamertag: @${targetPlayer.gamertag} • Destino: ${teamName}`}
          onSubmit={handleSendContract}
          isSubmitting={isSendingContract}
          brandColor="#A855F7"
        >
          <div className="space-y-4 font-mono">
            {/* SELECCIÓN MÚLTIPLE DE ORGANIZACIONES (CHECKBOX GROUP) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-xs text-[var(--accent-purple)] uppercase block">
                  🏛️ Organizaciones / Torneos a Fichar (Selección Múltiple):
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllOrgs}
                    className="text-[10px] text-cyan-400 hover:underline font-bold"
                  >
                    [ Seleccionar Todas ]
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAllOrgs}
                    className="text-[10px] text-slate-400 hover:underline"
                  >
                    [ Desmarcar ]
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-[var(--text-muted)]">
                Marca 1, 2 o todas las organizaciones habilitadas para esta disciplina. Se emitirá una oferta formal e independiente para cada una.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] max-h-48 overflow-y-auto">
                {contractOrgs.map((org) => {
                  const isChecked = selectedContractOrgNames.includes(org.name);
                  return (
                    <label
                      key={org.id}
                      onClick={() => toggleOrgSelection(org.name)}
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-purple-950/40 border-purple-500/60 text-purple-200 shadow-sm'
                          : 'bg-slate-900/50 border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <div className="shrink-0 text-purple-400">
                        {isChecked ? <CheckSquare className="w-4 h-4 text-purple-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                      </div>
                      <div className="text-xs font-bold truncate">
                        <span>🏛️ {org.name}</span>
                        {org.acronym && <span className="text-[10px] text-slate-400 block font-normal">({org.acronym})</span>}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <Select
              label="⚽ Posición Ofrecida en la Plantilla:"
              value={contractPosition}
              onChange={(e) => setContractPosition(e.target.value)}
            >
              {game.positions.map((pos) => (
                <option key={pos} value={pos} className="bg-[#0b101b] text-slate-100 font-semibold">
                  ⚽ {pos}
                </option>
              ))}
            </Select>

            <Textarea
              label="📝 Términos & Mensaje de Propuesta de Contrato:"
              rows={3}
              value={contractTermsMessage}
              onChange={(e) => setContractTermsMessage(e.target.value)}
              placeholder="Escribe las metas de temporada, rol garantizado y propuesta formal..."
            />
          </div>
        </ModalForm>
      )}
    </div>
  );
}
