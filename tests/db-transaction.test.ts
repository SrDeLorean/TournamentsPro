import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const connection = {
    beginTransaction: vi.fn(),
    commit: vi.fn(),
    rollback: vi.fn(),
    release: vi.fn(),
    execute: vi.fn(),
  };
  const pool = {
    getConnection: vi.fn(async () => connection),
    execute: vi.fn(),
  };
  return { connection, pool };
});

vi.mock('mysql2/promise', () => ({
  default: { createPool: vi.fn(() => mocks.pool) },
}));

import { executeCas, withTransaction } from '../src/lib/db';

describe('withTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.connection.execute.mockResolvedValue([[], []]);
  });

  it('uses one dedicated connection and commits successful work', async () => {
    const result = await withTransaction(async (transaction) => {
      await transaction.queryRows('SELECT id FROM teams WHERE id = ? FOR UPDATE', ['team-1']);
      return 'ok';
    });

    expect(result).toBe('ok');
    expect(mocks.pool.getConnection).toHaveBeenCalledOnce();
    expect(mocks.connection.beginTransaction).toHaveBeenCalledOnce();
    expect(mocks.connection.execute).toHaveBeenCalledWith(
      'SELECT id FROM teams WHERE id = ? FOR UPDATE',
      ['team-1'],
    );
    expect(mocks.connection.commit).toHaveBeenCalledOnce();
    expect(mocks.connection.rollback).not.toHaveBeenCalled();
    expect(mocks.connection.release).toHaveBeenCalledOnce();
  });

  it('rolls back and releases the same connection when work fails', async () => {
    await expect(withTransaction(async () => {
      throw new Error('fallo');
    })).rejects.toThrow('fallo');

    expect(mocks.connection.commit).not.toHaveBeenCalled();
    expect(mocks.connection.rollback).toHaveBeenCalledOnce();
    expect(mocks.connection.release).toHaveBeenCalledOnce();
  });
});

describe('executeCas', () => {
  it('returns the result when exactly one row wins the compare-and-set', async () => {
    const executor = {
      queryRows: vi.fn(),
      executeCommand: vi.fn(async () => ({ affectedRows: 1 })),
    };

    await expect(executeCas(executor as never, 'UPDATE offers SET status = ?', ['ACEPTADO'], 'conflict'))
      .resolves.toMatchObject({ affectedRows: 1 });
  });

  it('rejects stale or duplicated writes when no row was affected', async () => {
    const executor = {
      queryRows: vi.fn(),
      executeCommand: vi.fn(async () => ({ affectedRows: 0 })),
    };

    await expect(executeCas(executor as never, 'UPDATE offers SET status = ?', ['ACEPTADO'], 'conflict'))
      .rejects.toThrow('conflict');
  });
});
