// =============================================================================
// TournamentsPro — Matches & Match Reports Service
// =============================================================================

import { randomUUID } from 'crypto';
import { executeCas } from '@/lib/db';
import { dbProvider } from '@/lib/db/provider';

export interface SubmitMatchReportResult {
  success: boolean;
  reportId?: string;
  error?: string;
  code?: string;
}

export async function submitMatchReportService(data: {
  matchId: string;
  reportedByUserId: string;
  scoreHome: number;
  scoreAway: number;
  proofUrl?: string | null;
  playerStats?: Array<{
    userId: string;
    teamId: string;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    rating: number;
    isMvp: boolean;
  }>;
}): Promise<SubmitMatchReportResult> {
  const { matchId, reportedByUserId, scoreHome, scoreAway, proofUrl, playerStats } = data;

  const reportId = `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  return dbProvider.withTransaction(async (transaction) => {
    const matches = await transaction.query<{ id: string; status: string }>(
      'SELECT id, status FROM matches WHERE id = ? FOR UPDATE',
      [matchId],
    );
    if (matches.length === 0) return { success: false, error: 'Partido no encontrado', code: 'NOT_FOUND' };

    await transaction.execute(
      `INSERT INTO match_reports (id, match_id, reported_by_user_id, score_home, score_away, proof_url, status)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDIENTE')
       ON DUPLICATE KEY UPDATE reported_by_user_id = VALUES(reported_by_user_id), score_home = VALUES(score_home),
         score_away = VALUES(score_away), proof_url = VALUES(proof_url), status = 'PENDIENTE'`,
      [reportId, matchId, reportedByUserId, scoreHome, scoreAway, proofUrl || null],
    );
    await executeCas(transaction,
      `UPDATE matches
          SET reported_score_home = ?, reported_score_away = ?, proof_url = ?, reported_by_user_id = ?, status = 'POR_REVISAR'
        WHERE id = ? AND status IN ('PENDIENTE', 'EN_CURSO', 'DISPUTADO')`,
      [scoreHome, scoreAway, proofUrl || null, reportedByUserId, matchId],
      'El partido ya fue reportado o finalizado.',
    );

    for (const stat of playerStats || []) {
      await transaction.execute(
        `INSERT INTO match_player_stats
           (id, match_id, team_id, user_id, goals, assists, yellow_cards, red_cards, rating, is_mvp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE goals = VALUES(goals), assists = VALUES(assists), yellow_cards = VALUES(yellow_cards),
           red_cards = VALUES(red_cards), rating = VALUES(rating), is_mvp = VALUES(is_mvp)`,
        [
          randomUUID(), matchId, stat.teamId, stat.userId,
          stat.goals || 0, stat.assists || 0, stat.yellowCards || 0, stat.redCards || 0,
          stat.rating || 6.0, stat.isMvp ? 1 : 0,
        ],
      );
    }
    return { success: true, reportId };
  });
}
