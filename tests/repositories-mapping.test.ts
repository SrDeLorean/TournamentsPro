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
});
