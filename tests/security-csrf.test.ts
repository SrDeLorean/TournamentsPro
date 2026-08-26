import { describe, expect, it } from 'vitest';
import { validateMutationOrigin } from '../src/lib/security';

function request(headers: Record<string, string> = {}, method = 'POST') {
  return new Request('https://tournaments.test/api/admin/users', { method, headers });
}

describe('mutation origin validation', () => {
  it('rejects cookie-authenticated cross-origin mutations', () => {
    const result = validateMutationOrigin(request({
      cookie: 'tp_session=token',
      host: 'tournaments.test',
      origin: 'https://evil.test',
    }));
    expect(result.valid).toBe(false);
  });

  it('accepts a matching Origin and Host', () => {
    const result = validateMutationOrigin(request({
      cookie: 'tp_session=token',
      host: 'tournaments.test',
      origin: 'https://tournaments.test',
    }));
    expect(result.valid).toBe(true);
  });

  it('does not require browser Origin checks for bearer-authenticated clients', () => {
    const result = validateMutationOrigin(request({ authorization: 'Bearer token' }));
    expect(result.valid).toBe(true);
  });

  it('does not apply to safe methods', () => {
    const result = validateMutationOrigin(request({ cookie: 'tp_session=token' }, 'GET'));
    expect(result.valid).toBe(true);
  });
});
