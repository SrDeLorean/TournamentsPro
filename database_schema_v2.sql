-- =============================================================================
-- TOURNAMENTSPRO - ESQUEMA OFICIAL DE BASE DE DATOS RELACIONAL (MySQL / MariaDB)
-- Compatible con XAMPP, phpMyAdmin, Next.js / Prisma / Node.js Backend
-- Versión 2.0 - Optimizado con índices, constraints y integridad referencial
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `tournamentspro` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `tournamentspro`;

-- -----------------------------------------------------------------------------
-- 1. TABLA: users (Atletas, Capitanes, Organizadores y Admins)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NULL, -- NULL si se registra con Google OAuth
  `google_id` VARCHAR(255) NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `gamertag` VARCHAR(50) NOT NULL UNIQUE,
  `role` ENUM('Jugador', 'Capitan', 'Organizador', 'Administrador') NOT NULL DEFAULT 'Jugador',
  `primary_game_slug` VARCHAR(50) NOT NULL DEFAULT 'eafc26',
  `platform` ENUM('PS5', 'PS4', 'XBOX', 'PC', 'CROSSPLAY') NOT NULL DEFAULT 'CROSSPLAY',
  `position` VARCHAR(30) NOT NULL DEFAULT 'DFC',
  `secondary_position` VARCHAR(30) NULL,
  `rank_badge` VARCHAR(50) NULL DEFAULT 'División 1',
  `rating` DECIMAL(3,1) NOT NULL DEFAULT 9.0,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Activo',
  `avatar_url` TEXT NULL,
  `organization_id` VARCHAR(36) NULL,
  `is_banned` TINYINT(1) NOT NULL DEFAULT 0,
  `ban_reason` TEXT NULL,
  `last_login_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_users_org` (`organization_id`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_game` (`primary_game_slug`),
  INDEX `idx_users_status` (`status`),
  INDEX `idx_users_banned` (`is_banned`),
  CONSTRAINT `fk_users_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. TABLA: organizations (Organizaciones Madre / Clubes Multidisciplina)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `organizations` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `tag` VARCHAR(10) NOT NULL UNIQUE,
  `owner_id` VARCHAR(36) NOT NULL,
  `logo_url` TEXT NULL,
  `banner_url` TEXT NULL,
  `description` TEXT NULL,
  `country` VARCHAR(50) DEFAULT 'Venezuela',
  `allowed_games` JSON NULL, -- Array de slugs de juegos permitidos
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_org_owner` (`owner_id`),
  CONSTRAINT `fk_org_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. TABLA: games (Catálogo de Disciplinas eSports y Configuración Dinámica)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `games` (
  `slug` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `team_size` INT NOT NULL DEFAULT 11,
  `max_roster_members` INT NOT NULL DEFAULT 45,
  `max_squad_cap` INT NOT NULL DEFAULT 20,
  `max_transfers_per_window` INT NOT NULL DEFAULT 3,
  `post_expiration_days` INT NOT NULL DEFAULT 7,
  `positions_json` JSON NULL,
  `brand_color` VARCHAR(20) NOT NULL DEFAULT '#00F0FF',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. TABLA: teams (Escuadras por Disciplina Específica)
-- Regla de Negocio: El nombre del equipo debe ser ÚNICO por disciplina.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `teams` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `tag` VARCHAR(10) NOT NULL,
  `game_slug` VARCHAR(50) NOT NULL,
  `organization_id` VARCHAR(36) NULL,
  `captain_id` VARCHAR(36) NOT NULL,
  `captain_name` VARCHAR(100) NOT NULL,
  `platform` ENUM('PS5', 'PS4', 'XBOX', 'PC', 'CROSSPLAY') NOT NULL DEFAULT 'CROSSPLAY',
  `members_count` INT NOT NULL DEFAULT 1,
  `max_members` INT NOT NULL DEFAULT 45,
  `color` VARCHAR(20) NOT NULL DEFAULT '#00F0FF',
  `logo_text` VARCHAR(5) NOT NULL DEFAULT 'TP',
  `description` TEXT NULL,
  `vacant_positions` JSON NULL,
  `logo_url` TEXT NULL,
  `banner_url` TEXT NULL,
  `status` VARCHAR(50) DEFAULT 'Activo',
  `club_id_ea` VARCHAR(100) NULL,
  `is_banned` TINYINT(1) NOT NULL DEFAULT 0,
  `ban_reason` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_team_name_per_game` (`name`, `game_slug`),
  INDEX `idx_teams_game` (`game_slug`),
  INDEX `idx_teams_org` (`organization_id`),
  INDEX `idx_teams_captain` (`captain_id`),
  INDEX `idx_teams_banned` (`is_banned`),
  INDEX `idx_teams_status` (`status`),
  CONSTRAINT `fk_teams_game` FOREIGN KEY (`game_slug`) REFERENCES `games` (`slug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_teams_captain` FOREIGN KEY (`captain_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_teams_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. TABLA: team_members (Integrantes de Plantilla General de Club)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `team_members` (
  `id` VARCHAR(36) NOT NULL,
  `team_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `jersey_number` INT NULL,
  `tactical_position` VARCHAR(30) NOT NULL,
  `role_in_team` ENUM('Capitan', 'Jugador', 'DT / Analyst') NOT NULL DEFAULT 'Jugador',
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_team_user` (`team_id`, `user_id`),
  INDEX `idx_tm_user` (`user_id`),
  INDEX `idx_tm_team` (`team_id`),
  CONSTRAINT `fk_tm_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_tm_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. TABLA: team_vacancies (Reclutamiento de Posiciones Abiertas)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `team_vacancies` (
  `id` VARCHAR(36) NOT NULL,
  `team_id` VARCHAR(36) NOT NULL,
  `game_slug` VARCHAR(50) NOT NULL,
  `position_required` VARCHAR(30) NOT NULL,
  `status` ENUM('ABIERTA', 'CERRADA') NOT NULL DEFAULT 'ABIERTA',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_vac_team` (`team_id`),
  INDEX `idx_vac_game` (`game_slug`),
  INDEX `idx_vac_status` (`status`),
  CONSTRAINT `fk_vac_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. TABLA: seasons (Temporadas por Organización)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `seasons` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `organization_id` VARCHAR(36) NULL,
  `start_date` DATE NULL,
  `end_date` DATE NULL,
  `status` ENUM('Planificada', 'Activa', 'Finalizada', 'Archivada') NOT NULL DEFAULT 'Planificada',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_seasons_org` (`organization_id`),
  INDEX `idx_seasons_status` (`status`),
  CONSTRAINT `fk_seasons_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. TABLA: competitions (Torneos y Competencias Oficiales)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `competitions` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `game_slug` VARCHAR(50) NOT NULL,
  `organizer_id` VARCHAR(36) NOT NULL,
  `organizer_name` VARCHAR(150) NOT NULL,
  `organization_id` VARCHAR(36) NULL,
  `season_id` VARCHAR(36) NULL,
  `prize_pool` VARCHAR(100) NULL,
  `transfer_market_mode` ENUM('ABIERTO', 'CERRADO', 'SIN_MERCADO') NOT NULL DEFAULT 'ABIERTO',
  `mode_format` VARCHAR(50) NOT NULL DEFAULT '11v11',
  `status` ENUM('Borrador', 'Activo', 'Finalizado', 'Deshabilitado') NOT NULL DEFAULT 'Borrador',
  `fecha_limite_inscripcion` DATETIME NULL,
  `fecha_inicio` DATETIME NOT NULL,
  `fecha_termino` DATETIME NULL,
  `description` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_comp_game` (`game_slug`),
  INDEX `idx_comp_organizer` (`organizer_id`),
  INDEX `idx_comp_org` (`organization_id`),
  INDEX `idx_comp_season` (`season_id`),
  INDEX `idx_comp_status` (`status`),
  INDEX `idx_comp_dates` (`fecha_inicio`, `fecha_termino`),
  CONSTRAINT `fk_comp_game` FOREIGN KEY (`game_slug`) REFERENCES `games` (`slug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_comp_organizer` FOREIGN KEY (`organizer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_comp_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_comp_season` FOREIGN KEY (`season_id`) REFERENCES `seasons` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. TABLA: competition_teams (Equipos Inscritos en una Competencia)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `competition_teams` (
  `id` VARCHAR(36) NOT NULL,
  `competition_id` VARCHAR(36) NOT NULL,
  `team_id` VARCHAR(36) NOT NULL,
  `team_name` VARCHAR(150) NOT NULL,
  `team_tag` VARCHAR(10) NULL,
  `enrolled_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('INSCRITO', 'CONFIRMADO', 'RETIRADO') NOT NULL DEFAULT 'CONFIRMADO',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_comp_team` (`competition_id`, `team_id`),
  INDEX `idx_ct_team` (`team_id`),
  INDEX `idx_ct_status` (`status`),
  CONSTRAINT `fk_ct_comp` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ct_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. TABLA: tournament_rosters (Plantilla Oficial Inscrita por Torneo Específico)
-- Regla de Negocio: Un jugador puede estar en la plantilla de Torneo A con Club X
-- y en Torneo B con Club Y sin conflicto de elegibilidad.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tournament_rosters` (
  `id` VARCHAR(36) NOT NULL,
  `tournament_id` VARCHAR(36) NOT NULL, -- competition_id
  `team_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `tactical_position` VARCHAR(30) NOT NULL,
  `roster_role` ENUM('TITULAR', 'SUPLENTE', 'RESERVA') NOT NULL DEFAULT 'TITULAR',
  `registered_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tourn_team_user` (`tournament_id`, `team_id`, `user_id`),
  INDEX `idx_tr_tourn` (`tournament_id`),
  INDEX `idx_tr_team` (`team_id`),
  INDEX `idx_tr_user` (`user_id`),
  CONSTRAINT `fk_tr_tourn` FOREIGN KEY (`tournament_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_tr_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_tr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. TABLA: matches (Partidos / Encuentros)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `matches` (
  `id` VARCHAR(64) NOT NULL,
  `tournament_id` VARCHAR(36) NOT NULL,
  `competition_id` VARCHAR(36) NOT NULL,
  `matchday_number` INT NOT NULL DEFAULT 1,
  `matchday` INT NOT NULL DEFAULT 1,
  `stage` ENUM('GROUP', 'PLAYOFF', 'FINAL') NOT NULL DEFAULT 'GROUP',
  `group_name` VARCHAR(50) NULL,
  `round_name` VARCHAR(100) NULL,
  `next_match_id` VARCHAR(64) NULL,
  `next_match_slot` ENUM('HOME', 'AWAY', 'VUELTA_TARGET') NULL,
  `home_team_id` VARCHAR(36) NULL,
  `away_team_id` VARCHAR(36) NULL,
  `team_home_id` VARCHAR(36) NULL,
  `team_away_id` VARCHAR(36) NULL,
  `home_team_name` VARCHAR(150) NOT NULL,
  `away_team_name` VARCHAR(150) NOT NULL,
  `score_home` INT NULL,
  `score_away` INT NULL,
  `reported_score_home` INT NULL,
  `reported_score_away` INT NULL,
  `winner_team_id` VARCHAR(36) NULL,
  `status` ENUM('PENDIENTE', 'EN_CURSO', 'POR_REVISAR', 'TERMINADO', 'FINALIZADO', 'CANCELADO', 'DISPUTADO') NOT NULL DEFAULT 'PENDIENTE',
  `scheduled_time` DATETIME NULL,
  `scheduled_at` DATETIME NULL,
  `proof_url` TEXT NULL,
  `reported_by_user_id` VARCHAR(36) NULL,
  `match_report_id` VARCHAR(36) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_matches_tourn` (`tournament_id`),
  INDEX `idx_matches_comp` (`competition_id`),
  INDEX `idx_matches_matchday` (`matchday_number`),
  INDEX `idx_matches_stage` (`stage`),
  INDEX `idx_matches_status` (`status`),
  INDEX `idx_matches_home` (`home_team_id`),
  INDEX `idx_matches_away` (`away_team_id`),
  INDEX `idx_matches_scheduled` (`scheduled_at`),
  INDEX `idx_matches_next` (`next_match_id`),
  CONSTRAINT `fk_matches_tourn` FOREIGN KEY (`tournament_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_matches_comp` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_matches_home` FOREIGN KEY (`home_team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_matches_away` FOREIGN KEY (`away_team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_matches_next` FOREIGN KEY (`next_match_id`) REFERENCES `matches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 12. TABLA: match_reports (Actas de Partido)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `match_reports` (
  `id` VARCHAR(36) NOT NULL,
  `match_id` VARCHAR(64) NOT NULL,
  `reported_by_user_id` VARCHAR(36) NOT NULL,
  `score_home` INT NOT NULL,
  `score_away` INT NOT NULL,
  `proof_url` TEXT NULL,
  `status` ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
  `reviewed_by` VARCHAR(36) NULL,
  `reviewed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_report_match` (`match_id`),
  INDEX `idx_report_reporter` (`reported_by_user_id`),
  INDEX `idx_report_status` (`status`),
  CONSTRAINT `fk_report_match` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_report_reporter` FOREIGN KEY (`reported_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 13. TABLA: match_player_stats (Estadísticas de Jugadores por Partido)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `match_player_stats` (
  `id` VARCHAR(36) NOT NULL,
  `match_id` VARCHAR(64) NOT NULL,
  `team_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `goals` INT NOT NULL DEFAULT 0,
  `assists` INT NOT NULL DEFAULT 0,
  `yellow_cards` INT NOT NULL DEFAULT 0,
  `red_cards` INT NOT NULL DEFAULT 0,
  `rating` DECIMAL(3,1) NOT NULL DEFAULT 6.0,
  `is_mvp` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_stats_match_user` (`match_id`, `user_id`),
  INDEX `idx_stats_match` (`match_id`),
  INDEX `idx_stats_team` (`team_id`),
  INDEX `idx_stats_user` (`user_id`),
  CONSTRAINT `fk_stats_match` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_stats_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_stats_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 14. TABLA: transfer_applications (Mercado de Traspasos & Solicitudes)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `transfer_applications` (
  `id` VARCHAR(36) NOT NULL,
  `team_id` VARCHAR(36) NOT NULL,
  `applicant_user_id` VARCHAR(36) NOT NULL,
  `game_slug` VARCHAR(50) NOT NULL,
  `position` VARCHAR(30) NOT NULL,
  `pitch_message` TEXT NULL,
  `application_type` ENUM('POSTULACION_JUGADOR', 'OFERTA_CLUB') NOT NULL DEFAULT 'POSTULACION_JUGADOR',
  `status` ENUM('PENDIENTE', 'ACEPTADO', 'RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
  `is_extraordinary` TINYINT(1) NOT NULL DEFAULT 0,
  `organizer_approval_status` ENUM('NINGUNO', 'PENDIENTE_ORGANIZADOR', 'APROBADO_ORGANIZADOR', 'RECHAZADO_ORGANIZADOR') NOT NULL DEFAULT 'NINGUNO',
  `processed_by` VARCHAR(36) NULL,
  `processed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_ta_team` (`team_id`),
  INDEX `idx_ta_user` (`applicant_user_id`),
  INDEX `idx_ta_game` (`game_slug`),
  INDEX `idx_ta_status` (`status`),
  INDEX `idx_ta_extraordinary` (`is_extraordinary`),
  INDEX `idx_ta_org_status` (`organizer_approval_status`),
  CONSTRAINT `fk_ta_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ta_user` FOREIGN KEY (`applicant_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 15. TABLA: conversations & messages (Centro de Mensajería Directa)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `conversations` (
  `id` VARCHAR(36) NOT NULL,
  `participant1_id` VARCHAR(36) NOT NULL,
  `participant2_id` VARCHAR(36) NOT NULL,
  `game_slug` VARCHAR(50) NOT NULL DEFAULT 'eafc26',
  `topic` VARCHAR(150) NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_conv_participants` (`participant1_id`, `participant2_id`, `game_slug`),
  INDEX `idx_conv_p1` (`participant1_id`),
  INDEX `idx_conv_p2` (`participant2_id`),
  INDEX `idx_conv_game` (`game_slug`),
  CONSTRAINT `fk_conv_p1` FOREIGN KEY (`participant1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_conv_p2` FOREIGN KEY (`participant2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `messages` (
  `id` VARCHAR(36) NOT NULL,
  `conversation_id` VARCHAR(36) NOT NULL,
  `sender_id` VARCHAR(36) NOT NULL,
  `text` TEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_msg_conv` (`conversation_id`),
  INDEX `idx_msg_sender` (`sender_id`),
  INDEX `idx_msg_read` (`is_read`),
  CONSTRAINT `fk_msg_conv` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_msg_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 17. TABLA: transfer_windows (Ventanas de Fichaje por Competencia)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `transfer_windows` (
  `id` VARCHAR(36) NOT NULL,
  `competition_id` VARCHAR(36) NOT NULL,
  `status` ENUM('ABIERTO', 'CERRADO', 'EXTRAORDINARIO') NOT NULL DEFAULT 'ABIERTO',
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_tw_comp` (`competition_id`),
  INDEX `idx_tw_status` (`status`),
  CONSTRAINT `fk_tw_comp` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 18. TABLA: transfer_offers (Ofertas de Contrato & Postulaciones)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `transfer_offers` (
  `id` VARCHAR(36) NOT NULL,
  `game_slug` VARCHAR(50) NOT NULL,
  `team_id` VARCHAR(36) NOT NULL,
  `player_user_id` VARCHAR(36) NOT NULL,
  `offered_by_user_id` VARCHAR(36) NOT NULL,
  `position` VARCHAR(50) NOT NULL,
  `pitch_message` TEXT NULL,
  `offer_type` ENUM('OFERTA_CLUB', 'POSTULACION_JUGADOR') NOT NULL DEFAULT 'OFERTA_CLUB',
  `status` ENUM('PENDIENTE', 'ACEPTADO', 'RECHAZADO', 'CANCELADO', 'EXPIRADO') NOT NULL DEFAULT 'PENDIENTE',
  `is_extraordinary` TINYINT(1) NOT NULL DEFAULT 0,
  `organizer_approval_status` ENUM('NINGUNO', 'PENDIENTE_ORGANIZADOR', 'APROBADO_ORGANIZADOR', 'RECHAZADO_ORGANIZADOR') NOT NULL DEFAULT 'NINGUNO',
  `rejection_reason` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_to_team` (`team_id`),
  INDEX `idx_to_player` (`player_user_id`),
  INDEX `idx_to_status` (`status`),
  INDEX `idx_to_org_status` (`organizer_approval_status`),
  CONSTRAINT `fk_to_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_to_player` FOREIGN KEY (`player_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 19. TABLA: transfer_history_logs (Historial de Fichajes para Auditoría)
-- -----------------------------------------------------------------------------
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
  INDEX `idx_thl_player` (`player_user_id`),
  INDEX `idx_thl_org` (`organization_id`),
  INDEX `idx_thl_to_team` (`to_team_id`),
  CONSTRAINT `fk_thl_player` FOREIGN KEY (`player_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_thl_to_team` FOREIGN KEY (`to_team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 20. TABLA: transfer_market_posts (Publicaciones del Mercado de Traspasos)
-- -----------------------------------------------------------------------------
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
  INDEX `idx_tmp_expires` (`expires_at`),
  CONSTRAINT `fk_tmp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 19. TABLA: chat_threads (Hilos de Conversación eSports)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 20. TABLA: chat_messages (Mensajes de Conversación)
-- -----------------------------------------------------------------------------
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
  INDEX `idx_cm_sender` (`sender_id`),
  CONSTRAINT `fk_cm_thread` FOREIGN KEY (`thread_id`) REFERENCES `chat_threads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- INSERCIÓN DE DATOS INICIALES REALES
-- =============================================================================

INSERT INTO `games` (`slug`, `name`, `category`, `team_size`, `max_roster_members`, `max_squad_cap`, `max_transfers_per_window`, `post_expiration_days`, `positions_json`, `brand_color`) VALUES
('eafc26', 'EA SPORTS FC 26', 'Deportes', 11, 45, 20, 3, 7, '["POR", "DFC", "LD", "LI", "MCD", "MC", "MCO", "EI", "ED", "DC"]', '#00F0FF'),
('valorant', 'VALORANT', 'FPS Tactical', 5, 7, 7, 3, 7, '["Duelista", "Controlador", "Iniciador", "Centinela"]', '#FF4655'),
('csgo', 'Counter-Strike 2', 'FPS Tactical', 5, 7, 7, 3, 7, '["AWPer", "Entry Fragger", "IGL", "Support", "Lurker"]', '#F59E0B'),
('lol', 'League of Legends', 'MOBA', 5, 7, 7, 3, 7, '["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"]', '#C084FC'),
('rocketleague', 'Rocket League', 'Vehicular', 3, 4, 7, 3, 7, '["Delantero", "Defensa", "Rotador Global"]', '#38BDF8'),
('fortnite', 'Fortnite', 'Battle Royale', 4, 6, 7, 3, 7, '["IGL", "Fragger", "Support", "Anchor"]', '#FACC15')
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `category` = VALUES(`category`),
  `max_squad_cap` = VALUES(`max_squad_cap`),
  `max_transfers_per_window` = VALUES(`max_transfers_per_window`),
  `post_expiration_days` = VALUES(`post_expiration_days`),
  `positions_json` = VALUES(`positions_json`),
  `brand_color` = VALUES(`brand_color`);

-- 🔑 USUARIOS INICIALES (Clave: 123456 - bcrypt hash: $2a$12$...)
INSERT INTO `users` (`id`, `email`, `password_hash`, `name`, `gamertag`, `role`, `primary_game_slug`, `position`, `rating`, `status`, `organization_id`) VALUES
('usr-admin', 'admin@tournamentspro.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', 'Administrador Principal', 'Admin_Pro', 'Administrador', 'eafc26', 'ADMIN', 10.0, 'Organizador', NULL),
('usr-organizer', 'organizador@tournamentspro.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', 'Organizador Oficial', 'Organizador_Pro', 'Organizador', 'eafc26', 'ORGANIZADOR', 10.0, 'Organizador', NULL)
ON DUPLICATE KEY UPDATE 
  `password_hash` = VALUES(`password_hash`),
  `name` = VALUES(`name`),
  `role` = VALUES(`role`);

-- Organización inicial
INSERT INTO `organizations` (`id`, `name`, `tag`, `owner_id`, `country`, `allowed_games`) VALUES
('org-main', 'TournamentsPro Official', 'TPRO', 'usr-organizer', 'Venezuela', '["eafc26", "valorant", "csgo", "lol", "rocketleague", "fortnite"]')
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `owner_id` = VALUES(`owner_id`),
  `allowed_games` = VALUES(`allowed_games`);

-- Actualizar usuarios con organization_id
UPDATE `users` SET `organization_id` = 'org-main' WHERE `id` IN ('usr-admin', 'usr-organizer');