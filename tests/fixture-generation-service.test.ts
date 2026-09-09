import { describe, expect, it, vi } from 'vitest';
import type { IDatabaseProvider } from '@/lib/db/interfaces';
import { generateFixtureService } from '@/lib/services/competitions.service';
import { dbProvider } from '@/lib/db/provider';

describe('generateFixtureService repository compliance', () => {
  it('delegates to repositories without invoking direct SQL query or execute', async () => {
    const mockFindById = vi.fn().mockResolvedValue({
      id: 'comp-100',
      name: 'Torneo Test',
      format: 'Liga',
      matchMode: 'PartidoUnico',
    });
    const mockGetEnrolledTeams = vi.fn().mockResolvedValue([
      { team_id: 'team-1', team_name: 'Team Alpha', team_tag: 'ALP' },
      { team_id: 'team-2', team_name: 'Team Beta', team_tag: 'BET' },
      { team_id: 'team-3', team_name: 'Team Gamma', team_tag: 'GAM' },
      { team_id: 'team-4', team_name: 'Team Delta', team_tag: 'DEL' },
    ]);
    const mockDeleteByCompetition = vi.fn().mockResolvedValue(undefined);
    const mockCreateMany = vi.fn().mockResolvedValue(undefined);
    const mockUpdateCompetition = vi.fn().mockResolvedValue({ id: 'comp-100' });

    const mockQuery = vi.fn().mockImplementation(() => {
      throw new Error('Raw query should NOT be called in Supabase mode');
    });
    const mockExecute = vi.fn().mockImplementation(() => {
      throw new Error('Raw execute should NOT be called in Supabase mode');
    });

    const mockTx: Partial<IDatabaseProvider> = {
      competitions: {
        findById: mockFindById,
        getEnrolledTeams: mockGetEnrolledTeams,
        update: mockUpdateCompetition,
      } as any,
      matches: {
        deleteByCompetition: mockDeleteByCompetition,
        createMany: mockCreateMany,
      } as any,
      query: mockQuery,
      execute: mockExecute,
    };

    const spyWithTransaction = vi.spyOn(dbProvider, 'withTransaction').mockImplementation(async (cb: any) => {
      return cb(mockTx as IDatabaseProvider);
    });

    const result = await generateFixtureService('comp-100', {
      startDate: '2026-09-01',
      selectedDays: ['Martes', 'Jueves'],
      selectedTimes: ['20:00'],
      format: 'Liga',
      matchMode: 'PartidoUnico',
      groupCount: 1,
      qualifiersPerGroup: 2,
    });

    expect(result.success).toBe(true);
    expect(mockFindById).toHaveBeenCalledWith('comp-100');
    expect(mockGetEnrolledTeams).toHaveBeenCalledWith('comp-100');
    expect(mockDeleteByCompetition).toHaveBeenCalledWith('comp-100');
    expect(mockCreateMany).toHaveBeenCalledOnce();
    expect(mockUpdateCompetition).toHaveBeenCalledWith('comp-100', {
      status: 'Activo',
      format: 'Liga',
      matchMode: 'PartidoUnico',
      groupCount: 1,
      qualifiersPerGroup: 2,
    });

    // Verify raw SQL was NEVER called
    expect(mockQuery).not.toHaveBeenCalled();
    expect(mockExecute).not.toHaveBeenCalled();

    // Verify batch created matches structure
    const insertedMatches = mockCreateMany.mock.calls[0][0];
    expect(insertedMatches.length).toBeGreaterThan(0);
    expect(insertedMatches[0]).toHaveProperty('competitionId', 'comp-100');
    expect(insertedMatches[0]).toHaveProperty('status', 'PENDIENTE');
    expect(insertedMatches[0]).toHaveProperty('matchday');

    spyWithTransaction.mockRestore();
  });
});
