const fs = require('fs');
let code = fs.readFileSync('src/lib/security.ts', 'utf8');

const imports = `import { queryDB } from './db';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (process.env.DATABASE_PROVIDER === 'supabase' && supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  : null;
`;
code = code.replace(`import { queryDB } from './db';`, imports);

const rateLimiterSupabase = `
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
`;
code = code.replace('const mysqlRateLimitStore: RateLimitStore = {', rateLimiterSupabase + '\nconst mysqlRateLimitStore: RateLimitStore = {');
code = code.replace('const securityRateLimiter = createRateLimiter(mysqlRateLimitStore, new InMemoryRateLimitStore());', `const securityRateLimiter = createRateLimiter(process.env.DATABASE_PROVIDER === 'supabase' ? supabaseRateLimitStore : mysqlRateLimitStore, new InMemoryRateLimitStore());`);

const sessionSupabase = `
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
`;
code = code.replace('const mysqlSessionStore: SessionStore = {', sessionSupabase + '\nconst mysqlSessionStore: SessionStore = {');
code = code.replace('const sessionRegistry = createSessionRegistry(mysqlSessionStore);', `const sessionRegistry = createSessionRegistry(process.env.DATABASE_PROVIDER === 'supabase' ? supabaseSessionStore : mysqlSessionStore);`);

const auditSupabase = `
    if (process.env.DATABASE_PROVIDER === 'supabase' && supabase) {
      await supabase.from('security_audit_log').insert({
        id: auditId,
        request_id: requestId,
        actor_user_id: event.actor.userId,
        actor_role: event.actor.role,
        action_name: event.action,
        resource_type: event.resourceType,
        resource_id: event.resourceId || null,
        organization_id: event.organizationId ?? event.actor.organizationId,
        outcome: event.outcome || 'SUCCESS',
        metadata_json: metadata,
        ip_hash: event.request ? getRequestFingerprint(event.request) : null,
        user_agent_hash: event.request?.headers.get('user-agent') ? hashSecurityValue(event.request.headers.get('user-agent') || '') : null
      });
      return;
    }
`;
code = code.replace('await queryDB(', auditSupabase + '\n    await queryDB(');

fs.writeFileSync('src/lib/security.ts', code);
console.log('Modified src/lib/security.ts');
