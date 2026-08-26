import { describe, expect, it } from 'vitest';
import {
  InMemoryRateLimitStore,
  createRateLimiter,
  getRequestFingerprint,
  type RateLimitStore,
} from '../src/lib/security';

describe('persistent rate limiter', () => {
  it('keeps account limits stable across casing and surrounding whitespace', async () => {
    const limiter = createRateLimiter(new InMemoryRateLimitStore(), new InMemoryRateLimitStore());
    expect((await limiter.consume('auth-login-account', ' User@Example.test ', 1, 1_000, 1_000)).allowed).toBe(true);
    expect((await limiter.consume('auth-login-account', 'user@example.test', 1, 1_000, 1_100)).allowed).toBe(false);
  });

  it('does not trust forwarded client addresses unless TRUST_PROXY is enabled', () => {
    const previous = process.env.TRUST_PROXY;
    delete process.env.TRUST_PROXY;
    const first = getRequestFingerprint(new Request('https://tournaments.test', {
      headers: { 'x-forwarded-for': '198.51.100.1' },
    }));
    const spoofed = getRequestFingerprint(new Request('https://tournaments.test', {
      headers: { 'x-forwarded-for': '203.0.113.9' },
    }));
    process.env.TRUST_PROXY = 'true';
    const trusted = getRequestFingerprint(new Request('https://tournaments.test', {
      headers: { 'x-forwarded-for': '198.51.100.1' },
    }));
    if (previous === undefined) delete process.env.TRUST_PROXY;
    else process.env.TRUST_PROXY = previous;

    expect(first).toBe(spoofed);
    expect(trusted).not.toBe(first);
  });

  it('uses the primary store when it is available', async () => {
    const primary: RateLimitStore = {
      consume: async () => ({ allowed: true, remaining: 2, resetAt: 2_000 }),
    };
    const limiter = createRateLimiter(primary, new InMemoryRateLimitStore());
    await expect(limiter.consume('login', 'ip-1', 3, 1_000, 1_000)).resolves.toMatchObject({
      allowed: true,
      remaining: 2,
      degraded: false,
    });
  });

  it('falls back to a restrictive in-memory limiter when MySQL fails', async () => {
    const unavailable: RateLimitStore = {
      consume: async () => { throw new Error('db unavailable'); },
    };
    const limiter = createRateLimiter(unavailable, new InMemoryRateLimitStore());

    expect((await limiter.consume('login', 'ip-1', 2, 1_000, 1_000)).allowed).toBe(true);
    expect((await limiter.consume('login', 'ip-1', 2, 1_000, 1_100)).allowed).toBe(true);
    const blocked = await limiter.consume('login', 'ip-1', 2, 1_000, 1_200);
    expect(blocked.allowed).toBe(false);
    expect(blocked.degraded).toBe(true);
  });

  it('fails closed when the fallback store reaches its bounded capacity', async () => {
    const fallback = new InMemoryRateLimitStore(1);
    expect((await fallback.consume('key-1', 'login', 10, 1_000, 1_000)).allowed).toBe(true);
    expect((await fallback.consume('key-2', 'login', 10, 1_000, 1_100)).allowed).toBe(false);
  });
});
