// =============================================================================
// TournamentsPro — Best of 3 (Bo3) Series Logic
// =============================================================================

export interface Bo3GameInfo {
  isBo3: boolean;
  gameNumber: 1 | 2 | 3 | null;
  baseSeriesId: string;
}

export interface Bo3MatchLike {
  id: string | number;
  home_team_id?: string | null;
  away_team_id?: string | null;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  team_home_id?: string | null;
  team_away_id?: string | null;
  teamHomeId?: string | null;
  teamAwayId?: string | null;
  home_team_name?: string | null;
  away_team_name?: string | null;
  homeTeamName?: string | null;
  awayTeamName?: string | null;
  homeTeam?: string | null;
  awayTeam?: string | null;
  score_home?: number | null;
  score_away?: number | null;
  scoreHome?: number | null;
  scoreAway?: number | null;
  homeScore?: number | null;
  awayScore?: number | null;
  reported_score_home?: number | null;
  reported_score_away?: number | null;
  reportedScoreHome?: number | null;
  reportedScoreAway?: number | null;
  status: string;
  round_name?: string | null;
  roundName?: string | null;
  groupJornada?: string | null;
  winner_team_id?: string | null;
  winnerTeamId?: string | null;
}

export interface Bo3SeriesEvaluation<T extends Bo3MatchLike = Bo3MatchLike> {
  isBo3: boolean;
  isDefined: boolean;
  winnerTeamId: string | null;
  winnerTeamName: string | null;
  teamAWins: number;
  teamBWins: number;
  teamAId: string | null;
  teamBId: string | null;
  teamAName: string | null;
  teamBName: string | null;
  isGame3Locked: boolean;
  scoreSummary: string;
  statusText: string;
  game1?: T;
  game2?: T;
  game3?: T;
}

/**
 * Detects whether a match or mode corresponds to a Best of 3 series.
 */
export function isBo3Match(match: {
  id?: string | number | null;
  round_name?: string | null;
  roundName?: string | null;
  match_mode?: string | null;
  matchMode?: string | null;
}): boolean {
  const mode = (match.match_mode || match.matchMode || '').toLowerCase();
  if (mode === 'mejorde3' || mode === 'bo3') return true;

  const round = (match.round_name || match.roundName || '').toLowerCase();
  if (/juego\s*[123]/i.test(round)) return true;

  const id = String(match.id || '').toLowerCase();
  if (/-j[123]$/i.test(id)) return true;

  return false;
}

/**
 * Parses game number (1, 2, or 3) and base series ID from a match.
 */
export function parseBo3GameInfo(match: {
  id?: string | number | null;
  round_name?: string | null;
  roundName?: string | null;
  groupJornada?: string | null;
}): Bo3GameInfo {
  const idStr = String(match.id || '');
  const round = (match.round_name || match.roundName || match.groupJornada || '');

  let gameNumber: 1 | 2 | 3 | null = null;
  const idMatch = idStr.match(/-j([123])$/i);
  if (idMatch) {
    gameNumber = Number(idMatch[1]) as 1 | 2 | 3;
  } else {
    const roundMatch = round.match(/juego\s*([123])/i);
    if (roundMatch) {
      gameNumber = Number(roundMatch[1]) as 1 | 2 | 3;
    }
  }

  const isBo3 = gameNumber !== null || isBo3Match(match);
  const baseSeriesId = idStr.replace(/-j[123]$/i, '');

  return { isBo3, gameNumber, baseSeriesId };
}

/**
 * Checks if a match status is considered finalized.
 */
function isCompletedStatus(status: string): boolean {
  const s = (status || '').toUpperCase().trim();
  return s === 'TERMINADO' || s === 'FINALIZADO';
}

/**
 * Evaluates the state of a Best of 3 series given the list of matches belonging to that series.
 */
export function evaluateBo3Series<T extends Bo3MatchLike>(matches: T[]): Bo3SeriesEvaluation<T> {
  if (!matches || matches.length === 0) {
    return {
      isBo3: false,
      isDefined: false,
      winnerTeamId: null,
      winnerTeamName: null,
      teamAWins: 0,
      teamBWins: 0,
      teamAId: null,
      teamBId: null,
      teamAName: null,
      teamBName: null,
      isGame3Locked: false,
      scoreSummary: '0 - 0',
      statusText: 'Sin partidos en la serie',
    };
  }

  const hasBo3Indicator = matches.some((m) => isBo3Match(m));

  let game1: T | undefined;
  let game2: T | undefined;
  let game3: T | undefined;

  for (const m of matches) {
    const info = parseBo3GameInfo(m);
    if (info.gameNumber === 1) game1 = m;
    else if (info.gameNumber === 2) game2 = m;
    else if (info.gameNumber === 3) game3 = m;
  }

  // Fallback ordering if no explicit -j1/-j2/-j3
  if (!game1 && matches[0]) game1 = matches[0];
  if (!game2 && matches[1]) game2 = matches[1];
  if (!game3 && matches[2]) game3 = matches[2];

  // Determine Team A and Team B from Game 1 (or first available match)
  const anchor = game1 || matches[0];
  const teamAId = anchor.home_team_id || anchor.team_home_id || anchor.homeTeamId || anchor.teamHomeId || anchor.homeTeam || null;
  const teamBId = anchor.away_team_id || anchor.team_away_id || anchor.awayTeamId || anchor.teamAwayId || anchor.awayTeam || null;
  const teamAName = anchor.home_team_name || anchor.homeTeamName || anchor.homeTeam || 'Equipo Local';
  const teamBName = anchor.away_team_name || anchor.awayTeamName || anchor.awayTeam || 'Equipo Visitante';

  let teamAWins = 0;
  let teamBWins = 0;

  const orderedGames = [game1, game2, game3].filter(Boolean) as T[];

  for (const g of orderedGames) {
    if (!isCompletedStatus(g.status)) continue;

    const hScore = g.scoreHome ?? g.score_home ?? g.homeScore ?? g.reportedScoreHome ?? g.reported_score_home;
    const aScore = g.scoreAway ?? g.score_away ?? g.awayScore ?? g.reportedScoreAway ?? g.reported_score_away;
    if (hScore === null || aScore === null || hScore === undefined || aScore === undefined) continue;

    const gHomeId = g.home_team_id || g.team_home_id || g.homeTeamId || g.teamHomeId || g.home_team_name || g.homeTeamName || g.homeTeam;
    const gAwayId = g.away_team_id || g.team_away_id || g.awayTeamId || g.teamAwayId || g.away_team_name || g.awayTeamName || g.awayTeam;

    if (hScore > aScore) {
      if (gHomeId === teamAId || gHomeId === teamAName) teamAWins++;
      else if (gHomeId === teamBId || gHomeId === teamBName) teamBWins++;
      else teamAWins++;
    } else if (aScore > hScore) {
      if (gAwayId === teamAId || gAwayId === teamAName) teamAWins++;
      else if (gAwayId === teamBId || gAwayId === teamBName) teamBWins++;
      else teamBWins++;
    }
  }

  const isDefined = teamAWins >= 2 || teamBWins >= 2;
  // Game 3 is locked if either team reached 2 wins while the other has 0 wins (i.e. 2-0 sweep)
  const isGame3Locked = (teamAWins >= 2 || teamBWins >= 2) && (teamAWins === 2 && teamBWins === 0 || teamBWins === 2 && teamAWins === 0);

  let winnerTeamId: string | null = null;
  let winnerTeamName: string | null = null;
  if (teamAWins >= 2) {
    winnerTeamId = teamAId;
    winnerTeamName = teamAName;
  } else if (teamBWins >= 2) {
    winnerTeamId = teamBId;
    winnerTeamName = teamBName;
  }

  const scoreSummary = `${teamAWins} - ${teamBWins}`;
  let statusText = 'Serie en disputa';

  if (isDefined) {
    statusText = `Serie definida (${scoreSummary}) • Ganador: ${winnerTeamName}`;
  } else if (teamAWins === 1 && teamBWins === 1) {
    statusText = `Serie empatada (1 - 1) • Desempate requerido en Juego 3`;
  } else if (teamAWins === 1 || teamBWins === 1) {
    statusText = `Serie en disputa (${scoreSummary})`;
  } else {
    statusText = `Serie al Mejor de 3 (${scoreSummary})`;
  }

  return {
    isBo3: hasBo3Indicator,
    isDefined,
    winnerTeamId,
    winnerTeamName,
    teamAWins,
    teamBWins,
    teamAId,
    teamBId,
    teamAName,
    teamBName,
    isGame3Locked,
    scoreSummary,
    statusText,
    game1,
    game2,
    game3,
  };
}
