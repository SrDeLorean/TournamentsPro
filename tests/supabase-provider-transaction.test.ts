import { describe, expect, it, vi } from 'vitest';
import { SupabaseDatabaseProvider } from '../src/lib/db/supabase/provider';

describe('Supabase provider transaction contract', () => {
  it('never runs a multi-step operation without an atomic transaction', async () => {
    vi.restoreAllMocks();
    const provider = new SupabaseDatabaseProvider();
    const operation = vi.fn().mockResolvedValue({ success: true });

    await expect(provider.withTransaction(operation)).rejects.toThrow(/transacci[oó]n|at[oó]mica/i);
    expect(operation).not.toHaveBeenCalled();
  });

  it('does not silently ignore a requested row lock', async () => {
    const provider = new SupabaseDatabaseProvider();

    await expect(provider.users.findById('user-1', { forUpdate: true })).rejects.toThrow(/bloqueo|lock/i);
  });
});
