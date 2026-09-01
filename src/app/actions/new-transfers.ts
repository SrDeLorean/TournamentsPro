'use server';

/**
 * Unified transfers module re-exports for backward compatibility.
 * All transfer logic is centralized in `@/app/actions/transfers`.
 */
export {
  issueNewContractOfferService,
  respondNewContractOfferService,
  getSentContractsByTeamAction,
  getUserOffersAction,
  createTransferApplicationAction,
  approveExtraordinaryTransferAction,
  rejectExtraordinaryTransferAction,
  createTransferPostAction,
  getTransferPostsAction,
  getCompletedTransfersAction,
  getGameConfigurationAction,
  cancelTransferOfferAction,
  respondOrdinaryTransferApplicationAction,
  cancelTransferApplicationAction,
  cancelTransferPostAction,
} from './transfers';

