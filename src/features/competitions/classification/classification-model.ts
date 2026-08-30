export interface OrganizationItem {
  id: string | number;
  name: string;
  tag?: string;
  gameSlugs?: string[];
  logoUrl?: string;
}

export interface TournamentItem {
  id: string | number;
  name: string;
  gameSlug?: string;
  organizationName?: string;
  formatType?: string;
  matchMode?: string;
  qualifiersPerGroup?: number;
  logoUrl?: string;
}

export interface TeamStanding {
  name: string;
  tag: string;
  logoUrl?: string | null;
  pj: number;
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
  dif: number;
  pts: number;
  circuitName: string;
  competitionName: string;
  groupName: string;
  previousPosition?: number;
  positionChange?: number;
}

export interface ClassificationMatch {
  id: string | number;
  home_team_name: string;
  home_team_tag: string;
  away_team_name: string;
  away_team_tag: string;
  home_team_logo_url?: string | null;
  away_team_logo_url?: string | null;
  score_home: number | null;
  score_away: number | null;
  status: string;
  round_name: string;
  tournament_name?: string;
  tournament_id?: string | number;
  competition_id?: string | number;
  organization_name?: string;
  group_name?: string;
  matchday?: number;
}

export interface TournamentApiItem {
  id: string | number;
  name: string;
  organization_name?: string;
  format_type?: string;
  format?: string;
  match_mode?: string;
  qualifiers_per_group?: number;
  logo_url?: string;
  logoUrl?: string;
  banner_url?: string;
  bannerUrl?: string;
}

export interface OrganizationApiItem {
  id: string | number;
  name: string;
  tag?: string;
  logo_url?: string | null;
  logoUrl?: string | null;
}

const PLAYOFF_ROUNDS = ['octavos', 'cuartos', 'semifinal', 'tercer', 'final', 'dieciseisavos'];
const FINALIZED_STATUSES = new Set(['FINALIZADO', 'TERMINADO']);

export function isFinalizedMatchStatus(status?: string | null): boolean {
  return FINALIZED_STATUSES.has((status || '').toUpperCase());
}

function emptyStanding(
  name: string,
  tag: string,
  circuitName: string,
  competitionName: string,
  groupName: string,
  logoUrl?: string | null,
): TeamStanding {
  return { name, tag, logoUrl, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dif: 0, pts: 0, circuitName, competitionName, groupName };
}

function standingScope(item: Pick<TeamStanding, 'circuitName' | 'competitionName' | 'groupName'>): string {
  return `${item.circuitName}::${item.competitionName}::${item.groupName}`.toLowerCase();
}

function matchScope(match: ClassificationMatch): string {
  return `${match.organization_name || 'Organización Oficial BD'}::${match.tournament_name || 'Competencia BD'}::${match.group_name || 'GENERAL'}`.toLowerCase();
}

function calculateBaseStandings(matches: readonly ClassificationMatch[]): TeamStanding[] {
  const standings = new Map<string, TeamStanding>();

  for (const match of matches) {
    const roundName = (match.round_name || '').toLowerCase();
    if (PLAYOFF_ROUNDS.some((round) => roundName.includes(round))) continue;

    const homeName = match.home_team_name || 'Equipo Local';
    const awayName = match.away_team_name || 'Equipo Visitante';
    const competitionName = match.tournament_name || 'Competencia BD';
    const circuitName = match.organization_name || 'Organización Oficial BD';
    const groupName = match.group_name || 'GENERAL';
    const homeKey = `${circuitName}_${competitionName}_${groupName}_${homeName}`;
    const awayKey = `${circuitName}_${competitionName}_${groupName}_${awayName}`;

    if (!standings.has(homeKey)) standings.set(homeKey, emptyStanding(homeName, match.home_team_tag || 'LOC', circuitName, competitionName, groupName, match.home_team_logo_url));
    if (!standings.has(awayKey)) standings.set(awayKey, emptyStanding(awayName, match.away_team_tag || 'VIS', circuitName, competitionName, groupName, match.away_team_logo_url));

    const homeStanding = standings.get(homeKey)!;
    const awayStanding = standings.get(awayKey)!;
    if (!homeStanding.logoUrl && match.home_team_logo_url) homeStanding.logoUrl = match.home_team_logo_url;
    if (!awayStanding.logoUrl && match.away_team_logo_url) awayStanding.logoUrl = match.away_team_logo_url;

    const homeScore = match.score_home == null ? null : Number(match.score_home);
    const awayScore = match.score_away == null ? null : Number(match.score_away);
    if (!isFinalizedMatchStatus(match.status) || homeScore === null || awayScore === null) continue;

    const home = homeStanding;
    const away = awayStanding;
    home.pj += 1;
    home.gf += homeScore;
    home.gc += awayScore;
    home.dif = home.gf - home.gc;
    away.pj += 1;
    away.gf += awayScore;
    away.gc += homeScore;
    away.dif = away.gf - away.gc;

    if (homeScore > awayScore) {
      home.g += 1;
      home.pts += 3;
      away.p += 1;
    } else if (homeScore < awayScore) {
      away.g += 1;
      away.pts += 3;
      home.p += 1;
    } else {
      home.e += 1;
      away.e += 1;
      home.pts += 1;
      away.pts += 1;
    }
  }

  return [...standings.values()].sort((left, right) =>
    right.pts - left.pts || right.dif - left.dif || right.gf - left.gf,
  );
}

export function calculateStandings(matches: readonly ClassificationMatch[]): TeamStanding[] {
  const current = calculateBaseStandings(matches);
  const scopes = new Map<string, TeamStanding[]>();
  current.forEach((team) => scopes.set(standingScope(team), [...(scopes.get(standingScope(team)) || []), team]));

  scopes.forEach((teams, scope) => {
    const scopedMatches = matches.filter((match) => matchScope(match) === scope);
    const completedMatchdays = scopedMatches
      .filter((match) => isFinalizedMatchStatus(match.status) && Number.isFinite(Number(match.matchday)))
      .map((match) => Number(match.matchday));
    const currentMatchday = completedMatchdays.length ? Math.max(...completedMatchdays) : 0;
    if (currentMatchday <= 1) return;

    const previous = calculateBaseStandings(
      scopedMatches.filter((match) => !isFinalizedMatchStatus(match.status) || Number(match.matchday || 0) < currentMatchday),
    );
    const previousPositions = new Map(previous.map((team, index) => [team.name.toLowerCase(), index + 1]));

    teams.forEach((team, index) => {
      const previousPosition = previousPositions.get(team.name.toLowerCase());
      if (!previousPosition) return;
      team.previousPosition = previousPosition;
      team.positionChange = previousPosition - (index + 1);
    });
  });

  return current;
}
