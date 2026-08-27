import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getRequestUserSession: vi.fn(),
  queryDB: vi.fn(),
}));

vi.mock('@/lib/auth-server', () => ({
  getRequestUserSession: mocks.getRequestUserSession,
}));

vi.mock('@/lib/db', () => ({
  queryDB: mocks.queryDB,
}));

import { GET } from '../src/app/api/auth/session/route';

describe('GET /api/auth/session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('represents an anonymous visitor as a successful empty session', async () => {
    mocks.getRequestUserSession.mockResolvedValue(null);

    const response = await GET(new Request('https://tournaments.test/api/auth/session'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: { authenticated: false, user: null },
    });
    expect(mocks.queryDB).not.toHaveBeenCalled();
  });
});
