// =============================================================================
// TournamentsPro — Squads & Team Roster Service
// =============================================================================

import { dbProvider } from '@/lib/db/provider';
import { getErrorMessage, type AvailablePlayerRow, type SquadWithOrganizations } from './types';

export interface AddPlayerToSquadResult {
  success: boolean;
  error?: string;
  code?: string;
}

export interface RemovePlayerFromSquadResult {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
}

export interface GetTeamSquadResult {
  success: boolean;
  squad?: Array<{
    id: string;
    team_id: string;
    user_id: string;
    user_name: string;
    gamertag: string;
    email?: string;
    tactical_position: string;
    role_in_team: 'Capitan' | 'Capitán' | 'Encargado' | 'Jugador' | 'DT / Analyst';
    jersey_number?: number | null;
    avatar_url?: string | null;
    foto?: string | null;
    joined_at: string;
    organization_name?: string | null;
    organization_names?: string;
    organization_ids?: string;
    member_org_names?: string[];
  }>;
  error?: string;
  code?: string;
}

export interface GetTeamRosterForMatchReportResult {
  success: boolean;
  roster?: Array<{
    id: string;
    user_id: string;
    user_name: string;
    gamertag: string;
    position: string;
    jersey_number: number | null;
    role_in_team: string;
  }>;
  error?: string;
  code?: string;
}

export async function getAvailablePlayersForSquadService(
  teamId: string,
  searchQuery?: string,
  organizerUserId?: string
): Promise<{ success: boolean; players: AvailablePlayerRow[]; error?: string }> {
  try {
    const team = await dbProvider.teams.findById(teamId);
    if (!team) {
      return { success: false, players: [], error: 'Equipo no encontrado' };
    }

    let organizerOrgId = team.organizationId;
    if (organizerUserId && !organizerOrgId) {
      const org = await dbProvider.organizations.findByOwnerId(organizerUserId);
      if (org) organizerOrgId = org.id;
    }

    const players = await dbProvider.users.getAvailablePlayers({ organizerOrgId, searchQuery });
    return { success: true, players };
  } catch (error: unknown) {
    console.error('Error en getAvailablePlayersForSquadService:', error);
    return { success: false, players: [], error: getErrorMessage(error, 'Error al buscar jugadores') };
  }
}

export async function getTeamSquadService(teamId: string): Promise<GetTeamSquadResult> {
  try {
    if (!teamId) return { success: false, error: 'ID de equipo requerido.', code: 'MISSING_PARAMS' };

    const squadRows = await dbProvider.teams.getSquad(teamId);
    const acceptedOffers = await dbProvider.teams.getAcceptedOffers(teamId);
    const compOrgs = await dbProvider.teams.getTeamCompetitionOrganizations(teamId);

    const userMap: Record<string, SquadWithOrganizations> = {};
    for (const r of squadRows) {
      if (!userMap[r.user_id]) {
        userMap[r.user_id] = { ...r, member_org_names: [] };
      }
      if (r.organization_name) {
        userMap[r.user_id].member_org_names.push(r.organization_name);
      }
    }
    const uniqueSquad = Object.values(userMap);

    const squadWithOrgs = uniqueSquad.map((member) => {
      const orgNamesSet = new Set<string>();
      const orgIdsSet = new Set<string>();

      for (const org of member.member_org_names) {
        orgNamesSet.add(org);
        orgIdsSet.add(org);
      }

      for (const off of acceptedOffers) {
        if (off.player_user_id === member.user_id && off.pitch_message) {
          const match = off.pitch_message.match(/\[Organización:\s*([^\]]+)\]/i);
          if (match && match[1]) {
            const orgVal = match[1].trim();
            orgNamesSet.add(orgVal);
            orgIdsSet.add(orgVal);
          }
        }
      }

      if (orgNamesSet.size === 0) {
        for (const co of compOrgs) {
          if (co.org_name) orgNamesSet.add(co.org_name);
          if (co.org_id) orgIdsSet.add(co.org_id);
        }
      }

      return {
        ...member,
        organization_ids: Array.from(orgIdsSet).join(','),
        organization_names: Array.from(orgNamesSet).join(','),
      };
    });

    return { success: true, squad: squadWithOrgs };
  } catch (error: unknown) {
    console.error('Error en getTeamSquadService:', error);
    return { success: false, error: getErrorMessage(error, 'Error al obtener la plantilla.'), code: 'INTERNAL_ERROR' };
  }
}

export async function addPlayerToSquadService(
  teamId: string,
  userId: string,
  tacticalPosition?: string,
  roleInTeam: 'Capitan' | 'Capitán' | 'Encargado' | 'Jugador' | 'DT / Analyst' = 'Jugador',
  targetOrganizationId?: string | null,
  actorUserId?: string
): Promise<AddPlayerToSquadResult> {
  return dbProvider.withTransaction(async (transaction) => {
    const user = await transaction.users.findById(userId, { forUpdate: true });
    if (!user) return { success: false, error: 'Jugador no encontrado', code: 'USER_NOT_FOUND' };

    const currentTeam = await transaction.teams.findById(teamId, { forUpdate: true });
    if (!currentTeam) return { success: false, error: 'Equipo no encontrado', code: 'TEAM_NOT_FOUND' };

    if (actorUserId) {
      const actor = await transaction.users.findById(actorUserId, { forUpdate: true });
      if (actor?.role === 'Organizador') {
        const organizerOrgId = actor.organizationId;
        if (!organizerOrgId || (currentTeam.organizationId && currentTeam.organizationId !== organizerOrgId)) {
          return {
            success: false,
            error: 'Como organizador, solamente puedes agregar jugadores a plantillas de tu propia organización.',
            code: 'FORBIDDEN',
          };
        }
      }
    }

    const maxSquadSize = currentTeam.maxMembers || (currentTeam.gameSlug === 'eafc26' ? 20 : 7);
    if ((currentTeam.membersCount || 0) >= maxSquadSize) {
      return { success: false, error: `La escuadra ya cuenta con el máximo permitido de ${maxSquadSize} integrantes.` };
    }

    const positionToUse = tacticalPosition || user.position || 'DFC';
    const normalizedRole = roleInTeam === 'Capitan' ? 'Capitán' : roleInTeam;

    const finalOrgId = targetOrganizationId || currentTeam.organizationId || user.organizationId || null;
    let finalOrgName: string | undefined;

    if (finalOrgId) {
      const org = await transaction.organizations.findById(finalOrgId, { forUpdate: true });
      if (org) {
        finalOrgName = org.name;
      }
    }

    await transaction.teams.addSquadMember(teamId, userId, positionToUse, normalizedRole, finalOrgName);

    if (finalOrgId) {
      await transaction.users.update(userId, { organizationId: finalOrgId });
      if (!currentTeam.organizationId) {
        await transaction.teams.update(teamId, { organizationId: finalOrgId });
      }
    }

    return { success: true };
  });
}

export async function updateSquadMemberRoleService(
  teamId: string,
  userId: string,
  newRole: 'Capitán' | 'Capitan' | 'Encargado' | 'DT / Analyst' | 'Jugador',
): Promise<{ success: boolean; error?: string; code?: string }> {
  return dbProvider.withTransaction(async (transaction) => {
    const team = await transaction.teams.findById(teamId);
    if (!team) return { success: false, error: 'Equipo no encontrado', code: 'TEAM_NOT_FOUND' };

    const user = await transaction.users.findById(userId);
    if (!user) return { success: false, error: 'Usuario no encontrado', code: 'USER_NOT_FOUND' };

    const isPromotingToCaptain = newRole === 'Capitán' || newRole === 'Capitan';
    if (!isPromotingToCaptain && team.captainId === userId) {
      return {
        success: false,
        error: 'No puedes degradar al Capitán sin transferir la capitanía a otro integrante primero.',
        code: 'CAPTAIN_DEMOTION_FORBIDDEN',
      };
    }

    await transaction.teams.updateSquadMemberRole(teamId, userId, newRole, user.name || user.gamertag || 'Capitán');
    return { success: true };
  });
}

export async function removePlayerFromSquadService(teamId: string, userId: string, orgName?: string): Promise<RemovePlayerFromSquadResult> {
  return dbProvider.withTransaction(async (transaction) => {
    const user = await transaction.users.findById(userId);
    if (!user) return { success: false, error: 'Usuario no encontrado', code: 'USER_NOT_FOUND' };
    const team = await transaction.teams.findById(teamId);
    if (!team) return { success: false, error: 'Equipo no encontrado', code: 'TEAM_NOT_FOUND' };

    await transaction.teams.removeSquadMember(teamId, userId, orgName);
    return { success: true };
  });
}

export async function updateSquadMemberJerseyService(memberId: string, jerseyNumber: number | null) {
  if (!memberId) return { success: false, error: 'ID de miembro de plantilla requerido.' };
  try {
    await dbProvider.teams.updateSquadMemberJersey(memberId, jerseyNumber);
    return { success: true, message: 'Dorsal asignado y actualizado exitosamente.' };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, 'Error al actualizar dorsal.') };
  }
}

export async function getTeamRosterForMatchReportService(teamId: string): Promise<GetTeamRosterForMatchReportResult> {
  try {
    const roster = await dbProvider.query<{
      id: string;
      user_id: string;
      user_name: string;
      gamertag: string;
      position: string;
      jersey_number: number | null;
      role_in_team: string;
    }>(
      `SELECT tm.id, tm.user_id, u.name as user_name, u.gamertag, tm.tactical_position as position, tm.jersey_number, tm.role_in_team
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = ?
       ORDER BY tm.role_in_team ASC, u.name ASC`,
      [teamId]
    );

    return { success: true, roster };
  } catch (error: unknown) {
    console.error('Error en getTeamRosterForMatchReportService:', error);
    return { success: false, roster: [], error: getErrorMessage(error, 'Error al cargar plantilla.'), code: 'INTERNAL_ERROR' };
  }
}
