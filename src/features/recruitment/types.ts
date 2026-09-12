export interface ManagedTeam {
  id: string;
  name: string;
  tag: string;
  gameSlug: string;
  logoUrl?: string | null;
  organizations?: { organization_id: string; organization_name: string }[];
}

export interface OutgoingOffer {
  id: string;
  player_user_id: string;
  player_name: string;
  player_gamertag: string;
  position: string;
  pitch_message: string | null;
  status: 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO';
  created_at: string;
  game_slug: string;
}

export interface AvailablePlayer {
  id: string;
  name: string;
  gamertag: string;
  position: string;
  secondaryPosition?: string | null;
  rating?: number;
  avatarUrl?: string | null;
  foto?: string | null;
  organizationId?: string | null;
}

export type RecruitmentTab = 'SEARCH_PLAYERS' | 'SENT_OFFERS' | 'POST_VACANCY';
