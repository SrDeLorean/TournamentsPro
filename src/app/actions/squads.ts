'use server';

import { revalidatePath } from 'next/cache';
import { queryDB } from '@/lib/db';
import { z } from 'zod';
import { validateSchema, requiredIdSchema } from '@/lib/validation';
import { getServerUserSession } from '@/lib/auth-server';
import {
  getTeamSquadService,
  getAvailablePlayersForSquadService,
  getAllPlayersForContractOfferService,
  addPlayerToSquadService,
  removePlayerFromSquadService,
  isUserTeamManagerOrCaptainService,
  updateSquadMemberJerseyService,
} from '@/lib/services';

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

export async function getTeamSquadAction(teamId: string) {
  try {
    if (!teamId) return { success: false, squad: [], error: 'ID de equipo requerido.', code: 'MISSING_PARAMS' };

    const result = await getTeamSquadService(teamId);
    return result;
  } catch (error: any) {
    console.error('Error en getTeamSquadAction:', error);
    return { success: false, squad: [], error: error?.message || 'Error al obtener la plantilla.', code: 'INTERNAL_ERROR' };
  }
}

export async function getAvailablePlayersForSquadAction(
  teamId: string,
  searchQuery?: string,
  organizerUserId?: string
) {
  try {
    if (!teamId) return { success: false, players: [], error: 'ID de equipo requerido.', code: 'MISSING_PARAMS' };

    const session = await getServerUserSession();
    const effectiveOrganizerId = organizerUserId || session?.userId;

    const result = await getAvailablePlayersForSquadService(teamId, searchQuery, effectiveOrganizerId);
    return result;
  } catch (error: any) {
    console.error('Error en getAvailablePlayersForSquadAction:', error);
    return { success: false, players: [], error: error?.message || 'Error al buscar jugadores.', code: 'INTERNAL_ERROR' };
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
    }

    return result;
  } catch (error: any) {
    console.error('Error en addPlayerToSquadAction:', error);
    return { success: false, error: error?.message || 'Error al agregar jugador a la escuadra.', code: 'INTERNAL_ERROR' };
  }
}

export async function removePlayerFromSquadAction(teamId: string, userId: string) {
  try {
    if (!teamId || !userId) {
      return { success: false, error: 'Equipo y Usuario son requeridos.', code: 'MISSING_PARAMS' };
    }

    const result = await removePlayerFromSquadService(teamId, userId);

    if (result.success) {
      revalidatePath('/equipos');
      revalidatePath('/club/plantilla');
    }

    return result;
  } catch (error: any) {
    console.error('Error en removePlayerFromSquadAction:', error);
    return { success: false, error: error?.message || 'Error al remover jugador.', code: 'INTERNAL_ERROR' };
  }
}

export async function checkTeamManagementPermissionAction(userId: string, teamId: string) {
  try {
    const isManager = await isUserTeamManagerOrCaptainService(userId, teamId);
    return { success: true, isManager };
  } catch (error: any) {
    return { success: false, isManager: false };
  }
}

export async function updateSquadMemberJerseyAction(memberId: string, jerseyNumber: number | null) {
  try {
    const res = await updateSquadMemberJerseyService(memberId, jerseyNumber);
    if (res.success) {
      revalidatePath('/equipos');
      revalidatePath('/club/plantilla');
    }
    return res;
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error al actualizar dorsal.' };
  }
}

export async function getPlayerInscriptionsMatrixAction(teamId: string, gameSlug: string) {
  try {
    const rows = await queryDB<any>(
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
    const acceptedOffers = await queryDB<any>(
      `SELECT player_user_id, pitch_message FROM transfer_offers WHERE team_id = ? AND status = 'ACEPTADO'`,
      [teamId]
    );

    const userMap: Record<string, any> = {};
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
          (org: any) => org.id === orgId || org.name.toLowerCase() === (effectiveOrgName || '').toLowerCase()
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
            (org: any) => org.name.toLowerCase() === orgVal.toLowerCase() || org.id === orgVal
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
  } catch (error: any) {
    console.error('Error en getPlayerInscriptionsMatrixAction:', error);
    return { success: false, error: error?.message || 'Error al obtener matriz de inscripciones.' };
  }
}

export async function getAllPlayersForContractOfferAction(gameSlug: string, searchQuery?: string) {
  try {
    const res = await getAllPlayersForContractOfferService(gameSlug, searchQuery);
    return res;
  } catch (error: any) {
    console.error('Error en getAllPlayersForContractOfferAction:', error);
    return { success: false, players: [], error: error?.message || 'Error al obtener jugadores.' };
  }
}

export async function getUserEnrolledTeamsAction(userId: string, gameSlug: string) {
  try {
    if (!userId) return { success: false, teams: [], error: 'ID de usuario requerido' };

    const userRows = await queryDB<any>(`SELECT name, gamertag FROM users WHERE id = ? LIMIT 1`, [userId]);
    const uName = userRows[0]?.name || '';
    const uGamertag = userRows[0]?.gamertag || uName;

    const rows = await queryDB<any>(
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
    const acceptedOffers = await queryDB<any>(
      `SELECT team_id, pitch_message FROM transfer_offers WHERE player_user_id = ? AND status = 'ACEPTADO'`,
      [userId]
    );

    const teamMap: Record<string, any> = {};
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

    const resultTeams = Object.values(teamMap).map((team: any) => ({
      ...team,
      organizations: Object.values(team.organizationsMap),
    }));

    return { success: true, teams: resultTeams };
  } catch (error: any) {
    console.error('Error en getUserEnrolledTeamsAction:', error);
    return { success: false, teams: [], error: error?.message || 'Error al obtener equipos del usuario.' };
  }
}