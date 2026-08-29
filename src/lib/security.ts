// @ts-nocheck
import { createHash, randomUUID } from 'node:crypto';
import { queryDB } from './db';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (process.env.DATABASE_PROVIDER === 'supabase' && supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  : null;

import type { AuthorizationActor } from './authorization';
import { getRequestId, logger } from './logger';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1_000;
const SECRET_FIELD_PATTERN = /(password|token|credential|authorization|cookie|secret)/i;

export interface MutationOriginResult {
  valid: boolean;
  reason?: 'MISSING_ORIGIN' | 'ORIGIN_MISMATCH';
}

export function validateMutationOrigin(request: Request): MutationOriginResult {
  if (!MUTATION_METHODS.has(request.method.toUpperCase())) return { valid: true };
  if (request.headers.get('authorization')?.startsWith('Bearer ')) return { valid: true };

  const cookie = request.headers.get('cookie') || '';
  if (!/(?:^|;\s*)tp_session=/.test(cookie)) return { valid: true };

  const originHeader = request.headers.get('origin');
  if (!originHeader) return { valid: false, reason: 'MISSING_ORIGIN' };

  try {
    const origin = new URL(originHeader).origin;
    const host = request.headers.get('host') || new URL(request.url).host;
    const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
    const protocol = forwardedProto || new URL(request.url).protocol.replace(':', '');
    const allowedOrigins = new Set([
      `${protocol}://${host}`,
      process.env.APP_ORIGIN,
      process.env.NEXT_PUBLIC_APP_URL,
    ].filter((value): value is string => Boolean(value)).map((value) => new URL(value).origin));

    return allowedOrigins.has(origin)
      ? { valid: true }
      : { valid: false, reason: 'ORIGIN_MISMATCH' };
  } catch {
    return { valid: false, reason: 'ORIGIN_MISMATCH' };
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
  degraded?: boolean;
}

export interface RateLimitStore {
  consume(
    keyHash: string,
    action: string,
    maxRequests: number,
    windowMs: number,
    now: number,
  ): Promise<RateLimitResult>;
}

export class InMemoryRateLimitStore implements RateLimitStore {
  private readonly records = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly maxEntries = 10_000) {}

  async consume(keyHash: string, action: string, maxRequests: number, windowMs: number, now: number) {
    const key = `${action}:${keyHash}`;
    const current = this.records.get(key);
    if (!current && this.records.size >= this.maxEntries) {
      for (const [recordKey, record] of this.records) {
        if (record.resetAt <= now) this.records.delete(recordKey);
      }
      if (this.records.size >= this.maxEntries) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: now + windowMs,
          retryAfter: Math.max(1, Math.ceil(windowMs / 1_000)),
        };
      }
    }
    const record = !current || current.resetAt <= now
      ? { count: 1, resetAt: now + windowMs }
      : { count: current.count + 1, resetAt: current.resetAt };
    this.records.set(key, record);
    const allowed = record.count <= maxRequests;
    return {
      allowed,
      remaining: Math.max(0, maxRequests - record.count),
      resetAt: record.resetAt,
      retryAfter: allowed ? undefined : Math.max(1, Math.ceil((record.resetAt - now) / 1_000)),
    };
  }
}

export function createRateLimiter(primary: RateLimitStore, fallback: RateLimitStore) {
  return {
    async consume(
      action: string,
      identifier: string,
      maxRequests: number,
      windowMs: number,
      now = Date.now(),
    ): Promise<RateLimitResult> {
      const normalizedIdentifier = identifier.trim().toLowerCase();
      const keyHash = hashSecurityValue(`${action}:${normalizedIdentifier}`);
      try {
        const result = await primary.consume(keyHash, action, maxRequests, windowMs, now);
        return { ...result, degraded: false };
      } catch (error) {
        logger.error('security.rate_limit.persistence_failed', {
          action,
          error: error instanceof Error ? error.message : 'persistent store unavailable',
        });
        const result = await fallback.consume(keyHash, action, maxRequests, windowMs, now);
        return { ...result, degraded: true };
      }
    },
  };
}


const supabaseRateLimitStore: RateLimitStore = {
  async consume(keyHash, action, maxRequests, windowMs, now) {
    if (!supabase) throw new Error("Supabase client not initialized");
    const expiresAt = new Date(now + windowMs).toISOString();
    const windowStartedAt = new Date(now).toISOString();
    // Simplified rate limiter for supabase (Supabase RPC is better, but we do basic insert/update)
    const { data: existing } = await supabase
      .from('security_rate_limits')
      .select('request_count, window_started_at, expires_at')
      .eq('rate_key', keyHash)
      .eq('action_name', action)
      .maybeSingle();

    let request_count = 1;
    let reset_at_ms = now + windowMs;

    if (existing) {
      if (new Date(existing.expires_at).getTime() <= now) {
        request_count = 1;
      } else {
        request_count = existing.request_count + 1;
        reset_at_ms = new Date(existing.expires_at).getTime();
      }
      await supabase.from('security_rate_limits')
        .update({ request_count, window_started_at: request_count === 1 ? windowStartedAt : existing.window_started_at, expires_at: request_count === 1 ? expiresAt : existing.expires_at })
        .eq('rate_key', keyHash).eq('action_name', action);
    } else {
      await supabase.from('security_rate_limits')
        .insert({ rate_key: keyHash, action_name: action, request_count: 1, window_started_at: windowStartedAt, expires_at: expiresAt });
    }
    const allowed = request_count <= maxRequests;
    return {
      allowed,
      remaining: Math.max(0, maxRequests - request_count),
      resetAt: reset_at_ms,
      retryAfter: allowed ? undefined : Math.max(1, Math.ceil((reset_at_ms - now) / 1000))
    };
  }
};

const mysqlRateLimitStore: RateLimitStore = {
  async consume(keyHash, action, maxRequests, windowMs, now) {
    const expiresAt = toMysqlDate(now + windowMs);
    const windowStartedAt = toMysqlDate(now);
    
    if (process.env.DATABASE_PROVIDER === 'supabase' && supabase) {
      await supabase.from('security_audit_log').insert({
        id: auditId,
        request_id: requestId,
        actor_user_id: event?.actor.userId,
        actor_role: event?.actor.role,
        action_name: event?.action,
        resource_type: event?.resourceType,
        resource_id: event?.resourceId || null,
        organization_id: event?.organizationId ?? event?.actor.organizationId,
        outcome: event?.outcome || 'SUCCESS',
        metadata_json: metadata,
        ip_hash: event?.request ? getRequestFingerprint(event?.request) : null,
        user_agent_hash: event?.request?.headers.get('user-agent') ? hashSecurityValue(event?.request.headers.get('user-agent') || '') : null
      });
      return;
    }

    await queryDB(
      `INSERT INTO security_rate_limits
        (rate_key, action_name, request_count, window_started_at, expires_at)
       VALUES (?, ?, 1, ?, ?)
       ON DUPLICATE KEY UPDATE
         request_count = IF(expires_at <= VALUES(window_started_at), 1, request_count + 1),
         window_started_at = IF(expires_at <= VALUES(window_started_at), VALUES(window_started_at), window_started_at),
         expires_at = IF(expires_at <= VALUES(window_started_at), VALUES(expires_at), expires_at)`,
      [keyHash, action, windowStartedAt, expiresAt],
    );
    const rows = await queryDB<{ request_count: number; reset_at_ms: number }>(
      `SELECT request_count, UNIX_TIMESTAMP(expires_at) * 1000 AS reset_at_ms
         FROM security_rate_limits WHERE rate_key = ? AND action_name = ? LIMIT 1`,
      [keyHash, action],
    );
    const count = Number(rows[0]?.request_count || maxRequests + 1);
    const resetAt = Number(rows[0]?.reset_at_ms || now + windowMs);
    const allowed = count <= maxRequests;
    return {
      allowed,
      remaining: Math.max(0, maxRequests - count),
      resetAt,
      retryAfter: allowed ? undefined : Math.max(1, Math.ceil((resetAt - now) / 1_000)),
    };
  },
};

const securityRateLimiter = createRateLimiter(process.env.DATABASE_PROVIDER === 'supabase' ? supabaseRateLimitStore : mysqlRateLimitStore, new InMemoryRateLimitStore());

export function consumeSecurityRateLimit(
  action: string,
  identifier: string,
  maxRequests: number,
  windowMs: number,
) {
  return securityRateLimiter.consume(action, identifier, maxRequests, windowMs);
}

export function getRequestFingerprint(request: Request): string {
  return hashSecurityValue(getTrustedClientAddress(request) || 'client-address-unavailable');
}

export function getTrustedClientAddress(request: Request): string | null {
  if (process.env.TRUST_PROXY !== 'true') return null;
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')?.trim()
    || null;
}

export interface SessionRecord {
  sessionId: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  revokedAt: number | null;
  ipHash?: string | null;
  userAgentHash?: string | null;
}

export interface SessionStore {
  create(record: SessionRecord): Promise<void>;
  isActive(sessionId: string, userId: string, now: number): Promise<boolean>;
  revokeSession(sessionId: string, revokedAt: number): Promise<void>;
  revokeUser(userId: string, revokedAt: number): Promise<void>;
}

export function createSessionRegistry(
  store: SessionStore,
  dependencies: { now?: () => number; id?: () => string } = {},
) {
  const now = dependencies.now || Date.now;
  const id = dependencies.id || randomUUID;
  return {
    async create(userId: string, ttlMs = SESSION_TTL_MS, metadata: Partial<SessionRecord> = {}) {
      const createdAt = now();
      const record: SessionRecord = {
        sessionId: id(),
        userId,
        createdAt,
        expiresAt: createdAt + ttlMs,
        revokedAt: null,
        ipHash: metadata.ipHash || null,
        userAgentHash: metadata.userAgentHash || null,
      };
      await store.create(record);
      return record;
    },
    isActive(sessionId: string, userId: string) {
      return store.isActive(sessionId, userId, now());
    },
    revokeSession(sessionId: string) {
      return store.revokeSession(sessionId, now());
    },
    revokeUser(userId: string) {
      return store.revokeUser(userId, now());
    },
  };
}


const supabaseSessionStore: SessionStore = {
  async create(record) {
    if (!supabase) throw new Error("Supabase missing");
    await supabase.from('auth_sessions').insert({
      session_id: record.sessionId,
      user_id: record.userId,
      expires_at: new Date(record.expiresAt).toISOString(),
      ip_hash: record.ipHash,
      user_agent_hash: record.userAgentHash
    });
  },
  async isActive(sessionId, userId, now) {
    if (!supabase) throw new Error("Supabase missing");
    const { data } = await supabase.from('auth_sessions')
      .select('session_id')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .is('revoked_at', null)
      .gt('expires_at', new Date(now).toISOString())
      .maybeSingle();
    return !!data;
  },
  async revokeSession(sessionId, revokedAt) {
    if (!supabase) return;
    await supabase.from('auth_sessions')
      .update({ revoked_at: new Date(revokedAt).toISOString() })
      .eq('session_id', sessionId)
      .is('revoked_at', null);
  },
  async revokeUser(userId, revokedAt) {
    if (!supabase) return;
    await supabase.from('auth_sessions')
      .update({ revoked_at: new Date(revokedAt).toISOString() })
      .eq('user_id', userId)
      .is('revoked_at', null);
  }
};

const mysqlSessionStore: SessionStore = {
  async create(record) {
    await queryDB(
      `INSERT INTO auth_sessions
        (session_id, user_id, expires_at, ip_hash, user_agent_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [record.sessionId, record.userId, toMysqlDate(record.expiresAt), record.ipHash, record.userAgentHash],
    );
  },
  async isActive(sessionId, userId, now) {
    const rows = await queryDB<{ active: number }>(
      `SELECT EXISTS(
         SELECT 1 FROM auth_sessions
          WHERE session_id = ? AND user_id = ? AND revoked_at IS NULL
            AND expires_at > ?
       ) AS active`,
      [sessionId, userId, toMysqlDate(now)],
    );
    return Boolean(rows[0]?.active);
  },
  async revokeSession(sessionId, revokedAt) {
    await queryDB(
      'UPDATE auth_sessions SET revoked_at = COALESCE(revoked_at, ?) WHERE session_id = ?',
      [toMysqlDate(revokedAt), sessionId],
    );
  },
  async revokeUser(userId, revokedAt) {
    await queryDB(
      'UPDATE auth_sessions SET revoked_at = COALESCE(revoked_at, ?) WHERE user_id = ? AND revoked_at IS NULL',
      [toMysqlDate(revokedAt), userId],
    );
  },
};

const sessionRegistry = createSessionRegistry(process.env.DATABASE_PROVIDER === 'supabase' ? supabaseSessionStore : mysqlSessionStore);

export function createAuthSession(userId: string, request: Request) {
  const userAgent = request.headers.get('user-agent');
  return sessionRegistry.create(userId, SESSION_TTL_MS, {
    ipHash: getRequestFingerprint(request),
    userAgentHash: userAgent ? hashSecurityValue(userAgent) : null,
  });
}

export function createServiceAuthSession(userId: string) {
  return sessionRegistry.create(userId, SESSION_TTL_MS);
}

export function isAuthSessionActive(sessionId: string, userId: string) {
  if (!sessionId || !userId) return Promise.resolve(false);
  return sessionRegistry.isActive(sessionId, userId);
}

export function revokeAuthSession(sessionId: string) {
  return sessionRegistry.revokeSession(sessionId);
}

export function revokeUserSessions(userId: string) {
  return sessionRegistry.revokeUser(userId);
}

export function shouldRevokeUserSessions(update: {
  action?: unknown;
  isBanned?: unknown;
  status?: unknown;
  passwordChanged?: boolean;
}): boolean {
  const action = typeof update.action === 'string' ? update.action.trim().toUpperCase() : '';
  const status = typeof update.status === 'string' ? update.status.trim().toLowerCase() : '';
  const explicitlyBanned = update.isBanned === true
    || update.isBanned === 1
    || update.isBanned === '1'
    || update.isBanned === 'true';

  return action === 'BAN'
    || explicitlyBanned
    || status === 'baneado'
    || status === 'suspendido'
    || update.passwordChanged === true;
}

export interface SecurityAuditEvent {
  actor: AuthorizationActor;
  request?: Request;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  organizationId?: string | null;
  outcome?: 'SUCCESS' | 'DENIED' | 'FAILED';
  metadata?: Record<string, unknown>;
}

export function sanitizeAuditMetadata(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeAuditMetadata);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [
    key,
    SECRET_FIELD_PATTERN.test(key) ? '[REDACTED]' : sanitizeAuditMetadata(nestedValue),
  ]));
}

export async function writeSecurityAudit(event: SecurityAuditEvent): Promise<void> {
  const auditId = randomUUID();
  const requestId = event?.request ? getRequestId(event?.request) : null;
  const metadata = sanitizeAuditMetadata(event.metadata || {});
  try {
    await queryDB(
      `INSERT INTO security_audit_log
        (id, request_id, actor_user_id, actor_role, action_name, resource_type, resource_id,
         organization_id, outcome, metadata_json, ip_hash, user_agent_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        auditId,
        requestId,
        event?.actor.userId,
        event?.actor.role,
        event?.action,
        event?.resourceType,
        event?.resourceId || null,
        event?.organizationId ?? event?.actor.organizationId,
        event?.outcome || 'SUCCESS',
        JSON.stringify(metadata),
        event?.request ? getRequestFingerprint(event?.request) : null,
        event?.request?.headers.get('user-agent')
          ? hashSecurityValue(event?.request.headers.get('user-agent') || '')
          : null,
      ],
    );
  } catch (error) {
    logger.error('security.audit.persistence_failed', {
      id: auditId,
      requestId,
      actorUserId: event?.actor.userId,
      actorRole: event?.actor.role,
      action: event?.action,
      resourceType: event?.resourceType,
      resourceId: event?.resourceId || null,
      organizationId: event?.organizationId ?? event?.actor.organizationId,
      outcome: event?.outcome || 'SUCCESS',
      metadata,
      error: error instanceof Error ? error.message : 'audit persistence failed',
    });
  }
}

function hashSecurityValue(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function toMysqlDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 19).replace('T', ' ');
}
