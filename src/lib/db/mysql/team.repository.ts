import type { Team, ITeamRepository } from '@/lib/db/interfaces';
import { BaseRepository, type TeamRow, type MutableDatabaseParams } from './types';

export class TeamRepository extends BaseRepository<Team> implements ITeamRepository {
  protected tableName = 'teams';
  protected primaryKey = 'id';

  protected mapRow(row: TeamRow): Team {
    return {
      id: row.id,
      name: row.name,
      tag: row.tag,
      gameSlug: row.game_slug,
      organizationId: row.organization_id,
      captainId: row.captain_id,
      captainName: row.captain_name,
      platform: row.platform,
      membersCount: row.members_count,
      maxMembers: row.max_members,
      color: row.color,
      logoText: row.logo_text,
      description: row.description,
      vacantPositions: row.vacant_positions ? JSON.parse(row.vacant_positions) : [],
      logoUrl: row.logo_url,
      bannerUrl: row.banner_url,
      status: row.status,
      clubIdEa: row.club_id_ea,
      isBanned: Boolean(row.is_banned),
      banReason: row.ban_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findByCaptain(captainId: string, gameSlug?: string): Promise<Team[]> {
    let sql = 'SELECT * FROM teams WHERE captain_id = ?';
    const params: MutableDatabaseParams = [captainId];
    if (gameSlug) {
      sql += ' AND game_slug = ?';
      params.push(gameSlug);
    }
    const rows = await this.queryRows<TeamRow>(sql, params);
    return rows.map((row) => this.mapRow(row));
  }

  async findByOrganization(orgId: string): Promise<Team[]> {
    const rows = await this.queryRows<TeamRow>('SELECT * FROM teams WHERE organization_id = ? ORDER BY created_at DESC', [orgId]);
    return rows.map((row) => this.mapRow(row));
  }

  async findByGameSlug(gameSlug: string): Promise<Team[]> {
    const rows = await this.queryRows<TeamRow>('SELECT * FROM teams WHERE game_slug = ? AND is_banned = 0 ORDER BY name ASC', [gameSlug]);
    return rows.map((row) => this.mapRow(row));
  }

  async getManagers(teamId: string): Promise<string[]> {
    const rows = await this.queryRows<{ user_id: string }>(
      `SELECT user_id FROM team_members
       WHERE team_id = ? AND role_in_team IN ('Capitan', 'Capitán', 'Encargado', 'DT / Analyst', 'Manager', 'Co-Capitán')`,
      [teamId]
    );
    return rows.map((r) => r.user_id);
  }

  async create(data: Partial<Team>): Promise<Team> {
    const id = data.id || `team-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const vacantJson = data.vacantPositions ? JSON.stringify(data.vacantPositions) : '[]';
    
    await this.runCommand(
      `INSERT INTO teams (id, name, tag, game_slug, organization_id, captain_id, captain_name, platform, members_count, max_members, color, logo_text, description, vacant_positions, logo_url, banner_url, status, club_id_ea, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        id, data.name, data.tag, data.gameSlug, data.organizationId || null,
        data.captainId, data.captainName, data.platform || 'CROSSPLAY',
        data.membersCount || 1, data.maxMembers || 45,
        data.color || '#00F0FF', data.logoText || 'TP',
        data.description || null, vacantJson,
        data.logoUrl || null, data.bannerUrl || null,
        data.status || 'Activo', data.clubIdEa || null
      ]
    );
    
    const team = await this.findById(id);
    if (!team) throw new Error('Error creando equipo');
    return team;
  }

  async update(id: string, data: Partial<Team>): Promise<Team | null> {
    const fields: string[] = [];
    const params: MutableDatabaseParams = [];
    
    const fieldMap: Record<string, string> = {
      name: 'name', tag: 'tag', gameSlug: 'game_slug', organizationId: 'organization_id',
      captainId: 'captain_id', captainName: 'captain_name', platform: 'platform',
      membersCount: 'members_count', maxMembers: 'max_members', color: 'color',
      logoText: 'logo_text', description: 'description', vacantPositions: 'vacant_positions',
      logoUrl: 'logo_url', bannerUrl: 'banner_url', status: 'status', clubIdEa: 'club_id_ea'
    };
    
    for (const [key, value] of Object.entries(data)) {
      const dbKey = fieldMap[key];
      if (dbKey) {
        fields.push(`\`${dbKey}\` = ?`);
        params.push(key === 'vacantPositions' ? JSON.stringify(value) : value);
      }
    }
    
    if (fields.length === 0) return this.findById(id);
    
    fields.push('`updated_at` = NOW()');
    params.push(id);
    
    await this.runCommand(`UPDATE teams SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.runCommand('DELETE FROM teams WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async updateMembersCount(teamId: string): Promise<void> {
    await this.runCommand(
      'UPDATE teams SET members_count = (SELECT COUNT(*) FROM team_members WHERE team_id = ?) WHERE id = ?',
      [teamId, teamId]
    );
  }

  async syncStaff(teamId: string, captainId: string, managerIds: string[] = [], captainPosition = 'DFC'): Promise<void> {
    const { randomUUID } = await import('crypto');
    await this.runCommand(
      "DELETE FROM team_members WHERE team_id = ? AND role_in_team IN ('Capitan', 'Capitán', 'Encargado')",
      [teamId]
    );
    await this.runCommand(
      `INSERT INTO team_members (id, team_id, user_id, tactical_position, role_in_team) VALUES (?, ?, ?, ?, 'Capitán')`,
      [randomUUID(), teamId, captainId, captainPosition || 'CAPITAN']
    );
    for (const managerId of managerIds) {
      if (managerId === captainId) continue;
      await this.runCommand(
        `INSERT INTO team_members (id, team_id, user_id, tactical_position, role_in_team) VALUES (?, ?, ?, 'ENCARGADO', 'Encargado')`,
        [randomUUID(), teamId, managerId]
      );
    }
    await this.updateMembersCount(teamId);
  }

  async hasActiveCompetitions(teamId: string): Promise<boolean> {
    const rows = await this.queryRows<{ id: string }>(
      `SELECT ct.id
         FROM competition_teams ct
         JOIN competitions c ON c.id = ct.competition_id
        WHERE ct.team_id = ? AND ct.status = 'CONFIRMADO'
          AND c.status IN ('Activo', 'Inscripcion', 'En Curso') LIMIT 1`,
      [teamId]
    );
    return rows.length > 0;
  }

  async archiveTeam(teamId: string): Promise<void> {
    await this.runCommand("UPDATE team_vacancies SET status = 'CERRADA' WHERE team_id = ? AND status = 'ABIERTA'", [teamId]);
    await this.runCommand("UPDATE transfer_market_posts SET status = 'CADUCADO' WHERE team_id = ? AND status = 'ACTIVO'", [teamId]);
    await this.runCommand("UPDATE transfer_offers SET status = 'CANCELADO' WHERE team_id = ? AND status = 'PENDIENTE'", [teamId]);
    await this.runCommand("UPDATE teams SET status = 'Archivado', updated_at = NOW() WHERE id = ?", [teamId]);
  }

  async getSquad(teamId: string): Promise<Record<string, unknown>[]> {
    return this.queryRows<Record<string, unknown>>(
      `SELECT 
        tm.id, tm.team_id, tm.user_id, tm.organization_name, tm.tactical_position, tm.role_in_team, tm.jersey_number, tm.joined_at,
        u.name as user_name, u.gamertag, u.email, u.avatar_url, u.foto
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = ?
       ORDER BY tm.role_in_team ASC, u.name ASC`,
      [teamId]
    );
  }

  async getAcceptedOffers(teamId: string): Promise<{ player_user_id: string; pitch_message: string | null }[]> {
    return this.queryRows<{ player_user_id: string; pitch_message: string | null }>(
      `SELECT player_user_id, pitch_message FROM transfer_offers WHERE team_id = ? AND status = 'ACEPTADO'`,
      [teamId]
    );
  }

  async getTeamCompetitionOrganizations(teamId: string): Promise<{ org_id: string; org_name: string }[]> {
    return this.queryRows<{ org_id: string; org_name: string }>(
      `SELECT DISTINCT o.id as org_id, o.name as org_name
       FROM competition_teams ct
       JOIN competitions c ON ct.competition_id = c.id
       JOIN organizations o ON c.organization_id = o.id
       WHERE ct.team_id = ?`,
      [teamId]
    );
  }

  async addSquadMember(teamId: string, userId: string, tacticalPosition = 'DFC', roleInTeam = 'Jugador', orgName?: string): Promise<void> {
    await this.runCommand('DELETE FROM team_members WHERE team_id = ? AND user_id = ?', [teamId, userId]);
    const memberId = `tm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const normalizedRole = roleInTeam === 'Capitan' ? 'Capitán' : roleInTeam;
    await this.runCommand(
      'INSERT INTO team_members (id, team_id, user_id, tactical_position, role_in_team, organization_name) VALUES (?, ?, ?, ?, ?, ?)',
      [memberId, teamId, userId, tacticalPosition, normalizedRole, orgName || null]
    );
    await this.updateMembersCount(teamId);
  }

  async removeSquadMember(teamId: string, userId: string, orgName?: string): Promise<void> {
    if (orgName) {
      await this.runCommand('DELETE FROM team_members WHERE team_id = ? AND user_id = ? AND LOWER(organization_name) = LOWER(?)', [teamId, userId, orgName]);
    } else {
      await this.runCommand('DELETE FROM team_members WHERE team_id = ? AND user_id = ?', [teamId, userId]);
    }
    await this.updateMembersCount(teamId);
  }

  async updateSquadMemberRole(teamId: string, userId: string, newRole: string, userName?: string): Promise<void> {
    const isPromotingToCaptain = newRole === 'Capitán' || newRole === 'Capitan';
    if (isPromotingToCaptain) {
      const team = await this.findById(teamId);
      const oldCaptainId = team?.captainId;
      if (oldCaptainId && oldCaptainId !== userId) {
        await this.runCommand("UPDATE team_members SET role_in_team = 'Encargado' WHERE team_id = ? AND user_id = ?", [teamId, oldCaptainId]);
      }
      await this.runCommand("UPDATE team_members SET role_in_team = 'Capitán' WHERE team_id = ? AND user_id = ?", [teamId, userId]);
      await this.runCommand("UPDATE teams SET captain_id = ?, captain_name = ?, updated_at = NOW() WHERE id = ?", [userId, userName || 'Capitán', teamId]);
    } else {
      await this.runCommand('UPDATE team_members SET role_in_team = ? WHERE team_id = ? AND user_id = ?', [newRole, teamId, userId]);
    }
  }

  async updateSquadMemberJersey(memberId: string, jerseyNumber: number | null): Promise<void> {
    await this.runCommand('UPDATE team_members SET jersey_number = ? WHERE id = ?', [jerseyNumber, memberId]);
  }

  async isMemberOrManager(teamId: string, userId: string): Promise<boolean> {
    const rows = await this.queryRows<{ role_in_team: string }>(
      `SELECT role_in_team FROM team_members 
       WHERE team_id = ? AND user_id = ? AND role_in_team IN ('Capitan', 'Capitán', 'Encargado', 'DT / Analyst', 'Manager', 'Co-Capitán') LIMIT 1`,
      [teamId, userId]
    );
    return rows.length > 0;
  }
}
