import { executeCommand, queryDB, type DatabaseExecutor, type DatabaseParams } from '@/lib/db';
import type { Game, IGameRepository, FindOptions } from '@/lib/db/interfaces';
import type { GameRow } from './types';

export class GameRepository implements IGameRepository {
  constructor(private readonly executor?: DatabaseExecutor) {}

  private queryRows<R>(sql: string, params: DatabaseParams = []): Promise<R[]> {
    return this.executor
      ? this.executor.queryRows<R>(sql, params)
      : queryDB<R>(sql, params);
  }

  private runCommand(sql: string, params: DatabaseParams = []) {
    return this.executor
      ? this.executor.executeCommand(sql, params)
      : executeCommand(sql, params);
  }

  private mapRow(row: GameRow): Game {
    return {
      slug: row.slug,
      name: row.name,
      category: row.category,
      teamSize: row.team_size,
      positionsJson: row.positions_json,
      brandColor: row.brand_color,
      statsSchema: row.stats_schema,
      createdAt: row.created_at,
    };
  }

  async findById(slug: string, options: { forUpdate?: boolean } = {}): Promise<Game | null> {
    const rows = await this.queryRows<GameRow>(`SELECT * FROM games WHERE slug = ? LIMIT 1${options.forUpdate ? ' FOR UPDATE' : ''}`, [slug]);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findAll(options: FindOptions = {}): Promise<Game[]> {
    const direction = options.orderDirection === 'ASC' ? 'ASC' : 'DESC';
    const orderBy = options.orderBy === 'name' ? 'name' : 'created_at';
    const rows = await this.queryRows<GameRow>(`SELECT * FROM games ORDER BY \`${orderBy}\` ${direction} LIMIT ? OFFSET ?`, [options.limit || 100, options.offset || 0]);
    return rows.map((row) => this.mapRow(row));
  }

  async create(data: Partial<Game>): Promise<Game> {
    if (!data.slug) throw new Error('Slug de disciplina requerido');
    await this.runCommand('INSERT INTO games (slug, name, category, team_size, positions_json, brand_color, stats_schema, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())', [data.slug, data.name, data.category || 'eSports', data.teamSize || 5, data.positionsJson ? JSON.stringify(data.positionsJson) : null, data.brandColor || '#FFFFFF', data.statsSchema ? JSON.stringify(data.statsSchema) : null]);
    return (await this.findById(data.slug))!;
  }

  async update(slug: string, data: Partial<Game>): Promise<Game | null> {
    const fieldMap: Record<string, string> = { name: 'name', category: 'category', teamSize: 'team_size', positionsJson: 'positions_json', brandColor: 'brand_color', statsSchema: 'stats_schema' };
    const entries = Object.entries(data).filter(([key]) => fieldMap[key]);
    if (entries.length === 0) return this.findById(slug);
    await this.runCommand(`UPDATE games SET ${entries.map(([key]) => `\`${fieldMap[key]}\` = ?`).join(', ')} WHERE slug = ?`, [...entries.map(([key, value]) => ['positionsJson', 'statsSchema'].includes(key) && typeof value !== 'string' ? JSON.stringify(value) : value ?? null), slug]);
    return this.findById(slug);
  }

  async delete(slug: string): Promise<boolean> {
    const result = await this.runCommand('DELETE FROM games WHERE slug = ?', [slug]);
    return result.affectedRows > 0;
  }

  async count(): Promise<number> {
    const rows = await this.queryRows<{ total: number }>('SELECT COUNT(*) AS total FROM games');
    return rows[0]?.total || 0;
  }
}
