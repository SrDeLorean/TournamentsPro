const DEFAULT_RATE_LIMIT_RETENTION_DAYS = 1;
const DEFAULT_SESSION_RETENTION_DAYS = 30;
const MAX_RETENTION_DAYS = 3650;

function retentionDays(value, fallback, name) {
  if (value === undefined || value === '') return fallback;
  if (!/^\d+$/.test(value)) throw new Error(`${name} debe ser un número entero no negativo.`);
  const days = Number(value);
  if (!Number.isSafeInteger(days) || days > MAX_RETENTION_DAYS) {
    throw new Error(`${name} debe estar entre 0 y ${MAX_RETENTION_DAYS}.`);
  }
  return days;
}

export function readSecurityRetentionConfig(environment = process.env) {
  return {
    rateLimitDays: retentionDays(
      environment.SECURITY_RATE_LIMIT_RETENTION_DAYS,
      DEFAULT_RATE_LIMIT_RETENTION_DAYS,
      'SECURITY_RATE_LIMIT_RETENTION_DAYS',
    ),
    sessionDays: retentionDays(
      environment.SECURITY_SESSION_RETENTION_DAYS,
      DEFAULT_SESSION_RETENTION_DAYS,
      'SECURITY_SESSION_RETENTION_DAYS',
    ),
  };
}

function mysqlDate(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export function buildSecurityHousekeepingPlan(now, config) {
  const dayMs = 24 * 60 * 60 * 1000;
  const rateCutoff = mysqlDate(new Date(now.getTime() - config.rateLimitDays * dayMs));
  const sessionCutoff = mysqlDate(new Date(now.getTime() - config.sessionDays * dayMs));
  return [
    {
      name: 'expired rate limits',
      sql: 'DELETE FROM security_rate_limits WHERE expires_at < ?',
      params: [rateCutoff],
    },
    {
      name: 'expired or revoked sessions',
      sql: `DELETE FROM auth_sessions
             WHERE expires_at < ? OR (revoked_at IS NOT NULL AND revoked_at < ?)`,
      params: [sessionCutoff, sessionCutoff],
    },
  ];
}
