export interface FixtureMatchItem {
  id: string;
  homeTeam: string;
  homeTag: string;
  homeLogoUrl?: string;
  awayTeam: string;
  awayTag: string;
  awayLogoUrl?: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'FINALIZADO' | 'EN_VIVO' | 'PROGRAMADO' | 'PENDIENTE';
  transmissionTime: string;
  exactDateDisplay: string;
  matchDate: string;
  dayLabel: string;
  dayNumber: number;
  circuitName: string;
  competitionName: string;
  groupJornada: string;
}

export interface OrganizationOption {
  id: string;
  name: string;
  tag: string;
  logoUrl?: string;
}

export interface TournamentOption {
  id: string;
  name: string;
  gameSlug: string;
  organizationName?: string;
  logoUrl?: string;
}

export interface OrganizationApiItem {
  id?: string;
  name: string;
  tag?: string;
  logo_url?: string | null;
  logoUrl?: string | null;
}

export interface TournamentApiItem {
  id?: string;
  name: string;
  game_slug?: string;
  organization_name?: string;
  logo_url?: string;
  logoUrl?: string;
  banner_url?: string;
  bannerUrl?: string;
}

export interface FixtureApiMatch {
  id?: string;
  match_date?: string;
  scheduled_at?: string;
  scheduled_time?: string;
  transmission_time?: string;
  time?: string;
  home_team_name?: string;
  home_team_tag?: string;
  home_team_logo?: string;
  home_team_logo_url?: string;
  home_logo_url?: string;
  homeLogoUrl?: string;
  home_logo?: string;
  homeLogo?: string;
  away_team_name?: string;
  away_team_tag?: string;
  away_team_logo?: string;
  away_team_logo_url?: string;
  away_logo_url?: string;
  awayLogoUrl?: string;
  away_logo?: string;
  awayLogo?: string;
  score_home?: number | string | null;
  score_away?: number | string | null;
  status?: string;
  organization_name?: string;
  tournament_name?: string;
  round_name?: string;
  matchday?: number;
  matchday_number?: number;
}

export function upperTag(value?: string) {
  return value ? value.substring(0, 3).toUpperCase() : 'TPG';
}

export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
