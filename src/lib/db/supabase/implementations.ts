import { SupabaseBaseRepository } from './repositories';
import { supabase } from './client';
import type { 
  User, Organization, Team, Competition, Season,
  IUserRepository, IOrganizationRepository, ITeamRepository, ICompetitionRepository, ISeasonRepository,
  Match,
  Game,
  IMatchRepository,
  IGameRepository
} from '../interfaces';

function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    result[snakeKey] = value;
  }
  return result;
}

export class SupabaseUserRepository extends SupabaseBaseRepository<User> implements IUserRepository {
  protected tableName = 'users';
  protected primaryKey = 'id';

  protected mapRow(row: any): User {
    return {
      id: row.id, email: row.email, passwordHash: row.password_hash, googleId: row.google_id,
      name: row.name, gamertag: row.gamertag, role: row.role, primaryGameSlug: row.primary_game_slug,
      platform: row.platform, position: row.position, secondaryPosition: row.secondary_position,
      rankBadge: row.rank_badge, rating: row.rating, status: row.status, avatarUrl: row.avatar_url,
      organizationId: row.organization_id, isBanned: Boolean(row.is_banned), banReason: row.ban_reason,
      createdAt: row.created_at, updatedAt: row.updated_at, lastLoginAt: row.last_login_at
    };
  }
  
  protected mapToDb(entity: Partial<User>): any {
    return toSnakeCase(entity);
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data } = await supabase.from(this.tableName).select('*').ilike('email', email).maybeSingle();
    return data ? this.mapRow(data) : null;
  }

  async findByGamertag(gamertag: string): Promise<User | null> {
    const { data } = await supabase.from(this.tableName).select('*').ilike('gamertag', gamertag).maybeSingle();
    return data ? this.mapRow(data) : null;
  }

  async findByEmailOrGamertag(identifier: string): Promise<User | null> {
    const { data } = await supabase.from(this.tableName)
      .select('*')
      .or(`email.ilike.${identifier},gamertag.ilike.${identifier}`)
      .maybeSingle();
    return data ? this.mapRow(data) : null;
  }
}

export class SupabaseOrganizationRepository extends SupabaseBaseRepository<Organization> implements IOrganizationRepository {
  protected tableName = 'organizations';
  protected primaryKey = 'id';

  protected mapRow(row: any): Organization {
    return {
      id: row.id, name: row.name, tag: row.tag, ownerId: row.owner_id, logoUrl: row.logo_url,
      bannerUrl: row.banner_url, description: row.description, country: row.country,
      allowedGames: row.allowed_games ? (typeof row.allowed_games === 'string' ? JSON.parse(row.allowed_games) : row.allowed_games) : [],
      createdAt: row.created_at
    };
  }
  
  protected mapToDb(entity: Partial<Organization>): any {
    const dbData = toSnakeCase(entity);
    if (entity.allowedGames) {
      dbData.allowed_games = JSON.stringify(entity.allowedGames);
    }
    return dbData;
  }

  async findByOwnerId(ownerId: string): Promise<Organization | null> {
    const { data } = await supabase.from(this.tableName).select('*').eq('owner_id', ownerId).maybeSingle();
    return data ? this.mapRow(data) : null;
  }

  async getOrganizationsWithStats(gameSlug?: string): Promise<any[]> {
    throw new Error('Not implemented for Supabase yet');
  }
}

export class SupabaseTeamRepository extends SupabaseBaseRepository<Team> implements ITeamRepository {
  protected tableName = 'teams';
  protected primaryKey = 'id';

  protected mapRow(row: any): Team {
    return {
      id: row.id, name: row.name, tag: row.tag, gameSlug: row.game_slug, organizationId: row.organization_id,
      captainId: row.captain_id, captainName: row.captain_name, platform: row.platform, membersCount: row.members_count,
      maxMembers: row.max_members, color: row.color, logoText: row.logo_text, description: row.description,
      vacantPositions: row.vacant_positions ? (typeof row.vacant_positions === 'string' ? JSON.parse(row.vacant_positions) : row.vacant_positions) : [],
      logoUrl: row.logo_url, bannerUrl: row.banner_url, status: row.status, clubIdEa: row.club_id_ea,
      createdAt: row.created_at, updatedAt: row.updated_at
    };
  }
  
  protected mapToDb(entity: Partial<Team>): any {
    const dbData = toSnakeCase(entity);
    if (entity.vacantPositions) {
      dbData.vacant_positions = JSON.stringify(entity.vacantPositions);
    }
    return dbData;
  }

  async findByCaptain(captainId: string, gameSlug?: string): Promise<Team[]> {
    let query = supabase.from(this.tableName).select('*').eq('captain_id', captainId);
    if (gameSlug) query = query.eq('game_slug', gameSlug);
    const { data } = await query;
    return (data || []).map(row => this.mapRow(row));
  }

  async findByOrganization(orgId: string): Promise<Team[]> {
    const { data } = await supabase.from(this.tableName).select('*').eq('organization_id', orgId).order('created_at', { ascending: false });
    return (data || []).map(row => this.mapRow(row));
  }

  async findByGameSlug(gameSlug: string): Promise<Team[]> {
    const { data } = await supabase.from(this.tableName).select('*').eq('game_slug', gameSlug).eq('is_banned', 0).order('name', { ascending: true });
    return (data || []).map(row => this.mapRow(row));
  }
  
  async updateMembersCount(teamId: string): Promise<void> {
    const { count } = await supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('team_id', teamId);
    if (count !== null) {
      await supabase.from(this.tableName).update({ members_count: count }).eq('id', teamId);
    }
  }

  async getManagers(teamId: string): Promise<{ userId: string }[]> {
    const { data } = await supabase.from('team_members')
      .select('user_id')
      .eq('team_id', teamId)
      .in('role_in_team', ['Capitan', 'Capitán', 'Encargado', 'DT / Analyst', 'Manager', 'Co-Capitán']);
    return (data || []).map(r => ({ userId: r.user_id }));
  }
}

export class SupabaseCompetitionRepository extends SupabaseBaseRepository<Competition> implements ICompetitionRepository {
  protected tableName = 'competitions';
  protected primaryKey = 'id';

  protected mapRow(row: any): Competition {
    return {
      id: row.id, name: row.name, gameSlug: row.game_slug, organizerId: row.organizer_id,
      organizerName: row.organizer_name, organizationId: row.organization_id, seasonId: row.season_id,
      prizePool: row.prize_pool, transferMarketMode: row.transfer_market_mode, modeFormat: row.mode_format,
      status: row.status, fechaLimiteInscripcion: row.fecha_limite_inscripcion, fechaInicio: row.fecha_inicio,
      fechaTermino: row.fecha_termino, description: row.description, createdAt: row.created_at
    };
  }
  
  protected mapToDb(entity: Partial<Competition>): any {
    return toSnakeCase(entity);
  }

  async findByOrganizer(organizerId: string): Promise<Competition[]> {
    const { data } = await supabase.from(this.tableName).select('*').eq('organizer_id', organizerId).order('created_at', { ascending: false });
    return (data || []).map(row => this.mapRow(row));
  }

  async findByOrganization(orgId: string): Promise<Competition[]> {
    const { data } = await supabase.from(this.tableName).select('*').eq('organization_id', orgId).order('created_at', { ascending: false });
    return (data || []).map(row => this.mapRow(row));
  }

  async findByGameSlug(gameSlug: string): Promise<Competition[]> {
    const { data } = await supabase.from(this.tableName).select('*').eq('game_slug', gameSlug).order('created_at', { ascending: false });
    return (data || []).map(row => this.mapRow(row));
  }

  async getEnrolledTeams(competitionId: string): Promise<any[]> {
    throw new Error('Not implemented for Supabase yet');
  }

  async removeEnrolledTeam(competitionId: string, teamId: string): Promise<void> {
    throw new Error('Not implemented for Supabase yet');
  }

  async getReportedMatchesCount(competitionId: string): Promise<number> {
    throw new Error('Not implemented for Supabase yet');
  }

  async getMatchCompetitionId(matchId: string): Promise<string | null> {
    throw new Error('Not implemented for Supabase yet');
  }

  async upsertCompetitionTeam(enrollId: string, competitionId: string, teamId: string, teamName: string, teamTag: string | null): Promise<void> {
    throw new Error('Not implemented for Supabase yet');
  }
}

export class SupabaseSeasonRepository extends SupabaseBaseRepository<Season> implements ISeasonRepository {
  protected tableName = 'seasons';
  protected primaryKey = 'id';

  protected mapRow(row: any): Season {
    return {
      id: row.id, name: row.name, organizationId: row.organization_id, startDate: row.start_date,
      endDate: row.end_date, status: row.status, createdAt: row.created_at
    };
  }
  
  protected mapToDb(entity: Partial<Season>): any {
    return toSnakeCase(entity);
  }

  async findByOrganization(orgId: string): Promise<Season[]> {
    const { data } = await supabase.from(this.tableName).select('*').or(`organization_id.eq.${orgId},organization_id.is.null`).order('created_at', { ascending: false });
    return (data || []).map(row => this.mapRow(row));
  }
}

export class SupabaseMatchRepository extends SupabaseBaseRepository<Match> implements IMatchRepository {
  protected primaryKey = 'id';
  protected tableName = 'matches';

  protected mapRow(row: any): Match {
    return {
      id: row.id,
      tournamentId: row.tournament_id,
      competitionId: row.competition_id,
      round: row.round,
      matchday: row.matchday,
      roundName: row.round_name,
      groupName: row.group_name,
      teamHomeId: row.team_home_id,
      homeTeamId: row.home_team_id,
      teamAwayId: row.team_away_id,
      awayTeamId: row.away_team_id,
      homeTeamName: row.home_team_name,
      homeTeamTag: row.home_team_tag,
      awayTeamName: row.away_team_name,
      awayTeamTag: row.away_team_tag,
      scoreHome: row.score_home,
      scoreAway: row.score_away,
      reportedScoreHome: row.reported_score_home,
      reportedScoreAway: row.reported_score_away,
      winnerTeamId: row.winner_team_id,
      proofUrl: row.proof_url,
      reportedByUserId: row.reported_by_user_id,
      nextMatchId: row.next_match_id,
      nextMatchSlot: row.next_match_slot,
      scheduledAt: row.scheduled_at,
      scheduledTime: row.scheduled_time,
      status: row.status
    };
  }

  protected mapToDb(entity: Partial<Match>): any {
    return toSnakeCase(entity);
  }

  async findByCompetition(competitionId: string): Promise<Match[]> {
    const { data } = await supabase.from(this.tableName)
      .select('*')
      .or(`competition_id.eq.${competitionId},tournament_id.eq.${competitionId}`)
      .order('scheduled_at', { ascending: true });
    return (data || []).map(row => this.mapRow(row));
  }

  async addPlayerStat(statsId: string, matchId: string, playerId: string, gameSlug: string, statsJson: string): Promise<void> {
    await supabase.from('match_player_stats').insert({
      id: statsId,
      match_id: matchId,
      player_id: playerId,
      game_slug: gameSlug,
      stats_json: statsJson
    });
  }
}
