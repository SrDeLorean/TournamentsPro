import type { RowDataPacket } from 'mysql2';
import { queryDB, dbPool, executeCommand, type DatabaseParams } from '@/lib/db';
import type { Game, Match } from '@/lib/db/interfaces';

type MutableDatabaseParams = Array<DatabaseParams[number]>;

interface UserRow extends RowDataPacket {
  id: string; email: string; password_hash: string | null; google_id: string | null; name: string;
  gamertag: string; role: string; primary_game_slug: string; platform: string; position: string;
  secondary_position: string | null; rank_badge: string; rating: number; status: string;
  avatar_url: string | null; organization_id: string | null; is_banned: number; ban_reason: string | null;
  created_at: string; updated_at: string;
}

interface OrganizationRow extends RowDataPacket {
  id: string; name: string; tag: string; owner_id: string; logo_url: string | null;
  banner_url: string | null; description: string | null; country: string;
  allowed_games: string | null; created_at: string;
  status?: string; slug?: string; is_banned?: number; ban_reason?: string | null;
  banned_at?: string | null; social_media?: string | null;
}

interface MatchRow extends RowDataPacket {
  id: string; tournament_id: string | null; competition_id: string | null; round: number | null;
  matchday: number | null; round_name: string | null; group_name: string | null;
  team_home_id: string | null; home_team_id: string | null; team_away_id: string | null;
  away_team_id: string | null; home_team_name: string | null; home_team_tag: string | null;
  away_team_name: string | null; away_team_tag: string | null; score_home: number | null;
  score_away: number | null; reported_score_home: number | null; reported_score_away: number | null;
  winner_team_id: string | null; proof_url: string | null; reported_by_user_id: string | null;
  next_match_id: string | null; next_match_slot: string | null; scheduled_at: string | null;
  scheduled_time: string | null; status: string; created_at?: string;
}

interface GameRow extends RowDataPacket {
  slug: string; name: string; category: string; team_size: number; positions_json: unknown;
  brand_color: string; stats_schema: unknown; created_at: string;
}

interface TeamRow extends RowDataPacket {
  id: string; name: string; tag: string; game_slug: string; organization_id: string | null;
  captain_id: string; captain_name: string; platform: string; members_count: number; max_members: number;
  color: string; logo_text: string; description: string | null; vacant_positions: string | null;
  logo_url: string | null; banner_url: string | null; status: string; club_id_ea: string | null;
  created_at: string; updated_at: string;
}

interface CompetitionRow extends RowDataPacket {
  id: string; name: string; game_slug: string; organizer_id: string | null; organizer_name: string | null;
  organization_id: string | null; season_id: string | null; prize_pool: string | null;
  transfer_market_mode: string; mode_format: string; format: string | null; match_mode: string | null;
  group_count: number | null; qualifiers_per_group: number | null; status: string; fecha_limite_inscripcion: string | null;
  fecha_inicio: string; fecha_termino: string | null; description: string | null; created_at: string;
}

interface SeasonRow extends RowDataPacket {
  id: string; name: string; organization_id: string | null; start_date: string | null;
  end_date: string | null; status: string; created_at: string;
}

export interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(options?: FindOptions): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  count(options?: FindOptions): Promise<number>;
}

export interface FindOptions {
  where?: Record<string, unknown>;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

export abstract class BaseRepository<T extends { id: string }> implements Repository<T> {
  protected abstract tableName: string;
  protected abstract primaryKey: string;
  protected abstract mapRow(row: RowDataPacket): T;

  async findById(id: string): Promise<T | null> {
    const rows = await queryDB<RowDataPacket>(`SELECT * FROM \`${this.tableName}\` WHERE \`${this.primaryKey}\` = ? LIMIT 1`, [id]);
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  async findAll(options: FindOptions = {}): Promise<T[]> {
    const { where = {}, orderBy = 'created_at', orderDirection = 'DESC', limit = 50, offset = 0 } = options;
    
    const whereClauses: string[] = [];
    const params: MutableDatabaseParams = [];
    
    for (const [key, value] of Object.entries(where)) {
      if (value === null) {
        whereClauses.push(`\`${key}\` IS NULL`);
      } else if (Array.isArray(value)) {
        whereClauses.push(`\`${key}\` IN (${value.map(() => '?').join(',')})`);
        params.push(...value.map((item) => item as DatabaseParams[number]));
      } else {
        whereClauses.push(`\`${key}\` = ?`);
        params.push(value as DatabaseParams[number]);
      }
    }
    
    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const sql = `SELECT * FROM \`${this.tableName}\` ${whereSql} ORDER BY \`${orderBy}\` ${orderDirection} LIMIT ? OFFSET ?`;
    
    const rows = await queryDB<RowDataPacket>(sql, [...params, limit, offset]);
    return rows.map(this.mapRow);
  }

  async count(options: FindOptions = {}): Promise<number> {
    const { where = {} } = options;
    const whereClauses: string[] = [];
    const params: MutableDatabaseParams = [];
    
    for (const [key, value] of Object.entries(where)) {
      if (value === null) {
        whereClauses.push(`\`${key}\` IS NULL`);
      } else if (Array.isArray(value)) {
        whereClauses.push(`\`${key}\` IN (${value.map(() => '?').join(',')})`);
        params.push(...value.map((item) => item as DatabaseParams[number]));
      } else {
        whereClauses.push(`\`${key}\` = ?`);
        params.push(value as DatabaseParams[number]);
      }
    }
    
    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const result = await queryDB<{ total: number }>(`SELECT COUNT(*) as total FROM \`${this.tableName}\` ${whereSql}`, params);
    return result[0]?.total || 0;
  }

  abstract create(data: Partial<T>): Promise<T>;
  abstract update(id: string, data: Partial<T>): Promise<T | null>;
  abstract delete(id: string): Promise<boolean>;

  protected async executeTransaction(queries: { sql: string; params: DatabaseParams }[]): Promise<void> {
    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();
      for (const { sql, params } of queries) {
        await connection.execute(sql, params.map((param) => param === undefined ? null : param));
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export class UserRepository extends BaseRepository<User> {
  protected tableName = 'users';
  protected primaryKey = 'id';

  protected mapRow(row: UserRow): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      googleId: row.google_id,
      name: row.name,
      gamertag: row.gamertag,
      role: row.role,
      primaryGameSlug: row.primary_game_slug,
      platform: row.platform,
      position: row.position,
      secondaryPosition: row.secondary_position,
      rankBadge: row.rank_badge,
      rating: row.rating,
      status: row.status,
      avatarUrl: row.avatar_url,
      organizationId: row.organization_id,
      isBanned: Boolean(row.is_banned),
      banReason: row.ban_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await queryDB<UserRow>('SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [email]);
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  async findByGamertag(gamertag: string): Promise<User | null> {
    const rows = await queryDB<UserRow>('SELECT * FROM users WHERE LOWER(gamertag) = LOWER(?) LIMIT 1', [gamertag]);
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  async findByEmailOrGamertag(identifier: string): Promise<User | null> {
    const rows = await queryDB<UserRow>(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(gamertag) = LOWER(?) LIMIT 1',
      [identifier, identifier]
    );
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  async create(data: Partial<User>): Promise<User> {
    const id = data.id || `usr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    await queryDB(
      `INSERT INTO users (id, email, password_hash, google_id, name, gamertag, role, primary_game_slug, platform, position, secondary_position, rank_badge, rating, status, avatar_url, organization_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.email,
        data.passwordHash || null,
        data.googleId || null,
        data.name,
        data.gamertag,
        data.role || 'Jugador',
        data.primaryGameSlug || 'eafc26',
        data.platform || 'CROSSPLAY',
        data.position || 'DFC',
        data.secondaryPosition || null,
        data.rankBadge || 'División 1',
        data.rating || 9.0,
        data.status || 'Buscando Club',
        data.avatarUrl || null,
        data.organizationId || null,
        now,
        now,
      ]
    );
    
    const user = await this.findById(id);
    if (!user) throw new Error('Error creando usuario');
    return user;
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const fields: string[] = [];
    const params: MutableDatabaseParams = [];
    
    const allowedFields = [
      'email', 'password_hash', 'google_id', 'name', 'gamertag', 'role',
      'primary_game_slug', 'platform', 'position', 'secondary_position',
      'rank_badge', 'rating', 'status', 'avatar_url', 'organization_id', 'is_banned', 'ban_reason'
    ];
    
    for (const [key, value] of Object.entries(data)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(snakeKey)) {
        fields.push(`\`${snakeKey}\` = ?`);
        params.push(value);
      }
    }
    
    if (fields.length === 0) return this.findById(id);
    
    fields.push('`updated_at` = NOW()');
    params.push(id);
    
    await queryDB(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await executeCommand('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

export class OrganizationRepository extends BaseRepository<Organization> {
  protected tableName = 'organizations';
  protected primaryKey = 'id';

  protected mapRow(row: OrganizationRow): Organization {
    return {
      id: row.id,
      name: row.name,
      tag: row.tag,
      ownerId: row.owner_id,
      logoUrl: row.logo_url,
      bannerUrl: row.banner_url,
      description: row.description,
      country: row.country,
      allowedGames: row.allowed_games ? JSON.parse(row.allowed_games) : [],
      status: row.status,
      slug: row.slug,
      isBanned: Boolean(row.is_banned),
      banReason: row.ban_reason,
      bannedAt: row.banned_at,
      socialMedia: row.social_media ? JSON.parse(row.social_media) : null,
      createdAt: row.created_at,
    };
  }

  async findByOwnerId(ownerId: string): Promise<Organization | null> {
    const rows = await queryDB<OrganizationRow>('SELECT * FROM organizations WHERE owner_id = ? LIMIT 1', [ownerId]);
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  async getOrganizationsWithStats(gameSlug?: string): Promise<any[]> {
    const isAll = !gameSlug || ['ALL', 'all', 'TODOS', 'todas'].includes(gameSlug);
    const query = isAll
      ? `
        SELECT o.*, COUNT(DISTINCT c.id) as comp_count
        FROM organizations o
        LEFT JOIN users u ON u.organization_id = o.id
        LEFT JOIN competitions c ON (c.organization_id = o.id OR c.organizer_id = u.id) 
          AND c.status != 'Borrador'
        GROUP BY o.id
        ORDER BY comp_count DESC, o.name ASC
      `
      : `
        SELECT o.*, COUNT(DISTINCT c.id) as comp_count
        FROM organizations o
        LEFT JOIN users u ON u.organization_id = o.id
        LEFT JOIN competitions c ON (c.organization_id = o.id OR c.organizer_id = u.id) 
          AND c.game_slug = ? 
          AND c.status != 'Borrador'
        GROUP BY o.id
        ORDER BY comp_count DESC, o.name ASC
      `;

    const params = isAll ? [] : [gameSlug];
    return await queryDB(query, params);
  }

  async create(data: Partial<Organization>): Promise<Organization> {
    const id = data.id || `org-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const allowedGamesJson = data.allowedGames ? JSON.stringify(data.allowedGames) : '[]';
    
    await queryDB(
      `INSERT INTO organizations (id, name, tag, owner_id, logo_url, banner_url, description, country, allowed_games, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, data.name, data.tag, data.ownerId, data.logoUrl || null, data.bannerUrl || null, data.description || null, data.country || 'Venezuela', allowedGamesJson]
    );
    
    const org = await this.findById(id);
    if (!org) throw new Error('Error creando organización');
    return org;
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization | null> {
    const fields: string[] = [];
    const params: MutableDatabaseParams = [];
    
    const fieldMap: Record<string, string> = {
      name: 'name', tag: 'tag', logoUrl: 'logo_url', bannerUrl: 'banner_url',
      description: 'description', country: 'country', allowedGames: 'allowed_games',
      status: 'status', slug: 'slug', isBanned: 'is_banned', banReason: 'ban_reason',
      bannedAt: 'banned_at', socialMedia: 'social_media'
    };
    
    for (const [key, value] of Object.entries(data)) {
      const dbKey = fieldMap[key];
      if (dbKey) {
        fields.push(`\`${dbKey}\` = ?`);
        if (['allowedGames', 'socialMedia'].includes(key)) params.push(JSON.stringify(value));
        else params.push(value as DatabaseParams[number]);
      }
    }
    
    if (fields.length === 0) return this.findById(id);
    
    params.push(id);
    await queryDB(`UPDATE organizations SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await executeCommand('DELETE FROM organizations WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

export class TeamRepository extends BaseRepository<Team> {
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
    const rows = await queryDB<TeamRow>(sql, params);
    return rows.map(this.mapRow);
  }

  async findByOrganization(orgId: string): Promise<Team[]> {
    const rows = await queryDB<TeamRow>('SELECT * FROM teams WHERE organization_id = ? ORDER BY created_at DESC', [orgId]);
    return rows.map(this.mapRow);
  }

  async findByGameSlug(gameSlug: string): Promise<Team[]> {
    const rows = await queryDB<TeamRow>('SELECT * FROM teams WHERE game_slug = ? AND is_banned = 0 ORDER BY name ASC', [gameSlug]);
    return rows.map(this.mapRow);
  }

  async getManagers(teamId: string): Promise<string[]> {
    const rows = await queryDB<{ user_id: string }>(
      `SELECT user_id FROM team_members
       WHERE team_id = ? AND role_in_team IN ('Capitan', 'Capitán', 'Encargado', 'DT / Analyst', 'Manager', 'Co-Capitán')`,
      [teamId]
    );
    return rows.map(r => r.user_id);
  }

  async create(data: Partial<Team>): Promise<Team> {
    const id = data.id || `team-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const vacantJson = data.vacantPositions ? JSON.stringify(data.vacantPositions) : '[]';
    
    await queryDB(
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
    
    await queryDB(`UPDATE teams SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await executeCommand('DELETE FROM teams WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async updateMembersCount(teamId: string): Promise<void> {
    await queryDB(
      'UPDATE teams SET members_count = (SELECT COUNT(*) FROM team_members WHERE team_id = ?) WHERE id = ?',
      [teamId, teamId]
    );
  }
}

export class CompetitionRepository extends BaseRepository<Competition> {
  protected tableName = 'competitions';
  protected primaryKey = 'id';

  protected mapRow(row: CompetitionRow): Competition {
    return {
      id: row.id,
      name: row.name,
      gameSlug: row.game_slug,
      organizerId: row.organizer_id,
      organizerName: row.organizer_name,
      organizationId: row.organization_id,
      seasonId: row.season_id,
      prizePool: row.prize_pool,
      transferMarketMode: row.transfer_market_mode,
      modeFormat: row.mode_format,
      format: row.format,
      matchMode: row.match_mode,
      groupCount: row.group_count,
      qualifiersPerGroup: row.qualifiers_per_group,
      status: row.status,
      fechaLimiteInscripcion: row.fecha_limite_inscripcion,
      fechaInicio: row.fecha_inicio,
      fechaTermino: row.fecha_termino,
      description: row.description,
      createdAt: row.created_at,
    };
  }

  async findByOrganizer(organizerId: string): Promise<Competition[]> {
    const rows = await queryDB<CompetitionRow>('SELECT * FROM competitions WHERE organizer_id = ? ORDER BY created_at DESC', [organizerId]);
    return rows.map(this.mapRow);
  }

  async findByOrganization(orgId: string): Promise<Competition[]> {
    const rows = await queryDB<CompetitionRow>('SELECT * FROM competitions WHERE organization_id = ? ORDER BY created_at DESC', [orgId]);
    return rows.map(this.mapRow);
  }

  async findByGameSlug(gameSlug: string): Promise<Competition[]> {
    const rows = await queryDB<CompetitionRow>('SELECT * FROM competitions WHERE game_slug = ? ORDER BY created_at DESC', [gameSlug]);
    return rows.map(this.mapRow);
  }

  async getEnrolledTeams(competitionId: string): Promise<any[]> {
    return await queryDB(
      `SELECT * FROM competition_teams WHERE competition_id = ? AND status = 'CONFIRMADO'`,
      [competitionId]
    );
  }

  async removeEnrolledTeam(competitionId: string, teamId: string): Promise<void> {
    await executeCommand(`DELETE FROM competition_teams WHERE competition_id = ? AND team_id = ?`, [competitionId, teamId]);
  }

  async getReportedMatchesCount(competitionId: string): Promise<number> {
    const rows = await queryDB<{ count: number }>(
      `SELECT COUNT(*) as count FROM matches 
       WHERE competition_id = ?
       AND (status IN ('POR_REVISAR', 'TERMINADO', 'DISPUTADO', 'FINALIZADO') 
            OR reported_score_home IS NOT NULL OR reported_score_away IS NOT NULL)`,
      [competitionId]
    );
    return rows[0]?.count || 0;
  }

  async getMatchCompetitionId(matchId: string): Promise<string | null> {
    const rows = await queryDB<{ competition_id: string | null }>(
      'SELECT competition_id FROM matches WHERE id = ?',
      [matchId],
    );
    return rows[0]?.competition_id || null;
  }

  async upsertCompetitionTeam(enrollId: string, competitionId: string, teamId: string, teamName: string, teamTag: string | null): Promise<void> {
    await executeCommand(
      `INSERT INTO competition_teams (id, competition_id, team_id, team_name, team_tag, status)
       VALUES (?, ?, ?, ?, ?, 'CONFIRMADO')
       ON DUPLICATE KEY UPDATE status = 'CONFIRMADO'`,
      [enrollId, competitionId, teamId, teamName, teamTag]
    );
  }

  async create(data: Partial<Competition>): Promise<Competition> {
    const id = data.id || `comp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
    await queryDB(
      `INSERT INTO competitions (id, name, game_slug, organizer_id, organizer_name, organization_id, season_id, prize_pool, transfer_market_mode, mode_format, status, fecha_limite_inscripcion, fecha_inicio, fecha_termino, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Activo', ?, ?, ?, ?, NOW())`,
      [
        id, data.name, data.gameSlug, data.organizerId, data.organizerName,
        data.organizationId || null, data.seasonId || null, data.prizePool || null,
        data.transferMarketMode || 'ABIERTO', data.modeFormat,
        data.fechaLimiteInscripcion || null, data.fechaInicio, data.fechaTermino || null, data.description || null
      ]
    );
    
    const comp = await this.findById(id);
    if (!comp) throw new Error('Error creando competencia');
    return comp;
  }

  async update(id: string, data: Partial<Competition>): Promise<Competition | null> {
    const fields: string[] = [];
    const params: MutableDatabaseParams = [];
    
    const fieldMap: Record<string, string> = {
      name: 'name', gameSlug: 'game_slug', organizerId: 'organizer_id',
      organizerName: 'organizer_name', organizationId: 'organization_id', seasonId: 'season_id',
      prizePool: 'prize_pool', transferMarketMode: 'transfer_market_mode',
      modeFormat: 'mode_format', status: 'status',
      format: 'format', matchMode: 'match_mode',
      groupCount: 'group_count', qualifiersPerGroup: 'qualifiers_per_group',
      maxTeams: 'max_teams', registeredTeamsCount: 'registered_teams_count',
      fechaLimiteInscripcion: 'fecha_limite_inscripcion', fechaInicio: 'fecha_inicio',
      fechaTermino: 'fecha_termino', description: 'description'
    };
    
    for (const [key, value] of Object.entries(data)) {
      const dbKey = fieldMap[key];
      if (dbKey) {
        fields.push(`\`${dbKey}\` = ?`);
        params.push(value);
      }
    }
    
    if (fields.length === 0) return this.findById(id);
    
    params.push(id);
    await queryDB(`UPDATE competitions SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await executeCommand('DELETE FROM competitions WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

export class SeasonRepository extends BaseRepository<Season> {
  protected tableName = 'seasons';
  protected primaryKey = 'id';

  protected mapRow(row: SeasonRow): Season {
    return {
      id: row.id,
      name: row.name,
      organizationId: row.organization_id,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      createdAt: row.created_at,
    };
  }

  async findByOrganization(orgId: string): Promise<Season[]> {
    const rows = await queryDB<SeasonRow>('SELECT * FROM seasons WHERE organization_id = ? OR organization_id IS NULL ORDER BY created_at DESC', [orgId]);
    return rows.map(this.mapRow);
  }

  async create(data: Partial<Season>): Promise<Season> {
    const id = data.id || `seas-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    await queryDB(
      'INSERT INTO seasons (id, name, organization_id, start_date, end_date, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [id, data.name, data.organizationId || null, data.startDate || null, data.endDate || null, data.status || 'Activa']
    );
    const season = await this.findById(id);
    if (!season) throw new Error('Error creando temporada');
    return season;
  }

  async update(id: string, data: Partial<Season>): Promise<Season | null> {
    const fields: string[] = [];
    const params: MutableDatabaseParams = [];
    const fieldMap: Record<string, string> = { name: 'name', organizationId: 'organization_id', startDate: 'start_date', endDate: 'end_date', status: 'status' };
    
    for (const [key, value] of Object.entries(data)) {
      const dbKey = fieldMap[key];
      if (dbKey) {
        fields.push(`\`${dbKey}\` = ?`);
        params.push(value);
      }
    }
    
    if (fields.length === 0) return this.findById(id);
    params.push(id);
    await queryDB(`UPDATE seasons SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await executeCommand('DELETE FROM seasons WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

export interface User {
  id: string;
  email: string;
  passwordHash: string | null;
  googleId: string | null;
  name: string;
  gamertag: string;
  role: string;
  primaryGameSlug: string;
  platform: string;
  position: string;
  secondaryPosition: string | null;
  rankBadge: string;
  rating: number;
  status: string;
  avatarUrl: string | null;
  organizationId: string | null;
  isBanned: boolean;
  banReason: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
}

export interface Organization {
  id: string;
  name: string;
  tag: string;
  ownerId: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  country: string;
  allowedGames: string[];
  status?: string;
  slug?: string;
  isBanned?: boolean;
  banReason?: string | null;
  bannedAt?: string | null;
  socialMedia?: Record<string, unknown> | null;
  createdAt: string;
}

export class MatchRepository extends BaseRepository<Match> {
  protected tableName = 'matches';
  protected primaryKey = 'id';

  protected mapRow(row: MatchRow): Match {
    return {
      id: row.id, tournamentId: row.tournament_id, competitionId: row.competition_id,
      round: row.round, matchday: row.matchday, roundName: row.round_name, groupName: row.group_name,
      teamHomeId: row.team_home_id, homeTeamId: row.home_team_id,
      teamAwayId: row.team_away_id, awayTeamId: row.away_team_id,
      homeTeamName: row.home_team_name, homeTeamTag: row.home_team_tag,
      awayTeamName: row.away_team_name, awayTeamTag: row.away_team_tag,
      scoreHome: row.score_home, scoreAway: row.score_away,
      reportedScoreHome: row.reported_score_home, reportedScoreAway: row.reported_score_away,
      winnerTeamId: row.winner_team_id, proofUrl: row.proof_url,
      reportedByUserId: row.reported_by_user_id, nextMatchId: row.next_match_id,
      nextMatchSlot: row.next_match_slot, scheduledAt: row.scheduled_at,
      scheduledTime: row.scheduled_time, status: row.status, createdAt: row.created_at,
    };
  }

  async findByCompetition(competitionId: string): Promise<Match[]> {
    const rows = await queryDB<MatchRow>(
      'SELECT * FROM matches WHERE competition_id = ? OR tournament_id = ? ORDER BY scheduled_at ASC',
      [competitionId, competitionId],
    );
    return rows.map((row) => this.mapRow(row));
  }

  async addPlayerStat(statsId: string, matchId: string, playerId: string, gameSlug: string, statsJson: string): Promise<void> {
    await queryDB(
      'INSERT INTO match_player_stats (id, match_id, player_id, game_slug, stats_json) VALUES (?, ?, ?, ?, ?)',
      [statsId, matchId, playerId, gameSlug, statsJson],
    );
  }

  async create(data: Partial<Match>): Promise<Match> {
    const id = data.id || `match-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    await queryDB(
      `INSERT INTO matches (id, tournament_id, competition_id, team_home_id, home_team_id, team_away_id, away_team_id, scheduled_at, scheduled_time, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, data.tournamentId || null, data.competitionId || null, data.teamHomeId || null, data.homeTeamId || null, data.teamAwayId || null, data.awayTeamId || null, data.scheduledAt || null, data.scheduledTime || null, data.status || 'PROGRAMADO'],
    );
    const match = await this.findById(id);
    if (!match) throw new Error('Error creando encuentro');
    return match;
  }

  async update(id: string, data: Partial<Match>): Promise<Match | null> {
    const fieldMap: Record<string, string> = {
      tournamentId: 'tournament_id', competitionId: 'competition_id', round: 'round', matchday: 'matchday',
      roundName: 'round_name', groupName: 'group_name', teamHomeId: 'team_home_id', homeTeamId: 'home_team_id',
      teamAwayId: 'team_away_id', awayTeamId: 'away_team_id', homeTeamName: 'home_team_name',
      homeTeamTag: 'home_team_tag', awayTeamName: 'away_team_name', awayTeamTag: 'away_team_tag',
      scoreHome: 'score_home', scoreAway: 'score_away', reportedScoreHome: 'reported_score_home',
      reportedScoreAway: 'reported_score_away', winnerTeamId: 'winner_team_id', proofUrl: 'proof_url',
      reportedByUserId: 'reported_by_user_id', nextMatchId: 'next_match_id', nextMatchSlot: 'next_match_slot',
      scheduledAt: 'scheduled_at', scheduledTime: 'scheduled_time', status: 'status',
    };
    const entries = Object.entries(data).filter(([key]) => fieldMap[key]);
    if (entries.length === 0) return this.findById(id);
    await queryDB(
      `UPDATE matches SET ${entries.map(([key]) => `\`${fieldMap[key]}\` = ?`).join(', ')} WHERE id = ?`,
      [...entries.map(([, value]) => value ?? null), id],
    );
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await executeCommand('DELETE FROM matches WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

export class GameRepository implements Repository<Game> {
  private mapRow(row: GameRow): Game {
    return { slug: row.slug, name: row.name, category: row.category, teamSize: row.team_size, positionsJson: row.positions_json, brandColor: row.brand_color, statsSchema: row.stats_schema, createdAt: row.created_at };
  }

  async findById(slug: string): Promise<Game | null> {
    const rows = await queryDB<GameRow>('SELECT * FROM games WHERE slug = ? LIMIT 1', [slug]);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findAll(options: FindOptions = {}): Promise<Game[]> {
    const direction = options.orderDirection === 'ASC' ? 'ASC' : 'DESC';
    const orderBy = options.orderBy === 'name' ? 'name' : 'created_at';
    const rows = await queryDB<GameRow>(`SELECT * FROM games ORDER BY \`${orderBy}\` ${direction} LIMIT ? OFFSET ?`, [options.limit || 100, options.offset || 0]);
    return rows.map((row) => this.mapRow(row));
  }

  async create(data: Partial<Game>): Promise<Game> {
    if (!data.slug) throw new Error('Slug de disciplina requerido');
    await queryDB('INSERT INTO games (slug, name, category, team_size, positions_json, brand_color, stats_schema, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())', [data.slug, data.name, data.category || 'eSports', data.teamSize || 5, data.positionsJson ? JSON.stringify(data.positionsJson) : null, data.brandColor || '#FFFFFF', data.statsSchema ? JSON.stringify(data.statsSchema) : null]);
    return (await this.findById(data.slug))!;
  }

  async update(slug: string, data: Partial<Game>): Promise<Game | null> {
    const fieldMap: Record<string, string> = { name: 'name', category: 'category', teamSize: 'team_size', positionsJson: 'positions_json', brandColor: 'brand_color', statsSchema: 'stats_schema' };
    const entries = Object.entries(data).filter(([key]) => fieldMap[key]);
    if (entries.length === 0) return this.findById(slug);
    await queryDB(`UPDATE games SET ${entries.map(([key]) => `\`${fieldMap[key]}\` = ?`).join(', ')} WHERE slug = ?`, [...entries.map(([key, value]) => ['positionsJson', 'statsSchema'].includes(key) && typeof value !== 'string' ? JSON.stringify(value) : value ?? null), slug]);
    return this.findById(slug);
  }

  async delete(slug: string): Promise<boolean> {
    const result = await executeCommand('DELETE FROM games WHERE slug = ?', [slug]);
    return result.affectedRows > 0;
  }

  async count(): Promise<number> {
    const rows = await queryDB<{ total: number }>('SELECT COUNT(*) AS total FROM games');
    return rows[0]?.total || 0;
  }
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  gameSlug: string;
  organizationId: string | null;
  captainId: string;
  captainName: string;
  platform: string;
  membersCount: number;
  maxMembers: number;
  color: string;
  logoText: string;
  description: string | null;
  vacantPositions: string[];
  logoUrl: string | null;
  bannerUrl: string | null;
  status: string;
  clubIdEa: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Competition {
  id: string;
  name: string;
  gameSlug: string;
  organizerId: string | null;
  organizerName: string | null;
  organizationId: string | null;
  seasonId: string | null;
  prizePool: string | null;
  transferMarketMode: string;
  modeFormat: string;
  format?: string | null;
  matchMode?: string | null;
  groupCount?: number | null;
  qualifiersPerGroup?: number | null;
  status: string;
  fechaLimiteInscripcion: string | null;
  fechaInicio: string;
  fechaTermino: string | null;
  description: string | null;
  createdAt: string;
}

export interface Season {
  id: string;
  name: string;
  organizationId: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  createdAt: string;
}

export const userRepository = new UserRepository();
export const organizationRepository = new OrganizationRepository();
export const teamRepository = new TeamRepository();
export const competitionRepository = new CompetitionRepository();
export const seasonRepository = new SeasonRepository();
