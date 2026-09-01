// =============================================================================
// TournamentsPro — API Types & Helpers
// =============================================================================

import { NextResponse } from 'next/server';
import { z } from 'zod';

export interface UserRow {
  id: string;
  email: string;
  password_hash: string | null;
  google_id: string | null;
  name: string;
  gamertag: string;
  role: string;
  primary_game_slug: string;
  platform: string;
  position: string;
  secondary_position: string | null;
  country?: string | null;
  birth_date?: string | null;
  phone?: string | null;
  bio?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  twitch?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  discord?: string | null;
  twitter?: string | null;
  website?: string | null;
  whatsapp?: string | null;
  game_profiles?: string | null;
  rank_badge: string | null;
  rating: number;
  status: string;
  avatar_url: string | null;
  banner_url: string | null;
  last_login_at?: string | null;
  organization_id: string | null;
  is_banned: number;
  ban_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamRow {
  id: string;
  name: string;
  tag: string;
  game_slug: string;
  organization_id: string | null;
  captain_id: string;
  captain_name: string;
  platform: string;
  members_count: number;
  max_members: number;
  color: string;
  logo_text: string;
  description: string | null;
  vacant_positions: string | null;
  logo_url: string | null;
  banner_url: string | null;
  status: string;
  club_id_ea: string | null;
  is_banned: number;
  ban_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompetitionRow {
  id: string;
  name: string;
  game_slug: string;
  organizer_id: string;
  organizer_name: string;
  organization_id: string | null;
  season_id: string | null;
  prize_pool: string | null;
  transfer_market_mode: string;
  mode_format: string;
  status: string;
  fecha_limite_inscripcion: string | null;
  fecha_inicio: string;
  fecha_termino: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeasonRow {
  id: string;
  name: string;
  organization_id: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
}

export interface MatchRow {
  id: string;
  tournament_id: string;
  competition_id: string;
  matchday_number: number;
  matchday: number;
  stage: string;
  group_name: string | null;
  round_name: string | null;
  next_match_id: string | null;
  next_match_slot: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  team_home_id: string | null;
  team_away_id: string | null;
  home_team_name: string;
  away_team_name: string;
  score_home: number | null;
  score_away: number | null;
  reported_score_home: number | null;
  reported_score_away: number | null;
  winner_team_id: string | null;
  status: string;
  scheduled_time: string | null;
  scheduled_at: string | null;
  proof_url: string | null;
  reported_by_user_id: string | null;
  match_report_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationRow {
  id: string;
  name: string;
  tag: string;
  owner_id: string;
  logo_url: string | null;
  banner_url: string | null;
  description: string | null;
  country: string;
  allowed_games: string | null;
  created_at: string;
  updated_at: string;
}

// User profile for client
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  gamertag: string;
  role: string;
  primaryGame: string;
  platform: string;
  position: string;
  secondaryPosition: string | null;
  rankBadge: string | null;
  rating: number;
  status: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  country: string | null;
  bio: string | null;
  socialMedia: {
    whatsapp?: string;
    instagram?: string;
    twitch?: string;
    youtube?: string;
    tiktok?: string;
    discord?: string;
    twitter?: string;
    website?: string;
  };
  organizationId: string | null;
  isBanned: boolean;
  banReason: string | null;
}

export interface TeamData {
  id: string;
  name: string;
  tag: string;
  gameSlug: string;
  organizationId: string | null;
  captainId: string;
  captainName: string;
  platform: string;
  membersCount: number;
  maxMembers: number;
  color: string;
  logoText: string;
  description: string | null;
  vacantPositions: string[];
  logoUrl: string | null;
  bannerUrl: string | null;
  status: string;
  clubIdEa: string | null;
  isBanned: boolean;
  banReason: string | null;
}

export interface CompetitionData {
  id: string;
  name: string;
  gameSlug: string;
  organizerId: string | null;
  organizerName: string | null;
  organizationId: string | null;
  seasonId: string | null;
  prizePool: string | null;
  transferMarketMode: string;
  modeFormat: string;
  matchMode?: string;
  status: string;
  fechaLimiteInscripcion: string | null;
  fechaInicio: string;
  fechaTermino: string | null;
  description: string | null;
  createdAt: string;
}

export interface SeasonData {
  id: string;
  name: string;
  organizationId: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  createdAt: string;
}

export interface OrganizationData {
  id: string;
  name: string;
  tag: string;
  ownerId: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  country: string;
  allowedGames: string[];
  createdAt: string;
}

export interface MatchData {
  id: string;
  tournamentId: string;
  competitionId: string;
  matchdayNumber: number;
  matchday: number;
  stage: string;
  groupName: string | null;
  roundName: string | null;
  nextMatchId: string | null;
  nextMatchSlot: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  teamHomeId: string | null;
  teamAwayId: string | null;
  homeTeamName: string;
  awayTeamName: string;
  scoreHome: number | null;
  scoreAway: number | null;
  reportedScoreHome: number | null;
  reportedScoreAway: number | null;
  winnerTeamId: string | null;
  status: string;
  scheduledTime: string | null;
  scheduledAt: string | null;
  proofUrl: string | null;
  reportedByUserId: string | null;
  matchReportId: string | null;
}

// API Response Helpers
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: z.ZodIssue[];
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function apiSuccess<T>(data: T, message?: string, meta?: PaginationMeta): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data, message, meta }, { status: 200 });
}

export function apiCreated<T>(data: T, message?: string): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data, message }, { status: 201 });
}

export function apiError(error: string, status = 400, code?: string, details?: z.ZodIssue[]): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ success: false, error, code, details }, { status });
}

export function apiNotFound(resource = 'Recurso'): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ success: false, error: `${resource} no encontrado` }, { status: 404 });
}

export function apiUnauthorized(message = 'No autenticado'): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ success: false, error: message, code: 'UNAUTHORIZED' }, { status: 401 });
}

export function apiForbidden(message = 'No autorizado'): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ success: false, error: message, code: 'FORBIDDEN' }, { status: 403 });
}

export function apiServerError(error: unknown, message = 'Error interno del servidor'): NextResponse<ApiErrorResponse> {
  console.error('Server error:', error);
  return NextResponse.json(
    { success: false, error: message, code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}

export function parsePaginationParams(searchParams: URLSearchParams): { page: number; limit: number } {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  return { page, limit };
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function mapUserRowToProfile(row: any): UserProfile {
  const avatar = row.avatar_url || row.avatarUrl || row.foto || null;
  const banner = row.banner_url || row.bannerUrl || null;
  const game = row.primary_game_slug || row.primaryGameSlug || row.primaryGame || 'eafc26';
  const pos = row.position || 'DFC';
  const secPos = row.secondary_position || row.secondaryPosition || null;
  const badge = row.rank_badge || row.rankBadge || 'Competitivo';
  const orgId = row.organization_id || row.organizationId || null;

  return {
    id: row.id,
    email: row.email || '',
    name: row.name || row.gamertag || 'Atleta Pro',
    gamertag: row.gamertag || row.name || 'Gamertag',
    role: row.role || 'Jugador',
    primaryGame: game,
    platform: row.platform || 'CROSSPLAY',
    position: pos,
    secondaryPosition: secPos,
    rankBadge: badge,
    rating: typeof row.rating === 'number' ? row.rating : parseFloat(row.rating || '9.0') || 9.0,
    status: row.status || 'Activo',
    avatarUrl: avatar,
    bannerUrl: banner,
    country: row.country || row.pais || 'Chile',
    bio: row.bio || row.biografia || null,
    socialMedia: {
      whatsapp: row.whatsapp || undefined,
      instagram: row.instagram || undefined,
      twitch: row.twitch || undefined,
      youtube: row.youtube || undefined,
      tiktok: row.tiktok || undefined,
      discord: row.discord || undefined,
      twitter: row.twitter || undefined,
      website: row.website || undefined,
    },
    organizationId: orgId,
    isBanned: Boolean(row.is_banned ?? row.isBanned),
    banReason: row.ban_reason || row.banReason || null,
  };
}

export function mapTeamRowToData(row: any): TeamData {
  let vacant: string[] = [];
  if (Array.isArray(row.vacant_positions || row.vacantPositions)) {
    vacant = row.vacant_positions || row.vacantPositions;
  } else if (typeof (row.vacant_positions || row.vacantPositions) === 'string') {
    try {
      vacant = JSON.parse(row.vacant_positions || row.vacantPositions);
    } catch {
      vacant = [];
    }
  }

  return {
    id: row.id,
    name: row.name,
    tag: row.tag || 'TP',
    gameSlug: row.game_slug || row.gameSlug || 'eafc26',
    organizationId: row.organization_id || row.organizationId || null,
    captainId: row.captain_id || row.captainId || 'usr-srdelorean',
    captainName: row.captain_name || row.captainName || 'Capitán',
    platform: row.platform || 'CROSSPLAY',
    membersCount: typeof (row.members_count ?? row.membersCount) === 'number' ? (row.members_count ?? row.membersCount) : 20,
    maxMembers: typeof (row.max_members ?? row.maxMembers) === 'number' ? (row.max_members ?? row.maxMembers) : 45,
    color: row.color || '#00F0FF',
    logoText: row.logo_text || row.logoText || row.tag || 'TP',
    description: row.description || null,
    vacantPositions: vacant,
    logoUrl: row.logo_url || row.logoUrl || null,
    bannerUrl: row.banner_url || row.bannerUrl || null,
    status: row.status || 'ACTIVO',
    clubIdEa: row.club_id_ea || row.clubIdEa || null,
    isBanned: Boolean(row.is_banned ?? row.isBanned),
    banReason: row.ban_reason || row.banReason || null,
  };
}

export function mapCompetitionRowToData(row: CompetitionRow): CompetitionData {
  return {
    id: row.id,
    name: row.name,
    gameSlug: row.game_slug,
    organizerId: row.organizer_id,
    organizerName: row.organizer_name,
    organizationId: row.organization_id,
    seasonId: row.season_id,
    prizePool: row.prize_pool,
    transferMarketMode: row.transfer_market_mode,
    modeFormat: row.mode_format,
    status: row.status,
    fechaLimiteInscripcion: row.fecha_limite_inscripcion,
    fechaInicio: row.fecha_inicio,
    fechaTermino: row.fecha_termino,
    description: row.description,
    createdAt: row.created_at,
  };
}

export function mapSeasonRowToData(row: SeasonRow): SeasonData {
  return {
    id: row.id,
    name: row.name,
    organizationId: row.organization_id,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function mapOrganizationRowToData(row: OrganizationRow): OrganizationData {
  return {
    id: row.id,
    name: row.name,
    tag: row.tag,
    ownerId: row.owner_id,
    logoUrl: row.logo_url,
    bannerUrl: row.banner_url,
    description: row.description,
    country: row.country,
    allowedGames: row.allowed_games ? JSON.parse(row.allowed_games) : [],
    createdAt: row.created_at,
  };
}

export function mapMatchRowToData(row: MatchRow): MatchData {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    competitionId: row.competition_id,
    matchdayNumber: row.matchday_number,
    matchday: row.matchday,
    stage: row.stage,
    groupName: row.group_name,
    roundName: row.round_name,
    nextMatchId: row.next_match_id,
    nextMatchSlot: row.next_match_slot,
    homeTeamId: row.home_team_id,
    awayTeamId: row.away_team_id,
    teamHomeId: row.team_home_id,
    teamAwayId: row.team_away_id,
    homeTeamName: row.home_team_name,
    awayTeamName: row.away_team_name,
    scoreHome: row.score_home,
    scoreAway: row.score_away,
    reportedScoreHome: row.reported_score_home,
    reportedScoreAway: row.reported_score_away,
    winnerTeamId: row.winner_team_id,
    status: row.status,
    scheduledTime: row.scheduled_time,
    scheduledAt: row.scheduled_at,
    proofUrl: row.proof_url,
    reportedByUserId: row.reported_by_user_id,
    matchReportId: row.match_report_id,
  };
}

// Validation helpers
export function validateRequired<T extends Record<string, unknown>>(data: T, fields: (keyof T)[]): string | null {
  for (const field of fields) {
    const value = data[field];
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      return `Campo requerido: ${String(field)}`;
    }
  }
  return null;
}

export function sanitizeString(input: string, maxLength: number): string {
  return input.trim().slice(0, maxLength);
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, "'");
}
