import type { Season, ISeasonRepository } from '@/lib/db/interfaces';
import { BaseRepository, type SeasonRow, type MutableDatabaseParams } from './types';

export class SeasonRepository extends BaseRepository<Season> implements ISeasonRepository {
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
    const rows = await this.queryRows<SeasonRow>('SELECT * FROM seasons WHERE organization_id = ? OR organization_id IS NULL ORDER BY created_at DESC', [orgId]);
    return rows.map((row) => this.mapRow(row));
  }

  async create(data: Partial<Season>): Promise<Season> {
    const id = data.id || `seas-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    await this.runCommand(
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
    await this.runCommand(`UPDATE seasons SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.runCommand('DELETE FROM seasons WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}
