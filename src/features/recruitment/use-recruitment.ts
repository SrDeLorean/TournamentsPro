'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { getAvailablePlayersForSquadAction, getUserEnrolledTeamsAction } from '@/app/actions/squads';
import {
  cancelTransferOfferAction,
  createTransferPostAction,
  getOutgoingOffersAction,
  sendClubContractOfferAction,
} from '@/app/actions/transfers';
import type { AvailablePlayer, ManagedTeam, OutgoingOffer, RecruitmentTab } from './types';

export function useRecruitment() {
  const { currentUser } = useAuth();
  const [teams, setTeams] = useState<ManagedTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [activeTab, setActiveTab] = useState<RecruitmentTab>('SEARCH_PLAYERS');
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [players, setPlayers] = useState<AvailablePlayer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [outgoingOffers, setOutgoingOffers] = useState<OutgoingOffer[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const playersCacheKeyRef = useRef('');
  const offersCacheKeyRef = useRef('');
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<AvailablePlayer | null>(null);
  const [offerPosition, setOfferPosition] = useState('DC');
  const [offerPitch, setOfferPitch] = useState('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [vacancyPosition, setVacancyPosition] = useState('DFC');
  const [vacancyMessage, setVacancyMessage] = useState('');
  const [isPostingVacancy, setIsPostingVacancy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedTeam = teams.find((team) => team.id === selectedTeamId) || teams[0];

  useEffect(() => {
    if (!currentUser?.id) {
      const timer = window.setTimeout(() => setIsLoadingTeams(false), 0);
      return () => window.clearTimeout(timer);
    }
    getUserEnrolledTeamsAction(currentUser.id, 'ALL').then((res) => {
      if (res.success && res.teams && res.teams.length > 0) {
        setTeams(res.teams as unknown as ManagedTeam[]);
        setSelectedTeamId(res.teams[0].id);
      }
      setIsLoadingTeams(false);
    });
  }, [currentUser?.id]);

  const loadAvailablePlayers = useCallback(async (force = false) => {
    if (!selectedTeam) return;
    const cacheKey = `${selectedTeam.id}:${searchQuery.trim().toLowerCase()}`;
    if (!force && playersCacheKeyRef.current === cacheKey) return;
    playersCacheKeyRef.current = cacheKey;
    setIsLoadingPlayers(true);
    try {
      const res = await getAvailablePlayersForSquadAction(selectedTeam.id, searchQuery);
      if (res.success && res.players) setPlayers(res.players as unknown as AvailablePlayer[]);
    } catch (error) {
      playersCacheKeyRef.current = '';
      console.error('Error cargando jugadores disponibles:', error);
    } finally {
      setIsLoadingPlayers(false);
    }
  }, [selectedTeam, searchQuery]);

  useEffect(() => {
    if (activeTab === 'SEARCH_PLAYERS' && selectedTeamId) {
      const timer = window.setTimeout(() => void loadAvailablePlayers(), 180);
      return () => window.clearTimeout(timer);
    }
  }, [activeTab, selectedTeamId, loadAvailablePlayers]);

  const loadOutgoingOffers = useCallback(async (force = false, background = false) => {
    if (!selectedTeamId) return;
    if (!force && offersCacheKeyRef.current === selectedTeamId) return;
    offersCacheKeyRef.current = selectedTeamId;
    if (!background) setIsLoadingOffers(true);
    try {
      const res = await getOutgoingOffersAction(selectedTeamId, 'ALL');
      if (res.success && res.data) setOutgoingOffers(res.data as unknown as OutgoingOffer[]);
    } catch (error) {
      offersCacheKeyRef.current = '';
      console.error('Error cargando ofertas enviadas:', error);
    } finally {
      if (!background) setIsLoadingOffers(false);
    }
  }, [selectedTeamId]);

  useEffect(() => {
    if (activeTab === 'SENT_OFFERS' && selectedTeamId) {
      const timer = window.setTimeout(() => void loadOutgoingOffers(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [activeTab, selectedTeamId, loadOutgoingOffers]);

  useEffect(() => {
    if (!selectedTeamId || activeTab === 'SENT_OFFERS') return;
    const timer = window.setTimeout(() => void loadOutgoingOffers(false, true), 250);
    return () => window.clearTimeout(timer);
  }, [activeTab, loadOutgoingOffers, selectedTeamId]);

  const openOfferModal = (player: AvailablePlayer) => {
    setSelectedPlayer(player);
    setOfferPosition(player.position || 'DC');
    setOfferPitch(`Te invitamos a formar parte de ${selectedTeam?.name} para competir en los torneos oficiales.`);
    setIsOfferModalOpen(true);
  };

  const sendOffer = async (event: FormEvent) => {
    event.preventDefault();
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
      void loadOutgoingOffers(true);
    } else {
      setFeedback({ type: 'error', text: res.error || 'Error al enviar la oferta de contrato.' });
    }
  };

  const cancelOffer = (offerId: string) => {
    startTransition(async () => {
      setOutgoingOffers((previous) => previous.filter((offer) => offer.id !== offerId));
      const res = await cancelTransferOfferAction(offerId);
      if (res.success) {
        setFeedback({ type: 'success', text: 'Oferta de contrato cancelada.' });
      } else {
        setFeedback({ type: 'error', text: res.error || 'Error al cancelar la oferta.' });
        void loadOutgoingOffers(true);
      }
    });
  };

  const postVacancy = async (event: FormEvent) => {
    event.preventDefault();
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
      setFeedback({ type: 'success', text: `¡Convocatoria publicada con éxito en el Muro de Traspasos para ${selectedTeam.name}!` });
      setVacancyMessage('');
    } else {
      setFeedback({ type: 'error', text: res.error || 'Error al publicar la vacante.' });
    }
  };

  const filteredPlayers = players.filter((player) =>
    positionFilter === 'ALL' ||
    player.position?.toUpperCase() === positionFilter.toUpperCase() ||
    player.secondaryPosition?.toUpperCase() === positionFilter.toUpperCase()
  );

  return {
    teams, selectedTeamId, setSelectedTeamId, activeTab, setActiveTab, isLoadingTeams, selectedTeam,
    filteredPlayers, searchQuery, setSearchQuery, positionFilter, setPositionFilter, isLoadingPlayers,
    outgoingOffers, isLoadingOffers, isPending, openOfferModal, cancelOffer,
    isOfferModalOpen, setIsOfferModalOpen, selectedPlayer, offerPosition, setOfferPosition,
    offerPitch, setOfferPitch, isSubmittingOffer, sendOffer,
    vacancyPosition, setVacancyPosition, vacancyMessage, setVacancyMessage, isPostingVacancy, postVacancy,
    feedback, setFeedback,
  };
}

export type RecruitmentState = ReturnType<typeof useRecruitment>;
