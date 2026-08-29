const fs = require('fs');
const content = \
export interface MatchRow extends Record<string, unknown> {
  id: string;
  tournament_id: string | null;
  competition_id: string | null;
  round: number | null;
  matchday: number | null;
  round_name: string | null;
  group_name: string | null;
  team_home_id: string | null;
  home_team_id: string | null;
  team_away_id: string | null;
  away_team_id: string | null;
  home_team_name: string | null;
  home_team_tag: string | null;
  away_team_name: string | null;
  away_team_tag: string | null;
  score_home: number | null;
  score_away: number | null;
  reported_score_home: number | null;
  reported_score_away: number | null;
  winner_team_id: string | null;
  proof_url: string | null;
  reported_by_user_id: string | null;
  next_match_id: string | null;
  next_match_slot: string | null;
  scheduled_at: string | null;
  scheduled_time: string | null;
  status: string;
}

export class MatchRepository extends BaseRepository<Match> {
  protected tableName = 'matches';
  protected primaryKey = 'id';

  protected mapRow(row: any): Match {
    return {
      id: row.id,
      tournamentId: row.tournament_id,
      competitionId: row.competition_id,
      round: row.round,
      matchday: row.matchday,
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
      status: row.status
    };
  }

  async findByCompetition(competitionId: string): Promise<Match[]> {
    const rows = await queryDB<MatchRow>(
      'SELECT * FROM matches WHERE competition_id = ? OR tournament_id = ? ORDER BY scheduled_at ASC',
      [competitionId, competitionId]
    );
    return rows.map(r => this.mapRow(r));
  }

  async addPlayerStat(statsId: string, matchId: string, playerId: string, gameSlug: string, statsJson: string): Promise<void> {
    await executeCommand(
      'INSERT INTO match_player_stats (id, match_id, player_id, game_slug, stats_json) VALUES (?, ?, ?, ?, ?)',
      [statsId, matchId, playerId, gameSlug, statsJson]
    );
  }

  async create(data: Partial<Match>): Promise<Match> {
    const fields = Object.keys(data).map(k => {
      const matchKey = k.replace(/([A-Z])/g, '_1').toLowerCase();
      return '\\\' + matchKey + '\\\';
    });
    const placeholders = fields.map(() => '?');
    const values = Object.values(data);
    
    await queryDB('INSERT INTO matches (' + fields.join(', ') + ') VALUES (' + placeholders.join(', ') + ')', values);
    const result = await this.findById(data.id as string);
    if (!result) throw new Error('Match not found after create');
    return result;
  }

  async update(id: string, data: Partial<Match>): Promise<Match | null> {
    const fields = Object.keys(data).map(k => {
      const matchKey = k.replace(/([A-Z])/g, '_1').toLowerCase();
      return '\\\' + matchKey + '\\\ = ?';
    });
    const values = Object.values(data);
    values.push(id);
    
    if (fields.length > 0) {
      await queryDB('UPDATE matches SET ' + fields.join(', ') + ' WHERE id = ?', values);
    }
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await executeCommand('DELETE FROM matches WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

export const matchRepository = new MatchRepository();

export interface Match {
  id: string;
  tournamentId: string | null;
  competitionId: string | null;
  round: number | null;
  matchday: number | null;
  roundName: string | null;
  groupName: string | null;
  teamHomeId: string | null;
  homeTeamId: string | null;
  teamAwayId: string | null;
  awayTeamId: string | null;
  homeTeamName: string | null;
  homeTeamTag: string | null;
  awayTeamName: string | null;
  awayTeamTag: string | null;
  scoreHome: number | null;
  scoreAway: number | null;
  reportedScoreHome: number | null;
  reportedScoreAway: number | null;
  winnerTeamId: string | null;
  proofUrl: string | null;
  reportedByUserId: string | null;
  nextMatchId: string | null;
  nextMatchSlot: string | null;
  scheduledAt: string | null;
  scheduledTime: string | null;
  status: string;
}
\;

fs.appendFileSync('src/lib/repositories.ts', content);

