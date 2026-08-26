import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const transaction = {
    queryRows: vi.fn(),
    executeCommand: vi.fn(),
  };
  return {
    transaction,
    withTransaction: vi.fn(async (operation: (tx: typeof transaction) => Promise<unknown>) => operation(transaction)),
  };
});

vi.mock('@/lib/db', () => ({
  queryDB: vi.fn(),
  withTransaction: mocks.withTransaction,
  executeCas: vi.fn(async (executor, sql, params, message) => {
    const result = await executor.executeCommand(sql, params);
    if (result.affectedRows !== 1) throw new Error(message);
    return result;
  }),
}));

vi.mock('@/lib/repositories', () => ({
  userRepository: {},
  organizationRepository: {},
  teamRepository: {},
  competitionRepository: {},
  seasonRepository: {},
}));

import {
  addPlayerToSquadService,
  cancelTransferOfferService,
  cancelTransferPostService,
  createManagedOrganizationService,
  createTeamService,
  createTransferApplicationService,
  createTransferPostService,
  approveExtraordinaryTransferService,
  generateFixtureService,
  respondPlayerContractOfferService,
  respondOrdinaryTransferApplicationService,
  submitMatchReportService,
  updateManagedOrganizationService,
  updateManagedTeamService,
} from '../src/lib/services';

describe('transactional services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.executeCommand.mockResolvedValue({ affectedRows: 1 });
  });

  it('locks the team and membership before adding a squad member', async () => {
    mocks.transaction.queryRows
      .mockResolvedValueOnce([{ position: 'DFC' }])
      .mockResolvedValueOnce([{ organization_id: 'org-1' }])
      .mockResolvedValueOnce([]);

    const result = await addPlayerToSquadService('team-1', 'user-1', 'DFC');

    expect(result).toEqual({ success: true });
    expect(mocks.withTransaction).toHaveBeenCalledOnce();
    expect(mocks.transaction.queryRows.mock.calls[0][0]).toContain('FOR UPDATE');
    expect(mocks.transaction.queryRows.mock.calls[1][0]).toContain('FOR UPDATE');
    expect(mocks.transaction.queryRows.mock.calls[2][0]).toContain('FOR UPDATE');
    expect(mocks.transaction.executeCommand.mock.calls.some(([sql]) => sql.includes('INSERT INTO team_members'))).toBe(true);
    expect(mocks.transaction.executeCommand.mock.calls.some(([sql]) => sql.includes('members_count'))).toBe(true);
  });

  it('approves an extraordinary transfer with a state CAS and atomic audit log', async () => {
    mocks.transaction.queryRows
      .mockResolvedValueOnce([{
        id: 'app-1',
        status: 'PENDIENTE',
        organizer_approval_status: 'PENDIENTE_ORGANIZADOR',
        team_id: 'team-1',
        applicant_user_id: 'user-1',
        game_slug: 'eafc26',
        position: 'DFC',
      }])
      .mockResolvedValueOnce([{ id: 'user-1' }])
      .mockResolvedValueOnce([{ name: 'Equipo' }])
      .mockResolvedValueOnce([{ total: 3 }])
      .mockResolvedValueOnce([]);

    const result = await approveExtraordinaryTransferService('app-1', 'organizer-1');

    expect(result).toEqual({ success: true });
    const statements = mocks.transaction.executeCommand.mock.calls.map(([sql]) => String(sql));
    expect(statements.some((sql) => sql.includes("status = 'PENDIENTE'") && sql.includes('organizer_approval_status'))).toBe(true);
    expect(statements.some((sql) => sql.includes('INSERT INTO transfer_history_logs'))).toBe(true);
    expect(mocks.transaction.queryRows.mock.calls[0][0]).toContain('FOR UPDATE');
  });

  it('rejects a duplicated offer response when the CAS affects no rows', async () => {
    mocks.transaction.executeCommand.mockResolvedValueOnce({ affectedRows: 0 });

    const result = await respondPlayerContractOfferService('offer-1', 'user-1', false);

    expect(result.success).toBe(false);
    expect(result.error).toContain('procesada');
  });

  it('deletes and recreates a fixture inside one locked transaction', async () => {
    mocks.transaction.queryRows
      .mockResolvedValueOnce([{ id: 'comp-1' }])
      .mockResolvedValueOnce([
        { team_id: 'team-1', team_name: 'Uno', team_tag: 'UNO' },
        { team_id: 'team-2', team_name: 'Dos', team_tag: 'DOS' },
      ]);

    const result = await generateFixtureService('comp-1', {
      startDate: '2026-08-22',
      selectedDays: ['Sábado'],
      selectedTimes: ['20:00'],
      matchMode: 'PartidoUnico',
      format: 'Liga',
      groupCount: 1,
      qualifiersPerGroup: 1,
    });

    expect(result.success).toBe(true);
    const statements = mocks.transaction.executeCommand.mock.calls.map(([sql]) => String(sql));
    expect(statements[0]).toContain('DELETE FROM matches');
    expect(statements.some((sql) => sql.includes('INSERT INTO matches'))).toBe(true);
    expect(statements.at(-1)).toContain('UPDATE competitions');
  });

  it('keeps generated fixture identifiers within the matches VARCHAR(64)', async () => {
    const longTeamId = '12345678-1234-1234-1234-123456789012';
    mocks.transaction.queryRows
      .mockResolvedValueOnce([{ id: 'competition-with-a-long-identifier' }])
      .mockResolvedValueOnce([
        { team_id: longTeamId, team_name: 'Uno', team_tag: 'UNO' },
        { team_id: '87654321-4321-4321-4321-210987654321', team_name: 'Dos', team_tag: 'DOS' },
      ]);

    await generateFixtureService('competition-with-a-long-identifier', {
      startDate: '2026-08-22',
      selectedDays: ['Sábado'],
      selectedTimes: ['20:00'],
      matchMode: 'PartidoUnico',
      format: 'Liga',
      groupCount: 1,
      qualifiersPerGroup: 1,
    });

    const insert = mocks.transaction.executeCommand.mock.calls.find(([sql]) => String(sql).includes('INSERT INTO matches'));
    expect(insert).toBeDefined();
    expect(String(insert?.[1]?.[0]).length).toBeLessThanOrEqual(64);
  });

  it('stores a report, match state and player stats in one transaction', async () => {
    mocks.transaction.queryRows.mockResolvedValueOnce([{ id: 'match-1', status: 'PENDIENTE' }]);

    const result = await submitMatchReportService({
      matchId: 'match-1',
      reportedByUserId: 'captain-1',
      scoreHome: 2,
      scoreAway: 1,
      playerStats: [{
        userId: 'user-1', teamId: 'team-1', goals: 2, assists: 0,
        yellowCards: 0, redCards: 0, rating: 9, isMvp: true,
      }],
    });

    expect(result.success).toBe(true);
    expect(mocks.transaction.queryRows.mock.calls[0][0]).toContain('FOR UPDATE');
    const statements = mocks.transaction.executeCommand.mock.calls.map(([sql]) => String(sql));
    expect(statements.some((sql) => sql.includes('INSERT INTO match_reports'))).toBe(true);
    expect(statements.some((sql) => sql.includes('UPDATE matches'))).toBe(true);
    expect(statements.some((sql) => sql.includes('INSERT INTO match_player_stats'))).toBe(true);
  });

  it('rejects a stale report after another request changed the match state', async () => {
    mocks.transaction.queryRows.mockResolvedValueOnce([{ id: 'match-1', status: 'PENDIENTE' }]);
    mocks.transaction.executeCommand
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce({ affectedRows: 0 });

    await expect(submitMatchReportService({
      matchId: 'match-1',
      reportedByUserId: 'captain-1',
      scoreHome: 1,
      scoreAway: 0,
    })).rejects.toThrow('reportado o finalizado');
  });

  it('creates one ordinary transfer application after locking capacity and duplicates', async () => {
    mocks.transaction.queryRows
      .mockResolvedValueOnce([{ id: 'team-1', max_members: 20 }])
      .mockResolvedValueOnce([{ id: 'user-1' }])
      .mockResolvedValueOnce([{ total: 2 }])
      .mockResolvedValueOnce([]);

    const result = await createTransferApplicationService({
      teamId: 'team-1', userId: 'user-1', gameSlug: 'eafc26', position: 'DFC', type: 'POSTULACION_JUGADOR',
    });

    expect(result.success).toBe(true);
    expect(mocks.transaction.queryRows.mock.calls.every(([sql]) => String(sql).includes('FOR UPDATE'))).toBe(true);
    expect(mocks.transaction.executeCommand.mock.calls.at(-1)?.[0]).toContain('INSERT INTO transfer_applications');
  });

  it('accepts an ordinary application with a state CAS, roster move and audit history', async () => {
    mocks.transaction.queryRows
      .mockResolvedValueOnce([{
        id: 'app-1', team_id: 'team-2', applicant_user_id: 'user-1', game_slug: 'eafc26', position: 'DFC',
        status: 'PENDIENTE', organizer_approval_status: 'NINGUNO',
      }])
      .mockResolvedValueOnce([{ id: 'user-1' }])
      .mockResolvedValueOnce([{ id: 'team-2', name: 'Destino', max_members: 20 }])
      .mockResolvedValueOnce([{ total: 2 }])
      .mockResolvedValueOnce([{ id: 'team-1', name: 'Origen' }]);

    const result = await respondOrdinaryTransferApplicationService('app-1', 'manager-1', true);

    expect(result.success).toBe(true);
    const statements = mocks.transaction.executeCommand.mock.calls.map(([sql]) => String(sql));
    expect(statements.some((sql) => sql.includes("organizer_approval_status = 'NINGUNO'"))).toBe(true);
    expect(statements.some((sql) => sql.includes('DELETE FROM team_members'))).toBe(true);
    expect(statements.some((sql) => sql.includes('INSERT INTO transfer_history_logs'))).toBe(true);
  });

  it('cancels only a still-pending contract offer', async () => {
    mocks.transaction.queryRows.mockResolvedValueOnce([{ id: 'offer-1', team_id: 'team-1' }]);

    const result = await cancelTransferOfferService('offer-1', 'team-1');

    expect(result.success).toBe(true);
    expect(mocks.transaction.queryRows.mock.calls[0][0]).toContain('FOR UPDATE');
    expect(mocks.transaction.executeCommand.mock.calls[0][0]).toContain("status = 'PENDIENTE'");
  });

  it('replaces an active market post atomically and can cancel it with CAS', async () => {
    mocks.transaction.queryRows
      .mockResolvedValueOnce([{ id: 'user-1' }])
      .mockResolvedValueOnce([{ id: 'post-old' }]);

    const created = await createTransferPostService({
      gameSlug: 'eafc26', type: 'JUGADOR_BUSCA_CLUB', userId: 'user-1', userName: 'Uno',
      userGamertag: 'UNO', position: 'DFC', platform: 'PS5', message: 'Disponible',
    });
    expect(created.success).toBe(true);

    mocks.transaction.queryRows.mockResolvedValueOnce([{ id: 'post-new', user_id: 'user-1', team_id: null }]);
    const cancelled = await cancelTransferPostService('post-new', 'user-1');
    expect(cancelled.success).toBe(true);
    expect(mocks.transaction.executeCommand.mock.calls.at(-1)?.[0]).toContain("status = 'ACTIVO'");
  });

  it('creates a team and captain membership in one transaction', async () => {
    mocks.transaction.queryRows
      .mockResolvedValueOnce([{ id: 'captain-1' }])
      .mockResolvedValueOnce([]);

    const result = await createTeamService({ name: 'Equipo Uno', tag: 'UNO', gameSlug: 'eafc26' }, 'captain-1', 'Capitán');

    expect(result.success).toBe(true);
    const statements = mocks.transaction.executeCommand.mock.calls.map(([sql]) => String(sql));
    expect(statements.some((sql) => sql.includes('INSERT INTO teams'))).toBe(true);
    expect(statements.some((sql) => sql.includes('INSERT INTO team_members'))).toBe(true);
  });

  it('creates an organization and all organizer assignments atomically', async () => {
    mocks.transaction.queryRows
      .mockResolvedValueOnce([{ id: 'owner-1' }])
      .mockResolvedValueOnce([{ id: 'organizer-1' }, { id: 'organizer-2' }])
      .mockResolvedValueOnce([]);

    const result = await createManagedOrganizationService({
      name: 'Liga Uno', tag: 'LUNO', ownerId: 'owner-1', organizerIds: ['organizer-1', 'organizer-2'],
    });

    expect(result.success).toBe(true);
    const statements = mocks.transaction.executeCommand.mock.calls.map(([sql]) => String(sql));
    expect(statements.some((sql) => sql.includes('INSERT INTO organizations'))).toBe(true);
    expect(statements.filter((sql) => sql.includes('UPDATE users SET organization_id')).length).toBe(2);
  });

  it('edits organization fields and organizer assignments under locks', async () => {
    mocks.transaction.queryRows
      .mockResolvedValueOnce([{ id: 'org-1' }])
      .mockResolvedValueOnce([{ id: 'organizer-1' }])
      .mockResolvedValueOnce([{ id: 'organizer-old' }]);

    const result = await updateManagedOrganizationService('org-1', {
      name: 'Liga Editada', organizerIds: ['organizer-1'],
    });

    expect(result.success).toBe(true);
    const statements = mocks.transaction.executeCommand.mock.calls.map(([sql]) => String(sql));
    expect(statements.some((sql) => sql.includes('UPDATE organizations'))).toBe(true);
    expect(statements.some((sql) => sql.includes('organization_id = NULL'))).toBe(true);
  });

  it('edits a team and replaces only its management assignments atomically', async () => {
    mocks.transaction.queryRows
      .mockResolvedValueOnce([{ id: 'team-1', captain_id: 'captain-old' }])
      .mockResolvedValueOnce([{ id: 'captain-new' }, { id: 'manager-1' }])
      .mockResolvedValueOnce([{ id: 'membership-old' }]);

    const result = await updateManagedTeamService('team-1', {
      name: 'Equipo Editado', captainId: 'captain-new', managerIds: ['manager-1'],
    });

    expect(result.success).toBe(true);
    const statements = mocks.transaction.executeCommand.mock.calls.map(([sql]) => String(sql));
    expect(statements.some((sql) => sql.includes('UPDATE teams'))).toBe(true);
    expect(statements.some((sql) => sql.includes('DELETE FROM team_members') && sql.includes('role_in_team'))).toBe(true);
  });
});
