'use server';

import { queryDB } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getNewTeamSquadAction(teamId: string) {
  try {
    if (!teamId) return { success: false, squad: [], error: 'ID de equipo requerido.' };

    const squadRows = await queryDB<any>(
      `SELECT 
        tm.id, tm.team_id, tm.user_id, tm.organization_name, tm.tactical_position, tm.role_in_team, tm.jersey_number, tm.joined_at,
        u.name as user_name, u.gamertag, u.email, u.avatar_url, u.foto
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = ?
       ORDER BY tm.role_in_team ASC, u.name ASC`,
      [teamId]
    );

    const userMap: Record<string, any> = {};
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
  } catch (error: any) {
    console.error('Error en getNewTeamSquadAction:', error);
    return { success: false, squad: [], error: error.message };
  }
}

export async function getNewPlayerInscriptionsMatrixAction(teamId: string) {
  try {
    const rows = await queryDB<any>(
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

    const userMap: Record<string, any> = {};
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
        const exists = userMap[r.user_id].organizations.some((o: any) => o.name.toLowerCase() === orgName.toLowerCase());
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
  } catch (error: any) {
    console.error('Error en getNewPlayerInscriptionsMatrixAction:', error);
    return { success: false, data: [], error: error.message };
  }
}

export async function expelPlayerFromSquadAction(teamId: string, userId: string, orgName?: string) {
  try {
    if (orgName) {
      await queryDB(`DELETE FROM team_members WHERE team_id = ? AND user_id = ? AND LOWER(organization_name) = LOWER(?)`, [teamId, userId, orgName]);
      await queryDB(`UPDATE transfer_offers SET status = 'CONCLUIDO' WHERE team_id = ? AND player_user_id = ? AND status = 'ACEPTADO' AND LOWER(pitch_message) LIKE LOWER(?)`, [teamId, userId, `%[organización: ${orgName}]%`]);
    } else {
      await queryDB(`DELETE FROM team_members WHERE team_id = ? AND user_id = ?`, [teamId, userId]);
      await queryDB(`UPDATE transfer_offers SET status = 'CONCLUIDO' WHERE team_id = ? AND player_user_id = ? AND status = 'ACEPTADO'`, [teamId, userId]);
    }
    revalidatePath('/');
    return { success: true, message: 'Jugador desvinculado. El contrato ha concluido.' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getUserEnrolledTeamsAction(userId: string) {
  try {
    const rows = await queryDB<any>(
      `SELECT tm.team_id, tm.organization_name, t.name as team_name, t.tag as team_tag, t.logo_url
       FROM team_members tm
       JOIN teams t ON tm.team_id = t.id
       WHERE tm.user_id = ?`,
      [userId]
    );

    const teamMap: Record<string, any> = {};
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
  } catch (error: any) {
    console.error('Error en getUserEnrolledTeamsAction:', error);
    return { success: false, teams: [], error: error.message };
  }
}

