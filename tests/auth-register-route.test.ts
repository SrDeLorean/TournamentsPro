import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findByEmailOrGamertag: vi.fn(),
  create: vi.fn(),
  hashPassword: vi.fn(),
  signToken: vi.fn(),
  requireValidMutationOrigin: vi.fn(),
  authorizationErrorResponse: vi.fn(),
  consumeSecurityRateLimit: vi.fn(),
  createAuthSession: vi.fn(),
  getTrustedClientAddress: vi.fn(),
}));

vi.mock('@/lib/db/provider', () => ({
  dbProvider: {
    users: {
      findByEmailOrGamertag: mocks.findByEmailOrGamertag,
      create: mocks.create,
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  hashPassword: mocks.hashPassword,
  signToken: mocks.signToken,
}));

vi.mock('@/lib/auth-server', () => ({
  requireValidMutationOrigin: mocks.requireValidMutationOrigin,
  authorizationErrorResponse: mocks.authorizationErrorResponse,
}));

vi.mock('@/lib/security', () => ({
  consumeSecurityRateLimit: mocks.consumeSecurityRateLimit,
  createAuthSession: mocks.createAuthSession,
  getTrustedClientAddress: mocks.getTrustedClientAddress,
}));

import { POST } from '../src/app/api/auth/register/route';

function registerRequest(body: Record<string, unknown>) {
  return new Request('https://tournaments.test/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTrustedClientAddress.mockReturnValue(null);
    mocks.consumeSecurityRateLimit.mockResolvedValue({ allowed: true, retryAfter: 0 });
    mocks.authorizationErrorResponse.mockReturnValue(null);
    mocks.findByEmailOrGamertag.mockResolvedValue(null);
    mocks.hashPassword.mockResolvedValue('$2b$12$password-hash');
    mocks.createAuthSession.mockResolvedValue({ sessionId: 'session-1' });
    mocks.signToken.mockReturnValue('signed-token');
  });

  it('returns an actionable validation error instead of a generic 400', async () => {
    const response = await POST(registerRequest({
      gamertag: 'Capeafc261',
      email: 'captain@example.com',
      password: 'abcdefghij',
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'La contraseña debe incluir al menos una letra y un número.',
      code: 'VALIDATION_ERROR',
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('creates a normalized player account and starts a session', async () => {
    const response = await POST(registerRequest({
      gamertag: '  Capeafc261  ',
      name: '  Capitán Uno  ',
      email: '  CAPTAIN@EXAMPLE.COM  ',
      password: 'secure-pass-2026',
      primaryGame: 'eafc26',
      platform: 'PS5',
      role: 'Organizador',
    }));

    expect(response.status).toBe(200);
    expect(mocks.findByEmailOrGamertag).toHaveBeenCalledTimes(2);
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'captain@example.com',
      gamertag: 'Capeafc261',
      name: 'Capitán Uno',
      role: 'Jugador',
      passwordHash: '$2b$12$password-hash',
    }));
    expect(response.headers.get('set-cookie')).toContain('tp_session=signed-token');
  });
});
