import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateManagedTeamService, createTeamService, archiveManagedTeamService } from '../src/lib/services';
import { dbProvider } from '../src/lib/db/provider';

describe('Team operations via dbProvider repositories (Supabase / MySQL compatibility)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(dbProvider, 'withTransaction').mockImplementation(async (cb: any) => cb(dbProvider));
  });

  it('updates a team without using raw SQL queryDB', async () => {
    const mockTeam = {
      id: 'team-sangre-nueva',
      name: 'Sangre Nueva FC',
      tag: 'SN FC',
      captainId: 'usr-caxorro',
      captainName: 'Caxorro_SN',
      gameSlug: 'eafc26',
      membersCount: 21,
      maxMembers: 45,
      platform: 'CROSSPLAY',
      color: '#EF4444',
      status: 'Activo',
    };

    const mockUser = {
      id: 'usr-caxorro',
      name: 'Caxorro_SN',
      email: 'caxorro@test.com',
      gamertag: 'Caxorro_SN',
      role: 'Capitán',
    };

    vi.spyOn(dbProvider.teams, 'findById').mockResolvedValue(mockTeam as any);
    vi.spyOn(dbProvider.users, 'findById').mockResolvedValue(mockUser as any);
    vi.spyOn(dbProvider.teams, 'update').mockResolvedValue(mockTeam as any);
    vi.spyOn(dbProvider.teams, 'syncStaff').mockResolvedValue(undefined);

    const result = await updateManagedTeamService('team-sangre-nueva', {
      name: 'Sangre Nueva FC Editado',
      tag: 'SN',
      color: '#FF0000',
      description: 'Nueva descripción',
    });

    expect(result.success).toBe(true);
    expect(dbProvider.teams.findById).toHaveBeenCalledWith('team-sangre-nueva');
    expect(dbProvider.teams.update).toHaveBeenCalledWith('team-sangre-nueva', expect.objectContaining({
      name: 'Sangre Nueva FC Editado',
      tag: 'SN',
      color: '#FF0000',
    }));
  });

  it('archives a team safely after checking active competitions', async () => {
    const mockTeam = {
      id: 'team-sangre-nueva',
      name: 'Sangre Nueva FC',
      captainId: 'usr-caxorro',
    };

    vi.spyOn(dbProvider.teams, 'findById').mockResolvedValue(mockTeam as any);
    vi.spyOn(dbProvider.teams, 'hasActiveCompetitions').mockResolvedValue(false);
    vi.spyOn(dbProvider.teams, 'archiveTeam').mockResolvedValue(undefined);

    const result = await archiveManagedTeamService('team-sangre-nueva');

    expect(result.success).toBe(true);
    expect(dbProvider.teams.hasActiveCompetitions).toHaveBeenCalledWith('team-sangre-nueva');
    expect(dbProvider.teams.archiveTeam).toHaveBeenCalledWith('team-sangre-nueva');
  });

  it('prevents archiving when team has active competitions', async () => {
    const mockTeam = {
      id: 'team-sangre-nueva',
      name: 'Sangre Nueva FC',
      captainId: 'usr-caxorro',
    };

    vi.spyOn(dbProvider.teams, 'findById').mockResolvedValue(mockTeam as any);
    vi.spyOn(dbProvider.teams, 'hasActiveCompetitions').mockResolvedValue(true);

    const result = await archiveManagedTeamService('team-sangre-nueva');

    expect(result.success).toBe(false);
    expect(result.error).toContain('activa');
  });
});
