'use server';

/**
 * Unified squads module re-exports for backward compatibility.
 * All squad logic is centralized in `@/app/actions/squads`.
 */
export {
  getTeamSquadAction as getNewTeamSquadAction,
  getPlayerInscriptionsMatrixAction as getNewPlayerInscriptionsMatrixAction,
  removePlayerFromSquadAction as expelPlayerFromSquadAction,
  getUserEnrolledTeamsAction,
  getTeamSquadAction,
  addPlayerToSquadAction,
  removePlayerFromSquadAction,
  updateSquadMemberJerseyAction,
  updateSquadMemberRoleAction,
  transferCaptaincyAction,
} from './squads';

