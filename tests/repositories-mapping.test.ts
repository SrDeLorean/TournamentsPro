import type { RowDataPacket } from 'mysql2';
import { describe, expect, it } from 'vitest';
import { TeamRepository, UserRepository } from '../src/lib/repositories';

class TestUserRepository extends UserRepository {
  map(row: RowDataPacket) { return this.mapRow(row as never); }
}

class TestTeamRepository extends TeamRepository {
  map(row: RowDataPacket) { return this.mapRow(row as never); }
}

function row(value: Record<string, unknown>): RowDataPacket {
  return value as RowDataPacket;
}

describe('repository row mapping', () => {
  it('maps database user names and numeric ban state to the public model', () => {
    const user = new TestUserRepository().map(row({
      id: 'user-1', email: 'u@test.dev', password_hash: null, google_id: null, name: 'User',
      gamertag: 'Player', role: 'Jugador', primary_game_slug: 'eafc26', platform: 'PC',
      position: 'DFC', secondary_position: null, rank_badge: 'D1', rating: 9, status: 'Activo',
      avatar_url: null, organization_id: null, is_banned: 1, ban_reason: 'reason',
      created_at: '2026-01-01', updated_at: '2026-01-02',
    }));
    expect(user).toMatchObject({ id: 'user-1', passwordHash: null, isBanned: true, banReason: 'reason' });
  });

  it('maps JSON-backed team vacancies without changing the public shape', () => {
    const team = new TestTeamRepository().map(row({
      id: 'team-1', name: 'Team', tag: 'TM', game_slug: 'valorant', organization_id: null,
      captain_id: 'user-1', captain_name: 'Player', platform: 'PC', members_count: 5, max_members: 7,
      color: '#000000', logo_text: 'TM', description: null, vacant_positions: '["Duelista"]',
      logo_url: null, banner_url: null, status: 'Activo', club_id_ea: null,
      created_at: '2026-01-01', updated_at: '2026-01-02',
    }));
    expect(team.vacantPositions).toEqual(['Duelista']);
  });

  it('generates proper prefix IDs for Supabase repositories', async () => {
    const { 
      SupabaseCompetitionRepository,
      SupabaseUserRepository,
      SupabaseOrganizationRepository,
      SupabaseTeamRepository,
      SupabaseSeasonRepository,
      SupabaseMatchRepository
    } = await import('../src/lib/db/supabase/implementations');

    class TestCompRepo extends SupabaseCompetitionRepository {
      getId() { return this.generateId(); }
    }
    class TestUserRepo extends SupabaseUserRepository {
      getId() { return this.generateId(); }
    }
    class TestOrgRepo extends SupabaseOrganizationRepository {
      getId() { return this.generateId(); }
    }
    class TestTeamRepo extends SupabaseTeamRepository {
      getId() { return this.generateId(); }
    }
    class TestSeasonRepo extends SupabaseSeasonRepository {
      getId() { return this.generateId(); }
    }
    class TestMatchRepo extends SupabaseMatchRepository {
      getId() { return this.generateId(); }
    }

    expect(new TestCompRepo().getId()).toMatch(/^comp-\d+-[a-z0-9]+$/);
    expect(new TestUserRepo().getId()).toMatch(/^usr-\d+-[a-z0-9]+$/);
    expect(new TestOrgRepo().getId()).toMatch(/^org-\d+-[a-z0-9]+$/);
    expect(new TestTeamRepo().getId()).toMatch(/^team-\d+-[a-z0-9]+$/);
    expect(new TestSeasonRepo().getId()).toMatch(/^seas-\d+-[a-z0-9]+$/);
    expect(new TestMatchRepo().getId()).toMatch(/^match-\d+-[a-z0-9]+$/);
  });

  it('verifies competition mapping and db conversion', async () => {
    const { SupabaseCompetitionRepository } = await import('../src/lib/db/supabase/implementations');
    class TestCompRepo extends SupabaseCompetitionRepository {
      toDb(entity: any) { return this.mapToDb(entity); }
      fromRow(row: any) { return this.mapRow(row); }
    }

    const repo = new TestCompRepo();
    const dbObj = repo.toDb({
      name: 'Torneo Test',
      gameSlug: 'eafc26',
      organizerId: 'usr-1',
      organizerName: 'Admin',
      organizationId: 'org-1',
      seasonId: 'seas-1',
      prizePool: '1000',
      transferMarketMode: 'ABIERTO',
      modeFormat: '11v11',
      status: 'Inscripcion',
      fechaInicio: '2026-09-01 10:00:00',
      description: 'Desc',
    });

    expect(dbObj).toEqual({
      name: 'Torneo Test',
      game_slug: 'eafc26',
      organizer_id: 'usr-1',
      organizer_name: 'Admin',
      organization_id: 'org-1',
      season_id: 'seas-1',
      prize_pool: '1000',
      transfer_market_mode: 'ABIERTO',
      mode_format: '11v11',
      status: 'Inscripcion',
      fecha_inicio: '2026-09-01 10:00:00',
      description: 'Desc',
    });
  });
});
