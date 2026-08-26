CREATE TABLE IF NOT EXISTS `security_rate_limits` (
  `rate_key` CHAR(64) NOT NULL,
  `action_name` VARCHAR(64) NOT NULL,
  `request_count` INT UNSIGNED NOT NULL DEFAULT 1,
  `window_started_at` DATETIME NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`rate_key`, `action_name`),
  INDEX `idx_security_rate_limits_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `auth_sessions` (
  `session_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(100) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `revoked_at` DATETIME NULL,
  `ip_hash` CHAR(64) NULL,
  `user_agent_hash` CHAR(64) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_seen_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`),
  INDEX `idx_auth_sessions_user_active` (`user_id`, `revoked_at`, `expires_at`),
  INDEX `idx_auth_sessions_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `security_audit_log` (
  `id` VARCHAR(64) NOT NULL,
  `request_id` VARCHAR(128) NULL,
  `actor_user_id` VARCHAR(100) NOT NULL,
  `actor_role` VARCHAR(32) NOT NULL,
  `action_name` VARCHAR(100) NOT NULL,
  `resource_type` VARCHAR(64) NOT NULL,
  `resource_id` VARCHAR(100) NULL,
  `organization_id` VARCHAR(100) NULL,
  `outcome` ENUM('SUCCESS', 'DENIED', 'FAILED') NOT NULL DEFAULT 'SUCCESS',
  `metadata_json` JSON NULL,
  `ip_hash` CHAR(64) NULL,
  `user_agent_hash` CHAR(64) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_security_audit_actor` (`actor_user_id`, `created_at`),
  INDEX `idx_security_audit_resource` (`resource_type`, `resource_id`, `created_at`),
  INDEX `idx_security_audit_org` (`organization_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
