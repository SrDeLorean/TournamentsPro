'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GameConfig } from '@/lib/games-data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { FilterBar } from '@/components/ui/filter-bar';
import { 
  Users, UserPlus, FileText, Layers, Ban, CheckSquare, Search, Send, Clock, X
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { CrudAlertBanner, useCrudNotifier } from '@/components/ui/crud-alert';
import {
  getNewTeamSquadAction,
  getNewPlayerInscriptionsMatrixAction,
  expelPlayerFromSquadAction
} from '@/app/actions/new-squads';
import {
  issueNewContractOfferService,
  getSentContractsByTeamAction
} from '@/app/actions/new-transfers';
import { getAllPlayersForContractOfferAction } from '@/app/actions/squads'; // reuse the simple search

interface SquadMember {
  user_id: string;
  user_name: string;
  gamertag?: string;
  avatar_url?: string;
  foto?: string;
  original_orgs?: string[];
}

interface MatrixOrganization {
  name: string;
}

interface MatrixRow {
  user_id: string;
  user_name: string;
  organizations: MatrixOrganization[];
}

interface ContractOffer {
  id: string;
  pitch_message?: string;
  avatar_url?: string;
  player_name: string;
  created_at: string;
  status: string;
}

interface SearchablePlayer {
  id: string;
  name: string;
  gamertag: string;
  avatar_url?: string;
  foto?: string;
  position?: string;
}

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : 'Error desconocido';

export function NewSquadManagementView({ game }: { game: GameConfig }) {
  const { currentUser, userTeams } = useAuth();
  const { crudState, startOperation, endSuccess, endError, resetAlert } = useCrudNotifier();

  const [activeTab, setActiveTab] = useState<'roster' | 'recruit' | 'contracts' | 'matrix'>('roster');

  const myTeam = userTeams?.find(t => t.captainId === currentUser?.id) || userTeams?.[0];
  const teamId = myTeam?.id;

  const [squad, setSquad] = useState<SquadMember[]>([]);
  const [matrix, setMatrix] = useState<MatrixRow[]>([]);
  const [contracts, setContracts] = useState<ContractOffer[]>([]);
  const [searchablePlayers, setSearchablePlayers] = useState<SearchablePlayer[]>([]);

  // Roster Filters
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterOrgFilter, setRosterOrgFilter] = useState('ALL');

  // Recruit Form
  const [selectedPlayer, setSelectedPlayer] = useState<SearchablePlayer | null>(null);
  const [recruitSearch, setRecruitSearch] = useState('');
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const availableOrgs = ['comunidad amc', 'gamer cup', 'pgl', 'fgl']; // Stub or fetch from team comps

  const loadData = useCallback(async () => {
    if (!teamId) return;
    try {
      if (activeTab === 'roster') {
        const res = await getNewTeamSquadAction(teamId);
        if (res.success) setSquad(res.squad as unknown as SquadMember[]);
      } else if (activeTab === 'matrix') {
        const res = await getNewPlayerInscriptionsMatrixAction(teamId);
        if (res.success) setMatrix(res.data);
      } else if (activeTab === 'contracts') {
        const res = await getSentContractsByTeamAction(teamId);
        if (res.success) setContracts(res.offers as unknown as ContractOffer[]);
      } else if (activeTab === 'recruit') {
        const res = await getAllPlayersForContractOfferAction(game.slug, recruitSearch);
        if (res.success) {
          // Asegurar que el capitán actual y los miembros actuales del equipo estén disponibles para ser seleccionados
          // Esto soluciona el problema de "no me deja enviarme contrato a mi mismo" haciendo que sea súper obvio.
          const allPlayers = [...res.players];
          
          // Si el usuario actual no está en la lista (por ej. debido al límite de 100), lo agregamos arriba
          if (currentUser && !allPlayers.find(p => p.id === currentUser.id)) {
            allPlayers.unshift({
              id: currentUser.id,
              name: currentUser.name,
              gamertag: currentUser.gamertag,
              avatar_url: currentUser.avatarUrl,
              foto: currentUser.foto,
              position: currentUser.position || 'DFC'
            });
          }
          setSearchablePlayers(allPlayers);
        }
      }
    } catch (error) {
      console.error('Error cargando la gestión de plantilla:', error);
    }
  }, [activeTab, currentUser, game.slug, recruitSearch, teamId]);

  useEffect(() => {
    if (teamId) {
      void Promise.resolve().then(loadData);
    }
  }, [teamId, activeTab, loadData]);

  const handleIssueContract = async () => {
    if (!selectedPlayer || selectedOrgs.length === 0) return;
    startOperation('Emitir Contrato');
    try {
      const res = await issueNewContractOfferService(
        teamId!,
        selectedPlayer.id,
        currentUser?.id || '',
        selectedOrgs,
        'DFC',
        game.slug
      );
      if (res.success) {
        endSuccess(res.message || 'Contrato emitido exitosamente.');
        setSelectedPlayer(null);
        setSelectedOrgs([]);
        loadData();
      } else {
        endError(res.error || 'Error');
      }
    } catch (error: unknown) {
      endError(getErrorMessage(error));
    }
  };

  const handleExpel = async (userId: string, orgName?: string) => {
    startOperation('Desvincular');
    try {
      const res = await expelPlayerFromSquadAction(teamId!, userId, orgName);
      if (res.success) {
        endSuccess(res.message || 'Jugador desvinculado.');
        loadData();
      } else {
        endError(res.error || 'Error al expulsar');
      }
    } catch (error: unknown) {
      endError(getErrorMessage(error));
    }
  };

  const toggleOrgSelection = (org: string) => {
    if (selectedOrgs.includes(org)) {
      setSelectedOrgs(selectedOrgs.filter(o => o !== org));
    } else {
      setSelectedOrgs([...selectedOrgs, org]);
    }
  };

  // Derived filtered roster
  const filteredSquad = squad.filter(p => {
    const matchSearch = p.user_name?.toLowerCase().includes(rosterSearch.toLowerCase()) || p.gamertag?.toLowerCase().includes(rosterSearch.toLowerCase());
    const matchOrg = rosterOrgFilter === 'ALL' || p.original_orgs?.includes(rosterOrgFilter);
    return matchSearch && matchOrg;
  });

  return (
    <div className="space-y-6">
      <CrudAlertBanner state={crudState} onClose={resetAlert} />
      
      {/* TABS */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button variant={activeTab === 'roster' ? 'primary' : 'outline'} onClick={() => setActiveTab('roster')}>
          <Users className="w-4 h-4 mr-2" /> Plantilla Roster
        </Button>
        <Button variant={activeTab === 'recruit' ? 'primary' : 'outline'} onClick={() => setActiveTab('recruit')}>
          <UserPlus className="w-4 h-4 mr-2" /> Emitir Contrato
        </Button>
        <Button variant={activeTab === 'contracts' ? 'primary' : 'outline'} onClick={() => setActiveTab('contracts')}>
          <FileText className="w-4 h-4 mr-2" /> Contratos Enviados
        </Button>
        <Button variant={activeTab === 'matrix' ? 'primary' : 'outline'} onClick={() => setActiveTab('matrix')}>
          <Layers className="w-4 h-4 mr-2" /> Matriz de Organización
        </Button>
      </div>

      {/* ROSTER TAB */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <FilterBar 
              searchValue={rosterSearch} 
              onSearchChange={setRosterSearch} 
              searchPlaceholder="Buscar en plantilla..." 
              brandColor={game.brandColor} 
            />
            <select 
              className="bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" 
              value={rosterOrgFilter} 
              onChange={e => setRosterOrgFilter(e.target.value)}
            >
              <option value="ALL">Todas las Organizaciones</option>
              {availableOrgs.map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSquad.map(member => (
              <Card key={member.user_id} className="glass-card relative overflow-hidden group border-white/5 bg-black/40">
                <div className="p-4 flex flex-col items-center text-center space-y-3">
                  <Avatar className="w-16 h-16 border-2 border-[var(--primary)]" src={member.avatar_url || member.foto} fallback={member.user_name} />
                  <div>
                    <h3 className="font-bold text-lg">{member.user_name}</h3>
                    <p className="text-sm text-[var(--text-muted)]">{member.gamertag}</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-1">
                    {member.original_orgs?.map((o: string) => (
                      <Badge key={o} variant="slate" className="text-xs">{o.toUpperCase()}</Badge>
                    ))}
                  </div>
                  <Button variant="danger" size="sm" onClick={() => handleExpel(member.user_id)} className="w-full mt-2">
                    <Ban className="w-4 h-4 mr-2"/> Desvincular
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* RECRUIT TAB */}
      {activeTab === 'recruit' && (
        <Card className="glass-card border-white/5 bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus className="text-[var(--primary)]" /> Emitir Nuevo Contrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!selectedPlayer ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Buscar por gamertag o nombre..." value={recruitSearch} onChange={e => setRecruitSearch(e.target.value)} className="bg-black/50" />
                  <Button onClick={loadData}><Search className="w-4 h-4" /></Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {searchablePlayers.map(p => (
                    <div key={p.id} className="p-3 bg-black/30 border border-white/5 rounded-lg flex items-center justify-between hover:border-[var(--primary)]/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar src={p.avatar_url} fallback={p.name} className="w-10 h-10" />
                        <div>
                          <p className="font-bold text-sm">{p.name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{p.gamertag}</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => setSelectedPlayer(p)}>Seleccionar</Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex items-center gap-4 p-4 bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-xl">
                  <Avatar src={selectedPlayer.avatar_url} fallback={selectedPlayer.name} className="w-12 h-12" />
                  <div>
                    <h3 className="font-bold">Contratando a {selectedPlayer.name}</h3>
                    <p className="text-sm opacity-80">Selecciona las organizaciones para el contrato:</p>
                  </div>
                  <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setSelectedPlayer(null)}><X className="w-5 h-5"/></Button>
                </div>

                <div className="flex flex-wrap gap-3">
                  {availableOrgs.map(org => (
                    <div 
                      key={org} 
                      onClick={() => toggleOrgSelection(org)}
                      className={`cursor-pointer px-4 py-3 rounded-lg border flex items-center gap-2 transition-all ${
                        selectedOrgs.includes(org) ? 'bg-[var(--primary)]/20 border-[var(--primary)] text-white' : 'bg-black/40 border-white/10 text-white/60 hover:border-white/30'
                      }`}
                    >
                      {selectedOrgs.includes(org) ? <CheckSquare className="w-5 h-5 text-[var(--primary)]" /> : <div className="w-5 h-5 rounded border border-white/30" />}
                      <span className="font-medium uppercase text-sm">{org}</span>
                    </div>
                  ))}
                </div>

                <Button className="w-full" disabled={selectedOrgs.length === 0 || crudState.status === 'LOADING'} onClick={handleIssueContract}>
                  {crudState.status === 'LOADING' ? <Clock className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Emitir Contrato para {selectedOrgs.length} Organización(es)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CONTRACTS TAB */}
      {activeTab === 'contracts' && (
        <Card className="glass-card border-white/5 bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="text-[var(--primary)]" /> Historial de Contratos Enviados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[var(--text-muted)] uppercase bg-black/50">
                  <tr>
                    <th className="px-4 py-3">Jugador</th>
                    <th className="px-4 py-3">Organización</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map(c => {
                    const orgMatch = c.pitch_message?.match(/\[Organización:\s*([^\]]+)\]/i);
                    const orgName = orgMatch ? orgMatch[1] : 'General';
                    return (
                      <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 font-medium flex items-center gap-2">
                          <Avatar src={c.avatar_url} fallback={c.player_name} className="w-6 h-6" /> {c.player_name}
                        </td>
                        <td className="px-4 py-3 uppercase text-xs">
                          <Badge variant="slate">{orgName}</Badge>
                        </td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">
                          {new Date(c.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={
                            c.status === 'ACEPTADO' ? 'emerald' : 
                            c.status === 'RECHAZADO' ? 'rose' : 
                            c.status === 'CONCLUIDO' ? 'slate' : 'cyan'
                          }>
                            {c.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MATRIX TAB */}
      {activeTab === 'matrix' && (
        <Card className="glass-card border-white/5 bg-black/40 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Layers className="text-[var(--primary)]" /> Matriz de Organizaciones</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-3 text-left bg-black/60 rounded-tl-lg">Atleta</th>
                  {availableOrgs.map(org => (
                    <th key={org} className="p-3 text-center bg-black/40 border-l border-white/5 text-xs uppercase text-[var(--text-muted)]">
                      {org}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, idx) => (
                  <tr key={row.user_id} className={`border-b border-white/5 ${idx % 2 === 0 ? 'bg-black/20' : ''}`}>
                    <td className="p-3 font-medium border-r border-white/5">{row.user_name}</td>
                    {availableOrgs.map(org => {
                      const isActive = row.organizations.some((organization) => organization.name.toLowerCase() === org.toLowerCase());
                      return (
                        <td key={org} className="p-3 text-center border-l border-white/5">
                          {isActive ? (
                            <CheckSquare className="w-5 h-5 mx-auto text-[var(--primary)]" />
                          ) : (
                            <div className="w-5 h-5 mx-auto rounded border border-white/10 opacity-30" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
