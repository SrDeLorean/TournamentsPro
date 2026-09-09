export interface ExtractedPlayer {
  gamertag: string;
  name?: string;
  position?: string;
  rating?: number;
  avatarUrl?: string;
  rankTitle?: string;
  stats?: Record<string, string | number>;
}

export interface ExtractedTeam {
  teamName: string;
  tag: string;
  gameSlug: string;
  logoUrl?: string;
  bannerUrl?: string;
  platform?: 'PS5' | 'PS4' | 'XBOX' | 'PC' | 'CROSSPLAY';
  description?: string;
  division?: string;
  rank?: string;
  record?: {
    wins: number;
    losses: number;
    draws?: number;
  };
  roster: ExtractedPlayer[];
  externalId?: string;
  sourceApi: string;
}

export interface GameApiSearchResult {
  success: boolean;
  teams: ExtractedTeam[];
  players?: ExtractedPlayer[];
  message?: string;
  sourceApi: string;
  query: string;
}
