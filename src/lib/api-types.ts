// =============================================================================
// TournamentsPro — Standardized API Response Types & Helpers
// =============================================================================

// ── Standard Response Envelope ──────────────────────────────────────────────

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ── Pagination ──────────────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, Number(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')));
  return { page, limit };
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
}

// ── Database Row Types (matching actual MySQL columns) ──────────────────────

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string | null;
  google_id: string | null;
  gamertag: string;
  role: 'Jugador' | 'Capitan' | 'Organizador' | 'Administrador';
  primary_game_slug: string;
  platform: 'PS5' | 'PS4' | 'XBOX' | 'PC' | 'CROSSPLAY';
  position: string;
  secondary_position: string | null;
  rank_badge: string | null;
  rating: number;
  status: string;
  avatar_url: string | null;
  foto: string | null;
  banner_url: string | null;
  nacionalidad: string | null;
  fecha_nacimiento: string | null;
  telefono: string | null;
  biografia: string | null;
  instagram: string | null;
  facebook: string | null;
  twitch: string | null;
  youtube: string | null;
  tiktok: string | null;
  discord: string | null;
  twitter: string | null;
  website: string | null;
  whatsapp: string | null;
  game_profiles: string | null;
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
  game_name: string | null;
  organization_id: string | null;
  captain_id: string;
  captain_name: string;
  platform: 'PS5' | 'PS4' | 'XBOX' | 'PC' | 'CROSSPLAY';
  members_count: number;
  max_members: number;
  color: string;
  logo_text: string;
  logo_url: string | null;
  logo: string | null;
  banner_url: string | null;
  banner: string | null;
  description: string | null;
  status: string | null;
  disputando: string | null;
  palmares: string | null;
  vacant_positions: string | null;
  created_at: string;
  updated_at: string;
}

// ── Client-Side Types (from data-store, but strongly typed) ─────────────────

export type GameSlug = 'eafc26' | 'valorant' | 'csgo' | 'lol' | 'rocketleague';
export type UserRole = 'Jugador' | 'Capitán' | 'Organizador' | 'Administrador';
export type PlatformType = 'PS5' | 'PS4' | 'XBOX' | 'PC' | 'CROSSPLAY';

// ── Row → Client Mappers ────────────────────────────────────────────────────

export function mapUserRowToProfile(u: UserRow) {
  let gameProfiles: Record<string, { gamertag: string; gameId: string; position?: string; secondaryPosition?: string }> = {};
  if (u.game_profiles) {
    try {
      gameProfiles = typeof u.game_profiles === 'string' ? JSON.parse(u.game_profiles) : u.game_profiles;
    } catch {
      gameProfiles = {};
    }
  }

  return {
    id: u.id,
    name: u.name,
    email: u.email,
    gamertag: u.gamertag,
    role: u.role as UserRole,
    organizationId: u.organization_id || undefined,
    primaryGame: (u.primary_game_slug || 'eafc26') as GameSlug,
    platform: (u.platform || 'CROSSPLAY') as PlatformType,
    position: u.position || 'DFC',
    secondaryPosition: u.secondary_position || undefined,
    rankBadge: u.rank_badge || 'División 1',
    rating: String(u.rating || '9.0'),
    status: u.status || 'Buscando Club',
    avatarUrl: u.avatar_url || u.foto || '/images/default/logo-default.png',
    foto: u.foto || u.avatar_url || '/images/default/logo-default.png',
    bannerUrl: u.banner_url || '/images/default/banner-default.jpg',
    nacionalidad: u.nacionalidad || undefined,
    fechaNacimiento: u.fecha_nacimiento ? new Date(u.fecha_nacimiento).toISOString().split('T')[0] : '',
    telefono: u.telefono || undefined,
    biografia: u.biografia || undefined,
    instagram: u.instagram || undefined,
    facebook: u.facebook || undefined,
    twitch: u.twitch || undefined,
    youtube: u.youtube || undefined,
    tiktok: u.tiktok || undefined,
    discord: u.discord || undefined,
    twitter: u.twitter || undefined,
    website: u.website || undefined,
    whatsapp: u.whatsapp || undefined,
    gameProfiles,
  };
}

export function mapTeamRowToData(t: TeamRow) {
  let logoUrl = t.logo_url || t.logo || '';
  let bannerUrl = t.banner_url || t.banner || '';

  // Normalize legacy /api/uploads/ to direct static /uploads/
  if (logoUrl) {
    logoUrl = logoUrl.replace('/api/uploads/', '/uploads/');
    if (!logoUrl.startsWith('http') && !logoUrl.startsWith('/')) {
      logoUrl = `/uploads/teams/logos/${logoUrl}`;
    }
  }
  if (bannerUrl) {
    bannerUrl = bannerUrl.replace('/api/uploads/', '/uploads/');
    if (!bannerUrl.startsWith('http') && !bannerUrl.startsWith('/')) {
      bannerUrl = `/uploads/teams/banners/${bannerUrl}`;
    }
  }
  if (!bannerUrl) bannerUrl = '/images/default/banner-default.jpg';

  return {
    id: t.id,
    name: t.name,
    tag: t.tag,
    gameSlug: t.game_slug as GameSlug,
    gameName: t.game_name || t.game_slug,
    captainId: t.captain_id,
    captainName: t.captain_name,
    platform: (t.platform || 'CROSSPLAY') as PlatformType,
    membersCount: t.members_count || 1,
    maxMembers: t.max_members || 45,
    color: t.color || '#00F0FF',
    logoText: t.logo_text || 'TP',
    logoUrl,
    status: t.status || 'Escuadra Activa',
    description: t.description || 'Escuadra oficial del circuito eSports.',
    bannerUrl,
    disputando: t.disputando || 'Torneo Oficial',
    palmares: t.palmares || 'Club Registrado',
    vacantPositions: t.vacant_positions ? JSON.parse(t.vacant_positions) : [],
    members: [],
  };
}

// ── NextResponse Helpers ────────────────────────────────────────────────────

import { NextResponse } from 'next/server';

export function apiSuccess<T>(data: T, message?: string, meta?: PaginationMeta) {
  const body: ApiSuccessResponse<T> = { success: true, data, ...(message && { message }), ...(meta && { meta }) };
  return NextResponse.json(body);
}

export function apiError(error: string, status: number = 400, code?: string) {
  const body: ApiErrorResponse = { success: false, error, ...(code && { code }) };
  return NextResponse.json(body, { status });
}
