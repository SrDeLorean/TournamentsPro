
-- -----------------------------------------------------------------------------
-- 23. TABLA: security_rate_limits (Rate Limiting)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS security_rate_limits (
  rate_key TEXT NOT NULL,
  action_name TEXT NOT NULL,
  request_count INT NOT NULL DEFAULT 1,
  window_started_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (rate_key, action_name)
);
CREATE INDEX idx_security_rate_limits_expires ON security_rate_limits (expires_at);

-- -----------------------------------------------------------------------------
-- 24. TABLA: auth_sessions (Control de Sesiones de Usuarios)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_sessions (
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NULL,
  ip_hash TEXT NULL,
  user_agent_hash TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (session_id)
);
CREATE INDEX idx_auth_sessions_user_active ON auth_sessions (user_id, revoked_at, expires_at);
CREATE INDEX idx_auth_sessions_expires ON auth_sessions (expires_at);

-- -----------------------------------------------------------------------------
-- 25. TABLA: security_audit_log (Registro de Auditoría de Seguridad)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS security_audit_log (
  id TEXT NOT NULL,
  request_id TEXT NULL,
  actor_user_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action_name TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NULL,
  organization_id TEXT NULL,
  outcome TEXT NOT NULL DEFAULT 'SUCCESS' CHECK (outcome IN ('SUCCESS', 'DENIED', 'FAILED')),
  metadata_json JSONB NULL,
  ip_hash TEXT NULL,
  user_agent_hash TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);
CREATE INDEX idx_security_audit_actor ON security_audit_log (actor_user_id, created_at);
CREATE INDEX idx_security_audit_resource ON security_audit_log (resource_type, resource_id, created_at);
CREATE INDEX idx_security_audit_org ON security_audit_log (organization_id, created_at);
