import { queryDB, dbPool } from '@/lib/db';

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
  protected abstract mapRow(row: any): T;

  async findById(id: string): Promise<T | null> {
    const rows = await queryDB<any>(`SELECT * FROM \`${this.tableName}\` WHERE \`${this.primaryKey}\` = ? LIMIT 1`, [id]);
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  async findAll(options: FindOptions = {}): Promise<T[]> {
    const { where = {}, orderBy = 'created_at', orderDirection = 'DESC', limit = 50, offset = 0 } = options;
    
    const whereClauses: string[] = [];
    const params: any[] = [];
    
    for (const [key, value] of Object.entries(where)) {
      if (value === null) {
        whereClauses.push(`\`${key}\` IS NULL`);
      } else if (Array.isArray(value)) {
        whereClauses.push(`\`${key}\` IN (${value.map(() => '?').join(',')})`);
        params.push(...value);
      } else {
        whereClauses.push(`\`${key}\` = ?`);
        params.push(value);
      }
    }
    
    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const sql = `SELECT * FROM \`${this.tableName}\` ${whereSql} ORDER BY \`${orderBy}\` ${orderDirection} LIMIT ? OFFSET ?`;
    
    const rows = await queryDB<any>(sql, [...params, limit, offset]);
    return rows.map(this.mapRow);
  }

  async count(options: FindOptions = {}): Promise<number> {
    const { where = {} } = options;
    const whereClauses: string[] = [];
    const params: any[] = [];
    
    for (const [key, value] of Object.entries(where)) {
      if (value === null) {
        whereClauses.push(`\`${key}\` IS NULL`);
      } else if (Array.isArray(value)) {
        whereClauses.push(`\`${key}\` IN (${value.map(() => '?').join(',')})`);
        params.push(...value);
      } else {
        whereClauses.push(`\`${key}\` = ?`);
        params.push(value);
      }
    }
    
    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const result = await queryDB<{ total: number }>(`SELECT COUNT(*) as total FROM \`${this.tableName}\` ${whereSql}`, params);
    return result[0]?.total || 0;
  }

  abstract create(data: Partial<T>): Promise<T>;
  abstract update(id: string, data: Partial<T>): Promise<T | null>;
  abstract delete(id: string): Promise<boolean>;

  protected async executeTransaction(queries: { sql: string; params: any[] }[]): Promise<void> {
    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();
      for (const { sql, params } of queries) {
        await connection.execute(sql, params);
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

  protected mapRow(row: any): User {
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
    const rows = await queryDB<any>('SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [email]);
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  async findByGamertag(gamertag: string): Promise<User | null> {
    const rows = await queryDB<any>('SELECT * FROM users WHERE LOWER(gamertag) = LOWER(?) LIMIT 1', [gamertag]);
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  async findByEmailOrGamertag(identifier: string): Promise<User | null> {
    const rows = await queryDB<any>(
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
    const params: any[] = [];
    
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
    const result = await queryDB('DELETE FROM users WHERE id = ?', [id]);
    return true;
  }
}

export class OrganizationRepository extends BaseRepository<Organization> {
  protected tableName = 'organizations';
  protected primaryKey = 'id';

  protected mapRow(row: any): Organization {
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
      createdAt: row.created_at,
    };
  }

  async findByOwnerId(ownerId: string): Promise<Organization | null> {
    const rows = await queryDB<any>('SELECT * FROM organizations WHERE owner_id = ? LIMIT 1', [ownerId]);
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
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
    const params: any[] = [];
    
    const fieldMap: Record<string, string> = {
      name: 'name', tag: 'tag', logoUrl: 'logo_url', bannerUrl: 'banner_url',
      description: 'description', country: 'country', allowedGames: 'allowed_games'
    };
    
    for (const [key, value] of Object.entries(data)) {
      const dbKey = fieldMap[key];
      if (dbKey) {
        fields.push(`\`${dbKey}\` = ?`);
        params.push(key === 'allowedGames' ? JSON.stringify(value) : value);
      }
    }
    
    if (fields.length === 0) return this.findById(id);
    
    params.push(id);
    await queryDB(`UPDATE organizations SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    await queryDB('DELETE FROM organizations WHERE id = ?', [id]);
    return true;
  }
}

export class TeamRepository extends BaseRepository<Team> {
  protected tableName = 'teams';
  protected primaryKey = 'id';

  protected mapRow(row: any): Team {
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
    const params: any[] = [captainId];
    if (gameSlug) {
      sql += ' AND game_slug = ?';
      params.push(gameSlug);
    }
    const rows = await queryDB<any>(sql, params);
    return rows.map(this.mapRow);
  }

  async findByOrganization(orgId: string): Promise<Team[]> {
    const rows = await queryDB<any>('SELECT * FROM teams WHERE organization_id = ? ORDER BY created_at DESC', [orgId]);
    return rows.map(this.mapRow);
  }

  async findByGameSlug(gameSlug: string): Promise<Team[]> {
    const rows = await queryDB<any>('SELECT * FROM teams WHERE game_slug = ? AND is_banned = 0 ORDER BY name ASC', [gameSlug]);
    return rows.map(this.mapRow);
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
    const params: any[] = [];
    
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
    await queryDB('DELETE FROM teams WHERE id = ?', [id]);
    return true;
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

  protected mapRow(row: any): Competition {
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
      status: row.status,
      fechaLimiteInscripcion: row.fecha_limite_inscripcion,
      fechaInicio: row.fecha_inicio,
      fechaTermino: row.fecha_termino,
      description: row.description,
      createdAt: row.created_at,
    };
  }

  async findByOrganizer(organizerId: string): Promise<Competition[]> {
    const rows = await queryDB<any>('SELECT * FROM competitions WHERE organizer_id = ? ORDER BY created_at DESC', [organizerId]);
    return rows.map(this.mapRow);
  }

  async findByOrganization(orgId: string): Promise<Competition[]> {
    const rows = await queryDB<any>('SELECT * FROM competitions WHERE organization_id = ? ORDER BY created_at DESC', [orgId]);
    return rows.map(this.mapRow);
  }

  async findByGameSlug(gameSlug: string): Promise<Competition[]> {
    const rows = await queryDB<any>('SELECT * FROM competitions WHERE game_slug = ? ORDER BY created_at DESC', [gameSlug]);
    return rows.map(this.mapRow);
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
    const params: any[] = [];
    
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
    await queryDB('DELETE FROM competitions WHERE id = ?', [id]);
    return true;
  }
}

export class SeasonRepository extends BaseRepository<Season> {
  protected tableName = 'seasons';
  protected primaryKey = 'id';

  protected mapRow(row: any): Season {
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
    const rows = await queryDB<any>('SELECT * FROM seasons WHERE organization_id = ? OR organization_id IS NULL ORDER BY created_at DESC', [orgId]);
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
    const params: any[] = [];
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
    await queryDB('DELETE FROM seasons WHERE id = ?', [id]);
    return true;
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
  createdAt: string;
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