import { describe, expect, it, vi } from 'vitest';
import { createSupabaseRateLimitStore } from '@/lib/security';

describe('Supabase rate limiter', () => {
  it('uses one atomic RPC and maps its result', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ allowed: false, remaining: 0, reset_at: 2_000 }],
      error: null,
    });
    const store = createSupabaseRateLimitStore({ rpc });

    await expect(store.consume('hash', 'login', 3, 1_000, 1_000)).resolves.toEqual({
      allowed: false,
      remaining: 0,
      resetAt: 2_000,
      retryAfter: 1,
    });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('consume_security_rate_limit', {
      p_action_name: 'login',
      p_max_requests: 3,
      p_now_ms: 1_000,
      p_rate_key: 'hash',
      p_window_ms: 1_000,
    });
  });

  it('throws on persistence errors so the restrictive fallback is used', async () => {
    const store = createSupabaseRateLimitStore({
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'RPC unavailable' } }),
    });

    await expect(store.consume('hash', 'login', 3, 1_000, 1_000)).rejects.toThrow('RPC unavailable');
  });
});
