import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findByEmailOrGamertag: vi.fn(),
  verifyPassword: vi.fn(),
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
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  verifyPassword: mocks.verifyPassword,
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

import { POST } from '../src/app/api/auth/login/route';

const user = {
  id: 'user-1',
  email: 'captain@example.com',
  passwordHash: '$2b$12$password-hash',
  googleId: null,
  name: 'Captain One',
  gamertag: 'Capeafc261',
  role: 'Capitán',
  primaryGameSlug: 'eafc26',
  platform: 'CROSSPLAY',
  position: 'DFC',
  secondaryPosition: null,
  rankBadge: 'División 1',
  rating: 9,
  status: 'Activo',
  avatarUrl: null,
  bannerUrl: null,
  organizationId: null,
  isBanned: false,
  banReason: null,
  lastLoginAt: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

function loginRequest(identifier = '  CAPEAFC261  ', password = 'secret-password') {
  return new Request('https://tournaments.test/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ emailOrGamertag: identifier, password }),
  });
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTrustedClientAddress.mockReturnValue(null);
    mocks.consumeSecurityRateLimit.mockResolvedValue({ allowed: true, retryAfter: 0 });
    mocks.authorizationErrorResponse.mockReturnValue(null);
    mocks.createAuthSession.mockResolvedValue({ sessionId: 'session-1' });
    mocks.signToken.mockReturnValue('signed-token');
  });

  it('resolves a normalized email or gamertag through the repository contract', async () => {
    mocks.findByEmailOrGamertag.mockResolvedValue(user);
    mocks.verifyPassword.mockResolvedValue(true);

    const response = await POST(loginRequest());

    expect(response.status).toBe(200);
    expect(mocks.findByEmailOrGamertag).toHaveBeenCalledOnce();
    expect(mocks.findByEmailOrGamertag).toHaveBeenCalledWith('capeafc261');
    expect(response.headers.get('set-cookie')).toContain('tp_session=signed-token');
  });

  it('returns the same correctly encoded error for an unknown account and a bad password', async () => {
    mocks.findByEmailOrGamertag.mockResolvedValueOnce(null).mockResolvedValueOnce(user);
    mocks.verifyPassword.mockResolvedValue(false);

    const unknownResponse = await POST(loginRequest());
    const badPasswordResponse = await POST(loginRequest());

    expect(unknownResponse.status).toBe(401);
    expect(badPasswordResponse.status).toBe(401);
    await expect(unknownResponse.json()).resolves.toMatchObject({
      error: 'Credenciales inválidas. Verifica tu email/gamertag y contraseña.',
      code: 'INVALID_CREDENTIALS',
    });
    await expect(badPasswordResponse.json()).resolves.toMatchObject({
      error: 'Credenciales inválidas. Verifica tu email/gamertag y contraseña.',
      code: 'INVALID_CREDENTIALS',
    });
  });
});
