'use server';

import {
  getTeamSquadAction,
  getPlayerInscriptionsMatrixAction,
  removePlayerFromSquadAction,
  getUserEnrolledTeamsAction as getUserEnrolledTeamsActionOriginal,
  addPlayerToSquadAction,
  updateSquadMemberJerseyAction,
  updateSquadMemberRoleAction,
  transferCaptaincyAction,
} from './squads';

export async function getNewTeamSquadAction(teamId: string) {
  return getTeamSquadAction(teamId);
}

export async function getNewPlayerInscriptionsMatrixAction(teamId: string, gameSlug?: string) {
  return getPlayerInscriptionsMatrixAction(teamId, gameSlug);
}

export async function expelPlayerFromSquadAction(teamId: string, userId: string, orgName?: string) {
  return removePlayerFromSquadAction(teamId, userId, orgName);
}

export async function getUserEnrolledTeamsAction(userId: string, gameSlug?: string) {
  return getUserEnrolledTeamsActionOriginal(userId, gameSlug);
}

export async function addPlayerToSquadActionWrapper(teamId: string, userId: string, position?: string, roleInTeam?: 'Capitan' | 'Capitán' | 'Encargado' | 'Jugador' | 'DT / Analyst') {
  return addPlayerToSquadAction(teamId, userId, position, roleInTeam as any);
}

export async function updateSquadMemberJerseyActionWrapper(memberId: string, jerseyNumber: number | null) {
  return updateSquadMemberJerseyAction(memberId, jerseyNumber);
}

export async function updateSquadMemberRoleActionWrapper(
  teamId: string,
  userId: string,
  newRole: 'Capitan' | 'Capitán' | 'Encargado' | 'DT / Analyst' | 'Jugador'
) {
  return updateSquadMemberRoleAction(teamId, userId, newRole);
}

export async function transferCaptaincyActionWrapper(teamId: string, newCaptainUserId: string) {
  return transferCaptaincyAction(teamId, newCaptainUserId);
}


