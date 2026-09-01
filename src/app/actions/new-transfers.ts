'use server';

import {
  issueNewContractOfferService as issueNewContractOfferServiceOriginal,
  respondNewContractOfferService as respondNewContractOfferServiceOriginal,
  getSentContractsByTeamAction as getSentContractsByTeamActionOriginal,
  getUserOffersAction as getUserOffersActionOriginal,
  createTransferApplicationAction as createTransferApplicationActionOriginal,
  approveExtraordinaryTransferAction as approveExtraordinaryTransferActionOriginal,
  rejectExtraordinaryTransferAction as rejectExtraordinaryTransferActionOriginal,
  createTransferPostAction as createTransferPostActionOriginal,
  getTransferPostsAction as getTransferPostsActionOriginal,
  getCompletedTransfersAction as getCompletedTransfersActionOriginal,
  getGameConfigurationAction as getGameConfigurationActionOriginal,
  cancelTransferOfferAction as cancelTransferOfferActionOriginal,
  respondOrdinaryTransferApplicationAction as respondOrdinaryTransferApplicationActionOriginal,
  cancelTransferApplicationAction as cancelTransferApplicationActionOriginal,
  cancelTransferPostAction as cancelTransferPostActionOriginal,
} from './transfers';

export async function issueNewContractOfferService(
  teamId: string,
  playerUserId: string,
  offeredByUserId: string,
  orgNames: string[],
  position: string,
  gameSlug: string
) {
  return issueNewContractOfferServiceOriginal(teamId, playerUserId, offeredByUserId, orgNames, position, gameSlug);
}

export async function respondNewContractOfferService(offerId: string, action: 'ACEPTADO' | 'RECHAZADO') {
  return respondNewContractOfferServiceOriginal(offerId, action);
}

export async function getSentContractsByTeamAction(teamId: string) {
  return getSentContractsByTeamActionOriginal(teamId);
}

export async function getUserOffersAction(userId: string) {
  return getUserOffersActionOriginal(userId);
}

export async function createTransferApplicationAction(data: Parameters<typeof createTransferApplicationActionOriginal>[0]) {
  return createTransferApplicationActionOriginal(data);
}

export async function approveExtraordinaryTransferAction(applicationId: string, organizerUserId: string) {
  return approveExtraordinaryTransferActionOriginal(applicationId, organizerUserId);
}

export async function rejectExtraordinaryTransferAction(applicationId: string, organizerUserId: string) {
  return rejectExtraordinaryTransferActionOriginal(applicationId, organizerUserId);
}

export async function createTransferPostAction(data: Parameters<typeof createTransferPostActionOriginal>[0]) {
  return createTransferPostActionOriginal(data);
}

export async function getTransferPostsAction(gameSlug: string, timeFilter?: 'TODAY' | '3_DAYS' | '7_DAYS' | 'ALL') {
  return getTransferPostsActionOriginal(gameSlug, timeFilter);
}

export async function getCompletedTransfersAction(gameSlug: string) {
  return getCompletedTransfersActionOriginal(gameSlug);
}

export async function getGameConfigurationAction(gameSlug: string) {
  return getGameConfigurationActionOriginal(gameSlug);
}

export async function cancelTransferOfferAction(offerId: string) {
  return cancelTransferOfferActionOriginal(offerId);
}

export async function respondOrdinaryTransferApplicationAction(applicationId: string, accept: boolean) {
  return respondOrdinaryTransferApplicationActionOriginal(applicationId, accept);
}

export async function cancelTransferApplicationAction(applicationId: string) {
  return cancelTransferApplicationActionOriginal(applicationId);
}

export async function cancelTransferPostAction(postId: string, teamId?: string) {
  return cancelTransferPostActionOriginal(postId, teamId);
}


