"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseSeasonRepository = exports.SupabaseCompetitionRepository = exports.SupabaseTeamRepository = exports.SupabaseOrganizationRepository = exports.SupabaseUserRepository = void 0;
const repositories_1 = require("./repositories");
const client_1 = require("./client");
function toSnakeCase(obj) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value === undefined)
            continue;
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        result[snakeKey] = value;
    }
    return result;
}
class SupabaseUserRepository extends repositories_1.SupabaseBaseRepository {
    tableName = 'users';
    primaryKey = 'id';
    mapRow(row) {
        return {
            id: row.id, email: row.email, passwordHash: row.password_hash, googleId: row.google_id,
            name: row.name, gamertag: row.gamertag, role: row.role, primaryGameSlug: row.primary_game_slug,
            platform: row.platform, position: row.position, secondaryPosition: row.secondary_position,
            rankBadge: row.rank_badge, rating: row.rating, status: row.status, avatarUrl: row.avatar_url,
            organizationId: row.organization_id, isBanned: Boolean(row.is_banned), banReason: row.ban_reason,
            createdAt: row.created_at, updatedAt: row.updated_at, lastLoginAt: row.last_login_at
        };
    }
    mapToDb(entity) {
        return toSnakeCase(entity);
    }
    async findByEmail(email) {
        const { data } = await client_1.supabase.from(this.tableName).select('*').ilike('email', email).maybeSingle();
        return data ? this.mapRow(data) : null;
    }
    async findByGamertag(gamertag) {
        const { data } = await client_1.supabase.from(this.tableName).select('*').ilike('gamertag', gamertag).maybeSingle();
        return data ? this.mapRow(data) : null;
    }
    async findByEmailOrGamertag(identifier) {
        const { data } = await client_1.supabase.from(this.tableName)
            .select('*')
            .or(`email.ilike.${identifier},gamertag.ilike.${identifier}`)
            .maybeSingle();
        return data ? this.mapRow(data) : null;
    }
}
exports.SupabaseUserRepository = SupabaseUserRepository;
class SupabaseOrganizationRepository extends repositories_1.SupabaseBaseRepository {
    tableName = 'organizations';
    primaryKey = 'id';
    mapRow(row) {
        return {
            id: row.id, name: row.name, tag: row.tag, ownerId: row.owner_id, logoUrl: row.logo_url,
            bannerUrl: row.banner_url, description: row.description, country: row.country,
            allowedGames: row.allowed_games ? (typeof row.allowed_games === 'string' ? JSON.parse(row.allowed_games) : row.allowed_games) : [],
            createdAt: row.created_at
        };
    }
    mapToDb(entity) {
        const dbData = toSnakeCase(entity);
        if (entity.allowedGames) {
            dbData.allowed_games = JSON.stringify(entity.allowedGames);
        }
        return dbData;
    }
    async findByOwnerId(ownerId) {
        const { data } = await client_1.supabase.from(this.tableName).select('*').eq('owner_id', ownerId).maybeSingle();
        return data ? this.mapRow(data) : null;
    }
    async getOrganizationsWithStats(gameSlug) {
        throw new Error('Not implemented for Supabase yet');
    }
}
exports.SupabaseOrganizationRepository = SupabaseOrganizationRepository;
class SupabaseTeamRepository extends repositories_1.SupabaseBaseRepository {
    tableName = 'teams';
    primaryKey = 'id';
    mapRow(row) {
        return {
            id: row.id, name: row.name, tag: row.tag, gameSlug: row.game_slug, organizationId: row.organization_id,
            captainId: row.captain_id, captainName: row.captain_name, platform: row.platform, membersCount: row.members_count,
            maxMembers: row.max_members, color: row.color, logoText: row.logo_text, description: row.description,
            vacantPositions: row.vacant_positions ? (typeof row.vacant_positions === 'string' ? JSON.parse(row.vacant_positions) : row.vacant_positions) : [],
            logoUrl: row.logo_url, bannerUrl: row.banner_url, status: row.status, clubIdEa: row.club_id_ea,
            createdAt: row.created_at, updatedAt: row.updated_at
        };
    }
    mapToDb(entity) {
        const dbData = toSnakeCase(entity);
        if (entity.vacantPositions) {
            dbData.vacant_positions = JSON.stringify(entity.vacantPositions);
        }
        return dbData;
    }
    async findByCaptain(captainId, gameSlug) {
        let query = client_1.supabase.from(this.tableName).select('*').eq('captain_id', captainId);
        if (gameSlug)
            query = query.eq('game_slug', gameSlug);
        const { data } = await query;
        return (data || []).map(row => this.mapRow(row));
    }
    async findByOrganization(orgId) {
        const { data } = await client_1.supabase.from(this.tableName).select('*').eq('organization_id', orgId).order('created_at', { ascending: false });
        return (data || []).map(row => this.mapRow(row));
    }
    async findByGameSlug(gameSlug) {
        const { data } = await client_1.supabase.from(this.tableName).select('*').eq('game_slug', gameSlug).eq('is_banned', 0).order('name', { ascending: true });
        return (data || []).map(row => this.mapRow(row));
    }
    async updateMembersCount(teamId) {
        const { count } = await client_1.supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('team_id', teamId);
        if (count !== null) {
            await client_1.supabase.from(this.tableName).update({ members_count: count }).eq('id', teamId);
        }
    }
}
exports.SupabaseTeamRepository = SupabaseTeamRepository;
class SupabaseCompetitionRepository extends repositories_1.SupabaseBaseRepository {
    tableName = 'competitions';
    primaryKey = 'id';
    mapRow(row) {
        return {
            id: row.id, name: row.name, gameSlug: row.game_slug, organizerId: row.organizer_id,
            organizerName: row.organizer_name, organizationId: row.organization_id, seasonId: row.season_id,
            prizePool: row.prize_pool, transferMarketMode: row.transfer_market_mode, modeFormat: row.mode_format,
            status: row.status, fechaLimiteInscripcion: row.fecha_limite_inscripcion, fechaInicio: row.fecha_inicio,
            fechaTermino: row.fecha_termino, description: row.description, createdAt: row.created_at
        };
    }
    mapToDb(entity) {
        return toSnakeCase(entity);
    }
    async findByOrganizer(organizerId) {
        const { data } = await client_1.supabase.from(this.tableName).select('*').eq('organizer_id', organizerId).order('created_at', { ascending: false });
        return (data || []).map(row => this.mapRow(row));
    }
    async findByOrganization(orgId) {
        const { data } = await client_1.supabase.from(this.tableName).select('*').eq('organization_id', orgId).order('created_at', { ascending: false });
        return (data || []).map(row => this.mapRow(row));
    }
    async findByGameSlug(gameSlug) {
        const { data } = await client_1.supabase.from(this.tableName).select('*').eq('game_slug', gameSlug).order('created_at', { ascending: false });
        return (data || []).map(row => this.mapRow(row));
    }
    async getEnrolledTeams(competitionId) {
        throw new Error('Not implemented for Supabase yet');
    }
    async removeEnrolledTeam(competitionId, teamId) {
        throw new Error('Not implemented for Supabase yet');
    }
    async getReportedMatchesCount(competitionId) {
        throw new Error('Not implemented for Supabase yet');
    }
    async getMatchCompetitionId(matchId) {
        throw new Error('Not implemented for Supabase yet');
    }
    async upsertCompetitionTeam(enrollId, competitionId, teamId, teamName, teamTag) {
        throw new Error('Not implemented for Supabase yet');
    }
}
exports.SupabaseCompetitionRepository = SupabaseCompetitionRepository;
class SupabaseSeasonRepository extends repositories_1.SupabaseBaseRepository {
    tableName = 'seasons';
    primaryKey = 'id';
    mapRow(row) {
        return {
            id: row.id, name: row.name, organizationId: row.organization_id, startDate: row.start_date,
            endDate: row.end_date, status: row.status, createdAt: row.created_at
        };
    }
    mapToDb(entity) {
        return toSnakeCase(entity);
    }
    async findByOrganization(orgId) {
        const { data } = await client_1.supabase.from(this.tableName).select('*').or(`organization_id.eq.${orgId},organization_id.is.null`).order('created_at', { ascending: false });
        return (data || []).map(row => this.mapRow(row));
    }
}
exports.SupabaseSeasonRepository = SupabaseSeasonRepository;
