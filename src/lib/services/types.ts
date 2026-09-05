// =============================================================================
// TournamentsPro — Common Service Layer Types & DTOs
// =============================================================================

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function isManagerEntry(value: unknown): value is { id: string } {
  return typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'string';
}

export interface AvailablePlayerRow {
  id: string;
  name: string;
  gamertag: string;
  email: string;
  position: string;
  primary_game_slug: string;
  organization_id: string | null;
  organization_name?: string | null;
  current_team_id?: string | null;
  current_team_name?: string | null;
  avatar_url: string | null;
  foto: string | null;
  role?: string;
  status?: string;
}

export interface ContractCandidateDatabaseRow extends AvailablePlayerRow {
  current_team_id: string | null;
  current_team_name: string | null;
  current_team_tag: string | null;
}

export interface ContractCandidate {
  id: string;
  name: string;
  gamertag: string;
  email?: string;
  position: string;
  primary_game_slug?: string;
  organization_id?: string;
  avatar_url?: string;
  foto?: string;
  current_team_id?: string;
  current_team_name?: string;
  current_team_tag?: string;
}

export interface SquadRow {
  id: string;
  team_id: string;
  user_id: string;
  organization_name: string | null;
  tactical_position: string;
  role_in_team: 'Capitan' | 'Capitán' | 'Encargado' | 'Jugador' | 'DT / Analyst';
  jersey_number: number | null;
  joined_at: string;
  user_name: string;
  gamertag: string;
  email?: string;
  avatar_url?: string | null;
  foto?: string | null;
}

export interface SquadWithOrganizations extends SquadRow {
  member_org_names: string[];
  organization_ids?: string;
  organization_names?: string;
}

export interface TransferApplicationRow {
  id: string;
  team_id: string;
  applicant_user_id: string;
  game_slug: string;
  position: string;
  pitch_message: string | null;
  application_type: string;
  status: string;
  is_extraordinary: number;
  organizer_approval_status: string;
}

export interface TransferHistoryRow {
  id: string;
  game_slug: string;
  player_user_id?: string;
  player_name?: string;
  player_gamertag?: string;
  from_team_name: string | null;
  to_team_name: string;
  signed_at: string;
  transfer_type: string;
}

export interface TransferPostRow {
  id: string;
  game_slug: string;
  type: string;
  user_id: string;
  user_name: string;
  user_gamertag: string;
  team_id: string | null;
  team_name: string | null;
  position: string;
  platform: string;
  status: string;
  message: string;
  expires_at: string;
  created_at: string;
}

export interface GameConfigurationRow {
  slug: string;
  name: string;
  max_squad_cap: number;
  max_transfers_per_window: number;
  post_expiration_days: number;
  positions_json: string | string[] | null;
  brand_color: string | null;
}

export interface ContractOfferRow {
  id: string;
  game_slug: string;
  team_id: string;
  team_name: string;
  team_tag: string;
  player_user_id?: string;
  offered_by_user_id?: string;
  position: string;
  pitch_message: string | null;
  offer_type?: string;
  status: string;
  created_at: string;
}

export interface ChatThreadDTO {
  id: string;
  channelType: 'DIRECTO' | 'SQUAD_EQUIPO' | 'SOPORTE_ORGANIZADOR' | 'ANUNCIO_ADMIN' | 'DIRECT' | 'COMMUNITY' | 'TEAM' | 'MATCH' | 'GENERAL';
  gameSlug: string;
  title: string;
  participantId: string;
  participantName: string;
  participantRole: string;
  lastMessageText: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ChatMessageDTO {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
}

export interface ChatThreadRow {
  id: string;
  channel_type: ChatThreadDTO['channelType'];
  game_slug: string;
  title: string | null;
  participant_a_id: string;
  participant_a_name: string;
  participant_a_role: string;
  participant_b_id: string;
  participant_b_name: string | null;
  participant_b_role: string | null;
  last_message_text: string | null;
  last_message_at: string;
  unread_count: number;
}

export interface ChatMessageRow {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  message_text: string;
  created_at: string;
}

export interface UserRoleRow {
  id: string;
  name: string;
  gamertag: string;
  role: string;
  primary_game_slug: string;
  is_banned: number;
  ban_reason: string | null;
}

export interface ChatReportDTO {
  id: string;
  reporterUserId: string;
  reporterName: string;
  reporterRole: string;
  reportedUserId: string;
  reportedUserName: string;
  threadId: string;
  messageId: string;
  messageText: string;
  reason: string;
  details: string | null;
  status: 'Pendiente' | 'Sancionado' | 'Descartado';
  moderatorNotes: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface UserChatHistoryMessageItem {
  id: string;
  threadId: string;
  channelType?: string;
  gameSlug?: string;
  threadTitle?: string;
  messageText: string;
  createdAt: string;
  timestamp: string;
  isRead: boolean;
}

export interface UserChatHistoryDTO {
  user: {
    id: string;
    name: string;
    gamertag?: string | null;
    email?: string | null;
    role: string;
    isBanned: boolean;
    banReason?: string | null;
    status?: string | null;
  };
  messages: UserChatHistoryMessageItem[];
  totalMessages: number;
}
