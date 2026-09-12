import { describe, expect, it, vi } from 'vitest';
import { SupabaseDatabaseProvider } from '../src/lib/db/supabase/provider';

describe('Supabase provider transaction contract', () => {
  it('delegates multi-step operations to the provider instance in Supabase REST mode', async () => {
    vi.restoreAllMocks();
    const provider = new SupabaseDatabaseProvider();
    const operation = vi.fn().mockResolvedValue({ success: true });

    const result = await provider.withTransaction(operation);
    expect(result).toEqual({ success: true });
    expect(operation).toHaveBeenCalledWith(provider);
  });

  it('allows findById with optional forUpdate flag without breaking in REST mode', async () => {
    const provider = new SupabaseDatabaseProvider();
    vi.spyOn(provider.users, 'findById').mockResolvedValue(null);

    const result = await provider.users.findById('user-1', { forUpdate: true });
    expect(result).toBeNull();
  });
});
