import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateManagedTeamService, archiveManagedTeamService, createTeamService } from '../src/lib/services';
import { dbProvider } from '../src/lib/db/provider';
import type { Team, User } from '../src/lib/db/interfaces';

describe('Team operations via dbProvider repositories (Supabase / MySQL compatibility)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(dbProvider, 'withTransaction').mockImplementation(async (operation) => operation(dbProvider));
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

    vi.spyOn(dbProvider.teams, 'findById').mockResolvedValue(mockTeam as Team);
    vi.spyOn(dbProvider.users, 'findById').mockResolvedValue(mockUser as User);
    vi.spyOn(dbProvider.teams, 'update').mockResolvedValue(mockTeam as Team);
    vi.spyOn(dbProvider.teams, 'syncStaff').mockResolvedValue(undefined);

    const result = await updateManagedTeamService('team-sangre-nueva', {
      name: 'Sangre Nueva FC Editado',
      tag: 'SN',
      color: '#FF0000',
      description: 'Nueva descripción',
    });

    expect(result.success).toBe(true);
    expect(dbProvider.teams.findById).toHaveBeenCalledWith('team-sangre-nueva', { forUpdate: true });
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

    vi.spyOn(dbProvider.teams, 'findById').mockResolvedValue(mockTeam as Team);
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

    vi.spyOn(dbProvider.teams, 'findById').mockResolvedValue(mockTeam as Team);
    vi.spyOn(dbProvider.teams, 'hasActiveCompetitions').mockResolvedValue(true);

    const result = await archiveManagedTeamService('team-sangre-nueva');

    expect(result.success).toBe(false);
    expect(result.error).toContain('activa');
  });

  describe('createTeamService & teamTagSchema validation', () => {
    it('validates and auto-uppercases team tags with esports characters, spaces, dots, and accents', async () => {
      const mockCaptain = {
        id: 'usr-captain-1',
        name: 'Capitán Pro',
        gamertag: 'CapitanPro',
        role: 'Capitán',
      };

      vi.spyOn(dbProvider.users, 'findById').mockResolvedValue(mockCaptain as User);
      vi.spyOn(dbProvider.teams, 'findByCaptain').mockResolvedValue([]);
      vi.spyOn(dbProvider.teams, 'create').mockImplementation(async (teamData) => teamData as Team);
      vi.spyOn(dbProvider.teams, 'syncStaff').mockResolvedValue(undefined);

      // Tag with space and lowercase: "sn fc" -> "SN FC"
      const res1 = await createTeamService({
        name: 'Sangre Nueva FC',
        tag: 'sn fc',
        gameSlug: 'eafc26',
      }, 'usr-captain-1', 'Capitán Pro');

      expect(res1.success).toBe(true);
      expect(res1.team?.tag).toBe('SN FC');

      // Tag with accents: "krü" -> "KRÜ"
      const res2 = await createTeamService({
        name: 'KRÜ Esports',
        tag: 'krü',
        gameSlug: 'valorant',
      }, 'usr-captain-1', 'Capitán Pro');

      expect(res2.success).toBe(true);
      expect(res2.team?.tag).toBe('KRÜ');

      // Tag with hyphens and dots: "sk.t-1" -> "SK.T-1"
      const res3 = await createTeamService({
        name: 'T1 Esports',
        tag: 't-1',
        gameSlug: 'lol',
      }, 'usr-captain-1', 'Capitán Pro');

      expect(res3.success).toBe(true);
      expect(res3.team?.tag).toBe('T-1');
    });

    it('rejects invalid team tags with descriptive Spanish messages', async () => {
      // Too short (< 2)
      const resShort = await createTeamService({
        name: 'Equipo Alfa',
        tag: 'A',
        gameSlug: 'eafc26',
      }, 'usr-1', 'Capitán');
      expect(resShort.success).toBe(false);
      expect(resShort.error).toContain('El tag debe tener al menos 2 caracteres');

      // Too long (> 10)
      const resLong = await createTeamService({
        name: 'Equipo Alfa',
        tag: 'TAGDEMASIADOLARGO',
        gameSlug: 'eafc26',
      }, 'usr-1', 'Capitán');
      expect(resLong.success).toBe(false);
      expect(resLong.error).toContain('El tag no puede superar los 10 caracteres');

      // Invalid characters (e.g. $, #, @)
      const resInvalid = await createTeamService({
        name: 'Equipo Alfa',
        tag: 'TAG$#',
        gameSlug: 'eafc26',
      }, 'usr-1', 'Capitán');
      expect(resInvalid.success).toBe(false);
      expect(resInvalid.error).toContain('El tag solo puede contener letras, números, espacios, guiones y puntos');
    });
  });
});
