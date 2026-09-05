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
    result[snakeKey] = typeof value === "boolean" ? (value ? 1 : 0) : value;
  }
  return result;
}

function escapeIlikeLiteral(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

export class SupabaseUserRepository extends SupabaseBaseRepository<User> implements IUserRepository {
  protected tableName = 'users';
  protected primaryKey = 'id';

  protected override generateId(): string {
    return `usr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  protected mapRow(row: any): User {
    return {
      id: row.id, email: row.email, passwordHash: row.password_hash, googleId: row.google_id,
      name: row.name, gamertag: row.gamertag, role: row.role, primaryGameSlug: row.primary_game_slug,
      platform: row.platform, position: row.position, secondaryPosition: row.secondary_position,
      rankBadge: row.rank_badge, rating: row.rating, status: row.status, avatarUrl: row.avatar_url,
      organizationId: row.organization_id, isBanned: Boolean(row.is_banned), banReason: row.ban_reason,
      bannedAt: row.banned_at, gameProfiles: row.game_profiles,
      createdAt: row.created_at, updatedAt: row.updated_at, lastLoginAt: row.last_login_at
    };
  }
  
  protected mapToDb(entity: Partial<User>): any {
    return toSnakeCase(entity);
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .ilike('email', escapeIlikeLiteral(email.trim()))
      .maybeSingle();
    if (error || !data) return null;
    return this.mapRow(data);
  }

  async findByGamertag(gamertag: string): Promise<User | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .ilike('gamertag', escapeIlikeLiteral(gamertag.trim()))
      .maybeSingle();
    if (error || !data) return null;
    return this.mapRow(data);
  }

  async findByEmailOrGamertag(identifier: string): Promise<User | null> {
    const cleanId = escapeIlikeLiteral(identifier.trim());
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .or(`email.ilike.${cleanId},gamertag.ilike.${cleanId}`)
      .maybeSingle();
    if (error || !data) return null;
    return this.mapRow(data);
  }

  async getAvailablePlayers(options?: { organizerOrgId?: string | null; searchQuery?: string }): Promise<any[]> {
    let query = supabase
      .from(this.tableName)
      .select('id, name, gamertag, email, position, primary_game_slug, organization_id, avatar_url, foto, role, status, is_banned')
      .not('role', 'in', '("Administrador","Organizador")')
      .or('is_banned.eq.0,is_banned.is.null');

    if (options?.searchQuery && options.searchQuery.trim()) {
      const q = escapeIlikeLiteral(options.searchQuery.trim());
      query = query.or(`name.ilike.%${q}%,gamertag.ilike.%${q}%,email.ilike.%${q}%,position.ilike.%${q}%`);
    }

    const { data, error } = await query.order('name', { ascending: true }).limit(60);
    if (error || !data) return [];

    const userIds = data.map((u) => u.id);
    const orgIds = data.map((u) => u.organization_id).filter(Boolean);

    let orgMap = new Map<string, string>();
    if (orgIds.length > 0) {
      const { data: orgs } = await supabase.from('organizations').select('id, name').in('id', orgIds);
      if (orgs) orgMap = new Map(orgs.map((o) => [o.id, o.name]));
    }

    let teamMap = new Map<string, { id: string; name: string }>();
    if (userIds.length > 0) {
      const { data: members } = await supabase.from('team_members').select('user_id, team_id').in('user_id', userIds);
      if (members && members.length > 0) {
        const teamIds = members.map((m) => m.team_id);
        const { data: teams } = await supabase.from('teams').select('id, name').in('id', teamIds);
        const tNames = new Map((teams || []).map((t) => [t.id, t.name]));
        for (const m of members) {
          if (!teamMap.has(m.user_id)) {
            teamMap.set(m.user_id, { id: m.team_id, name: tNames.get(m.team_id) || 'Club' });
          }
        }
      }
    }

    return data.map((u) => ({
      id: u.id,
      name: u.name,
      gamertag: u.gamertag,
      email: u.email,
      position: u.position,
      primary_game_slug: u.primary_game_slug,
      organization_id: u.organization_id,
      organization_name: u.organization_id ? orgMap.get(u.organization_id) || null : null,
      current_team_id: teamMap.get(u.id)?.id || null,
      current_team_name: teamMap.get(u.id)?.name || null,
      avatar_url: u.avatar_url,
      foto: u.foto,
      role: u.role,
      status: u.status,
    }));
  }
}

export class SupabaseOrganizationRepository extends SupabaseBaseRepository<Organization> implements IOrganizationRepository {
  protected tableName = 'organizations';
  protected primaryKey = 'id';

  protected override generateId(): string {
    return `org-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  protected mapRow(row: any): Organization {
    return {
      id: row.id, name: row.name, tag: row.tag, ownerId: row.owner_id, logoUrl: row.logo_url,
      bannerUrl: row.banner_url, description: row.description, country: row.country, status: row.status, isBanned: Boolean(row.is_banned), banReason: row.ban_reason,
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
    const orgs = await this.findAll();
    return orgs.map(o => ({
      ...o,
      allowed_games: o.allowedGames,
      logo_url: o.logoUrl,
      banner_url: o.bannerUrl,
      comp_count: 0
    }));
  }

  async hasActiveCompetitions(organizationId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('competitions')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .in('status', ['Activo', 'Inscripcion', 'En Curso']);
    if (error) throw error;
    return (count || 0) > 0;
  }

  async archiveOrganization(organizationId: string): Promise<number> {
    const { data: teams } = await supabase.from('teams').select('id').eq('organization_id', organizationId);
    const teamIds = (teams || []).map((t) => t.id);
    if (teamIds.length > 0) {
      await supabase.from('team_vacancies').update({ status: 'CERRADA' }).in('team_id', teamIds).eq('status', 'ABIERTA');
      await supabase.from('transfer_market_posts').update({ status: 'CADUCADO' }).in('team_id', teamIds).eq('status', 'ACTIVO');
      await supabase.from('teams').update({ status: 'Archivado', updated_at: new Date().toISOString() }).in('id', teamIds);
    }
    await supabase.from(this.tableName).update({ status: 'Archivada', updated_at: new Date().toISOString() }).eq('id', organizationId);
    return teamIds.length;
  }
}

export class SupabaseTeamRepository extends SupabaseBaseRepository<Team> implements ITeamRepository {
  protected tableName = 'teams';
  protected primaryKey = 'id';

  protected override generateId(): string {
    return `team-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  protected mapRow(row: any): Team {
    return {
      id: row.id, name: row.name, tag: row.tag, gameSlug: row.game_slug, organizationId: row.organization_id,
      captainId: row.captain_id, captainName: row.captain_name, platform: row.platform, membersCount: row.members_count,
      maxMembers: row.max_members, color: row.color, logoText: row.logo_text, description: row.description,
      vacantPositions: row.vacant_positions ? (typeof row.vacant_positions === 'string' ? JSON.parse(row.vacant_positions) : row.vacant_positions) : [],
      logoUrl: row.logo_url, bannerUrl: row.banner_url, status: row.status, clubIdEa: row.club_id_ea, isBanned: Boolean(row.is_banned), banReason: row.ban_reason,
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

  async getManagers(teamId: string): Promise<string[]> {
    const { data } = await supabase.from('team_members')
      .select('user_id')
      .eq('team_id', teamId)
      .in('role_in_team', ['Capitan', 'Capitán', 'Encargado', 'DT / Analyst', 'Manager', 'Co-Capitán']);
    return (data || []).map(r => r.user_id);
  }

  async syncStaff(teamId: string, captainId: string, managerIds: string[] = [], captainPosition = 'DFC'): Promise<void> {
    const { randomUUID } = await import('crypto');
    await supabase.from('team_members')
      .delete()
      .eq('team_id', teamId)
      .in('role_in_team', ['Capitan', 'Capitán', 'Encargado']);

    const rows = [
      {
        id: randomUUID(),
        team_id: teamId,
        user_id: captainId,
        tactical_position: captainPosition || 'CAPITAN',
        role_in_team: 'Capitán',
      },
      ...managerIds
        .filter((mId) => mId && mId !== captainId)
        .map((mId) => ({
          id: randomUUID(),
          team_id: teamId,
          user_id: mId,
          tactical_position: 'ENCARGADO',
          role_in_team: 'Encargado',
        })),
    ];

    const { error } = await supabase.from('team_members').insert(rows);
    if (error) throw error;
    await this.updateMembersCount(teamId);
  }

  async hasActiveCompetitions(teamId: string): Promise<boolean> {
    const { data: ctRows, error: ctError } = await supabase
      .from('competition_teams')
      .select('competition_id')
      .eq('team_id', teamId)
      .eq('status', 'CONFIRMADO');
    if (ctError) throw ctError;
    if (!ctRows || ctRows.length === 0) return false;

    const compIds = ctRows.map((r) => r.competition_id);
    const { count, error: compError } = await supabase
      .from('competitions')
      .select('*', { count: 'exact', head: true })
      .in('id', compIds)
      .in('status', ['Activo', 'Inscripcion', 'En Curso']);
    if (compError) throw compError;
    return (count || 0) > 0;
  }

  async archiveTeam(teamId: string): Promise<void> {
    await supabase.from('team_vacancies').update({ status: 'CERRADA' }).eq('team_id', teamId).eq('status', 'ABIERTA');
    await supabase.from('transfer_market_posts').update({ status: 'CADUCADO' }).eq('team_id', teamId).eq('status', 'ACTIVO');
    await supabase.from('transfer_offers').update({ status: 'CANCELADO' }).eq('team_id', teamId).eq('status', 'PENDIENTE');
    await supabase.from(this.tableName).update({ status: 'Archivado', updated_at: new Date().toISOString() }).eq('id', teamId);
  }

  async getSquad(teamId: string): Promise<any[]> {
    const { data: members, error: memError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .order('role_in_team', { ascending: true });
    if (memError) throw memError;
    if (!members || members.length === 0) return [];

    const userIds = members.map((m) => m.user_id);
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, gamertag, email, avatar_url, foto')
      .in('id', userIds);
    if (userError) throw userError;

    const userMap = new Map((users || []).map((u) => [u.id, u]));

    return members.map((m) => {
      const u = userMap.get(m.user_id);
      return {
        id: m.id,
        team_id: m.team_id,
        user_id: m.user_id,
        organization_name: m.organization_name,
        tactical_position: m.tactical_position,
        role_in_team: m.role_in_team,
        jersey_number: m.jersey_number,
        joined_at: m.joined_at,
        user_name: u?.name || 'Jugador',
        gamertag: u?.gamertag || 'Jugador',
        email: u?.email || '',
        avatar_url: u?.avatar_url || null,
        foto: u?.foto || null,
      };
    });
  }

  async getAcceptedOffers(teamId: string): Promise<{ player_user_id: string; pitch_message: string | null }[]> {
    const { data, error } = await supabase
      .from('transfer_offers')
      .select('player_user_id, pitch_message')
      .eq('team_id', teamId)
      .eq('status', 'ACEPTADO');
    if (error) return [];
    return data || [];
  }

  async getTeamCompetitionOrganizations(teamId: string): Promise<{ org_id: string; org_name: string }[]> {
    const { data: ctRows } = await supabase
      .from('competition_teams')
      .select('competition_id')
      .eq('team_id', teamId);
    if (!ctRows || ctRows.length === 0) return [];
    const compIds = ctRows.map((r) => r.competition_id);
    const { data: comps } = await supabase
      .from('competitions')
      .select('organization_id')
      .in('id', compIds);
    if (!comps || comps.length === 0) return [];
    const orgIds = comps.map((c) => c.organization_id).filter(Boolean);
    if (orgIds.length === 0) return [];
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name')
      .in('id', orgIds);
    return (orgs || []).map((o) => ({ org_id: o.id, org_name: o.name }));
  }

  async addSquadMember(teamId: string, userId: string, tacticalPosition = 'DFC', roleInTeam = 'Jugador', orgName?: string): Promise<void> {
    await supabase.from('team_members').delete().eq('team_id', teamId).eq('user_id', userId);
    const memberId = `tm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const normalizedRole = roleInTeam === 'Capitan' ? 'Capitán' : roleInTeam;
    const { error } = await supabase.from('team_members').insert({
      id: memberId,
      team_id: teamId,
      user_id: userId,
      tactical_position: tacticalPosition,
      role_in_team: normalizedRole,
      organization_name: orgName || null,
    });
    if (error) throw error;
    await this.updateMembersCount(teamId);
  }

  async removeSquadMember(teamId: string, userId: string, orgName?: string): Promise<void> {
    let query = supabase.from('team_members').delete().eq('team_id', teamId).eq('user_id', userId);
    if (orgName) {
      query = query.ilike('organization_name', orgName);
    }
    const { error } = await query;
    if (error) throw error;
    await this.updateMembersCount(teamId);
  }

  async updateSquadMemberRole(teamId: string, userId: string, newRole: string, userName?: string): Promise<void> {
    const isPromotingToCaptain = newRole === 'Capitán' || newRole === 'Capitan';
    if (isPromotingToCaptain) {
      const team = await this.findById(teamId);
      const oldCaptainId = team?.captainId;
      if (oldCaptainId && oldCaptainId !== userId) {
        await supabase.from('team_members').update({ role_in_team: 'Encargado' }).eq('team_id', teamId).eq('user_id', oldCaptainId);
      }
      await supabase.from('team_members').update({ role_in_team: 'Capitán' }).eq('team_id', teamId).eq('user_id', userId);
      await supabase.from(this.tableName).update({ captain_id: userId, captain_name: userName || 'Capitán', updated_at: new Date().toISOString() }).eq('id', teamId);
    } else {
      await supabase.from('team_members').update({ role_in_team: newRole }).eq('team_id', teamId).eq('user_id', userId);
    }
  }

  async updateSquadMemberJersey(memberId: string, jerseyNumber: number | null): Promise<void> {
    const { error } = await supabase.from('team_members').update({ jersey_number: jerseyNumber }).eq('id', memberId);
    if (error) throw error;
  }

  async isMemberOrManager(teamId: string, userId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .in('role_in_team', ['Capitan', 'Capitán', 'Encargado', 'DT / Analyst', 'Manager', 'Co-Capitán']);
    if (error) return false;
    return (count || 0) > 0;
  }
}

export class SupabaseCompetitionRepository extends SupabaseBaseRepository<Competition> implements ICompetitionRepository {
  protected tableName = 'competitions';
  protected primaryKey = 'id';

  protected override generateId(): string {
    return `comp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  protected mapRow(row: any): Competition {
    return {
      id: row.id, name: row.name, gameSlug: row.game_slug, organizerId: row.organizer_id,
      organizerName: row.organizer_name, organizationId: row.organization_id, seasonId: row.season_id,
      prizePool: row.prize_pool, transferMarketMode: row.transfer_market_mode, modeFormat: row.mode_format,
      format: row.format, matchMode: row.match_mode, groupCount: row.group_count,
      qualifiersPerGroup: row.qualifiers_per_group,
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
    const { data, error } = await supabase
      .from('competition_teams')
      .select('*')
      .eq('competition_id', competitionId)
      .eq('status', 'CONFIRMADO');
    if (error) throw error;
    return data || [];
  }

  async removeEnrolledTeam(competitionId: string, teamId: string): Promise<void> {
    const { error } = await supabase
      .from('competition_teams')
      .delete()
      .eq('competition_id', competitionId)
      .eq('team_id', teamId);
    if (error) throw error;
  }

  async getReportedMatchesCount(competitionId: string): Promise<number> {
    const { count, error } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('competition_id', competitionId)
      .in('status', ['POR_REVISAR', 'TERMINADO', 'DISPUTADO', 'FINALIZADO']);
    if (error) throw error;
    return count || 0;
  }

  async getMatchCompetitionId(matchId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('matches')
      .select('competition_id')
      .eq('id', matchId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data?.competition_id || null;
  }

  async upsertCompetitionTeam(enrollId: string, competitionId: string, teamId: string, teamName: string, teamTag: string | null): Promise<void> {
    const { error } = await supabase
      .from('competition_teams')
      .upsert({
        id: enrollId,
        competition_id: competitionId,
        team_id: teamId,
        team_name: teamName,
        team_tag: teamTag,
        status: 'CONFIRMADO'
      }, { onConflict: 'competition_id,team_id' });
    if (error) throw error;
  }
}

export class SupabaseSeasonRepository extends SupabaseBaseRepository<Season> implements ISeasonRepository {
  protected tableName = 'seasons';
  protected primaryKey = 'id';

  protected override generateId(): string {
    return `seas-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

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

  protected override generateId(): string {
    return `match-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

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


export class SupabaseGameRepository extends SupabaseBaseRepository<any> {
  protected tableName = 'games';
  protected primaryKey = 'slug';
  protected mapRow(row: any) { return row; }
  protected mapToDb(entity: any) { return entity; }
}
