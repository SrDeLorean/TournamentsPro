'use server';

import { revalidatePath } from 'next/cache';
import { dbProvider } from '@/lib/db/provider';
import { z } from 'zod';
import { validateSchema, requiredIdSchema } from '@/lib/validation';
import {
  getServerUserSession,
  requireServerActor,
  requireTeamManager,
  requireUserManager,
} from '@/lib/auth-server';
import {
  getTeamSquadService,
  getAvailablePlayersForSquadService,
  getAllPlayersForContractOfferService,
  addPlayerToSquadService,
  removePlayerFromSquadService,
  updateSquadMemberJerseyService,
  updateSquadMemberRoleService,
} from '@/lib/services';
import { getActionErrorMessage } from '@/lib/action-utils';

export interface SquadMemberData {
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
}

export interface AvailablePlayerData {
  id: string;
  name: string;
  gamertag: string;
  email: string;
  position: string;
  primary_game_slug: string;
  organization_id?: string | null;
  avatar_url?: string | null;
  foto?: string | null;
}

interface OrganizationEntry { id: string; name: string; acronym: string; competitionName: string | null }
interface PlayerMatrixRow {
  user_id: string; user_name: string; gamertag: string; team_id: string; team_name: string;
  jersey_number: number | null; tactical_position: string | null; member_org_name: string | null;
  organization_id: string | null; organization_name: string | null; organization_acronym: string | null;
  competition_name: string | null;
}
interface PlayerMatrixEntry {
  user_id: string; user_name: string; gamertag: string; team_id: string; team_name: string;
  jersey_number: number | null; tactical_position: string | null; organizations: OrganizationEntry[];
}
interface AcceptedPlayerOffer { player_user_id: string; pitch_message: string | null }
interface EnrolledTeamRow {
  team_id: string; team_name: string; team_tag: string | null; logo_url: string | null; banner_url: string | null;
  captain_id: string | null; captain_name: string | null; game_slug: string | null; jersey_number: number | null;
  tactical_position: string | null; role_in_team: string | null; competition_id: string | null;
  competition_name: string | null; organization_id: string | null; organization_name: string | null;
  organization_acronym: string | null;
}
interface AcceptedTeamOffer { team_id: string; pitch_message: string | null }
interface TeamOrganizationEntry { id: string; name: string; acronym: string; competitions: string[] }
interface EnrolledTeamEntry {
  id: string; name: string; tag: string; logoUrl: string | null; bannerUrl: string | null;
  captainId: string | null; captainName: string; gameSlug: string; jerseyNumber: number | null;
  tacticalPosition: string; roleInTeam: string; organizationsMap: Record<string, TeamOrganizationEntry>;
}

export async function getTeamSquadAction(teamId: string) {
  try {
    if (!teamId) return { success: false, squad: [], error: 'ID de equipo requerido.', code: 'MISSING_PARAMS' };

    const result = await getTeamSquadService(teamId);
    return result;
  } catch (error: unknown) {
    console.error('Error en getTeamSquadAction:', error);
    return { success: false, squad: [], error: getActionErrorMessage(error, 'Error al obtener la plantilla.'), code: 'INTERNAL_ERROR' };
  }
}

export async function getAvailablePlayersForSquadAction(
  teamId: string,
  searchQuery?: string,
  organizerUserId?: string
) {
  void organizerUserId;
  try {
    if (!teamId) return { success: false, players: [], error: 'ID de equipo requerido.', code: 'MISSING_PARAMS' };

    await requireTeamManager(teamId);
    const session = await getServerUserSession();
    const effectiveOrganizerId = session?.userId;

    const result = await getAvailablePlayersForSquadService(teamId, searchQuery, effectiveOrganizerId);
    return result;
  } catch (error: unknown) {
    console.error('Error en getAvailablePlayersForSquadAction:', error);
    return { success: false, players: [], error: getActionErrorMessage(error, 'Error al buscar jugadores.'), code: 'INTERNAL_ERROR' };
  }
}

export async function addPlayerToSquadAction(
  teamId: string,
  userId: string,
  tacticalPosition?: string,
  roleInTeam: 'Capitan' | 'Jugador' | 'DT / Analyst' = 'Jugador'
) {
  try {
    if (!teamId || !userId) {
      return { success: false, error: 'Equipo y Usuario son requeridos.', code: 'MISSING_PARAMS' };
    }

    await requireTeamManager(teamId);

    const validation = validateSchema(
      z.object({
        teamId: requiredIdSchema,
        userId: requiredIdSchema,
        tacticalPosition: z.string().min(1).max(30).optional(),
        roleInTeam: z.enum(['Capitan', 'Capitán', 'Encargado', 'Jugador', 'DT / Analyst']).default('Jugador'),
      }),
      { teamId, userId, tacticalPosition, roleInTeam }
    );

    if (!validation.success) {
      return { success: false, error: validation.errors.join(', '), code: 'VALIDATION_ERROR' };
    }

    const result = await addPlayerToSquadService(teamId, userId, tacticalPosition, roleInTeam);

    if (result.success) {
      revalidatePath('/equipos');
      revalidatePath('/club/plantilla');
      revalidatePath('/dashboard/equipos');
    }

    return result;
  } catch (error: unknown) {
    console.error('Error en addPlayerToSquadAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al agregar jugador a la escuadra.'), code: 'INTERNAL_ERROR' };
  }
}

export async function removePlayerFromSquadAction(teamId: string, userId: string, orgName?: string) {
  try {
    if (!teamId || !userId) {
      return { success: false, error: 'Equipo y Usuario son requeridos.', code: 'MISSING_PARAMS' };
    }

    await requireTeamManager(teamId);

    const result = await removePlayerFromSquadService(teamId, userId, orgName);

    if (result.success) {
      revalidatePath('/equipos');
      revalidatePath('/club/plantilla');
      revalidatePath('/dashboard/equipos');
      return { success: true, message: 'Jugador desvinculado de la escuadra.' };
    }

    return result;
  } catch (error: unknown) {
    console.error('Error en removePlayerFromSquadAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al remover jugador.'), code: 'INTERNAL_ERROR' };
  }
}

export async function checkTeamManagementPermissionAction(userId: string, teamId: string) {
  try {
    const actor = await requireTeamManager(teamId);
    return { success: true, isManager: actor.userId === userId || actor.role === 'Administrador' || actor.role === 'Organizador' };
  } catch {
    return { success: false, isManager: false };
  }
}

export async function updateSquadMemberJerseyAction(memberId: string, jerseyNumber: number | null) {
  try {
    const members = await dbProvider.query<{ team_id: string }>('SELECT team_id FROM team_members WHERE id = ? LIMIT 1', [memberId]);
    if (!members[0]) return { success: false, error: 'Miembro no encontrado.' };
    await requireTeamManager(members[0].team_id);
    const res = await updateSquadMemberJerseyService(memberId, jerseyNumber);
    if (res.success) {
      revalidatePath('/equipos');
      revalidatePath('/club/plantilla');
      revalidatePath('/dashboard/equipos');
    }
    return res;
  } catch (error: unknown) {
    return { success: false, error: getActionErrorMessage(error, 'Error al actualizar dorsal.') };
  }
}

export async function updateSquadMemberRoleAction(
  teamId: string,
  userId: string,
  newRole: 'Capitan' | 'Capitán' | 'Encargado' | 'DT / Analyst' | 'Jugador'
) {
  try {
    if (!teamId || !userId) {
      return { success: false, error: 'Equipo y Usuario son requeridos.', code: 'MISSING_PARAMS' };
    }

    await requireTeamManager(teamId);

    const validation = validateSchema(
      z.object({
        teamId: requiredIdSchema,
        userId: requiredIdSchema,
        newRole: z.enum(['Capitan', 'Capitán', 'Encargado', 'Jugador', 'DT / Analyst']),
      }),
      { teamId, userId, newRole }
    );

    if (!validation.success) {
      return { success: false, error: validation.errors.join(', '), code: 'VALIDATION_ERROR' };
    }

    const result = await updateSquadMemberRoleService(
      teamId,
      userId,
      (newRole === 'Capitan' ? 'Capitán' : newRole) as 'Capitán' | 'Encargado' | 'DT / Analyst' | 'Jugador'
    );

    if (result.success) {
      revalidatePath('/equipos');
      revalidatePath('/club/plantilla');
      revalidatePath('/dashboard/equipos');
    }

    return result;
  } catch (error: unknown) {
    console.error('Error en updateSquadMemberRoleAction:', error);
    return { success: false, error: getActionErrorMessage(error, 'Error al actualizar el rol en la plantilla.'), code: 'INTERNAL_ERROR' };
  }
}

export async function transferCaptaincyAction(teamId: string, newCaptainUserId: string) {
  return updateSquadMemberRoleAction(teamId, newCaptainUserId, 'Capitán');
}

export async function getPlayerInscriptionsMatrixAction(teamId: string, gameSlug: string = 'ALL') {
  try {
    await requireTeamManager(teamId);
    const rows = await dbProvider.query<PlayerMatrixRow>(
      `SELECT 
        u.id as user_id,
        u.name as user_name,
        u.gamertag,
        t.id as team_id,
        t.name as team_name,
        tm.jersey_number,
        tm.tactical_position,
        tm.organization_name as member_org_name,
        o.id as organization_id,
        o.name as organization_name,
        o.acronym as organization_acronym,
        c.name as competition_name
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       JOIN teams t ON tm.team_id = t.id
       LEFT JOIN competition_teams ct ON ct.team_id = t.id
       LEFT JOIN competitions c ON ct.competition_id = c.id
       LEFT JOIN organizations o ON c.organization_id = o.id
       WHERE tm.team_id = ? AND (t.game_slug = ? OR ? = 'ALL')`,
      [teamId, gameSlug, gameSlug]
    );

    // Fetch accepted contract offers for this team
    const acceptedOffers = await dbProvider.query<AcceptedPlayerOffer>(
      `SELECT player_user_id, pitch_message FROM transfer_offers WHERE team_id = ? AND status = 'ACEPTADO'`,
      [teamId]
    );

    const userMap: Record<string, PlayerMatrixEntry> = {};
    for (const r of rows) {
      if (!userMap[r.user_id]) {
        userMap[r.user_id] = {
          user_id: r.user_id,
          user_name: r.user_name,
          gamertag: r.gamertag,
          team_id: r.team_id,
          team_name: r.team_name,
          jersey_number: r.jersey_number,
          tactical_position: r.tactical_position,
          organizations: [],
        };
      }
      
      const effectiveOrgName = r.member_org_name || r.organization_name;
      if (effectiveOrgName || r.organization_id) {
        const orgId = r.organization_id || effectiveOrgName || 'org-gen';
        const exists = userMap[r.user_id].organizations.some(
          (organization) => organization.id === orgId || organization.name.toLowerCase() === (effectiveOrgName || '').toLowerCase()
        );
        if (!exists) {
          userMap[r.user_id].organizations.push({
            id: orgId,
            name: effectiveOrgName || 'Organización General',
            acronym: r.organization_acronym || (effectiveOrgName || 'ORG').slice(0, 4).toUpperCase(),
            competitionName: r.competition_name || null,
          });
        }
      }
    }

    // Add accepted contract offer organizations to each user
    for (const off of acceptedOffers) {
      if (userMap[off.player_user_id] && off.pitch_message) {
        const match = off.pitch_message.match(/\[Organización:\s*([^\]]+)\]/i);
        if (match && match[1]) {
          const orgVal = match[1].trim();
          const exists = userMap[off.player_user_id].organizations.some(
            (organization) => organization.name.toLowerCase() === orgVal.toLowerCase() || organization.id === orgVal
          );
          if (!exists) {
            userMap[off.player_user_id].organizations.push({
              id: orgVal,
              name: orgVal,
              acronym: orgVal.slice(0, 4).toUpperCase(),
              competitionName: null,
            });
          }
        }
      }
    }

    return { success: true, data: Object.values(userMap) };
  } catch (error: unknown) {
    console.error('Error en getPlayerInscriptionsMatrixAction:', error);
    return { success: false, data: [], error: getActionErrorMessage(error, 'Error al obtener matriz de inscripciones.') };
  }
}

export async function getAllPlayersForContractOfferAction(gameSlug: string, searchQuery?: string) {
  try {
    await requireServerActor();
    const res = await getAllPlayersForContractOfferService(gameSlug, searchQuery);
    return res;
  } catch (error: unknown) {
    console.error('Error en getAllPlayersForContractOfferAction:', error);
    return { success: false, players: [], error: getActionErrorMessage(error, 'Error al obtener jugadores.') };
  }
}

export async function getUserEnrolledTeamsAction(userId: string, gameSlug: string = 'ALL') {
  try {
    await requireUserManager(userId);
    if (!userId) return { success: false, teams: [], error: 'ID de usuario requerido' };

    const user = await dbProvider.users.findById(userId);
    const uName = user?.name || '';
    const uGamertag = user?.gamertag || uName;

    const rows = await dbProvider.query<EnrolledTeamRow>(
      `SELECT 
        t.id as team_id,
        t.name as team_name,
        t.tag as team_tag,
        t.logo_url,
        t.banner_url,
        t.captain_id,
        t.captain_name,
        t.game_slug,
        tm.jersey_number,
        tm.tactical_position,
        tm.role_in_team,
        c.id as competition_id,
        c.name as competition_name,
        o.id as organization_id,
        o.name as organization_name,
        o.acronym as organization_acronym
       FROM teams t
       LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = ?
       LEFT JOIN competition_teams ct ON ct.team_id = t.id
       LEFT JOIN competitions c ON ct.competition_id = c.id
       LEFT JOIN organizations o ON c.organization_id = o.id
       WHERE (tm.user_id = ? OR t.captain_id = ? OR LOWER(t.captain_name) = LOWER(?) OR LOWER(t.captain_name) = LOWER(?))
         AND (t.game_slug = ? OR ? = 'ALL')
       ORDER BY t.name ASC`,
      [userId, userId, userId, uName, uGamertag, gameSlug, gameSlug]
    );

    // Also fetch accepted contract offers for this user
    const acceptedOffers = await dbProvider.query<AcceptedTeamOffer>(
      `SELECT team_id, pitch_message FROM transfer_offers WHERE player_user_id = ? AND status = 'ACEPTADO'`,
      [userId]
    );

    const teamMap: Record<string, EnrolledTeamEntry> = {};
    for (const r of rows) {
      if (!teamMap[r.team_id]) {
        teamMap[r.team_id] = {
          id: r.team_id,
          name: r.team_name,
          tag: r.team_tag || 'CLUB',
          logoUrl: r.logo_url,
          bannerUrl: r.banner_url,
          captainId: r.captain_id,
          captainName: r.captain_name || 'Capitán Directivo',
          gameSlug: r.game_slug || 'eafc26',
          jerseyNumber: r.jersey_number,
          tacticalPosition: r.tactical_position || 'DFC',
          roleInTeam: r.role_in_team || 'Jugador',
          organizationsMap: {},
        };
      }

      if (r.organization_name || r.competition_name) {
        const orgKey = r.organization_id || 'org-general';
        if (!teamMap[r.team_id].organizationsMap[orgKey]) {
          teamMap[r.team_id].organizationsMap[orgKey] = {
            id: orgKey,
            name: r.organization_name || 'Organización Oficial',
            acronym: r.organization_acronym || 'ORG',
            competitions: [],
          };
        }
        if (r.competition_name) {
          const compExists = teamMap[r.team_id].organizationsMap[orgKey].competitions.includes(r.competition_name);
          if (!compExists) {
            teamMap[r.team_id].organizationsMap[orgKey].competitions.push(r.competition_name);
          }
        }
      }
    }

    // Append organizations from accepted contract offers
    for (const off of acceptedOffers) {
      if (teamMap[off.team_id] && off.pitch_message) {
        const match = off.pitch_message.match(/\[Organización:\s*([^\]]+)\]/i);
        if (match && match[1]) {
          const orgVal = match[1].trim();
          if (!teamMap[off.team_id].organizationsMap[orgVal]) {
            teamMap[off.team_id].organizationsMap[orgVal] = {
              id: orgVal,
              name: orgVal,
              acronym: orgVal.slice(0, 4).toUpperCase(),
              competitions: [],
            };
          }
        }
      }
    }

    const resultTeams = Object.values(teamMap).map((team) => ({
      ...team,
      team_id: team.id,
      team_name: team.name,
      team_tag: team.tag,
      logo_url: team.logoUrl,
      banner_url: team.bannerUrl,
      organizations: Object.values(team.organizationsMap),
    }));

    return { success: true, teams: resultTeams };
  } catch (error: unknown) {
    console.error('Error en getUserEnrolledTeamsAction:', error);
    return { success: false, teams: [], error: getActionErrorMessage(error, 'Error al obtener equipos del usuario.') };
  }
}
