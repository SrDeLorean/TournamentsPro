import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { verifyToken } = vi.hoisted(() => ({ verifyToken: vi.fn() }));
vi.mock('@/lib/auth', () => ({ verifyToken }));

import { proxy } from '../src/proxy';

function protectedRequest() {
  return new NextRequest('https://tournaments.test/dashboard', {
    headers: { cookie: 'tp_session=signed-token' },
  });
}

describe('protected-route proxy', () => {
  beforeEach(() => verifyToken.mockReset());

  it('rejects a valid refresh token from the access cookie', () => {
    verifyToken.mockReturnValue({ userId: 'user-1', type: 'refresh' });
    const response = proxy(protectedRequest());
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('login=required');
  });

  it('allows an access token through the optimistic proxy check', () => {
    verifyToken.mockReturnValue({ userId: 'user-1', type: 'access' });
    const response = proxy(protectedRequest());
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });
});
