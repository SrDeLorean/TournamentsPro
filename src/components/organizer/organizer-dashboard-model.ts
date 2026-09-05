import { GAME_MODES } from '@/lib/games-data';

export { GAME_MODES };
export type OrganizerGameMode = (typeof GAME_MODES)[string][number];

export interface OrganizationUser {
  id: string;
  name: string;
  gamertag?: string;
  avatar_url?: string;
  foto?: string;
}

export interface OrganizerOrganization {
  id: string;
  name: string;
  tag: string;
  banner_url?: string;
  logo_url?: string;
  country?: string;
  founded_year?: string | number;
  rating?: string | number;
  organizers?: OrganizationUser[];
}

export interface OrganizerTournament {
  id: string;
  name: string;
  game_slug?: string;
  primary_game_slug?: string;
  status?: string;
}

export interface OrganizerMatch {
  id: string;
  matchday?: number;
  home_team_name: string;
  away_team_name: string;
  reported_score_home?: number | null;
  reported_score_away?: number | null;
  proof_url?: string | null;
  match_date?: string;
  score_home?: number | null;
  score_away?: number | null;
  status: string;
}

export interface EnrolledTeam {
  id: string;
  name: string;
  tag: string;
  game_slug?: string;
  captain_name?: string;
  status?: string;
}
