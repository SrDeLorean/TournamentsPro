'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Modal } from '@/components/ui/modal';
import {
  Sparkles,
  Search,
  Send,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Loader2,
  Users,
  Building2,
  Filter,
  ArrowRightLeft,
  Briefcase,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { getUserEnrolledTeamsAction } from '@/app/actions/squads';
import {
  getOutgoingOffersAction,
  sendClubContractOfferAction,
  cancelTransferOfferAction,
  createTransferPostAction,
} from '@/app/actions/transfers';
import { getAvailablePlayersForSquadAction } from '@/app/actions/squads';

interface ManagedTeam {
  id: string;
  name: string;
  tag: string;
  gameSlug: string;
  logoUrl?: string | null;
  organizations?: { organization_id: string; organization_name: string }[];
}

interface OutgoingOffer {
  id: string;
  player_user_id: string;
  player_name: string;
  player_gamertag: string;
  position: string;
  pitch_message: string | null;
  status: 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO';
  created_at: string;
  game_slug: string;
}

interface AvailablePlayer {
  id: string;
  name: string;
  gamertag: string;
  position: string;
  secondaryPosition?: string | null;
  rating?: number;
  avatarUrl?: string | null;
  foto?: string | null;
  organizationId?: string | null;
}

type TabType = 'SEARCH_PLAYERS' | 'SENT_OFFERS' | 'POST_VACANCY';

export default function ClubReclutamientoPage() {
  const { currentUser, activeGameSlug } = useAuth();
  const [teams, setTeams] = useState<ManagedTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('SEARCH_PLAYERS');
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);

  // Free Agents State
  const [players, setPlayers] = useState<AvailablePlayer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);

  // Sent Offers State
  const [outgoingOffers, setOutgoingOffers] = useState<OutgoingOffer[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);

  // Offer Modal State
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<AvailablePlayer | null>(null);
  const [offerPosition, setOfferPosition] = useState('DC');
  const [offerPitch, setOfferPitch] = useState('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  // Post Vacancy State
  const [vacancyPosition, setVacancyPosition] = useState('DFC');
  const [vacancyMessage, setVacancyMessage] = useState('');
  const [isPostingVacancy, setIsPostingVacancy] = useState(false);

  // Feedback State
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
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

  // 2. Load Free Agents / Available Players
  const loadAvailablePlayers = useCallback(async () => {
    if (!selectedTeam) return;
    setIsLoadingPlayers(true);
    try {
      const res = await getAvailablePlayersForSquadAction(selectedTeam.id, searchQuery);
      if (res.success && res.players) {
        setPlayers(res.players as unknown as AvailablePlayer[]);
      }
    } catch (err) {
      console.error('Error cargando jugadores disponibles:', err);
    } finally {
      setIsLoadingPlayers(false);
    }
  }, [selectedTeam, searchQuery]);

  useEffect(() => {
    if (activeTab === 'SEARCH_PLAYERS' && selectedTeamId) {
      void loadAvailablePlayers();
    }
  }, [activeTab, selectedTeamId, loadAvailablePlayers]);

  // 3. Load Outgoing Offers
  const loadOutgoingOffers = useCallback(async () => {
    if (!selectedTeamId) return;
    setIsLoadingOffers(true);
    try {
      const res = await getOutgoingOffersAction(selectedTeamId, 'ALL');
      if (res.success && res.data) {
        setOutgoingOffers(res.data as unknown as OutgoingOffer[]);
      }
    } catch (err) {
      console.error('Error cargando ofertas enviadas:', err);
    } finally {
      setIsLoadingOffers(false);
    }
  }, [selectedTeamId]);

  useEffect(() => {
    if (activeTab === 'SENT_OFFERS' && selectedTeamId) {
      void loadOutgoingOffers();
    }
  }, [activeTab, selectedTeamId, loadOutgoingOffers]);

  // Handle Offer Submission
  const handleOpenOfferModal = (player: AvailablePlayer) => {
    setSelectedPlayer(player);
    setOfferPosition(player.position || 'DC');
    setOfferPitch(`Te invitamos a formar parte de ${selectedTeam?.name} para competir en los torneos oficiales.`);
    setIsOfferModalOpen(true);
  };

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !selectedPlayer || !currentUser) return;
    setIsSubmittingOffer(true);
    setFeedback(null);

    const orgName = selectedTeam.organizations?.[0]?.organization_name || 'Organización General';

    const res = await sendClubContractOfferAction({
      teamId: selectedTeam.id,
      playerUserId: selectedPlayer.id,
      offeredByUserId: currentUser.id,
      position: offerPosition,
      organizationId: orgName,
      pitchMessage: offerPitch,
      gameSlug: selectedTeam.gameSlug,
    });

    setIsSubmittingOffer(false);
    if (res.success) {
      setIsOfferModalOpen(false);
      setFeedback({
        type: 'success',
        text: `¡Oferta formal de contrato enviada con éxito a ${selectedPlayer.gamertag || selectedPlayer.name}!`,
      });
      void loadOutgoingOffers();
    } else {
      setFeedback({
        type: 'error',
        text: res.error || 'Error al enviar la oferta de contrato.',
      });
    }
  };

  // Handle Cancel Offer
  const handleCancelOffer = (offerId: string) => {
    startTransition(async () => {
      setOutgoingOffers((prev) => prev.filter((o) => o.id !== offerId));
      const res = await cancelTransferOfferAction(offerId);
      if (res.success) {
        setFeedback({ type: 'success', text: 'Oferta de contrato cancelada.' });
      } else {
        setFeedback({ type: 'error', text: res.error || 'Error al cancelar la oferta.' });
        void loadOutgoingOffers();
      }
    });
  };

  // Handle Post Vacancy
  const handlePostVacancy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !currentUser) return;
    setIsPostingVacancy(true);
    setFeedback(null);

    const res = await createTransferPostAction({
      type: 'CLUB_RECLUTA_JUGADOR',
      gameSlug: selectedTeam.gameSlug,
      position: vacancyPosition,
      message: vacancyMessage || `El club ${selectedTeam.name} busca jugador para la posición ${vacancyPosition}.`,
      teamId: selectedTeam.id,
      userId: currentUser.id,
      userName: currentUser.name || 'Capitán',
      userGamertag: currentUser.gamertag || currentUser.name || 'Capitán',
      platform: 'CROSSPLAY',
    });

    setIsPostingVacancy(false);
    if (res.success) {
      setFeedback({
        type: 'success',
        text: `¡Convocatoria publicada con éxito en el Muro de Traspasos para ${selectedTeam.name}!`,
      });
      setVacancyMessage('');
    } else {
      setFeedback({
        type: 'error',
        text: res.error || 'Error al publicar la vacante.',
      });
    }
  };

  // Filter players by position
  const filteredPlayers = players.filter((p) => {
    if (positionFilter === 'ALL') return true;
    return (
      p.position?.toUpperCase() === positionFilter.toUpperCase() ||
      p.secondaryPosition?.toUpperCase() === positionFilter.toUpperCase()
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300 font-mono">
      <PageHeader
        badgeText="Bolsa Abierta de Convocatorias eSports"
        badgeIcon={<Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
        title="VACANTES &"
        highlightTitle="RECLUTAMIENTO."
        description="Emite propuestas de contrato formal, explora atletas disponibles y gestiona las convocatorias de tu escuadra."
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

      {/* CLUB SELECTOR & NAVIGATION */}
      {isLoadingTeams ? (
        <div className="p-8 text-center text-[var(--text-muted)] text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          Cargando tus escuadras gestionadas...
        </div>
      ) : teams.length === 0 ? (
        <Card className="border-[var(--border-card)] bg-[var(--bg-card)] p-8 text-center space-y-3">
          <Shield className="w-10 h-10 mx-auto text-[var(--text-muted)] opacity-50" />
          <h3 className="text-base font-black uppercase text-[var(--text-heading)]">No gestionas ningún equipo activo</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            Para ofertar a jugadores y abrir vacantes de reclutamiento, debes ser Capitán o Encargado de una escuadra.
          </p>
          <Link href="/equipos" className="inline-block mt-2">
            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs">
              Crear o Unirte a un Club
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* CLUB SELECTOR BAR */}
          <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar
                src={selectedTeam?.logoUrl || undefined}
                fallback={selectedTeam?.tag || selectedTeam?.name.slice(0, 2).toUpperCase()}
                size="md"
                className="ring-2 ring-[var(--accent-cyan)]/40"
              />
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block font-bold">
                  Club Emisor de Fichajes
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="bg-[var(--bg-main)] text-[var(--text-heading)] font-black text-sm uppercase px-3 py-1.5 rounded-xl border border-[var(--border-card)] focus:outline-none focus:border-[var(--accent-cyan)]"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.gameSlug.toUpperCase()})
                      </option>
                    ))}
                  </select>
                  {selectedTeam?.organizations?.[0] && (
                    <Badge variant="violet" className="text-[10px] font-mono hidden md:inline-flex">
                      {selectedTeam.organizations[0].organization_name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* TAB SELECTORS */}
            <div className="flex items-center gap-1.5 bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-card)] w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('SEARCH_PLAYERS')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'SEARCH_PLAYERS'
                    ? 'bg-[var(--accent-cyan)] text-black shadow-md'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Buscar Atletas</span>
              </button>
              <button
                onClick={() => setActiveTab('SENT_OFFERS')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'SENT_OFFERS'
                    ? 'bg-[var(--accent-cyan)] text-black shadow-md'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ofertas Enviadas</span>
              </button>
              <button
                onClick={() => setActiveTab('POST_VACANCY')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'POST_VACANCY'
                    ? 'bg-[var(--accent-cyan)] text-black shadow-md'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Publicar Vacante</span>
              </button>
            </div>
          </div>

          {/* TAB 1: BUSCAR ATLETAS */}
          {activeTab === 'SEARCH_PLAYERS' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Buscar por Gamertag o Nombre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 text-xs bg-[var(--bg-main)] border-[var(--border-card)] font-mono"
                  />
                </div>

                {/* POSITION FILTER PILLS */}
                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  {['ALL', 'DC', 'MCO', 'MC', 'MCD', 'DFC', 'LD', 'LI', 'EI', 'ED', 'PO'].map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setPositionFilter(pos)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                        positionFilter === pos
                          ? 'bg-cyan-500 text-black'
                          : 'bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-white border border-[var(--border-card)]'
                      }`}
                    >
                      {pos === 'ALL' ? 'TODAS' : pos}
                    </button>
                  ))}
                </div>
              </div>

              {isLoadingPlayers ? (
                <div className="p-12 text-center text-[var(--text-muted)] text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  Buscando atletas disponibles...
                </div>
              ) : filteredPlayers.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-[var(--border-card)] text-[var(--text-muted)] text-xs space-y-2">
                  <Users className="w-8 h-8 mx-auto text-[var(--text-muted)] opacity-50" />
                  <p className="font-bold text-[var(--text-primary)]">No se encontraron atletas disponibles para este filtro.</p>
                  <p>Intenta con otra posición o término de búsqueda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-cyan-500/50 transition-all flex flex-col justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar
                          src={player.avatarUrl || player.foto || undefined}
                          fallback={player.gamertag?.slice(0, 2).toUpperCase() || 'PL'}
                          size="md"
                          className="ring-2 ring-cyan-500/30 flex-shrink-0"
                        />
                        <div className="min-w-0 space-y-1">
                          <h4 className="font-black text-sm text-[var(--text-heading)] uppercase truncate">
                            {player.gamertag || player.name}
                          </h4>
                          <p className="text-[11px] text-[var(--text-muted)] truncate">{player.name}</p>
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            <Badge variant="cyan" className="text-[10px] font-mono">
                              {player.position || 'DFC'}
                            </Badge>
                            {player.secondaryPosition && (
                              <Badge variant="slate" className="text-[10px] font-mono text-[var(--text-muted)]">
                                {player.secondaryPosition}
                              </Badge>
                            )}
                            <Badge variant="gold" className="text-[10px] font-mono">
                              ★ {player.rating || '9.0'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleOpenOfferModal(player)}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Ofertar Contrato
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: OFERTAS ENVIADAS */}
          {activeTab === 'SENT_OFFERS' && (
            <Card className="border-[var(--border-card)] bg-[var(--bg-card)]">
              <CardHeader className="border-b border-[var(--border-card)]">
                <CardTitle className="text-base font-black uppercase text-[var(--text-heading)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-cyan-400" />
                    <span>Propuestas de Contrato Emitidas por {selectedTeam?.name}</span>
                  </div>
                  <Badge variant="cyan" className="text-xs font-mono">
                    {outgoingOffers.length} Emitida{outgoingOffers.length !== 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoadingOffers ? (
                  <div className="p-12 text-center text-[var(--text-muted)] text-xs flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    Cargando propuestas enviadas...
                  </div>
                ) : outgoingOffers.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl border border-dashed border-[var(--border-card)] text-[var(--text-muted)] text-xs space-y-2">
                    <Send className="w-8 h-8 mx-auto text-[var(--text-muted)] opacity-50" />
                    <p className="font-bold text-[var(--text-primary)]">No has emitido ofertas de contrato desde este club.</p>
                    <p>Usa la pestaña &ldquo;Buscar Atletas&rdquo; para convocar agentes libres a tu plantilla.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {outgoingOffers.map((offer) => (
                      <div
                        key={offer.id}
                        className="p-4 rounded-xl border border-[var(--border-card)] bg-[var(--bg-main)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-sm text-[var(--text-heading)] uppercase">
                              {offer.player_gamertag || offer.player_name}
                            </span>
                            <Badge variant="cyan" className="text-[10px] font-mono">
                              Posición: {offer.position}
                            </Badge>
                            <Badge
                              variant={
                                offer.status === 'ACEPTADO'
                                  ? 'emerald'
                                  : offer.status === 'RECHAZADO'
                                  ? 'rose'
                                  : 'violet'
                              }
                              className="text-[10px] font-mono"
                            >
                              {offer.status}
                            </Badge>
                          </div>
                          {offer.pitch_message && (
                            <p className="text-[11px] text-[var(--text-muted)] italic">
                              &ldquo;{offer.pitch_message}&rdquo;
                            </p>
                          )}
                          <p className="text-[10px] text-[var(--text-muted)]">
                            Enviada el {new Date(offer.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        {offer.status === 'PENDIENTE' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isPending}
                            onClick={() => handleCancelOffer(offer.id)}
                            className="text-rose-400 hover:bg-rose-500/10 font-bold text-xs flex items-center gap-1 self-end sm:self-center"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Cancelar Oferta
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* TAB 3: PUBLICAR VACANTE */}
          {activeTab === 'POST_VACANCY' && (
            <Card className="border-[var(--border-card)] bg-[var(--bg-card)] max-w-2xl mx-auto">
              <CardHeader className="border-b border-[var(--border-card)]">
                <CardTitle className="text-base font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-cyan-400" />
                  <span>Publicar Convocatoria Abierta en el Muro de Traspasos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handlePostVacancy} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase block mb-1.5">
                      Club Convocante
                    </label>
                    <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] font-black text-sm text-[var(--text-heading)] uppercase">
                      {selectedTeam?.name} ({selectedTeam?.gameSlug.toUpperCase()})
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase block mb-1.5">
                      Posición Táctica Solicitada
                    </label>
                    <select
                      value={vacancyPosition}
                      onChange={(e) => setVacancyPosition(e.target.value)}
                      className="w-full bg-[var(--bg-main)] text-[var(--text-heading)] font-mono text-xs p-3 rounded-xl border border-[var(--border-card)] focus:outline-none focus:border-[var(--accent-cyan)]"
                    >
                      {['DFC', 'LD', 'LI', 'MCD', 'MC', 'MCO', 'DC', 'EI', 'ED', 'PO'].map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase block mb-1.5">
                      Mensaje / Requisitos de la Convocatoria
                    </label>
                    <textarea
                      rows={3}
                      value={vacancyMessage}
                      onChange={(e) => setVacancyMessage(e.target.value)}
                      placeholder={`Ej: Buscamos ${vacancyPosition} con experiencia para competir en la liga oficial de la organización.`}
                      className="w-full bg-[var(--bg-main)] text-[var(--text-heading)] font-mono text-xs p-3 rounded-xl border border-[var(--border-card)] focus:outline-none focus:border-[var(--accent-cyan)]"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isPostingVacancy}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isPostingVacancy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Briefcase className="w-4 h-4" />
                    )}
                    Publicar Convocatoria en Traspasos
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* MODAL OFERTAR CONTRATO FORMAL */}
      <Modal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        title={`OFERTA DE CONTRATO A ${selectedPlayer?.gamertag || selectedPlayer?.name || 'JUGADOR'}`}
      >
        <form onSubmit={handleSendOffer} className="space-y-4 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] flex items-center gap-3">
            <Avatar
              src={selectedPlayer?.avatarUrl || selectedPlayer?.foto || undefined}
              fallback={selectedPlayer?.gamertag?.slice(0, 2).toUpperCase() || 'PL'}
              size="md"
              className="ring-2 ring-cyan-500/30"
            />
            <div>
              <h4 className="font-black text-sm text-[var(--text-heading)] uppercase">
                {selectedPlayer?.gamertag || selectedPlayer?.name}
              </h4>
              <p className="text-[10px] text-[var(--text-muted)]">Atleta Agente Libre</p>
            </div>
          </div>

          <div>
            <label className="font-bold text-[var(--text-muted)] uppercase block mb-1">
              Posición Táctica Asignada en Roster
            </label>
            <select
              value={offerPosition}
              onChange={(e) => setOfferPosition(e.target.value)}
              className="w-full bg-[var(--bg-main)] text-[var(--text-heading)] font-mono text-xs p-2.5 rounded-xl border border-[var(--border-card)] focus:outline-none focus:border-cyan-400"
            >
              {['DFC', 'LD', 'LI', 'MCD', 'MC', 'MCO', 'DC', 'EI', 'ED', 'PO'].map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-[var(--text-muted)] uppercase block mb-1">
              Mensaje de Propuesta / Condiciones
            </label>
            <textarea
              rows={3}
              value={offerPitch}
              onChange={(e) => setOfferPitch(e.target.value)}
              className="w-full bg-[var(--bg-main)] text-[var(--text-heading)] font-mono text-xs p-2.5 rounded-xl border border-[var(--border-card)] focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-cyan-300">
            ℹ Al aceptar, el atleta se integrará de forma inmediata a la plantilla oficial de{' '}
            <span className="font-bold uppercase">{selectedTeam?.name}</span>.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOfferModalOpen(false)}
              className="text-xs text-[var(--text-muted)]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmittingOffer}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md px-4"
            >
              {isSubmittingOffer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Enviar Oferta Formal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
