-- Consolida el DDL que antes se ejecutaba durante requests.
-- Las cláusulas IF NOT EXISTS permiten reanudar esta migración tras un fallo parcial.

ALTER TABLE `games`
  ADD COLUMN IF NOT EXISTS `max_squad_cap` INT NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS `max_transfers_per_window` INT NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS `post_expiration_days` INT NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS `positions_json` JSON NULL;

ALTER TABLE `users`
  MODIFY COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'Activo';

CREATE TABLE IF NOT EXISTS `transfer_market_posts` (
  `id` VARCHAR(36) NOT NULL,
  `game_slug` VARCHAR(50) NOT NULL,
  `type` ENUM('JUGADOR_BUSCA_CLUB', 'CLUB_RECLUTA_JUGADOR') NOT NULL DEFAULT 'JUGADOR_BUSCA_CLUB',
  `user_id` VARCHAR(36) NOT NULL,
  `user_name` VARCHAR(100) NOT NULL,
  `user_gamertag` VARCHAR(50) NOT NULL,
  `team_id` VARCHAR(36) NULL,
  `team_name` VARCHAR(100) NULL,
  `position` VARCHAR(50) NOT NULL,
  `platform` VARCHAR(30) NOT NULL DEFAULT 'CROSSPLAY',
  `status` ENUM('ACTIVO', 'COMPLETADO', 'CADUCADO') NOT NULL DEFAULT 'ACTIVO',
  `message` TEXT NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_tmp_game` (`game_slug`),
  INDEX `idx_tmp_type` (`type`),
  INDEX `idx_tmp_user` (`user_id`),
  INDEX `idx_tmp_status` (`status`),
  INDEX `idx_tmp_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `transfer_history_logs` (
  `id` VARCHAR(36) NOT NULL,
  `game_slug` VARCHAR(50) NOT NULL,
  `organization_id` VARCHAR(36) NULL,
  `player_user_id` VARCHAR(36) NOT NULL,
  `from_team_id` VARCHAR(36) NULL,
  `from_team_name` VARCHAR(100) NULL,
  `to_team_id` VARCHAR(36) NOT NULL,
  `to_team_name` VARCHAR(100) NOT NULL,
  `approved_by_user_id` VARCHAR(36) NOT NULL,
  `transfer_type` ENUM('LIBRE', 'TRASPASO_DIRECTO', 'EXTRAORDINARIO') NOT NULL DEFAULT 'LIBRE',
  `signed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_thl_game` (`game_slug`),
  INDEX `idx_thl_player` (`player_user_id`),
  INDEX `idx_thl_org` (`organization_id`),
  INDEX `idx_thl_to_team` (`to_team_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `transfer_offers` (
  `id` VARCHAR(36) NOT NULL,
  `game_slug` VARCHAR(50) NOT NULL,
  `team_id` VARCHAR(36) NOT NULL,
  `player_user_id` VARCHAR(36) NOT NULL,
  `offered_by_user_id` VARCHAR(36) NOT NULL,
  `position` VARCHAR(50) NOT NULL,
  `pitch_message` TEXT NULL,
  `offer_type` ENUM('OFERTA_CLUB', 'POSTULACION_JUGADOR') NOT NULL DEFAULT 'OFERTA_CLUB',
  `status` ENUM('PENDIENTE', 'ACEPTADO', 'RECHAZADO', 'CANCELADO', 'EXPIRADO', 'CONCLUIDO') NOT NULL DEFAULT 'PENDIENTE',
  `is_extraordinary` TINYINT(1) NOT NULL DEFAULT 0,
  `organizer_approval_status` ENUM('NINGUNO', 'PENDIENTE_ORGANIZADOR', 'APROBADO_ORGANIZADOR', 'RECHAZADO_ORGANIZADOR') NOT NULL DEFAULT 'NINGUNO',
  `rejection_reason` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_to_team` (`team_id`),
  INDEX `idx_to_player` (`player_user_id`),
  INDEX `idx_to_status` (`status`),
  INDEX `idx_to_org_status` (`organizer_approval_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `chat_threads` (
  `id` VARCHAR(36) NOT NULL,
  `channel_type` ENUM('DIRECTO', 'SQUAD_EQUIPO', 'SOPORTE_ORGANIZADOR', 'ANUNCIO_ADMIN') NOT NULL DEFAULT 'DIRECTO',
  `game_slug` VARCHAR(50) NOT NULL DEFAULT 'eafc26',
  `title` VARCHAR(150) NULL,
  `participant_a_id` VARCHAR(36) NOT NULL,
  `participant_a_name` VARCHAR(100) NOT NULL,
  `participant_a_role` VARCHAR(50) NOT NULL DEFAULT 'Jugador',
  `participant_b_id` VARCHAR(36) NOT NULL,
  `participant_b_name` VARCHAR(100) NOT NULL,
  `participant_b_role` VARCHAR(50) NOT NULL DEFAULT 'Jugador',
  `last_message_text` TEXT NULL,
  `last_message_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_ct_part_a` (`participant_a_id`),
  INDEX `idx_ct_part_b` (`participant_b_id`),
  INDEX `idx_ct_channel` (`channel_type`),
  INDEX `idx_ct_game` (`game_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` VARCHAR(36) NOT NULL,
  `thread_id` VARCHAR(36) NOT NULL,
  `sender_id` VARCHAR(36) NOT NULL,
  `sender_name` VARCHAR(100) NOT NULL,
  `sender_role` VARCHAR(50) NOT NULL DEFAULT 'Jugador',
  `message_text` TEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_cm_thread` (`thread_id`),
  INDEX `idx_cm_sender` (`sender_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `chat_typing_status` (
  `thread_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `user_name` VARCHAR(100) NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`thread_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `chat_threads` (
  `id`, `channel_type`, `game_slug`, `title`,
  `participant_a_id`, `participant_a_name`, `participant_a_role`,
  `participant_b_id`, `participant_b_name`, `participant_b_role`, `last_message_text`
) VALUES
  ('ct-org-support', 'SOPORTE_ORGANIZADOR', 'eafc26', 'Canal Oficial de Organizadores & Arbitraje', 'usr-organizer', 'Organizador Oficial', 'Organizador', 'usr-all', 'Comunidad eSports', 'Jugador', 'Mesa de ayuda directa habilitada para consultas de torneo y reporte de partidos.'),
  ('ct-admin-broadcast', 'ANUNCIO_ADMIN', 'eafc26', 'Anuncios Globales de Administración', 'usr-admin', 'Administrador Principal', 'Administrador', 'usr-all', 'Comunidad eSports', 'Jugador', 'Canal oficial de boletines, comunicados de sanciones y actualizaciones del sistema.')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);

INSERT INTO `chat_messages` (`id`, `thread_id`, `sender_id`, `sender_name`, `sender_role`, `message_text`) VALUES
  ('cm-org-1', 'ct-org-support', 'usr-organizer', 'Organizador Oficial', 'Organizador', 'Bienvenidos al canal de arbitraje y soporte técnico. Escribe tu consulta o disputa de partido aquí.'),
  ('cm-adm-1', 'ct-admin-broadcast', 'usr-admin', 'Administrador Principal', 'Administrador', 'Comunidad TournamentsPro: el mercado de traspasos y los reglamentos de temporada están activos.')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);
