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
  reportMode?: 'SIMPLE' | 'MEDIANA' | 'API';
  isAdminOrOrg?: boolean;
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
  const { matchId, reportedByUserId, scoreHome, scoreAway, proofUrl, reportMode, isAdminOrOrg, playerStats } = data;

  const reportId = `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  return dbProvider.withTransaction(async (transaction) => {
    const matches = await transaction.query<{
      id: string;
      status: string;
      competition_id?: string;
      tournament_id?: string;
      round_name?: string;
      reported_score_home?: number | null;
      reported_score_away?: number | null;
      reported_by_user_id?: string | null;
      home_team_id?: string | null;
      team_home_id?: string | null;
      away_team_id?: string | null;
      team_away_id?: string | null;
    }>(
      'SELECT id, status, competition_id, tournament_id, round_name, reported_score_home, reported_score_away, reported_by_user_id, home_team_id, team_home_id, away_team_id, team_away_id FROM matches WHERE id = ? FOR UPDATE',
      [matchId],
    );
    if (matches.length === 0) return { success: false, error: 'Partido no encontrado', code: 'NOT_FOUND' };

    const currentMatch = matches[0];
    const { parseBo3GameInfo, evaluateBo3Series } = await import('@/lib/bo3-series');
    const gameInfo = parseBo3GameInfo(currentMatch as any);

    if (gameInfo.isBo3 && gameInfo.gameNumber === 3) {
      const compId = currentMatch.competition_id || currentMatch.tournament_id;
      if (compId) {
        const compMatches = await transaction.matches.findByCompetition(compId);
        const seriesMatches = compMatches.filter((m) => parseBo3GameInfo(m).baseSeriesId === gameInfo.baseSeriesId);
        const evalResult = evaluateBo3Series(seriesMatches);
        if (evalResult.isGame3Locked || evalResult.isDefined) {
          return {
            success: false,
            error: `La serie al Mejor de 3 ya fue definida (${evalResult.scoreSummary}). El Juego 3 no es requerido y no puede ser reportado.`,
            code: 'BO3_SERIES_ALREADY_DEFINED',
          };
        }
      }
    }

    const hasPreviousRivalReport =
      currentMatch.reported_by_user_id &&
      currentMatch.reported_by_user_id !== reportedByUserId &&
      currentMatch.reported_score_home !== null &&
      currentMatch.reported_score_home !== undefined &&
      currentMatch.reported_score_away !== null &&
      currentMatch.reported_score_away !== undefined;

    const scoresMatch =
      hasPreviousRivalReport &&
      currentMatch.reported_score_home === scoreHome &&
      currentMatch.reported_score_away === scoreAway;

    const isOfficial = Boolean(isAdminOrOrg || reportMode === 'API');
    const shouldFinalize = isOfficial || scoresMatch;

    const winnerTeamId = scoreHome > scoreAway
      ? (currentMatch.home_team_id || currentMatch.team_home_id)
      : scoreAway > scoreHome
        ? (currentMatch.away_team_id || currentMatch.team_away_id)
        : null;

    await transaction.execute(
      `INSERT INTO match_reports (id, match_id, reported_by_user_id, score_home, score_away, proof_url, status)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDIENTE')
       ON DUPLICATE KEY UPDATE reported_by_user_id = VALUES(reported_by_user_id), score_home = VALUES(score_home),
         score_away = VALUES(score_away), proof_url = VALUES(proof_url), status = 'PENDIENTE'`,
      [reportId, matchId, reportedByUserId, scoreHome, scoreAway, proofUrl || null],
    );

    if (shouldFinalize) {
      await executeCas(
        transaction,
        `UPDATE matches
            SET score_home = ?, score_away = ?, reported_score_home = ?, reported_score_away = ?,
                proof_url = ?, reported_by_user_id = ?, winner_team_id = ?, status = 'FINALIZADO'
          WHERE id = ?`,
        [scoreHome, scoreAway, scoreHome, scoreAway, proofUrl || null, reportedByUserId, winnerTeamId, matchId],
        'El partido ya fue reportado o finalizado.',
      );
    } else {
      await executeCas(
        transaction,
        `UPDATE matches
            SET reported_score_home = ?, reported_score_away = ?, proof_url = ?, reported_by_user_id = ?, status = 'POR_REVISAR'
          WHERE id = ? AND status IN ('PENDIENTE', 'EN_CURSO', 'DISPUTADO', 'POR_REVISAR')`,
        [scoreHome, scoreAway, proofUrl || null, reportedByUserId, matchId],
        'El partido ya fue reportado o finalizado.',
      );
    }

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

    if (shouldFinalize) {
      try {
        const { processMatchAutoAdvance } = await import('./match-auto-advance');
        await processMatchAutoAdvance(matchId);
      } catch (advErr) {
        console.warn('Error auto-avanzando partido en submitMatchReportService:', advErr);
      }
    }

    return { success: true, reportId };
  });
}
