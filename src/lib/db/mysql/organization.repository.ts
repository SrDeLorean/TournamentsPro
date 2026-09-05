import type { Organization, IOrganizationRepository } from '@/lib/db/interfaces';
import { BaseRepository, type OrganizationRow, type MutableDatabaseParams } from './types';
import type { DatabaseParams } from '@/lib/db';

export class OrganizationRepository extends BaseRepository<Organization> implements IOrganizationRepository {
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
    const rows = await this.queryRows<OrganizationRow>('SELECT * FROM organizations WHERE owner_id = ? LIMIT 1', [ownerId]);
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  async getOrganizationsWithStats(gameSlug?: string): Promise<Record<string, unknown>[]> {
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
    return this.queryRows<Record<string, unknown>>(query, params);
  }

  async create(data: Partial<Organization>): Promise<Organization> {
    const id = data.id || `org-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const allowedGamesJson = data.allowedGames ? JSON.stringify(data.allowedGames) : '[]';
    
    await this.runCommand(
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
    await this.runCommand(`UPDATE organizations SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.runCommand('DELETE FROM organizations WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async hasActiveCompetitions(organizationId: string): Promise<boolean> {
    const rows = await this.queryRows<{ id: string }>(
      `SELECT DISTINCT c.id
         FROM competitions c
         LEFT JOIN competition_teams ct ON ct.competition_id = c.id AND ct.status = 'CONFIRMADO'
         LEFT JOIN teams t ON t.id = ct.team_id
        WHERE c.status IN ('Activo', 'Inscripcion', 'En Curso')
          AND (c.organization_id = ? OR t.organization_id = ?) LIMIT 1`,
      [organizationId, organizationId]
    );
    return rows.length > 0;
  }

  async archiveOrganization(organizationId: string): Promise<number> {
    const teamRows = await this.queryRows<{ id: string }>('SELECT id FROM teams WHERE organization_id = ?', [organizationId]);
    const teamIds = teamRows.map((t) => t.id);
    if (teamIds.length > 0) {
      const placeholders = teamIds.map(() => '?').join(', ');
      await this.runCommand(`UPDATE team_vacancies SET status = 'CERRADA' WHERE team_id IN (${placeholders}) AND status = 'ABIERTA'`, teamIds);
      await this.runCommand(`UPDATE transfer_market_posts SET status = 'CADUCADO' WHERE team_id IN (${placeholders}) AND status = 'ACTIVO'`, teamIds);
      await this.runCommand(`UPDATE teams SET status = 'Archivado', updated_at = NOW() WHERE id IN (${placeholders})`, teamIds);
    }
    await this.runCommand("UPDATE organizations SET status = 'Archivada', updated_at = NOW() WHERE id = ?", [organizationId]);
    return teamIds.length;
  }
}
