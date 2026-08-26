-- Baseline canónico para instalaciones nuevas de TournamentsPro.
-- Se ejecuta dentro de la base seleccionada por DB_NAME; nunca crea ni selecciona otra base.

CREATE TABLE `games` (
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

-- users y organizations son un ciclo lógico. Sus tablas se crean primero y la FK
-- users.organization_id se agrega cuando ambos extremos ya existen.
CREATE TABLE `users` (
  `id` VARCHAR(36) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(255) NULL,
  `google_id` VARCHAR(255) NULL,
  `name` VARCHAR(100) NOT NULL,
  `gamertag` VARCHAR(50) NOT NULL,
  `role` ENUM('Jugador', 'Capitan', 'Capitán', 'Organizador', 'Administrador') NOT NULL DEFAULT 'Jugador',
  `primary_game_slug` VARCHAR(50) NOT NULL DEFAULT 'eafc26',
  `platform` ENUM('PS5', 'PS4', 'XBOX', 'PC', 'CROSSPLAY') NOT NULL DEFAULT 'CROSSPLAY',
  `position` VARCHAR(30) NOT NULL DEFAULT 'DFC',
  `secondary_position` VARCHAR(30) NULL,
  `rank_badge` VARCHAR(50) NULL DEFAULT 'División 1',
  `rating` DECIMAL(3,1) NOT NULL DEFAULT 9.0,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Activo',
  `avatar_url` TEXT NULL,
  `foto` TEXT NULL,
  `banner_url` TEXT NULL,
  `biografia` TEXT NULL,
  `bio` TEXT NULL,
  `country` VARCHAR(80) NULL,
  `birth_date` DATE NULL,
  `phone` VARCHAR(50) NULL,
  `instagram` VARCHAR(255) NULL,
  `facebook` VARCHAR(255) NULL,
  `twitch` VARCHAR(255) NULL,
  `youtube` VARCHAR(255) NULL,
  `tiktok` VARCHAR(255) NULL,
  `discord` VARCHAR(255) NULL,
  `twitter` VARCHAR(255) NULL,
  `website` TEXT NULL,
  `whatsapp` VARCHAR(100) NULL,
  `game_profiles` JSON NULL,
  `organization_id` VARCHAR(36) NULL,
  `is_banned` TINYINT(1) NOT NULL DEFAULT 0,
  `ban_reason` TEXT NULL,
  `banned_at` DATETIME NULL,
  `last_login_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`),
  UNIQUE KEY `uk_users_google` (`google_id`),
  UNIQUE KEY `uk_users_gamertag` (`gamertag`),
  INDEX `idx_users_org` (`organization_id`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_game` (`primary_game_slug`),
  INDEX `idx_users_status` (`status`),
  INDEX `idx_users_banned` (`is_banned`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `organizations` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `tag` VARCHAR(10) NOT NULL,
  `owner_id` VARCHAR(36) NOT NULL,
  `logo_url` TEXT NULL,
  `banner_url` TEXT NULL,
  `description` TEXT NULL,
  `country` VARCHAR(50) DEFAULT 'Venezuela',
  `allowed_games` JSON NULL,
  `founded_year` VARCHAR(4) NULL,
  `rating` DECIMAL(3,2) NOT NULL DEFAULT 4.95,
  `website` TEXT NULL,
  `redes_sociales` JSON NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'Activa',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_organizations_name` (`name`),
  UNIQUE KEY `uk_organizations_tag` (`tag`),
  INDEX `idx_org_owner` (`owner_id`),
  CONSTRAINT `fk_org_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `teams` (
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
  `redes_sociales` JSON NULL,
  `encargados_json` JSON NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Activo',
  `club_id_ea` VARCHAR(100) NULL,
  `is_banned` TINYINT(1) NOT NULL DEFAULT 0,
  `ban_reason` TEXT NULL,
  `banned_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_team_name_per_game` (`name`, `game_slug`),
  INDEX `idx_teams_game` (`game_slug`),
  INDEX `idx_teams_org` (`organization_id`),
  INDEX `idx_teams_captain` (`captain_id`),
  INDEX `idx_teams_status` (`status`),
  CONSTRAINT `fk_teams_game` FOREIGN KEY (`game_slug`) REFERENCES `games` (`slug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_teams_captain` FOREIGN KEY (`captain_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_teams_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `team_members` (
  `id` VARCHAR(36) NOT NULL,
  `team_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `organization_name` VARCHAR(150) NULL,
  `jersey_number` INT NULL,
  `tactical_position` VARCHAR(30) NOT NULL,
  `role_in_team` ENUM('Capitan', 'Capitán', 'Encargado', 'Jugador', 'DT / Analyst', 'Manager', 'Co-Capitán') NOT NULL DEFAULT 'Jugador',
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_team_user` (`team_id`, `user_id`),
  INDEX `idx_tm_user` (`user_id`),
  INDEX `idx_tm_team` (`team_id`),
  CONSTRAINT `fk_tm_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_tm_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `team_vacancies` (
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

CREATE TABLE `seasons` (
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

CREATE TABLE `competitions` (
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
  `format` VARCHAR(30) NULL,
  `match_mode` ENUM('PartidoUnico', 'IdaVuelta') NOT NULL DEFAULT 'PartidoUnico',
  `group_count` INT NOT NULL DEFAULT 1,
  `qualifiers_per_group` INT NOT NULL DEFAULT 2,
  `status` VARCHAR(30) NOT NULL DEFAULT 'Borrador',
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
  CONSTRAINT `fk_comp_game` FOREIGN KEY (`game_slug`) REFERENCES `games` (`slug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_comp_organizer` FOREIGN KEY (`organizer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_comp_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_comp_season` FOREIGN KEY (`season_id`) REFERENCES `seasons` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `competition_teams` (
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
  CONSTRAINT `fk_ct_comp` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ct_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tournament_rosters` (
  `id` VARCHAR(36) NOT NULL,
  `tournament_id` VARCHAR(36) NOT NULL,
  `team_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `tactical_position` VARCHAR(30) NOT NULL,
  `roster_role` ENUM('TITULAR', 'SUPLENTE', 'RESERVA') NOT NULL DEFAULT 'TITULAR',
  `registered_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tourn_team_user` (`tournament_id`, `team_id`, `user_id`),
  CONSTRAINT `fk_tr_tourn` FOREIGN KEY (`tournament_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_tr_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_tr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `matches` (
  `id` VARCHAR(64) NOT NULL,
  `tournament_id` VARCHAR(36) NOT NULL,
  `competition_id` VARCHAR(36) NOT NULL,
  `round` INT NULL,
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
  `home_team_tag` VARCHAR(10) NULL,
  `away_team_name` VARCHAR(150) NOT NULL,
  `away_team_tag` VARCHAR(10) NULL,
  `score_home` INT NULL,
  `score_away` INT NULL,
  `reported_score_home` INT NULL,
  `reported_score_away` INT NULL,
  `winner_team_id` VARCHAR(36) NULL,
  `status` ENUM('PROGRAMADO', 'PENDIENTE', 'EN_CURSO', 'POR_REVISAR', 'TERMINADO', 'FINALIZADO', 'CANCELADO', 'DISPUTADO') NOT NULL DEFAULT 'PENDIENTE',
  `scheduled_time` TIME NULL,
  `scheduled_at` DATETIME NULL,
  `proof_url` TEXT NULL,
  `reported_by_user_id` VARCHAR(36) NULL,
  `match_report_id` VARCHAR(36) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_matches_tourn` (`tournament_id`),
  INDEX `idx_matches_comp_status` (`competition_id`, `status`),
  INDEX `idx_matches_next` (`next_match_id`),
  CONSTRAINT `fk_matches_tourn` FOREIGN KEY (`tournament_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_matches_comp` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_matches_home` FOREIGN KEY (`home_team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_matches_away` FOREIGN KEY (`away_team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `matches`
  ADD CONSTRAINT `fk_matches_next` FOREIGN KEY (`next_match_id`) REFERENCES `matches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `match_reports` (
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
  CONSTRAINT `fk_report_match` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_report_reporter` FOREIGN KEY (`reported_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `match_player_stats` (
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
  CONSTRAINT `fk_stats_match` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_stats_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_stats_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `transfer_applications` (
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
  INDEX `idx_ta_process_state` (`id`, `status`, `organizer_approval_status`),
  INDEX `idx_ta_team` (`team_id`),
  INDEX `idx_ta_user` (`applicant_user_id`),
  CONSTRAINT `fk_ta_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ta_user` FOREIGN KEY (`applicant_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `conversations` (
  `id` VARCHAR(36) NOT NULL,
  `participant1_id` VARCHAR(36) NOT NULL,
  `participant2_id` VARCHAR(36) NOT NULL,
  `game_slug` VARCHAR(50) NOT NULL DEFAULT 'eafc26',
  `topic` VARCHAR(150) NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_conv_participants` (`participant1_id`, `participant2_id`, `game_slug`),
  CONSTRAINT `fk_conv_p1` FOREIGN KEY (`participant1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_conv_p2` FOREIGN KEY (`participant2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `messages` (
  `id` VARCHAR(36) NOT NULL,
  `conversation_id` VARCHAR(36) NOT NULL,
  `sender_id` VARCHAR(36) NOT NULL,
  `text` TEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_msg_conv` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_msg_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `transfer_windows` (
  `id` VARCHAR(36) NOT NULL,
  `competition_id` VARCHAR(36) NOT NULL,
  `status` ENUM('ABIERTO', 'CERRADO', 'EXTRAORDINARIO') NOT NULL DEFAULT 'ABIERTO',
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_tw_comp` FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `transfer_offers` (
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
  INDEX `idx_to_player_status` (`player_user_id`, `status`),
  INDEX `idx_to_team_status` (`team_id`, `status`),
  CONSTRAINT `fk_to_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_to_player` FOREIGN KEY (`player_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `transfer_history_logs` (
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
  CONSTRAINT `fk_thl_player` FOREIGN KEY (`player_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_thl_to_team` FOREIGN KEY (`to_team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `transfer_market_posts` (
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

CREATE TABLE `chat_threads` (
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

CREATE TABLE `chat_messages` (
  `id` VARCHAR(36) NOT NULL,
  `thread_id` VARCHAR(36) NOT NULL,
  `sender_id` VARCHAR(36) NOT NULL,
  `sender_name` VARCHAR(100) NOT NULL,
  `sender_role` VARCHAR(50) NOT NULL DEFAULT 'Jugador',
  `message_text` TEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_cm_sender` (`sender_id`),
  CONSTRAINT `fk_cm_thread` FOREIGN KEY (`thread_id`) REFERENCES `chat_threads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `chat_typing_status` (
  `thread_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `user_name` VARCHAR(100) NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`thread_id`, `user_id`),
  CONSTRAINT `fk_typing_thread` FOREIGN KEY (`thread_id`) REFERENCES `chat_threads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `security_rate_limits` (
  `rate_key` CHAR(64) NOT NULL,
  `action_name` VARCHAR(64) NOT NULL,
  `request_count` INT UNSIGNED NOT NULL DEFAULT 1,
  `window_started_at` DATETIME NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`rate_key`, `action_name`),
  INDEX `idx_security_rate_limits_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `auth_sessions` (
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

CREATE TABLE `security_audit_log` (
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

INSERT INTO `games` (`slug`, `name`, `category`, `team_size`, `max_roster_members`, `max_squad_cap`, `max_transfers_per_window`, `post_expiration_days`, `positions_json`, `brand_color`) VALUES
  ('eafc26', 'EA SPORTS FC 26', 'Deportes', 11, 45, 20, 3, 7, '["POR", "DFC", "LD", "LI", "MCD", "MC", "MCO", "EI", "ED", "DC"]', '#00F0FF'),
  ('valorant', 'VALORANT', 'FPS Tactical', 5, 7, 7, 3, 7, '["Duelista", "Controlador", "Iniciador", "Centinela"]', '#FF4655'),
  ('csgo', 'Counter-Strike 2', 'FPS Tactical', 5, 7, 7, 3, 7, '["AWPer", "Entry Fragger", "IGL", "Support", "Lurker"]', '#F59E0B'),
  ('lol', 'League of Legends', 'MOBA', 5, 7, 7, 3, 7, '["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"]', '#C084FC'),
  ('rocketleague', 'Rocket League', 'Vehicular', 3, 4, 7, 3, 7, '["Delantero", "Defensa", "Rotador Global"]', '#38BDF8'),
  ('fortnite', 'Fortnite', 'Battle Royale', 4, 6, 7, 3, 7, '["IGL", "Fragger", "Support", "Anchor"]', '#FACC15');

INSERT INTO `chat_threads` (
  `id`, `channel_type`, `game_slug`, `title`, `participant_a_id`, `participant_a_name`, `participant_a_role`,
  `participant_b_id`, `participant_b_name`, `participant_b_role`, `last_message_text`
) VALUES
  ('ct-org-support', 'SOPORTE_ORGANIZADOR', 'eafc26', 'Canal Oficial de Organizadores & Arbitraje', 'usr-organizer', 'Organizador Oficial', 'Organizador', 'usr-all', 'Comunidad eSports', 'Jugador', 'Mesa de ayuda directa habilitada para consultas de torneo y reporte de partidos.'),
  ('ct-admin-broadcast', 'ANUNCIO_ADMIN', 'eafc26', 'Anuncios Globales de Administración', 'usr-admin', 'Administrador Principal', 'Administrador', 'usr-all', 'Comunidad eSports', 'Jugador', 'Canal oficial de boletines, comunicados de sanciones y actualizaciones del sistema.');

INSERT INTO `chat_messages` (`id`, `thread_id`, `sender_id`, `sender_name`, `sender_role`, `message_text`) VALUES
  ('cm-org-1', 'ct-org-support', 'usr-organizer', 'Organizador Oficial', 'Organizador', 'Bienvenidos al canal de arbitraje y soporte técnico. Escribe tu consulta o disputa de partido aquí.'),
  ('cm-adm-1', 'ct-admin-broadcast', 'usr-admin', 'Administrador Principal', 'Administrador', 'Comunidad TournamentsPro: el mercado de traspasos y los reglamentos de temporada están activos.');
