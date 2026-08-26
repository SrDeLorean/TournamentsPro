import { describe, expect, it } from 'vitest';
import { sanitizeAuditMetadata } from '../src/lib/security';

describe('structured audit metadata', () => {
  it('redacts nested credentials while preserving operational context', () => {
    expect(sanitizeAuditMetadata({
      action: 'BAN',
      targetId: 'user-1',
      password: 'secret',
      nested: { authorization: 'Bearer secret', reason: 'abuse' },
    })).toEqual({
      action: 'BAN',
      targetId: 'user-1',
      password: '[REDACTED]',
      nested: { authorization: '[REDACTED]', reason: 'abuse' },
    });
  });
});
