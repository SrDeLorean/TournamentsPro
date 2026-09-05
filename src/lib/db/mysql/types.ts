import type { RowDataPacket } from 'mysql2';
import {
  executeCommand,
  queryDB,
  withTransaction,
  type DatabaseExecutor,
  type DatabaseParams,
} from '@/lib/db';
import type { FindOptions, IRepository } from '@/lib/db/interfaces';

export type MutableDatabaseParams = Array<DatabaseParams[number]>;

export interface UserRow extends RowDataPacket {
  id: string; email: string; password_hash: string | null; google_id: string | null; name: string;
  gamertag: string; role: string; primary_game_slug: string; platform: string; position: string;
  secondary_position: string | null; rank_badge: string; rating: number; status: string;
  avatar_url: string | null; organization_id: string | null; is_banned: number; ban_reason: string | null;
  banned_at?: string | null; game_profiles?: string | null; last_login_at?: string | null;
  created_at: string; updated_at: string;
}

export interface OrganizationRow extends RowDataPacket {
  id: string; name: string; tag: string; owner_id: string; logo_url: string | null;
  banner_url: string | null; description: string | null; country: string;
  allowed_games: string | null; created_at: string;
  status?: string; slug?: string; is_banned?: number; ban_reason?: string | null;
  banned_at?: string | null; social_media?: string | null;
}

export interface MatchRow extends RowDataPacket {
  id: string; tournament_id: string | null; competition_id: string | null; round: number | null;
  matchday: number | null; stage?: string | null; round_name: string | null; group_name: string | null;
  team_home_id: string | null; home_team_id: string | null; team_away_id: string | null;
  away_team_id: string | null; home_team_name: string | null; home_team_tag: string | null;
  away_team_name: string | null; away_team_tag: string | null; score_home: number | null;
  score_away: number | null; reported_score_home: number | null; reported_score_away: number | null;
  winner_team_id: string | null; proof_url: string | null; reported_by_user_id: string | null;
  next_match_id: string | null; next_match_slot: string | null; scheduled_at: string | null;
  scheduled_time: string | null; status: string; created_at?: string;
}

export interface GameRow extends RowDataPacket {
  slug: string; name: string; category: string; team_size: number; positions_json: unknown;
  brand_color: string; stats_schema: unknown; created_at: string;
}

export interface TeamRow extends RowDataPacket {
  id: string; name: string; tag: string; game_slug: string; organization_id: string | null;
  captain_id: string; captain_name: string; platform: string; members_count: number; max_members: number;
  color: string; logo_text: string; description: string | null; vacant_positions: string | null;
  logo_url: string | null; banner_url: string | null; status: string; club_id_ea: string | null;
  is_banned?: number; ban_reason?: string | null;
  created_at: string; updated_at: string;
}

export interface CompetitionRow extends RowDataPacket {
  id: string; name: string; game_slug: string; organizer_id: string | null; organizer_name: string | null;
  organization_id: string | null; season_id: string | null; prize_pool: string | null;
  transfer_market_mode: string; mode_format: string; format: string | null; match_mode: string | null;
  group_count: number | null; qualifiers_per_group: number | null; status: string; fecha_limite_inscripcion: string | null;
  fecha_inicio: string; fecha_termino: string | null; description: string | null; created_at: string;
}

export interface SeasonRow extends RowDataPacket {
  id: string; name: string; organization_id: string | null; start_date: string | null;
  end_date: string | null; status: string; created_at: string;
}

export abstract class BaseRepository<T extends { id: string }> implements IRepository<T> {
  protected abstract tableName: string;
  protected abstract primaryKey: string;
  protected abstract mapRow(row: RowDataPacket): T;

  constructor(private readonly executor?: DatabaseExecutor) {}

  protected queryRows<R = RowDataPacket>(sql: string, params: DatabaseParams = []): Promise<R[]> {
    return this.executor
      ? this.executor.queryRows<R>(sql, params)
      : queryDB<R>(sql, params);
  }

  protected runCommand(sql: string, params: DatabaseParams = []) {
    return this.executor
      ? this.executor.executeCommand(sql, params)
      : executeCommand(sql, params);
  }

  async findById(id: string, options: { forUpdate?: boolean } = {}): Promise<T | null> {
    const lockClause = options.forUpdate ? ' FOR UPDATE' : '';
    const rows = await this.queryRows<RowDataPacket>(`SELECT * FROM \`${this.tableName}\` WHERE \`${this.primaryKey}\` = ? LIMIT 1${lockClause}`, [id]);
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
    
    const rows = await this.queryRows<RowDataPacket>(sql, [...params, limit, offset]);
    return rows.map((row) => this.mapRow(row));
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
    const result = await this.queryRows<{ total: number }>(`SELECT COUNT(*) as total FROM \`${this.tableName}\` ${whereSql}`, params);
    return result[0]?.total || 0;
  }

  abstract create(data: Partial<T>): Promise<T>;
  abstract update(id: string, data: Partial<T>): Promise<T | null>;
  abstract delete(id: string): Promise<boolean>;

  protected async executeTransaction(queries: { sql: string; params: DatabaseParams }[]): Promise<void> {
    if (this.executor) {
      for (const { sql, params } of queries) {
        await this.executor.executeCommand(sql, params);
      }
      return;
    }

    await withTransaction(async (transaction) => {
      for (const { sql, params } of queries) {
        await transaction.executeCommand(sql, params);
      }
    });
  }
}
