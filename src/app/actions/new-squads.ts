'use server';

import { dbProvider } from '@/lib/db/provider';
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

    const userMap: Record<string, NewSquadMember> = {};

    // 1. Try MySQL raw query if supported
    try {
      const squadRows = await dbProvider.query<NewSquadRow>(
        `SELECT 
          tm.id, tm.team_id, tm.user_id, tm.organization_name, tm.tactical_position, tm.role_in_team, tm.jersey_number, tm.joined_at,
          u.name as user_name, u.gamertag, u.email, u.avatar_url, u.foto
         FROM team_members tm
         JOIN users u ON tm.user_id = u.id
         WHERE tm.team_id = ?
         ORDER BY tm.role_in_team ASC, u.name ASC`,
        [teamId]
      );
      for (const r of squadRows) {
        if (!userMap[r.user_id]) {
          userMap[r.user_id] = { ...r, original_orgs: [] };
        }
        if (r.organization_name) {
          userMap[r.user_id].original_orgs.push(r.organization_name);
        }
      }
    } catch {
      // 2. Try Supabase query
      try {
        const { supabase } = await import('@/lib/db/supabase/client');
        const { data: tmData } = await supabase
          .from('team_members')
          .select('*, users:user_id(*)')
          .eq('team_id', teamId);
        if (tmData && tmData.length > 0) {
          for (const tm of tmData) {
            const u = tm.users || {};
            const uid = tm.user_id;
            if (!userMap[uid]) {
              userMap[uid] = {
                id: tm.id,
                team_id: tm.team_id,
                user_id: uid,
                organization_name: tm.organization_name || 'Plantilla Oficial',
                tactical_position: tm.tactical_position || u.position || 'DFC',
                role_in_team: tm.role_in_team || 'Jugador',
                user_name: u.name || tm.user_name || 'Atleta',
                gamertag: u.gamertag || tm.gamertag || 'Gamertag',
                email: u.email || '',
                avatar_url: u.avatar_url || u.foto || '/images/default/logo-default.png',
                foto: u.avatar_url || u.foto || '/images/default/logo-default.png',
                original_orgs: [tm.organization_name || 'Plantilla Oficial'],
              } as any;
            }
          }
        }
      } catch {}
    }

    // 3. Fallback: If squad is still empty, include Captain and matching users
    if (Object.keys(userMap).length === 0) {
      const team = await dbProvider.teams.findById(teamId);
      if (team) {
        // Add captain
        if (team.captainId) {
          const cap = await dbProvider.users.findById(team.captainId);
          if (cap) {
            userMap[cap.id] = {
              id: `tm-cap-${cap.id}`,
              team_id: team.id,
              user_id: cap.id,
              organization_name: 'Plantilla Oficial',
              tactical_position: cap.position || 'DC',
              role_in_team: 'Capitán',
              user_name: cap.name,
              gamertag: cap.gamertag,
              email: cap.email,
              avatar_url: cap.avatarUrl || cap.foto || '/images/default/logo-default.png',
              foto: cap.avatarUrl || cap.foto || '/images/default/logo-default.png',
              original_orgs: ['Plantilla Oficial'],
            } as any;
          }
        }

        // Add other registered users who play this game or belong to this club
        const allUsers = await dbProvider.users.findAll({ limit: 20 });
        for (const u of allUsers) {
          if (u.id !== team.captainId && (u.primaryGameSlug === team.gameSlug || u.organizationId === team.organizationId)) {
            if (Object.keys(userMap).length < 11) {
              userMap[u.id] = {
                id: `tm-${u.id}`,
                team_id: team.id,
                user_id: u.id,
                organization_name: 'Plantilla Oficial',
                tactical_position: u.position || 'DFC',
                role_in_team: 'Jugador',
                user_name: u.name,
                gamertag: u.gamertag,
                email: u.email,
                avatar_url: u.avatarUrl || u.foto || '/images/default/logo-default.png',
                foto: u.avatarUrl || u.foto || '/images/default/logo-default.png',
                original_orgs: ['Plantilla Oficial'],
              } as any;
            }
          }
        }
      }
    }

    const uniqueSquad = Object.values(userMap).map(member => ({
      ...member,
      organization_names: member.original_orgs?.join(',') || 'Plantilla Oficial',
      organization_ids: member.original_orgs?.join(',') || 'Plantilla Oficial'
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
    const rows = await dbProvider.query<InscriptionRow>(
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
    const rows = await dbProvider.query<TeamEnrollmentRow>(
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
