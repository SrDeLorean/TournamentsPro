import type { Competition, ICompetitionRepository } from '@/lib/db/interfaces';
import { BaseRepository, type CompetitionRow, type MutableDatabaseParams } from './types';

export class CompetitionRepository extends BaseRepository<Competition> implements ICompetitionRepository {
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
    const rows = await this.queryRows<CompetitionRow>('SELECT * FROM competitions WHERE organizer_id = ? ORDER BY created_at DESC', [organizerId]);
    return rows.map((row) => this.mapRow(row));
  }

  async findByOrganization(orgId: string): Promise<Competition[]> {
    const rows = await this.queryRows<CompetitionRow>('SELECT * FROM competitions WHERE organization_id = ? ORDER BY created_at DESC', [orgId]);
    return rows.map((row) => this.mapRow(row));
  }

  async findByGameSlug(gameSlug: string): Promise<Competition[]> {
    const rows = await this.queryRows<CompetitionRow>('SELECT * FROM competitions WHERE game_slug = ? ORDER BY created_at DESC', [gameSlug]);
    return rows.map((row) => this.mapRow(row));
  }

  async getEnrolledTeams(competitionId: string): Promise<Record<string, unknown>[]> {
    return this.queryRows<Record<string, unknown>>(
      `SELECT * FROM competition_teams WHERE competition_id = ? AND status = 'CONFIRMADO'`,
      [competitionId]
    );
  }

  async removeEnrolledTeam(competitionId: string, teamId: string): Promise<void> {
    await this.runCommand(`DELETE FROM competition_teams WHERE competition_id = ? AND team_id = ?`, [competitionId, teamId]);
  }

  async getReportedMatchesCount(competitionId: string): Promise<number> {
    const rows = await this.queryRows<{ count: number }>(
      `SELECT COUNT(*) as count FROM matches 
       WHERE competition_id = ?
       AND (status IN ('POR_REVISAR', 'TERMINADO', 'DISPUTADO', 'FINALIZADO') 
            OR reported_score_home IS NOT NULL OR reported_score_away IS NOT NULL)`,
      [competitionId]
    );
    return rows[0]?.count || 0;
  }

  async getMatchCompetitionId(matchId: string): Promise<string | null> {
    const rows = await this.queryRows<{ competition_id: string | null }>(
      'SELECT competition_id FROM matches WHERE id = ?',
      [matchId],
    );
    return rows[0]?.competition_id || null;
  }

  async upsertCompetitionTeam(enrollId: string, competitionId: string, teamId: string, teamName: string, teamTag: string | null): Promise<void> {
    await this.runCommand(
      `INSERT INTO competition_teams (id, competition_id, team_id, team_name, team_tag, status)
       VALUES (?, ?, ?, ?, ?, 'CONFIRMADO')
       ON DUPLICATE KEY UPDATE status = 'CONFIRMADO'`,
      [enrollId, competitionId, teamId, teamName, teamTag]
    );
  }

  async create(data: Partial<Competition>): Promise<Competition> {
    const id = data.id || `comp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
    await this.runCommand(
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
    await this.runCommand(`UPDATE competitions SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.runCommand('DELETE FROM competitions WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}
