'use server';

import { queryDB } from '@/lib/db';
import { requireTeamManager, requireUserManager } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';
import { removePlayerFromSquadService } from '@/lib/services';
import { getActionErrorMessage } from '@/lib/action-utils';

interface NewSquadRow extends Record<string, unknown> {
  user_id: string;
  organization_name: string | null;
}

interface NewSquadMember extends NewSquadRow {
  original_orgs: string[];
}

interface InscriptionRow {
  user_id: string;
  user_name: string;
  gamertag: string;
  tactical_position: string | null;
  member_org_name: string | null;
  org_id: string | null;
  org_acronym?: string | null;
}

interface OrganizationSummary { id: string; name: string; acronym: string }
interface PlayerInscription {
  user_id: string;
  user_name: string;
  gamertag: string;
  tactical_position: string;
  organizations: OrganizationSummary[];
}

interface TeamEnrollmentRow {
  team_id: string;
  organization_name: string | null;
  team_name: string;
  team_tag: string | null;
  logo_url: string | null;
}

interface TeamEnrollment {
  team_id: string;
  team_name: string;
  team_tag: string | null;
  logo_url: string | null;
  organizations: string[];
}

export async function getNewTeamSquadAction(teamId: string) {
  try {
    if (!teamId) return { success: false, squad: [], error: 'ID de equipo requerido.' };

    const squadRows = await queryDB<NewSquadRow>(
      `SELECT 
        tm.id, tm.team_id, tm.user_id, tm.organization_name, tm.tactical_position, tm.role_in_team, tm.jersey_number, tm.joined_at,
        u.name as user_name, u.gamertag, u.email, u.avatar_url, u.foto
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = ?
       ORDER BY tm.role_in_team ASC, u.name ASC`,
      [teamId]
    );

    const userMap: Record<string, NewSquadMember> = {};
    for (const r of squadRows) {
      if (!userMap[r.user_id]) {
        userMap[r.user_id] = { ...r, original_orgs: [] };
      }
      if (r.organization_name) {
        userMap[r.user_id].original_orgs.push(r.organization_name);
      }
    }
    
    const uniqueSquad = Object.values(userMap).map(member => ({
      ...member,
      organization_names: member.original_orgs.join(','),
      organization_ids: member.original_orgs.join(',')
    }));

    return { success: true, squad: uniqueSquad };
  } catch (error: unknown) {
    console.error('Error en getNewTeamSquadAction:', error);
    return { success: false, squad: [], error: getActionErrorMessage(error, 'Error al obtener plantilla.') };
  }
}

export async function getNewPlayerInscriptionsMatrixAction(teamId: string) {
  try {
    await requireTeamManager(teamId);
    const rows = await queryDB<InscriptionRow>(
      `SELECT 
        u.id as user_id,
        u.name as user_name,
        u.gamertag,
        tm.tactical_position,
        tm.organization_name as member_org_name,
        o.id as org_id,
        o.name as org_name
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       LEFT JOIN organizations o ON LOWER(tm.organization_name) = LOWER(o.name)
       WHERE tm.team_id = ?`,
      [teamId]
    );

    const userMap: Record<string, PlayerInscription> = {};
    for (const r of rows) {
      if (!userMap[r.user_id]) {
        userMap[r.user_id] = {
          user_id: r.user_id,
          user_name: r.user_name,
          gamertag: r.gamertag,
          tactical_position: r.tactical_position || 'DFC',
          organizations: [],
        };
      }
      
      const orgName = r.member_org_name;
      if (orgName) {
        const exists = userMap[r.user_id].organizations.some((organization) => organization.name.toLowerCase() === orgName.toLowerCase());
        if (!exists) {
          userMap[r.user_id].organizations.push({
            id: r.org_id || orgName,
            name: orgName,
            acronym: r.org_acronym || orgName.slice(0, 4).toUpperCase()
          });
        }
      }
    }

    return { success: true, data: Object.values(userMap) };
  } catch (error: unknown) {
    console.error('Error en getNewPlayerInscriptionsMatrixAction:', error);
    return { success: false, data: [], error: getActionErrorMessage(error, 'Error al obtener inscripciones.') };
  }
}

export async function expelPlayerFromSquadAction(
  teamId: string,
  userId: string,
  orgName?: string,
): Promise<{ success: boolean; message?: string; error?: string; code?: string }> {
  try {
    await requireTeamManager(teamId);
    const result = await removePlayerFromSquadService(teamId, userId, orgName);
    if (!result.success) return result;
    revalidatePath('/');
    return { success: true, message: 'Jugador desvinculado. El contrato ha concluido.' };
  } catch (error: unknown) {
    return { success: false, error: getActionErrorMessage(error, 'Error al desvincular jugador.') };
  }
}

export async function getUserEnrolledTeamsAction(userId: string) {
  try {
    await requireUserManager(userId);
    const rows = await queryDB<TeamEnrollmentRow>(
      `SELECT tm.team_id, tm.organization_name, t.name as team_name, t.tag as team_tag, t.logo_url
       FROM team_members tm
       JOIN teams t ON tm.team_id = t.id
       WHERE tm.user_id = ?`,
      [userId]
    );

    const teamMap: Record<string, TeamEnrollment> = {};
    for (const r of rows) {
      if (!teamMap[r.team_id]) {
        teamMap[r.team_id] = {
          team_id: r.team_id,
          team_name: r.team_name,
          team_tag: r.team_tag,
          logo_url: r.logo_url,
          organizations: []
        };
      }
      if (r.organization_name) {
        teamMap[r.team_id].organizations.push(r.organization_name);
      }
    }

    return { success: true, teams: Object.values(teamMap) };
  } catch (error: unknown) {
    console.error('Error en getUserEnrolledTeamsAction:', error);
    return { success: false, teams: [], error: getActionErrorMessage(error, 'Error al obtener equipos del usuario.') };
  }
}
