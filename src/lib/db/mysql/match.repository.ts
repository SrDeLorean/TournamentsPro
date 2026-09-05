import type { Match, IMatchRepository } from '@/lib/db/interfaces';
import { BaseRepository, type MatchRow } from './types';

export class MatchRepository extends BaseRepository<Match> implements IMatchRepository {
  protected tableName = 'matches';
  protected primaryKey = 'id';

  protected mapRow(row: MatchRow): Match {
    return {
      id: row.id,
      tournamentId: row.tournament_id,
      competitionId: row.competition_id,
      round: row.round,
      matchday: row.matchday,
      stage: row.stage,
      roundName: row.round_name,
      groupName: row.group_name,
      teamHomeId: row.team_home_id,
      homeTeamId: row.home_team_id,
      teamAwayId: row.team_away_id,
      awayTeamId: row.away_team_id,
      homeTeamName: row.home_team_name,
      homeTeamTag: row.home_team_tag,
      awayTeamName: row.away_team_name,
      awayTeamTag: row.away_team_tag,
      scoreHome: row.score_home,
      scoreAway: row.score_away,
      reportedScoreHome: row.reported_score_home,
      reportedScoreAway: row.reported_score_away,
      winnerTeamId: row.winner_team_id,
      proofUrl: row.proof_url,
      reportedByUserId: row.reported_by_user_id,
      nextMatchId: row.next_match_id,
      nextMatchSlot: row.next_match_slot,
      scheduledAt: row.scheduled_at,
      scheduledTime: row.scheduled_time,
      status: row.status,
      createdAt: row.created_at,
    };
  }

  async findByCompetition(competitionId: string): Promise<Match[]> {
    const rows = await this.queryRows<MatchRow>(
      'SELECT * FROM matches WHERE competition_id = ? OR tournament_id = ? ORDER BY scheduled_at ASC',
      [competitionId, competitionId],
    );
    return rows.map((row) => this.mapRow(row));
  }

  async addPlayerStat(statsId: string, matchId: string, playerId: string, gameSlug: string, statsJson: string): Promise<void> {
    await this.runCommand(
      'INSERT INTO match_player_stats (id, match_id, player_id, game_slug, stats_json) VALUES (?, ?, ?, ?, ?)',
      [statsId, matchId, playerId, gameSlug, statsJson],
    );
  }

  async create(data: Partial<Match>): Promise<Match> {
    const id = data.id || `match-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    await this.runCommand(
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
      stage: 'stage', roundName: 'round_name', groupName: 'group_name', teamHomeId: 'team_home_id', homeTeamId: 'home_team_id',
      teamAwayId: 'team_away_id', awayTeamId: 'away_team_id', homeTeamName: 'home_team_name',
      homeTeamTag: 'home_team_tag', awayTeamName: 'away_team_name', awayTeamTag: 'away_team_tag',
      scoreHome: 'score_home', scoreAway: 'score_away', reportedScoreHome: 'reported_score_home',
      reportedScoreAway: 'reported_score_away', winnerTeamId: 'winner_team_id', proofUrl: 'proof_url',
      reportedByUserId: 'reported_by_user_id', nextMatchId: 'next_match_id', nextMatchSlot: 'next_match_slot',
      scheduledAt: 'scheduled_at', scheduledTime: 'scheduled_time', status: 'status',
    };
    const entries = Object.entries(data).filter(([key]) => fieldMap[key]);
    if (entries.length === 0) return this.findById(id);
    await this.runCommand(
      `UPDATE matches SET ${entries.map(([key]) => `\`${fieldMap[key]}\` = ?`).join(', ')} WHERE id = ?`,
      [...entries.map(([, value]) => value ?? null), id],
    );
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.runCommand('DELETE FROM matches WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}
