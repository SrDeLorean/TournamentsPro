import type { User, IUserRepository } from '@/lib/db/interfaces';
import { BaseRepository, type UserRow, type MutableDatabaseParams } from './types';

export class UserRepository extends BaseRepository<User> implements IUserRepository {
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
      bannedAt: row.banned_at,
      gameProfiles: row.game_profiles,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLoginAt: row.last_login_at,
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.queryRows<UserRow>('SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [email]);
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  async findByGamertag(gamertag: string): Promise<User | null> {
    const rows = await this.queryRows<UserRow>('SELECT * FROM users WHERE LOWER(gamertag) = LOWER(?) LIMIT 1', [gamertag]);
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  async findByEmailOrGamertag(identifier: string): Promise<User | null> {
    const rows = await this.queryRows<UserRow>(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(gamertag) = LOWER(?) LIMIT 1',
      [identifier, identifier]
    );
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  async getAvailablePlayers(options: { organizerOrgId?: string | null; searchQuery?: string } = {}): Promise<Record<string, unknown>[]> {
    let sql = `
      SELECT u.id, u.name, u.gamertag, u.email, u.position, u.primary_game_slug, u.organization_id, u.avatar_url, u.foto, u.role, u.status,
             o.name AS organization_name,
             (SELECT tm.team_id FROM team_members tm WHERE tm.user_id = u.id LIMIT 1) AS current_team_id,
             (SELECT t.name FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.user_id = u.id LIMIT 1) AS current_team_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE (u.role NOT IN ('Administrador', 'Organizador') OR u.role IS NULL)
      AND (u.is_banned = 0 OR u.is_banned IS NULL)
    `;
    const params: MutableDatabaseParams = [];

    if (options.searchQuery && options.searchQuery.trim()) {
      const q = `%${options.searchQuery.trim()}%`;
      sql += ` AND (u.name LIKE ? OR u.gamertag LIKE ? OR u.position LIKE ? OR u.email LIKE ?)`;
      params.push(q, q, q, q);
    }

    sql += ` ORDER BY u.name ASC LIMIT 60`;
    return this.queryRows<Record<string, unknown>>(sql, params);
  }

  async create(data: Partial<User>): Promise<User> {
    const id = data.id || `usr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    await this.runCommand(
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
        params.push(typeof value === 'object' && value !== null ? JSON.stringify(value) : value);
      }
    }
    
    if (fields.length === 0) return this.findById(id);
    
    fields.push('`updated_at` = NOW()');
    params.push(id);
    
    await this.runCommand(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.runCommand('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}
