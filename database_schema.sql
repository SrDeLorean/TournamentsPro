-- =============================================================================
-- TOURNAMENTSPRO - ESQUEMA OFICIAL DE BASE DE DATOS RELACIONAL (MySQL / MariaDB)
-- Compatible con XAMPP, phpMyAdmin, Next.js / Prisma / Node.js Backend
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
  `position` VARCHAR(30) NOT NULL DEFAULT 'DFC', -- FC26: DFC/DC, CS2: AWPer, LoL: MID, etc.
  `secondary_position` VARCHAR(30) NULL,
  `rank_badge` VARCHAR(50) NULL DEFAULT 'División 1', -- ej. Radiante, Level 10 Faceit
  `rating` DECIMAL(3,1) NOT NULL DEFAULT 9.0,
  `status` ENUM('Buscando Club', 'En Escuadra', 'Organizador') NOT NULL DEFAULT 'Buscando Club',
  `avatar_url` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. TABLA: organizaciones (Organizaciones Madre / Clubes Multidisciplina)
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
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_organizations_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. TABLA: games (Catálogo de Disciplinas eSports)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `games` (
  `slug` VARCHAR(50) NOT NULL, -- ej. eafc26, valorant, csgo, lol, rocketleague
  `name` VARCHAR(100) NOT NULL,
  `category` VARCHAR(50) NOT NULL, -- Deportes, FPS Tactical, MOBA, Vehicular
  `team_size` INT NOT NULL DEFAULT 11,
  `max_roster_members` INT NOT NULL DEFAULT 45,
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
  `vacant_positions` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_team_name_per_game` (`name`, `game_slug`), -- 🛡️ Unicidad por disciplina
  CONSTRAINT `fk_teams_game` FOREIGN KEY (`game_slug`) REFERENCES `games` (`slug`) ON DELETE CASCADE,
  CONSTRAINT `fk_teams_captain` FOREIGN KEY (`captain_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_teams_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL
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
  CONSTRAINT `fk_tm_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tm_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
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
  CONSTRAINT `fk_vac_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. TABLA: tournaments (Torneos y Competencias Oficiales)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tournaments` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `game_slug` VARCHAR(50) NOT NULL,
  `organizer_id` VARCHAR(36) NOT NULL,
  `format` ENUM('11v11', '5v5', '3v3', 'Liga 1v1', 'Eliminatoria Directa') NOT NULL DEFAULT '11v11',
  `max_teams` INT NOT NULL DEFAULT 16,
  `registered_teams_count` INT NOT NULL DEFAULT 0,
  `status` ENUM('RECLUTAMIENTO', 'EN_CURSO', 'FINALIZADO') NOT NULL DEFAULT 'RECLUTAMIENTO',
  `prize_pool` VARCHAR(100) NULL,
  `start_date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_tourn_game` FOREIGN KEY (`game_slug`) REFERENCES `games` (`slug`) ON DELETE CASCADE,
  CONSTRAINT `fk_tourn_organizer` FOREIGN KEY (`organizer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. TABLA: tournament_teams (Equipos Inscritos en un Torneo)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tournament_teams` (
  `id` VARCHAR(36) NOT NULL,
  `tournament_id` VARCHAR(36) NOT NULL,
  `team_id` VARCHAR(36) NOT NULL,
  `registration_status` ENUM('ACEPTADO', 'PENDIENTE', 'RECHAZADO') NOT NULL DEFAULT 'ACEPTADO',
  `registered_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tourn_team` (`tournament_id`, `team_id`),
  CONSTRAINT `fk_tt_tourn` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tt_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. TABLA: tournament_rosters (Plantilla Oficial Inscrita por Torneo Específico)
-- Regla de Negocio: Un jugador puede estar en la plantilla de Torneo A con Club X
-- y en Torneo B con Club Y sin conflicto de elegibilidad.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tournament_rosters` (
  `id` VARCHAR(36) NOT NULL,
  `tournament_id` VARCHAR(36) NOT NULL,
  `team_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `tactical_position` VARCHAR(30) NOT NULL,
  `roster_role` ENUM('TITULAR', 'SUPLENTE', 'RESERVA') NOT NULL DEFAULT 'TITULAR',
  `registered_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tourn_team_user` (`tournament_id`, `team_id`, `user_id`),
  CONSTRAINT `fk_tr_tourn` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tr_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. TABLA: transfer_applications (Mercado de Traspasos & Solicitudes)
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
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_trans_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_trans_user` FOREIGN KEY (`applicant_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. TABLA: conversations & messages (Centro de Mensajería Directa)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `conversations` (
  `id` VARCHAR(36) NOT NULL,
  `participant1_id` VARCHAR(36) NOT NULL,
  `participant2_id` VARCHAR(36) NOT NULL,
  `game_slug` VARCHAR(50) NOT NULL DEFAULT 'eafc26',
  `topic` VARCHAR(150) NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_conv_p1` FOREIGN KEY (`participant1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_conv_p2` FOREIGN KEY (`participant2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `messages` (
  `id` VARCHAR(36) NOT NULL,
  `conversation_id` VARCHAR(36) NOT NULL,
  `sender_id` VARCHAR(36) NOT NULL,
  `text` TEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_msg_conv` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_msg_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- INSERCIÓN DE DATOS INICIALES REALES (LIMPIEZA DE DATOS FABRICADOS)
-- Se configuran ÚNICAMENTE los 2 usuarios principales requeridos.
-- =============================================================================

INSERT INTO `games` (`slug`, `name`, `category`, `team_size`, `max_roster_members`, `brand_color`) VALUES
('eafc26', 'EA SPORTS FC 26', 'Deportes', 11, 45, '#00F0FF'),
('valorant', 'VALORANT', 'FPS Tactical', 5, 7, '#FF4655'),
('csgo', 'Counter-Strike 2', 'FPS Tactical', 5, 7, '#F59E0B'),
('lol', 'League of Legends', 'MOBA', 5, 7, '#C084FC'),
('rocketleague', 'Rocket League', 'Vehicular', 3, 4, '#38BDF8');

-- 🔑 ÚNICOS 2 USUARIOS DEL SISTEMA (Clave: 123456)
INSERT INTO `users` (`id`, `email`, `password_hash`, `name`, `gamertag`, `role`, `primary_game_slug`, `position`, `rating`, `status`) VALUES
('usr-admin', 'admin@tournamentspro.com', '123456', 'Administrador Principal', 'Admin_Pro', 'Administrador', 'eafc26', 'ADMIN', 10.0, 'Organizador'),
('usr-organizer', 'organizador@tournamentspro.com', '123456', 'Organizador Oficial', 'Organizador_Pro', 'Organizador', 'eafc26', 'ORGANIZADOR', 10.0, 'Organizador');

