import { describe, expect, it } from 'vitest';
import {
  buildSecurityHousekeepingPlan,
  readSecurityRetentionConfig,
} from '../database/security-housekeeping-core.mjs';

describe('security housekeeping', () => {
  it('uses bounded configurable retention periods', () => {
    expect(readSecurityRetentionConfig({
      SECURITY_RATE_LIMIT_RETENTION_DAYS: '2',
      SECURITY_SESSION_RETENTION_DAYS: '45',
    })).toEqual({ rateLimitDays: 2, sessionDays: 45 });
    expect(() => readSecurityRetentionConfig({ SECURITY_SESSION_RETENTION_DAYS: '-1' })).toThrow();
    expect(() => readSecurityRetentionConfig({ SECURITY_RATE_LIMIT_RETENTION_DAYS: 'forever' })).toThrow();
  });

  it('builds parameterized cleanup statements for expired limits and sessions', () => {
    const plan = buildSecurityHousekeepingPlan(
      new Date('2026-08-22T12:00:00.000Z'),
      { rateLimitDays: 1, sessionDays: 30 },
    );
    expect(plan).toHaveLength(2);
    expect(plan[0].sql).toContain('DELETE FROM security_rate_limits');
    expect(plan[1].sql).toContain('DELETE FROM auth_sessions');
    expect(plan.every((operation) => operation.params.length > 0)).toBe(true);
  });
});
